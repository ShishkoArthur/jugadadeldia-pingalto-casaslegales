// Live-data runner for jugadadeldia.com, pingalto.com and casaslegales.com (owner guide: docs/FEEDS.md). On the server it runs from cron inside a
// throwaway container (tools/feeds-server.sh); each site has its own folder, cron file, user and User-Agent.
//   node tools/feeds/run.mjs --site <jugadadeldia|pingalto|casaslegales> [names...] [--force] [--out <dir>] [--cache <dir>] [--log <file>]
//                            [--feeds-dir <dir>] [--fixtures <dir>] [--now <ISO time>]
// A feed is tools/feeds/<site>/<name>.mjs (name: lowercase letters and digits) exporting
//   default { name, cadence: 'run'|'hourly'|'daily', maxAgeHours, timeoutSec?, enabled?(env): boolean, async fetch(ctx), validate(raw), compute(raw, prev, ctx) }
// 'run' feeds run on every call, 'hourly' when their file is older than 50 minutes, 'daily' when older than 20 hours (--force: always).
// Files with other names (quiniela-parse.mjs) and modules without fetch/validate/compute are helpers and are skipped.
// ctx (lib.mjs makeCtx): getJson/getText/getBytes(url, { ttlHours, headers, method, body }), now, today(), prev (previous document
// or null), outDir, force (--force given), env (process.env: keys come from the server's env file, never written anywhere).
// A feed may list date-bound inputs in its data (expiries, see expiriesOf): _health.json shows them with days left and alerts once
// when one enters its warning window or expires.
// For each feed: fetch -> validate (throws on any deviation) -> compute -> <out>/<name>.json { name, updated, source, data }.
// compute may return { __files: { <other name>: data }, ...data }: each extra document is written as <out>/<other name>.json the
// same way (history archives). Files are written only on success: on failure the previous files stay (last good data is kept).
// After every run <out>/_health.json is rewritten for all feeds of the site (stale, consecutiveFailures, lastError). A feed that
// turns stale or recovers raises an alert: sent to Telegram when TG_BOT_TOKEN and TG_CHAT_ID are set, otherwise only logged.
// Exit code: 0 all good; 1 some enabled feed has no file younger than its maxAgeHours or failed to load; 2 bad arguments.
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeCtx, writeJsonAtomic, readJson, readFeed, zoneDate, UAS, telegram } from './lib.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const NAME_RE = /^[a-z0-9]+\.mjs$/;
const LOG_KEEP = 400;
const DUE_MS = { hourly: 50 * 60e3, daily: 20 * 3600e3 };

function checkModule(m, f) {
  if (!m || typeof m.fetch !== 'function' || typeof m.validate !== 'function' || typeof m.compute !== 'function') return false;
  if (m.name + '.mjs' !== f) throw new Error('feed ' + f + ': name must be ' + f.replace(/\.mjs$/, ''));
  if (!['run', 'hourly', 'daily'].includes(m.cadence) || !(m.maxAgeHours > 0)) throw new Error('feed ' + m.name + ': cadence/maxAgeHours');
  return true;
}

export async function loadFeedsSafe(dir) {
  const feeds = [], errors = [];
  const files = existsSync(dir) ? readdirSync(dir).filter(f => NAME_RE.test(f)).sort() : [];
  for (const f of files) {
    try {
      const m = (await import(pathToFileURL(join(dir, f)).href)).default;
      if (checkModule(m, f)) feeds.push(m);
    } catch (e) { errors.push({ file: f, error: String(e && e.message || e).slice(0, 500) }); }
  }
  return { feeds, errors };
}

function checkFinite(v, path) {
  if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('compute: not a finite number at ' + path);
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) checkFinite(x, path + '.' + k);
}
export { readFeed };
const isOn = (feed, env) => !(feed.enabled && !feed.enabled(env));

