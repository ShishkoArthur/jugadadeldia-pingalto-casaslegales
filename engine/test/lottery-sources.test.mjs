// Every constant of engine/lottery/rules.mjs equals its quoted fact in data/sources/lottery/*.json; the verifier catches a
// wrong value, a changed quote and a changed document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { citedConstants, rules, ruleIds } from '../lottery/rules.mjs';
import { loadLotteryFiles, lotteryFacts, lotteryMissing, checkLotteryFile } from '../../tools/lib/lottery-sources.mjs';

const files = loadLotteryFiles();
const facts = lotteryFacts(files), missing = lotteryMissing(files);

test('every engine constant is a quoted fact with the same value', () => {
  const list = citedConstants();
  assert.ok(list.length > 60, 'expected the rule sets to cite many facts, got ' + list.length);
  for (const [path, x] of list) {
    assert.ok(!missing.has(x.src), path + ' cites ' + x.src + ', which is listed as missing');
    const f = facts.get(x.src);
    assert.ok(f, path + ' cites an unknown fact ' + x.src);
    assert.deepEqual(x.v, f.value, path + ' = ' + JSON.stringify(x.v) + ' but ' + x.src + ' says ' + JSON.stringify(f.value));
    assert.match(f.url, /^https:\/\//);
    assert.match(f.date, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('the source files verify (quotes, values, sha256, freshness on the fetch day)', () => {
  const seen = new Set();
  const lastFetch = f => Object.values(f.docs || {}).map(d => d.fetched).filter(Boolean).sort().at(-1) || '2026-11-04';
  for (const f of files) assert.deepEqual(checkLotteryFile(f, { today: lastFetch(f), seen }), [], f.id);
});

test('the verifier catches a wrong value, a wrong table row, an edited quote and a stale document', () => {
  const lotba = files.find(f => f.id === 'lotba');
  const clone = () => JSON.parse(JSON.stringify(lotba));
  const at = (f, id) => f.facts.find(x => x.id === id);
  let f = clone(); at(f, 'lotba.quiniela.pay-2').value = 80;
  assert.ok(checkLotteryFile(f, { today: '2026-11-03' }).some(e => e.includes('pay-2') && e.includes('valueText')));
  f = clone(); at(f, 'lotba.tombolina.pay').value[6][2] = 3000;
  assert.ok(checkLotteryFile(f, { today: '2026-11-03' }).some(e => e.includes('row 6 6 3000')));
  f = clone(); at(f, 'lotba.redoblona.cap').quote = 'hasta el máximo de UN MIL SEISCIENTAS (1.600) veces el valor de la apuesta realizada.';
  assert.ok(checkLotteryFile(f, { today: '2026-11-03' }).some(e => e.includes('quote not found')));
  f = clone(); f.docs['quiniela-reglamento'].sha256 = '0'.repeat(64);
  assert.ok(checkLotteryFile(f, { today: '2026-11-03' }).some(e => e.includes('sha256')));
  assert.ok(checkLotteryFile(clone(), { today: '2027-06-01' }).some(e => e.includes('days old')));
});

test('no defaults: unknown rule sets and kinds throw', () => {
  assert.throws(() => rules('quiniela', undefined), { code: 'UNKNOWN_RULES' });
  assert.throws(() => rules('quiniela', 'cordoba-quiniela'), { code: 'UNKNOWN_RULES' });
  assert.throws(() => rules('nope', 'x'), { code: 'UNKNOWN_KIND' });
  assert.deepEqual(ruleIds('quiniela'), ['lotba-quiniela', 'pba-quiniela']);
});

test('gaps are listed with the places searched, and have no rule set', () => {
  for (const id of ['gaps.cordoba.quiniela', 'gaps.tombola.santiaguena', 'lotba.redoblona.exacta-definition', 'pba.qplus.fixed-amounts']) {
    assert.ok(missing.has(id), id);
    assert.ok(missing.get(id).searched.length >= 1);
  }
});
