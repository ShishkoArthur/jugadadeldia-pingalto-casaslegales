// Fortnite stats proxy of pingalto.com (/fortnite/tracker; docs/MAINTENANCE.md). Runs in its own container (tools/fnapi-server.sh),
// reached only through our Caddy block: handle /api/fn/* -> pingalto-fnapi:8787. The fortnite-api.com key stays here (env).
//   GET /api/fn/stats?name=<Epic name>&platform=all|keyboardMouse|gamepad|touch&window=lifetime|season
//   GET /api/fn/health
// Per visitor FN.perIpPerMin requests a minute, at most FN.globalPerMin upstream calls a minute for the whole site (the key allows
// 180), one upstream call per name and window every FN.cacheMin minutes (all four input types come in one answer), the same name
// asked twice at once waits for the first call. Answers carry only the fields the page shows. Names are never logged.
import { createServer } from 'node:http';
import { FN, shapeStats } from '../../engine/games/fnstats.mjs';
import { parseQuery, Limiter, TtlCache, cacheKey, clientIp, upstreamError, Alarm } from './core.mjs';
import { telegram } from '../feeds/lib.mjs';

const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.FORTNITE_API_KEY || '';
const UA = 'Pingalto/1.0 (pingalto.com)';
const UPSTREAM = 'https://fortnite-api.com/v2/stats/br/v2';
const started = Date.now();
const perIp = new Limiter(FN.perIpPerMin, 60e3), global = new Limiter(FN.globalPerMin, 60e3);
const cache = new TtlCache(3000), pending = new Map();
const log = (...a) => console.log(new Date().toISOString(), ...a);
const alarm = new Alarm({ send: text => telegram(text).then(r => log(r)) });
const counts = { requests: 0, upstream: 0, cached: 0, limited: 0 };

async function upstream(name, window) {
  if (!global.take('all').ok) return { error: 'busy', retryAfter: 30 };
  counts.upstream++;
  const url = UPSTREAM + '?name=' + encodeURIComponent(name) + '&accountType=epic&timeWindow=' + window;
  const t0 = Date.now();
  let res, body;
  try {
    res = await fetch(url, { headers: { Authorization: KEY, 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(FN.timeoutMs) });
    body = await res.json().catch(() => null);
  } catch (e) {
    alarm.fail(e && e.name === 'TimeoutError' ? 'timeout ' + FN.timeoutMs + ' ms' : 'network ' + String(e && e.message || e).slice(0, 60));
    log('upstream fail', e && e.name, Date.now() - t0 + 'ms');
    return { error: 'upstream' };
  }
  log('upstream', res.status, window, Date.now() - t0 + 'ms');
  if (res.status === 200) {
    const data = body && shapeStats(body.data);
    if (!data) { alarm.fail('200 with an unknown shape'); return { error: 'upstream' }; }
    alarm.ok();
    return { data, ttl: FN.cacheMin * 60e3 };
  }
  const e = upstreamError(res.status, body);
  if (e.upstream) alarm.fail('HTTP ' + res.status, { key: !!e.key }); else alarm.ok();
  if (res.status === 429) { const reset = Date.parse(res.headers.get('x-rate-limit-reset') || ''); e.retryAfter = reset > Date.now() ? Math.ceil((reset - Date.now()) / 1000) : 30; }
  return e;
}

async function lookup(q) {
  const k = cacheKey(q.name, q.window);
  const hit = cache.get(k);
  if (hit) { counts.cached++; return { ...hit.value, at: hit.at, cached: true }; }
  if (!pending.has(k)) {
    pending.set(k, upstream(q.name, q.window).then(r => {
      const value = r.data ? { data: r.data } : { error: r.error, retryAfter: r.retryAfter };
      const e = r.ttl ? cache.set(k, value, r.ttl) : { value, at: Date.now() };
      return { ...e.value, at: e.at, cached: false };
    }).finally(() => pending.delete(k)));
  }
  return pending.get(k);
}

const STATUS = { bad_name: 400, bad_param: 400, not_found: 404, no_matches: 404, private: 403, rate_ip: 429, busy: 503, upstream: 502 };
function send(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': Buffer.byteLength(body), ...extra });
  res.end(body);
}

const server = createServer(async (req, res) => {
  let u;
  try { u = new URL(req.url, 'http://x'); } catch { return send(res, 400, { ok: false, error: 'bad_param' }); }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { ok: false, error: 'method' }, { Allow: 'GET' });
  if (u.pathname === '/api/fn/health') {
    return send(res, KEY ? 200 : 500, { ok: !!KEY, key: !!KEY, uptimeMin: Math.round((Date.now() - started) / 60e3), upstream: { lastOk: alarm.lastOk, lastError: alarm.lastError, failsInRow: alarm.fails }, cache: cache.size, counts });
  }
  if (u.pathname !== '/api/fn/stats') return send(res, 404, { ok: false, error: 'not_here' });
  counts.requests++;
  const lim = perIp.take(clientIp(req.headers, req.socket.remoteAddress));
  if (!lim.ok) { counts.limited++; return send(res, 429, { ok: false, error: 'rate_ip', retryAfter: lim.retryAfter }, { 'Retry-After': String(lim.retryAfter) }); }
  const q = parseQuery(u.searchParams);
  if (q.error) return send(res, q.status, { ok: false, error: q.error });
  if (!KEY) return send(res, 502, { ok: false, error: 'upstream' });
  const r = await lookup(q).catch(() => ({ error: 'upstream', at: Date.now() }));
  if (r.error) return send(res, STATUS[r.error] || 502, { ok: false, error: r.error, ...(r.retryAfter ? { retryAfter: r.retryAfter } : {}) }, r.retryAfter ? { 'Retry-After': String(r.retryAfter) } : {});
  const p = r.data.platforms[q.platform];
  send(res, 200, { ok: true, name: r.data.name, window: q.window, platform: q.platform, bp: r.data.bp, stats: p, has: Object.fromEntries(Object.entries(r.data.platforms).map(([k, v]) => [k, !!(v && v.overall)])), at: new Date(r.at).toISOString(), cached: r.cached });
});
server.headersTimeout = 10e3; server.requestTimeout = 15e3;
server.listen(PORT, () => log('fnapi listening on ' + PORT + (KEY ? '' : ' WITHOUT FORTNITE_API_KEY')));
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => server.close(() => process.exit(0)));
