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
return a < b ? ${a}${b} : ${b}${a};
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

/* ---------------- AUTO FILL ---------------- */

function autoFillResults() {
if (!fixtures.length) {
alert("No fixtures generated yet.");
return;
}

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

const hg = document.getElementById(hg-${f.id});
const ag = document.getElementById(ag-${f.id});

if (hg) hg.value = h;
if (ag) ag.value = a;

});
}

/* ---------------- DRAW ---------------- */

function generateDraw() {
fixtures = [];
currentMatchday = 1; // 🔴 IMPORTANT RESET

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

/* ---------------- FIXTURES ---------------- */

function renderFixtures() {
const box = document.getElementById("fixtures");
if (!box) return;

const dayFixtures = fixtures.filter(f => f.matchday === currentMatchday);

let html =   <div style="margin:16px; padding:12px; background:#1b1b1b; border-radius:10px;">   <button onclick="prevMatchday()">Prev</button>   <b style="margin:0 10px;">Matchday ${currentMatchday}</b>   <button onclick="nextMatchday()">Next</button>  ;

dayFixtures.forEach(f => {
html +=   <div style="margin:8px 0;">   ${f.home}   <input id="hg-${f.id}" type="number" value="" style="width:50px;">   -   <input id="ag-${f.id}" type="number" value="" style="width:50px;">   ${f.away}   </div>  ;
});

html += </div>;
box.innerHTML = html;
}

/* ---------------- TABLE (FIXED) ---------------- */

function calculateTable() {
const table = {};

teams.forEach(t => {
table[t.name] = { pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
});

fixtures.forEach(f => {
const hgEl = document.getElementById(hg-${f.id});
const agEl = document.getElementById(ag-${f.id});

if (!hgEl || !agEl) return;

const hgRaw = hgEl.value;
const agRaw = agEl.value;

// 🔴 STRICT CHECK: ignore unplayed matches
if (hgRaw === "" || agRaw === "") return;

const h = Number(hgRaw);
const a = Number(agRaw);

if (Number.isNaN(h) || Number.isNaN(a)) return;

const home = table[f.home];
const away = table[f.away];

home.gf += h;
home.ga += a;

away.gf += a;
away.ga += h;

if (h > a) {
home.w++; home.pts += 3; away.l++;
} else if (a > h) {
away.w++; away.pts += 3; home.l++;
} else {
home.d++; away.d++;
home.pts++; away.pts++;
}

});

const sorted = Object.entries(table).sort((a, b) =>
b[1].pts - a[1].pts ||
(b[1].gf - b[1].ga) - (a[1].gf - a[1].ga)
);

renderTable(sorted);
}

/* ---------------- TABLE UI ---------------- */

function renderTable(sorted) {
const box = document.getElementById("standings");

let html = "<table border='1' style='width:100%'>";
html += "<tr><th>#</th><th>Team</th><th>Pts</th><th>W</th><th>D</th><th>L</th></tr>";

sorted.forEach(([name, s], i) => {
let style = "";

if (i < 8) style = "background:green;color:white;";
else if (i < 24) style = "background:gold;color:black;";

html += `<tr style="${style}">

  <td>${i + 1}</td>    
  <td>${name}</td>    
  <td>${s.pts}</td>    
  <td>${s.w}</td>    
  <td>${s.d}</td>    
  <td>${s.l}</td>    
</tr>`;  });

html += "</table>";
box.innerHTML = html;
}

/* ---------------- GLOBAL ---------------- */

window.autoFillResults = autoFillResults;
window.generateDraw = generateDraw;
window.calculateTable = calculateTable;
window.prevMatchday = prevMatchday;
window.nextMatchday = nextMatchday;
