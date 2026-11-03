import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtDate, fmtInt, daysBetween, addDays, plural } from '../format.mjs';

test('fmtDate prints dd/mm/aaaa', () => {
  assert.equal(fmtDate('2026-11-03'), '03/11/2026');
  assert.throws(() => fmtDate('03/11/2026'));
});
test('fmtInt uses a dot for thousands', () => {
  assert.equal(fmtInt(7), '7');
  assert.equal(fmtInt(1234), '1.234');
  assert.equal(fmtInt(1234567), '1.234.567');
  assert.equal(fmtInt(-1000), '-1.000');
  assert.throws(() => fmtInt(1.5));
});
test('daysBetween and addDays agree', () => {
  assert.equal(daysBetween('2026-11-01', '2026-11-03'), 2);
  assert.equal(addDays('2026-11-03', 100), '2027-02-11');
  assert.equal(daysBetween('2026-11-03', addDays('2026-11-03', 100)), 100);
});
test('plural', () => {
  assert.equal(plural(1, 'sitio', 'sitios'), 'sitio');
  assert.equal(plural(0, 'sitio', 'sitios'), 'sitios');
});
