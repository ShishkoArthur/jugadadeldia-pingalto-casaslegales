// Monthly server recheck of the operator addresses casaslegales.com could not open (data/sources/operators/access.json: the kind
// of each failure as the operator page states it, and listed addresses whose name did not resolve, "dead"). Typed by hand on
// 2026-11-03/04; this feed keeps them honest. Per host, in order, and never past robots.txt:
//   DNS (lookup) -> TLS (handshake on 443, certificate checked) -> robots.txt (our agent and every AI crawler, robots-txt.mjs)
//   -> HTTP HEAD of "/" only when robots.txt lets everyone in.
// The finding (observed: dns | tls | robots | blocked | open | error) is compared with what the page says (EXPECT). A host that
// no longer behaves as written is checked again after RETRY_DAYS; only a second finding confirms it, raises one alert and stays a
// problem until access.json is updated. Transient failures (timeouts, EAI_AGAIN) are "error": never a change.
// listas.json-like output: data.hosts[host] = { kind, expect, observed, same, checked, lastSame, since?, confirmed?, detail };
// the site adds "revisado de nuevo el ..." next to the dates of these addresses (client ui.js, data-ac attributes).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { connect } from 'node:tls';
import { createHash } from 'node:crypto';
import { robotsVerdict } from './robots-txt.mjs';

export const MONTH_DAYS = 28, RETRY_DAYS = 3;
export const ACCESS_FILE = fileURLToPath(new URL('../../../data/sources/operators/access.json', import.meta.url));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
// a reset or refused connection during the TLS handshake is how a broken TLS server fails, so it counts as "tls"; only waiting is transient
const TRANSIENT = /^(EAI_AGAIN|ETIMEDOUT|ESOCKETTIMEDOUT|timeout)$/;
// what each kind of the page allows the server to find (botcheck: robots.txt kept AI agents out, and a bot check behind it)
export const EXPECT = { dns: ['dns'], tls: ['tls'], robots: ['robots'], botcheck: ['robots', 'blocked'], geo: ['blocked', 'open'] };

// every host to check: { host, kind, date, slug | null }
export function hostsOf(access) {
  const out = new Map();
  for (const [slug, a] of Object.entries(access.operators || {})) for (const host of a.hosts || []) out.set(host, { host, kind: a.kind, date: a.date, slug });
  for (const [host, date] of Object.entries(access.dead || {})) if (!out.has(host)) out.set(host, { host, kind: 'dns', date, slug: null });
  return [...out.values()].sort((a, b) => a.host < b.host ? -1 : 1);
}
export const specOf = list => createHash('sha256').update(JSON.stringify(list.map(x => [x.host, x.kind]))).digest('hex').slice(0, 16);

// raw probe -> observed state
export function observe(p) {
  if (p.dns !== 'ok') return TRANSIENT.test(p.dns) ? 'error' : 'dns';
  if (p.tls !== 'ok') return TRANSIENT.test(p.tls) ? 'error' : 'tls';
  if (p.robots === 'closed') return 'robots';
  if (p.robots === 'error') return 'error';
  if (typeof p.http === 'number') return p.http >= 200 && p.http < 400 ? 'open' : [401, 403, 429, 451, 503].includes(p.http) ? 'blocked' : 'error';
  return 'error';
}

const errCode = e => String((e && (e.code || (e.name === 'TimeoutError' ? 'timeout' : e.message))) || 'error').slice(0, 60);
// the network side (tests pass their own): { dns, tls, robots, http }
export const NET = {
  async dns(host) { try { await lookup(host); return 'ok'; } catch (e) { return errCode(e); } },
  tls(host, timeoutMs = 15000) {
    return new Promise(res => {
      let done = false;
      const end = v => { if (done) return; done = true; try { s.destroy(); } catch { /* closed */ } res(v); };
      const s = connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs }, () => end(s.authorized ? 'ok' : String(s.authorizationError || 'CERT_UNKNOWN')));
      s.on('timeout', () => end('timeout'));
      s.on('error', e => end(errCode(e)));
    });
  },
};
// a list may link the www. name of the host it names (arbet.bet.ar -> www.arbet.bet.ar): a name that does not resolve is tried with
// www. too, and the rest of the checks run on the name that answers (p.name)
export async function probeHost(ctx, name, net = NET) {
  let host = name;
  const p = { dns: await net.dns(host), tls: null, robots: null, http: null };
  if (p.dns !== 'ok' && !host.startsWith('www.') && (await net.dns('www.' + host)) === 'ok') { host = 'www.' + host; p.dns = 'ok'; p.name = host; }
  if (p.dns !== 'ok') return p;
  p.tls = await net.tls(host);
  if (p.tls !== 'ok') return p;
  try { const v = robotsVerdict((await ctx.getText('https://' + host + '/robots.txt', { ttlHours: 20, timeoutMs: 20000 })).text, '/'); p.robots = v.ok ? 'open' : 'closed'; }
  catch (e) { p.robots = e.status >= 400 && e.status < 500 ? 'none' : 'error'; }
  if (p.robots === 'closed' || p.robots === 'error') return p;
  try { await ctx.getText('https://' + host + '/', { method: 'HEAD', timeoutMs: 20000 }); p.http = 200; }
  catch (e) { p.http = e.status || Number((/^HTTP (\d{3})\b/.exec(String(e && e.message)) || [])[1]) || errCode(e); }
  return p;
}

