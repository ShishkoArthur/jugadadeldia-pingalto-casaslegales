// Dice, generala, RNG and the year simulator: exact locks, brute force, Monte Carlo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollDice, handOf, servida, generalaWithin, GENERALA } from '../lottery/dice.mjs';
import { xoshiro128ss, splitmix64, cryptoRng } from '../lottery/rng.mjs';
import { yearExact, yearMonteCarlo } from '../lottery/simulate.mjs';
import { directBet } from '../lottery/quiniela.mjs';
import { frac, eq, toNumber } from '../lottery/exact.mjs';

test('splitmix64 and xoshiro128** are the published generators', () => {
  const sm = splitmix64(1234567n);
  assert.equal(sm().toString(16), '599ed017fb08fc85');
  const a = xoshiro128ss(1), b = xoshiro128ss(1), c = xoshiro128ss(2);
  const sa = Array.from({ length: 5 }, () => a.u32()), sb = Array.from({ length: 5 }, () => b.u32()), sc = Array.from({ length: 5 }, () => c.u32());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  const r = xoshiro128ss(5), counts = Array(6).fill(0);
  for (let i = 0; i < 60000; i++) counts[r.int(6)]++;
  counts.forEach(x => assert.ok(Math.abs(x - 10000) < 500));
  assert.ok(cryptoRng().int(6) < 6);
});

test('dice roller: needs an rng, returns faces 1..sides', () => {
  assert.throws(() => rollDice({ dice: 5, sides: 6 }), { code: 'MISSING' });
  const roll = rollDice({ dice: 10, sides: 6, rng: xoshiro128ss(3) });
  assert.equal(roll.length, 10);
  assert.ok(roll.every(v => v >= 1 && v <= 6));
});

test('generala servida: exact counts over 7776 rolls', () => {
  const s = servida('escalera-12345-23456');
  assert.deepEqual([s.generala.ways, s.poker.ways, s.full.ways, s.escalera.ways], [6, 150, 300, 240]);
  assert.equal(s.generala.oneIn, 1296);
  assert.equal(servida('escalera-con-as-arriba').escalera.ways, 360);
  assert.throws(() => servida(undefined), { code: 'UNKNOWN_RULES' });
  assert.equal(handOf([3, 4, 5, 6, 1], 'escalera-con-as-arriba'), 'escalera');
  assert.equal(handOf([3, 4, 5, 6, 1], 'escalera-12345-23456'), null);
  assert.deepEqual(Object.keys(GENERALA).sort(), ['escalera-12345-23456', 'escalera-con-as-arriba']);
});

test('generala within three rolls: exact chain, known value, Monte Carlo', () => {
  assert.ok(eq(generalaWithin(1).p, frac(1n, 1296n)));
  const g = generalaWithin(3);
  assert.ok(eq(g.p, frac(2783176n, 60466176n)));
  const rng = xoshiro128ss(11), n = 200000;
  let hits = 0;
  for (let i = 0; i < n; i++) {
    let kept = [];
    for (let r = 0; r < 3; r++) {
      const roll = kept.concat(Array.from({ length: 5 - kept.length }, () => rng.int(6) + 1));
      const c = Array(7).fill(0); roll.forEach(v => c[v]++);
      let best = kept.length ? kept[0] : 1;
      for (let f = 1; f <= 6; f++) if (c[f] > c[best]) best = f;
      kept = roll.filter(v => v === best);
      if (kept.length === 5) break;
    }
    if (kept.length === 5) hits++;
  }
  const p = toNumber(g.p);
  assert.ok(Math.abs(hits / n - p) < 5 * Math.sqrt(p * (1 - p) / n), 'mc ' + hits / n + ' exact ' + p);
});

test('a year of quiniela: exact distribution against Monte Carlo', () => {
  for (const places of [1, 10]) {
    const b = directBet({ rules: 'lotba-quiniela', digits: 2, places, stake: 100 });
    const outcomes = b.outcomes.map(o => ({ amount: o.payout, p: o.p }));
    const ex = yearExact({ outcomes, stake: b.stake, plays: 300, floor: 1e-18 });
    assert.equal(toNumber(ex.meanNet), -9000);
    assert.ok(ex.lost < 1e-12);
    const mc = yearMonteCarlo({ outcomes, stake: b.stake, plays: 300, years: 4000, seed: 2026 });
    assert.ok(Math.abs(mc.pAhead - ex.pAhead) < 5 * Math.sqrt(ex.pAhead * (1 - ex.pAhead) / 4000) + 1e-3, places + ': mc ' + mc.pAhead + ' exact ' + ex.pAhead);
    assert.ok(Math.abs(mc.meanNet - -9000) < 5 * ex.sdNet / Math.sqrt(4000));
  }
  const cab = directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 100 });
  const y = yearExact({ outcomes: cab.outcomes.map(o => ({ amount: o.payout, p: o.p })), stake: cab.stake, plays: 300, floor: 1e-18 });
  assert.equal(y.pAhead.toFixed(4), '0.1839');
  assert.throws(() => yearExact({ outcomes: [], stake: cab.stake, plays: 1, floor: 0 }), { code: 'MISSING' });
});
