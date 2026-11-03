import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POWER, LADDER, ENVIDO_VALUE, compareCards, envidoPoints, florPoints, hasFlor } from '../truco/cards.mjs';
import { validateRules, RULESETS, faltaValue, envidoQuieroValue, envidoNoQuieroValue, envidoCanRaise, buenasAt } from '../truco/rules.mjs';
import { handWinner } from '../truco/game.mjs';
import { DECK_40 } from '../cards/spanish.mjs';

// data/sources/truco/rules.json: "hierarchy-bravas", "hierarchy-rest", "hierarchy-rest-2".
test('hierarchy: 1e > 1b > 7e > 7o > 3 > 2 > 1o,1c > 12 > 11 > 10 > 7c,7b > 6 > 5 > 4', () => {
  const order = [['1e'], ['1b'], ['7e'], ['7o'], ['3e', '3b', '3o', '3c'], ['2e', '2b', '2o', '2c'], ['1o', '1c'],
    ['12e', '12b', '12o', '12c'], ['11e', '11b', '11o', '11c'], ['10e', '10b', '10o', '10c'], ['7c', '7b'],
    ['6e', '6b', '6o', '6c'], ['5e', '5b', '5o', '5c'], ['4e', '4b', '4o', '4c']];
  assert.deepEqual(LADDER.map(l => l.slice().sort()), order.map(l => l.slice().sort()));
  assert.equal(order.flat().length, 40);
  assert.equal(compareCards('1e', '1b'), 1);
  assert.equal(compareCards('7b', '10c'), -1);
  assert.equal(compareCards('1o', '1c'), 0);
  assert.equal(compareCards('3e', '3c'), 0);
  assert.equal(compareCards('7o', '3e'), 1);
  assert.equal(POWER['4c'], 1);
});

// "envido-figures-zero", "envido-count", "envido-max-33", "envido-three-of-suit".
test('envido points: same suit 20 + values, figures 0, else the highest card', () => {
  assert.equal(ENVIDO_VALUE['12e'], 0);
  assert.equal(ENVIDO_VALUE['7c'], 7);
  assert.equal(envidoPoints(['7e', '6e', '1b']), 33);
  assert.equal(envidoPoints(['6o', '7o', '12c']), 33);
  assert.equal(envidoPoints(['12e', '11e', '1b']), 20);
  assert.equal(envidoPoints(['12e', '11b', '10o']), 0);
  assert.equal(envidoPoints(['1e', '7b', '5o']), 7);
  assert.equal(envidoPoints(['4c', '5c', '12o']), 29);
  assert.equal(envidoPoints(['1c', '10c', '7o']), 21);
  assert.equal(envidoPoints(['7e', '6e', '5e']), 33);
  assert.equal(envidoPoints(['4c', '5c', '12c']), 29);
  assert.equal(envidoPoints(['3o', '2o', '1o']), 25);
  let max = 0;
  for (const a of DECK_40) for (const b of DECK_40) for (const c of DECK_40) if (a < b && b < c) max = Math.max(max, envidoPoints([a, b, c]));
  assert.equal(max, 33);
  assert.throws(() => envidoPoints(['1e', '2e']));
});

// "flor-value": 20 + the three values; best 5-6-7 of a suit = 38, three figures = 20.
test('flor points', () => {
  assert.ok(hasFlor(['1e', '7e', '4e']));
  assert.ok(!hasFlor(['1e', '7e', '4o']));
  assert.equal(florPoints(['5c', '6c', '7c']), 38);
  assert.equal(florPoints(['10b', '11b', '12b']), 20);
  assert.equal(florPoints(['1e', '7e', '4e']), 32);
  assert.throws(() => florPoints(['1e', '7e', '4o']));
});

// "parda-first", "parda-all-three", "parda-next-decides", "parda-one-each". Results: seat or -1 (parda); mano = 0.
test('parda rules', () => {
  const P = -1;
  assert.equal(handWinner([0], 0), null);
  assert.equal(handWinner([0, 0], 1), 0);
  assert.equal(handWinner([0, 1], 0), null);
  assert.equal(handWinner([0, 1, 1], 0), 1);
  assert.equal(handWinner([1, 0, 0], 1), 0);
  assert.equal(handWinner([P, 1], 0), 1);
  assert.equal(handWinner([P, 0], 1), 0);
  assert.equal(handWinner([P, P], 0), null);
  assert.equal(handWinner([P, P, 1], 0), 1);
  assert.equal(handWinner([P, P, P], 0), 0);
  assert.equal(handWinner([P, P, P], 1), 1);
  assert.equal(handWinner([1, P], 0), 1);
  assert.equal(handWinner([0, P], 1), 0);
  assert.equal(handWinner([0, 1, P], 1), 0);
  assert.equal(handWinner([1, 0, P], 0), 1);
});

