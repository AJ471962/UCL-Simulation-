let teams = [
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

let fixtures = [];

function getPot(teamName) {
  return teams.find(t => t.name === teamName)?.pot;
}

// DRAW
function generateDraw() {
  fixtures = [];

  let matchId = 0;

  let pool = teams.map(t => ({
    name: t.name,
    pot: t.pot,
    opponents: [],
    playedCount: 0
  }));

  const matchdays = 8;

  for (let day = 1; day <= matchdays; day++) {

    let usedThisDay = new Set();
    let dayMatches = [];

    for (let i = 0; i < pool.length; i++) {

      let teamA = pool[i];

      if (usedThisDay.has(teamA.name)) continue;

      let opponent = pool.find(op =>
        op.name !== teamA.name &&
        !teamA.opponents.includes(op.name) &&
        !usedThisDay.has(op.name) &&
        teamA.playedCount < 8 &&
        op.playedCount < 8
      );

      if (!opponent) continue;

      teamA.opponents.push(opponent.name);
      opponent.opponents.push(teamA.name);

      teamA.playedCount++;
      opponent.playedCount++;

      usedThisDay.add(teamA.name);
      usedThisDay.add(opponent.name);

      dayMatches.push({
        id: matchId++,
        matchday: day,
        home: teamA.name,
        away: opponent.name
      });
    }

    fixtures.push(...dayMatches);
  }

  renderFixtures();
}
  

// SHOW FIXTURES + INPUT BOXES
function renderFixtures() {

  let grouped = {};

  fixtures.forEach(f => {
    if (!grouped[f.matchday]) grouped[f.matchday] = [];
    grouped[f.matchday].push(f);
  });

  let html = "";

  Object.keys(grouped).forEach(day => {

    html += `
      <div style="margin-top:20px; padding:10px; background:#222; border-left:4px solid #00ff88;">
        <h2>Matchday ${day}</h2>
    `;

    fixtures.forEach(f => {

  if (!f || !f.home || !f.away) return;

  html += `
    <div style="margin:8px 0;">
      ${f.home}

      <input type="number" id="hg-${f.id}" style="width:50px;">

      -

      <input type="number" id="ag-${f.id}" style="width:50px;">

      ${f.away}
    </div>
  `;
});

  document.getElementById("fixtures").innerHTML = html;
}

// TABLE ENGINE
function calculateTable() {

  let table = {};

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

  fixtures.forEach((f, i) => {

    let hgInput = document.getElementById("hg-" + f.id);
let agInput = document.getElementById("ag-" + f.id);

if (!hgInput || !agInput) return;

let hg = parseInt(hgInput.value) || 0;
let ag = parseInt(agInput.value) || 0;
    let home = table[f.home];
    let away = table[f.away];

    home.gf += hg;
    home.ga += ag;

    away.gf += ag;
    away.ga += hg;

    if (hg > ag) {
      home.w++; home.pts += 3;
      away.l++;
    } else if (ag > hg) {
      away.w++; away.pts += 3;
      home.l++;
    } else {
      home.d++; away.d++;
      home.pts += 1;
      away.pts += 1;
    }
  });

  let sorted = Object.entries(table).sort((a, b) => {
    return b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga);
  });

  renderTable(sorted);
}

// SHOW TABLE
function renderTable(sorted) {
  let html = "<table border='1' style='width:100%'><tr><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th></tr>";

  sorted.forEach(t => {
    html += `
      <tr>
        <td>${t[0]}</td>
        <td>${t[1].pts}</td>
        <td>${t[1].w}</td>
        <td>${t[1].d}</td>
        <td>${t[1].l}</td>
        <td>${t[1].gf}</td>
        <td>${t[1].ga}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("standings").innerHTML = html;
}

// shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
                   }

function shuffleArray(arr) {
  let copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
              }

