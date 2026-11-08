#!/usr/bin/env node
// Verification of the Argentine help and law package data/sources/rg/helplines.json against saved documents in
// data/sources/rg/_docs/ (PLAYBOOK sections 0.2, 6, 7). Copied from /home/dev/gambeteo/tools/verify-rg.mjs (package taken
// from there on 2026-11-03; text helpers now live in engine/text.mjs). Shared by every site of this repository that shows help.
// Checks: every quote is a substring of the visible text of its document; phone / hours / self-exclusion term / age are inside
// their quotes; document sha256 matches the bytes; document status is 200; web link is confirmed by the document;
// freshness is per document (option c, 2026-11-01): a document whose last successful check ("fetched") is older than
// maxAgeDays makes every entry citing it STALE — the site hides those lines / self-exclusion entries / ages and falls back to the
// national crisis line for that jurisdiction (freshness() below, used by tools/lib/sources.mjs and tools/render.mjs). Here the
// gate is stricter: tools/check-dist.mjs (rule rgfresh) fails the build when ANY document of the package is older than maxAgeDays.
// verify[] — leads that are NOT shown on the site (no downloadable official page, or not confirmed); only listed here.
// PDF is read via pdftotext (poppler).
//
// Usage:
//   node tools/verify-rg.mjs [-q] [--today YYYY-MM-DD]       verify the package (exit 1 on any failure)
//   node tools/verify-rg.mjs --recheck [--write] [--only a,b] [--strict]  download every document again (curl, one request per second),
//       check every quote of that document against the fresh copy; with --write a document whose quotes are all present is
//       replaced (sha256, fetched = today, status, finalUrl, its "stale" mark removed); a missing quote or an unreachable page keeps
//       the old copy and old "fetched" and gets "stale": { since, lastTry, reason } (the entries citing it disappear from the site
//       once "fetched" is older than maxAgeDays). "checked" = date of the last full recheck run (moves on every --write run without
//       --only). Exit code 1 only when the national crisis line is not fresh after the run (or with --strict, on any problem).
//       Documents with "refresh": "manual" are skipped (listed).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decodeEntities, normalize, visibleText, hasQuote } from '../engine/text.mjs';
import { isOwnerDoc, docMaxAge } from './lib/ownercopy.mjs';
import { PDFTOTEXT } from '../engine/pdf.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACK = path.join(ROOT, 'data/sources/rg/helplines.json');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 casaslegales-check/1.0';
export { decodeEntities, normalize, visibleText, hasQuote };
export function fileText(file) {
  if (file.endsWith('.pdf')) return normalize(execFileSync(PDFTOTEXT, ['-layout', file, '-'], { encoding: 'utf8' }));
  return visibleText(fs.readFileSync(file, 'utf8'));
}
const digits = s => String(s ?? '').replace(/\D/g, '');
const phoneRuns = q => (normalize(q).match(/\d[\d \-().]*\d|\d/g) || []).map(digits);
const KEYPAD = { a: 2, b: 2, c: 2, d: 3, e: 3, f: 3, g: 4, h: 4, i: 4, j: 5, k: 5, l: 5, m: 6, n: 6, o: 6, p: 7, q: 7, r: 7, s: 7, t: 8, u: 8, v: 8, w: 9, x: 9, y: 9, z: 9 };
const keypad = s => String(s).toLowerCase().replace(/[a-z]/g, ch => KEYPAD[ch]).replace(/\D/g, '');
const host = u => new URL(u).hostname.replace(/^www\d?\./, '');

