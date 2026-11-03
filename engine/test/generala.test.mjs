import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULESETS, validateRules, boxesOf, solver, keepOutcomes, boxScore, newGame, legalActions, apply, step, serialize, deserialize, total, createBot, playGame, review, LEVELS, ROLL_COUNT, KEEP_COUNT } from '../generala/index.mjs';
import { servida, generalaWithin } from '../lottery/dice.mjs';
import { frac, eq, sum, toNumber } from '../lottery/exact.mjs';
import { createRng } from '../cards/rng.mjs';

const R = RULESETS.ruibal;
const sheetWith = (rules, open, fill = 0) => Object.fromEntries(boxesOf(rules).map(b => [b, open.includes(b) ? null : fill]));

test('generala rule sets: every field required, no defaults, doble only as an explicit number', () => {
  assert.throws(() => validateRules(), /rule set/);
  for (const k of Object.keys(R).filter(k => k !== 'name')) { const r = { ...R }; delete r[k]; assert.throws(() => validateRules(r), new RegExp(k)); }
  assert.throws(() => validateRules({ ...R, straights: 'any' }));
  assert.throws(() => validateRules({ ...R, generala: 0 }));
  assert.throws(() => validateRules({ ...R, doble: 0 }));
  assert.throws(() => validateRules({ ...R, generalaServida: 'scores' }));
  assert.throws(() => validateRules({ ...R, extra: 1 }), /unknown key/);
  assert.deepEqual(boxesOf(R), ['1', '2', '3', '4', '5', '6', 'escalera', 'full', 'poker', 'generala']);
  assert.equal(boxesOf({ ...R, doble: 100 }).length, 11);
  for (const r of Object.values(RULESETS)) assert.equal(validateRules(r).doble, null);
  assert.throws(() => newGame(R, { players: 2 }), /seed/);
  assert.throws(() => newGame(R, { players: 9, seed: 1 }), /players/);
});

// Quotes "generala-60", "poker-40", "full-30", "escalera-20", "servida-bonus-5", "number-box", "w-escalera-as".
test('box scores: numbers, majors, servida bonus, straights by rule set, doble needs a generala', () => {
  assert.equal(boxScore(R, '6', [6, 6, 6, 2, 2], 2, false), 18);
  assert.equal(boxScore(R, 'full', [6, 6, 6, 2, 2], 2, false), 30);
  assert.equal(boxScore(R, 'full', [6, 6, 6, 2, 2], 1, false), 35);
  assert.equal(boxScore(R, 'poker', [3, 3, 3, 3, 1], 1, false), 45);
  assert.equal(boxScore(R, 'escalera', [2, 3, 4, 5, 6], 3, false), 20);
  assert.equal(boxScore(R, 'escalera', [1, 3, 4, 5, 6], 2, false), 0);
  assert.equal(boxScore(RULESETS['wikipedia-60'], 'escalera', [1, 3, 4, 5, 6], 1, false), 25);
  assert.equal(boxScore(R, 'generala', [4, 4, 4, 4, 4], 3, false), 60);
  assert.equal(boxScore(RULESETS['wikipedia-50'], 'generala', [4, 4, 4, 4, 4], 2, false), 50);
  assert.equal(boxScore(R, 'poker', [4, 4, 4, 4, 4], 2, false), 0, 'a generala is not a poker');
  assert.equal(boxScore(R, '6', [6, 6, 6, 6, 6], 2, false), 30, 'quote five-as-number');
  const D = { ...R, doble: 100 };
  assert.equal(boxScore(D, 'doble', [2, 2, 2, 2, 2], 2, true), 100);
  assert.equal(boxScore(D, 'doble', [2, 2, 2, 2, 2], 2, false), 0);
});

test('exact dice: 252 rolls, 462 keeps, outcomes of a keep sum to 1, servida odds locked', () => {
  assert.equal(ROLL_COUNT, 252);
  assert.equal(KEEP_COUNT, 462);
  const all = keepOutcomes([]);
  assert.equal(all.length, 252);
  assert.ok(eq(sum(all.map(o => o.p)), frac(1n)));
  assert.ok(eq(all.find(o => o.dice.join() === '1,2,3,4,5').p, frac(120n, 7776n)));
  assert.ok(eq(all.find(o => o.dice.join() === '6,6,6,6,6').p, frac(1n, 7776n)));
  const four = keepOutcomes([6, 6, 6, 6]);
  assert.equal(four.length, 6);
  assert.ok(four.every(o => eq(o.p, frac(1n, 6n))));
  const s = servida(R.straights);
  assert.equal(s.generala.oneIn, 1296);
  assert.ok(eq(s.poker.p, frac(25n, 1296n)));
  assert.ok(eq(s.full.p, frac(25n, 648n)));
  assert.ok(eq(s.escalera.p, frac(5n, 162n)));
  assert.ok(eq(servida('escalera-con-as-arriba').escalera.p, frac(5n, 108n)));
});

