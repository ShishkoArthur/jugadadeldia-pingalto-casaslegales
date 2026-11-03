// Chinchon melds ("juegos"): groups of three or four cards of one number, and escaleras of three or more cards of one suit
// in a row (the ace only low: it goes with the two and the three). Comodines stand for any card within the rule set's limit.
// Exact searches over the hand (at most eight cards, so every subset is checked):
//   meldOf(r, cards)        the meld these cards make, or null
//   bestSplit(r, hand)      the melds that leave the fewest points out (and the chinchon check)
//   canCut(r, hand)         whether these seven cards may close the hand under rules.cut, and what the cutter scores
//   bestShow(r, hand, table) melds plus cards laid on the melds already on the table, fewest points left
import { isJoker, numOf, suitOf, rankOf, cardValue, NUMBERS } from './rules.mjs';

const jokersOk = (r, J, real) => (J === 0 ? true : r.jokers === 0 ? false : r.jokersPerMeld === 1 ? J <= 1 : real >= 2);

export function meldOf(r, cards) {
  const n = cards.length;
  if (n < 3) return null;
  const real = cards.filter(c => !isJoker(c)), J = n - real.length;
  if (!real.length || !jokersOk(r, J, real.length)) return null;
  if (n <= 4 && real.every(c => numOf(c) === numOf(real[0]))) return { kind: 'group', number: numOf(real[0]), cards: cards.slice() };
  const s = suitOf(real[0]);
  if (!real.every(c => suitOf(c) === s)) return null;
  const ranks = real.map(c => rankOf(r, c)).sort((a, b) => a - b);
  for (let i = 1; i < ranks.length; i++) if (ranks[i] === ranks[i - 1]) return null;
  const top = NUMBERS[r.deck].length - 1, gaps = ranks[ranks.length - 1] - ranks[0] + 1 - ranks.length;
  if (gaps > J || n > top + 1) return null;
  let lo = ranks[0], hi = ranks[ranks.length - 1];
  for (let extra = J - gaps; extra > 0; extra--) { if (hi < top) hi++; else lo--; }
  return { kind: 'escalera', suit: s, lo, hi, cards: cards.slice() };
}

const CACHE = new Map();
const MAX_CACHE = 200000;
// All valid meld masks of a hand (bit i = hand[i]). Same test as meldOf, without allocating per subset.
function meldMasks(r, hand) {
  const n = hand.length, out = [], top = NUMBERS[r.deck].length - 1;
  const J = hand.map(isJoker), num = hand.map(c => (isJoker(c) ? 0 : numOf(c))), su = hand.map(c => (isJoker(c) ? '' : suitOf(c))), rk = hand.map(c => (isJoker(c) ? -1 : rankOf(r, c)));
  for (let m = 7; m < 1 << n; m++) {
    let k = 0, jk = 0, first = -1, sameNum = true, sameSuit = true, lo = 99, hi = -1, ranks = 0, dup = false;
    for (let i = 0; i < n; i++) {
      if (!(m & (1 << i))) continue;
      k++;
      if (J[i]) { jk++; continue; }
      if (first < 0) first = i;
      else { if (num[i] !== num[first]) sameNum = false; if (su[i] !== su[first]) sameSuit = false; }
      if (ranks & (1 << rk[i])) dup = true;
      ranks |= 1 << rk[i];
      if (rk[i] < lo) lo = rk[i];
      if (rk[i] > hi) hi = rk[i];
    }
    if (k < 3 || first < 0 || !jokersOk(r, jk, k - jk)) continue;
    if (sameNum && k <= 4) { out.push(m); continue; }
    if (!sameSuit || dup) continue;
    if (hi - lo + 1 - (k - jk) <= jk && k <= top + 1) out.push(m);
  }
  return out;
}

