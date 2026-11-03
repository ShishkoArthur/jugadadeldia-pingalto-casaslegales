import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, customHand, legalActions, apply, toAct, serialize, deserialize, observation, rebuild, isLegal } from '../truco/game.mjs';
import { RULESETS } from '../truco/rules.mjs';

const SIN = RULESETS['clasico-30-sin-flor'];
const CON = RULESETS['clasico-30-con-flor'];
const act = s => (s.startsWith('play:') ? { type: 'play', card: s.slice(5) } : { type: s });
function run(state, ...moves) {
  for (const m of moves) state = apply(state, act(m));
  return state;
}
const types = (s, seat = toAct(s)) => legalActions(s, seat).map(a => (a.type === 'play' ? 'play:' + a.card : a.type));

test('newMatch needs rules and seed; same seed same deal', () => {
  assert.throws(() => newMatch(undefined, 1));
  assert.throws(() => newMatch(SIN));
  const a = newMatch(SIN, 'x'), b = newMatch(SIN, 'x'), c = newMatch(SIN, 'y');
  assert.deepEqual(a.hand.hands, b.hand.hands);
  assert.notDeepEqual(a.hand.hands, c.hand.hands);
  assert.equal(new Set(a.hand.hands.flat()).size, 6);
  assert.equal(toAct(a), a.hand.mano);
});

test('envido querido: higher points win, mano wins ties', () => {
  let s = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [0, 0] });
  assert.ok(types(s).includes('envido'));
  s = run(s, 'envido');
  assert.deepEqual(types(s), ['quiero', 'noQuiero', 'envido', 'realEnvido', 'faltaEnvido']);
  s = run(s, 'quiero');
  assert.deepEqual(s.score, [2, 0]);
  assert.equal(s.hand.envido.result.winner, 0);
  assert.ok(!types(s).includes('envido'));
  let t = customHand(SIN, 1, [['5e', '3e', '12b'], ['6c', '2c', '11o']], { mano: 1, score: [0, 0] });
  t = run(t, 'envido', 'quiero');
  assert.deepEqual(t.score, [0, 2]);
});

test('envido chain no querido pays the accepted part to the last caller', () => {
  let s = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [0, 0] });
  s = run(s, 'envido', 'envido', 'realEnvido', 'noQuiero');
  assert.deepEqual(s.score, [4, 0]);
  let t = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [0, 0] });
  t = run(t, 'envido', 'realEnvido', 'quiero');
  assert.deepEqual(t.score, [5, 0]);
});

test('falta envido querido in malas takes the chico (malas-wins-match)', () => {
  let s = customHand(SIN, 1, [['4c', '5c', '12o'], ['7e', '6e', '1b']], { mano: 0, score: [10, 3] });
  s = run(s, 'faltaEnvido', 'quiero');
  assert.equal(s.over, true);
  assert.equal(s.winner, 1);
  assert.deepEqual(s.score, [10, 30]);
  assert.deepEqual(legalActions(s, 0), []);
  assert.deepEqual(legalActions(s, 1), []);
});

test('envido reaching the target ends the match in the middle of the hand', () => {
  let s = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [28, 0] });
  s = run(s, 'envido', 'quiero');
  assert.equal(s.over, true);
  assert.equal(s.winner, 0);
  assert.equal(toAct(s), null);
});

test('envido only before your first card and before truco is accepted', () => {
  let s = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [0, 0] });
  s = run(s, 'play:1b');
  assert.ok(types(s).includes('envido'), 'pie can still sing envido');
  s = run(s, 'play:4c');
  assert.ok(!types(s).includes('envido'));
  let t = customHand(SIN, 1, [['7e', '6e', '1b'], ['4c', '5c', '12o']], { mano: 0, score: [0, 0] });
  t = run(t, 'truco', 'quiero');
  assert.ok(!types(t).includes('envido'));
});

test('el envido esta primero: answer truco with envido, then answer the truco', () => {
  let s = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  s = run(s, 'truco');
  assert.deepEqual(types(s), ['quiero', 'noQuiero', 'retruco', 'envido', 'realEnvido', 'faltaEnvido']);
  s = run(s, 'envido');
  assert.equal(toAct(s), 0);
  s = run(s, 'quiero');
  assert.deepEqual(s.score, [0, 2]);
  assert.equal(toAct(s), 1);
  assert.deepEqual(types(s), ['quiero', 'noQuiero', 'retruco']);
  s = run(s, 'noQuiero');
  assert.deepEqual(s.score, [1, 2]);
  assert.equal(s.handNo, 2);
});