// Every [quote, doc] pair of the package, with a label (used by verify and by --recheck).
export function citations(pack) {
  const out = [];
  const line = (l, e) => {
    out.push([l, e.quote, e.doc]);
    (e.also || []).forEach((a, j) => out.push([`${l}.also[${j}]`, a.quote, a.doc]));
    for (const k of ['hoursQuote', 'smsQuote', 'chatQuote', 'whatsappQuote', 'freeQuote']) if (e[k]) out.push([`${l} ${k}`, e[k], e.doc]);
  };
  for (const e of pack.national?.crisis || []) line('national.crisis ' + e.name, e);
  for (const p of pack.provinces) {
    (p.gambling || []).forEach((e, i) => line(`${p.id}.gambling[${i}]`, e));
    (p.otherLines || []).forEach((e, i) => line(`${p.id}.otherLines[${i}]`, e));
    (p.selfExclusion || []).forEach((e, i) => {
      out.push([`${p.id}.selfExclusion[${i}]`, e.quote, e.doc]);
      if (e.termsQuote) out.push([`${p.id}.selfExclusion[${i}] termsQuote`, e.termsQuote, e.doc]);
    });
    (p.regulators || []).forEach((e, i) => { out.push([`${p.id}.regulators[${i}]`, e.quote, e.doc]); (e.also || []).forEach((a, j) => out.push([`${p.id}.regulators[${i}].also[${j}]`, a.quote, a.doc])); });
    if (p.age) out.push([`${p.id}.age`, p.age.quote, p.age.doc]);
  }
  (pack.law || []).forEach(f => { out.push([`law.${f.id}`, f.quote, f.doc]); (f.also || []).forEach((a, j) => out.push([`law.${f.id}.also[${j}]`, a.quote, a.doc])); });
  return out;
}

// Freshness of a package at a date: a document is fresh when its status is 200 and its "fetched" is 0..docMaxAge old (maxAgeDays
// of the package; OWNER_COPY_MAX_AGE for an owner copy, tools/lib/ownercopy.mjs); an entry (line, self-exclusion, age, regulator)
// is fresh when its document and every "also" document are fresh.
export function freshness(pack, today) {
  const maxAge = pack.maxAgeDays || 100;
  const limit = slug => docMaxAge((pack.docs || {})[slug], pack.maxAgeDays);
  const docOk = slug => {
    const d = (pack.docs || {})[slug];
    if (!d || d.status !== 200 || !d.fetched) return false;
    const a = (Date.parse(today) - Date.parse(d.fetched)) / 864e5;
    return a >= 0 && a <= limit(slug);
  };
  const entryOk = e => !!e && docOk(e.doc) && (e.also || []).every(a => docOk(a.doc));
  return { maxAge, limit, docOk, entryOk };
}
// What the site may show at a date: per jurisdiction the first fresh line / self-exclusion entry and a fresh age; the stale ones
// are listed (hidden). crisis: the fresh national crisis lines (empty -> the build must fail).
export function displayable(pack, today) {
  const { entryOk } = freshness(pack, today);
  const provinces = {};
  for (const p of pack.provinces || []) {
    const g = p.gambling || [], s = p.selfExclusion || [];
    provinces[p.id] = {
      line: g.find(entryOk) || null,
      selfExclusion: s.find(entryOk) || null,
      age: p.age && entryOk(p.age) ? p.age : null,
      staleLines: g.filter(e => !entryOk(e)),
      staleSelfExclusion: s.filter(e => !entryOk(e)),
    };
  }
  return { crisis: ((pack.national || {}).crisis || []).filter(entryOk), provinces };
}