// Fewest points left out of melds, with at most `maxLeft` cards left out (Infinity when impossible).
function solve(r, hand, maxLeft) {
  const n = hand.length, masks = meldMasks(r, hand), vals = hand.map(c => cardValue(r, c));
  const memo = new Map();
  const f = (mask, k) => {
    if (!mask) return { v: 0, melds: [], left: [] };
    const key = mask * 16 + k;
    if (memo.has(key)) return memo.get(key);
    const i = 31 - Math.clz32(mask & -mask), bit = 1 << i;
    let best = { v: Infinity, melds: [], left: [] };
    if (k > 0) { const s = f(mask ^ bit, k - 1); if (s.v + vals[i] < best.v) best = { v: s.v + vals[i], melds: s.melds, left: [i, ...s.left] }; }
    for (const m of masks) if (m & bit && (m & ~mask) === 0) { const s = f(mask ^ m, k); if (s.v < best.v) best = { v: s.v, melds: [m, ...s.melds], left: s.left }; }
    memo.set(key, best);
    return best;
  };
  const b = f((1 << n) - 1, Math.min(maxLeft, n));
  return { points: b.v, melds: b.melds.map(m => hand.filter((_, i) => m & (1 << i))), left: b.left.map(i => hand[i]) };
}

export function bestSplit(r, hand) {
  const key = r.name + '|' + hand.slice().sort().join(',');
  let v = CACHE.get(key);
  if (v) return v;
  const s = solve(r, hand, hand.length);
  const all = hand.length === 7 ? meldOf(r, hand) : null;
  v = { ...s, chinchon: !!(all && all.kind === 'escalera'), chinchonJokers: all && all.kind === 'escalera' ? hand.filter(isJoker).length : null };
  if (CACHE.size > MAX_CACHE) CACHE.clear();
  CACHE.set(key, v);
  return v;
}

// Whether seven cards may close the hand, and the cutter's melds and points (before the all-melded and chinchon bonuses).
export function canCut(r, hand) {
  if (hand.length !== 7) throw new Error('chinchon canCut: seven cards');
  if (r.cut === 'sum-at-most-5') { const s = bestSplit(r, hand); return { ok: s.points <= 5, ...s }; }
  const s = solve(r, hand, 1);
  const b = bestSplit(r, hand);
  return { ok: s.points <= 4, points: s.points, melds: s.melds, left: s.left, chinchon: b.chinchon, chinchonJokers: b.chinchonJokers };
}

// Can a card go on a meld of the table? Comodines are never laid on other players' melds (Juegos Bonaerenses 5.3).
function layOn(r, meld, c) {
  if (isJoker(c)) return false;
  if (meld.kind === 'group') return meld.cards.length < 4 && numOf(c) === meld.number;
  if (suitOf(c) !== meld.suit) return false;
  const k = rankOf(r, c);
  return k === meld.lo - 1 || k === meld.hi + 1;
}
function addTo(r, meld, c) {
  const m = { ...meld, cards: [...meld.cards, c] };
  if (m.kind === 'escalera') { const k = rankOf(r, c); if (k < m.lo) m.lo = k; else m.hi = k; }
  return m;
}

// Every way to split a hand into melds and loose cards.
function splits(r, hand) {
  const n = hand.length, masks = meldMasks(r, hand), out = [];
  const rec = (mask, melds, left) => {
    if (!mask) { out.push({ melds, left }); return; }
    const i = 31 - Math.clz32(mask & -mask), bit = 1 << i;
    rec(mask ^ bit, melds, [...left, hand[i]]);
    for (const m of masks) if (m & bit && (m & ~mask) === 0) rec(mask ^ m, [...melds, hand.filter((_, j) => m & (1 << j))], left);
  };
  rec((1 << n) - 1, [], []);
  return out;
}

// Show a hand after a cut: own melds, then loose cards laid on the table melds (repeated while any fits). Returns the
// choice with the fewest points left and the table melds after the lay-offs.
export function bestShow(r, hand, table, allowLayOff) {
  let best = null;
  for (const sp of splits(r, hand)) {
    let tbl = table.map(m => ({ ...m, cards: m.cards.slice() }));
    let left = sp.left.slice();
    const laid = [];
    if (allowLayOff) {
      for (let again = true; again;) {
        again = false;
        for (const c of left) {
          const t = tbl.findIndex(m => layOn(r, m, c));
          if (t >= 0) { tbl[t] = addTo(r, tbl[t], c); laid.push({ card: c, on: t }); left = left.filter(x => x !== c); again = true; break; }
        }
      }
    }
    const points = left.reduce((s, c) => s + cardValue(r, c), 0);
    if (!best || points < best.points) best = { points, melds: sp.melds, laid, left, table: tbl };
    if (best.points === 0) break;
  }
  return best;
}
