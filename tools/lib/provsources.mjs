// Jurisdictions of casaslegales.com without a verified licensee list (data/sources/provinces/provinces.json). Same rules as the
// registries (tools/lib/sources.mjs): sha256 of each saved copy, quotes verbatim in its visible text, evidence byte for byte in
// its HTML (comments removed), copies not older than maxAgeDays. Extra rules:
//   platform - every .bet.ar link of the saved copy is one of the listed platforms (none left out, none added);
//   none     - a copy marked noBetAr really has no .bet.ar address (the page says "no list found on <host>");
//   blocked  - no documents and no claims, only the reason.
// Together with the registries every one of the 24 jurisdictions has exactly one status.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../env.mjs';
import { visibleText, normalize, stripComments } from '../../engine/text.mjs';
import { hostKey } from '../../engine/registry.mjs';
import { daysBetween } from '../../engine/format.mjs';

const FILE = 'data/sources/provinces/provinces.json';
export const STATUSES = ['list', 'platform', 'none', 'blocked'];
export const REASONS = { none: ['no-list', 'script-only', 'not-found'], blocked: ['excluded', 'geo'] };
export const loadProvinces = () => JSON.parse(fs.readFileSync(path.join(ROOT, FILE), 'utf8'));

export function checkProvinces({ today, data = loadProvinces(), registryIds = [], jurisdictions = [] } = {}) {
  const errs = [];
  const bad = m => errs.push('provinces: ' + m);
  const maxAge = data.maxAgeDays || 100;
  const cache = {};
  for (const [slug, d] of Object.entries(data.docs || {})) {
    if (!/^https:\/\//.test(d.url || '')) bad(slug + ': url must be https');
    if (d.status !== 200) bad(slug + ': status ' + d.status);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fetched || '')) bad(slug + ': no fetched date');
    else { const a = daysBetween(d.fetched, today); if (a < 0 || a > maxAge) bad(slug + ': copied ' + d.fetched + ', ' + a + ' days old (max ' + maxAge + ')'); }
    const f = path.join(ROOT, d.file || '');
    if (!d.file || !fs.existsSync(f)) { bad(slug + ': saved copy missing ' + d.file); continue; }
    const buf = fs.readFileSync(f);
    if (crypto.createHash('sha256').update(buf).digest('hex') !== d.sha256) bad(slug + ': sha256 mismatch');
    const raw = buf.toString('utf8');
    cache[slug] = { raw, clean: stripComments(raw), text: visibleText(raw) };
  }
  const quote = (at, x) => {
    if (!x || !cache[x.doc]) { bad(at + ': unknown document ' + (x && x.doc)); return; }
    if (!x.text || !cache[x.doc].text.includes(normalize(x.text))) bad(at + ': quote not found verbatim in ' + x.doc + ': "' + String(x.text).slice(0, 60) + '"');
  };
  const used = new Set();
  for (const [id, j] of Object.entries(data.jurisdictions || {})) {
    if (registryIds.includes(id)) bad(id + ': has a verified list in data/sources/registries; remove it here');
    if (jurisdictions.length && !jurisdictions.includes(id)) bad(id + ': unknown jurisdiction');
    if (!STATUSES.includes(j.status) || j.status === 'list') bad(id + ': bad status ' + j.status);
    if (REASONS[j.status] && !REASONS[j.status].includes(j.reason)) bad(id + ': bad reason ' + j.reason);
    for (const [k, x] of Object.entries(j.quotes || {})) { quote(id + ' quote ' + k, x); used.add(x.doc); }
    if (j.report) { quote(id + ' report', j.report); used.add(j.report.doc); }
    if (j.status === 'platform') {
      if (!(j.platforms || []).length) bad(id + ': platform status without platforms');
      const seenDocs = new Set();
      for (const p of j.platforms || []) {
        const at = id + ' platform ' + p.host;
        const e = p.evidence || {};
        if (!cache[e.doc] || !e.html) { bad(at + ': no evidence'); continue; }
        seenDocs.add(e.doc); used.add(e.doc);
        if (!cache[e.doc].clean.includes(e.html)) bad(at + ': evidence not found byte for byte in ' + e.doc);
        if (hostKey(p.host) !== p.host) bad(at + ': host must be normalized');
        if (!e.html.toLowerCase().includes(p.host)) bad(at + ': host not inside its evidence');
        if (p.quote) { quote(at + ' quote', p.quote); used.add(p.quote.doc); }
      }
      const listed = new Set((j.platforms || []).map(p => p.host));
      for (const d of seenDocs) {
        const linked = new Set([...cache[d].clean.matchAll(/href=["']?(https?:\/\/[^"'\s>]+)/gi)].map(m => hostKey(m[1])).filter(h => /(^|\.)bet\.ar$/.test(h)));
        for (const h of linked) if (!listed.has(h)) bad(id + ': ' + d + ' links ' + h + ' but it is not among the platforms');
        for (const h of listed) if (![...linked].includes(h)) bad(id + ': ' + h + ' is not linked from ' + d);
      }
    } else if (j.platforms) bad(id + ': platforms only with status platform');
    for (const s of j.seen || []) {
      if (!cache[s.doc]) { bad(id + ' seen: unknown document ' + s.doc); continue; }
      used.add(s.doc);
      if (s.noBetAr && /\.bet\.ar\b/i.test(cache[s.doc].raw)) bad(id + ': ' + s.doc + ' is marked noBetAr but mentions .bet.ar');
    }
    if (j.status === 'blocked' && (j.seen || j.quotes)) bad(id + ': a blocked source makes no claims');
    if (!j.note && j.status !== 'platform' && !(j.seen || []).length) bad(id + ': needs a note or a saved copy');
  }
  for (const s of Object.keys(data.docs || {})) if (!used.has(s)) bad(s + ': saved copy not used by any jurisdiction');
  for (const id of jurisdictions) if (!registryIds.includes(id) && !(data.jurisdictions || {})[id]) bad(id + ': no status (neither a registry nor an entry here)');
  return errs;
}
