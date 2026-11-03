// Best-of-N series (pingalto /esports/series, /cs2, /cs2/major): from the chance of winning one map to the chance of winning
// the series, every final score, the expected number of maps, the chance from any score in the middle, and back. Exact:
// a dynamic program over the score (a, b); with the same chance on every map it equals the negative binomial sum
//   P(A wins a best of 2w-1) = sum_{k=0}^{w-1} C(w-1+k, k) p^w (1-p)^k,
// which the tests check. Maps are independent; a map has no draw. Swiss stage of a CS2 Major (Valve rulebook): three wins
// advance, three losses eliminate, elimination and advancement matches are best of three, the rest best of one; exact
// distribution of the final record. Pure functions, no randomness.
export const FORMATS = Object.freeze([1, 3, 5, 7]);

const prob = (n, v) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) throw new Error('series: ' + n + ' must be a probability 0..1, got ' + v); return v; };
const int = (n, v, lo = 0) => { if (!Number.isInteger(v) || v < lo) throw new Error('series: ' + n + ' must be an integer >= ' + lo + ', got ' + v); return v; };
const format = n => { if (!FORMATS.includes(n)) throw new Error('series: best of ' + n + ' is not one of ' + FORMATS.join(', ')); return n; };
export const winsNeeded = n => (format(n) + 1) / 2;

// Chance of every map: one number (same on all maps) or a list with one chance per map in the order they are played.
function mapChances(n, p) {
  if (Array.isArray(p)) {
    if (p.length !== n) throw new Error('series: ' + n + ' map chances needed, got ' + p.length);
    return p.map((x, i) => prob('map ' + (i + 1), x));
  }
  prob('p', p);
  return new Array(n).fill(p);
}

// Best of n from the score a:b (both below the wins needed). Returns { n, w, pA, pB, scores: [{ a, b, maps, probability }]
// (final scores, team A first, A's wins listed first), byLength: { maps: probability }, expectedMaps, played: [chance that
// map k is played] }.
export function series(n, p, { a = 0, b = 0 } = {}) {
  const w = winsNeeded(n), P = mapChances(n, p);
  int('a', a); int('b', b);
  if (a >= w || b >= w) throw new Error('series: the score ' + a + ':' + b + ' already ended a best of ' + n);
  const reach = new Map([[a + ':' + b, 1]]);
  const scores = [];
  const played = new Array(n).fill(0);
  for (let s = a + b; s < 2 * w - 1; s++) {
    for (let i = a; i <= s - b; i++) {
      const j = s - i, v = reach.get(i + ':' + j);
      if (!v || i >= w || j >= w) continue;
      played[s] += v;
      const q = P[s];
      for (const [ni, nj, pr] of [[i + 1, j, q], [i, j + 1, 1 - q]]) {
        const k = ni + ':' + nj;
        reach.set(k, (reach.get(k) || 0) + v * pr);
      }
    }
  }
  for (let j = b; j < w; j++) scores.push({ a: w, b: j, maps: w + j, probability: reach.get(w + ':' + j) || 0 });
  for (let i = w - 1; i >= a; i--) scores.push({ a: i, b: w, maps: w + i, probability: reach.get(i + ':' + w) || 0 });
  const pA = scores.filter(x => x.a === w).reduce((t, x) => t + x.probability, 0);
  const pB = scores.filter(x => x.b === w).reduce((t, x) => t + x.probability, 0);
  const byLength = {};
  for (const x of scores) byLength[x.maps] = (byLength[x.maps] || 0) + x.probability;
  const expectedMaps = scores.reduce((t, x) => t + x.maps * x.probability, 0);
  for (let k = 0; k < a + b; k++) played[k] = 1;
  return { n, w, pA, pB, scores, byLength, expectedMaps, played };
}

// Closed form for one chance on every map (negative binomial), used to lock the dynamic program.
export function closedForm(n, p) {
  const w = winsNeeded(n); prob('p', p);
  let c = 1, t = 0;
  for (let k = 0; k < w; k++) { if (k > 0) c = (c * (w - 1 + k)) / k; t += c * p ** w * (1 - p) ** k; }
  return t;
}

