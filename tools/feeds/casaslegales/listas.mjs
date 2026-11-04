// Monthly server recheck of the official pages casaslegales.com is built from (docs/FEEDS.md, casaslegales): the licence registries
// (data/sources/registries), the province pages (data/sources/provinces) and the help package (data/sources/rg). The feed runs
// daily from cron and goes to the network only when it is due (dueReason): first run, the synced data changed, 28 days since the
// last full check, or a retry 3 days after a failure (only the failing pages, for 14 days; after that only monthly).
// Never fetched: copies the owner saves from his browser (copiedBy "owner", pendingOwnerCopy, sites in AI_BLOCKED_HOSTS, refresh
// "manual") and any page whose robots.txt keeps us or any AI crawler out (robots-txt.mjs; that page raises an alert once).
// Every fresh copy goes through the same checks as the build (checkRegistry: quotes verbatim, HTML evidence of every licensee byte
// for byte, the list complete; checkProvinces; every help quote in its document):
//   - all pass: the server copy is replaced (state/docs/listas/<key>.<ext>), "revisado" = today, sha256 and size recorded; the
//     site shows "revisada el dd/mm/aaaa, sin cambios" next to that copy (client ui.js reads /data/feeds/listas.json);
//   - something changed (a licensee added or removed, a quote gone): nothing is published, the last good date stays, the fresh copy
//     is kept in state/docs/listas-pending/ and an alert with the difference goes to Telegram (once per difference);
//   - unreachable: the last good date stays; expiries show the day the copy turns too old (revisado + maxAgeDays).
// The repository copies are refreshed from the server ones by: bash tools/feeds-server.sh casaslegales pull (pull-apply.mjs).
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, renameSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { loadRegistries, checkRegistry, brandNames, loadRg } from '../../lib/sources.mjs';
import { checkProvinces, loadProvinces } from '../../lib/provsources.mjs';
import { isAiBlocked } from '../../lib/ownercopy.mjs';
import { citations, hasQuote, normalize, visibleText } from '../../verify-rg.mjs';
import { robotsVerdict } from './robots-txt.mjs';

export const MONTH_DAYS = 28, RETRY_DAYS = 3, RETRY_FOR_DAYS = 14;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const sha256 = b => createHash('sha256').update(b).digest('hex');
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const maxDay = (...xs) => xs.filter(x => DAY.test(x || '')).sort().at(-1) || null;
export const isOwnerDoc = d => !!(d.pendingOwnerCopy || d.copiedBy === 'owner' || isAiBlocked(d.url) || d.refresh === 'manual');
export const fileKey = key => key.replace(':', '_');
// findings of a registry belong to the whole registry (one check of all its pages); the other sets are checked page by page
export const scopeOf = t => t.set.startsWith('registry:') ? t.set : t.key;

// every saved document of the three sets: { key, set, slug, url, ext, maxAge, owner, fetched, sha256 }
export function targets(src = loadSources()) {
  const out = [];
  for (const r of src.registries) {
    const owner = Object.values(r.docs).some(isOwnerDoc);
    for (const [slug, d] of Object.entries(r.docs)) out.push({ key: slug, set: 'registry:' + r.id, slug, url: d.url, ext: extname(d.file) || '.html', maxAge: r.maxAgeDays || 100, owner, fetched: d.fetched, sha256: d.sha256 });
  }
  for (const [slug, d] of Object.entries(src.provinces.docs || {})) out.push({ key: 'pv:' + slug, set: 'provinces', slug, url: d.url, ext: extname(d.file) || '.html', maxAge: src.provinces.maxAgeDays || 100, owner: isOwnerDoc(d), fetched: d.fetched, sha256: d.sha256 });
  for (const [slug, d] of Object.entries(src.rg.docs || {})) out.push({ key: 'rg:' + slug, set: 'rg', slug, url: d.url, ext: extname(d.file) || '.html', maxAge: src.rg.maxAgeDays || 100, owner: isOwnerDoc(d), fetched: d.fetched, sha256: d.sha256 });
  return out;
}
export function loadSources() {
  return { registries: loadRegistries().map(r => { const { _file, ...x } = r; return x; }), provinces: loadProvinces(), rg: loadRg() };
}
// what the checks depend on (quotes, licensees, addresses), not the copy dates: a new pull does not trigger a recheck
export function specHash(src) {
  const strip = j => ({ ...j, checked: null, docs: Object.fromEntries(Object.entries(j.docs || {}).map(([s, d]) => [s, d.url])) });
  return sha256(JSON.stringify([src.registries.map(strip), strip(src.provinces), strip(src.rg)])).slice(0, 16);
}

