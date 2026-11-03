// Exact truco probabilities by full enumeration (no sampling). Fractions are { num, den } in lowest terms plus a float `p`.
// These numbers feed the pages (envido, flor, "repartí una mano") and the bots.
import { DECK_40, combinations, binom } from '../cards/spanish.mjs';
import { POWER, envidoPoints, hasFlor } from './cards.mjs';
import { handWinner } from './game.mjs';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export function frac(num, den) {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0 || num < 0 || num > den) throw new Error('frac: bad fraction');
  const g = gcd(num, den) || 1;
  return { num: num / g, den: den / g, p: num / den };
}

function checkHand(hand) {
  if (!Array.isArray(hand) || hand.length !== 3 || new Set(hand).size !== 3 || !hand.every(c => DECK_40.includes(c))) throw new Error('a hand is three distinct cards of the 40-card deck');
}
const rest = used => DECK_40.filter(c => !used.includes(c));

// Distribution of envido points over all C(40,3) = 9880 hands. `flor`: true = a hand with flor is not an envido hand
// (counted under the key 'flor'); false = three of a suit count as 20 + the two highest (sin flor).
export function envidoDistribution({ flor }) {
  if (typeof flor !== 'boolean') throw new Error('envidoDistribution: flor must be given');
  const counts = {};
  let total = 0;
  combinations(DECK_40, 3, h => {
    total++;
    const k = flor && hasFlor(h) ? 'flor' : envidoPoints(h);
    counts[k] = (counts[k] || 0) + 1;
  });
  return { counts, total };
}

// Chance of being dealt flor: 4 suits x C(10,3) / C(40,3).
export function florChance() {
  return frac(4 * binom(10, 3), binom(40, 3));
}

// Every opponent hand from the 37 unseen cards (or fewer if `seen` lists more known cards), passed to fn.
function eachOpponentHand(myHand, seen, fn) {
  combinations(rest([...myHand, ...seen]), 3, fn);
}

// My envido against one random opponent hand (exact over C(37,3) = 7770). Ties go to the mano.
// Returns win/tie/lose fractions and the chance of winning the envido given who is mano.
export function envidoVsRandom(myHand, { mano, flor }) {
  checkHand(myHand);
  if (typeof mano !== 'boolean' || typeof flor !== 'boolean') throw new Error('envidoVsRandom: mano and flor must be given');
  const mine = envidoPoints(myHand);
  let less = 0, equal = 0, more = 0, oppFlor = 0, total = 0;
  eachOpponentHand(myHand, [], h => {
    total++;
    if (flor && hasFlor(h)) { oppFlor++; return; }
    const e = envidoPoints(h);
    if (e < mine) less++; else if (e === mine) equal++; else more++;
  });
  return {
    points: mine, total,
    less: frac(less, total), equal: frac(equal, total), more: frac(more, total), oppFlor: frac(oppFlor, total),
    win: frac(less + (mano ? equal : 0), total),
  };
}

// Chance that the opponent holds at least x envido points, given my hand (sin flor counting).
export function oppEnvidoAtLeast(myHand, x) {
  checkHand(myHand);
  let n = 0, total = 0;
  eachOpponentHand(myHand, [], h => { total++; if (envidoPoints(h) >= x) n++; });
  return frac(n, total);
}

// Chance that the opponent has flor, given my hand.
export function oppFlorChance(myHand) {
  checkHand(myHand);
  let n = 0, total = 0;
  eachOpponentHand(myHand, [], h => { total++; if (hasFlor(h)) n++; });
  return frac(n, total);
}

// Perfect-information solution of the bazas (no calls): both sides see all cards and play their best.
// left[seat] = powers still in hand, R = baza results so far (seat or -1), lead = who leads the current baza,
// table = powers already on the table in the current baza (null = not played). Returns the winning seat.
export function solveBazas(left, R, lead, table, mano) {
  const w = handWinner(R, mano);
  if (w !== null) return w;
  const actor = table[lead] === null ? lead : 1 - lead;
  const tried = new Set();
  let best = null;
  for (let i = 0; i < left[actor].length; i++) {
    const p = left[actor][i];
    if (tried.has(p)) continue;
    tried.add(p);
    const nl = [left[0], left[1]];
    nl[actor] = left[actor].filter((_, j) => j !== i);
    const t = [table[0], table[1]];
    t[actor] = p;
    let res;
    if (t[0] !== null && t[1] !== null) {
      const bw = t[0] === t[1] ? -1 : t[0] > t[1] ? 0 : 1;
      res = solveBazas(nl, [...R, bw], bw === -1 ? mano : bw, [null, null], mano);
    } else res = solveBazas(nl, R, lead, t, mano);
    if (res === actor) return actor;
    best = res;
  }
  return best;
}

// Chance that my hand wins the bazas against one random hand when both play perfectly with open cards (exact, 7770 hands).
// An upper-bound-style measure of hand strength for the "repartí una mano" tool; the honest name on a page is
// "con las cartas a la vista".
export function bazasVsRandom(myHand, { mano }) {
  checkHand(myHand);
  if (typeof mano !== 'boolean') throw new Error('bazasVsRandom: mano must be given');
  const mine = myHand.map(c => POWER[c]);
  let win = 0, total = 0;
  eachOpponentHand(myHand, [], h => {
    total++;
    if (solveBazas([mine, h.map(c => POWER[c])], [], mano ? 0 : 1, [null, null], mano ? 0 : 1) === 0) win++;
  });
  return frac(win, total);
}

// One card against one random unseen card: chance to win, tie (parda) or lose the baza (exact over 39 cards).
export function cardVsRandom(card) {
  if (!DECK_40.includes(card)) throw new Error('cardVsRandom: not a card');
  let w = 0, t = 0, l = 0;
  for (const c of DECK_40) if (c !== card) { if (POWER[card] > POWER[c]) w++; else if (POWER[card] === POWER[c]) t++; else l++; }
  return { win: frac(w, 39), tie: frac(t, 39), lose: frac(l, 39) };
}
