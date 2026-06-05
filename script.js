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

/* ================= LEAGUE STORAGE ================= */
let savedResults = {};

/* ================= KNOCKOUT STORAGE ================= */
let knockout = {
  r16: [],
  qf: [],
  sf: [],
  final: [],
  winner: null
};

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

/* ================= LEAGUE FUNCTIONS ================= */

function saveMatchday() {
  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  if (!savedResults[currentMatchday]) savedResults[currentMatchday] = {};

  dayFixtures.forEach(f => {
    const hg = document.getElementById(`hg-${f.id}`);
    const ag = document.getElementById(`ag-${f.id}`);

    if (!hg || !ag) return;
    if (hg.value === "" || ag.value === "") return;

    savedResults[currentMatchday][f.id] = {
      h: Number(hg.value),
      a: Number(ag.value)
    };
  });

  alert(`Matchday ${currentMatchday} saved.`);
}

function resetMatchday() {
  delete savedResults[currentMatchday];
  renderFixtures();
}

/* ---------------- TABLE (FULL) ---------------- */

function calculateTable() {
  const table = {};

  teams.forEach(t => {
    table[t.name] = {
      mp: 0, w: 0, d: 0, l: 0,
      gf: 0, ga: 0, gd: 0, pts: 0
    };
  });

  for (const f of fixtures) {
    const saved = savedResults[f.matchday]?.[f.id];
    if (!saved) continue;

    const h = saved.h;
    const a = saved.a;

    const home = table[f.home];
    const away = table[f.away];

    home.mp++; away.mp++;

    home.gf += h; home.ga += a;
    away.gf += a; away.ga += h;

    if (h > a) {
      home.w++; home.pts += 3;
      away.l++;
    } else if (a > h) {
      away.w++; away.pts += 3;
      home.l++;
    } else {
      home.d++; away.d++;
      home.pts++; away.pts++;
    }
  }

  for (let t in table) {
    table[t].gd = table[t].gf - table[t].ga;
  }

  const sorted = Object.entries(table).sort((a, b) =>
    b[1].pts - a[1].pts ||
    b[1].gd - a[1].gd ||
    b[1].gf - a[1].gf
  );

  renderTable(sorted);
}

function renderTable(sorted) {
  const box = document.getElementById("standings");

  let html = `<table border="1" style="width:100%; text-align:center;">
    <tr>
      <th>#</th><th>Team</th><th>MP</th><th>W</th><th>D</th>
      <th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
    </tr>`;

  sorted.forEach(([name, s], i) => {
    html += `<tr>
      <td>${i + 1}</td>
      <td>${name}</td>
      <td>${s.mp}</td>
      <td>${s.w}</td>
      <td>${s.d}</td>
      <td>${s.l}</td>
      <td>${s.gf}</td>
      <td>${s.ga}</td>
      <td>${s.gd}</td>
      <td>${s.pts}</td>
    </tr>`;
  });

  html += `</table>`;
  box.innerHTML = html;
}

/* ================= KNOCKOUT ENGINE ================= */

function generateKnockout() {
  const table = {};

  teams.forEach(t => {
    table[t.name] = { pts: 0 };
  });

  for (const f of fixtures) {
    const s = savedResults[f.matchday]?.[f.id];
    if (!s) continue;

    const h = s.h, a = s.a;

    table[f.home].pts += h > a ? 3 : h === a ? 1 : 0;
    table[f.away].pts += a > h ? 3 : h === a ? 1 : 0;
  }

  const ranked = Object.entries(table)
    .sort((a, b) => b[1].pts - a[1].pts)
    .map(x => x[0]);

  const top16 = ranked.slice(0, 16);

  const r16 = [];

  for (let i = 0; i < 8; i++) {
    r16.push({
      home: top16[i],
      away: top16[15 - i]
    });
  }

  knockout.r16 = r16;

  alert("Round of 16 generated!");
}

/* ================= MATCH SIMULATION ================= */

function playKnockoutRound(matches) {
  return matches.map(m => {
    let homeScore = Math.floor(Math.random() * 4);
    let awayScore = Math.floor(Math.random() * 4);

    if (homeScore === awayScore) {
      homeScore += Math.random() > 0.5 ? 1 : 0;
      awayScore += Math.random() > 0.5 ? 1 : 0;
    }

    return {
      home: m.home,
      away: m.away,
      homeScore,
      awayScore,
      winner: homeScore > awayScore ? m.home : m.away
    };
  });
}

/* ================= PROGRESSION ================= */

function playR16() {
  knockout.qf = playKnockoutRound(knockout.r16);
  alert("Quarterfinals ready!");
}

function playQF() {
  const winners = knockout.qf.map(m => ({
    home: m.winner
  }));

  knockout.sf = playKnockoutRound(pairKnock(winners));
}

function playSF() {
  const winners = knockout.sf.map(m => ({
    home: m.winner
  }));

  knockout.final = playKnockoutRound(pairKnock(winners));
}

function playFinal() {
  knockout.winner = knockout.final[0].winner;
  alert("Winner: " + knockout.winner);
}

function pairKnock(arr) {
  const matches = [];
  for (let i = 0; i < arr.length; i += 2) {
    matches.push({
      home: arr[i].home,
      away: arr[i + 1].home
    });
  }
  return matches;
}

/* ================= GLOBAL ================= */

window.autoFillResults = autoFillResults;
window.generateDraw = generateDraw;
window.calculateTable = calculateTable;
window.saveMatchday = saveMatchday;
window.resetMatchday = resetMatchday;
window.prevMatchday = () => { if (currentMatchday > 1) { currentMatchday--; renderFixtures(); } };
window.nextMatchday = () => { if (currentMatchday < MATCHDAYS) { currentMatchday++; renderFixtures(); } };

window.generateKnockout = generateKnockout;
window.playR16 = playR16;
window.playQF = playQF;
window.playSF = playSF;
window.playFinal = playFinal;
