import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULESETS, validateRules, deckOf, cardValue, meldOf, bestSplit, canCut, newMatch, customHand, legalActions, step, apply, toAct, observation, serialize, deserialize, actionKey, createBot, playMatch, LEVELS } from '../chinchon/index.mjs';
import { createRng } from '../cards/rng.mjs';
import { shuffle } from '../cards/spanish.mjs';

const G = RULESETS['bonaerense-50'], L40 = RULESETS['ludoteka-40'], L48 = RULESETS['ludoteka-48'];
const TWO = { ...G, name: 'two-real-test', jokersPerMeld: 'two-real' };
const M2 = { players: 2, limit: 101, reenganches: 0 };

test('chinchon rule sets: every field required, jokers fields tied to jokers, no defaults', () => {
  assert.throws(() => validateRules(), /rule set/);
  for (const k of Object.keys(G).filter(k => k !== 'name')) { const r = { ...G }; delete r[k]; assert.throws(() => validateRules(r), new RegExp(k)); }
  assert.throws(() => validateRules({ ...L40, jokerValue: 20 }), /null/);
  assert.throws(() => validateRules({ ...G, jokerValue: null }), /jokerValue/);
  assert.throws(() => validateRules({ ...G, cut: 'any' }));
  assert.throws(() => validateRules({ ...G, extra: 1 }), /unknown key/);
  assert.equal(deckOf(G).length, 50);
  assert.equal(deckOf(L40).length, 40);
  assert.equal(deckOf(L48).length, 48);
  assert.equal(cardValue(G, '12o'), 12);
  assert.equal(cardValue(L40, '12o'), 10);
  assert.equal(cardValue(G, 'J1'), 20);
  assert.throws(() => newMatch(G, { players: 2, limit: 101, seed: 1 }), /reenganches/);
  assert.throws(() => newMatch(G, { players: 2, reenganches: 0, seed: 1 }), /limit/);
  assert.throws(() => newMatch(G, { ...M2, reenganches: 1, seed: 1 }), /two players/);
  assert.throws(() => newMatch(G, { ...M2 }), /seed/);
});

// Quotes "melds", "groups-3-4", "ace-low", "one-joker", "l-two-real", "l-order-40".
test('melds: groups of 3-4, escaleras in deck order, ace only low, comodines within the rule', () => {
  assert.equal(meldOf(G, ['5e', '5o', '5c']).kind, 'group');
  assert.equal(meldOf(G, ['5e', '5o', '5c', '5b']).kind, 'group');
  assert.equal(meldOf(G, ['5e', '5o', '5c', '5b', 'J1']), null);
  assert.equal(meldOf(G, ['5e', '5o']), null);
  assert.equal(meldOf(L40, ['6e', '7e', '10e']).kind, 'escalera', 'in the 40-card deck the sota follows the seven');
  assert.equal(meldOf(L48, ['6e', '7e', '10e']), null);
  assert.equal(meldOf(L48, ['7e', '8e', '9e']).kind, 'escalera');
  assert.equal(meldOf(G, ['1e', '2e', '3e']).kind, 'escalera');
  assert.equal(meldOf(G, ['12e', '1e', '2e']), null, 'no rey-as-dos');
  assert.equal(meldOf(G, ['4e', 'J1', '6e']).kind, 'escalera');
  assert.equal(meldOf(G, ['4e', 'J1', 'J2', '7e']), null, 'one comodin per meld (Juegos Bonaerenses)');
  assert.equal(meldOf(TWO, ['4e', 'J1', 'J2', '7e']).kind, 'escalera', 'two real cards are enough (Ludoteka)');
  assert.equal(meldOf(TWO, ['4e', 'J1', 'J2']), null);
  assert.equal(meldOf(G, ['4e', '5o', '6e']), null);
  const m = meldOf(G, ['11e', '12e', 'J1']);
  assert.deepEqual([m.lo, m.hi], [9, 11], 'a comodin after the rey goes below');
});

// Independent check: the fewest points left by brute force over every split, against bestSplit.
function brute(r, hand) {
  if (!hand.length) return 0;
  const [c, ...rest] = hand;
  let best = cardValue(r, c) + brute(r, rest);
  const n = rest.length;
  for (let m = 0; m < 1 << n; m++) {
    const pick = rest.filter((_, i) => m & (1 << i));
    if (pick.length < 2 || !meldOf(r, [c, ...pick])) continue;
    best = Math.min(best, brute(r, rest.filter((_, i) => !(m & (1 << i)))));
  }
  return best;
}

test('best melds: exact against brute force on 1500 random hands of each rule set', () => {
  const rng = createRng('melds');
  for (const r of [G, L40, L48, TWO]) {
    const deck = deckOf(r);
    for (let i = 0; i < 1500; i++) {
      const hand = shuffle(deck, rng).slice(0, 7);
      const s = bestSplit(r, hand);
      assert.equal(s.points, brute(r, hand), r.name + ' ' + hand.join(' '));
      assert.equal(s.left.reduce((t, c) => t + cardValue(r, c), 0), s.points);
      assert.equal(s.melds.flat().length + s.left.length, 7);
      for (const m of s.melds) assert.ok(meldOf(r, m));
    }
  }
});

