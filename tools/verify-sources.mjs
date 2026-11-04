#!/usr/bin/env node
// Licence registries and lottery rules (tools/lib/lottery-sources.mjs, data/sources/lottery/; --recheck covers registries only):
// node tools/verify-sources.mjs [-q] [--today YYYY-MM-DD]
//   every quote is verbatim in the visible text of its saved document, every listed site is backed by a byte-for-byte HTML
//   snippet of the official list, the list is complete (the pattern finds exactly the listed hosts), sha256 and freshness.
// node tools/verify-sources.mjs --recheck [--write]
//   downloads every registry document again (one request per second) and runs the same checks on the fresh copy; with --write a
//   copy that passes replaces the saved one (sha256, fetched = today). A change in the list is reported, never written silently.
//   Registries with a document from a site that blocks AI crawlers (tools/lib/ownercopy.mjs) are skipped: the owner saves those.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT } from './env.mjs';
import { loadRegistries, verifyRegistries, checkRegistry, brandNames } from './lib/sources.mjs';
import { verifyLottery } from './lib/lottery-sources.mjs';
import { checkProvinces } from './lib/provsources.mjs';
import { loadRg } from './lib/sources.mjs';
import { isOwnerDoc, ownerCopyProblems } from './lib/ownercopy.mjs';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 casaslegales-check/1.0';
const args = process.argv.slice(2);
const ti = args.indexOf('--today');
const today = ti >= 0 ? args[ti + 1] : new Date().toISOString().slice(0, 10);
const quiet = args.includes('-q');

function fetchDoc(url) {
  const out = execFileSync('curl', ['-sL', '-m', '40', '-A', UA, '-w', '\n%{http_code}', url], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const i = out.lastIndexOf('\n');
  return { status: +out.slice(i + 1), body: out.slice(0, i) };
}

if (args.includes('--recheck')) {
  const write = args.includes('--write'), names = brandNames();
  let problems = 0;
  for (const r of loadRegistries()) {
    const held = Object.entries(r.docs).filter(([, d]) => isOwnerDoc(d));
    if (held.length) { console.log('  skip ' + r.id + ': ' + held.map(([s]) => s).join(', ') + ' - robots.txt blocks AI crawlers; the owner saves these pages (docs/reference/owner-saves/README.md)'); continue; }
    const fresh = {};
    for (const [slug, d] of Object.entries(r.docs)) {
      try { fresh[slug] = fetchDoc(d.url); } catch (e) { fresh[slug] = { status: 0, body: '', err: e.message }; }
      execFileSync('sleep', ['1']);
    }
    const down = Object.entries(fresh).filter(([, x]) => x.status !== 200);
    if (down.length) { problems++; console.log('  BAD ' + r.id + ': ' + down.map(([s, x]) => s + ' ' + x.status).join(', ') + ' - old copies kept'); continue; }
    const errs = checkRegistry(r, { today, names, raw: slug => fresh[slug].body, fresh: false });
    if (errs.length) { problems++; errs.forEach(e => console.log('  CHANGED ' + e)); console.log('  ' + r.id + ': old copies kept; update the registry file by hand after reading the official page'); continue; }
    console.log('  ok ' + r.id + ': fresh copies match every quote and the list');
    if (write) {
      for (const [slug, d] of Object.entries(r.docs)) {
        const buf = Buffer.from(fresh[slug].body, 'utf8');
        fs.writeFileSync(path.join(ROOT, d.file), buf);
        Object.assign(d, { fetched: today, status: 200, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
      }
      r.checked = today;
      const file = r._file; delete r._file;
      fs.writeFileSync(path.join(ROOT, file), JSON.stringify(r, null, 1) + '\n');
    }
  }
  console.log('recheck: ' + (problems ? problems + ' registries need attention' : 'all registries unchanged') + (write ? '' : ' (dry run)'));
  process.exit(problems ? 1 : 0);
}
const logq = m => { if (!quiet || !m.startsWith('  ok')) console.log(m); };
const provErrs = checkProvinces({ today, registryIds: loadRegistries().map(r => r.id), jurisdictions: loadRg().provinces.map(p => p.id) }).concat(ownerCopyProblems());
provErrs.forEach(e => console.log('  BAD ' + e));
if (!provErrs.length) logq('  ok provinces: every jurisdiction has one status');
const n = verifyRegistries({ today, log: logq }) + verifyLottery({ today, log: logq }) + provErrs.length;
console.log('verify-sources: ' + (n ? 'CHECKS FAILED: ' + n : 'all registry and lottery-rule checks passed'));
process.exit(n ? 1 : 0);
