// Quiniela locks: payouts, odds and returns per $ 100 for LOTBA and PBA; the regulation's own redoblona examples; exact
// distributions against Monte Carlo over random extracts settled place by place (an independent implementation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { directBet, redoblona, payTable, settleDirect, settleRedoblona } from '../lottery/quiniela.mjs';
import { frac, eq, toNumber, sum, mul } from '../lottery/exact.mjs';
import { xoshiro128ss } from '../lottery/rng.mjs';

const F = (n, d = 1) => frac(BigInt(n), BigInt(d));
const peso = q => toNumber(q);

test('a la cabeza: payout and return per $ 100 equal the cited ratios', () => {
  for (const rules of ['lotba-quiniela', 'pba-quiniela']) {
    const want = { 1: [7, 10, 70], 2: [70, 100, 70], 3: [600, 1000, 60], 4: [3500, 10000, 35] };
    for (const [d, [ratio, oneIn, per100]] of Object.entries(want)) {
      const r = directBet({ rules, digits: +d, places: 1, stake: 100 });
      assert.ok(eq(r.perHit, F(ratio * 100)), rules + ' ' + d);
      assert.equal(r.oneIn, oneIn);
      assert.ok(eq(r.evPer100, F(per100)));
    }
  }
  const five = directBet({ rules: 'pba-quiniela', digits: 5, places: 1, stake: 100 });
  assert.ok(eq(five.perHit, F(1000000)));
  assert.ok(eq(five.evPer100, F(10)));
  assert.throws(() => directBet({ rules: 'lotba-quiniela', digits: 5, places: 1, stake: 100 }), { code: 'BAD_OPTION' });
});

test('a los 5, 10, 20: the stake is divided by the places (LOTBA art. 11, PBA art. 20)', () => {
  const want = { 5: 1400, 10: 700, 20: 350 };
  for (const [places, perHit] of Object.entries(want)) {
    const r = directBet({ rules: 'lotba-quiniela', digits: 2, places: +places, stake: 100 });
    assert.ok(eq(r.perHit, F(perHit)));
    assert.ok(eq(r.evPer100, F(70)), 'the return does not depend on the places');
  }
  const r20 = directBet({ rules: 'pba-quiniela', digits: 2, places: 20, stake: 100 });
  assert.ok(eq(r20.pWin, frac(100n ** 20n - 99n ** 20n, 100n ** 20n)));
  assert.equal(r20.oneIn.toFixed(4), '5.4917');
  assert.throws(() => directBet({ rules: 'pba-quiniela', digits: 2, places: 7, stake: 100 }), { code: 'BAD_OPTION' });
  assert.ok(eq(directBet({ rules: 'lotba-quiniela', digits: 2, places: { from: 3, to: 9 }, stake: 70 }).perHit, F(700)));
});

test('PBA art. 20 cap: repeated 4-digit hits are an honest range, 1-2 digits are never cut', () => {
  for (const d of [1, 2]) assert.equal(directBet({ rules: 'pba-quiniela', digits: d, places: 20, stake: 100 }).pUnclear.n, 0n);
  const r = directBet({ rules: 'pba-quiniela', digits: 4, places: 20, stake: 100 });
  assert.ok(r.pUnclear.n > 0n);
  assert.ok(toNumber(r.evLowPer100) < 35 && toNumber(r.evLowPer100) > 34.9);
  assert.ok(eq(directBet({ rules: 'lotba-quiniela', digits: 4, places: 20, stake: 100 }).evLowPer100, F(35)));
});

test('no defaults: every option is required', () => {
  assert.throws(() => directBet({ digits: 2, places: 1, stake: 100 }), { code: 'MISSING' });
  assert.throws(() => directBet({ rules: 'lotba-quiniela', places: 1, stake: 100 }), { code: 'MISSING' });
  assert.throws(() => directBet({ rules: 'lotba-quiniela', digits: 2, stake: 100 }), { code: 'MISSING' });
  assert.throws(() => directBet({ rules: 'lotba-quiniela', digits: 2, places: 1 }), { code: 'MISSING' });
  assert.throws(() => directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 10.005 }), { code: 'MONEY_PRECISION' });
});

test('pay table lists every digits x places', () => {
  assert.equal(payTable({ rules: 'lotba-quiniela', stake: 100 }).length, 16);
  assert.equal(payTable({ rules: 'pba-quiniela', stake: 100 }).length, 20);
});