test('best play: one open box matches the exact chains, the full sheet expectation is locked', () => {
  const S = solver(R, 'game');
  assert.ok(Math.abs(S.expectedRest(sheetWith(R, ['generala'])) - 60 * toNumber(generalaWithin(3).p)) < 1e-9, 'generala alone = 60 x P(generala in 3 throws)');
  assert.ok(Math.abs(S.expectedRest(sheetWith(R, ['6'])) - 6 * 5 * 91 / 216) < 1e-9, 'sixes alone = 6 x 5 x (1 - (5/6)^3)');
  assert.ok(Math.abs(S.expectedTotal - 151.74838504) < 1e-7, 'ruibal ' + S.expectedTotal);
  assert.ok(Math.abs(solver(RULESETS['wikipedia-60'], 'game').expectedTotal - 154.58376615) < 1e-7);
  assert.ok(Math.abs(solver(RULESETS['wikipedia-50'], 'game').expectedTotal - 151.70427698) < 1e-7);
  assert.throws(() => solver(R, 'best'));
  const opts = S.options(sheetWith(R, boxesOf(R)), [1, 1, 1, 2, 3], 1);
  assert.deepEqual(opts[0], { type: 'roll', keep: [1, 1, 1], ev: opts[0].ev });
  for (let i = 1; i < opts.length; i++) assert.ok(opts[i - 1].ev >= opts[i].ev);
  const last = S.options(sheetWith(R, ['full', '2']), [6, 6, 6, 2, 2], 3);
  assert.equal(last[0].box, 'full');
  assert.ok(last.every(o => o.type === 'score'));
});

test('Monte Carlo of the best policy agrees with its exact expectation (one box, 2000 turns)', () => {
  const S = solver(R, 'game'), sheet = sheetWith(R, ['poker']), rng = createRng('mc-generala');
  let tot = 0, sq = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) {
    let dice = [], throws = 0, pts = 0;
    for (;;) {
      const keep = throws === 0 ? [] : null;
      if (keep === null) {
        const best = S.options(sheet, dice, throws)[0];
        if (best.type === 'score') { pts = best.points; break; }
        dice = best.keep.slice();
      }
      while (dice.length < 5) dice.push(rng.int(6) + 1);
      dice.sort((a, b) => a - b); throws++;
    }
    tot += pts; sq += pts * pts;
  }
  const mean = tot / n, sd = Math.sqrt(sq / n - mean * mean), want = S.expectedRest(sheet);
  assert.ok(Math.abs(mean - want) < 4 * sd / Math.sqrt(n), mean + ' vs ' + want);
});

test('game: servida wins at once, boxes fill, totals and winners, apply is pure, JSON round trip', () => {
  let found = null;
  for (let seed = 0; seed < 4000 && !found; seed++) {
    const s = apply(newGame(R, { players: 2, seed }), { type: 'roll', keep: [] });
    if (s.over) found = s;
  }
  assert.ok(found, 'some seed throws a generala servida');
  assert.equal(found.how, 'servida');
  assert.equal(found.winners.length, 1);
  let s = newGame(R, { players: 2, seed: 'g' });
  assert.deepEqual(legalActions(s), [{ type: 'roll', keep: [] }]);
  assert.throws(() => apply(s, { type: 'score', box: '1' }), /throw first/);
  s = apply(s, { type: 'roll', keep: [] });
  const before = serialize(s), next = apply(s, { type: 'score', box: '1' });
  assert.equal(serialize(s), before);
  assert.deepEqual(deserialize(serialize(next)), next);
  assert.throws(() => apply(next, { type: 'roll', keep: [7] }));
});

test('fuzz: 1200 random games, legal moves only, every box filled once, totals add up', () => {
  const rng = createRng('fuzz-generala');
  let servidas = 0;
  for (let g = 0; g < 1200; g++) {
    const rules = Object.values(RULESETS)[g % 3];
    const s = newGame(g % 7 === 0 ? { ...rules, doble: 100 } : rules, { players: 1 + (g % 4), seed: 'fz' + g });
    let n = 0;
    while (!s.over) {
      const L = legalActions(s);
      assert.ok(L.length > 0);
      step(s, L[rng.int(L.length)]);
      assert.ok(s.throws <= 3);
      assert.ok(++n < 400);
    }
    if (s.how === 'servida') { servidas++; continue; }
    for (const sh of s.sheets) assert.ok(Object.values(sh).every(v => Number.isInteger(v) && v >= 0));
    const t = s.sheets.map(total);
    assert.ok(s.winners.every(i => t[i] === Math.max(...t)));
    assert.equal(s.log.filter(e => e.type === 'score').length, s.players * boxesOf(s.rules).length);
  }
  assert.ok(servidas > 0);
});

test('bots: levels and seeds required, deterministic, dificil beats facil in more than 60% of 30 games', () => {
  assert.throws(() => createBot('experto', 1));
  assert.throws(() => createBot('normal'));
  assert.deepEqual(LEVELS, ['facil', 'normal', 'dificil']);
  const run = () => playGame(newGame(R, { players: 2, seed: 'det' }), [createBot('dificil', 1), createBot('facil', 2)], { maxActions: 200 });
  assert.deepEqual(run(), run());
  let w = 0;
  for (let m = 0; m < 30; m++) {
    const a = m % 2, bots = [];
    bots[a] = createBot('dificil', 'a' + m); bots[1 - a] = createBot('facil', 'b' + m);
    const s = playGame(newGame(R, { players: 2, seed: 'serie' + m }), bots, { maxActions: 200 });
    if (s.winners.length === 1 && s.winners[0] === a) w++;
  }
  assert.ok(w / 30 > 0.6, 'dificil won ' + w + '/30');
});

test('review: the dificil bot never leaves the best play, the facil bot does', () => {
  const s = playGame(newGame(R, { players: 2, seed: 'rev' }), [createBot('dificil', 1), createBot('facil', 2)], { maxActions: 200 });
  if (s.how === 'servida') return;
  assert.deepEqual(review(s, 0), []);
  const f = review(s, 1);
  assert.ok(f.length > 0);
  assert.ok(f.every(x => x.lost > 0 && x.best.ev >= x.chose.ev));
});