export function verify({ pack = JSON.parse(fs.readFileSync(PACK, 'utf8')), today = new Date().toISOString().slice(0, 10), log = console.log, docRoot = ROOT } = {}) {
  let bad = 0;
  const ok = m => log('  ok ' + m);
  const fail = m => { bad++; log('  BAD ' + m); };
  const maxAge = pack.maxAgeDays || 100;
  const age = d => (Date.parse(today) - Date.parse(d)) / 864e5;

  if (!(age(pack.checked) >= 0 && age(pack.checked) <= maxAge)) log(`  NOTE checked ${pack.checked}: no full recheck for more than ${maxAge} days (or in the future) — run --recheck --write`);
  const crisisDocs = new Set(((pack.national || {}).crisis || []).flatMap(e => [e.doc, ...(e.also || []).map(a => a.doc)]));
  const text = new Map(), raw = new Map();
  const docFile = slug => path.join(docRoot, pack.docs[slug].file);
  const docText = slug => {
    if (text.has(slug)) return text.get(slug);
    if (!pack.docs[slug]) return null;
    const f = docFile(slug);
    if (!fs.existsSync(f)) return null;
    if (!f.endsWith('.pdf')) raw.set(slug, fs.readFileSync(f, 'utf8'));
    const t = fileText(f);
    text.set(slug, t);
    return t;
  };

  log('documents:');
  for (const [slug, d] of Object.entries(pack.docs)) {
    const f = docFile(slug);
    if (!fs.existsSync(f)) { fail(`${slug}: file missing ${d.file}`); continue; }
    const sha = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    if (sha !== d.sha256) fail(`${slug}: sha256 mismatch`);
    else if (d.status !== 200) fail(`${slug}: status ${d.status} (only 200 may be quoted)`);
    else if (!(age(d.fetched) >= 0 && age(d.fetched) <= docMaxAge(d, pack.maxAgeDays))) {
      if (crisisDocs.has(slug)) fail(`${slug}: fetched ${d.fetched} — older than ${docMaxAge(d, pack.maxAgeDays)} days, and it holds the NATIONAL crisis line (shown on every page)`);
      else log(`  STALE ${slug}: fetched ${d.fetched} — older than ${docMaxAge(d, pack.maxAgeDays)} days; entries citing it are hidden on the site${d.stale ? ` (last try ${d.stale.lastTry}: ${d.stale.reason})` : ''}`);
    } else ok(`${slug}: sha256 ${sha.slice(0, 12)}… ${d.fetched}${d.stale ? ` (recheck failing since ${d.stale.since}: ${d.stale.reason})` : ''}`);
  }

  const quote = (label, q, slug) => {
    if (!q) { fail(`${label}: empty quote`); return false; }
    const t = docText(slug);
    if (t == null) { fail(`${label}: unknown or missing document "${slug}"`); return false; }
    if (!hasQuote(t, pack.docs[slug].file.endsWith('.pdf'), q)) { fail(`${label}: quote not found in ${slug}: "${q.slice(0, 80)}…"`); return false; }
    ok(`${label}: quote found in ${slug}`);
    return true;
  };
  const web = (label, w, slug, quotes) => {
    if (!w) return;
    let h; try { h = host(w); } catch { fail(`${label}: bad URL ${w}`); return; }
    const d = pack.docs[slug];
    docText(slug);
    const inQuote = quotes.some(q => q && normalize(q).toLowerCase().includes(h));
    const linked = (raw.get(slug) || '').includes(`href="${w}"`);
    let finalHost = null; try { finalHost = d && d.finalUrl ? host(d.finalUrl) : null; } catch { /* no final URL */ }
    if (d && (host(d.url) === h || finalHost === h || inQuote || linked)) ok(`${label}: web ${w} confirmed`);
    else fail(`${label}: web ${w} not confirmed by document ${slug}`);
  };
  const line = (label, e) => {
    quote(`${label} quote`, e.quote, e.doc);
    (e.also || []).forEach((a, j) => quote(`${label} also[${j}]`, a.quote, a.doc));
    for (const k of ['hoursQuote', 'smsQuote', 'chatQuote', 'whatsappQuote', 'freeQuote']) if (e[k]) quote(`${label} ${k}`, e[k], e.doc);
    if (!e.phone) fail(`${label}: no phone`);
    else if (e.vanity) {
      // letter number (0800-888-LUDO): keypad digits = phoneTel, the letters are in the quote, the digits (or the last block) too
      if (keypad(e.phone) !== digits(e.phoneTel)) fail(`${label}: phoneTel ${e.phoneTel} ≠ keypad digits of ${e.phone}`);
      if (normalize(e.quote).includes(e.phone)) ok(`${label}: phone in quote`); else fail(`${label}: phone ${e.phone} not in quote`);
    } else {
      if (digits(e.phoneTel) !== digits(e.phone)) fail(`${label}: phoneTel ${e.phoneTel} ≠ digits ${e.phone}`);
      if (phoneRuns(e.quote).some(r => r.includes(digits(e.phone)))) ok(`${label}: phone in quote`);
      else fail(`${label}: phone ${e.phone} not in quote`);
    }
    if (e.hours) { if (normalize(e.hoursQuote || e.quote).includes(normalize(e.hours))) ok(`${label}: hours in quote`); else fail(`${label}: hours "${e.hours}" not in quote`); }
    if (e.whatsapp) { const q = e.whatsappQuote || e.quote; if (phoneRuns(q).some(r => r.includes(digits(e.whatsapp))) && /whats ?app/i.test(q)) ok(`${label}: WhatsApp in quote`); else fail(`${label}: WhatsApp ${e.whatsapp} not in quote`); }
    if (e.free === true && !/gratuit|gratis|sin costo/i.test(e.freeQuote || e.quote)) fail(`${label}: "free" not supported by the quote`);
    web(label, e.web, e.doc, [e.quote, e.hoursQuote]);
  };

  for (const e of pack.national?.crisis || []) line('national.crisis ' + e.name, e);
  const ids = new Set();
  for (const p of pack.provinces) {
    log(`${p.id} (${p.name}):`);
    if (ids.has(p.id)) fail(`${p.id}: duplicate`); ids.add(p.id);
    (p.gambling || []).forEach((e, i) => line(`${p.id}.gambling[${i}] ${e.name}`, e));
    (p.otherLines || []).forEach((e, i) => line(`${p.id}.otherLines[${i}] ${e.name}`, e));
    (p.selfExclusion || []).forEach((e, i) => {
      const l = `${p.id}.selfExclusion[${i}] ${e.name}`;
      quote(`${l} quote`, e.quote, e.doc);
      if (e.terms) { const tq = e.termsQuote || e.quote; if (e.termsQuote) quote(`${l} termsQuote`, tq, e.doc); if (normalize(tq).includes(e.terms)) ok(`${l}: term in quote`); else fail(`${l}: term "${e.terms}" not in quote`); }
      web(l, e.web, e.doc, [e.quote]);
    });
    (p.regulators || []).forEach((e, i) => {
      const l = `${p.id}.regulators[${i}] ${e.name}`;
      if (quote(`${l} quote`, e.quote, e.doc) && e.nameInQuote !== false && !normalize(e.quote).toLowerCase().includes(normalize(e.short || e.name).toLowerCase())) fail(`${l}: name "${e.short || e.name}" not in quote`);
      (e.also || []).forEach((a, j) => quote(`${l} also[${j}]`, a.quote, a.doc));
      web(l, e.web, e.doc, [e.quote]);
    });
    if (p.age) {
      const l = `${p.id}.age`;
      if (quote(`${l} quote`, p.age.quote, p.age.doc)) {
        if (new RegExp(`\\b${p.age.value}\\b`).test(normalize(p.age.quote))) ok(`${l}: ${p.age.value} in quote`); else fail(`${l}: ${p.age.value} not in quote`);
      }
    }
    for (const r of p.searched || []) if (!r.date || !r.result || !(r.tried || []).length) fail(`${p.id}.searched: needs date, tried[] and result`);
    for (const v of p.verify || []) log(`  awaiting verification (not shown): ${v.kind}${v.phone ? ' ' + v.phone : ''} — ${v.note}`);
    // a jurisdiction without a verified line must say what was searched (the site prints "no verified official line" + the national line)
    if (!(p.gambling || []).length && !(p.searched || []).length) fail(`${p.id}: no verified line and no searched[] — say what was searched`);
  }
  log('law:');
  const lawIds = new Set();
  for (const f of pack.law || []) {
    if (lawIds.has(f.id)) fail(`law.${f.id}: duplicate`); lawIds.add(f.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date || '')) fail(`law.${f.id}: date must be YYYY-MM-DD (date of the event the quote reports)`);
    quote(`law.${f.id} quote`, f.quote, f.doc);
    (f.also || []).forEach((a, j) => quote(`law.${f.id}.also[${j}]`, a.quote, a.doc));
  }
  for (const slug of Object.keys(pack.docs)) {
    if (!citations(pack).some(c => c[2] === slug)) fail(`${slug}: document is not cited by any entry — remove it or cite it`);
  }
  if (!ids.has(pack.default)) fail(`default ${pack.default} — no such jurisdiction`);
  const def = pack.provinces.find(p => p.id === pack.default);
  if (def && !(def.gambling || []).length) fail(`default jurisdiction ${pack.default} has no verified line — tel: needed in every build`);
  if (!(pack.national?.crisis || []).length) fail('national.crisis is empty — the crisis line is shown on every page');
  else if (!displayable(pack, today).crisis.length) fail('no fresh national crisis line — the site cannot be built');
  log(bad === 0 ? 'verify-rg: all checks passed' : `verify-rg: CHECKS FAILED: ${bad}`);
  return bad;
}

