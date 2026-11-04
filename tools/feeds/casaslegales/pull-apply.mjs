#!/usr/bin/env node
// Brings the copies our server refreshed (feed listas, docs/FEEDS.md casaslegales) into the repository, so the build gates see the
// renewed dates: node tools/feeds/casaslegales/pull-apply.mjs <pulled dir> [--write]
// (bash tools/feeds-server.sh casaslegales pull downloads <dir>/listas.json and <dir>/docs/listas/ and calls this.)
// A copy is taken only when the server checked it ("ok"), it is newer than ours, and its bytes match the sha256 the server recorded.
// It replaces the saved document, sha256 and fetched (= the day the server checked it) of every entry with that slug and address
// (registry, provinces, help package, operators). Without --write it only reports. After --write: npm test, commit, deploy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fileKey } from './listas.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// every JSON file with saved documents: { json (relative), slugOf(key) -> slug or null, checked: true when it has a "checked" field }
function sets(root) {
  const reg = 'data/sources/registries';
  const out = fs.readdirSync(path.join(root, reg)).filter(f => f.endsWith('.json')).sort().map(f => ({ json: reg + '/' + f, key: s => s }));
  out.push({ json: 'data/sources/provinces/provinces.json', key: s => 'pv:' + s });
  out.push({ json: 'data/sources/rg/helplines.json', key: s => 'rg:' + s });
  out.push({ json: 'data/sources/operators/operators.json', key: null });
  return out.filter(x => fs.existsSync(path.join(root, x.json)));
}

export function applyPull({ root = ROOT, listas, docsDir, write = false, log = console.log }) {
  const docs = (listas && listas.docs) || {};
  const byUrl = new Map();
  for (const [key, d] of Object.entries(docs)) if (d.state === 'ok' && DAY.test(d.revisado || '')) byUrl.set(key, d);
  let applied = 0, skipped = 0;
  const done = new Map();
  for (const s of sets(root)) {
    const file = path.join(root, s.json);
    const raw = fs.readFileSync(file, 'utf8');
    const j = JSON.parse(raw);
    let touched = false;
    for (const [slug, d] of Object.entries(j.docs || {})) {
      // operators.json shares copies with the other sets: same slug and address as an entry the server checked
      const key = s.key ? s.key(slug) : [slug, 'pv:' + slug, 'rg:' + slug].find(k => byUrl.has(k) && byUrl.get(k).url === d.url);
      const x = key && byUrl.get(key);
      if (!x || x.url !== d.url || !(x.revisado > (d.fetched || ''))) continue;
      const src = path.join(docsDir, 'listas', fileKey(key) + path.extname(d.file));
      if (!fs.existsSync(src)) { skipped++; log('  skip ' + s.json + ' ' + slug + ': no server copy ' + path.basename(src)); continue; }
      const buf = fs.readFileSync(src), sha = crypto.createHash('sha256').update(buf).digest('hex');
      if (sha !== x.sha256) { skipped++; log('  skip ' + s.json + ' ' + slug + ': server copy does not match its sha256'); continue; }
      log((write ? '  ' : '  would update ') + s.json + ' ' + slug + ': ' + d.fetched + ' -> ' + x.revisado + (sha === d.sha256 ? ' (same bytes)' : ''));
      if (write) {
        if (!done.has(d.file)) fs.writeFileSync(path.join(root, d.file), buf);
        done.set(d.file, sha);
        Object.assign(d, { fetched: x.revisado, status: 200, sha256: sha });
        delete d.stale;
      }
      touched = true; applied++;
    }
    if (touched && write) {
      if ('checked' in j && DAY.test(listas.checkedOn || '') && listas.checkedOn > (j.checked || '')) j.checked = listas.checkedOn;
      const ind = ((raw.split('\n')[1] || '').match(/^ */) || [''])[0].length || 1;
      fs.writeFileSync(file, JSON.stringify(j, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
    }
  }
  log('pull: ' + applied + ' copies ' + (write ? 'updated' : 'would be updated (dry run; add --write)') + (skipped ? ', ' + skipped + ' skipped' : ''));
  return { applied, skipped };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find(a => !a.startsWith('--'));
  if (!dir || !fs.existsSync(path.join(dir, 'listas.json'))) { console.error('usage: node tools/feeds/casaslegales/pull-apply.mjs <dir with listas.json and docs/listas/> [--write]'); process.exit(2); }
  const doc = JSON.parse(fs.readFileSync(path.join(dir, 'listas.json'), 'utf8'));
  applyPull({ listas: doc.data, docsDir: path.join(dir, 'docs'), write: args.includes('--write') });
}
