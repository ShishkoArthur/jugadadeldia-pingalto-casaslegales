// Locks for the pingalto wave 3 engines: best-of-N series (dynamic program vs closed form vs Monte Carlo), the inverse, the
// Swiss stage of a CS2 Major, and Valve's VRS expected win chance (vs a port of Valve's own priorWinExpectation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { series, closedForm, mapChanceFor, curve, swiss, swissCounts, winsNeeded, FORMATS } from '../games/series.mjs';
import { curvesSvg, swissSvg, scoreTable } from '../games/seriesviz.mjs';
import { expected, gapFor, gFactor, parseStandings, isBrandName, VRS_RD } from '../games/vrs.mjs';

const near = (a, b, eps = 1e-12, msg = '') => assert.ok(Math.abs(a - b) <= eps, msg + ' ' + a + ' vs ' + b);

test('series: dynamic program equals the closed form and sums to one', () => {
  for (const n of FORMATS) for (const p of [0, 0.05, 0.3, 0.5, 0.55, 0.7, 0.99, 1]) {
    const r = series(n, p);
    near(r.pA, closedForm(n, p), 1e-12, 'Bo' + n + ' p=' + p);
    near(r.pA + r.pB, 1, 1e-12);
    near(r.scores.reduce((t, s) => t + s.probability, 0), 1, 1e-12);
    near(Object.values(r.byLength).reduce((t, x) => t + x, 0), 1, 1e-12);
    assert.equal(r.scores.length, 2 * winsNeeded(n));
    near(r.played[0], 1);
  }
  near(series(3, 0.5).pA, 0.5);
  near(series(3, 0.6).pA, 0.648);
  near(series(5, 0.6).pA, 0.68256);
  near(series(3, 0.5).expectedMaps, 2.5);
  near(series(3, 0.6).byLength[2], 0.52);
  near(series(3, 0.6).played[2], 0.48);
  const s = series(3, 0.6).scores;
  assert.deepEqual(s.map(x => x.a + ':' + x.b), ['2:0', '2:1', '1:2', '0:2']);
  near(s[0].probability, 0.36); near(s[1].probability, 0.288); near(s[2].probability, 0.192); near(s[3].probability, 0.16);
});

test('series: a different chance per map and a score in the middle', () => {
  const r = series(3, [0.7, 0.4, 0.5]);
  near(r.pA, 0.7 * 0.4 + 0.7 * 0.6 * 0.5 + 0.3 * 0.4 * 0.5);
  near(series(3, 0.6, { a: 1, b: 0 }).pA, 0.6 + 0.4 * 0.6);
  near(series(3, 0.6, { a: 1, b: 1 }).pA, 0.6);
  near(series(5, 0.5, { a: 0, b: 2 }).pA, 0.125);
  near(series(5, [0.5, 0.5, 0.9, 0.9, 0.9], { a: 0, b: 2 }).pA, 0.9 ** 3);
  assert.throws(() => series(3, 0.5, { a: 2, b: 0 }));
  assert.throws(() => series(2, 0.5));
  assert.throws(() => series(3, [0.5, 0.5]));
  assert.throws(() => series(3, 1.2));
});

test('series: Monte Carlo agrees (xoshiro128**, 200 000 series)', () => {
  let s = [0x9e3779b9, 0x243f6a88, 0xb7e15162, 0x12345678];
  const rotl = (x, k) => (x << k) | (x >>> (32 - k));
  const next = () => { const r = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0; const t = s[1] << 9; s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3]; s[2] ^= t; s[3] = rotl(s[3], 11); return r / 4294967296; };
  const N = 200000, p = 0.58;
  let wins = 0, maps = 0;
  for (let k = 0; k < N; k++) { let a = 0, b = 0; while (a < 3 && b < 3) { if (next() < p) a++; else b++; } if (a === 3) wins++; maps += a + b; }
  const r = series(5, p), se = Math.sqrt((r.pA * (1 - r.pA)) / N);
  assert.ok(Math.abs(wins / N - r.pA) < 4 * se, 'MC ' + wins / N + ' vs ' + r.pA);
  assert.ok(Math.abs(maps / N - r.expectedMaps) < 0.01);
});

test('series: inverse and curve', () => {
  for (const n of [3, 5, 7]) for (const t of [0.1, 0.5, 0.648, 0.9]) near(closedForm(n, mapChanceFor(n, t)), t, 1e-12);
  near(mapChanceFor(3, 0.648), 0.6, 1e-12);
  assert.equal(mapChanceFor(1, 0.37), 0.37);
  const c = curve(5, 10);
  assert.equal(c.length, 11);
  near(c[5][1], 0.5);
  for (let i = 1; i < c.length; i++) assert.ok(c[i][1] >= c[i - 1][1]);
});

