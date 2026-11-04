// Review facts of casaslegales.com (data/sources/reviews/<brand>.json, copies in data/sources/reviews/<brand>/_docs/*.txt):
// what an operator's own public pages say about sports, casino, app, payments, account, support and responsible gaming,
// collected from a browser in Argentina without an account. Same rules as the registries and the operator facts: the saved
// text has the sha256 written in the file, every quote is found verbatim in it (whitespace and typographic marks normalized,
// never across an "[...]" cut of the excerpt), the copy is not older than maxAgeDays (100), and every fact names its copy, URL and date.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../env.mjs';
import { normalize } from '../../engine/text.mjs';
import { hostKey } from '../../engine/registry.mjs';
import { daysBetween } from '../../engine/format.mjs';
import { brandNames } from './sources.mjs';

export const REV_DIR = path.join(ROOT, 'data/sources/reviews');
const MAX_AGE = 100;

// a fact of absence ("not published on the page we checked") has no quote; it still names the copy that was read
export const isAbsence = v => v === false || (!!v && typeof v === 'object' && ['published', 'found', 'listed', 'shown', 'available', 'exists'].some(k => v[k] === false));
export function loadReviews(dir = REV_DIR) {
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));
}
// the saved copy: an optional header (URL:, Captured:) above a "---" line, then the page text; "[...]" lines mark cuts
export function docText(buf) {
  const s = buf.toString('utf8').replace(/\r\n/g, '\n');
  const i = s.indexOf('\n---\n');
  const head = i >= 0 ? s.slice(0, i) : '', body = i >= 0 ? s.slice(i + 5) : s;
  const meta = Object.fromEntries(head.split('\n').map(l => /^([A-Za-z]+):\s*(.*)$/.exec(l)).filter(Boolean).map(m => [m[1].toLowerCase(), m[2].trim()]));
  return { meta, parts: body.split(/^\s*\[(?:\.\.\.|…)\]\s*$/m).map(normalize) };
}

export function checkReviews({ today, all = loadReviews(), fresh = true, names = brandNames() } = {}) {
  const errs = [];
  for (const [file, r] of Object.entries(all)) {
    const bad = m => errs.push('reviews/' + file + ': ' + m);
    if (r.brand !== file) bad('brand "' + r.brand + '" differs from the file name');
    if (!names[r.brand]) bad('brand ' + r.brand + ' has no display name in data/sources/brands.json');
    const maxAge = r.maxAgeDays || MAX_AGE;
    const texts = {};
    for (const [slug, d] of Object.entries(r.docs || {})) {
      if (!/^https:\/\//.test(d.url || '')) bad(slug + ': url must be https');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) bad(slug + ': no date');
      else if (fresh) { const a = daysBetween(d.date, today); if (a < 0 || a > maxAge) bad(slug + ': copied ' + d.date + ', ' + a + ' days old (max ' + maxAge + ') - collect it again'); }
      const f = path.join(ROOT, d.file || '');
      if (!d.file || !d.file.startsWith('data/sources/reviews/' + file + '/_docs/') || !fs.existsSync(f)) { bad(slug + ': saved copy missing ' + d.file); continue; }
      const buf = fs.readFileSync(f);
      if (crypto.createHash('sha256').update(buf).digest('hex') !== d.sha256) bad(slug + ': sha256 mismatch');
      const t = docText(buf);
      if (t.meta.url && t.meta.url !== d.url) bad(slug + ': the copy says URL ' + t.meta.url + ', the index says ' + d.url);
      if (t.meta.captured && t.meta.captured !== d.date) bad(slug + ': the copy says captured ' + t.meta.captured + ', the index says ' + d.date);
      texts[slug] = t.parts;
    }
    for (const [i, x] of (r.facts || []).entries()) {
      const at = 'fact[' + i + '] ' + (x.field || '?');
      if (!x.field || !/^[a-z]+(\.[a-zA-Z0-9]+)+$/.test(x.field)) bad(at + ': bad field name');
      const d = (r.docs || {})[x.doc];
      if (!d) { bad(at + ': unknown copy ' + x.doc); continue; }
      if (x.url && x.url !== d.url) bad(at + ': url ' + x.url + ' is not the url of its copy ' + d.url);
      if (x.date && x.date !== d.date) bad(at + ': date ' + x.date + ' is not the date of its copy ' + d.date);
      if (x.host && hostKey(x.host) !== hostKey(d.url) && !hostKey(d.url).endsWith('.' + hostKey(x.host))) bad(at + ': host ' + x.host + ' is not the host (or a parent of the host) of its copy');
      if (x.quote == null && isAbsence(x.value)) continue;
      if (!x.quote || !String(x.quote).trim()) { bad(at + ': no quote'); continue; }
      const q = normalize(String(x.quote));
      if (!texts[x.doc] || !texts[x.doc].some(p => p.includes(q))) bad(at + ' not found verbatim in ' + x.doc + ': "' + q.slice(0, 70) + '"');
    }
    for (const [h, s] of Object.entries(r.status || {})) if (s.date && fresh) { const a = daysBetween(s.date, today); if (a < 0 || a > maxAge) bad('status of ' + h + ' dated ' + s.date); }
  }
  return errs;
}
