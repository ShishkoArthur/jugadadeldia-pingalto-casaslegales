import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, customHand, legalActions, step, apply, toAct, serialize, deserialize, observation, actionKey } from '../truco/game.mjs';
import { RULESETS, validateRules, envidoCanRaise } from '../truco/rules.mjs';
import { SENAS, legalSignals, signal, singEnvido, pieOf } from '../truco/game4.mjs';
import { sampleDeals } from '../truco/bots4.mjs';
import { createRng } from '../cards/rng.mjs';
import { DECK_40 } from '../cards/spanish.mjs';
import { createBot, playMatch, LEVELS } from '../truco/bots.mjs';

const P30 = RULESETS['parejas-30-sin-flor'], P15 = RULESETS['parejas-15-sin-flor'];
const act = (s, type, card) => apply(s, card ? { type, card } : { type });

test('2 vs 2 rule sets: responder required, flor not yet, no responder with 2 players', () => {
  const ok = { players: 4, target: 30, flor: false, falta: 'leader-to-win', mazoNoCardPoints: 2, responder: 'pie' };
  assert.equal(validateRules(ok).players, 4);
  const { responder, ...noResp } = ok;
  assert.throws(() => validateRules(noResp), /responder/);
  assert.throws(() => validateRules({ ...ok, responder: 'any' }), /responder/);
  assert.throws(() => validateRules({ ...ok, flor: true }), /con flor/);
  assert.throws(() => validateRules({ ...noResp, players: 2, responder: 'pie' }), /unknown key/);
  assert.throws(() => validateRules({ ...noResp, players: 3 }), /players/);
  assert.equal(validateRules(P30).responder, 'pie');
  assert.equal(validateRules(P15).responder, 'next');
});

test('deal and order: four hands of three, the mano starts, turns go around, the next hand moves the mano', () => {
  const s = newMatch(P30, 7);
  const all = s.hand.hands.flat();
  assert.equal(new Set(all).size, 12);
  const m = s.hand.mano;
  assert.equal(toAct(s), m);
  for (let k = 1; k < 4; k++) assert.deepEqual(legalActions(s, (m + k) % 4), []);
  let t = s;
  for (let k = 0; k < 4; k++) { assert.equal(toAct(t), (m + k) % 4); t = act(t, 'play', t.hand.left[toAct(t)][0]); }
  assert.equal(t.hand.bazas.length, 2);
});

// "4p-baza-same-team", "4p-lead-winner", "parda-mano-leads".
test('bazas: equal top cards of one team win, of both teams make a parda and the mano leads again', () => {
  let s = customHand(P30, 1, [['3e', '4c', '5c'], ['2e', '4o', '5o'], ['3b', '6c', '10c'], ['2b', '6o', '10o']], { mano: 0, score: [0, 0] });
  s = act(s, 'play', '3e'); s = act(s, 'play', '2e'); s = act(s, 'play', '3b'); s = act(s, 'play', '2b');
  assert.equal(s.hand.bazas[0].winner, 0);
  assert.equal(s.hand.bazas[0].by, 0, 'the first of the two equal cards leads');
  assert.equal(toAct(s), 0);
  let p = customHand(P30, 1, [['3e', '4c', '5c'], ['3o', '4o', '5o'], ['6b', '6c', '10c'], ['2b', '6o', '10o']], { mano: 1, score: [0, 0] });
  p = act(p, 'play', '3o'); p = act(p, 'play', '6b'); p = act(p, 'play', '2b'); p = act(p, 'play', '3e');
  assert.equal(p.hand.bazas[0].winner, -1);
  assert.equal(toAct(p), 1, 'after a parda the mano leads');
});

// "4p-envido-tie-mano", "4p-son-buenas".
test('envido per team: the best hand of a team counts, ties go to the one nearer the mano, losers say son buenas', () => {
  const r = singEnvido({ hands: [['4c', '5b', '12o'], ['7e', '5e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']], folded: [false, false, false, false], mano: 0 });
  assert.deepEqual(r.points, [5, 32, 33, 7]);
  assert.equal(r.winner, 2);
  assert.deepEqual(r.shown, [true, true, true, false]);
  const tie = singEnvido({ hands: [['4c', '5b', '12o'], ['7e', '6e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']], folded: [false, false, false, false], mano: 1 });
  assert.equal(tie.winner, 1, '33 against 33: the one nearer the mano');
  let s = customHand(P30, 1, [['4c', '5b', '12o'], ['7e', '5e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']], { mano: 0, score: [0, 0] });
  s = act(s, 'envido');
  assert.equal(toAct(s), 3, 'pie of the other team answers (responder pie)');
  s = act(s, 'quiero');
  assert.deepEqual(s.score, [2, 0]);
  const o = observation(s, 1);
  assert.equal(o.hand.envido.result.points[3], null, 'a son buenas stays hidden');
  assert.equal(o.hand.envido.result.points[2], 33);
});

