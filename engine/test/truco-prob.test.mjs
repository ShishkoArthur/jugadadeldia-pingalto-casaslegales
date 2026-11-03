import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envidoDistribution, florChance, envidoVsRandom, oppEnvidoAtLeast, oppFlorChance, bazasVsRandom, cardVsRandom, solveBazas } from '../truco/probability.mjs';
import { handWinMC, playBazasPlain, handWinPlainExact } from '../truco/simulate.mjs';
import { customHand, legalActions, step, clone, toAct } from '../truco/game.mjs';
import { RULESETS } from '../truco/rules.mjs';
import { POWER } from '../truco/cards.mjs';
import { DECK_40, binom, shuffle } from '../cards/spanish.mjs';
import { createRng } from '../cards/rng.mjs';

// Locks: changing any rule or count breaks the build.
test('envido distribution over all 9880 hands (sin flor) is locked', () => {
  const { counts, total } = envidoDistribution({ flor: false });
  assert.equal(total, 9880);
  assert.deepEqual(counts, { 0: 108, 1: 148, 2: 244, 3: 364, 4: 508, 5: 676, 6: 868, 7: 1084, 20: 364, 21: 372, 22: 372, 23: 504,
    24: 504, 25: 640, 26: 640, 27: 780, 28: 408, 29: 420, 30: 284, 31: 292, 32: 148, 33: 152 });
  assert.equal(counts[0], binom(4, 3) * 3 ** 3, 'three figures of three different suits');
  assert.equal(counts[33], 4 * 38, 'six and seven of one suit plus any card');
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 9880);
  for (const k of [8, 9, 10, 15, 19, 34]) assert.equal(counts[k], undefined);
});

test('flor chance is exactly 12/247 (4 x C(10,3) / C(40,3) = 480 / 9880)', () => {
  assert.deepEqual(florChance(), { num: 12, den: 247, p: 12 / 247 });
  const { counts } = envidoDistribution({ flor: true });
  assert.equal(counts.flor, 480);
});

test('envido against a random hand: exact fractions', () => {
  const a = envidoVsRandom(['7e', '6e', '1b'], { mano: false, flor: false });
  assert.equal(a.points, 33);
  assert.equal(a.total, 7770);
  assert.deepEqual([a.win.num, a.win.den], [73, 74], 'loses only to another 33 (3 suits x 35 cards = 105 of 7770)');
  const b = envidoVsRandom(['7e', '6e', '1b'], { mano: true, flor: false });
  assert.deepEqual([b.win.num, b.win.den], [1, 1]);
  const c = envidoVsRandom(['12e', '11b', '10o'], { mano: true, flor: false });
  assert.equal(c.points, 0);
  assert.equal(c.less.num, 0);
  assert.throws(() => envidoVsRandom(['1e', '1e', '2e'], { mano: true, flor: false }));
  assert.throws(() => envidoVsRandom(['1e', '2e', '3e'], {}));
  assert.deepEqual(oppEnvidoAtLeast(['12e', '11b', '10o'], 0), { num: 1, den: 1, p: 1 });
  const at33 = oppEnvidoAtLeast(['12e', '11b', '10o'], 33);
  assert.equal(at33.num * 7770 / at33.den, 4 * 35);
});

test('opponent flor chance given my hand: (C(8,3) + C(9,3) + 2 C(10,3)) / C(37,3) = 38/777', () => {
  assert.deepEqual(oppFlorChance(['1e', '1b', '7e']), { num: 38, den: 777, p: 38 / 777 });
});

test('one card against a random card', () => {
  const c = cardVsRandom('3c');
  assert.deepEqual([c.win.num, c.win.den], [32, 39]);
  assert.deepEqual([c.tie.num, c.tie.den], [1, 13]);
  assert.equal(cardVsRandom('1e').win.p, 1);
  assert.deepEqual([cardVsRandom('4c').lose.num, cardVsRandom('4c').lose.den], [12, 13]);
});

// Independent check of solveBazas: brute force over the real engine (card plays only, open cards).
function engineMinimax(s) {
  if (s.hand.ended || s.over) return s.hand.winner;
  const seat = toAct(s);
  let res = null;
  for (const a of legalActions(s, seat).filter(x => x.type === 'play')) {
    const n = clone(s);
    step(n, a, { deal: false });
    const r = engineMinimax(n);
    if (r === seat) return seat;
    res = r;
  }
  return res;
}
test('open-card solution of the bazas agrees with the engine on 150 random deals', () => {
  const rng = createRng('solve');
  for (let i = 0; i < 150; i++) {
    const d = shuffle(DECK_40, rng), h0 = d.slice(0, 3), h1 = d.slice(3, 6), mano = i % 2;
    const s = customHand(RULESETS['clasico-30-sin-flor'], 1, [h0, h1], { mano, score: [0, 0] });
    const viaEngine = engineMinimax(s);
    const viaSolver = solveBazas([h0.map(c => POWER[c]), h1.map(c => POWER[c])], [], mano, [null, null], mano);
    assert.equal(viaSolver, viaEngine, JSON.stringify([h0, h1, mano]));
  }
});

test('bazas with open cards against a random hand: locked fractions', () => {
  assert.equal(bazasVsRandom(['1e', '1b', '7e'], { mano: false }).p, 1);
  assert.equal(bazasVsRandom(['4c', '4o', '5b'], { mano: false }).p, 0);
  assert.deepEqual(bazasVsRandom(['3e', '2o', '12c'], { mano: true }), { num: 3239, den: 3885, p: 3239 / 3885 });
});

test('Monte Carlo (seeded) is deterministic and agrees with the exact enumeration of the same play', () => {
  for (const [hand, mano] of [[['3e', '2o', '12c'], true], [['7o', '5c', '11b'], false], [['2e', '2b', '4o'], true]]) {
    const a = handWinMC(hand, { mano, samples: 20000, seed: 5 });
    assert.deepEqual(handWinMC(hand, { mano, samples: 20000, seed: 5 }), a);
    const ex = handWinPlainExact(hand, { mano });
    assert.equal(ex.total, 7770);
    assert.ok(Math.abs(a.p - ex.p) < 4 * a.se + 1e-9, hand + ': MC ' + a.p + ' exact ' + ex.p);
  }
  assert.equal(handWinPlainExact(['3e', '2o', '12c'], { mano: true }).win, 6909);
  assert.equal(handWinMC(['1e', '1b', '7e'], { mano: false, samples: 500, seed: 1 }).p, 1);
  assert.throws(() => handWinMC(['1e', '1b', '7e'], { mano: true, samples: 10 }));
  assert.equal(playBazasPlain(['1e', '1b', '7e'], ['4c', '4o', '5b'], 1), 0);
});
