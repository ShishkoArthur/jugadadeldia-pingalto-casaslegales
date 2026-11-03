// Lock tests for pingalto engines (engine/games/*): key numbers fixed so a change breaks the build and the deploy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cm360, convertSens, sensForCm360, edpi, degPerCm } from '../games/sens.mjs';
import { dpiFromCounts, median, deviation } from '../games/dpi.mjs';
import { parsePoint, greatCircleKm, fibreRttMs } from '../games/geo.mjs';
import { summarize, overFloor } from '../games/ping.mjs';
import { start, answer, triesLeft } from '../games/bisect.mjs';
import { progress } from '../games/ladder.mjs';
import { checkFacts } from '../games/cite.mjs';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, a + ' != ' + b);

test('sens: cm/360 and conversion keep the turn distance', () => {
  near(cm360({ dpi: 800, sens: 1, yaw: 0.022 }), 914.4 / 17.6, 1e-9);
  near(cm360({ dpi: 800, sens: 0.4, yaw: 0.07 }), 40.82142857142857, 1e-9);
  const v = convertSens({ sens: 1.25, dpi: 800, yaw: 0.022, toDpi: 800, toYaw: 0.07 });
  near(v, 0.39285714285714285, 1e-12);
  near(cm360({ dpi: 800, sens: v, yaw: 0.07 }), cm360({ dpi: 800, sens: 1.25, yaw: 0.022 }), 1e-9);
  near(convertSens({ sens: 2, dpi: 400, yaw: 0.022, toDpi: 1600, toYaw: 0.0066 }), 1.6666666666666667, 1e-12);
  near(sensForCm360({ cm: 40.82142857142857, dpi: 800, yaw: 0.07 }), 0.4, 1e-12);
  assert.equal(edpi({ dpi: 800, sens: 1.25 }), 1000);
  near(degPerCm({ dpi: 2.54, sens: 1, yaw: 1 }), 1);
  assert.throws(() => cm360({ dpi: 800, sens: 0, yaw: 0.022 }));
  assert.throws(() => convertSens({ sens: 1, dpi: 800, yaw: 0.022, toDpi: 800 }));
});

test('dpi: counts over a known distance', () => {
  near(dpiFromCounts({ counts: 2696, mm: 85.6 }), 800, 0.1);
  near(dpiFromCounts({ counts: -1348, mm: 85.6 }), 1348 / (85.6 / 25.4), 1e-9);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  near(deviation({ measured: 840, declared: 800 }), 0.05, 1e-12);
  assert.throws(() => dpiFromCounts({ counts: 0, mm: 85.6 }));
});

test('geo: great circle and the fibre floor', () => {
  assert.deepEqual(parsePoint('Point(-58.381944444 -34.599722222)'), { lon: -58.381944444, lat: -34.599722222 });
  const R = 6371.0087714;
  const ba = parsePoint('Point(-58.381944444 -34.599722222)'), scl = parsePoint('Point(-70.65 -33.4375)');
  const km = greatCircleKm(ba, scl, R);
  near(km, 1137.4, 0.5);
  near(fibreRttMs({ km: 1000, c: 299792458, n: 1.4475 }), 2e9 * 1.4475 / 299792458, 1e-9);
  near(greatCircleKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }, R), Math.PI * R, 1e-6);
  assert.throws(() => fibreRttMs({ km: 1, c: 299792458 }));
});

test('ping: summary of samples', () => {
  assert.deepEqual(summarize([30, 34, 31, 50, 32]), { n: 5, median: 32, min: 30, max: 50, jitter: (4 + 3 + 19 + 18) / 4 });
  assert.equal(summarize([]), null);
  assert.equal(overFloor({ measured: 30, floor: 10 }), 3);
});

test('bisect: finds any value of 0..200 in at most 8 tries', () => {
  for (const target of [0, 1, 57, 100, 137, 199, 200]) {
    let s = start({ value: 100, lo: 0, hi: 200 }), n = 0;
    while (!s.done) { n++; s = answer(s, s.value > target ? 'fast' : s.value < target ? 'slow' : 'ok'); }
    assert.equal(s.value, target);
    assert.ok(n <= 8, 'tries ' + n);
  }
  assert.equal(triesLeft(start({ value: 50, lo: 0, hi: 100 })), 7);
  assert.throws(() => start({ value: 1.5, lo: 0, hi: 10 }));
});

