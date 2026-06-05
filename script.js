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

let savedResults = {};
let knockout = null;
let knockoutStage = null;
let currentRound = "none";
let playoffWinners = [];

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

/* ---------------- SAVE / RESET ---------------- */

function saveMatchday() {
  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  if (!savedResults[currentMatchday]) {
    savedResults[currentMatchday] = {};
  }

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

/* ---------------- AUTO FILL ---------------- */

function autoFillResults() {
  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  dayFixtures.forEach(f => {
    const result = simulateMatch(f.home, f.away);

    let h = 0, a = 0;

    if (result === "H") {
      h = Math.floor(Math.random() * 4) + 1;
      a = Math.floor(Math.random() * h);
    } else if (result === "A") {
      a = Math.floor(Math.random() * 4) + 1;
      h = Math.floor(Math.random() * a);
    } else {
      h = a = Math.floor(Math.random() * 3);
    }

    document.getElementById(`hg-${f.id}`).value = h;
    document.getElementById(`ag-${f.id}`).value = a;
  });
}

/* ---------------- DRAW ---------------- */

function generateDraw() {
  fixtures = [];
  currentMatchday = 1;

  const maxAttempts = 80;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {

    const season = [];
    let nextId = 0;
    let success = true;
    const usedPairs = new Set();

    for (let day = 1; day <= MATCHDAYS; day++) {

      const usedToday = new Set();
      const teamList = shuffleArray(teams.map(t => t.name));
      const dayMatches = [];

      for (const teamA of teamList) {

        if (usedToday.has(teamA)) continue;

        const opponents = shuffleArray(
          teams.map(t => t.name).filter(op =>
            op !== teamA &&
            !usedToday.has(op) &&
            !usedPairs.has(pairKey(teamA, op))
          )
        );

        let found = false;

        for (const teamB of opponents) {

          if (usedToday.has(teamB)) continue;

          usedToday.add(teamA);
          usedToday.add(teamB);
          usedPairs.add(pairKey(teamA, teamB));

          const result = simulateMatch(teamA, teamB);

          let home = teamA;
          let away = teamB;

          if (result === "A") {
            home = teamB;
            away = teamA;
          }

          dayMatches.push({
            id: nextId++,
            matchday: day,
            home,
            away
          });

          found = true;
          break;
        }

        if (!found) {
          success = false;
          break;
        }
      }

      if (!success) break;
      season.push(...dayMatches);
    }

    if (success && season.length === 144) {
      fixtures = season;
      renderFixtures();
      return;
    }
  }

  alert("Could not generate a balanced season. Try again.");
}

/* ---------------- MATCHDAY NAV ---------------- */

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
      <button onclick="nextMatchday()">Next</button>
      <button onclick="saveMatchday()">Save</button>
      <button onclick="resetMatchday()">Reset</button>
      <button onclick="calculateTable()">Update Table</button>
      <b style="margin-left:10px;">Matchday ${currentMatchday}</b>
  `;

  dayFixtures.forEach(f => {
    const saved = savedResults[currentMatchday]?.[f.id];

    html += `
      <div style="margin:8px 0;">
        ${f.home}
        <input id="hg-${f.id}" type="number" value="${saved?.h ?? ""}" style="width:50px;">
        -
        <input id="ag-${f.id}" type="number" value="${saved?.a ?? ""}" style="width:50px;">
        ${f.away}
      </div>
    `;
  });

  html += `</div>`;
  box.innerHTML = html;
}

/* ---------------- TABLE (FULL UPGRADE) ---------------- */

function calculateTable() {

  const table = {};

  teams.forEach(t => {
    table[t.name] = {
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };
  });

  for (const f of fixtures) {

    const saved = savedResults[f.matchday]?.[f.id];
    if (!saved) continue;

    const h = saved.h;
    const a = saved.a;

    const home = table[f.home];
    const away = table[f.away];

    home.mp++;
    away.mp++;

    home.gf += h;
    home.ga += a;

    away.gf += a;
    away.ga += h;

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

  for (const team in table) {
    table[team].gd = table[team].gf - table[team].ga;
  }

  const sorted = Object.entries(table).sort((a, b) =>
    b[1].pts - a[1].pts ||
    b[1].gd - a[1].gd ||
    b[1].gf - a[1].gf
  );

  renderTable(sorted);
}

/* ---------------- TABLE UI ---------------- */

function renderTable(sorted) {

  const box = document.getElementById("standings");

  let html = `
  <table border="1" style="width:100%; text-align:center;">
    <tr>
      <th>#</th>
      <th>Team</th>
      <th>MP</th>
      <th>W</th>
      <th>D</th>
      <th>L</th>
      <th>GF</th>
      <th>GA</th>
      <th>GD</th>
      <th>Pts</th>
    </tr>
  `;

  sorted.forEach(([name, s], i) => {

    let style = "";
    if (i < 8) style = "background:green;color:white;";
    else if (i < 24) style = "background:gold;color:black;";

    html += `
      <tr style="${style}">
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
      </tr>
    `;
  });

  html += `</table>`;
  box.innerHTML = html;
}

function generatePlayoffs(ranked) {
  const playoffTeams = ranked.slice(8, 24); // 9–24

  const pairs = [];

  // UCL style seeding:
  // 9 vs 24, 10 vs 23, etc.
  for (let i = 0; i < 8; i++) {
    const home = playoffTeams[i];
    const away = playoffTeams[15 - i];

    pairs.push({
      id: "p" + i,
      home,
      away,
      leg1: null,
      leg2: null,
      winner: null
    });
  }

  return pairs;
}

function generateKnockout() {
  const table = {};

  teams.forEach(t => {
    table[t.name] = { pts: 0, gf: 0, ga: 0 };
  });

  fixtures.forEach(f => {
    const saved = savedResults?.[f.matchday]?.[f.id];
    if (!saved) return;

    const h = saved.h;
    const a = saved.a;

    const home = table[f.home];
    const away = table[f.away];

    home.pts += h > a ? 3 : h === a ? 1 : 0;
    away.pts += a > h ? 3 : h === a ? 1 : 0;

    home.gf += h; home.ga += a;
    away.gf += a; away.ga += h;
  });

  const ranked = Object.entries(table)
    .sort((a, b) =>
      b[1].pts - a[1].pts ||
      (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga)
    )
    .map(x => x[0]);

  const top8 = ranked.slice(0, 8);

  const playoffs = generatePlayoffs(ranked);

  knockoutStage = {
    top8,
    playoffs,
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: []
  };

  currentRound = "playoffs";

  renderKnockout();

  alert("Playoffs generated (9–24). Top 8 qualified directly.");
  }

function playTwoLegTie(match) {
  const leg1Home = Math.floor(Math.random() * 3);
  const leg1Away = Math.floor(Math.random() * 3);

  const leg2Home = Math.floor(Math.random() * 3);
  const leg2Away = Math.floor(Math.random() * 3);

  const teamA = match.home;
  const teamB = match.away;

  const totalA = leg1Home + leg2Away;
  const totalB = leg1Away + leg2Home;

  if (totalA === totalB) {
    // simple extra time coin flip
    return Math.random() > 0.5 ? teamA : teamB;
  }

  return totalA > totalB ? teamA : teamB;
}

function playPlayoffs() {
  const winners = knockoutStage.playoffs.map(playTwoLegTie);

  playoffWinners = winners;

  const all16 = [...knockoutStage.top8, ...winners];

  knockoutStage.roundOf16 = createPairs(all16);

  currentRound = "roundOf16";

  renderKnockout();
}

function createPairs(list) {
  const pairs = [];

  for (let i = 0; i < list.length; i += 2) {
    pairs.push({
      id: i,
      home: list[i],
      away: list[i + 1],
      score: null,
      winner: null
    });
  }

  return pairs;
}

function advanceKnockout() {
  if (currentRound === "playoffs") {
    playPlayoffs();
    return;
  }

  const round = knockoutStage[currentRound];

  const winners = round.map(m => {
    const h = Math.floor(Math.random() * 4);
    const a = Math.floor(Math.random() * 4);

    m.score = `${h}-${a}`;
    m.winner = h >= a ? m.home : m.away;

    return m.winner;
  });

  if (currentRound === "roundOf16") {
    knockoutStage.quarterFinal = createPairs(winners);
    currentRound = "quarterFinal";
  }

  else if (currentRound === "quarterFinal") {
    knockoutStage.semiFinal = createPairs(winners);
    currentRound = "semiFinal";
  }

  else if (currentRound === "semiFinal") {
    knockoutStage.final = createPairs(winners);
    currentRound = "final";
  }

  else if (currentRound === "final") {
    alert("🏆 Champion: " + winners[0]);
  }

  renderKnockout();
}

function renderKnockout() {
  const box = document.getElementById("fixtures");

  if (!knockoutStage) return;

  let roundData =
    currentRound === "playoffs" ? knockoutStage.playoffs :
    knockoutStage[currentRound];

  let html = `
    <h2>Knockout Stage - ${currentRound}</h2>
    <button onclick="advanceKnockout()">Play Round</button>
  `;

  roundData.forEach(m => {
    if (currentRound === "playoffs") {
      html += `<div>${m.home} vs ${m.away}</div>`;
    } else {
      html += `
        <div>
          ${m.home} vs ${m.away}
          ${m.score ? " → " + m.score : ""}
        </div>
      `;
    }
  });

  box.innerHTML = html;
}

function showLeaguePhase() {
  document.getElementById("leaguePhasePage").style.display = "block";
  document.getElementById("knockoutPage").style.display = "none";
}

function showKnockout() {
  document.getElementById("leaguePhasePage").style.display = "none";
  document.getElementById("knockoutPage").style.display = "block";
}
/* ---------------- GLOBAL ---------------- */

window.autoFillResults = autoFillResults;
window.generateDraw = generateDraw;
window.calculateTable = calculateTable;
window.prevMatchday = prevMatchday;
window.nextMatchday = nextMatchday;
window.saveMatchday = saveMatchday;
window.resetMatchday = resetMatchday;
window.showLeaguePhase = showLeaguePhase;
window.showKnockout = showKnockout;
window.generateKnockout = generateKnockout;
window.advanceKnockout = advanceKnockout;