test('truco ladder: only the side that accepted may raise; values 1-2-3-4 and 1-2-3 when refused', () => {
  let s = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  s = run(s, 'play:4b', 'truco');
  assert.equal(toAct(s), 0);
  s = run(s, 'quiero');
  assert.equal(toAct(s), 1);
  assert.ok(!types(s).includes('truco') && !types(s).includes('retruco'));
  s = run(s, 'play:2c');
  assert.equal(toAct(s), 1);
  assert.ok(!types(s).includes('retruco'), 'caller cannot raise own truco');
  s = run(s, 'play:6o');
  assert.ok(types(s).includes('retruco'), 'accepting side holds the raise');
  s = run(s, 'retruco', 'valeCuatro');
  assert.deepEqual(types(s), ['quiero', 'noQuiero']);
  s = run(s, 'noQuiero');
  assert.deepEqual(s.score, [0, 3]);
  let t = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  t = run(t, 'truco', 'retruco', 'noQuiero');
  assert.deepEqual(t.score, [0, 2]);
  let u = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  u = run(u, 'truco', 'noQuiero');
  assert.deepEqual(u.score, [1, 0]);
  let v = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  v = run(v, 'truco', 'retruco', 'valeCuatro', 'quiero', 'play:1e', 'play:2c', 'play:12e', 'play:7o', 'play:6o', 'play:4b');
  assert.deepEqual(v.score, [0, 4]);
});

test('bazas: parda first, the second decides; mano leads after a parda', () => {
  let s = customHand(SIN, 1, [['3e', '4b', '5c'], ['3o', '6b', '7c']], { mano: 0, score: [0, 0] });
  s = run(s, 'play:3e', 'play:3o');
  assert.equal(s.hand.bazas[0].winner, -1);
  assert.equal(toAct(s), 0);
  s = run(s, 'play:5c', 'play:6b');
  assert.deepEqual(s.score, [0, 1]);
  assert.equal(s.lastHand.how, 'bazas');
  let t = customHand(SIN, 1, [['3e', '2b', '5c'], ['3o', '2o', '5o']], { mano: 1, score: [0, 0] });
  t = run(t, 'play:3o', 'play:3e', 'play:2o', 'play:2b', 'play:5o', 'play:5c');
  assert.deepEqual(t.score, [0, 1], 'three pardas: the mano');
  let u = customHand(SIN, 1, [['1e', '4b', '3c'], ['7o', '5b', '3o']], { mano: 0, score: [0, 0] });
  u = run(u, 'play:1e', 'play:7o', 'play:4b', 'play:5b', 'play:3o', 'play:3c');
  assert.deepEqual(u.score, [1, 0], 'one each and a parda: who won first');
  let w = customHand(SIN, 1, [['1e', '4b', '3c'], ['7o', '4o', '2o']], { mano: 0, score: [0, 0] });
  w = run(w, 'play:1e', 'play:7o', 'play:4b', 'play:4o');
  assert.deepEqual(w.score, [1, 0], 'won first, parda second: hand over');
});

