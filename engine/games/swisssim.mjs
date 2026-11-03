// A whole 16-team Swiss stage with the pairing rules of Valve's CS2 Major rulebook (pingalto /esports/sistema-suizo):
// round 1 is seed 1 v 9, 2 v 10 ... 8 v 16; later rounds pair teams of the same W-L record; inside a record the order is
// difficulty score (Buchholz: current wins minus current losses of every opponent faced), then the initial seed; in rounds 2 and 3
// the highest team meets the lowest one available without a rematch; in later rounds a group of six takes the top-most row of
// Valve's priority table that has no rematch. Three wins advance, three losses eliminate; a match that can advance or eliminate a
// team is a best of three, the rest best of one. Teams play maps with a chance from their ratings (pMap). Monte Carlo with a
// seeded generator, so the same input always gives the same numbers. Pure, no DOM.
export const R1 = Object.freeze([[1, 9], [2, 10], [3, 11], [4, 12], [5, 13], [6, 14], [7, 15], [8, 16]]);
export const TABLE6 = Object.freeze([
  [[1, 6], [2, 5], [3, 4]], [[1, 6], [2, 4], [3, 5]], [[1, 5], [2, 6], [3, 4]], [[1, 5], [2, 4], [3, 6]], [[1, 4], [2, 6], [3, 5]],
  [[1, 4], [2, 5], [3, 6]], [[1, 6], [2, 3], [4, 5]], [[1, 5], [2, 3], [4, 6]], [[1, 3], [2, 6], [4, 5]], [[1, 3], [2, 5], [4, 6]],
  [[1, 4], [2, 3], [5, 6]], [[1, 3], [2, 4], [5, 6]], [[1, 2], [3, 6], [4, 5]], [[1, 2], [3, 5], [4, 6]], [[1, 2], [3, 4], [5, 6]],
]);
export const RECORDS = Object.freeze(['3-0', '3-1', '3-2', '2-3', '1-3', '0-3']);

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const bo3 = p => p * p * (3 - 2 * p);

// One stage. pMap(i, j): chance that team i (0-based seed order) wins a map against team j. Returns [{ w, l, opp: [j] }].
// Rounds 2 and 3: the highest team takes the lowest one available that does not make a rematch, and so on down the group; if
// that choice leaves the rest of the group without a rematch-free pairing, the next lowest is tried (Valve: "if possible").
function pairUp(g, met) {
  if (!g.length) return [];
  const [top, ...rest] = g;
  for (let k = rest.length - 1; k >= 0; k--) {
    if (met(top, rest[k])) continue;
    const tail = pairUp(rest.filter((_, i) => i !== k), met);
    if (tail) return [[top, rest[k]], ...tail];
  }
  return null;
}
export function playStage(pMap, rand) {
  const T = Array.from({ length: 16 }, () => ({ w: 0, l: 0, opp: [] }));
  const met = (i, j) => T[i].opp.includes(j);
  const play = pairs => {
    for (const [i, j] of pairs) {
      const p = pMap(i, j), big = T[i].w === 2 || T[i].l === 2;
      const win = rand() < (big ? bo3(p) : p);
      T[i].opp.push(j); T[j].opp.push(i);
      if (win) { T[i].w++; T[j].l++; } else { T[j].w++; T[i].l++; }
    }
  };
  play(R1.map(([a, b]) => [a - 1, b - 1]));
  for (let round = 2; round <= 5; round++) {
    const diff = i => T[i].opp.reduce((t, j) => t + T[j].w - T[j].l, 0);
    const groups = new Map();
    for (let i = 0; i < 16; i++) if (T[i].w < 3 && T[i].l < 3) { const k = T[i].w + ':' + T[i].l; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); }
    const pairs = [];
    for (const g of groups.values()) {
      const d = new Map(g.map(i => [i, diff(i)]));
      g.sort((a, b) => d.get(b) - d.get(a) || a - b);
      if (round >= 4 && g.length === 6) {
        const row = TABLE6.find(r => r.every(([a, b]) => !met(g[a - 1], g[b - 1]))) || TABLE6[0];
        for (const [a, b] of row) pairs.push([g[a - 1], g[b - 1]]);
      } else {
        const best = pairUp(g, met) || pairUp(g, () => false);
        for (const x of best) pairs.push(x);
      }
    }
    play(pairs);
  }
  return T;
}

// Many stages: for each team the chance of every final record and of advancing. ratings: numbers; chance(ra, rb) gives the map
// chance of a team with rating ra against rb. → [{ rec: { '3-0': p, ... }, advance }]
export function simulate(ratings, chance, { runs = 20000, seed = 2026 } = {}) {
  if (!Array.isArray(ratings) || ratings.length !== 16 || !ratings.every(Number.isFinite)) throw new Error('swisssim: 16 ratings needed');
  const P = ratings.map(a => ratings.map(b => chance(a, b)));
  const rand = rng(seed);
  const count = Array.from({ length: 16 }, () => Object.fromEntries(RECORDS.map(r => [r, 0])));
  for (let k = 0; k < runs; k++) {
    const T = playStage((i, j) => P[i][j], rand);
    let adv = 0;
    for (let i = 0; i < 16; i++) { count[i][T[i].w + '-' + T[i].l]++; if (T[i].w === 3) adv++; }
    if (adv !== 8) throw new Error('swisssim: ' + adv + ' teams advanced');
  }
  return count.map(c => {
    const rec = Object.fromEntries(RECORDS.map(r => [r, c[r] / runs]));
    return { rec, advance: rec['3-0'] + rec['3-1'] + rec['3-2'] };
  });
}
