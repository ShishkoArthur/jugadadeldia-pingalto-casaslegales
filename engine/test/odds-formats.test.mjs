import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFractional, parseAmerican, parseAny, toFractional, toAmerican, convertOdd, parlay, margin } from '../odds.mjs';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, a + ' != ' + b);

test('fractional parsing', () => {
  near(parseFractional('5/2'), 3.5);
  near(parseFractional(' 1/4 '), 1.25);
  near(parseFractional('100/30'), 1 + 100 / 30);
  for (const bad of ['', '5', '0/3', '3/0', '-1/2', '1.5/2', 'a/b', null]) assert.equal(parseFractional(bad), null, String(bad));
});

test('american parsing: plus is profit on 100, minus is stake to win 100', () => {
  near(parseAmerican('+150'), 2.5);
  near(parseAmerican('150'), 2.5);
  near(parseAmerican('-200'), 1.5);
  near(parseAmerican(String.fromCharCode(0x2212) + '200'), 1.5);
  near(parseAmerican('+100'), 2);
  near(parseAmerican('-100'), 2);
  for (const bad of ['', '+50', '-99', 'abc', '1,85', null]) assert.equal(parseAmerican(bad), null, String(bad));
});

test('round trips decimal -> other formats -> decimal', () => {
  for (const d of [1.01, 1.25, 1.5, 1.8, 1.91, 2, 2.1, 2.5, 3.2, 3.6, 7, 11, 101]) {
    near(parseAmerican(String(toAmerican(d))), d, 1e-9);
    const f = toFractional(d, 1000);
    if (f.exact) near(parseFractional(f.text), d);
  }
  assert.deepEqual(toFractional(3.5), { num: 5, den: 2, exact: true, text: '5/2' });
  assert.deepEqual(toFractional(2), { num: 1, den: 1, exact: true, text: '1/1' });
  assert.equal(toFractional(1.91).text, '91/100');
  const third = toFractional(4 / 3);
  assert.equal(third.text, '1/3');
  assert.equal(third.exact, true);
  assert.equal(toFractional(1.333).exact, false);
  near(toAmerican(1.5), -200);
  near(toAmerican(2.5), 150);
  assert.throws(() => toAmerican(1));
});

test('convertOdd gives every format and the implied probability', () => {
  const c = convertOdd('2,50');
  near(c.decimal, 2.5); near(c.american, 150); near(c.implied, 0.4); assert.equal(c.fractional.text, '3/2');
  near(convertOdd('-125', 'american').decimal, 1.8);
  near(convertOdd('4/5', 'fractional').implied, 1 / 1.8);
  assert.equal(convertOdd('0,9'), null);
  assert.throws(() => parseAny('2', 'roman'));
});

test('parlay: odds multiply, payout multiplies, edge grows with each leg', () => {
  const leg = { odds: [2.1, 3.2, 3.6], pick: 0 };
  const one = parlay([leg]);
  const m = margin(leg.odds);
  near(one.odd, 2.1); near(one.payout, m.payout); near(one.prob, m.fairProb[0]); near(one.ev, m.payout - 1);
  const five = parlay([leg, leg, leg, leg, leg]);
  near(five.odd, 2.1 ** 5); near(five.payout, m.payout ** 5); near(five.prob, m.fairProb[0] ** 5);
  near(five.ev, five.odd * five.prob - 1); near(five.edge, -five.ev);
  for (let i = 1; i < five.steps.length; i++) assert.ok(five.steps[i].edge > five.steps[i - 1].edge);
  near(five.oneIn * five.prob, 1);
  const fair = parlay([{ odds: [2, 2], pick: 1 }, { odds: [2, 2], pick: 0 }]);
  near(fair.payout, 1); near(fair.ev, 0); near(fair.odd, 4); near(fair.prob, 0.25);
  assert.throws(() => parlay([]));
  assert.throws(() => parlay([{ odds: [2, 2], pick: 2 }]));
});
