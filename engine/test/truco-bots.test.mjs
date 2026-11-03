import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, customHand, observation, toAct } from '../truco/game.mjs';
import { RULESETS } from '../truco/rules.mjs';
import { createBot, playMatch, oppHandsConsistent } from '../truco/bots.mjs';

function series(a, b, n, rules) {
  let wins = 0;
  for (let m = 0; m < n; m++) {
    const seatA = m % 2, bots = [];
    bots[seatA] = createBot(a, 'A' + m);
    bots[1 - seatA] = createBot(b, 'B' + m);
    const s = playMatch(newMatch(rules, 'serie-' + m), bots, { maxActions: 4000 });
    if (s.winner === seatA) wins++;
  }
  return wins / n;
}

test('bots: level and seed are required; same seed, same decisions', () => {
  assert.throws(() => createBot('experto', 1));
  assert.throws(() => createBot('normal'));
  const run = () => playMatch(newMatch(RULESETS['corto-15-sin-flor'], 'det'), [createBot('dificil', 1), createBot('normal', 2)], { maxActions: 4000 });
  assert.deepEqual(run(), run());
});

test('dificil beats facil in more than 60% of 30 seeded matches to 15', () => {
  const r = series('dificil', 'facil', 30, RULESETS['corto-15-sin-flor']);
  assert.ok(r > 0.6, 'dificil won ' + r);
});

test('normal beats facil in more than 60% of 20 seeded matches to 15', () => {
  const r = series('normal', 'facil', 20, RULESETS['corto-15-sin-flor']);
  assert.ok(r > 0.6, 'normal won ' + r);
});

test('normal takes an obvious envido and refuses a hopeless truco', () => {
  const s = customHand(RULESETS['clasico-30-sin-flor'], 1, [['7e', '6e', '1b'], ['4c', '5o', '12o']], { mano: 0, score: [0, 0] });
  const a = createBot('normal', 1).choose(observation(s, 0));
  assert.ok(['envido', 'realEnvido', 'faltaEnvido'].includes(a.type), a.type);
  const t = customHand(RULESETS['clasico-30-sin-flor'], 1, [['1e', '1b', '7e'], ['4c', '4o', '5b']], { mano: 0, score: [0, 0] });
  const u = { ...t, hand: { ...t.hand, truco: { level: 1, holder: null, pending: { to: 2, by: 0 } }, actions: [{ seat: 0, type: 'truco' }] } };
  assert.equal(toAct(u), 1);
  const o = observation(u, 1);
  assert.equal(createBot('normal', 3).choose(o).type, 'noQuiero');
});

test('consistent hands respect what was shown: a revealed envido fixes the opponent points', () => {
  let s = customHand(RULESETS['clasico-30-sin-flor'], 1, [['4c', '5o', '12o'], ['7e', '6e', '1b']], { mano: 0, score: [0, 0] });
  const bot = createBot('normal', 1);
  s = { ...s };
  const o0 = observation(s, 0);
  assert.equal(oppHandsConsistent(o0).length, 7770);
  s.hand = { ...s.hand, envido: { chain: ['envido'], by: [0], pending: null, closed: true, result: { winner: 1, value: 2, points: [5, 33], shown: [true, true], accepted: true } } };
  const hands = oppHandsConsistent(observation(s, 0));
  assert.ok(hands.length > 0 && hands.length < 7770);
  assert.ok(hands.every(h => ['6', '7'].every(n => h.some(c => c.startsWith(n)))));
  assert.ok(bot.choose(observation(s, 0)));
});
