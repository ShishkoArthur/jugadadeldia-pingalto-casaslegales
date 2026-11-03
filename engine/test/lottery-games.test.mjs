// Draw games: lock combinations, odds and prize shares; cross-check against brute force or seeded Monte Carlo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { odds, simpleTickets, multipleJackpot, quini6PremioExtra, lotoPlusMultiplicador, prizeShare, tombolina, quinielaPlusOdds } from '../lottery/games.mjs';
import { frac, eq, toNumber, sum, binom } from '../lottery/exact.mjs';
import { xoshiro128ss } from '../lottery/rng.mjs';

const F = (n, d = 1) => frac(BigInt(n), BigInt(d));
const ways = (o, k) => o.rows.find(r => r.hits === k).ways;

test('combinations and jackpot odds', () => {
  assert.equal(odds('cas-quini6-tradicional').combinations, 9366819n);
  assert.equal(odds('cas-quini6-revancha').combinations, 9366819n);
  assert.equal(odds('lotba-loto-plus-tradicional').combinations, 9366819n);
  assert.equal(odds('cas-brinco').combinations, 3838380n);
  assert.equal(odds('pba-telekino').combinations, 3268760n);
  assert.equal(odds('lotba-poceada').combinations, 186087894300n);
});

test('Quini 6 tiers: 6, 5 and 4 hits, two draws per Tradicional ticket', () => {
  const o = odds('cas-quini6-tradicional');
  assert.deepEqual([6, 5, 4, 3].map(k => ways(o, k)), [1n, 240n, 11700n, 197600n]);
  assert.ok(eq(o.pAnyPrize, F(11941, 9366819)));
  assert.equal(o.draws, 2);
  assert.equal(o.oneInAnyPrize.toFixed(2), '784.43');
  assert.equal(o.oneInAnyPrizeTicket.toFixed(2), '392.46');
  assert.equal(odds('cas-quini6-revancha').oneInAnyPrize, 9366819);
  assert.equal(odds('cas-quini6-siempresale').mostHitsWin, true);
  assert.equal(odds('cas-quini6-siempresale').pAnyPrize, null);
  assert.equal(simpleTickets('cas-quini6-tradicional', 8), 28n);
  assert.ok(eq(multipleJackpot('cas-quini6-tradicional', 8), F(28, 9366819)));
});

test('Brinco, Loto Plus, Telekino, Poceada tiers', () => {
  const b = odds('cas-brinco');
  assert.deepEqual([6, 5, 4, 3].map(k => ways(b, k)), [1n, 204n, 8415n, 119680n]);
  const l = odds('lotba-loto-plus-match');
  assert.ok(eq(l.pAnyPrize, F(11941, 9366819)));
  const t = odds('pba-telekino');
  assert.deepEqual([15, 14, 13, 12, 11].map(k => ways(t, k)), [1n, 150n, 4725n, 54600n, 286650n]);
  assert.ok(eq(t.pAnyPrize, F(346126, 3268760)));
  const p = odds('lotba-poceada');
  assert.equal(ways(p, 8), binom(20, 8));
  assert.ok(p.rows.every(r => r.hits <= 8));
  assert.ok(eq(sum(p.rows.map(r => r.p)), F(1)));
});

test('prize shares per $ 100 of ticket, as the regulations write them', () => {
  const want = { 'cas-quini6-tradicional': [36, 2988, 100], 'cas-quini6-revancha': [54, 432, 10], 'cas-quini6-siempresale': [54, 324, 10],
    'cas-brinco': [4302, 41213160, 1000000], 'lotba-loto-plus': [45, 18315, 1000], 'pba-telekino': [38, 38, 1],
    'lotba-poceada': [45, 38025, 1000], 'pba-quiniela-plus': [60, 56496, 1000], 'pba-chance-plus': [60, 58518, 1000] };
  for (const [id, [pool, n, d]] of Object.entries(want)) {
    const s = prizeShare(id);
    assert.ok(eq(s.per100, F(n, d)), id + ': ' + toNumber(s.per100));
    assert.ok(eq(s.pool, pool > 100 ? F(pool, 10000) : F(pool, 100)), id + ' pool ' + toNumber(s.pool));
  }
});

test('Tombolina: exact returns per $ 100 from the fixed table', () => {
  const want = { 3: 35.25, 4: 33.58, 5: 36.67, 6: 39.44, 7: 38.69 };
  for (const [n, v] of Object.entries(want)) {
    const r = tombolina({ rules: 'lotba-tombolina', numbers: +n, stake: 150 });
    assert.equal(toNumber(r.evPer100).toFixed(2), v.toFixed(2), n + ' numbers');
  }
  const t3 = tombolina({ rules: 'lotba-tombolina', numbers: 3, stake: 100 });
  assert.ok(eq(t3.evPer100, frac(50n * 100n * binom(20, 3), binom(100, 3))));
  assert.throws(() => tombolina({ rules: 'lotba-tombolina', numbers: 8, stake: 100 }), { code: 'BAD_OPTION' });
});

test('Quiniela Plus: inclusion-exclusion against Monte Carlo of 20 independent places', () => {
  const q = quinielaPlusOdds('pba-quiniela-plus');
  assert.ok(eq(sum(q.rows.map(r => r.p)), F(1)));
  assert.equal(q.rows.find(r => r.hits === 8).oneIn.toFixed(0), '3198054');
  const rng = xoshiro128ss(42), n = 200000, mine = new Set([1, 2, 3, 4, 5, 6, 7, 8]), cnt = Array(9).fill(0);
  for (let i = 0; i < n; i++) { const seen = new Set(); for (let j = 0; j < 20; j++) { const x = rng.int(100); if (mine.has(x)) seen.add(x); } cnt[seen.size]++; }
  for (const r of q.rows) {
    const p = toNumber(r.p);
    assert.ok(Math.abs(cnt[r.hits] / n - p) < 5 * Math.sqrt(p * (1 - p) / n) + 1e-5, r.hits + ' hits: ' + cnt[r.hits] / n + ' vs ' + p);
  }
});

test('Quini 6 Premio Extra and Loto Plus Multiplicador: exact against brute force and Monte Carlo', () => {
  const x = quini6PremioExtra();
  assert.ok(eq(sum(x.unionSize.map(u => u.p)), F(1)));
  assert.equal(x.oneIn.toFixed(1), '1163.5');
  const rng = xoshiro128ss(99), n = 300000;
  const draw = () => { const s = new Set(); while (s.size < 6) s.add(rng.int(46)); return s; };
  let hits = 0;
  for (let i = 0; i < n; i++) {
    const d = [draw(), draw(), draw()];
    const u = new Set([...d[0], ...d[1], ...d[2]]);
    const ticket = [0, 1, 2, 3, 4, 5];
    if (ticket.every(v => u.has(v)) && !d.some(s => ticket.every(v => s.has(v)))) hits++;
  }
  const p = toNumber(x.p);
  assert.ok(Math.abs(hits / n - p) < 5 * Math.sqrt(p / n), 'mc ' + hits / n + ' exact ' + p);
  const m = lotoPlusMultiplicador();
  assert.ok(eq(m.pPlus, F(1, 10)));
  assert.equal(m.oneIn.toFixed(0), '31222733');
  assert.equal(m.extraTimes, 2);
});
