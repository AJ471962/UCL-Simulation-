let teams = [
  // POT 1
  { name: "Real Madrid", pot: 1 },
  { name: "Manchester City", pot: 1 },
  { name: "Paris Saint-Germain", pot: 1 },
  { name: "Bayern Munich", pot: 1 },
  { name: "Inter Milan", pot: 1 },
  { name: "Arsenal", pot: 1 },
  { name: "Barcelona", pot: 1 },
  { name: "Liverpool", pot: 1 },
  { name: "Chelsea", pot: 1 },

  // POT 2
  { name: "Manchester United", pot: 2 },
  { name: "Borussia Dortmund", pot: 2 },
  { name: "Porto", pot: 2 },
  { name: "Aston Villa", pot: 2 },
  { name: "Bayer Leverkusen", pot: 2 },
  { name: "Napoli", pot: 2 },
  { name: "Benfica", pot: 2 },
  { name: "Atletico Madrid", pot: 2 },
  { name: "Real Betis", pot: 2 },

  // POT 3
  { name: "Feyenoord", pot: 3 },
  { name: "RB Leipzig", pot: 3 },
  { name: "Shakhtar Donetsk", pot: 3 },
  { name: "Galatasaray", pot: 3 },
  { name: "Villarreal", pot: 3 },
  { name: "Lille", pot: 3 },
  { name: "Sporting CP", pot: 3 },
  { name: "AC Milan", pot: 3 },
  { name: "Juventus", pot: 3 },

  // POT 4
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

// SHOW TEAMS BY POT
function renderTeams() {
  let html = "";

  for (let p = 1; p <= 4; p++) {
    html += `<h2>Pot ${p}</h2>`;

    teams
      .filter(t => t.pot === p)
      .forEach((t, index) => {
        html += `<p>${t.name}</p>`;
      });
  }

  document.getElementById("teamList").innerHTML = html;
}

// SHUFFLE FUNCTION
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// UCL STYLE LEAGUE PHASE DRAW (SIMPLIFIED BUT REAL STRUCTURE)
function generateDraw() {
  fixtures = [];

  let pot1 = shuffleArray(teams.filter(t => t.pot === 1));
  let pot2 = shuffleArray(teams.filter(t => t.pot === 2));
  let pot3 = shuffleArray(teams.filter(t => t.pot === 3));
  let pot4 = shuffleArray(teams.filter(t => t.pot === 4));

  let allPots = [pot1, pot2, pot3, pot4];

  // Each team gets 2 opponents per pot (simplified structure)
  for (let i = 0; i < pot1.length; i++) {
    let home = pot1[i];

    let opponents = [
      pot2[i],
      pot3[i],
      pot4[i]
    ];

    opponents.forEach(away => {
      if (away) {
        fixtures.push({
          home: home.name,
          away: away.name
        });
      }
    });
  }

  renderFixtures();
}

// SHOW FIXTURES
function renderFixtures() {
  let html = "<h2>Fixtures</h2>";

  fixtures.forEach((f, i) => {
    html += `<p>${i + 1}. ${f.home} vs ${f.away}</p>`;
  });

  document.getElementById("fixtures").innerHTML = html;
}

// helper
function shuffleArray(arr) {
  let copy = [...arr];
  shuffle(copy);
  return copy;
}

// INIT
renderTeams();
