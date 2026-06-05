const DEFAULT_TEAMS = [
  { name: "Real Madrid", pot: 1 },
  { name: "Manchester City", pot: 1 },
  { name: "PSG", pot: 1 },
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

let teams = DEFAULT_TEAMS.map(t => ({ ...t }));
let fixtures = [];
let currentMatchday = 1;

/* ---------------- HELPERS ---------------- */

function getPot(team) {
  return teams.find(t => t.name === team)?.pot ?? 4;
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

/* ---------------- SIM ---------------- */

function simulateMatch(home, away) {
  const hPot = getPot(home);
  const aPot = getPot(away);

  const strength = (aPot - hPot) * 0.12;

  const homeScore = Math.random() + strength;
  const awayScore = Math.random();

  if (homeScore > awayScore + 0.18) return "H";
  if (awayScore > homeScore + 0.18) return "A";
  return "D";
}

/* ---------------- MATCHDAY CONTROLS (FIXED) ---------------- */

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

/* ---------------- FIXTURES ---------------- */

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

/* ---------------- GLOBAL EXPORT FIX ---------------- */

window.generateDraw = generateDraw;
window.calculateTable = calculateTable;
window.autoFillResults = autoFillResults;
window.prevMatchday = prevMatchday;
window.nextMatchday = nextMatchday;
