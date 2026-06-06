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
const KO_ROUNDS = ["playoffs", "roundOf16", "quarterFinal", "semiFinal", "final"];

let teams = DEFAULT_TEAMS.map(t => ({ ...t }));
let fixtures = [];
let currentMatchday = 1;

let currentPage = "league";
let savedResults = {};
let knockoutState = null;
let currentRound = null;
let savedKnockout = {};

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

function generateSimulatedScore(home, away) {
  const result = simulateMatch(home, away);
  let h = 0;
  let a = 0;

  if (result === "H") {
    h = Math.floor(Math.random() * 4) + 1;
    a = Math.floor(Math.random() * h);
  } else if (result === "A") {
    a = Math.floor(Math.random() * 4) + 1;
    h = Math.floor(Math.random() * a);
  } else {
    h = a = Math.floor(Math.random() * 3);
  }

  return { h, a };
}

function showLeaguePhase() {
  currentPage = "league";
  const league = document.getElementById("leaguePhasePage");
  const knockout = document.getElementById("knockoutPage");

  if (league) league.style.display = "block";
  if (knockout) knockout.style.display = "none";

  renderFixtures();
}

function showKnockout() {
  currentPage = "knockout";
  const league = document.getElementById("leaguePhasePage");
  const knockout = document.getElementById("knockoutPage");

  if (league) league.style.display = "none";
  if (knockout) knockout.style.display = "block";

  renderKnockout();
}

/* ---------------- LEAGUE SAVE / RESET ---------------- */

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

/* ---------------- LEAGUE SIMULATE ---------------- */

function simulateLeagueMatchday() {
  const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

  dayFixtures.forEach(f => {
    const score = generateSimulatedScore(f.home, f.away);
    const hg = document.getElementById(`hg-${f.id}`);
    const ag = document.getElementById(`ag-${f.id}`);

    if (hg) hg.value = score.h;
    if (ag) ag.value = score.a;
  });
}

/* ---------------- ONE SIMULATE BUTTON FOR BOTH MODES ---------------- */

function autoFillResults() {
  if (currentPage === "knockout") {
    simulateKnockoutRound();
    return;
  }

  simulateLeagueMatchday();
}

/* ---------------- LEAGUE DRAW ---------------- */

function generateDraw() {
  fixtures = [];
  currentMatchday = 1;
  savedResults = {};
  knockoutState = null;
  currentRound = null;
  savedKnockout = {};
  currentPage = "league";

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
      showLeaguePhase();
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

/* ---------------- LEAGUE FIXTURES ---------------- */

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
      <button onclick="generateKnockout()">Generate Knockout</button>
      <button onclick="autoFillResults()">Simulate</button>
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

/* ---------------- LEAGUE STANDINGS ---------------- */

function computeLeagueStandings() {
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
      home.w++;
      home.pts += 3;
      away.l++;
    } else if (a > h) {
      away.w++;
      away.pts += 3;
      home.l++;
    } else {
      home.d++;
      away.d++;
      home.pts++;
      away.pts++;
    }
  }

  for (const name in table) {
    table[name].gd = table[name].gf - table[name].ga;
  }

  return Object.entries(table).sort((a, b) =>
    b[1].pts - a[1].pts ||
    b[1].gd - a[1].gd ||
    b[1].gf - a[1].gf
  );
}

function calculateTable() {
  renderTable(computeLeagueStandings());
}