export function dueOf(prev, today, spec, force) {
  if (force) return { reason: 'forced', only: null };
  if (!prev || !DAY.test(prev.checkedOn || '')) return { reason: 'first check', only: null };
  if (prev.spec !== spec) return { reason: 'synced data changed', only: null };
  if (days(prev.checkedOn, today) >= MONTH_DAYS) return { reason: 'monthly', only: null };
  const again = Object.entries(prev.hosts || {}).filter(([, h]) => !h.same && !h.confirmed && h.observed !== 'error' && days(h.checked, today) >= RETRY_DAYS).map(([k]) => k);
  return again.length ? { reason: 'retry', only: new Set(again) } : null;
}

// raw: { today, list, probes: { host: probe }, only } -> { hosts, alerts }
export function judgeAccess(raw, prev) {
  const P = (prev && prev.hosts) || {}, hosts = {}, alerts = [];
  for (const x of raw.list) {
    const p = P[x.host] && P[x.host].kind === x.kind ? P[x.host] : null, probe = raw.probes[x.host];
    if (!probe) { if (p) hosts[x.host] = p; else hosts[x.host] = { kind: x.kind, slug: x.slug, written: x.date, observed: null, same: true, checked: null, lastSame: null }; continue; }
    const observed = observe(probe), expect = EXPECT[x.kind] || [x.kind];
    const same = observed === 'error' || expect.includes(observed);
    const h = { kind: x.kind, slug: x.slug, written: x.date, observed, same, checked: raw.today, lastSame: same && observed !== 'error' ? raw.today : p ? p.lastSame : null, detail: probe };
    if (!same) {
      const before = p && !p.same && p.observed === observed;
      h.since = before ? p.since : raw.today;
      h.confirmed = !!(before && days(p.since, raw.today) >= RETRY_DAYS) || !!(p && p.confirmed && p.observed === observed);
      if (h.confirmed) alerts.push({ id: 'access-' + x.host + '-' + observed, host: x.host, text: 'operator address ' + x.host + ' no longer behaves as its page says (' + x.kind + ', written ' + x.date + '): the server finds ' + observed + ' since ' + h.since + ' (dns ' + probe.dns + ', tls ' + (probe.tls || '-') + ', robots ' + (probe.robots || '-') + ', http ' + (probe.http || '-') + '). Check it by hand, then update data/sources/operators/access.json' + (observed === 'open' ? ' and capture the public pages (node tools/capture-shots.mjs)' : '') + ' (docs/FEEDS.md).' });
    }
    hosts[x.host] = h;
  }
  return { hosts, alerts };
}

export default {
  name: 'accesos',
  cadence: 'run',
  maxAgeHours: 72,
  timeoutSec: 300,
  async fetch(ctx) {
    const access = JSON.parse(readFileSync(ACCESS_FILE, 'utf8')), list = hostsOf(access), spec = specOf(list), today = ctx.today();
    const prev = ctx.prev && ctx.prev.data, due = dueOf(prev, today, spec, ctx.force);
    const raw = { today, list, spec, due, probes: {}, fetched: new Date().toISOString(), source: { url: null } };
    if (!due) return raw;
    for (const x of list) if (!due.only || due.only.has(x.host)) raw.probes[x.host] = await probeHost(ctx, x.host, ctx.net || NET);
    return raw;
  },
  validate(raw) {
    if (!raw.list.length) throw new Error('accesos: no hosts in access.json');
    if (raw.due && Object.values(raw.probes).length && Object.values(raw.probes).every(p => TRANSIENT.test(p.dns || ''))) throw new Error('accesos: no DNS answer for any host (' + Object.values(raw.probes)[0].dns + ')');
  },
  compute(raw, prev) {
    if (!raw.due && prev) return prev;
    const j = judgeAccess(raw, prev);
    return { checkedOn: raw.due && raw.due.only ? prev.checkedOn : raw.today, lastRun: raw.today, reason: raw.due ? raw.due.reason : 'none', spec: raw.spec, hosts: j.hosts, alerts: j.alerts };
  },
};
