const DEFAULT_TEAMS = [
  { name: "Real Madrid", pot: 1 },
  { name: "Manchester City", pot: 1 },
  { name: "Paris Saint-Germain", pot: 1 },
  { name: "Bayern Munich", pot: 1 },
  { name: "Inter Milan", pot: 1 },
  { name: "Arsenal", pot: 1 },
  { name: "Barcelona", pot: 1 },
  { name: "Liverpool", pot: 1 },
  { name: "Chelsea", pot: 1 },

  { name: "Manchester United", pot: 2 },
  { name: "Borussia Dortmund", pot: 2 },
  { name: "Porto", pot: 2 },
  { name: "Aston Villa", pot: 2 },
  { name: "Bayer Leverkusen", pot: 2 },
  { name: "Napoli", pot: 2 },
  { name: "Benfica", pot: 2 },
  { name: "Atletico Madrid", pot: 2 },
  { name: "Real Betis", pot: 2 },

  { name: "Feyenoord", pot: 3 },
  { name: "RB Leipzig", pot: 3 },
  { name: "Shakhtar Donetsk", pot: 3 },
  { name: "Galatasaray", pot: 3 },
  { name: "Villarreal", pot: 3 },
  { name: "Lille", pot: 3 },
  { name: "Sporting CP", pot: 3 },
  { name: "AC Milan", pot: 3 },
  { name: "Juventus", pot: 3 },

  { name: "RB Salzburg", pot: 4 },
  { name: "Celtic", pot: 4 },
  { name: "Olympiacos", pot: 4 },
  { name: "Dinamo Zagreb", pot: 4 },
  { name: "Union Berlin", pot: 4 },
  { name: "Stuttgart", pot: 4 },
  { name: "Lazio", pot: 4 },
  { name: "Roma", pot: 4 },
  { name: "Braga", pot: 4 }
];

const MATCHDAYS = 8;
const POT_NUMBERS = [1, 2, 3, 4];

let teams = loadTeams();
let fixtures = [];

function loadTeams() {
  try {
    const saved = JSON.parse(localStorage.getItem("ucl_teams"));
    if (Array.isArray(saved) && saved.length === 36) {
      return saved;
    }
  } catch (e) {
    // ignore and fall back to defaults
  }
  return cloneDefaultTeams();
}

function cloneDefaultTeams() {
  return DEFAULT_TEAMS.map(t => ({ name: t.name, pot: t.pot }));
}

function saveTeams() {
  localStorage.setItem("ucl_teams", JSON.stringify(teams));
}

function getPot(teamName) {
  const team = teams.find(t => t.name === teamName);
  return team ? Number(team.pot) : null;
}

