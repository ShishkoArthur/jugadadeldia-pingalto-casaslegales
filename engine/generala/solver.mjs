// Generala scoring and the best play by exact probabilities. A turn is up to three throws of five dice; after each throw
// the player keeps any of the dice and throws the rest, or scores the roll in an open box.
//
// All dice outcomes are exact: 252 sorted rolls, 462 kept sub-multisets, and for each kept set the multinomial chance of
// every result (keepOutcomes gives them as fractions). On top of that:
//   solver(rules, 'game')  maximizes the expected final total of the sheet (dynamic programming over the open boxes; with a
//                          doble box also over "generala already scored"). The instant win of a generala servida does not
//                          depend on any decision (it is the first throw), so it is left out of the expectation.
//   solver(rules, 'turn')  maximizes the expected points of this turn only (the greedy player).
//   solver(rules, 'additive') values a sheet as the sum over its open boxes of what each box is worth alone (exact
//                          expectation with only that box open): a cheap middle player.
// options(sheet, dice, throwsDone) lists every choice (score a box, or keep some dice and throw again) with its expected
// value, best first: the "where should I score" help and the "where did you leave the best play" review.
import { handOf } from '../lottery/dice.mjs';
import { frac } from '../lottery/exact.mjs';
import { validateRules, boxesOf } from './rules.mjs';

const POW6 = [1, 6, 36, 216, 1296, 7776, 46656];
const FACT = [1, 1, 2, 6, 24, 120];
const keyOf = c => c[0] + 6 * c[1] + 36 * c[2] + 216 * c[3] + 1296 * c[4] + 7776 * c[5];
const countsOf = dice => { const c = [0, 0, 0, 0, 0, 0]; for (const v of dice) c[v - 1]++; return c; };
const diceOf = c => c.flatMap((n, f) => Array(n).fill(f + 1));

function multisets(size) {
  const out = [];
  const rec = (f, left, c) => {
    if (f === 5) { c[5] = left; out.push(c.slice()); return; }
    for (let n = left; n >= 0; n--) { c[f] = n; rec(f + 1, left - n, c); }
  };
  rec(0, size, [0, 0, 0, 0, 0, 0]);
  return out;
}
const ways = c => FACT[c.reduce((a, b) => a + b, 0)] / c.reduce((a, n) => a * FACT[n], 1);

// Rule-independent tables, built once.
const T = (() => {
  const rolls = multisets(5), rollIdx = new Map(rolls.map((c, i) => [keyOf(c), i]));
  const keeps = [0, 1, 2, 3, 4, 5].flatMap(multisets), keepIdx = new Map(keeps.map((c, i) => [keyOf(c), i]));
  const bySize = [0, 1, 2, 3, 4, 5].map(multisets);
  const trans = keeps.map(k => {
    const m = 5 - k.reduce((a, b) => a + b, 0), to = [], num = [];
    for (const o of bySize[m]) { to.push(rollIdx.get(keyOf(k.map((n, f) => n + o[f])))); num.push(ways(o)); }
    return { to: Int16Array.from(to), p: Float64Array.from(num.map(w => w / POW6[m])), num, den: POW6[m] };
  });
  const rollKeeps = rolls.map(c => {
    const out = [];
    const rec = (f, k) => {
      if (f === 6) { out.push(keepIdx.get(keyOf(k))); return; }
      for (let n = 0; n <= c[f]; n++) { k[f] = n; rec(f + 1, k); }
    };
    rec(0, [0, 0, 0, 0, 0, 0]);
    return Int16Array.from(out);
  });
  return { rolls, rollIdx, keeps, keepIdx, trans, rollKeeps, fresh: keepIdx.get(0) };
})();

export const ROLL_COUNT = T.rolls.length;
export const KEEP_COUNT = T.keeps.length;

// Exact outcomes of throwing the dice not kept: [{ dice (sorted five), p (fraction) }].
export function keepOutcomes(keep) {
  if (!Array.isArray(keep) || keep.length > 5 || keep.some(v => !Number.isInteger(v) || v < 1 || v > 6)) throw new Error('keepOutcomes: keep is up to five dice 1-6');
  const t = T.trans[T.keepIdx.get(keyOf(countsOf(keep)))];
  return Array.from(t.to, (r, i) => ({ dice: diceOf(T.rolls[r]), p: frac(BigInt(t.num[i]), BigInt(t.den)) }));
}

// Points of a roll in a box. throwsDone 1 = servida (bonus on escalera, full, poker). generalaScored: the generala box holds
// points (needed by the doble box).
export function boxScore(rules, box, dice, throwsDone, generalaScored) {
  if (/^[1-6]$/.test(box)) { const n = +box; return n * dice.filter(v => v === n).length; }
  const h = handOf(dice, rules.straights);
  if (box === 'doble') return h === 'generala' && generalaScored && rules.doble !== null ? rules.doble : 0;
  if (box === 'generala') return h === 'generala' ? rules.generala : 0;
  if (box === 'escalera' || box === 'full' || box === 'poker') return h === box ? rules[box] + (throwsDone === 1 ? rules.servidaBonus : 0) : 0;
  throw new Error('generala: unknown box ' + box);
}

