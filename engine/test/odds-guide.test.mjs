import test from 'node:test';
import assert from 'node:assert/strict';
import { single, cashOut, margin } from '../odds.mjs';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, a + ' != ' + b);

test('single bet pays stake x odd, profit excludes the stake', () => {
  const s = single(1000, '2,10');
  close(s.pays, 2100);
  close(s.profit, 1100);
  close(s.implied, 1 / 2.1);
  assert.throws(() => single(1000, '1'));
  assert.throws(() => single(0, 2));
});

test('cash out: value at the live odd and fair value without the live margin', () => {
  const c = cashOut(1000, '2,10', ['1,40', '4,20', '7,50'], 0);
  close(c.potential, 2100);
  close(c.atLive, 1500);
  const m = margin([1.4, 4.2, 7.5]);
  close(c.fair, 2100 * (1 / 1.4) / m.sum);
  assert.ok(c.fair < c.atLive, 'the live odd is shortened by the margin, so the fair value is lower');
  close(c.fair, c.atLive / m.sum);
  close(c.liveMargin, m.margin);
});

test('cash out on a fair live market equals the value at the live odd', () => {
  const c = cashOut(500, 3, [2, 2], 1);
  close(c.atLive, 750);
  close(c.fair, 750);
});

test('cash out is the stake when the live odd equals the placed odd on a fair market', () => {
  const c = cashOut(1000, 2, [2, 2], 0);
  close(c.atLive, 1000);
  assert.throws(() => cashOut(1000, 2, [2, 2], 2));
  assert.throws(() => cashOut(1000, 'x', [2, 2], 0));
});

test('independent check: 1.000 at 2,10, live 1,40 (handbook formula stake x placed / live)', () => {
  assert.equal(Math.round(cashOut(1000, 2.1, [1.4, 4.2, 7.5], 0).atLive), 1500);
});