// null when nothing is due; else { reason, only: Set of keys to fetch or null (all) }
export function dueReason(prev, today, spec, force, list) {
  if (force) return { reason: 'forced', only: null };
  if (!prev || !DAY.test(prev.checkedOn || '')) return { reason: 'first check', only: null };
  if (prev.spec !== spec) return { reason: 'synced data changed', only: null };
  if (days(prev.checkedOn, today) >= MONTH_DAYS) return { reason: 'monthly', only: null };
  const failing = Object.entries(prev.docs || {}).filter(([, d]) => d.state === 'unreachable' && DAY.test(d.since || '') && days(d.since, today) < RETRY_FOR_DAYS && days(d.lastTry || d.since, today) >= RETRY_DAYS).map(([k]) => k);
  if (!failing.length) return null;
  const sets = new Set(list.filter(t => failing.includes(t.key) && t.set.startsWith('registry:')).map(t => t.set));
  return { reason: 'retry', only: new Set(list.filter(t => failing.includes(t.key) || sets.has(t.set)).map(t => t.key)) };
}

async function robotsOf(ctx, origin) {
  try { return { text: (await ctx.getText(origin + '/robots.txt', { ttlHours: 20, timeoutMs: 30000 })).text }; }
  catch (e) { return e.status >= 400 && e.status < 500 ? { text: '' } : { error: String(e && e.message || e).slice(0, 120) }; }
}

