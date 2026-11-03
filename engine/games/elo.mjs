// Our own team rating for games without an official ranking we may use (pingalto /dota2): plain Elo over series results.
// Every finished series between two teams, oldest first; the winner takes K * (1 - expected) points from the loser, where
//   expected(A) = 1 / (1 + 10^((R_B - R_A) / 400)).
// A new team starts at START. The backtest scores every series of the last days with the ratings from before it was played:
// share of series won by the higher-rated team and the Brier score of the forecast, only when both teams already had MIN_PRIOR
// series (otherwise the forecast is a coin toss and says nothing). Pure functions, no randomness.
export const ELO = Object.freeze({ k: 32, start: 1500, minPrior: 5 });

export const eloExpect = (ra, rb) => 1 / (1 + 10 ** ((rb - ra) / 400));

// series: [{ t: ISO time, a: team id, b: team id, w: 0 if a won, 1 if b won }]. Returns { teams: Map id -> { r, n, w, l, last,
// hist: [[t, r]] }, test: { n, hit, brier } } for the series at or after testFrom (ISO time).
export function eloRun(series, { k = ELO.k, start = ELO.start, minPrior = ELO.minPrior, testFrom = null } = {}) {
  if (!Array.isArray(series)) throw new Error('elo: series must be a list');
  const teams = new Map();
  const team = id => { if (!teams.has(id)) teams.set(id, { r: start, n: 0, w: 0, l: 0, last: null, hist: [] }); return teams.get(id); };
  const list = series.slice().sort((x, y) => (x.t < y.t ? -1 : x.t > y.t ? 1 : 0));
  let n = 0, hit = 0, brier = 0;
  for (const s of list) {
    if (s.a === s.b || (s.w !== 0 && s.w !== 1) || !s.t) throw new Error('elo: bad series ' + JSON.stringify(s));
    const A = team(s.a), B = team(s.b);
    const e = eloExpect(A.r, B.r), sa = s.w === 0 ? 1 : 0;
    if (testFrom && s.t >= testFrom && A.n >= minPrior && B.n >= minPrior && A.r !== B.r) {
      n++; if ((e > 0.5) === (sa === 1)) hit++; brier += (e - sa) ** 2;
    }
    const d = k * (sa - e);
    A.r += d; B.r -= d;
    for (const [T, won] of [[A, sa === 1], [B, sa === 0]]) { T.n++; if (won) T.w++; else T.l++; T.last = s.t; T.hist.push([s.t, T.r]); }
  }
  return { teams, test: { n, hit, brier: n ? brier / n : null } };
}