function renderTable(sorted) {
  const box = document.getElementById("standings");
  if (!box) return;

  let html = `
    <table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
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

/* ---------------- KNOCKOUT HELPERS ---------------- */

function roundLabel(round) {
  if (round === "playoffs") return "Playoffs";
  if (round === "roundOf16") return "Round of 16";
  if (round === "quarterFinal") return "Quarter-finals";
  if (round === "semiFinal") return "Semi-finals";
  if (round === "final") return "Final";
  return round;
}

function createTie(home, away, legs, id) {
  return {
    id,
    home,
    away,
    legs,
    winner: null
  };
}

function createPlayoffTies(playoffTeams) {
  const ties = [];

  for (let i = 0; i < 8; i++) {
    ties.push(createTie(playoffTeams[i], playoffTeams[15 - i], 2, `po-${i}`));
  }

  return ties;
}

function createSequentialTies(list, prefix, legs) {
  const ties = [];

  for (let i = 0; i < list.length; i += 2) {
    if (!list[i + 1]) break;
    ties.push(createTie(list[i], list[i + 1], legs, `${prefix}-${i / 2}`));
  }

  return ties;
}

function decideWinnerAfterDraw(home, away) {
  const result = simulateMatch(home, away);
  if (result === "H") return home;
  if (result === "A") return away;
  return Math.random() < 0.5 ? home : away;
}

function getKnockoutLegScore(roundName, tie, legNumber, home, away, allowSimulate = true) {
  if (!savedKnockout[roundName]) savedKnockout[roundName] = {};
  if (!savedKnockout[roundName][tie.id]) savedKnockout[roundName][tie.id] = {};

  const savedLeg = savedKnockout[roundName][tie.id][`leg${legNumber}`];
  if (savedLeg && typeof savedLeg.h === "number" && typeof savedLeg.a === "number") {
    return savedLeg;
  }

  const hEl = document.getElementById(`k-${roundName}-${tie.id}-l${legNumber}-h`);
  const aEl = document.getElementById(`k-${roundName}-${tie.id}-l${legNumber}-a`);

  if (hEl && aEl && hEl.value !== "" && aEl.value !== "") {
    const score = { h: Number(hEl.value), a: Number(aEl.value) };
    savedKnockout[roundName][tie.id][`leg${legNumber}`] = score;
    return score;
  }

  if (!allowSimulate) return null;

  const score = generateSimulatedScore(home, away);
  if (hEl) hEl.value = score.h;
  if (aEl) aEl.value = score.a;

  savedKnockout[roundName][tie.id][`leg${legNumber}`] = score;
  return score;
}

function simulateCurrentKnockoutRound() {
  if (!knockoutState || !currentRound || !knockoutState[currentRound]) {
    alert("Generate the knockout stage first.");
    return;
  }

  const ties = knockoutState[currentRound];

  ties.forEach(tie => {
    if (tie.legs === 1) {
      getKnockoutLegScore(currentRound, tie, 1, tie.home, tie.away, true);
    } else {
      getKnockoutLegScore(currentRound, tie, 1, tie.home, tie.away, true);
      getKnockoutLegScore(currentRound, tie, 2, tie.away, tie.home, true);
    }
  });

  renderKnockout();
}

function saveKnockoutRound() {
  if (!knockoutState || !currentRound || !knockoutState[currentRound]) {
    alert("No knockout round to save.");
    return;
  }

  const ties = knockoutState[currentRound];
  if (!savedKnockout[currentRound]) savedKnockout[currentRound] = {};

  ties.forEach(tie => {
    if (!savedKnockout[currentRound][tie.id]) savedKnockout[currentRound][tie.id] = {};

    if (tie.legs === 1) {
      const hEl = document.getElementById(`k-${currentRound}-${tie.id}-l1-h`);
      const aEl = document.getElementById(`k-${currentRound}-${tie.id}-l1-a`);
      if (!hEl || !aEl) return;
      if (hEl.value === "" || aEl.value === "") return;

      savedKnockout[currentRound][tie.id].leg1 = {
        h: Number(hEl.value),
        a: Number(aEl.value)
      };
    } else {
      const h1 = document.getElementById(`k-${currentRound}-${tie.id}-l1-h`);
      const a1 = document.getElementById(`k-${currentRound}-${tie.id}-l1-a`);
      const h2 = document.getElementById(`k-${currentRound}-${tie.id}-l2-h`);
      const a2 = document.getElementById(`k-${currentRound}-${tie.id}-l2-a`);

      if (h1 && a1 && h1.value !== "" && a1.value !== "") {
        savedKnockout[currentRound][tie.id].leg1 = {
          h: Number(h1.value),
          a: Number(a1.value)
        };
      }

      if (h2 && a2 && h2.value !== "" && a2.value !== "") {
        savedKnockout[currentRound][tie.id].leg2 = {
          h: Number(h2.value),
          a: Number(a2.value)
        };
      }
    }
  });

  alert(`${roundLabel(currentRound)} saved.`);
}

function resetKnockoutRound() {
  if (!currentRound) return;
  delete savedKnockout[currentRound];
  renderKnockout();
}

function resolveKnockoutRound(roundName, allowSimulate = true) {
  const ties = knockoutState?.[roundName];
  if (!ties) return [];

  const winners = [];

  ties.forEach(tie => {
    if (tie.legs === 1) {
      const s = getKnockoutLegScore(roundName, tie, 1, tie.home, tie.away, allowSimulate);
      if (!s) return;

      let winner;
      if (s.h === s.a) {
        winner = decideWinnerAfterDraw(tie.home, tie.away);
      } else {
        winner = s.h > s.a ? tie.home : tie.away;
      }

      tie.winner = winner;
      winners.push(winner);
    } else {
      const l1 = getKnockoutLegScore(roundName, tie, 1, tie.home, tie.away, allowSimulate);
      const l2 = getKnockoutLegScore(roundName, tie, 2, tie.away, tie.home, allowSimulate);
      if (!l1 || !l2) return;

      const aggHome = l1.h + l2.a;
      const aggAway = l1.a + l2.h;

      let winner;
      if (aggHome === aggAway) {
        winner = decideWinnerAfterDraw(tie.home, tie.away);
      } else {
        winner = aggHome > aggAway ? tie.home : tie.away;
      }

      tie.winner = winner;
      winners.push(winner);
    }
  });

  return winners;
}

/* ---------------- KNOCKOUT GENERATION ---------------- */

function generateKnockout() {
  const rankings = computeLeagueStandings();

  if (!rankings.length || rankings.every(([, s]) => s.mp === 0)) {
    alert("Save some league results first.");
    return;
  }

  const rankedTeams = rankings.map(x => x[0]);
  const top8 = rankedTeams.slice(0, 8);
  const playoffTeams = rankedTeams.slice(8, 24);

  knockoutState = {
    top8,
    playoffs: createPlayoffTies(playoffTeams),
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null
  };

  savedKnockout = {};
  currentRound = "playoffs";
  currentPage = "knockout";
  showKnockout();
}

function advanceKnockoutRound() {
  if (!knockoutState || !currentRound) {
    alert("Generate knockout first.");
    return;
  }

  const winners = resolveKnockoutRound(currentRound, true);
  if (!winners.length) {
    alert("No results available for this round.");
    return;
  }

  if (currentRound === "playoffs") {
    const all16 = [...knockoutState.top8, ...winners];
    knockoutState.roundOf16 = createSequentialTies(all16, "r16", 2);
    currentRound = "roundOf16";
  } else if (currentRound === "roundOf16") {
    knockoutState.quarterFinal = createSequentialTies(winners, "qf", 2);
    currentRound = "quarterFinal";
  } else if (currentRound === "quarterFinal") {
    knockoutState.semiFinal = createSequentialTies(winners, "sf", 2);
    currentRound = "semiFinal";
  } else if (currentRound === "semiFinal") {
    knockoutState.final = createSequentialTies(winners, "final", 1);
    currentRound = "final";
  } else if (currentRound === "final") {
    knockoutState.champion = winners[0];
    alert(`🏆 Champion: ${winners[0]}`);
    renderKnockout();
    return;
  }

  renderKnockout();
}

function prevKnockoutRound() {
  if (!currentRound) return;

  const idx = KO_ROUNDS.indexOf(currentRound);
  if (idx <= 0) {
    alert("This is the first knockout round.");
    return;
  }

  currentRound = KO_ROUNDS[idx - 1];
  renderKnockout();
}

/* ---------------- KNOCKOUT RENDER ---------------- */

function renderKnockout() {
  const box = document.getElementById("knockout");
  if (!box) return;

  if (!knockoutState || !currentRound || !knockoutState[currentRound]) {
    box.innerHTML = `
      <div style="margin:16px; padding:12px; background:#1b1b1b; border-radius:10px;">
        Generate the knockout stage after saving league results.
      </div>
    `;
    return;
  }

  const round = knockoutState[currentRound];

  let html = `
    <div style="margin:16px; padding:12px; background:#1b1b1b; border-radius:10px;">
      <h2 style="margin-top:0;">${roundLabel(currentRound)}</h2>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        <button onclick="autoFillResults()">Simulate</button>
        <button onclick="saveKnockoutRound()">Save</button>
        <button onclick="resetKnockoutRound()">Reset</button>
        <button onclick="prevKnockoutRound()">Previous Round</button>
        <button onclick="advanceKnockoutRound()">Advance Round</button>
      </div>
  `;

  if (knockoutState.champion && currentRound === "final") {
    html += `
      <div style="padding:10px; margin-bottom:12px; background:#0f2e1f; color:#fff;">
        Champion: ${knockoutState.champion}
      </div>
    `;
  }

  round.forEach(tie => {
    const saved = savedKnockout[currentRound]?.[tie.id] || {};

    if (tie.legs === 1) {
      const l1 = saved.leg1 || {};
      html += `
        <div style="margin:12px 0; padding:10px; border:1px solid #333; border-radius:8px;">
          <div style="font-weight:bold; margin-bottom:6px;">${tie.home} vs ${tie.away}</div>
          <div>
            <span>${tie.home}</span>
            <input id="k-${currentRound}-${tie.id}-l1-h" type="number" value="${l1.h ?? ""}" style="width:60px;">
            -
            <input id="k-${currentRound}-${tie.id}-l1-a" type="number" value="${l1.a ?? ""}" style="width:60px;">
            <span>${tie.away}</span>
          </div>
        </div>
      `;
    } else {
      const leg1 = saved.leg1 || {};
      const leg2 = saved.leg2 || {};

      html += `
        <div style="margin:12px 0; padding:10px; border:1px solid #333; border-radius:8px;">
          <div style="font-weight:bold; margin-bottom:8px;">${tie.home} vs ${tie.away}</div>

          <div style="margin-bottom:6px;">
            Leg 1:
            <span>${tie.home}</span>
            <input id="k-${currentRound}-${tie.id}-l1-h" type="number" value="${leg1.h ?? ""}" style="width:60px;">
            -
            <input id="k-${currentRound}-${tie.id}-l1-a" type="number" value="${leg1.a ?? ""}" style="width:60px;">
            <span>${tie.away}</span>
          </div>

          <div>
            Leg 2:
            <span>${tie.away}</span>
            <input id="k-${currentRound}-${tie.id}-l2-h" type="number" value="${leg2.h ?? ""}" style="width:60px;">
            -
            <input id="k-${currentRound}-${tie.id}-l2-a" type="number" value="${leg2.a ?? ""}" style="width:60px;">
            <span>${tie.home}</span>
          </div>
        </div>
      `;
    }
  });

  html += `</div>`;
  box.innerHTML = html;
}

/* ---------------- GLOBAL EXPORTS ---------------- */

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
window.advanceKnockoutRound = advanceKnockoutRound;
window.prevKnockoutRound = prevKnockoutRound;
window.saveKnockoutRound = saveKnockoutRound;
window.resetKnockoutRound = resetKnockoutRound;