const CACHE = new Map();
export function solver(rules, horizon) {
  const r = validateRules(rules);
  if (!['game', 'turn', 'additive'].includes(horizon)) throw new Error('generala solver: horizon is "game", "turn" or "additive"');
  const ck = horizon + JSON.stringify(r);
  if (CACHE.has(ck)) return CACHE.get(ck);
  const boxes = boxesOf(r), nb = boxes.length, full = (1 << nb) - 1, gi = boxes.indexOf('generala'), di = boxes.indexOf('doble');
  const sc = boxes.map(b => [1, 2].map(t => T.rolls.map(c => {
    const d = diceOf(c);
    return b === 'doble' ? (handOf(d, r.straights) === 'generala' ? r.doble : 0) : boxScore(r, b, d, t, false);
  })));
  const E = new Float64Array(2 << nb);
  const sid = (mask, g) => mask | (di >= 0 && g ? 1 << nb : 0);
  const V1 = new Float64Array(ROLL_COUNT), V2 = new Float64Array(ROLL_COUNT), V3 = new Float64Array(ROLL_COUNT);
  const EK2 = new Float64Array(KEEP_COUNT), EK3 = new Float64Array(KEEP_COUNT);
  const scoreOf = (i, t, ri, g) => (i === di && !g ? 0 : sc[i][t][ri]);
  const nextOf = (mask, g, i, s) => sid(mask & ~(1 << i), g || (i === gi && s > 0));
  const bestScore = (mask, g, ri, t) => {
    let b = -Infinity;
    for (let i = 0; i < nb; i++) if (mask & (1 << i)) { const s = scoreOf(i, t, ri, g), v = s + (horizon === 'turn' ? 0 : E[nextOf(mask, g, i, s)]); if (v > b) b = v; }
    return b;
  };
  const expect = (V, EK) => {
    for (let k = 0; k < KEEP_COUNT; k++) { const t = T.trans[k]; let s = 0; for (let j = 0; j < t.to.length; j++) s += t.p[j] * V[t.to[j]]; EK[k] = s; }
  };
  const bestKeep = (EK, ri) => { let b = -Infinity; for (const k of T.rollKeeps[ri]) if (EK[k] > b) b = EK[k]; return b; };
  const turn = (mask, g) => {
    for (let ri = 0; ri < ROLL_COUNT; ri++) V3[ri] = bestScore(mask, g, ri, 1);
    expect(V3, EK3);
    for (let ri = 0; ri < ROLL_COUNT; ri++) V2[ri] = Math.max(bestScore(mask, g, ri, 1), bestKeep(EK3, ri));
    expect(V2, EK2);
    let e = 0;
    const f = T.trans[T.fresh];
    for (let ri = 0; ri < ROLL_COUNT; ri++) V1[ri] = Math.max(bestScore(mask, g, ri, 0), bestKeep(EK2, ri));
    for (let j = 0; j < f.to.length; j++) e += f.p[j] * V1[f.to[j]];
    return e;
  };
  if (horizon === 'game') {
    const masks = Array.from({ length: full + 1 }, (_, m) => m).sort((a, b) => popcount(a) - popcount(b) || a - b);
    for (const m of masks) {
      if (m === 0) continue;
      E[sid(m, false)] = turn(m, false);
      if (di >= 0) E[sid(m, true)] = turn(m, true);
    }
  }
  if (horizon === 'additive') {
    const one = [false, true].map(g => boxes.map((_, i) => turn(1 << i, g)));
    for (let m = 1; m <= full; m++) for (const g of di >= 0 ? [false, true] : [false]) {
      let t = 0;
      for (let i = 0; i < nb; i++) if (m & (1 << i)) t += one[g ? 1 : 0][i];
      E[sid(m, g)] = t;
    }
  }
  const api = {
    rules: r, horizon, boxes,
    // Expected final total from an empty sheet (game) under best play, generala servida left out (see above).
    expectedTotal: horizon === 'game' ? E[sid(full, false)] : null,
    expectedRest(sheet) { const { mask, g } = stateOf(sheet); return horizon === 'turn' ? null : E[sid(mask, g)]; },
    options(sheet, dice, throwsDone) {
      const { mask, g } = stateOf(sheet);
      if (!mask) throw new Error('generala: the sheet is full');
      if (!Number.isInteger(throwsDone) || throwsDone < 1 || throwsDone > 3) throw new Error('generala: throwsDone is 1, 2 or 3');
      const ri = T.rollIdx.get(keyOf(countsOf(dice)));
      if (ri === undefined || dice.length !== 5) throw new Error('generala: five dice 1-6');
      turn(mask, g);
      const out = [];
      for (let i = 0; i < nb; i++) if (mask & (1 << i)) {
        const pts = scoreOf(i, throwsDone === 1 ? 0 : 1, ri, g);
        out.push({ type: 'score', box: boxes[i], points: pts, ev: pts + (horizon === 'turn' ? 0 : E[nextOf(mask, g, i, pts)]) });
      }
      if (throwsDone < 3) {
        const EK = throwsDone === 1 ? EK2 : EK3;
        for (const k of T.rollKeeps[ri]) out.push({ type: 'roll', keep: diceOf(T.keeps[k]), ev: EK[k] });
      }
      return out.sort((a, b) => b.ev - a.ev || (a.type === 'score' ? -1 : 1));
    },
  };
  function stateOf(sheet) {
    let mask = 0;
    boxes.forEach((b, i) => { if (!(b in sheet)) throw new Error('generala: sheet misses box ' + b); if (sheet[b] === null) mask |= 1 << i; });
    return { mask, g: di >= 0 && sheet.generala !== null && sheet.generala > 0 };
  }
  CACHE.set(ck, api);
  return api;
}
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>>= 1; } return c; };
