// es-AR numbers on pingalto: decimal comma out, both "1,25" and "1.25" in, thousands with a dot. Also a lock on the sources:
// no browser number inputs (they show and accept "1.25" depending on the visitor's system, not the page) and no decimal point
// in placeholders. Rendered pages are checked by the decimalComma gate of tools/check-dist.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fmt, fmtFixed, fmtPct, fmtInput, parseNum } from '../games/num.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

test('fmt: decimal comma, thousands dot, same in every engine', () => {
  assert.equal(fmt(1234, 0), '1.234');
  assert.equal(fmt(1234567.891, 2), '1.234.567,89');
  assert.equal(fmt(1.25, 2), '1,25');
  assert.equal(fmt(1.2, 3), '1,2');
  assert.equal(fmt(0.022, 4), '0,022');
  assert.equal(fmt(-1234.5, 1), '-1.234,5');
  assert.equal(fmt(-0.0001, 2), '0');
  assert.equal(fmt(999.996, 2), '1.000');
  assert.equal(fmtFixed(85.6, 2), '85,60');
  assert.equal(fmtFixed(1600, 1), '1.600,0');
  assert.equal(fmtPct(0.125, 1), '12,5\u00a0%');
  assert.equal(fmtInput(1600, 0), '1600');
  assert.equal(fmtInput(0.392857, 3), '0,393');
  assert.throws(() => fmt(NaN, 1));
  assert.throws(() => fmt(1));
});

test('parseNum: what people type in Argentina and elsewhere', () => {
  const ok = [
    ['1,25', 1.25], ['1.25', 1.25], [' 0,4 ', 0.4], [',5', 0.5], ['1.234,5', 1234.5], ['1,234.5', 1234.5], ['1.234.567', 1234567],
    ['1600', 1600], ['-3', -3], ['+2,5', 2.5], ['1 600', 1600], ['0.022', 0.022], ['1.234', 1.234],
  ];
  for (const [s, v] of ok) assert.equal(parseNum(s), v, s);
  assert.equal(parseNum('1.600', { whole: true }), 1600);
  assert.equal(parseNum('1.234.567', { whole: true }), 1234567);
  assert.equal(parseNum('800', { whole: true }), 800);
  for (const s of ['', 'abc', '1,2,3', '1..2', '1.2.3', '12.34', '1,2.3', '--1', '1e3', '.', ',']) {
    const opt = s === '12.34' ? { whole: true } : {};
    assert.ok(Number.isNaN(parseNum(s, opt)), 'should refuse "' + s + '"');
  }
  for (const n of [0.393, 1.25, 1600, 0.022, 12.5]) assert.equal(parseNum(fmtInput(n, 4)), n);
  for (const n of [1234, 1600, 25000]) assert.equal(parseNum(fmt(n, 0), { whole: true }), n);
});

test('pingalto sources: no number inputs, no decimal point in placeholders', () => {
  const dirs = ['sites/pingalto/pages', 'sites/pingalto/client'];
  const bad = [];
  for (const d of dirs) for (const f of readdirSync(join(ROOT, d))) {
    const t = readFileSync(join(ROOT, d, f), 'utf8');
    if (/type="number"/.test(t)) bad.push(d + '/' + f + ': type="number" input (use text + inputmode and parseNum)');
    if (/placeholder="[^"]*\d\.\d/.test(t)) bad.push(d + '/' + f + ': placeholder with a decimal point');
  }
  assert.deepEqual(bad, []);
});
