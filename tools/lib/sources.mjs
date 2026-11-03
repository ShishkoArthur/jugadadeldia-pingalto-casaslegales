// Facts with sources: licence registries (data/sources/registries/*.json) and the help package (data/sources/rg/helplines.json).
// verifyRegistries() is the byte-level check of every registry fact against its saved document; the build refuses to start when
// it finds a problem, so the site never shows an unverified licence. Freshness: a document older than maxAgeDays is an error.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../env.mjs';
import { visibleText, normalize, stripComments } from '../../engine/text.mjs';
import { hostKey } from '../../engine/registry.mjs';
import { daysBetween } from '../../engine/format.mjs';

const REG_DIR = path.join(ROOT, 'data/sources/registries');
export const readJson = f => JSON.parse(fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'));

export function loadRegistries(dir = REG_DIR) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => ({ ...readJson(path.join(dir, f)), _file: path.relative(ROOT, path.join(dir, f)) }));
}
export const brandNames = () => readJson('data/sources/brands.json').brands;
export const loadRg = () => readJson('data/sources/rg/helplines.json');

// Every check of one registry against its documents. raw(doc) and text(doc) may be replaced (recheck uses fresh copies).
export function checkRegistry(r, { today, raw, names = brandNames(), fresh = true } = {}) {
  const errs = [];
  const bad = m => errs.push(r.id + ': ' + m);
  const docs = r.docs || {};
  const rawOf = raw || (slug => { const d = docs[slug]; const f = d && path.join(ROOT, d.file); return f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; });
  const cache = new Map();
  const doc = slug => { if (!cache.has(slug)) { const h = rawOf(slug); cache.set(slug, h == null ? null : { raw: h, clean: stripComments(h), text: visibleText(h) }); } return cache.get(slug); };
  if (!r.id || !/^[a-z-]+$/.test(r.id)) bad('bad id');
  const maxAge = r.maxAgeDays || 100;
  for (const [slug, d] of Object.entries(docs)) {
    if (!d.url || !/^https:\/\//.test(d.url)) bad(slug + ': url must be https');
    if (d.status !== 200) bad(slug + ': status ' + d.status + ' (only 200 may be quoted)');
    if (!d.fetched || !/^\d{4}-\d{2}-\d{2}$/.test(d.fetched)) bad(slug + ': no fetched date');
    else if (fresh) { const age = daysBetween(d.fetched, today); if (age < 0 || age > maxAge) bad(slug + ': fetched ' + d.fetched + ' is ' + age + ' days old (max ' + maxAge + ') - run node tools/verify-sources.mjs --recheck --write'); }
    if (!raw) {
      const f = path.join(ROOT, d.file || '');
      if (!d.file || !fs.existsSync(f)) { bad(slug + ': saved document missing ' + d.file); continue; }
      const sha = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
      if (sha !== d.sha256) bad(slug + ': sha256 mismatch');
    }
    if (!doc(slug)) bad(slug + ': cannot read');
  }
  const q = r.quotes || {};
  for (const [k, x] of Object.entries(q)) {
    const t = x && docs[x.doc] && doc(x.doc);
    if (!t) { bad('quote ' + k + ': unknown document ' + (x && x.doc)); continue; }
    if (!x.text || !t.text.includes(normalize(x.text))) bad('quote ' + k + ' not found verbatim in ' + x.doc + ': "' + String(x.text).slice(0, 70) + '"');
  }
  for (const [i, l] of (r.law || []).entries()) {
    if (!q[l.quote]) bad('law[' + i + '] ' + l.name + ': no quote ' + l.quote);
    if (l.date) { const t = docs[l.date.doc] && doc(l.date.doc); if (!t || !t.text.includes(normalize(l.date.text))) bad('law[' + i + '] date quote not found'); }
  }
  if (!r.regulator || !r.regulator.name || !q.regulator) bad('regulator needs a name and a quote');
  else if (!normalize(q.regulator.text).toLowerCase().includes(normalize(r.regulator.short).toLowerCase()) && !normalize(q.regulator.text).toLowerCase().includes(normalize(r.regulator.name).toLowerCase()))
    bad('regulator name/short "' + r.regulator.short + '" is not inside its quote');
  const list = r.list && docs[r.list.doc] && doc(r.list.doc);
  if (!list) { bad('no list document'); return errs; }
  const seen = new Set();
  for (const [i, l] of (r.licensees || []).entries()) {
    const at = 'licensee[' + i + '] ' + (l.host || '?');
    const ev = l.evidence || {};
    const e = docs[ev.doc] && doc(ev.doc);
    if (!names[l.brand]) bad(at + ': brand ' + l.brand + ' has no display name in data/sources/brands.json');
    if (!e || !ev.html) { bad(at + ': no evidence'); continue; }
    if (!e.clean.includes(ev.html)) bad(at + ': evidence not found byte for byte in ' + ev.doc + ' (HTML comments removed)');
    if (hostKey(l.host) !== l.host) bad(at + ': host must be normalized (' + hostKey(l.host) + ')');
    if (!ev.html.toLowerCase().includes(l.host)) bad(at + ': host not inside its evidence');
    if (l.label && !ev.html.includes(l.label)) bad(at + ': label not inside its evidence');
    if (l.ref && !ev.html.includes(l.ref)) bad(at + ': act reference not inside its evidence');
    if (l.ref && !list.text.includes(normalize(l.ref))) bad(at + ': act reference is not visible text');
    if (seen.has(l.host)) bad(at + ': duplicate host'); seen.add(l.host);
  }
  // the list is complete: the pattern finds exactly these hosts in the document (nothing added, nothing missed);
  // list.more: further pages of the same regulator that complete the list (each with its own pattern)
  try {
    const found = new Set([...list.clean.matchAll(new RegExp(r.list.pattern, 'g'))].map(m => hostKey(m.groups.host)));
    for (const x of r.list.more || []) {
      const d = docs[x.doc] && doc(x.doc);
      if (!d) { bad('list.more: unknown document ' + x.doc); continue; }
      const extra = [...d.clean.matchAll(new RegExp(x.pattern, 'g'))].map(m => hostKey(m.groups.host));
      if (!extra.length) bad('list.more ' + x.doc + ': the pattern finds nothing');
      extra.forEach(e => found.add(e));
    }
    for (const h of found) if (!seen.has(h)) bad('the official list has ' + h + ' but the registry file does not');
    for (const h of seen) if (!found.has(h)) bad(h + ' is in the registry file but not in the official list');
  } catch (err) { bad('list pattern: ' + err.message); }
  if (r.declaredCount) {
    const dq = q[r.declaredCount.quote];
    if (!dq || !new RegExp('\\b' + r.declaredCount.value + '\\b').test(dq.text)) bad('declared count ' + r.declaredCount.value + ' not inside its quote');
    if ((r.licensees || []).length !== r.declaredCount.value) bad('the regulator says ' + r.declaredCount.value + ' but ' + (r.licensees || []).length + ' sites are listed');
  }
  return errs;
}

export function verifyRegistries({ today, log = () => {} } = {}) {
  const names = brandNames();
  let n = 0;
  for (const r of loadRegistries()) {
    const errs = checkRegistry(r, { today, names });
    n += errs.length;
    if (errs.length) errs.forEach(e => log('  BAD ' + e));
    else log('  ok ' + r.id + ': ' + r.licensees.length + ' sites, ' + Object.keys(r.quotes).length + ' quotes, ' + Object.keys(r.docs).length + ' documents');
  }
  return n;
}