test('responder: pie answers for its team, next answers with responder next; raises go back the same way', () => {
  const hands = [['4c', '5b', '12o'], ['7e', '5e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']];
  let s = customHand(P30, 1, hands, { mano: 2, score: [0, 0] });
  assert.equal(pieOf(s.hand, 0), 0);
  assert.equal(pieOf(s.hand, 1), 1);
  s = act(s, 'truco');
  assert.equal(toAct(s), 1);
  s = act(s, 'retruco');
  assert.equal(toAct(s), 0, 'the pie of the calling team answers the retruco');
  let n = customHand(P15, 1, hands, { mano: 2, score: [0, 0] });
  n = act(n, 'truco');
  assert.equal(toAct(n), 3, 'next opponent after seat 2');
  n = act(n, 'envido');
  assert.equal(toAct(n), 0, 'the envido is first; next of the other team after seat 3');
  n = act(n, 'noQuiero');
  assert.deepEqual(n.score, [0, 1]);
  assert.equal(toAct(n), 3, 'back to the truco answer');
});

// "4p-mazo-alone", "4p-mazo-both", "mazo-no-card-2".
test('mazo: one player leaves and his partner plays on; both leave and the other team scores', () => {
  const hands = [['4c', '5b', '12o'], ['7e', '5e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']];
  let s = customHand(P30, 1, hands, { mano: 0, score: [0, 0] });
  s = act(s, 'mazo');
  assert.equal(toAct(s), 1);
  s = act(s, 'play', '7e'); s = act(s, 'play', '6c'); s = act(s, 'play', '7o');
  assert.equal(s.hand.bazas.length, 2, 'the baza closes without the player who left');
  let b = customHand(P30, 1, hands, { mano: 0, score: [0, 0] });
  b = act(b, 'mazo'); b = act(b, 'play', '7e'); b = act(b, 'mazo');
  assert.deepEqual(b.score, [0, 2], 'team 0 left before playing a card, nothing sung: 2 (Juegos Bonaerenses 6.1)');
  let c = customHand(P15, 1, hands, { mano: 0, score: [0, 0] });
  c = act(c, 'mazo'); c = act(c, 'play', '7e'); c = act(c, 'mazo');
  assert.deepEqual(c.score, [0, 1], 'mazoNoCardPoints 1');
});

// "4p-senas".
test('senas: only true ones, once each, seen by the partner only; bots never signal', () => {
  const hands = [['1e', '3c', '6b'], ['7e', '5e', '1b'], ['6c', '7c', '10b'], ['7o', '11e', '4b']];
  const s = customHand(P30, 1, hands, { mano: 0, score: [0, 0] });
  assert.deepEqual(legalSignals(s, 0), ['1e', 'tres']);
  assert.deepEqual(legalSignals(s, 2), ['malas', 'envido']);
  assert.ok(legalSignals(s, 3).includes('7o'));
  assert.throws(() => signal(s, 0, '1b'));
  const t = signal(s, 0, '1e');
  assert.equal(s.hand.senas.length, 0, 'signal does not mutate');
  assert.deepEqual(legalSignals(t, 0), ['tres']);
  assert.deepEqual(observation(t, 2).hand.senas, [{ seat: 0, sign: '1e' }]);
  assert.deepEqual(observation(t, 1).hand.senas, []);
  assert.ok(SENAS.length === 9);
  const S = sampleDeals(observation(t, 2), 60, createRng(3), false);
  assert.ok(S.deals.every(d => d[0].includes('1e')), 'the partner bot believes the sena');
  assert.ok(S.deals.every(d => d[2].join() === hands[2].join()));
  const m = newMatch(P15, 'nosign');
  playMatch(m, [0, 1, 2, 3].map(i => createBot('normal', 'ns' + i)), { maxActions: 5000 });
  for (const h of m.history) assert.ok(h);
  assert.ok(m.lastHand.senas.length === 0);
});

function checkHand(s) {
  const h = s.hand, all = h.hands.flat();
  assert.equal(all.length, 12);
  assert.equal(new Set(all).size, 12);
  assert.ok(all.every(c => DECK_40.includes(c)));
  for (let p = 0; p < 4; p++) {
    const played = h.bazas.map(b => b.cards[p]).filter(Boolean);
    assert.deepEqual([...played, ...h.left[p]].sort(), h.hands[p].slice().sort());
  }
  assert.ok(!(h.folded[0] && h.folded[2]) && !(h.folded[1] && h.folded[3]), 'a whole team out ends the hand');
  assert.ok(h.truco.level >= 1 && h.truco.level <= 4);
  assert.ok(h.bazas.length >= 1 && h.bazas.length <= 3);
  const c = [];
  for (const k of h.envido.chain) { assert.ok(envidoCanRaise(c, k)); c.push(k); }
}

