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
let currentMatchday = 1;

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
    remaining[t.name] = { 1: 2, 2: 2, 3: 2, 4: 2 };
  });

  return { remaining };
}

function totalRemainingForTeam(state, teamName) {
  const r = state.remaining[teamName];
  return r[1] + r[2] + r[3] + r[4];
}

function prevMatchday() {
  if (currentMatchday > 1) {
    currentMatchday--;
    renderFixtures();
  }
}

function nextMatchday() {
  if (currentMatchday < MATCHDAYS) {
    currentMatchday++;
    renderFixtures();
  }
}

function buildNeighborGraph() {
  const graph = {};
  teams.forEach(t => {
    graph[t.name] = new Set();
  });

  const pots = {};
  POT_NUMBERS.forEach(pot => {
    pots[pot] = shuffleArray(
      teams.filter(t => Number(t.pot) === pot).map(t => t.name)
    );
  });

  function addEdge(a, b) {
    if (!a || !b || a === b) return;
    graph[a].add(b);
    graph[b].add(a);
  }

  POT_NUMBERS.forEach(pot => {
    const arr = pots[pot];
    for (let i = 0; i < arr.length; i++) {
      addEdge(arr[i], arr[(i + 1) % arr.length]);
    }
  });

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

  return graph;
}

function findPerfectMatching(graph) {
  const unmatched = new Set(teams.map(t => t.name));
  const pairs = [];

  function recurse() {
    if (unmatched.size === 0) return true;

    let chosenTeam = null;
    let chosenOptions = null;

    const shuffledTeams = shuffleArray([...unmatched]);

    for (const team of shuffledTeams) {
      const options = shuffleArray(
        [...graph[team]].filter(op => unmatched.has(op))
      );

      if (options.length === 0) {
        return false;
      }

      if (!chosenTeam || options.length < chosenOptions.length) {
        chosenTeam = team;
        chosenOptions = options;
        if (options.length === 1) break;
      }
    }

    for (const opp of chosenOptions) {
      if (!unmatched.has(chosenTeam) || !unmatched.has(opp)) continue;

      unmatched.delete(chosenTeam);
      unmatched.delete(opp);
      pairs.push([chosenTeam, opp]);

      if (recurse()) return true;

      pairs.pop();
      unmatched.add(chosenTeam);
      unmatched.add(opp);
    }

    return false;
  }

  return recurse() ? pairs.slice() : null;
}

function removePairsFromGraph(graph, pairs) {
  pairs.forEach(([a, b]) => {
    graph[a].delete(b);
    graph[b].delete(a);
  });
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
    const graph = buildNeighborGraph();
    const season = [];
    let nextId = 0;
    let success = true;

    for (let day = 1; day <= MATCHDAYS; day++) {
      const matching = findPerfectMatching(graph);

      if (!matching || matching.length !== 18) {
        success = false;
        break;
      }

      matching.forEach(([a, b]) => {
        const homeFirst = Math.random() < 0.5;
        season.push({
          id: nextId++,
          matchday: day,
          home: homeFirst ? a : b,
          away: homeFirst ? b : a
        });
      });

      removePairsFromGraph(graph, matching);
    }

    if (success && season.length === 144) {
  fixtures = season;
  currentMatchday = 1;
  renderFixtures();
  return;
    }

  alert("Could not generate a balanced season. Tap Generate League Phase Draw again.");
}

// SHOW FIXTURES + INPUT BOXES
function renderFixtures() {
  const fixturesBox = document.getElementById("fixtures");
  if (!fixturesBox) return;

  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  let html = `
    <div style="margin:16px 0; padding:12px; background:#1b1b1b; border-radius:10px;">
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
        <button onclick="prevMatchday()" ${currentMatchday === 1 ? "disabled" : ""}>Previous</button>
        <h2 style="margin:0;">Matchday ${currentMatchday}</h2>
        <button onclick="nextMatchday()" ${currentMatchday === MATCHDAYS ? "disabled" : ""}>Next</button>
      </div>
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
  html += "<tr><th>#</th><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th></tr>";

  sorted.forEach(([name, stats], index) => {
    const position = index + 1;
    const gd = stats.gf - stats.ga;

    let rowStyle = "";
    if (position <= 8) {
      rowStyle = "background:#1f8f3a;color:white;";
    } else if (position <= 24) {
      rowStyle = "background:#b8860b;color:white;";
    }

    html += `
      <tr style="${rowStyle}">
        <td>${position}</td>
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