test('swiss: Valve Major stage, Bo3 only when a win advances or a loss eliminates', () => {
  const r = swiss(0.5);
  near(r.advance, 0.5);
  assert.deepEqual(r.records.map(x => x.w + '-' + x.l), ['3-0', '3-1', '3-2', '2-3', '1-3', '0-3']);
  near(r.records[0].probability, 0.125); near(r.records[1].probability, 0.1875); near(r.records[2].probability, 0.1875);
  near(r.records.reduce((t, x) => t + x.probability, 0), 1);
  const p = 0.6, b1 = p, b3 = closedForm(3, p);
  near(r.matches, 1 + 1 + 1 + 0.75 + 0.375);
  const z = swiss(p);
  near(z.records[0].probability, b1 * b1 * b3);
  near(z.records[5].probability, (1 - b1) * (1 - b1) * (1 - b3));
  let brute = 0;
  const walk = (w, l, pr) => { if (w === 3) { brute += pr; return; } if (l === 3) return; const q = w === 2 || l === 2 ? b3 : b1; walk(w + 1, l, pr * q); walk(w, l + 1, pr * (1 - q)); };
  walk(0, 0, 1);
  near(z.advance, brute);
  near(z.pBo3, 0.648);
});

test('vrs: expected chance is Valve priorWinExpectation with fixed RD 75', () => {
  const Q = Math.log(10) / 400;
  const team = (rank, rd) => ({ rank, rd, adjR: 0, adjRD: 0 });
  const add = (t, o, score) => { const g = 1 / Math.sqrt(1 + (3 * Q * Q * o.rd * o.rd) / (Math.PI * Math.PI)); const ev = 1 / (1 + Math.pow(10, (g * (t.rank - o.rank)) / -400)); t.adjRD += g * g * ev * (1 - ev); t.adjR += g * (score - ev); };
  const apply = t => { const v = 1 / (1 / (t.rd * t.rd) + Q * Q * t.adjRD); t.rank += Q * v * t.adjR; };
  const valve = (rv1, rv2) => { const w = team(rv1, VRS_RD), l = team(rv1, VRS_RD), o = team(rv2, VRS_RD); add(w, o, 1); add(l, o, 0); apply(w); apply(l); const wd = w.rank - rv1, ld = rv1 - l.rank; return 1 - wd / (wd + ld); };
  for (const [a, b] of [[1912, 1490], [1490, 1912], [1500, 1500], [1662, 1546], [400, 2000]]) near(expected(a, b), valve(a, b), 1e-12, a + ' vs ' + b);
  near(expected(1500, 1500), 0.5);
  assert.ok(Math.abs(expected(1900, 1500) - 0.9) < 0.01, 'the 400 = 90 % comment of glicko.js, with g');
  near(gFactor(0), 1);
  near(expected(1500 + gapFor(0.75), 1500), 0.75, 1e-12);
});

test('vrs: Valve standings files parse and betting brands are masked', () => {
  const am = parseStandings(readFileSync(new URL('../../data/sources/pingalto/_docs/valve-vrs-americas-2026-11-02.md', import.meta.url), 'utf8'));
  assert.equal(am.region, 'Americas');
  assert.equal(am.date, '2026-11-02');
  assert.equal(am.rows[0].team, 'FURIA');
  assert.equal(am.rows[0].points, 1912);
  assert.deepEqual(am.rows[4].roster, ['dgt', 'HUASOPEEK', 'luchov', 'max', 'meyern']);
  assert.ok(am.rows.find(r => r.team === 'SportsBetExpert').masked);
  assert.ok(!am.rows.find(r => r.team === '9z').masked);
  const gl = parseStandings(readFileSync(new URL('../../data/sources/pingalto/_docs/valve-vrs-global-2026-11-02.md', import.meta.url), 'utf8'));
  assert.equal(gl.region, 'Global');
  assert.ok(gl.rows.length > am.rows.length);
  assert.ok(isBrandName('BETBOOM') && isBrandName('Team 1win') && !isBrandName('Vitality'));
  assert.throws(() => parseStandings('nothing'));
});

test('swiss counts and pictures', () => {
  assert.deepEqual(swissCounts(16).map(c => c.w + '-' + c.l + ':' + c.teams), ['3-0:2', '3-1:3', '3-2:3', '2-3:3', '1-3:3', '0-3:2']);
  assert.throws(() => swissCounts(6));
  const svg = swissSvg(swiss(0.55));
  assert.equal((svg.match(/<g /g) || []).length, 15);
  assert.ok(!/NaN|undefined/.test(svg + curvesSvg(FORMATS, 0.6) + scoreTable(series(5, 0.6))));
  assert.ok(curvesSvg(FORMATS, null).includes('polyline'));
});