// Quotes "cut-5", "l-cut", "chinchon-def".
test('cutting: sum of 5 or less (Juegos Bonaerenses) against one card of 4 or less (Ludoteka); chinchon found', () => {
  const h = ['1e', '2e', '3e', '7o', '7c', '7b', '2c'];
  assert.equal(canCut(G, h).ok, true);
  assert.equal(canCut(G, h).points, 2);
  const h2 = ['1e', '2e', '3e', '7o', '7c', '1c', '2o'];
  assert.equal(bestSplit(G, h2).points, 17);
  const h3 = ['1e', '2e', '3e', '4e', '6o', '6c', '6b'];
  assert.equal(canCut(G, h3).points, 0);
  const h4 = ['1e', '2e', '3e', '6o', '6c', '6b', '1c'];
  assert.equal(canCut(L40, h4).ok, true);
  const h5 = ['3e', '4e', '5e', '6o', '6c', '6b', '5c'];
  assert.equal(canCut(L40, h5).ok, false, 'one card of 5 is too much for Ludoteka');
  assert.equal(canCut(G, h5).ok, true);
  const h6 = ['5e', '6e', '6o', '6c', '6b', '1c', '2o'];
  assert.equal(canCut(G, h6).ok, false);
  const ch = ['3o', '4o', '5o', '6o', '7o', '8o', '9o'];
  assert.equal(bestSplit(G, ch).chinchon, true);
  assert.equal(bestSplit(G, ch).chinchonJokers, 0);
  assert.equal(bestSplit(G, ['3o', '4o', 'J1', '6o', '7o', '8o', '9o']).chinchonJokers, 1);
  assert.equal(bestSplit(L40, ['3o', '4o', '5o', '6o', '7o', '10o', '11o']).chinchon, true);
});

test('hand scoring: all melded -10, lay-offs on the table, chinchon without comodin wins the match', () => {
  const opts = { ...M2, seed: 1 };
  let s = customHand(G, opts, [['1e', '2e', '3e', '7o', '7c', '7b', '7e'], ['4e', '5e', '12c', '11c', '10c', '9b', '8b']], { mano: 0, pozo: ['4c'], stock: ['4b', '9o'] });
  s = apply(s, { type: 'draw', from: 'mazo' });
  assert.deepEqual(s.hand.hands[0].slice(-1), ['9o']);
  const cut = legalActions(s, 0).find(a => a.type === 'cut' && a.card === '9o');
  assert.ok(cut);
  const t = apply(s, cut);
  const r = t.history[0];
  assert.equal(r.how, 'all-melded');
  assert.deepEqual(r.points, [-10, 17], 'the 4 and 5 of espadas go on 1-2-3; 8 and 9 of bastos count');
  assert.deepEqual(t.scores, [-10, 17]);
  assert.deepEqual(t.lastHand.result.shown[1].laid.sort(), ['4e', '5e']);
  let c = customHand(G, opts, [['3o', '4o', '5o', '6o', '7o', '8o', '1c'], ['4e', '5e', '6e', '12c', '11c', '10c', '9b']], { mano: 0, pozo: ['4c'], stock: ['4b', '9o'] });
  c = apply(c, { type: 'draw', from: 'mazo' });
  c = apply(c, { type: 'cut', card: '1c' });
  assert.equal(c.over, true);
  assert.equal(c.winner, 0);
  assert.equal(c.how, 'chinchon');
});

test('Ludoteka: no cut in the first round; a cut with one loose card of 4 or less', () => {
  let s = customHand(L40, { ...M2, seed: 2 }, [['1e', '2e', '3e', '6o', '6c', '6b', '1c'], ['4e', '5e', '6e', '12c', '11c', '10c', '7b']], { mano: 0, pozo: ['4c'], stock: ['4b', '7o', '2b', '3c'] });
  s = apply(s, { type: 'draw', from: 'mazo' });
  assert.ok(!legalActions(s, 0).some(a => a.type === 'cut'), 'first round');
  s = apply(s, { type: 'discard', card: '3c' });
  s = apply(s, { type: 'draw', from: 'mazo' });
  s = apply(s, { type: 'discard', card: '2b' });
  s = apply(s, { type: 'draw', from: 'mazo' });
  const cut = legalActions(s, 0).find(a => a.type === 'cut' && a.card === '7o');
  assert.ok(cut);
  const t = apply(s, cut);
  assert.deepEqual(t.history[0].points, [1, 7]);
});

