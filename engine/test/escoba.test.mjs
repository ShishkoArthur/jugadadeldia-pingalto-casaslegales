import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULESETS, validateRules, VALUE, SETENTA, setentaOf, captures, scoreHand, newMatch, customHand, legalActions, step, apply, toAct, observation, serialize, deserialize, actionKey, createBot, playMatch, LEVELS } from '../escoba/index.mjs';
import { createRng } from '../cards/rng.mjs';
import { DECK_40 } from '../cards/spanish.mjs';

const B = RULESETS.bonaerense, LU = RULESETS.ludoteka;
const O2 = { players: 2, pairs: false, target: 30 };

test('escoba rule sets and match options: all required, no defaults', () => {
  assert.throws(() => validateRules(), /rule set/);
  for (const k of ['scoring', 'muestra', 'capture']) { const r = { ...B }; delete r[k]; assert.throws(() => validateRules(r), new RegExp(k)); }
  assert.throws(() => validateRules({ ...B, extra: 1 }), /unknown key/);
  assert.throws(() => newMatch(B, { players: 2, pairs: false, seed: 1 }), /target/);
  assert.throws(() => newMatch(B, { players: 3, pairs: true, target: 30, seed: 1 }), /pairs/);
  assert.throws(() => newMatch(B, { ...O2 }), /seed/);
});

// Quotes "values", "total-220", "scale-*", "setenta-75", "setenta-81".
test('card values add up to 220; setenta scale and the two worked examples of Juegos Bonaerenses', () => {
  assert.equal(DECK_40.reduce((t, c) => t + VALUE[c], 0), 220);
  assert.deepEqual([VALUE['10e'], VALUE['11e'], VALUE['12e'], VALUE['7o']], [8, 9, 10, 7]);
  assert.equal(SETENTA[7] + SETENTA[6] + SETENTA[1] + SETENTA[2], 67);
  assert.equal(setentaOf(['7e', '7c', '7b', '12o']), 73);
  assert.equal(setentaOf(['6e', '6c', '6b', '7o']), 75);
  assert.equal(setentaOf(['7e', '7c', '7o', '6b']), 81);
  assert.equal(setentaOf(['7e', '7c', '7o']), null, 'a suit missing: no setenta');
  assert.equal(setentaOf(['7e', '7c', '7o', '7b']), 84);
});

function bruteCaptures(table, card) {
  const out = [];
  for (let m = 1; m < 1 << table.length; m++) { const t = table.filter((_, i) => m & (1 << i)); if (t.reduce((s, c) => s + VALUE[c], 0) + VALUE[card] === 15) out.push(t.slice().sort().join()); }
  return out.sort();
}

test('buscador: every way to make 15, exact against brute force on 3000 random tables', () => {
  assert.deepEqual(captures(['5e', '3o', '2b', '10c'], '7e').map(t => t.slice().sort().join()).sort(), ['10c', '3o,5e']);
  const rng = createRng('escoba-captures');
  for (let i = 0; i < 3000; i++) {
    const d = DECK_40.slice();
    const pick = k => Array.from({ length: k }, () => d.splice(rng.int(d.length), 1)[0]);
    const table = pick(1 + rng.int(9)), card = pick(1)[0];
    assert.deepEqual(captures(table, card).map(t => t.slice().sort().join()).sort(), bruteCaptures(table, card));
  }
});

// Quotes "cartas", "oros-6", "tie-none", "l-tie-each", "l-sietes".
test('hand scoring: Juegos Bonaerenses (ties score nothing, oros six or more) against Ludoteka (ties score for each)', () => {
  const a = ['7o', '7e', '6c', '1b', '2o', '3o', '4o', '5o', '6o'], b = ['7c', '7b', '1o', '10o', '11o', '12e'];
  const g = scoreHand(B, [a, b], [1, 0]);
  assert.deepEqual(g.points, [1 + 1 + 1 + 1 + 1, 0], 'escoba, siete de oros, cartas, oros (6), setenta');
  const tie = scoreHand(B, [['1e', '2e'], ['3e', '4e']], [0, 0]);
  assert.deepEqual(tie.points, [0, 0]);
  const l = scoreHand(LU, [['7e', '7o', '1e'], ['7c', '7b', '2e']], [0, 0]);
  assert.deepEqual(l.points, [1 + 1 + 1 + 1, 1 + 1], 'siete de oros; sevens tie 2-2 each; cards tie each; oros 1-0');
});

