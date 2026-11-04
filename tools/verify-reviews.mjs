#!/usr/bin/env node
// Review facts of casaslegales.com: node tools/verify-reviews.mjs [-q] [--today YYYY-MM-DD]   (rules in tools/lib/revsources.mjs)
import { checkReviews, loadReviews } from './lib/revsources.mjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--today');
const today = ti >= 0 ? args[ti + 1] : new Date().toISOString().slice(0, 10);
if (args.includes('--selftest')) {
  const base = loadReviews(), brand = Object.keys(base).find(b => (base[b].facts || []).length);
  if (!brand) { console.log('verify-reviews selftest: no review data yet'); process.exit(0); }
  const cases = [
    ['quote changed', r => { r.facts[0].quote += ' y algo más'; }],
    ['sha256 changed', r => { const d = Object.values(r.docs)[0]; d.sha256 = '0'.repeat(64); }],
    ['stale copy', r => { for (const d of Object.values(r.docs)) d.date = '2020-01-01'; }],
    ['unknown copy', r => { r.facts[0].doc = 'no-existe'; }],
    ['url of another page', r => { r.facts[0].url = 'https://example.org/'; }],
  ];
  let fail = 0;
  for (const [name, mut] of cases) {
    const all = JSON.parse(JSON.stringify(base)); mut(all[brand]);
    const n = checkReviews({ today, all }).length;
    console.log((n ? '  ok    ' : '  BAD   ') + name + ' - findings ' + n);
    if (!n) fail++;
  }
  process.exit(fail ? 1 : 0);
}
const errs = checkReviews({ today });
errs.forEach(e => console.log('  BAD ' + e));
const all = loadReviews();
const n = Object.values(all).reduce((a, r) => a + (r.facts || []).length, 0);
if (!args.includes('-q') || errs.length) console.log('verify-reviews: ' + (errs.length ? 'CHECKS FAILED: ' + errs.length : 'ok, ' + n + ' facts of ' + Object.keys(all).length + ' brands'));
process.exit(errs.length ? 1 : 0);
