// Lottery rules with sources (data/sources/lottery/*.json): every payout multiplier, prize-fund share and game rule that the
// lottery engine (engine/lottery/) uses is a fact { id, value, doc, quote } backed by an official document saved in
// data/sources/lottery/_docs/ with its sha256. Checks: document bytes match sha256, status 200, https url, freshness
// (maxAgeDays per file), every quote verbatim in the document text (PDF via pdftotext, compared without whitespace like
// tools/verify-rg.mjs), the value is inside its quote (valueText) or, for tables, every row in order, unique ids, and every
// "missing" entry lists where it was searched. engine/test/lottery-sources.test.mjs checks that the engine constants equal
// these values. Used by tools/verify-sources.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../env.mjs';
import { normalize, visibleText, hasQuote } from '../../engine/text.mjs';
import { daysBetween } from '../../engine/format.mjs';
import { docMaxAge } from './ownercopy.mjs';
import { PDFTOTEXT } from '../../engine/pdf.mjs';

export const LOTTERY_DIR = path.join(ROOT, 'data/sources/lottery');

export function loadLotteryFiles(dir = LOTTERY_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    .map(f => ({ ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), _file: path.relative(ROOT, path.join(dir, f)) }));
}

// es-AR number as printed in the documents: "3.500", "10.000", "2,5", "9,14" (some PBA lines use "18.51" - see fmtVariants).
const esNum = n => {
  const [i, d] = String(n).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
};
// Every spelling of a number met in the sources: 3500 / 3.500, 9,14 / 9.14.
export function fmtVariants(n) {
  const s = String(n), out = new Set([s, esNum(n), n.toFixed(2).replace('.', ','), n.toFixed(2)]);
  if (s.includes('.')) out.add(s.replace('.', ','));
  return [...out].sort((a, b) => b.length - a.length);
}

const textCache = new Map();
export function docText(file) {
  const abs = path.join(ROOT, file);
  if (!textCache.has(abs)) {
    const t = file.endsWith('.pdf') ? normalize(execFileSync(PDFTOTEXT, ['-layout', abs, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 })) : visibleText(fs.readFileSync(abs, 'utf8'));
    textCache.set(abs, t);
  }
  return textCache.get(abs);
}

export function checkLotteryFile(f, { today, seen = new Set() } = {}) {
  const errs = [];
  const bad = m => errs.push((f.id || f._file) + ': ' + m);
  if (!f.id || !/^[a-z0-9-]+$/.test(f.id)) bad('bad id');
  const maxAge = f.maxAgeDays;
  if (!Number.isInteger(maxAge) || maxAge < 1) bad('maxAgeDays is required');
  const docs = f.docs || {};
  for (const [slug, d] of Object.entries(docs)) {
    if (!d.url || !/^https:\/\//.test(d.url)) bad(slug + ': url must be https');
    if (d.status !== 200) bad(slug + ': status ' + d.status + ' (only 200 may be quoted)');
    if (!d.fetched || !/^\d{4}-\d{2}-\d{2}$/.test(d.fetched)) bad(slug + ': no fetched date');
    else if (today) { const age = daysBetween(d.fetched, today), lim = docMaxAge(d, maxAge); if (age < 0 || age > lim) bad(slug + ': fetched ' + d.fetched + ' is ' + age + ' days old (max ' + lim + ') - download the document again and re-verify every quote'); }
    const abs = path.join(ROOT, d.file || '');
    if (!d.file || !fs.existsSync(abs)) { bad(slug + ': saved document missing ' + d.file); continue; }
    if (crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex') !== d.sha256) bad(slug + ': sha256 mismatch');
  }
  for (const [i, x] of (f.facts || []).entries()) {
    const at = 'fact[' + i + '] ' + (x.id || '?');
    if (!x.id || !/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(x.id)) { bad(at + ': bad id'); continue; }
    if (!x.id.startsWith(f.id + '.')) bad(at + ': id must start with the file id ' + f.id + '.');
    if (seen.has(x.id)) bad(at + ': duplicate id'); seen.add(x.id);
    if (!('value' in x)) bad(at + ': no value');
    const d = docs[x.doc];
    if (!d) { bad(at + ': unknown document ' + x.doc); continue; }
    if (!fs.existsSync(path.join(ROOT, d.file || ''))) continue;
    const isPdf = d.file.endsWith('.pdf'), text = docText(d.file);
    if (!x.quote || !hasQuote(text, isPdf, x.quote)) { bad(at + ': quote not found verbatim in ' + x.doc + ': "' + String(x.quote).slice(0, 80) + '"'); continue; }
    const q = normalize(x.quote), qs = q.replace(/\s/g, '');
    if (x.table) {
      if (!Array.isArray(x.value) || !x.value.length) { bad(at + ': a table fact needs rows'); continue; }
      let from = 0;
      for (const row of x.value) {
        const re = new RegExp(row.map(c => '(?:' + fmtVariants(c).map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')').join('\\D*?'), 'g');
        re.lastIndex = from;
        const m = re.exec(qs);
        if (!m) { bad(at + ': row ' + row.join(' ') + ' not found in its quote (in order)'); break; }
        from = m.index + 1;
      }
    } else if (typeof x.value === 'number') {
      if (!x.valueText) bad(at + ': a number needs valueText (how the document writes it)');
      else {
        if (!q.includes(normalize(x.valueText))) bad(at + ': valueText "' + x.valueText + '" is not inside the quote');
        if (!fmtVariants(x.value).some(v => normalize(x.valueText).includes(v))) bad(at + ': value ' + x.value + ' does not match valueText "' + x.valueText + '"');
      }
    } else if (x.valueText && !q.includes(normalize(x.valueText))) bad(at + ': valueText "' + x.valueText + '" is not inside the quote');
  }
  for (const [i, m] of (f.missing || []).entries()) {
    const at = 'missing[' + i + '] ' + (m.id || '?');
    if (!m.id || !m.id.startsWith(f.id + '.')) bad(at + ': id must start with ' + f.id + '.');
    if (seen.has(m.id)) bad(at + ': id is both a fact and missing'); seen.add(m.id);
    if (!m.what || !Array.isArray(m.searched) || !m.searched.length) bad(at + ': needs what and the list of places searched');
  }
  return errs;
}

// All facts of all files by id (value, doc url, date, quote) - for tests and the build.
export function lotteryFacts(files = loadLotteryFiles()) {
  const out = new Map();
  for (const f of files) for (const x of f.facts || []) out.set(x.id, { ...x, url: f.docs[x.doc]?.url, date: f.docs[x.doc]?.fetched });
  return out;
}
export function lotteryMissing(files = loadLotteryFiles()) {
  return new Map(files.flatMap(f => (f.missing || []).map(m => [m.id, m])));
}

export function verifyLottery({ today, log = () => {} } = {}) {
  let n = 0;
  const seen = new Set();
  for (const f of loadLotteryFiles()) {
    const errs = checkLotteryFile(f, { today, seen });
    n += errs.length;
    if (errs.length) errs.forEach(e => log('  BAD ' + e));
    else log('  ok lottery ' + f.id + ': ' + (f.facts || []).length + ' facts, ' + (f.missing || []).length + ' missing, ' + Object.keys(f.docs || {}).length + ' documents');
  }
  return n;
}