// Quotes "muestra", "muestra-doble", "l-muestra", "escoba", "l-rest".
test('play: escoba when the table is swept, mandatory capture, the rest to the last taker', () => {
  let s = customHand(B, { ...O2, seed: 1 }, { hands: [['7e', '4c', '2b'], ['5o', '1c', '12b']], table: ['10c', '3o'], stock: [], dealer: 1, turn: 0 });
  const L = legalActions(s, 0);
  assert.ok(L.every(a => a.card !== '7e' || a.take.length), 'mandatory: the 7 must take the sota');
  s = apply(s, { type: 'play', card: '7e', take: ['10c'] });
  assert.equal(s.hand.escobas[0], 0);
  s = apply(s, { type: 'play', card: '12b', take: [] });
  s = apply(s, { type: 'play', card: '2b', take: ['3o', '12b'] });
  assert.equal(s.hand.escobas[0], 1, '2 + 3 + rey = 15 takes the whole table');
  const o = customHand(LU, { ...O2, seed: 1 }, { hands: [['7e'], ['5o']], table: ['10c'], stock: [], dealer: 1, turn: 0 });
  assert.ok(legalActions(o, 0).some(a => a.take.length === 0), 'optional capture');
  let e = customHand(B, { ...O2, seed: 2 }, { hands: [['1e'], ['2c']], table: ['4c'], stock: [], dealer: 1, turn: 0 });
  e.hand.lastTaker = 1;
  e = apply(e, { type: 'play', card: '1e', take: [] });
  e = apply(e, { type: 'play', card: '2c', take: [] });
  assert.deepEqual(e.lastHand.piles[1].sort(), ['1e', '2c', '4c'].sort());
  let muestra = 0, doble = 0;
  for (let seed = 0; seed < 3000; seed++) {
    const g = newMatch(B, { ...O2, seed }), l = newMatch(LU, { ...O2, seed });
    if (g.hand.log.some(x => x.type === 'muestra')) { muestra++; assert.equal(g.hand.escobas[g.hand.dealer], 1); assert.equal(g.hand.table.length, 0); }
    if (g.hand.log.some(x => x.type === 'muestra-doble')) { doble++; assert.equal(g.hand.table.length, 4); assert.equal(l.hand.escobas[l.hand.dealer], 2); }
  }
  assert.ok(muestra > 0 && doble > 0, muestra + ' ' + doble);
});

test('fuzz: 4000 random hands (2, 3, 4 players and pairs), cards conserved, points add up, matches end', () => {
  const rng = createRng('fuzz-escoba');
  let hands = 0, m = 0, steps = 0;
  while (hands < 4000) {
    const rules = Object.values(RULESETS)[m % 3], players = 2 + (m % 3), pairs = players === 4 && m % 2 === 0;
    let s = newMatch(rules, { players, pairs, target: 21, seed: 'fz' + m });
    let n = 0;
    while (!s.over) {
      const seat = toAct(s), L = legalActions(s, seat);
      assert.ok(L.length > 0);
      for (let k = 1; k < players; k++) assert.deepEqual(legalActions(s, (seat + k) % players), []);
      assert.equal(new Set(L.map(actionKey)).size, L.length);
      const a = L[rng.int(L.length)];
      if (steps % 61 === 0) {
        const before = serialize(s), after = apply(s, a);
        assert.equal(serialize(s), before);
        assert.deepEqual(deserialize(serialize(after)), after);
        assert.equal(observation(s, seat).hand.mine.length, s.hand.hands[seat].length);
        s = after;
      } else step(s, a);
      steps++;
      const h = s.hand, all = [...h.hands.flat(), ...h.table, ...h.stock, ...h.piles.flat()];
      assert.equal(all.length, 40);
      assert.equal(new Set(all).size, 40);
      assert.ok(++n < 5000);
    }
    let tot = Array(s.scores.length).fill(0);
    for (const x of s.history) x.points.forEach((p, i) => { tot[i] += p; });
    assert.deepEqual(tot, s.scores);
    assert.equal(s.scores[s.winner], Math.max(...s.scores));
    hands += s.history.length;
    m++;
  }
});

test('escoba bots: never illegal, deterministic, normal beats facil in more than 60% of 30 matches', () => {
  assert.throws(() => createBot('experto', 1));
  assert.throws(() => createBot('normal'));
  assert.deepEqual(LEVELS, ['facil', 'normal', 'dificil']);
  for (const [players, pairs] of [[3, false], [4, true]]) {
    const s = playMatch(newMatch(B, { players, pairs, target: 15, seed: 'p' + players }), Array.from({ length: players }, (_, i) => createBot(LEVELS[i % 3], 'b' + i)), { maxActions: 20000 });
    assert.ok(s.over);
  }
  const run = () => playMatch(newMatch(B, { ...O2, target: 15, seed: 'det' }), [createBot('dificil', 1), createBot('normal', 2)], { maxActions: 20000 });
  assert.deepEqual(run(), run());
  let w = 0;
  for (let m = 0; m < 30; m++) {
    const a = m % 2, bots = [];
    bots[a] = createBot('normal', 'a' + m); bots[1 - a] = createBot('facil', 'b' + m);
    if (playMatch(newMatch(B, { ...O2, target: 15, seed: 'e' + m }), bots, { maxActions: 20000 }).winner === a) w++;
  }
  assert.ok(w / 30 > 0.6, 'normal won ' + w + '/30');
});

test('escoba bot sanity: takes an escoba, does not leave an easy escoba', () => {
  const s = customHand(LU, { ...O2, seed: 3 }, { hands: [['5e', '2c', '12b'], ['6o', '1c', '3b']], table: ['4c', '6b'], stock: ['1e', '2e', '3e', '4e', '5c', '6c'], dealer: 1, turn: 0 });
  for (const lvl of ['normal', 'dificil']) {
    const a = createBot(lvl, 1).choose(observation(s, 0));
    assert.deepEqual([a.card, a.take.slice().sort()], ['5e', ['4c', '6b'].sort()], lvl);
  }
  const t = customHand(LU, { ...O2, seed: 3 }, { hands: [['12e', '2c', '7b'], ['6o', '1c', '3b']], table: ['1o'], stock: ['1e', '2e', '3e', '4e', '5c', '6c'], dealer: 1, turn: 0 });
  for (const lvl of ['normal', 'dificil']) assert.equal(createBot(lvl, 1).choose(observation(t, 0)).card, '2c', lvl + ': leaving 3 on the table needs a 12, no card is worth that');
});
