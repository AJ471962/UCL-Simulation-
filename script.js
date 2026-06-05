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
    if (Array.isArray(saved) && saved.length === 36) return saved;
  } catch {}
  return DEFAULT_TEAMS.map(t => ({ ...t }));
}

function saveTeams() {
  localStorage.setItem("ucl_teams", JSON.stringify(teams));
}

function getPot(teamName) {
  return teams.find(t => t.name === teamName)?.pot ?? null;
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

function validatePotSetup() {
  return POT_NUMBERS.every(p => teams.filter(t => t.pot == p).length === 9);
}

/* ================= DRAW ================= */

function generateDraw() {
  fixtures = [];

  if (!validatePotSetup()) {
    alert("Each pot must have 9 teams.");
    return;
  }

  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    const season = [];
    let nextId = 0;
    let success = true;

    const usedPairs = new Set();

    for (let day = 1; day <= MATCHDAYS; day++) {
      const usedToday = new Set();
      const dayMatches = [];

      const teamList = shuffleArray(teams.map(t => t.name));

      for (const teamA of teamList) {
        if (usedToday.has(teamA)) continue;

        const opponents = shuffleArray(
          teams
            .map(t => t.name)
            .filter(op =>
              op !== teamA &&
              !usedToday.has(op) &&
              !usedPairs.has(pairKey(teamA, op))
            )
        );

        let found = false;

        for (const teamB of opponents) {
          const key = pairKey(teamA, teamB);

          if (usedToday.has(teamB)) continue;

          usedToday.add(teamA);
          usedToday.add(teamB);
          usedPairs.add(key);

          dayMatches.push({
            id: nextId++,
            matchday: day,
            home: Math.random() < 0.5 ? teamA : teamB,
            away: Math.random() < 0.5 ? teamA : teamB === (Math.random() < 0.5 ? teamA : teamB) ? teamA : teamB
          });

          found = true;
          break;
        }

        if (!found && usedToday.size < teams.length) {
          success = false;
          break;
        }
      }

      if (!success) break;

      season.push(...dayMatches);
    }

    if (success && season.length === 144) {
      fixtures = season;
      currentMatchday = 1;
      renderFixtures();
      return;
    }
  }

  alert("Could not generate a balanced season. Try again.");
}

/* ================= MATCHDAY ================= */

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

/* ================= FIXTURES ================= */

function renderFixtures() {
  const box = document.getElementById("fixtures");
  if (!box) return;

  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  let html = `
    <div style="margin:16px; padding:12px; background:#1b1b1b; border-radius:10px;">
      <button onclick="prevMatchday()">Prev</button>
      <b style="margin:0 10px;">Matchday ${currentMatchday}</b>
      <button onclick="nextMatchday()">Next</button>
  `;

  dayFixtures.forEach(f => {
    html += `
      <div style="margin:8px 0;">
        ${f.home}
        <input id="hg-${f.id}" type="number" style="width:50px;">
        -
        <input id="ag-${f.id}" type="number" style="width:50px;">
        ${f.away}
      </div>
    `;
  });

  html += `</div>`;
  box.innerHTML = html;
}

/* ================= TABLE ================= */

function calculateTable() {
  const table = {};

  teams.forEach(t => {
    table[t.name] = { pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  });

  fixtures.forEach(f => {
    const hg = document.getElementById(`hg-${f.id}`)?.value;
    const ag = document.getElementById(`ag-${f.id}`)?.value;

    if (hg === "" || ag === "" || hg == null || ag == null) return;

    const home = table[f.home];
    const away = table[f.away];

    const h = Number(hg);
    const a = Number(ag);

    if (h > a) {
      home.w++; home.pts += 3; away.l++;
    } else if (a > h) {
      away.w++; away.pts += 3; home.l++;
    } else {
      home.d++; away.d++;
      home.pts++; away.pts++;
    }

    home.gf += h; home.ga += a;
    away.gf += a; away.ga += h;
  });

  const sorted = Object.entries(table).sort((a,b) =>
    b[1].pts - a[1].pts || (b[1].gf-b[1].ga) - (a[1].gf-a[1].ga)
  );

  renderTable(sorted);
}

function renderTable(sorted) {
  const box = document.getElementById("standings");

  let html = "<table border='1' style='width:100%'>";
  html += "<tr><th>#</th><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th></tr>";

  sorted.forEach(([name, s], i) => {
    let style = "";
    if (i < 8) style = "background:green;color:white;";
    else if (i < 24) style = "background:gold;color:black;";

    html += `<tr style="${style}">
      <td>${i+1}</td>
      <td>${name}</td>
      <td>${s.pts}</td>
      <td>${s.w}</td>
      <td>${s.d}</td>
      <td>${s.l}</td>
    </tr>`;
  });

  html += "</table>";
  box.innerHTML = html;
}

/* ================= INIT ================= */

renderTeamEditor();