function pairKey(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function countTeamsInPot(pot) {
  return teams.filter(t => Number(t.pot) === pot).length;
}

function validatePotSetup() {
  return POT_NUMBERS.every(pot => countTeamsInPot(pot) === 9) && teams.length === 36;
}

function createSeasonState() {
  const remaining = {};
  teams.forEach(t => {
    remaining[t.name] = {
      1: 2,
      2: 2,
      3: 2,
      4: 2
    };
  });

  return {
    remaining,
    playedPairs: new Set()
  };
}

function totalRemainingForTeam(state, teamName) {
  const r = state.remaining[teamName];
  return r[1] + r[2] + r[3] + r[4];
}

function candidateOpponents(teamName, usedToday, state) {
  const teamPot = getPot(teamName);

  return shuffleArray(
    teams
      .map(t => t.name)
      .filter(opponentName => {
        if (opponentName === teamName) return false;
        if (usedToday.has(opponentName)) return false;
        if (state.playedPairs.has(pairKey(teamName, opponentName))) return false;

        const opponentPot = getPot(opponentName);
        if (!opponentPot) return false;

        return (
          state.remaining[teamName][opponentPot] > 0 &&
          state.remaining[opponentName][teamPot] > 0 &&
          totalRemainingForTeam(state, opponentName) > 0
        );
      })
  );
}

function chooseNextTeam(usedToday, state) {
  let bestTeam = null;
  let bestCount = Infinity;

  const teamNames = shuffleArray(teams.map(t => t.name));

  for (const teamName of teamNames) {
    if (usedToday.has(teamName)) continue;
    if (totalRemainingForTeam(state, teamName) <= 0) continue;

    const candidates = candidateOpponents(teamName, usedToday, state);

    if (candidates.length < bestCount) {
      bestCount = candidates.length;
      bestTeam = teamName;
    }

    if (bestCount === 0) {
      return bestTeam;
    }
  }

  return bestTeam;
}

function buildMatchday(day, state) {
  const usedToday = new Set();
  const pairs = [];

  function recurse() {
    if (usedToday.size === teams.length) return true;

    const teamA = chooseNextTeam(usedToday, state);
    if (!teamA) return false;

    const opponents = candidateOpponents(teamA, usedToday, state);
    if (opponents.length === 0) return false;

    for (const teamB of opponents) {
      const potA = getPot(teamA);
      const potB = getPot(teamB);
      const key = pairKey(teamA, teamB);

      usedToday.add(teamA);
      usedToday.add(teamB);
      state.playedPairs.add(key);

      state.remaining[teamA][potB]--;
      state.remaining[teamB][potA]--;

      pairs.push({
        home: teamA,
        away: teamB
      });

      if (recurse()) return true;

      pairs.pop();
      state.remaining[teamA][potB]++;
      state.remaining[teamB][potA]++;
      state.playedPairs.delete(key);
      usedToday.delete(teamA);
      usedToday.delete(teamB);
    }

    return false;
  }

  return recurse() ? pairs : null;
}

// DRAW
function generateDraw() {
  fixtures = [];

  const standingsBox = document.getElementById("standings");
  if (standingsBox) standingsBox.innerHTML = "";

  if (!validatePotSetup()) {
    alert("Each pot must contain exactly 9 teams, and there must be 36 teams total.");
    return;
  }

  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = createSeasonState();
    const seasonFixtures = [];
    let success = true;
    let nextId = 0;

    for (let day = 1; day <= MATCHDAYS; day++) {
      const dayPairs = buildMatchday(day, state);

      if (!dayPairs || dayPairs.length !== 18) {
        success = false;
        break;
      }

      dayPairs.forEach(pair => {
        seasonFixtures.push({
          id: nextId++,
          matchday: day,
          home: pair.home,
          away: pair.away
        });
      });
    }

    const allUsed = teams.every(t => totalRemainingForTeam(state, t.name) === 0);

    if (success && allUsed && seasonFixtures.length === 144) {
      fixtures = seasonFixtures;
      renderFixtures();
      return;
    }
  }

  alert("Could not generate a valid draw. Try again.");
}

// SHOW FIXTURES + INPUT BOXES
function renderFixtures() {
  const fixturesBox = document.getElementById("fixtures");
  if (!fixturesBox) return;

  const grouped = {};
  for (const f of fixtures) {
    if (!grouped[f.matchday]) grouped[f.matchday] = [];
    grouped[f.matchday].push(f);
  }

  let html = "";

  for (let day = 1; day <= MATCHDAYS; day++) {
    const dayFixtures = grouped[day] || [];
    if (dayFixtures.length === 0) continue;

    html += `
      <div style="margin-top:20px; padding:12px; background:#222; border-left:4px solid #00ff88; border-radius:10px;">
        <h2 style="margin-top:0;">Matchday ${day}</h2>
    `;

    dayFixtures.forEach(f => {
      html += `
        <div style="margin:8px 0; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="min-width:160px;">${f.home}</span>
          <input type="number" id="hg-${f.id}" style="width:60px;">
          <span>-</span>
          <input type="number" id="ag-${f.id}" style="width:60px;">
          <span style="min-width:160px;">${f.away}</span>
        </div>
      `;
    });

    html += `</div>`;
  }

  fixturesBox.innerHTML = html;
}