test('mazo before any card and before any call pays mazoNoCardPoints; later pays the truco value', () => {
  let s = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  s = run(s, 'mazo');
  assert.deepEqual(s.score, [0, 2]);
  let t = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  t = run(t, 'play:4b', 'play:2c', 'mazo');
  assert.deepEqual(t.score, [1, 0], 'seat 1 won the baza, leads, and leaves');
  let u = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  u = run(u, 'truco', 'quiero', 'play:4b', 'play:2c', 'mazo');
  assert.deepEqual(u.score, [2, 0]);
  const one = { ...SIN, name: undefined, mazoNoCardPoints: 1 };
  delete one.name;
  let v = customHand(one, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  v = run(v, 'mazo');
  assert.deepEqual(v.score, [0, 1]);
});

test('con flor: flor must be sung first, it cancels envido and pays 3', () => {
  let s = customHand(CON, 1, [['1e', '7e', '4e'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  assert.deepEqual(types(s), ['flor']);
  s = run(s, 'flor');
  assert.deepEqual(s.score, [3, 0]);
  assert.ok(!types(s).includes('envido'));
  let t = customHand(CON, 1, [['7o', '6o', '2c'], ['1e', '7e', '4e']], { mano: 0, score: [0, 0] });
  t = run(t, 'envido');
  assert.deepEqual(types(t), ['flor']);
  t = run(t, 'flor');
  assert.deepEqual(t.score, [0, 3]);
  assert.equal(t.hand.envido.result.cancelled, true);
  assert.equal(toAct(t), 0);
  assert.ok(!types(t).includes('envido'));
  let u = customHand(SIN, 1, [['1e', '7e', '4e'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  assert.ok(!types(u).includes('flor'), 'sin flor: no flor call');
  u = run(u, 'envido', 'quiero');
  assert.deepEqual(u.score, [0, 2], 'sin flor: three of a suit is 20 + 7 + 4 = 31, loses to 33');
});

test('two flores: achico 4, contraflor 6 to the best flor, refused 4, al resto wins the chico', () => {
  const hands = [['1e', '7e', '4e'], ['5c', '6c', '7c']];
  let a = customHand(CON, 1, hands, { mano: 0, score: [0, 0] });
  a = run(a, 'flor');
  assert.deepEqual(types(a), ['conFlorMeAchico', 'contraflor', 'contraflorResto']);
  a = run(a, 'conFlorMeAchico');
  assert.deepEqual(a.score, [4, 0]);
  let b = run(customHand(CON, 1, hands, { mano: 0, score: [0, 0] }), 'flor', 'contraflor', 'quiero');
  assert.deepEqual(b.score, [0, 6]);
  let c = run(customHand(CON, 1, hands, { mano: 0, score: [0, 0] }), 'flor', 'contraflor', 'noQuiero');
  assert.deepEqual(c.score, [0, 4]);
  let d = run(customHand(CON, 1, hands, { mano: 0, score: [12, 5] }), 'flor', 'contraflorResto', 'quiero');
  assert.equal(d.over, true);
  assert.equal(d.winner, 1);
  let e = run(customHand(CON, 1, hands, { mano: 0, score: [0, 0] }), 'flor', 'contraflor', 'contraflorResto', 'noQuiero');
  assert.deepEqual(e.score, [4, 0]);
});

test('con flor: mazo against an unsung flor still pays the flor', () => {
  let s = customHand(CON, 1, [['7o', '6o', '2c'], ['1e', '7e', '4e']], { mano: 0, score: [0, 0] });
  s = run(s, 'mazo');
  assert.deepEqual(s.score, [0, 4]);
});

test('apply is pure, illegal actions throw, turn order is enforced', () => {
  const s = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  const before = serialize(s);
  apply(s, { type: 'play', card: '1e' });
  assert.equal(serialize(s), before);
  assert.throws(() => apply(s, { type: 'play', card: '7o' }), /illegal/);
  assert.throws(() => apply(s, { type: 'quiero' }), /illegal/);
  assert.throws(() => apply(s, { type: 'retruco' }), /illegal/);
  assert.throws(() => apply(s, null), /illegal/);
  assert.ok(!isLegal(s, { type: 'play', card: '8e' }));
  assert.deepEqual(legalActions(s, 1), []);
});

test('serialization round trip continues identically', () => {
  let s = newMatch(CON, 'ser');
  for (let i = 0; i < 40 && !s.over; i++) {
    const back = deserialize(serialize(s));
    assert.deepEqual(back, s);
    const a = legalActions(s, toAct(s))[0];
    s = apply(s, a);
    assert.deepEqual(apply(back, a), s);
  }
  assert.throws(() => deserialize('{"v":99}'));
});

test('observation hides the opponent cards; rebuild restores a playable state', () => {
  let s = customHand(SIN, 1, [['1e', '12e', '4b'], ['7o', '6o', '2c']], { mano: 0, score: [0, 0] });
  s = run(s, 'play:4b');
  const o = observation(s, 1), m = observation(s, 0);
  assert.equal(m.hand.hands[1], null);
  assert.equal(m.hand.left[1], 3);
  assert.deepEqual(o.hand.hands[1], ['7o', '6o', '2c']);
  assert.equal(o.hand.hands[0], null);
  assert.deepEqual(o.oppPlayed, ['4b']);
  assert.ok(!JSON.stringify(m).includes('7o'));
  assert.ok(!JSON.stringify(m).includes('"rng"'));
  const r = rebuild(o, ['4b', '1e', '12e']);
  assert.deepEqual(legalActions(r, 1), legalActions(s, 1));
  assert.throws(() => rebuild(o, ['1e', '12e', '3c']));
});
