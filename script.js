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

function getTeamsByPot(potNumber) {
  return teams.map(t => t.name).filter(name => getPot(name) === potNumber);
}

// DRAW
function generateDraw() {
  fixtures = [];

  let matchId = 0;

  let pools = {
    1: shuffleArray(getTeamsByPot(1)),
    2: shuffleArray(getTeamsByPot(2)),
    3: shuffleArray(getTeamsByPot(3)),
    4: shuffleArray(getTeamsByPot(4))
  };

  let used = {};
  teams.forEach(t => used[t.name] = []);

  function pickOpponent(teamName, pot) {

    let candidates = pools[pot].filter(op =>
      op !== teamName &&
      !used[teamName].includes(op) &&
      used[op].length < 8
    );

    if (candidates.length === 0) return null;

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  for (let team of teams) {

    let teamName = team.name;

    let requiredPerPot = 2;

    for (let p = 1; p <= 4; p++) {

      let count = 0;

      while (count < requiredPerPot) {

        let opponent = pickOpponent(teamName, p);

        if (!opponent) break;

        if (used[teamName].length >= 8 || used[opponent].length >= 8) break;

        used[teamName].push(opponent);
        used[opponent].push(teamName);

        fixtures.push({
          id: matchId++,
          matchday: Math.ceil((used[teamName].length) / 4),
          home: teamName,
          away: opponent
        });

        count++;
      }
    }
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

    grouped[day].forEach(f => {

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

    html += `</div>`;
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

