import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostKey, isBetAr, licensees, countBy, total, brandMatrix, presence, multiJurisdiction, findHost, tileLevel, brands, distinctHosts, splitAddress } from '../registry.mjs';

const REGS = [
  { id: 'a', licensees: [{ brand: 'x', host: 'a.x.bet.ar' }, { brand: 'y', host: 'y.bet.ar', ref: 'R 1' }] },
  { id: 'b', licensees: [{ brand: 'x', host: 'x.com.ar' }] },
];
const NAMES = { x: 'Equis', y: 'Ye' };

test('hostKey normalizes addresses', () => {
  assert.equal(hostKey('https://WWW.Pba.Ejemplo.bet.ar/deportes?x=1'), 'pba.ejemplo.bet.ar');
  assert.equal(hostKey('ejemplo.bet.ar.'), 'ejemplo.bet.ar');
  assert.equal(hostKey('  www2.ejemplo.com.ar '), 'ejemplo.com.ar');
  assert.equal(hostKey(''), '');
  assert.equal(hostKey('http://'), '');
});
test('isBetAr', () => {
  assert.equal(isBetAr('pba.ejemplo.bet.ar'), true);
  assert.equal(isBetAr('ejemplo.com.ar'), false);
  assert.equal(isBetAr('bet.ar.ejemplo.com'), false);
});
test('counts', () => {
  assert.deepEqual(countBy(REGS), { a: 2, b: 1 });
  assert.equal(total(REGS), 3);
  assert.deepEqual(brands(REGS), ['x', 'y']);
  assert.equal(licensees(REGS)[1].ref, 'R 1');
});
test('brandMatrix sorts by presence and needs names', () => {
  const m = brandMatrix(REGS, NAMES);
  assert.equal(m[0].brand, 'x');
  assert.equal(presence(m[0]), 2);
  assert.equal(m[1].cells.b, null);
  assert.deepEqual(multiJurisdiction(m).map(r => r.brand), ['x']);
  assert.equal(distinctHosts(m[0]), 2);
  const same = brandMatrix([{ id: 'a', licensees: [{ brand: 'x', host: 'x.bet.ar' }] }, { id: 'b', licensees: [{ brand: 'x', host: 'x.bet.ar' }] }], NAMES);
  assert.equal(multiJurisdiction(same).length, 1);
  assert.equal(splitAddress(same).length, 0);
  assert.throws(() => brandMatrix(REGS));
  assert.throws(() => brandMatrix(REGS, { x: 'Equis' }));
});
test('findHost matches exact hosts only', () => {
  assert.equal(findHost(REGS, 'https://www.y.bet.ar/').length, 1);
  assert.equal(findHost(REGS, 'z.y.bet.ar').length, 0);
});
test('tileLevel bands', () => {
  assert.deepEqual([0, 1, 3, 4, 7, 8, 20].map(tileLevel), [0, 1, 1, 2, 2, 3, 3]);
  assert.throws(() => tileLevel(-1));
});