// Map chance that gives a series chance `target` in a best of n (same chance on every map). The series chance grows with the
// map chance, so bisection finds it; 60 halvings leave an error below 1e-15.
export function mapChanceFor(n, target) {
  format(n); prob('target', target);
  if (target === 0 || target === 1 || n === 1) return target;
  let lo = 0, hi = 1;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (closedForm(n, mid) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// Series chance against map chance for a chart: points (p, P(series)) on a grid of `steps` + 1 values of p.
export function curve(n, steps = 50) {
  int('steps', steps, 2);
  return Array.from({ length: steps + 1 }, (_, i) => { const p = i / steps; return [p, closedForm(n, p)]; });
}

// Swiss stage of a CS2 Major: a team plays until `wins` wins or `losses` losses. A match where a win would advance the team or
// a loss would eliminate it is a best of three, the others a best of one (Valve, Major Supplemental Rulebook). The team wins
// each map with chance p (same against everybody). Returns { records: [{ w, l, probability }] (3-0 first), advance,
// eliminate, nodes: [{ w, l, probability of playing at that record, bo3 }], matches: expected matches, bo3: expected
// best-of-three matches, pBo1, pBo3 }.
export function swiss(p, { wins = 3, losses = 3, decider = 3, other = 1 } = {}) {
  prob('p', p); int('wins', wins, 1); int('losses', losses, 1); format(decider); format(other);
  const pDec = series(decider, p).pA, pOther = series(other, p).pA;
  const reach = new Map([['0:0', 1]]);
  const records = [], nodes = [];
  let matches = 0, bo3 = 0;
  for (let s = 0; s < wins + losses - 1; s++) {
    for (let w = 0; w <= s; w++) {
      const l = s - w, v = reach.get(w + ':' + l);
      if (!v || w >= wins || l >= losses) continue;
      const big = w === wins - 1 || l === losses - 1;
      const q = big ? pDec : pOther;
      nodes.push({ w, l, probability: v, bo3: big });
      matches += v; if (big) bo3 += v;
      for (const [nw, nl, pr] of [[w + 1, l, q], [w, l + 1, 1 - q]]) { const k = nw + ':' + nl; reach.set(k, (reach.get(k) || 0) + v * pr); }
    }
  }
  for (let l = 0; l < losses; l++) records.push({ w: wins, l, probability: reach.get(wins + ':' + l) || 0 });
  for (let w = wins - 1; w >= 0; w--) records.push({ w, l: losses, probability: reach.get(w + ':' + losses) || 0 });
  const advance = records.filter(r => r.w === wins).reduce((t, r) => t + r.probability, 0);
  return { records, nodes, advance, eliminate: 1 - advance, matches, bo3, pBo1: pOther, pBo3: pDec };
}

// How many teams end with each record in a Swiss stage of `teams` teams where every round pairs teams of the same record (each
// group of the same record splits in half). Needs even groups at every round, as in a 16-team stage. → [{ w, l, teams }].
export function swissCounts(teams, { wins = 3, losses = 3 } = {}) {
  int('teams', teams, 2);
  let groups = new Map([['0:0', teams]]);
  const done = [];
  while (groups.size) {
    const next = new Map();
    for (const [k, n] of groups) {
      const [w, l] = k.split(':').map(Number);
      if (n % 2) throw new Error('series: odd group of ' + n + ' at ' + w + '-' + l);
      for (const [nw, nl] of [[w + 1, l], [w, l + 1]]) {
        if (nw === wins || nl === losses) done.push({ w: nw, l: nl, teams: n / 2 });
        else { const nk = nw + ':' + nl; next.set(nk, (next.get(nk) || 0) + n / 2); }
      }
    }
    groups = next;
  }
  const out = new Map();
  for (const d of done) { const k = d.w + ':' + d.l; out.set(k, (out.get(k) || 0) + d.teams); }
  return [...out].map(([k, n]) => { const [w, l] = k.split(':').map(Number); return { w, l, teams: n }; }).sort((a, b) => (b.w - b.l) - (a.w - a.l));
}