function cardsOk(s) {
  const h = s.hand, all = [...h.hands.flat(), ...h.stock, ...h.pozo, ...(h.cutCard ? [h.cutCard] : [])];
  assert.equal(all.length, deckOf(s.rules).length);
  assert.equal(new Set(all).size, all.length);
}

test('fuzz: random legal play over 600 hands of every rule set, cards conserved, scores add up, matches end', () => {
  const rng = createRng('fuzz-chinchon');
  let hands = 0, m = 0, steps = 0;
  while (hands < 600) {
    const rules = [G, L40, L48, TWO][m % 4], players = 2 + (m % 3);
    let s = newMatch(rules, { players, limit: 60, reenganches: players > 2 ? 1 : 0, seed: 'fz' + m });
    let lastHand = s.handNo, n = 0;
    while (!s.over) {
      const seat = toAct(s), Lg = legalActions(s, seat);
      assert.ok(Lg.length > 0);
      for (let k = 1; k < players; k++) assert.deepEqual(legalActions(s, (seat + k) % players), []);
      assert.equal(new Set(Lg.map(actionKey)).size, Lg.length);
      const cutNow = Lg.filter(a => a.type === 'cut');
      const a = cutNow.length && rng.int(3) === 0 ? cutNow[0] : Lg.filter(x => x.type !== 'cut')[rng.int(Lg.filter(x => x.type !== 'cut').length)] || Lg[0];
      if (steps % 53 === 0) {
        const before = serialize(s), after = apply(s, a);
        assert.equal(serialize(s), before);
        assert.deepEqual(deserialize(serialize(after)), after);
        const o = observation(s, seat);
        assert.deepEqual(o.hand.mine, s.hand.hands[seat]);
        assert.ok(!('hands' in o.hand) && !('stock' in o.hand && Array.isArray(o.hand.stock)));
        s = after;
      } else step(s, a);
      steps++;
      if (!s.over && !s.hand.ended) cardsOk(s);
      if (s.handNo !== lastHand || s.over) {
        const last = s.history[s.history.length - 1];
        if (last.how !== 'chinchon') {
          for (const [x, p] of last.points.entries()) if (p !== null) assert.ok(p >= -10 && p <= 7 * 20, 'hand points ' + p);
        }
        lastHand = s.handNo;
      }
      assert.ok(++n < 20000, 'match too long');
    }
    assert.ok(s.winner !== null && !s.out[s.winner]);
    hands += s.history.length;
    m++;
  }
});

test('chinchon bots: never illegal at any level, deterministic, normal beats facil in more than 60% of 12 matches (Ludoteka 40)', () => {
  assert.throws(() => createBot('experto', 1));
  assert.throws(() => createBot('normal'));
  assert.deepEqual(LEVELS, ['facil', 'normal', 'dificil']);
  const three = playMatch(newMatch(L40, { players: 3, limit: 50, reenganches: 0, seed: 'three' }), LEVELS.map((l, i) => createBot(l, 't' + i)), { maxActions: 20000 });
  assert.ok(three.over);
  const run = () => playMatch(newMatch(G, { ...M2, seed: 'det' }), [createBot('normal', 1), createBot('facil', 2)], { maxActions: 20000 });
  assert.deepEqual(run(), run());
  let w = 0;
  for (let m = 0; m < 12; m++) {
    const a = m % 2, bots = [];
    bots[a] = createBot('normal', 'a' + m); bots[1 - a] = createBot('facil', 'b' + m);
    if (playMatch(newMatch(L40, { ...M2, seed: 'c' + m }), bots, { maxActions: 20000 }).winner === a) w++;
  }
  assert.ok(w / 12 > 0.6, 'normal won ' + w + '/12');
});

test('chinchon bot sanity: cuts at -10 at once, takes a pozo card that completes a meld, keeps comodines', () => {
  let s = customHand(G, { ...M2, seed: 3 }, [['1e', '2e', '3e', '6o', '6c', '6b', '9c'], ['4e', '5e', '12e', '12c', '11c', '10c', '9b']], { mano: 0, pozo: ['6e'], stock: ['4b', '9o'] });
  for (const lvl of LEVELS) assert.deepEqual(createBot(lvl, 1).choose(observation(s, 0)), { type: 'draw', from: 'pozo' }, lvl);
  s = apply(s, { type: 'draw', from: 'pozo' });
  for (const lvl of LEVELS) assert.deepEqual(createBot(lvl, 1).choose(observation(s, 0)), { type: 'cut', card: '9c' }, lvl);
  let j = customHand(G, { ...M2, seed: 4 }, [['1e', 'J1', '12o', '11b', '10o', '9e', '8o'], ['4e', '5e', '12e', '12c', '11c', '10c', '9b']], { mano: 0, pozo: ['5o'], stock: ['4b', '9o'] });
  j = apply(j, { type: 'draw', from: 'mazo' });
  for (const lvl of LEVELS) assert.notEqual(createBot(lvl, 1).choose(observation(j, 0)).card, 'J1');
});
