// Shared pieces of the live-data runner (docs/FEEDS.md): a polite HTTP client with a disk cache, recorded fixtures for tests,
// atomic file writes, local dates. Node only. Each site has its own User-Agent (no "+https://": Akamai answers 403 to it).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

export const UAS = { jugadadeldia: 'JugadaDelDia/1.0 (jugadadeldia.com)', pingalto: 'Pingalto/1.0 (pingalto.com)' };
export const AR_TZ = 'America/Argentina/Buenos_Aires';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 16);

export function writeJsonAtomic(file, obj, pretty) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = file + '.tmp-' + process.pid;
  writeFileSync(tmp, JSON.stringify(obj, null, pretty ? 1 : 0) + '\n');
  renameSync(tmp, file);
}
export const readJson = f => JSON.parse(readFileSync(f, 'utf8'));
export const readFeed = f => { try { const d = readJson(f); return d && d.updated && d.data ? d : null; } catch { return null; } };

// Local date (YYYY-MM-DD) and time (HH:MM) in a time zone.
function parts(d, tz) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
}
export const zoneDate = (d, tz = AR_TZ) => { const p = parts(d, tz); return p.year + '-' + p.month + '-' + p.day; };
export const zoneTime = (d, tz = AR_TZ) => { const p = parts(d, tz); return p.hour + ':' + p.minute; };

// ctx for feed.fetch(): getText/getJson/getBytes(url, { ttlHours, headers, timeoutMs, method, body }); one request at a time, at least gapMs between
// requests, 3 tries with pauses (not for 4xx), responses cached in cacheDir (a cache entry younger than ttlHours is used without a
// request; headers are never cached or logged). fixtures: <dir>/index.json { url: file } replaces the network (tests).
export function makeCtx(o = {}) {
  const now = o.now ? new Date(o.now) : new Date();
  const gapMs = o.gapMs === undefined ? 1000 : o.gapMs;
  const UA = o.ua || 'feeds/1.0';
  const requests = [];
  let last = 0;
  const index = o.fixtures ? (existsSync(join(o.fixtures, 'index.json')) ? readJson(join(o.fixtures, 'index.json')) : {}) : null;
  // binary: the body comes back as a Buffer (cached as base64); method/body: a form POST (the cache and fixture key then include the
  // body: fixtures use "<url> <body>").
  async function request(url, opt = {}, binary = false) {
    const method = opt.method || 'GET', body = opt.body || null;
    const key = method === 'GET' ? url : url + ' ' + (body || '');
    const decode = c => binary ? Buffer.from(c, 'base64') : c;
    if (index) {
      if (!index[key]) { const e = new Error('fixture missing for ' + key); e.status = 404; throw e; }
      requests.push({ url, from: 'fixture' });
      const f = index[key];
      if (f && typeof f === 'object' && f.status) { const e = new Error('HTTP ' + f.status + ' ' + url); e.status = f.status; throw e; }
      const file = typeof f === 'object' ? f.file : f;
      const raw = readFileSync(join(o.fixtures, file));
      return { [binary ? 'buf' : 'text']: binary ? raw : raw.toString('utf8'), type: typeof f === 'object' && f.type || (file.endsWith('.pdf') ? 'application/pdf' : 'text/html'), fetched: index._fetched || now.toISOString() };
    }
    const cf = o.cacheDir ? join(o.cacheDir, sha(key) + '.json') : null;
    if (cf && opt.ttlHours && existsSync(cf)) {
      try {
        const c = readJson(cf);
        if (c.url === key && Date.now() - Date.parse(c.fetched) < opt.ttlHours * 3600e3) { requests.push({ url, from: 'cache' }); return { [binary ? 'buf' : 'text']: decode(c.body), type: c.type || '', fetched: c.fetched }; }
      } catch { /* a broken cache entry is fetched again */ }
    }
    let err;
    for (let attempt = 0; attempt < 3; attempt++) {
      const wait = last + gapMs - Date.now() + (attempt ? [0, 5000, 20000][attempt] : 0);
      if (wait > 0) await sleep(wait);
      last = Date.now();
      try {
        const headers = { 'User-Agent': UA, Accept: opt.accept || 'application/json', ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(opt.headers || {}) };
        const res = await fetch(url, { method, body, headers, signal: AbortSignal.timeout(opt.timeoutMs || 30000), redirect: 'follow' });
        if (res.status >= 400 && res.status < 500) { requests.push({ url, status: res.status }); const e = new Error('HTTP ' + res.status + ' ' + url); e.status = res.status; throw e; }
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
        const type = res.headers.get('content-type') || '';
        const out = binary ? Buffer.from(await res.arrayBuffer()) : await res.text(), fetched = new Date().toISOString();
        requests.push({ url, status: res.status, bytes: out.length });
        if (cf && opt.ttlHours) { mkdirSync(o.cacheDir, { recursive: true }); writeJsonAtomic(cf, { url: key, fetched, type, body: binary ? out.toString('base64') : out }); }
        return { [binary ? 'buf' : 'text']: out, type, fetched };
      } catch (e) { err = e; if (e.status >= 400 && e.status < 500) throw e; }
    }
    throw err;
  }
  return {
    now, requests,
    today: (tz = AR_TZ) => zoneDate(now, tz),
    getText: (url, opt = {}) => request(url, { accept: 'text/html,*/*', ...opt }),
    getBytes: (url, opt = {}) => request(url, { accept: '*/*', ...opt }, true),
    async getJson(url, opt = {}) {
      const r = await request(url, opt);
      try { return { json: JSON.parse(r.text), fetched: r.fetched }; } catch { throw new Error('not JSON: ' + url); }
    },
  };
}