test('redoblona: lock payouts and caps', () => {
  const l = redoblona({ rules: 'lotba-quiniela', first: { number: 12, places: 1 }, second: { number: 34, places: 5 }, stake: 100 });
  assert.deepEqual(l.outcomes.map(o => peso(o.amount)), [0, 98000, 150000]);
  assert.equal(l.second.places.from, 2); assert.equal(l.second.places.to, 6);
  const p = redoblona({ rules: 'pba-quiniela', first: { number: 12, places: 1 }, second: { number: 34, places: 5 }, stake: 100 });
  assert.deepEqual(p.outcomes.map(o => peso(o.amount)), [0, 128000, 200000]);
  assert.ok(eq(l.pWin, p.pWin));
  const two = redoblona({ rules: 'lotba-quiniela', first: { number: 1, places: 1 }, second: { number: 2, places: 2 }, stake: 100 });
  assert.equal(peso(two.outcomes.at(-1).amount), 250000);
  assert.ok(two.outcomes.some(o => peso(o.amount) === 245000));
  const last = redoblona({ rules: 'lotba-quiniela', first: { number: 5, places: 1 }, second: { number: 6, places: 20 }, stake: 190 });
  assert.equal(last.second.divisor, 19);
  assert.ok(last.outcomes.some(o => peso(o.amount) === 190 * 70 * 70 / 19));
  assert.throws(() => redoblona({ rules: 'pba-quiniela', first: { number: 1, places: 10 }, second: { number: 2, places: 5 }, stake: 100 }), { code: 'NOT_REDOBLONA' });
  assert.throws(() => redoblona({ rules: 'lotba-quiniela', first: { number: 1, places: 1 }, second: { number: 2, places: 1 }, stake: 100 }), { code: 'NOT_REDOBLONA' });
});

test('redoblona: the counting examples written in LOTBA article 10.d', () => {
  const ex = hitsAt => { const e = Array(20).fill(5050); hitsAt.forEach(i => { e[i - 1] = 7777; }); return e; };
  const run = (r1, r2, at) => settleRedoblona({ rules: 'lotba-quiniela', first: { number: 77, places: r1 }, second: { number: 77, places: r2 }, stake: 100, extract: ex(at) });
  let r = run({ from: 1, to: 10 }, { from: 12, to: 20 }, [3, 6, 8, 14]);
  assert.deepEqual([r.A, r.B], [3, 1]);
  r = run({ from: 1, to: 12 }, { from: 5, to: 20 }, [3, 6, 8, 14]);
  assert.deepEqual([r.A, r.B], [2, 2]);
  r = run({ from: 1, to: 12 }, { from: 2, to: 10 }, [1, 3, 6, 8]);
  assert.deepEqual([r.A, r.B], [2, 2]);
});

const randomExtract = rng => Array.from({ length: 20 }, () => rng.int(10000));
function mcMean(settle, rng, n) {
  let s = 0, wins = 0;
  for (let i = 0; i < n; i++) { const v = peso(settle(randomExtract(rng))); s += v; if (v > 0) wins++; }
  return { mean: s / n, pWin: wins / n };
}

test('direct bets: exact against Monte Carlo of settled extracts', () => {
  const rng = xoshiro128ss(20261103);
  const n = 60000;
  for (const [rules, digits, places] of [['lotba-quiniela', 1, 20], ['lotba-quiniela', 2, 10], ['pba-quiniela', 2, 5]]) {
    const ex = directBet({ rules, digits, places, stake: 100 });
    const mc = mcMean(extract => settleDirect({ rules, digits, number: 7, places, stake: 100, extract }).payout, rng, n);
    const sd = Math.sqrt(sum(ex.outcomes.map(o => mul(o.p, mul(o.payout, o.payout)))).n > 0n ? toNumber(sum(ex.outcomes.map(o => mul(o.p, mul(o.payout, o.payout))))) / n : 1);
    assert.ok(Math.abs(mc.mean - toNumber(ex.ev)) < 5 * sd, rules + ' ' + digits + ' ' + places + ': mc ' + mc.mean + ' exact ' + toNumber(ex.ev));
    const pw = toNumber(ex.pWin);
    assert.ok(Math.abs(mc.pWin - pw) < 5 * Math.sqrt(pw * (1 - pw) / n));
  }
});

test('redoblona: exact distribution against Monte Carlo of settled extracts (same and different numbers, both styles)', () => {
  const rng = xoshiro128ss(7);
  const n = 100000;
  const cases = [
    ['lotba-quiniela', { number: 12, places: 5 }, { number: 34, places: 20 }],
    ['lotba-quiniela', { number: 12, places: { from: 1, to: 12 } }, { number: 12, places: { from: 5, to: 20 } }],
    ['lotba-quiniela', { number: 40, places: { from: 8, to: 8 } }, { number: 40, places: 10 }],
    ['pba-quiniela', { number: 12, places: 5 }, { number: 12, places: 20 }],
    ['pba-quiniela', { number: 3, places: 10 }, { number: 9, places: 10 }],
  ];
  for (const [rules, first, second] of cases) {
    const ex = redoblona({ rules, first, second, stake: 100 });
    const mc = mcMean(extract => settleRedoblona({ rules, first, second, stake: 100, extract }).payout, rng, n);
    const pw = toNumber(ex.pWin);
    assert.ok(Math.abs(mc.pWin - pw) < 5 * Math.sqrt(pw * (1 - pw) / n) + 1e-6, rules + ' ' + JSON.stringify([first, second]) + ': mc ' + mc.pWin + ' exact ' + pw);
    const m2 = toNumber(sum(ex.outcomes.map(o => mul(o.p, mul(o.amount, o.amount)))));
    assert.ok(Math.abs(mc.mean - toNumber(ex.ev)) < 5 * Math.sqrt(m2 / n) + 1e-6, 'mean ' + mc.mean + ' vs ' + toNumber(ex.ev));
  }
});
