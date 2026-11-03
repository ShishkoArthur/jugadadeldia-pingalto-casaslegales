import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOdd, margin, settleHandicap, handicapLabel, handicapReturn } from '../odds.mjs';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, a + ' != ' + b);

test('parseOdd accepts comma and point, rejects the rest', () => {
  assert.equal(parseOdd('1,85'), 1.85);
  assert.equal(parseOdd(' 2.10 '), 2.1);
  assert.equal(parseOdd(3), 3);
  for (const x of ['1', '0,9', '', 'abc', '1,2,3', '-2', null, undefined, 1, NaN, Infinity]) assert.equal(parseOdd(x), null, String(x));
});

test('margin of a fair two-way market is zero', () => {
  const m = margin([2, 2]);
  close(m.sum, 1);
  close(m.margin, 0);
  close(m.payout, 1);
  assert.deepEqual(m.fairOdds, [2, 2]);
});

test('margin of a three-way market and fair odds', () => {
  const m = margin(['2,10', '3,20', '3,60']);
  const sum = 1 / 2.1 + 1 / 3.2 + 1 / 3.6;
  close(m.sum, sum);
  close(m.margin, sum - 1);
  close(m.fairProb.reduce((a, b) => a + b, 0), 1);
  m.fairOdds.forEach((f, i) => close(1 / f, m.fairProb[i]));
  assert.ok(m.fairOdds.every((f, i) => f > m.odds[i]));
});

test('margin needs two valid odds', () => {
  assert.throws(() => margin([1.9]));
  assert.throws(() => margin([1.9, '1']));
  assert.throws(() => margin('1.9,1.9'));
});

test('whole and half lines', () => {
  assert.deepEqual(settleHandicap(-1, 2), { win: 1, push: 0, lose: 0 });
  assert.deepEqual(settleHandicap(-1, 1), { win: 0, push: 1, lose: 0 });
  assert.deepEqual(settleHandicap(-1, 0), { win: 0, push: 0, lose: 1 });
  assert.deepEqual(settleHandicap(-1.5, 1), { win: 0, push: 0, lose: 1 });
  assert.deepEqual(settleHandicap(0.5, 0), { win: 1, push: 0, lose: 0 });
  assert.deepEqual(settleHandicap(0, 0), { win: 0, push: 1, lose: 0 });
});

test('quarter lines split the stake', () => {
  assert.deepEqual(settleHandicap(-0.25, 0), { win: 0, push: 0.5, lose: 0.5 });
  assert.deepEqual(settleHandicap(-0.75, 1), { win: 0.5, push: 0.5, lose: 0 });
  assert.deepEqual(settleHandicap(0.25, 0), { win: 0.5, push: 0.5, lose: 0 });
  assert.equal(handicapLabel(settleHandicap(-0.75, 1)), 'half-win');
  assert.equal(handicapLabel(settleHandicap(-0.25, 0)), 'half-lose');
  assert.equal(handicapLabel(settleHandicap(-1.5, 3)), 'win');
});

test('shares always add up to one and mirror lines are opposite', () => {
  for (let l = -3; l <= 3; l += 0.25) for (let d = -4; d <= 4; d++) {
    const s = settleHandicap(l, d), o = settleHandicap(-l, -d);
    close(s.win + s.push + s.lose, 1);
    close(s.win, o.lose);
    close(s.push, o.push);
  }
});

test('returns', () => {
  close(handicapReturn(-1, 2, '1,90', 100), 190);
  close(handicapReturn(-1, 1, 1.9, 100), 100);
  close(handicapReturn(-0.75, 1, 2, 100), 150);
  close(handicapReturn(-0.25, 0, 2, 100), 50);
  close(handicapReturn(-1.5, 1, 2, 100), 0);
  assert.throws(() => settleHandicap(-0.3, 1));
  assert.throws(() => settleHandicap(-1, 0.5));
});
