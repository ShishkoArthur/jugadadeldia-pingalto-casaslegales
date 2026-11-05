// Pieces of the Fortnite stats proxy of pingalto.com (tools/fnapi/server.mjs) that the unit tests exercise: query checks, a sliding
// window limiter, a small TTL cache, the visitor's address behind Cloudflare and the meaning of an upstream answer.
import { FN, PLATFORMS, WINDOWS, cleanName } from '../../engine/games/fnstats.mjs';

export function parseQuery(sp) {
  const name = cleanName(sp.get('name') || '');
  if (!name) return { error: 'bad_name', status: 400 };
  const platform = sp.get('platform') || 'all', window = sp.get('window') || 'lifetime';
  if (!PLATFORMS.includes(platform) || !WINDOWS.includes(window)) return { error: 'bad_param', status: 400 };
  return { name, platform, window };
}

// at most `limit` hits per `windowMs` per key; old hits drop out; keys without hits are pruned so memory stays bounded
export class Limiter {
  constructor(limit, windowMs, now = () => Date.now()) { this.limit = limit; this.windowMs = windowMs; this.now = now; this.hits = new Map(); this.ops = 0; }
  take(key) {
    const t = this.now(), from = t - this.windowMs;
    const list = (this.hits.get(key) || []).filter(x => x > from);
    if (++this.ops % 500 === 0) this.prune(from);
    if (list.length >= this.limit) { this.hits.set(key, list); return { ok: false, retryAfter: Math.max(1, Math.ceil((list[0] + this.windowMs - t) / 1000)) }; }
    list.push(t); this.hits.set(key, list);
    return { ok: true, left: this.limit - list.length };
  }
  prune(from) { for (const [k, v] of this.hits) if (!v.length || v[v.length - 1] <= from) this.hits.delete(k); }
  get size() { return this.hits.size; }
}

export class TtlCache {
  constructor(max = 2000, now = () => Date.now()) { this.max = max; this.now = now; this.map = new Map(); }
  get(k) {
    const e = this.map.get(k);
    if (!e) return null;
    if (e.until <= this.now()) { this.map.delete(k); return null; }
    return e;
  }
  set(k, value, ttlMs) {
    this.map.delete(k);
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    const e = { value, at: this.now(), until: this.now() + ttlMs };
    this.map.set(k, e);
    return e;
  }
  get size() { return this.map.size; }
}

export const cacheKey = (name, window) => name.toLowerCase() + '|' + window;

// Cloudflare edge ranges (cloudflare.com/ips-v4 and ips-v6). Caddy sets X-Forwarded-For to its direct peer; only when that peer is
// a Cloudflare edge do we take CF-Connecting-IP (a request straight to the origin cannot pick its own address).
const CF4 = ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'];
const CF6 = ['2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'];
const v4 = ip => ip.split('.').reduce((a, x) => a * 256 + Number(x), 0);
function in4(ip, cidr) { const [b, m] = cidr.split('/'); const size = 2 ** (32 - Number(m)); return Math.floor(v4(ip) / size) === Math.floor(v4(b) / size); }
function hex6(ip) {
  const [a, b = ''] = ip.toLowerCase().split('::');
  const l = a ? a.split(':') : [], r = b ? b.split(':') : [];
  const full = ip.includes('::') ? [...l, ...Array(8 - l.length - r.length).fill('0'), ...r] : l;
  return full.map(x => x.padStart(4, '0')).join('');
}
function in6(ip, cidr) {
  const [b, m] = cidr.split('/'), h = hex6(ip);
  if (h.length !== 32 || !/^[0-9a-f]+$/.test(h)) return false;
  const shift = BigInt(128 - Number(m));
  return BigInt('0x' + h) >> shift === BigInt('0x' + hex6(b)) >> shift;
}
const IP4 = /^\d{1,3}(\.\d{1,3}){3}$/, IP6 = /^[0-9a-f:]+$/i;
export function isCloudflare(ip) {
  if (IP4.test(ip)) return CF4.some(c => in4(ip, c));
  if (IP6.test(ip) && ip.includes(':')) return CF6.some(c => in6(ip, c));
  return false;
}
export function clientIp(headers, remote) {
  const xff = String(headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  const peer = (xff[xff.length - 1] || remote || '').replace(/^::ffff:/, '');
  const cf = String(headers['cf-connecting-ip'] || '').trim();
  if (cf && isCloudflare(peer) && (IP4.test(cf) || IP6.test(cf))) return cf;
  return peer || 'unknown';
}

// upstream status/body -> our error code and how long that answer may be cached (ms; 0 = not cached)
export function upstreamError(status, body) {
  const msg = String(body && body.error || '').toLowerCase();
  if (status === 404 && /didn.?t play|no match/.test(msg)) return { error: 'no_matches', ttl: FN.cacheMin * 60e3 };
  if (status === 404) return { error: 'not_found', ttl: FN.cacheMin * 60e3 };
  if (status === 403) return { error: 'private', ttl: 2 * 60e3 };
  if (status === 429) return { error: 'busy', ttl: 0, upstream: true };
  if (status === 401) return { error: 'upstream', ttl: 0, upstream: true, key: true };
  if (status === 400) return { error: 'not_found', ttl: 60e3 };
  return { error: 'upstream', ttl: 0, upstream: true };
}

// alerts after `after` upstream failures in a row (a bad key at once), then at most once per `everyMs`; one note when it recovers
export class Alarm {
  // send(templateId, params): Russian templates of data/alerts/ru.json (fn_key, fn_failing, fn_ok), rendered by tools/fnapi/server.mjs.
  // The same problem at most once per everyMs (12 h, docs/TELEGRAM-BOT.md).
  constructor({ after = 5, everyMs = 12 * 3600e3, send, now = () => Date.now() }) { Object.assign(this, { after, everyMs, send, now }); this.fails = 0; this.last = -Infinity; this.raised = false; this.lastError = null; this.lastOk = null; }
  ok() {
    this.lastOk = new Date(this.now()).toISOString();
    if (this.raised) { this.raised = false; this.send('fn_ok', { fails: this.fails }); }
    this.fails = 0;
  }
  fail(what, { key = false } = {}) {
    this.fails++;
    this.lastError = { at: new Date(this.now()).toISOString(), what: String(what).slice(0, 120) };
    if ((key || this.fails >= this.after) && this.now() - this.last >= this.everyMs) {
      this.last = this.now(); this.raised = true;
      if (key) this.send('fn_key', { raw: this.lastError.what }); else this.send('fn_failing', { fails: this.fails, raw: this.lastError.what });
    }
  }
}
