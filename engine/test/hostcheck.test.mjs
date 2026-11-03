import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anatomy, distance, checkHost, termMonths } from '../hostcheck.mjs';

const E = [
  { host: 'pba.betsson.bet.ar', jur: 'buenos-aires', brand: 'betsson' },
  { host: 'betsson.com.ar', jur: 'caba', brand: 'betsson' },
  { host: 'betano.bet.ar', jur: 'buenos-aires', brand: 'betano' },
  { host: 'pba.sports.bet.ar', jur: 'buenos-aires', brand: 'sportsbet' },
  { host: 'cordoba.bplay.bet.ar', jur: 'cordoba', brand: 'bplay' },
];

test('anatomy splits subdomain, name and ending', () => {
  assert.deepEqual(anatomy('https://www.pba.betsson.bet.ar/es/deportes'), { host: 'pba.betsson.bet.ar', sub: 'pba', name: 'betsson', ending: 'bet.ar', betAr: true });
  assert.deepEqual(anatomy('betsson.com.ar'), { host: 'betsson.com.ar', sub: '', name: 'betsson', ending: 'com.ar', betAr: false });
  assert.equal(anatomy('stake.com').name, 'stake');
  assert.equal(anatomy(''), null);
  assert.equal(anatomy('localhost'), null);
});
test('distance', () => {
  assert.equal(distance('betsson', 'betsson'), 0);
  assert.equal(distance('betsson', 'betson'), 1);
  assert.equal(distance('betano', 'betamo'), 1);
});
test('listed: exact and subdomain', () => {
  const a = checkHost('HTTPS://WWW.Betano.bet.ar/', E);
  assert.equal(a.state, 'listed'); assert.equal(a.how, 'exact'); assert.equal(a.matches[0].jur, 'buenos-aires');
  const b = checkHost('m.betano.bet.ar', E);
  assert.equal(b.state, 'listed'); assert.equal(b.how, 'subdomain');
});
test('similar: parent, same name, typo, contains', () => {
  assert.equal(checkHost('bplay.bet.ar', E).matches[0].why, 'parent');
  const n = checkHost('betsson.com', E);
  assert.equal(n.state, 'similar'); assert.ok(n.matches.every(m => m.why === 'name'));
  assert.equal(checkHost('betsso.bet.ar', E).matches[0].why, 'typo');
  assert.equal(checkHost('betano-argentina.com', E).matches[0].why, 'contains');
  assert.equal(checkHost('sportsbet.io', E).matches[0].why, 'contains');
});
test('none and empty', () => {
  assert.equal(checkHost('ejemplo.com', E).state, 'none');
  assert.equal(checkHost('   ', E).state, 'empty');
});
test('termMonths reads the regulators wording', () => {
  assert.deepEqual(termMonths('2 años'), { min: 24, max: 24 });
  assert.deepEqual(termMonths('dos (2) años'), { min: 24, max: 24 });
  assert.deepEqual(termMonths('seis (6) meses'), { min: 6, max: 6 });
  assert.deepEqual(termMonths('1 (un) año'), { min: 12, max: 12 });
  assert.deepEqual(termMonths('irrevocable por un año'), { min: 12, max: 12 });
  assert.deepEqual(termMonths('entre un mínimo de tres meses y un máximo de cinco años'), { min: 3, max: 60 });
  assert.deepEqual(termMonths('duración mínima de 1 año'), { min: 12, max: 12 });
  assert.equal(termMonths(''), null);
  assert.equal(termMonths('sin plazo'), null);
});