// TABLE ENGINE
function calculateTable() {
  const standingsBox = document.getElementById("standings");
  if (!standingsBox) return;

  if (fixtures.length === 0) {
    standingsBox.innerHTML = "<p>No fixtures yet. Generate the draw first.</p>";
    return;
  }

  const table = {};

  teams.forEach(t => {
    table[t.name] = {
      pts: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0
    };
  });

  fixtures.forEach(f => {
    if (!f || !f.home || !f.away) return;

    const hgInput = document.getElementById(`hg-${f.id}`);
    const agInput = document.getElementById(`ag-${f.id}`);

    if (!hgInput || !agInput) return;

    const hg = Number.parseInt(hgInput.value, 10);
    const ag = Number.parseInt(agInput.value, 10);

    const homeGoals = Number.isFinite(hg) ? hg : 0;
    const awayGoals = Number.isFinite(ag) ? ag : 0;

    const home = table[f.home];
    const away = table[f.away];

    if (!home || !away) return;

    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;

    if (homeGoals > awayGoals) {
      home.w++;
      home.pts += 3;
      away.l++;
    } else if (awayGoals > homeGoals) {
      away.w++;
      away.pts += 3;
      home.l++;
    } else {
      home.d++;
      away.d++;
      home.pts += 1;
      away.pts += 1;
    }
  });

  const sorted = Object.entries(table).sort((a, b) => {
    const aGD = a[1].gf - a[1].ga;
    const bGD = b[1].gf - b[1].ga;
    return b[1].pts - a[1].pts || bGD - aGD || b[1].gf - a[1].gf;
  });

  renderTable(sorted);
}

// SHOW TABLE
function renderTable(sorted) {
  let html = "<table border='1' style='width:100%; border-collapse:collapse;'>";
  html += "<tr><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th></tr>";

  sorted.forEach(([name, stats]) => {
    const gd = stats.gf - stats.ga;
    html += `
      <tr>
        <td>${name}</td>
        <td>${stats.pts}</td>
        <td>${stats.w}</td>
        <td>${stats.d}</td>
        <td>${stats.l}</td>
        <td>${stats.gf}</td>
        <td>${stats.ga}</td>
        <td>${gd}</td>
      </tr>
    `;
  });

  html += "</table>";

  const standingsBox = document.getElementById("standings");
  if (standingsBox) standingsBox.innerHTML = html;
}

// POT EDITOR (optional)
function renderTeamEditor() {
  const editor = document.getElementById("teamEditor");
  if (!editor) return;

  let html = `
    <div style="margin:16px 0; padding:12px; background:#1b1b1b; border-radius:10px;">
      <h2>Edit Pots</h2>
      <button onclick="savePots()" style="margin-right:8px;">Save Pots</button>
      <button onclick="restoreDefaultTeams()">Restore Default Pots</button>
      <div style="display:grid; gap:8px; margin-top:12px;">
  `;

  teams.forEach((team, index) => {
    html += `
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="min-width:180px;">${team.name}</span>
        <select id="pot-${index}">
          <option value="1" ${Number(team.pot) === 1 ? "selected" : ""}>Pot 1</option>
          <option value="2" ${Number(team.pot) === 2 ? "selected" : ""}>Pot 2</option>
          <option value="3" ${Number(team.pot) === 3 ? "selected" : ""}>Pot 3</option>
          <option value="4" ${Number(team.pot) === 4 ? "selected" : ""}>Pot 4</option>
        </select>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  editor.innerHTML = html;
}

function savePots() {
  teams = teams.map((team, index) => {
    const select = document.getElementById(`pot-${index}`);
    const pot = select ? Number(select.value) : Number(team.pot);
    return { name: team.name, pot };
  });

  saveTeams();
  resetSeason(false);
  renderTeamEditor();
}

function restoreDefaultTeams() {
  teams = cloneDefaultTeams();
  saveTeams();
  resetSeason(false);
  renderTeamEditor();
}

function resetSeason(keepEditor = true) {
  fixtures = [];

  const fixturesBox = document.getElementById("fixtures");
  if (fixturesBox) fixturesBox.innerHTML = "";

  const standingsBox = document.getElementById("standings");
  if (standingsBox) standingsBox.innerHTML = "";

  if (keepEditor) renderTeamEditor();
}

// Initial UI build
renderTeamEditor();
