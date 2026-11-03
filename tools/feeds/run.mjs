// Live-data runner for jugadadeldia.com and pingalto.com (owner guide: docs/FEEDS.md). On the server it runs from cron inside a
// throwaway container (tools/feeds-server.sh); each site has its own folder, cron file, user and User-Agent.
//   node tools/feeds/run.mjs --site <jugadadeldia|pingalto> [names...] [--force] [--out <dir>] [--cache <dir>] [--log <file>]
//                            [--feeds-dir <dir>] [--fixtures <dir>] [--now <ISO time>]
// A feed is tools/feeds/<site>/<name>.mjs (name: lowercase letters and digits) exporting
//   default { name, cadence: 'run'|'hourly'|'daily', maxAgeHours, timeoutSec?, enabled?(env): boolean, async fetch(ctx), validate(raw), compute(raw, prev, ctx) }
// 'run' feeds run on every call, 'hourly' when their file is older than 50 minutes, 'daily' when older than 20 hours (--force: always).
// Files with other names (quiniela-parse.mjs) and modules without fetch/validate/compute are helpers and are skipped.
// ctx (lib.mjs makeCtx): getJson/getText(url, { ttlHours, headers }), now, today(), prev (previous document or null), outDir,
// env (process.env: keys come from the server's env file, never written anywhere).
// For each feed: fetch -> validate (throws on any deviation) -> compute -> <out>/<name>.json { name, updated, source, data }.
// compute may return { __files: { <other name>: data }, ...data }: each extra document is written as <out>/<other name>.json the
// same way (history archives). Files are written only on success: on failure the previous files stay (last good data is kept).
// After every run <out>/_health.json is rewritten for all feeds of the site (stale, consecutiveFailures, lastError). A feed that
// turns stale or recovers raises an alert: sent to Telegram when TG_BOT_TOKEN and TG_CHAT_ID are set, otherwise only logged.
// Exit code: 0 all good; 1 some enabled feed has no file younger than its maxAgeHours or failed to load; 2 bad arguments.
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeCtx, writeJsonAtomic, readJson, readFeed, UAS } from './lib.mjs';

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

export function buildHealth(feeds, out, log, loadErrors, now, env = {}, site = '') {
  const health = { generated: now.toISOString(), runner: UAS[site] || site, ok: true, problems: [], feeds: {} };
  for (const e of loadErrors) { health.ok = false; health.problems.push('load ' + e.file + ': ' + e.error); }
  for (const feed of feeds) {
    const enabled = isOn(feed, env);
    const doc = readFeed(join(out, feed.name + '.json'));
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
  return health;
}

// Alerts on state changes only (a feed turns stale, or recovers), never on every failure.
export function alertsFor(prev, next, site) {
  const out = [];
  for (const [n, f] of Object.entries(next.feeds)) {
    const was = prev && prev.feeds && prev.feeds[n];
    if (f.stale && !(was && was.stale)) out.push(site + ' ' + n + ': no fresh data (' + (f.ageHours === null ? 'never' : f.ageHours + ' h') + ', limit ' + f.maxAgeHours + ' h)' + (f.lastError ? ': ' + f.lastError.message.slice(0, 160) : ''));
    if (!f.stale && was && was.stale) out.push(site + ' ' + n + ': recovered');
  }
  return out;
}

async function sendAlerts(list, env) {
  if (!list.length) return;
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) { for (const a of list) console.log('alert (telegram not configured): ' + a); return; }
  try {
    const res = await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: list.join('\n'), disable_web_page_preview: true }),
    });
    console.log('alert sent to telegram: ' + res.status + ' (' + list.length + ')');
  } catch (e) { console.log('alert: telegram failed (' + String(e && e.message || e).slice(0, 80) + ')'); }
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
    const r = await runFeed(feed, { out: o.out, cacheDir: o.cacheDir, fixtures: o.fixtures, now: o.now, ua: UAS[o.site], env });
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