// o: { out, cacheDir, fixtures, now, ua, env }
export async function runFeed(feed, o) {
  const f = join(o.out, feed.name + '.json'), prev = readFeed(f);
  const t0 = Date.now();
  let ctx = { requests: [] };
  let timer;
  try {
    ctx = makeCtx({ cacheDir: o.fixtures ? null : o.cacheDir, fixtures: o.fixtures ? join(o.fixtures, feed.name) : null, now: o.now, gapMs: o.fixtures ? 0 : 1000, ua: o.ua });
    ctx.prev = prev;
    ctx.outDir = o.out;
    ctx.env = o.env || {};
    ctx.force = !!o.force;
    ctx.docsDir = o.docsDir || null;
    const limit = (feed.timeoutSec || 240) * 1000;
    const work = (async () => {
      const raw = await feed.fetch(ctx);
      feed.validate(raw);
      return { raw, data: feed.compute(raw, prev ? prev.data : null, ctx) };
    })();
    const { raw, data } = await Promise.race([work, new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout after ' + limit / 1000 + ' s')), limit); })]);
    const extra = data && data.__files;
    if (extra) delete data.__files;
    checkFinite(data, feed.name);
    if (extra) checkFinite(extra, feed.name + '.__files');
    const updated = (o.now || new Date()).toISOString();
    const source = { url: raw && raw.source && raw.source.url, also: raw && raw.source && raw.source.also, fetched: raw && raw.fetched || null };
    for (const [name, d] of Object.entries(extra || {})) {
      if (!/^[a-z0-9-]+$/.test(name) || name === feed.name) throw new Error('bad extra document name ' + name);
      writeJsonAtomic(join(o.out, name + '.json'), { name, updated, source, data: d });
    }
    writeJsonAtomic(f, { name: feed.name, updated, source, data });
    return { at: updated, name: feed.name, ok: true, ms: Date.now() - t0, requests: ctx.requests.length };
  } catch (e) {
    return { at: (o.now || new Date()).toISOString(), name: feed.name, ok: false, ms: Date.now() - t0, requests: ctx.requests.length, error: String(e && e.message || e).slice(0, 500) };
  } finally { clearTimeout(timer); }
}

const round2 = x => Math.round(x * 100) / 100;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

// Date-bound inputs of a site (a draw programme, saved copies of rules and help documents): a feed lists them in its data as
// expiries: [{ id, what, until: 'YYYY-MM-DD' (last valid day), warnDays }]. The health report lists all of them with days left
// (Argentine date): 'expired' after until, 'soon' within warnDays (warnDays 0: no early warning), else 'ok'. Expired ones are problems.
// Things a person must look at (a price held back, a cited value that changed): a feed lists them in its data as
// alerts: [{ id, text }]. Each id is alerted once, when it appears; while listed it is a problem of the health report.
export function noticesOf(docs) {
  const out = [];
  for (const [feed, doc] of docs) for (const x of (doc && doc.data && Array.isArray(doc.data.alerts) ? doc.data.alerts : [])) if (x && typeof x.id === 'string') out.push({ id: x.id, text: String(x.text || '').slice(0, 300), feed });
  return out;
}
export function expiriesOf(docs, now) {
  const today = zoneDate(now), out = [];
  for (const [feed, doc] of docs) {
    const list = doc && doc.data && Array.isArray(doc.data.expiries) ? doc.data.expiries : [];
    for (const x of list) {
      if (!x || typeof x.id !== 'string' || !DAY_RE.test(x.until || '')) continue;
      const daysLeft = dayDiff(today, x.until), warn = Number.isInteger(x.warnDays) && x.warnDays > 0 ? x.warnDays : 0;
      out.push({ id: x.id, what: String(x.what || ''), until: x.until, daysLeft, warnDays: warn, state: daysLeft < 0 ? 'expired' : warn && daysLeft <= warn ? 'soon' : 'ok', feed });
    }
  }
  return out.sort((a, b) => a.until < b.until ? -1 : a.until > b.until ? 1 : a.id < b.id ? -1 : 1);
}

export function buildHealth(feeds, out, log, loadErrors, now, env = {}, site = '') {
  const health = { generated: now.toISOString(), runner: UAS[site] || site, ok: true, problems: [], feeds: {}, expiries: [] };
  const docs = [];
  for (const e of loadErrors) { health.ok = false; health.problems.push('load ' + e.file + ': ' + e.error); }
  for (const feed of feeds) {
    const enabled = isOn(feed, env);
    const doc = readFeed(join(out, feed.name + '.json'));
    if (enabled) docs.push([feed.name, doc]);
    const mine = log.filter(r => r && r.name === feed.name);
    const last = mine[mine.length - 1] || null;
    const lastOkRec = [...mine].reverse().find(r => r.ok) || null;
    const lastErrRec = [...mine].reverse().find(r => !r.ok) || null;
    let consecutiveFailures = 0;
    for (let i = mine.length - 1; i >= 0 && !mine[i].ok; i--) consecutiveFailures++;
    const ageMs = doc ? now - Date.parse(doc.updated) : null;
    const ageHours = ageMs === null || !Number.isFinite(ageMs) ? null : round2(ageMs / 3600e3);
    const stale = enabled && !(ageHours !== null && ageHours <= feed.maxAgeHours);
    health.feeds[feed.name] = {
      cadence: feed.cadence, maxAgeHours: feed.maxAgeHours, enabled,
      updated: doc ? doc.updated : null, ageHours, stale,
      lastAttempt: last ? last.at : null,
      lastOk: lastOkRec ? lastOkRec.at : (doc ? doc.updated : null),
      failing: !!(last && !last.ok), consecutiveFailures,
      lastError: lastErrRec ? { at: lastErrRec.at, message: lastErrRec.error } : null,
    };
    if (stale) { health.ok = false; health.problems.push(feed.name + ': no good data for ' + (ageHours === null ? 'ever' : ageHours + ' h') + ' (limit ' + feed.maxAgeHours + ' h)'); }
  }
  health.expiries = expiriesOf(docs, now);
  health.notices = noticesOf(docs);
  for (const x of health.notices) { health.ok = false; health.problems.push('notice ' + x.id + ': ' + x.text); }
  for (const x of health.expiries) if (x.state === 'expired') { health.ok = false; health.problems.push('expired ' + x.until + ': ' + x.id + ' (' + x.what + ')'); }
  return health;
}

// Alerts on state changes only (a feed turns stale, or recovers; a date-bound input enters 'soon' or 'expired'), never on every failure.
export function alertsFor(prev, next, site) {
  const out = [];
  for (const [n, f] of Object.entries(next.feeds)) {
    const was = prev && prev.feeds && prev.feeds[n];
    if (f.stale && !(was && was.stale)) out.push(site + ' ' + n + ': no fresh data (' + (f.ageHours === null ? 'never' : f.ageHours + ' h') + ', limit ' + f.maxAgeHours + ' h)' + (f.lastError ? ': ' + f.lastError.message.slice(0, 160) : ''));
    if (!f.stale && was && was.stale) out.push(site + ' ' + n + ': recovered');
  }
  const seen = new Set(((prev && prev.notices) || []).map(x => x.id));
  for (const x of next.notices || []) if (!seen.has(x.id)) out.push(site + ' ' + x.text);
  const before = new Map(((prev && prev.expiries) || []).map(x => [x.id, x.state]));
  for (const x of next.expiries || []) {
    if (x.state === 'ok' || before.get(x.id) === x.state) continue;
    out.push(site + ' ' + (x.state === 'expired' ? 'EXPIRED since ' + x.until : 'expires ' + x.until + ' (' + x.daysLeft + ' days)') + ': ' + x.id + ' - ' + x.what);
  }
  return out;
}

async function sendAlerts(list, env) {
  if (!list.length) return;
  console.log(await telegram(list.join('\n'), env));
}

export function parseArgs(args) {
  const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const valued = ['--site', '--fixtures', '--out', '--now', '--cache', '--log', '--feeds-dir'];
  const valueIdx = new Set(valued.flatMap(k => { const i = args.indexOf(k); return i >= 0 ? [i, i + 1] : []; }));
  const site = opt('--site');
  const out = resolve(opt('--out') || join(ROOT, 'dist/feeds', site || 'x'));
  return {
    site, out,
    cacheDir: resolve(opt('--cache') || join(ROOT, '.cache/feeds', site || 'x')),
    logFile: resolve(opt('--log') || join(out, '_log.json')),
    feedsDir: resolve(opt('--feeds-dir') || join(ROOT, 'tools/feeds', site || 'x')),
    fixtures: opt('--fixtures') ? resolve(opt('--fixtures')) : null,
    now: opt('--now') ? new Date(opt('--now')) : null,
    force: args.includes('--force'),
    names: args.filter((a, i) => !a.startsWith('--') && !valueIdx.has(i)),
  };
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const o = parseArgs(argv);
  if (!UAS[o.site]) { console.error('--site must be one of ' + Object.keys(UAS).join(', ')); return 2; }
  if (o.now && Number.isNaN(o.now.getTime())) { console.error('bad --now'); return 2; }
  const { feeds: all, errors } = await loadFeedsSafe(o.feedsDir);
  for (const e of errors) console.error('load ' + e.file + ': ' + e.error);
  for (const n of o.names) if (!all.some(f => f.name === n)) { console.error('unknown feed ' + n); return 2; }
  const feeds = all.filter(f => !o.names.length || o.names.includes(f.name));
  let log = [];
  if (existsSync(o.logFile)) { try { const l = readJson(o.logFile); if (Array.isArray(l)) log = l; } catch { /* a broken log starts over */ } }
  const clock = () => o.now || new Date();
  for (const feed of feeds) {
    if (!isOn(feed, env)) { console.log(feed.name + ': disabled'); continue; }
    const cur = readFeed(join(o.out, feed.name + '.json'));
    const due = o.force || feed.cadence === 'run' || !cur || clock() - Date.parse(cur.updated) > DUE_MS[feed.cadence];
    if (!due) { console.log(feed.name + ': not due (' + feed.cadence + ', updated ' + cur.updated + ')'); continue; }
    const r = await runFeed(feed, { out: o.out, cacheDir: o.cacheDir, fixtures: o.fixtures, now: o.now, ua: UAS[o.site], env, force: o.force, docsDir: join(dirname(o.logFile), 'docs') });
    log.push(r);
    console.log(feed.name + ': ' + (r.ok ? 'updated' : 'FAILED ' + r.error) + ' (' + r.ms + ' ms, ' + r.requests + ' requests)');
  }
  log = log.slice(-LOG_KEEP);
  writeJsonAtomic(o.logFile, log, true);
  const hf = join(o.out, '_health.json');
  let before = null;
  try { before = readJson(hf); } catch { /* first run */ }
  const health = buildHealth(all, o.out, log, errors, clock(), env, o.site);
  writeJsonAtomic(hf, health, true);
  if (!o.fixtures) await sendAlerts(alertsFor(before, health, o.site), env);
  for (const p of health.problems) console.error(p);
  console.log('health: ' + (health.ok ? 'ok' : 'PROBLEMS ' + health.problems.length) + ', ' + Object.keys(health.feeds).length + ' feeds');
  return health.ok ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(await main());
