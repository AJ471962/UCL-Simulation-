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

function totalRemainingForTeam(state, teamName) {
  const r = state.remaining[teamName];
  return r[1] + r[2] + r[3] + r[4];
}

function buildPairGraph() {
  const neighbors = {};
  teams.forEach(t => {
    neighbors[t.name] = new Set();
  });

  function addEdge(a, b) {
    if (!a || !b || a === b) return;
    neighbors[a].add(b);
    neighbors[b].add(a);
  }

  const pots = {};
  POT_NUMBERS.forEach(pot => {
    pots[pot] = shuffleArray(
      teams.filter(t => Number(t.pot) === pot).map(t => t.name)
    );
  });

  // Same-pot matches: each team gets 2 within its own pot.
  POT_NUMBERS.forEach(pot => {
    const arr = pots[pot];
    for (let i = 0; i < arr.length; i++) {
      addEdge(arr[i], arr[(i + 1) % arr.length]);
    }
  });

  // Cross-pot matches: each team gets 2 opponents from every other pot.
  for (let i = 0; i < POT_NUMBERS.length; i++) {
    for (let j = i + 1; j < POT_NUMBERS.length; j++) {
      const potA = pots[POT_NUMBERS[i]];
      const potB = pots[POT_NUMBERS[j]];

      [0, 1].forEach(shift => {
        for (let k = 0; k < 9; k++) {
          addEdge(potA[k], potB[(k + shift) % 9]);
        }
      });
    }
  }

  return neighbors;
}

function chooseNextTeam(usedToday, neighbors) {
  let bestTeam = null;
  let bestCount = Infinity;

  const shuffledTeams = shuffleArray(teams.map(t => t.name));

  for (const teamName of shuffledTeams) {
    if (usedToday.has(teamName)) continue;

    const candidates = [...neighbors[teamName]].filter(op => !usedToday.has(op));

    if (candidates.length === 0) {
      return teamName;
    }

    if (candidates.length < bestCount) {
      bestCount = candidates.length;
      bestTeam = teamName;
      if (bestCount === 1) break;
    }
  }

  return bestTeam;
}

function buildMatchday(day, neighbors) {
  const usedToday = new Set();
  const matches = [];

  function recurse() {
    if (usedToday.size === teams.length) return true;

    const teamA = chooseNextTeam(usedToday, neighbors);
    if (!teamA) return false;

    const candidates = shuffleArray([...neighbors[teamA]].filter(op => !usedToday.has(op)));
    if (candidates.length === 0) return false;

    for (const teamB of candidates) {
      if (!neighbors[teamA].has(teamB)) continue;

      usedToday.add(teamA);
      usedToday.add(teamB);
      neighbors[teamA].delete(teamB);
      neighbors[teamB].delete(teamA);

      const homeFirst = Math.random() < 0.5;
      matches.push({
        home: homeFirst ? teamA : teamB,
        away: homeFirst ? teamB : teamA
      });

      if (recurse()) return true;

      matches.pop();
      neighbors[teamA].add(teamB);
      neighbors[teamB].add(teamA);
      usedToday.delete(teamA);
      usedToday.delete(teamB);
    }

    return false;
  }

  return recurse() ? matches : null;
}

// DRAW
function generateDraw() {
  fixtures = [];

  if (!validatePotSetup()) {
    alert("Each pot must contain exactly 9 teams, and there must be 36 teams total.");
    return;
  }

  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const neighbors = buildPairGraph();
    const season = [];
    let nextId = 0;
    let success = true;

    for (let day = 1; day <= MATCHDAYS; day++) {
      const dayMatches = buildMatchday(day, neighbors);

      if (!dayMatches || dayMatches.length !== 18) {
        success = false;
        break;
      }

      dayMatches.forEach(match => {
        season.push({
          id: nextId++,
          matchday: day,
          home: match.home,
          away: match.away
        });
      });
    }

    if (success && season.length === 144) {
      fixtures = season;
      renderFixtures();
      return;
    }
  }

  alert("Could not generate a balanced season. Tap Generate League Phase Draw again.");
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
    if (hgInput.value.trim() === "" || agInput.value.trim() === "") return;

    const hg = parseInt(hgInput.value, 10);
    const ag = parseInt(agInput.value, 10);

    if (Number.isNaN(hg) || Number.isNaN(ag)) return;

    const home = table[f.home];
    const away = table[f.away];

    if (!home || !away) return;

    home.gf += hg;
    home.ga += ag;

    away.gf += ag;
    away.ga += hg;

    if (hg > ag) {
      home.w++;
      home.pts += 3;
      away.l++;
    } else if (ag > hg) {
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

// POT EDITOR
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