test('2 vs 2 random self-play: 10 000 hands, legal moves only, scores consistent, every match ends', () => {
  const rng = createRng('fuzz-truco-4');
  const sets = [P30, P15];
  let hands = 0, matches = 0, steps = 0;
  while (hands < 10000) {
    const rules = sets[matches % 2];
    let s = newMatch(rules, 'f4-' + matches);
    let n = 0, lastScore = [0, 0], lastHand = s.handNo;
    while (!s.over) {
      const seat = toAct(s), L = legalActions(s, seat);
      assert.ok(L.length > 0);
      for (let k = 1; k < 4; k++) assert.deepEqual(legalActions(s, (seat + k) % 4), []);
      assert.equal(new Set(L.map(actionKey)).size, L.length);
      const a = L[rng.int(L.length)];
      if (steps % 89 === 0) {
        const before = serialize(s), after = apply(s, a);
        assert.equal(serialize(s), before, 'apply must not mutate');
        assert.deepEqual(deserialize(serialize(after)), after);
        const o = observation(s, seat);
        for (let k = 1; k < 4; k++) assert.equal(o.hand.hands[(seat + k) % 4], null);
        s = after;
      } else step(s, a);
      steps++;
      if (rng.int(40) === 0 && !s.over) {
        const bad = { type: 'play', card: DECK_40[rng.int(40)] };
        if (!legalActions(s, toAct(s)).some(x => x.card === bad.card)) assert.throws(() => apply(s, bad));
      }
      assert.ok(s.score[0] >= lastScore[0] && s.score[1] >= lastScore[1]);
      lastScore = s.score.slice();
      if (!s.over) checkHand(s);
      if (s.handNo !== lastHand) {
        const prev = s.history[s.history.length - 1];
        assert.ok(prev.points[0] + prev.points[1] >= 1);
        assert.deepEqual(prev.score, s.score);
        assert.equal(s.hand.mano, (s.lastHand.mano + 1) % 4, 'the mano moves to the next seat');
        lastHand = s.handNo;
      }
      assert.ok(++n < 4000, 'match too long');
    }
    assert.ok(s.score[s.winner] >= rules.target && s.score[1 - s.winner] < rules.target);
    const sum = [0, 0];
    for (const h of s.history) { sum[0] += h.points[0]; sum[1] += h.points[1]; }
    assert.deepEqual(sum, s.score);
    hands += s.history.length;
    matches++;
  }
});

test('2 vs 2 bots: every level as teammate and opponent, never illegal, deterministic by seed', () => {
  for (let m = 0; m < 3; m++) {
    const bots = [0, 1, 2, 3].map(s => createBot(LEVELS[(s + m) % 3], 'l' + m + s));
    assert.ok(playMatch(newMatch(m === 1 ? P30 : P15, 'lg' + m), bots, { maxActions: 6000 }).over);
  }
  const run = () => playMatch(newMatch(P15, 'det4'), [0, 1, 2, 3].map(s => createBot(s % 2 ? 'normal' : 'facil', s)), { maxActions: 5000 });
  assert.deepEqual(run(), run());
});

test('2 vs 2 bots: a normal team beats a facil team in more than 60% of 8 seeded matches to 15', () => {
  let w = 0;
  for (let m = 0; m < 8; m++) {
    const a = m % 2;
    const s = playMatch(newMatch(P15, 'sr' + m), [0, 1, 2, 3].map(x => createBot(x % 2 === a ? 'normal' : 'facil', 'q' + m + x)), { maxActions: 5000 });
    if (s.winner === a) w++;
  }
  assert.ok(w / 8 > 0.6, 'normal team won ' + w + '/8');
});

test('2 vs 2 bot sanity: takes an obvious envido, plays low when the partner already wins the baza', () => {
  const s = customHand(P30, 1, [['7e', '6e', '4b'], ['4c', '5o', '12o'], ['10c', '11c', '12b'], ['4o', '5b', '10b']], { mano: 0, score: [0, 0] });
  const a = createBot('normal', 1).choose(observation(s, 0));
  assert.ok(['envido', 'realEnvido', 'faltaEnvido'].includes(a.type), a.type);
  let t = customHand(P30, 1, [['1e', '4c', '5c'], ['4o', '5o', '6o'], ['3c', '4b', '7b'], ['5b', '6b', '6e']], { mano: 0, score: [0, 0] });
  t = act(t, 'envido'); t = act(t, 'noQuiero'); t = act(t, 'truco'); t = act(t, 'quiero'); t = act(t, 'play', '1e'); t = act(t, 'play', '4o');
  const b = createBot('normal', 2).choose(observation(t, 2));
  assert.equal(b.type, 'play');
  assert.notEqual(b.card, '3c', 'keeps the three, the partner already has the baza');
});