// The 3-level Valorant-like case was cross-checked by a 200 000-run Monte Carlo (mean 46.33, median 41) on 2026-11-03.
test('ladder: exact chain against hand-checkable cases', () => {
  const sure = progress({ from: 0, pts: 50, to: 1, top: 100, win: 25, loss: 10, p: 1, carry: true, minAfterUp: 0, demote: null, tier: null, maxGames: 10 });
  assert.equal(sure.p50, 2);
  assert.equal(sure.mean, 2);
  const coin = progress({ from: 0, pts: 90, to: 1, top: 100, win: 20, loss: 20, p: 0.5, carry: true, minAfterUp: 0, demote: null, tier: null, maxGames: 1 });
  assert.equal(coin.within(1), 0.5);
  const val = progress({ from: 0, pts: 50, to: 3, top: 100, win: 22, loss: 15, p: 0.55, carry: true, minAfterUp: 10, demote: { to: 70 }, tier: null, maxGames: 2000 });
  near(val.drift, 0.55 * 22 - 0.45 * 15, 1e-12);
  assert.ok(val.p50 > 0 && val.p90 >= val.p50);
  assert.equal(val.p50, 41);
  near(val.mean, 46.2858, 0.001);
  const never = progress({ from: 0, pts: 0, to: 1, top: 100, win: 10, loss: 30, p: 0.5, carry: true, minAfterUp: 0, demote: null, tier: null, maxGames: 200 });
  assert.equal(never.mean, null);
  assert.throws(() => progress({ from: 0, pts: 0, to: 1, top: 100, win: 10, loss: 10, p: 0.5, carry: true, minAfterUp: 0, maxGames: 10 }));
  // LoL-style drop with carry: from 5 points in the second level a 20-point loss lands on 85 in the first one.
  const lol1 = progress({ from: 0, pts: 95, to: 2, top: 100, win: 10, loss: 20, p: 0, carry: true, minAfterUp: 0, demote: { carry: true }, tier: null, maxGames: 1 });
  assert.equal(lol1.within(1), 0);
  const step = (args) => progress({ top: 100, win: 10, carry: true, minAfterUp: 0, tier: null, maxGames: 20, ...args });
  const win1 = step({ from: 0, pts: 95, to: 2, loss: 20, p: 1, demote: { carry: true } });
  assert.equal(win1.p50, 11);
  const lolTier = progress({ from: 3, pts: 50, to: 6, top: 100, win: 22, loss: 15, p: 0.45, carry: true, minAfterUp: 0, demote: { carry: true }, tier: { every: 4, to: 25 }, maxGames: 1500 });
  const lolFlat = progress({ from: 3, pts: 50, to: 6, top: 100, win: 22, loss: 15, p: 0.45, carry: true, minAfterUp: 0, demote: null, tier: null, maxGames: 1500 });
  assert.ok(lolTier.mean > lolFlat.mean, 'drops must make the climb longer');
});

test('cite: value must sit inside a verbatim quote', () => {
  const src = { docs: { a: {} }, facts: { ok: { doc: 'a', quote: 'yaw 0.07', value: 0.07 }, bad: { doc: 'a', quote: 'yaw 0.07', value: 0.7 }, miss: { doc: 'a', quote: 'nope', value: 'nope' } } };
  const errs = checkFacts(src, () => 'Valorant: yaw 0.07 here');
  assert.equal(errs.length, 2);
  assert.match(errs.join('|'), /bad: value/);
  assert.match(errs.join('|'), /miss: quote not found/);
});

test('num: es-AR formatting', async () => {
  const { fmt, fmtFixed, fmtPct } = await import('../games/num.mjs');
  assert.equal(fmt(1234.5, 1), '1.234,5');
  assert.equal(fmt(0.39285714, 3), '0,393');
  assert.equal(fmtFixed(2, 2), '2,00');
  assert.equal(fmtPct(0.55, 0), '55 %');
  assert.throws(() => fmt(1));
});