export function textOf(buf, ext) {
  if (ext !== '.pdf') return visibleText(buf.toString('utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'cl-pdf-'));
  try { writeFileSync(join(dir, 'd.pdf'), buf); return normalize(execFileSync('pdftotext', ['-layout', join(dir, 'd.pdf'), '-'], { encoding: 'utf8', maxBuffer: 64 << 20 })); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

// the difference between the official page and our registry file, from the checkRegistry findings
export function registryDiff(errs) {
  const added = [], removed = [], other = [];
  for (const e of errs) {
    let m;
    if ((m = / the official list has (\S+) but the registry file does not$/.exec(e))) added.push(m[1]);
    else if ((m = /: (\S+) is in the registry file but not in the official list$/.exec(e))) removed.push(m[1]);
    else other.push(e.replace(/^[\w-]+: /, ''));
  }
  return { added, removed, other };
}

function writeAtomic(file, buf) {
  mkdirSync(join(file, '..'), { recursive: true });
  const tmp = file + '.tmp-' + process.pid;
  writeFileSync(tmp, buf);
  renameSync(tmp, file);
}

export function judge(raw, prevData, docsDir) {
  const { today, src, list, fresh, only } = raw;
  const P = (prevData && prevData.docs) || {};
  const docs = {}, alerts = [], changes = [];
  const base = t => {
    const p = P[t.key] && P[t.key].url === t.url ? P[t.key] : null;
    return { set: t.set, url: t.url, state: t.owner ? 'owner' : p ? p.state : 'new', revisado: maxDay(p && p.revisado, t.fetched), sha256: p && p.sha256 || t.sha256, ...(p && p.since ? { since: p.since, lastTry: p.lastTry, reason: p.reason } : {}) };
  };
  for (const t of list) docs[t.key] = base(t);
  const touched = t => !t.owner && (!only || only.has(t.key));
  const ok = t => { const f = fresh[t.key]; docs[t.key] = { set: t.set, url: t.url, state: 'ok', revisado: today, sha256: sha256(f.buf), bytes: f.buf.length }; if (docsDir) writeAtomic(join(docsDir, 'listas', fileKey(t.key) + t.ext), f.buf); };
  const fail = (t, state, reason) => {
    const was = docs[t.key];
    docs[t.key] = { ...was, state, since: was.state === state && was.since ? was.since : today, lastTry: today, reason: String(reason).slice(0, 200) };
    if (state === 'robots') alerts.push({ id: 'robots-' + t.key, scope: scopeOf(t), text: t.url + ' now keeps AI crawlers or us out (' + reason + '): our server stops fetching it; the owner saves it from his browser (docs/reference/owner-saves/README.md), then mark it pendingOwnerCopy' });
  };
  const changed = (t, diff) => {
    const f = fresh[t.key];
    if (docsDir && f && f.buf) writeAtomic(join(docsDir, 'listas-pending', fileKey(t.key) + t.ext), f.buf);
    fail(t, 'changed', [diff.added.length ? 'added ' + diff.added.join(', ') : '', diff.removed.length ? 'removed ' + diff.removed.join(', ') : '', diff.other.slice(0, 2).join('; ')].filter(Boolean).join('; '));
  };
  const blocked = t => { const f = fresh[t.key]; if (!f) { fail(t, 'unreachable', 'not fetched'); return true; } if (f.robots) { fail(t, 'robots', f.robots); return true; } if (f.error) { fail(t, 'unreachable', f.error); return true; } return false; };
  const report = (t, label, diff) => {
    changes.push({ scope: scopeOf(t), label, ...diff });
    const id = 'changed-' + scopeOf(t).replace(':', '-') + '-' + sha256(JSON.stringify(diff)).slice(0, 8);
    alerts.push({ id, scope: scopeOf(t), text: label + ' changed on the official page; the site keeps the last checked data. ' + [diff.added.length ? 'Added: ' + diff.added.join(', ') + '.' : '', diff.removed.length ? 'Removed: ' + diff.removed.join(', ') + '.' : '', diff.other.length ? 'Other: ' + diff.other.slice(0, 3).join('; ').slice(0, 400) + '.' : ''].filter(Boolean).join(' ') + ' Fresh copy: state/docs/listas-pending on the server; fix the data by hand after reading the page (docs/MAINTENANCE.md).' });
  };

  const names = brandNames();
  for (const r of src.registries) {
    const ts = list.filter(t => t.set === 'registry:' + r.id);
    if (!ts.length || ts[0].owner || !ts.some(touched)) continue;
    const bad = ts.filter(blocked);
    if (bad.length) { for (const t of ts.filter(t => !bad.includes(t))) docs[t.key] = { ...docs[t.key], lastTry: today }; continue; }
    const errs = checkRegistry(r, { today, names, raw: slug => fresh[slug].buf.toString('utf8'), fresh: false });
    if (errs.length) { const diff = registryDiff(errs); ts.forEach(t => changed(t, diff)); report(ts[0], 'registry ' + r.id, diff); }
    else ts.forEach(ok);
  }
  for (const t of list.filter(t => t.set === 'provinces' && touched(t))) {
    if (blocked(t)) continue;
    const html = fresh[t.key].buf.toString('utf8');
    const errs = checkProvinces({ today, data: src.provinces, copies: s => s === t.slug ? html : null });
    if (errs.length) { const diff = { added: [], removed: [], other: errs.map(e => e.replace(/^provinces: /, '')) }; changed(t, diff); report(t, 'province page ' + t.slug, diff); }
    else ok(t);
  }
  const cites = citations(src.rg);
  for (const t of list.filter(t => t.set === 'rg' && touched(t))) {
    if (blocked(t)) continue;
    const buf = fresh[t.key].buf, isPdf = t.ext === '.pdf';
    if (isPdf !== (buf.subarray(0, 5).toString() === '%PDF-')) { const diff = { added: [], removed: [], other: ['the document is not a ' + t.ext + ' any more'] }; changed(t, diff); report(t, 'help page ' + t.slug, diff); continue; }
    let text;
    try { text = textOf(buf, t.ext); } catch (e) { fail(t, 'unreachable', 'cannot read: ' + String(e.message).slice(0, 100)); continue; }
    const missing = cites.filter(c => c[2] === t.slug && !(c[1] && hasQuote(text, isPdf, c[1])));
    if (missing.length) { const diff = { added: [], removed: [], other: missing.map(m => 'quote ' + m[0] + ' not found: "' + String(m[1]).slice(0, 80) + '"') }; changed(t, diff); report(t, 'help page ' + t.slug, diff); }
    else ok(t);
  }
  const counts = {};
  for (const d of Object.values(docs)) counts[d.state] = (counts[d.state] || 0) + 1;
  const expiries = list.filter(t => !t.owner && DAY.test(docs[t.key].revisado || '')).map(t => {
    const d = docs[t.key];
    return { id: t.key, what: t.set + ' ' + t.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60) + (d.state === 'ok' ? ' - server checked ' + d.revisado : ' - ' + d.state + (d.since ? ' since ' + d.since : '') + (d.reason ? ': ' + d.reason : '')), until: plus(d.revisado, t.maxAge), warnDays: 0 };
  });
  return { docs, counts, changes, alerts, expiries };
}

export default {
  name: 'listas',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 780,
  async fetch(ctx) {
    const today = ctx.today(), src = loadSources(), list = targets(src), spec = specHash(src);
    const prev = ctx.prev && ctx.prev.data;
    const due = dueReason(prev, today, spec, ctx.force, list);
    const raw = { today, src, list, spec, fresh: {}, due, fetched: new Date().toISOString(), source: { url: null } };
    if (!due) return raw;
    const robots = {};
    for (const t of list.filter(t => !t.owner && (!due.only || due.only.has(t.key)))) {
      const u = new URL(t.url);
      if (!(u.origin in robots)) robots[u.origin] = await robotsOf(ctx, u.origin);
      const rb = robots[u.origin];
      if (rb.error) { raw.fresh[t.key] = { error: 'robots.txt unreachable: ' + rb.error }; continue; }
      const v = robotsVerdict(rb.text, u.pathname + u.search);
      if (!v.ok) { raw.fresh[t.key] = { robots: v.why }; continue; }
      try { const r = await ctx.getBytes(t.url, { ttlHours: 20, timeoutMs: 40000 }); raw.fresh[t.key] = { buf: r.buf }; }
      catch (e) { raw.fresh[t.key] = { error: String(e && e.message || e).slice(0, 160) }; }
    }
    return raw;
  },
  validate(raw) {
    if (!raw.list.length) throw new Error('listas: no source documents synced');
    if (!raw.due) return;
    const tried = Object.values(raw.fresh);
    if (tried.length && !tried.some(f => f.buf) && tried.some(f => f.error)) throw new Error('listas: no official page answered (' + tried.find(f => f.error).error + ')');
  },
  compute(raw, prev, ctx) {
    if (!raw.due && prev) return prev;
    const only = raw.due.only;
    const j = judge({ ...raw, only }, prev, ctx && ctx.docsDir);
    // a retry touches only some sets: the findings of the others stay as they were
    const touched = new Set(raw.list.filter(t => !t.owner && (!only || only.has(t.key))).map(scopeOf));
    const keep = x => !!only && !!x && !touched.has(x.scope);
    return {
      checkedOn: only ? prev.checkedOn : raw.today, lastRun: raw.today, reason: raw.due.reason, spec: raw.spec, counts: j.counts, docs: j.docs,
      changes: [...((prev && prev.changes) || []).filter(keep), ...j.changes], alerts: [...((prev && prev.alerts) || []).filter(keep), ...j.alerts], expiries: j.expiries,
    };
  },
};
