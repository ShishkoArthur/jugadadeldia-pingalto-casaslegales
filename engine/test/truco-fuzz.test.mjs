import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, legalActions, step, apply, toAct, serialize, deserialize, observation, actionKey } from '../truco/game.mjs';
import { RULESETS, envidoCanRaise } from '../truco/rules.mjs';
import { createRng } from '../cards/rng.mjs';
import { DECK_40 } from '../cards/spanish.mjs';
import { createBot, playMatch, LEVELS } from '../truco/bots.mjs';

function checkHand(s) {
  const h = s.hand;
  const all = h.hands.flat();
  assert.equal(all.length, 6);
  assert.equal(new Set(all).size, 6);
  assert.ok(all.every(c => DECK_40.includes(c)));
  for (let p = 0; p < 2; p++) {
    const played = h.bazas.map(b => b.cards[p]).filter(Boolean);
    assert.deepEqual([...played, ...h.left[p]].sort(), h.hands[p].slice().sort());
  }
  assert.ok(h.truco.level >= 1 && h.truco.level <= 4);
  assert.ok(h.bazas.length >= 1 && h.bazas.length <= 3);
  const c = [];
  for (const k of h.envido.chain) { assert.ok(envidoCanRaise(c, k)); c.push(k); }
}

test('random self-play: 10 000 hands, no illegal move accepted, scores consistent, every match ends', () => {
  const rng = createRng('fuzz-truco');
  const sets = Object.values(RULESETS).filter(r => r.players === 2);
  let hands = 0, matches = 0, steps = 0;
  while (hands < 10000) {
    const rules = sets[matches % sets.length];
    let s = newMatch(rules, 'fz' + matches);
    let n = 0, lastScore = [0, 0], lastHand = s.handNo;
    while (!s.over) {
      const seat = toAct(s);
      assert.notEqual(seat, null);
      const L = legalActions(s, seat);
      assert.ok(L.length > 0);
      assert.deepEqual(legalActions(s, 1 - seat), []);
      assert.equal(new Set(L.map(actionKey)).size, L.length);
      const a = L[rng.int(L.length)];
      if (steps % 97 === 0) {
        const before = serialize(s);
        const after = apply(s, a);
        assert.equal(serialize(s), before, 'apply must not mutate');
        assert.deepEqual(deserialize(serialize(after)), after);
        const o = observation(s, seat);
        assert.equal(o.hand.hands[1 - seat], null);
        assert.equal(typeof o.hand.left[1 - seat], 'number');
        s = after;
      } else step(s, a);
      steps++;
      if (rng.int(50) === 0) {
        const bad = { type: 'play', card: DECK_40[rng.int(40)] };
        if (!legalActions(s, toAct(s) ?? 0).some(x => x.type === 'play' && x.card === bad.card) && !s.over) assert.throws(() => apply(s, bad));
      }
      assert.ok(s.score[0] >= lastScore[0] && s.score[1] >= lastScore[1], 'scores never go down');
      lastScore = s.score.slice();
      if (!s.over) checkHand(s);
      if (s.handNo !== lastHand) {
        const prev = s.history[s.history.length - 1];
        assert.ok(prev.points[0] + prev.points[1] >= 1, 'every finished hand pays at least one point');
        assert.deepEqual(prev.score, s.score);
        lastHand = s.handNo;
      }
      assert.ok(++n < 3000, 'match too long');
    }
    assert.ok(s.score[s.winner] >= rules.target);
    assert.ok(s.score[1 - s.winner] < rules.target);
    const sum = [0, 0];
    for (const h of s.history) { sum[0] += h.points[0]; sum[1] += h.points[1]; }
    assert.deepEqual(sum, s.score, 'history adds up to the score');
    hands += s.history.length;
    matches++;
  }
  assert.ok(hands >= 10000);
});

test('bots of every level never make an illegal move (mixed seats, con and sin flor)', () => {
  let m = 0;
  for (const rules of [RULESETS['clasico-30-con-flor'], RULESETS['corto-15-sin-flor']]) {
    for (const a of LEVELS) for (const b of LEVELS) {
      const s = playMatch(newMatch(rules, 'legal' + m), [createBot(a, 'x' + m), createBot(b, 'y' + m)], { maxActions: 4000 });
      assert.ok(s.over);
      m++;
    }
  }
});
