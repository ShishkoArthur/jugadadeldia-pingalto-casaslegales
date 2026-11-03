// Dice: a roller for the site (any rng from engine/lottery/rng.mjs - cryptoRng() on the page, a seeded one in tests) and exact
// generala probabilities. Generala is a folk game with house variants, so its hands are a rule set chosen by the caller
// (GENERALA below); there is no default and no regulation to cite - the counting is pure combinatorics over 6^5 rolls.
import { fail, int, frac, ZERO, ONE, add, mul, sum, oneIn } from './exact.mjs';

export function rollDice({ dice, sides, rng } = {}) {
  int(dice, 'dice', 1, 100); int(sides, 'sides', 2, 1000);
  if (!rng || typeof rng.int !== 'function') fail('MISSING', 'rollDice: rng is required (cryptoRng() or xoshiro128ss(seed))');
  return Array.from({ length: dice }, () => rng.int(sides) + 1);
}

// Straights accepted by each house rule. 'escalera-12345-23456': 1-2-3-4-5 and 2-3-4-5-6; 'escalera-con-as-arriba' also
// 3-4-5-6-1 (the ace counted after the six), a variant played in Argentina.
export const GENERALA = Object.freeze({
  'escalera-12345-23456': { straights: [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]] },
  'escalera-con-as-arriba': { straights: [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6], [1, 3, 4, 5, 6]] },
});
const ruleOf = id => (Object.hasOwn(GENERALA, id) ? GENERALA[id] : fail('UNKNOWN_RULES', 'unknown generala rule set ' + JSON.stringify(id) + ' (known: ' + Object.keys(GENERALA).join(', ') + ')'));

// Hand of five dice: generala (5 equal), poker (4 equal), full (3 + 2), escalera (a straight of the rule set), or null.
export function handOf(roll, ruleId) {
  const R = ruleOf(ruleId);
  if (!Array.isArray(roll) || roll.length !== 5 || roll.some(v => !Number.isInteger(v) || v < 1 || v > 6)) fail('BAD_ROLL', 'a generala roll is five dice 1-6');
  const counts = [0, 0, 0, 0, 0, 0, 0];
  roll.forEach(v => counts[v]++);
  const c = counts.slice(1).filter(Boolean).sort((a, b) => b - a);
  if (c[0] === 5) return 'generala';
  if (c[0] === 4) return 'poker';
  if (c[0] === 3 && c[1] === 2) return 'full';
  const set = [...new Set(roll)].sort((a, b) => a - b).join('');
  if (R.straights.some(s => [...s].sort((a, b) => a - b).join('') === set)) return 'escalera';
  return null;
}

// "Servida" (first roll) probabilities of every hand: exact count over the 7776 ordered rolls.
export function servida(ruleId) {
  ruleOf(ruleId);
  const ways = { generala: 0, poker: 0, full: 0, escalera: 0 };
  const roll = [0, 0, 0, 0, 0];
  for (let i = 0; i < 7776; i++) {
    let x = i;
    for (let j = 0; j < 5; j++) { roll[j] = (x % 6) + 1; x = Math.floor(x / 6); }
    const h = handOf(roll, ruleId);
    if (h) ways[h]++;
  }
  return Object.fromEntries(Object.entries(ways).map(([h, w]) => { const p = frac(BigInt(w), 7776n); return [h, { ways: w, p, oneIn: oneIn(p) }]; }));
}

// Generala within `rolls` throws (1-3) when after every throw you keep the dice of your most frequent face and roll the rest
// (switching face when the new dice show more of another one). Exact Markov chain on "dice of the best face kept" (1..5).
export function generalaWithin(rolls) {
  int(rolls, 'rolls', 1, 3);
  const trans = k => {
    const out = new Map(), n = 5 - k, total = 6 ** n;
    for (let i = 0; i < total; i++) {
      const counts = [0, 0, 0, 0, 0, 0];
      let x = i;
      for (let j = 0; j < n; j++) { counts[x % 6]++; x = Math.floor(x / 6); }
      const next = k === 0 ? Math.max(...counts) : Math.max(k + counts[0], ...counts.slice(1));
      out.set(next, (out.get(next) || 0) + 1);
    }
    return [...out].map(([s, w]) => [s, frac(BigInt(w), BigInt(total))]);
  };
  let state = new Map([[0, ONE]]);
  for (let r = 0; r < rolls; r++) {
    const next = new Map();
    for (const [k, p] of state) {
      if (k === 5) { next.set(5, add(next.get(5) || ZERO, p)); continue; }
      for (const [s, q] of trans(k)) next.set(s, add(next.get(s) || ZERO, mul(p, q)));
    }
    state = next;
  }
  const p = state.get(5) || ZERO;
  const check = sum([...state.values()]);
  if (check.n !== check.d) fail('INTERNAL', 'generala chain does not sum to 1');
  return { rolls, p, oneIn: oneIn(p) };
}

