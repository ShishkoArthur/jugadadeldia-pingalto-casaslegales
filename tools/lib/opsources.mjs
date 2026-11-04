// Operator facts for casaslegales.com (data/sources/operators/operators.json): every responsible-gaming tool, payment method,
// licence statement or block message shown on an operator page is a verbatim quote of a saved copy of a public page, with
// its URL and date. Same rules as the registries (tools/lib/sources.mjs): sha256 of the saved copy, quote found in its visible
// text, copy not older than maxAgeDays. A copy with a status outside 2xx may be quoted only when it is a block page
// (kind "block": what the site shows to a visitor outside its province). Screenshots (data/shots/shots.json) must exist as
// webp for every shot a page uses.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../env.mjs';
import { visibleText, normalize } from '../../engine/text.mjs';
import { daysBetween } from '../../engine/format.mjs';
import { docMaxAge } from './ownercopy.mjs';

const FILE = 'data/sources/operators/operators.json';
const SHOTS = 'data/shots/shots.json';
export const loadOperators = () => JSON.parse(fs.readFileSync(path.join(ROOT, FILE), 'utf8'));
export const loadShots = () => JSON.parse(fs.readFileSync(path.join(ROOT, SHOTS), 'utf8')).shots;

export function checkOperators({ today, data = loadOperators(), shots = loadShots(), fresh = true } = {}) {
  const errs = [];
  const bad = m => errs.push('operators: ' + m);
  const maxAge = data.maxAgeDays || 100;
  const text = {};
  for (const [slug, d] of Object.entries(data.docs || {})) {
    if (!/^https:\/\//.test(d.url || '')) bad(slug + ': url must be https');
    if ((d.status < 200 || d.status > 299) && d.kind !== 'block') bad(slug + ': status ' + d.status + ' (only block pages may be quoted with a status outside 2xx)');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fetched || '')) bad(slug + ': no fetched date');
    else if (fresh) { const a = daysBetween(d.fetched, today), lim = docMaxAge(d, data.maxAgeDays); if (a < 0 || a > lim) bad(slug + ': copied ' + d.fetched + ', ' + a + ' days old (max ' + lim + ') - capture again: node tools/capture-shots.mjs'); }
    const f = path.join(ROOT, d.file || '');
    if (!d.file || !fs.existsSync(f)) { bad(slug + ': saved copy missing ' + d.file); continue; }
    const buf = fs.readFileSync(f);
    if (crypto.createHash('sha256').update(buf).digest('hex') !== d.sha256) bad(slug + ': sha256 mismatch');
    text[slug] = visibleText(buf.toString('utf8'));
  }
  for (const [k, q] of Object.entries(data.quotes || {})) {
    if (!text[q.doc]) { bad('quote ' + k + ': unknown document ' + q.doc); continue; }
    if (!q.text || !text[q.doc].includes(normalize(q.text))) bad('quote ' + k + ' not found verbatim in ' + q.doc + ': "' + String(q.text).slice(0, 70) + '"');
    if (!q.topic) bad('quote ' + k + ': no topic');
  }
  for (const [b, o] of Object.entries(data.brands || {})) for (const id of o.shots || []) {
    const s = shots[id];
    if (!s) { bad(b + ': shot ' + id + ' not in ' + SHOTS); continue; }
    if (!s.webp || !fs.existsSync(path.join(ROOT, s.webp))) bad(b + ': shot ' + id + ' has no webp');
    if (fresh) { const a = daysBetween(s.date, today); if (a < 0 || a > maxAge) bad(b + ': shot ' + id + ' taken ' + s.date + ' (max ' + maxAge + ' days)'); }
  }
  return errs;
}
