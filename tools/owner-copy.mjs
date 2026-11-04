#!/usr/bin/env node
// Swap in a copy the owner saved from his own browser (docs/reference/owner-saves/README.md) for a document from a site that
// blocks AI crawlers: node tools/owner-copy.mjs <slug> <saved file> [--date YYYY-MM-DD] [--by owner|owner-browser] [--write]
// Every source entry with that slug (registries, provinces, help package, operators, and the jugadadeldia lottery sets in
// data/sources/lottery) gets the new file, sha256, fetched = the date the owner saved it, copiedBy "owner" (or --by owner-browser:
// taken in the owner's own Chrome while he watched, tools/lib/copyage.mjs), and loses pendingOwnerCopy. Without --write it only reports what would
// change. After --write run npm test: if a quote or the list changed on the official page, the checks say exactly what to
// update by hand (never edit a quote to fit without reading the page).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './env.mjs';
import { allSourceDocs, isOwnerCopied } from './lib/ownercopy.mjs';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const [slug, file] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--date' && args[i - 1] !== '--by');
const by = opt('--by') || 'owner';
if (!isOwnerCopied({ copiedBy: by })) { console.error('bad --by ' + by); process.exit(2); }
if (!slug || !file) { console.error('usage: node tools/owner-copy.mjs <slug> <saved file> [--date YYYY-MM-DD] [--write]'); process.exit(2); }
const src = path.resolve(file);
if (!fs.existsSync(src)) { console.error('no such file ' + src); process.exit(2); }
const date = opt('--date') || fs.statSync(src).mtime.toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error('bad --date ' + date); process.exit(2); }
const lotDir = 'data/sources/lottery';
const lottery = fs.readdirSync(path.join(ROOT, lotDir)).filter(f => f.endsWith('.json')).sort().flatMap(f => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, lotDir, f), 'utf8'));
  return Object.entries(j.docs || {}).map(([s, doc]) => ({ set: 'lottery ' + (j.id || f), json: lotDir + '/' + f, slug: s, doc }));
});
const hits = [...allSourceDocs(), ...lottery].filter(x => x.slug === slug);
if (!hits.length) { console.error('no source document with slug ' + slug); process.exit(2); }
const buf = fs.readFileSync(src);
const isPdf = buf.subarray(0, 5).toString() === '%PDF-';
const sha = crypto.createHash('sha256').update(buf).digest('hex');
const write = args.includes('--write');
for (const x of hits) {
  if ((path.extname(x.doc.file) === '.pdf') !== isPdf) { console.error(x.set + ' ' + slug + ': saved copy type does not match ' + x.doc.file + ' (save the page source as .html, see the README)'); process.exit(1); }
  console.log((write ? '' : 'would update ') + x.set + ' ' + slug + ': ' + x.doc.file + ' <- ' + path.relative(ROOT, src) + ', fetched ' + x.doc.fetched + ' -> ' + date + (x.doc.sha256 === sha ? ' (same bytes)' : ''));
}
if (!write) { console.log('dry run; add --write'); process.exit(0); }
for (const json of [...new Set(hits.map(x => x.json))]) {
  const p = path.join(ROOT, json);
  const raw = fs.readFileSync(p, 'utf8');
  const ind = ((raw.split('\n')[1] || '').match(/^ */) || [''])[0].length || 1;
  const j = JSON.parse(raw);
  const d = j.docs[slug];
  fs.writeFileSync(path.join(ROOT, d.file), buf);
  Object.assign(d, { fetched: date, status: 200, sha256: sha, copiedBy: by });
  delete d.pendingOwnerCopy;
  delete d.stale;
  fs.writeFileSync(p, JSON.stringify(j, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('done; now run npm test');