// --recheck: download every document again and check its quotes against the fresh copy.
function curlDownload(url, file) {
  const r = spawnSync('curl', ['-sL', '--compressed', '-m', '60', '--retry', '2', '-A', UA, '-H', 'Accept-Language: es-AR,es;q=0.9',
    '-o', file, '-w', '%{http_code} %{url_effective}', url], { encoding: 'utf8' });
  const [code, finalUrl] = (r.stdout || '000 ').split(' ');
  return { status: Number(code), finalUrl };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// -> { refreshed, problems, skipped, failed: [{ slug, reason }], crisisFresh }. Partial: every document is handled on its own.
export async function recheck({ write = false, only = null, today = new Date().toISOString().slice(0, 10), log = console.log,
  packPath = PACK, root = ROOT, download = curlDownload, gapMs = 1000 } = {}) {
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jpc-rg-'));
  const cites = citations(pack);
  const failed = [];
  let refreshed = 0, skipped = 0;
  const fail = (slug, d, reason, lines) => {
    failed.push({ slug, reason });
    for (const l of lines) log(l);
    if (write) d.stale = { since: (d.stale && d.stale.since) || today, lastTry: today, reason: reason.slice(0, 200) };
  };
  for (const [slug, d] of Object.entries(pack.docs)) {
    if (only && !only.has(slug)) { skipped++; continue; }
    if (d.refresh === 'manual') { log(`  manual ${slug}: not downloaded (${d.url})`); skipped++; continue; }
    if (isOwnerDoc(d)) { log(`  owner copy ${slug}: not downloaded, the owner saves this page from his browser (${d.url})`); skipped++; continue; }
    const ext = path.extname(d.file);
    const f = path.join(tmp, slug + ext);
    const { status, finalUrl } = download(d.url, f);
    if (gapMs) await sleep(gapMs);
    if (status !== 200 || !fs.existsSync(f) || fs.statSync(f).size === 0) { fail(slug, d, `unreachable: HTTP ${status}`, [`  UNREACHABLE ${slug}: HTTP ${status} ${d.url}`]); continue; }
    if ((ext === '.pdf') !== (fs.readFileSync(f).subarray(0, 5).toString() === '%PDF-')) { fail(slug, d, `changed type (expected ${ext})`, [`  CHANGED TYPE ${slug}: expected ${ext}`]); continue; }
    const t = fileText(f);
    const missing = cites.filter(c => c[2] === slug && !(c[1] && hasQuote(t, ext === '.pdf', c[1])));
    if (missing.length) { fail(slug, d, `quote missing: ${missing.map(m => m[0]).join(', ')}`, missing.map(m => `  MISSING ${slug}: ${m[0]}: "${String(m[1]).slice(0, 90)}…"`)); continue; }
    const sha = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    log(`  ok ${slug}: ${sha === d.sha256 ? 'unchanged' : 'changed, quotes present'}`);
    if (write) {
      fs.copyFileSync(f, path.join(root, d.file));
      Object.assign(d, { fetched: today, status, sha256: sha });
      if (finalUrl && finalUrl !== d.url) d.finalUrl = finalUrl; else delete d.finalUrl;
      delete d.stale;
    }
    refreshed++;
  }
  if (write) {
    if (!only) pack.checked = today;
    fs.writeFileSync(packPath, JSON.stringify(pack, null, 2) + '\n');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const crisisFresh = displayable(pack, today).crisis.length > 0;
  const view = displayable(pack, today);
  const hidden = Object.entries(view.provinces).filter(([, v]) => v.staleLines.length || v.staleSelfExclusion.length).map(([id]) => id);
  log(`recheck: ${refreshed} refreshed, ${failed.length} problems, ${skipped} skipped${write ? '' : ' (dry run: nothing written)'}` +
    (failed.length ? ` — partial: failed documents keep their old copy; their entries are hidden once older than ${pack.maxAgeDays || 100} days` : '') +
    (hidden.length ? `; stale now: ${hidden.join(', ')}` : '') + (crisisFresh ? '' : '; NATIONAL CRISIS LINE NOT FRESH'));
  return { refreshed, problems: failed.length, skipped, failed, crisisFresh };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const today = opt('--today') || new Date().toISOString().slice(0, 10);
  if (args.includes('--recheck')) {
    const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
    recheck({ write: args.includes('--write'), only, today }).then(r => process.exit(!r.crisisFresh || (args.includes('--strict') && r.problems) ? 1 : 0));
  } else {
    const quiet = args.includes('-q');
    const bad = verify({ today, log: quiet ? (m => { if (!m.startsWith('  ok ')) console.log(m); }) : console.log });
    process.exit(bad ? 1 : 0);
  }
}