test('rule sets: every field required, no defaults', () => {
  assert.throws(() => validateRules(), /rule set/);
  assert.throws(() => validateRules({}), /missing/);
  const ok = { players: 2, target: 30, flor: false, falta: 'leader-to-win', mazoNoCardPoints: 2 };
  assert.equal(validateRules(ok).target, 30);
  for (const k of Object.keys(ok)) { const r = { ...ok }; delete r[k]; assert.throws(() => validateRules(r), new RegExp(k)); }
  assert.throws(() => validateRules({ ...ok, target: 20 }));
  assert.throws(() => validateRules({ ...ok, players: 4 }), /not implemented/);
  assert.throws(() => validateRules({ ...ok, flor: 'si' }));
  assert.throws(() => validateRules({ ...ok, falta: 'whatever' }));
  assert.throws(() => validateRules({ ...ok, extra: 1 }), /unknown key/);
  for (const r of Object.values(RULESETS)) assert.equal(validateRules(r).players, 2);
  assert.equal(buenasAt(RULESETS['clasico-30-sin-flor']), 15);
  assert.equal(buenasAt(RULESETS['bonaerense-40-con-flor']), 20);
  assert.equal(buenasAt(RULESETS['corto-15-sin-flor']), null);
});

// "envido-table-*", "envido-no-quiero": Juegos Bonaerenses table 10.
test('envido chain values: querido and no querido', () => {
  const r = RULESETS['clasico-30-sin-flor'];
  const q = c => envidoQuieroValue(r, c, [0, 0], 0);
  assert.equal(q(['envido']), 2);
  assert.equal(envidoNoQuieroValue(['envido']), 1);
  assert.equal(q(['envido', 'envido']), 4);
  assert.equal(envidoNoQuieroValue(['envido', 'envido']), 2);
  assert.equal(q(['envido', 'realEnvido']), 5);
  assert.equal(envidoNoQuieroValue(['envido', 'realEnvido']), 2);
  assert.equal(q(['envido', 'envido', 'realEnvido']), 7);
  assert.equal(envidoNoQuieroValue(['envido', 'envido', 'realEnvido']), 4);
  assert.equal(envidoNoQuieroValue(['envido', 'envido', 'realEnvido', 'faltaEnvido']), 7);
  assert.equal(q(['realEnvido']), 3);
  assert.equal(envidoNoQuieroValue(['realEnvido']), 1);
  assert.equal(envidoNoQuieroValue(['faltaEnvido']), 1);
  assert.equal(envidoNoQuieroValue(['realEnvido', 'faltaEnvido']), 3);
  assert.ok(envidoCanRaise(['envido'], 'envido'));
  assert.ok(!envidoCanRaise(['envido', 'envido'], 'envido'));
  assert.ok(!envidoCanRaise(['realEnvido'], 'envido'));
  assert.ok(!envidoCanRaise(['realEnvido'], 'realEnvido'));
  assert.ok(!envidoCanRaise(['faltaEnvido'], 'faltaEnvido'));
});

// "falta-malas-wins-match", "falta-leader-to-win", "falta-leader-to-stage-a/b".
test('falta envido value under each cited rule', () => {
  const base = { players: 2, target: 30, flor: false, mazoNoCardPoints: 2 };
  const win = validateRules({ ...base, falta: 'leader-to-win' });
  const stage = validateRules({ ...base, falta: 'leader-to-stage' });
  const malas = validateRules({ ...base, falta: 'malas-wins-match' });
  assert.equal(faltaValue(win, [10, 4], 1), 20);
  assert.equal(faltaValue(win, [22, 4], 1), 8);
  assert.equal(faltaValue(stage, [10, 4], 0), 5);
  assert.equal(faltaValue(stage, [22, 4], 0), 8);
  assert.equal(faltaValue(malas, [10, 4], 1), 26);
  assert.equal(faltaValue(malas, [10, 4], 0), 20);
  assert.equal(faltaValue(malas, [22, 4], 1), 8);
  const short = validateRules({ ...base, target: 15, falta: 'malas-wins-match' });
  assert.equal(faltaValue(short, [10, 4], 1), 5);
  const forty = validateRules({ ...base, target: 40, falta: 'malas-wins-match' });
  assert.equal(faltaValue(forty, [19, 3], 1), 37);
  assert.equal(faltaValue(forty, [21, 3], 1), 19);
});
