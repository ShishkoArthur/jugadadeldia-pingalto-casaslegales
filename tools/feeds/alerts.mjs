// Telegram alert layer of the three sites (owner 2026-11-05; guide for other projects: docs/TELEGRAM-BOT.md). The texts are Russian and
// live in data/alerts/ru.json (no Cyrillic in code): code names a template id and its params, render() fills it.
// Every message: a header "<severity emoji> <domain> . <feed or service>", what happened, why (reason class + source + the short technical
// reason), what the system did, what the owner should do, the time in Argentina and in Moscow. HTML parse mode (params are escaped).
//   problemsOf(health, site)              _health.json of a feeds run -> [{ key, group, tpl, ok, params, scope }]
//   planAlerts(state, problems, now, o)   de-duplication: a new problem is sent once, the same problem again at most once per DEDUP_MS
//                                         (a flap within it is silent), a recovery note when it clears (only if its alert went out),
//                                         a daily digest while anything stays open longer than DIGEST_MS (not reminders and early
//                                         expiry warnings: digest false); -> { messages, state }
//   composeTexts(messages, site, now)     -> texts, at most MAX_MSGS per run (the rest in one overflow message)
//   renderAlert(tpl, params, ctx)         -> { text, sev, title }
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TEMPLATES_FILE = fileURLToPath(new URL('../../data/alerts/ru.json', import.meta.url));
export const DEDUP_MS = 12 * 3600e3, DIGEST_MS = 23.5 * 3600e3, PRUNE_MS = 7 * 864e5, MAX_MSGS = 8;
const AR = 'America/Argentina/Buenos_Aires', MSK = 'Europe/Moscow';

let cached = null;
export function loadTemplates(file = TEMPLATES_FILE) {
  if (file === TEMPLATES_FILE && cached) return cached;
  const t = JSON.parse(readFileSync(file, 'utf8'));
  if (file === TEMPLATES_FILE) cached = t;
  return t;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// a value already rendered (escaped HTML) goes in as is
const H = s => ({ __html: s });
export function fill(str, p = {}) {
  return String(str || '').replace(/\{([a-zA-Z]+)\}/g, (_, k) => {
    const v = p[k];
    if (v && typeof v === 'object' && '__html' in v) return v.__html;
    return v === undefined || v === null ? '' : esc(v);
  });
}

function parts(d, tz) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
}
export const fmtAt = (d, tz) => { const p = parts(d, tz); return p.day + '.' + p.month + ' ' + p.hour + ':' + p.minute; };
const fmtIso = s => { const d = new Date(s); return Number.isNaN(d.getTime()) ? String(s || '') : fmtAt(d, AR) + ' ART'; };
const fmtDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : String(s || '');
export function fmtDuration(ms, T) {
  const m = Math.max(0, Math.round(ms / 60e3));
  if (m < 90) return fill(T.units.min, { n: m });
  const h = Math.round(m / 60);
  return h < 48 ? fill(T.units.hours, { n: h }) : fill(T.units.days, { n: Math.round(h / 24) });
}

// Reason class of a technical error message (order matters: the first match wins).
const CLASSES = [
  ['robots', /robots/i],
  ['key', /HTTP 401\b|unauthori[sz]ed|invalid (api )?key|refuses the key/i],
  ['rate', /HTTP 429\b|rate.?limit|too many requests/i],
  ['forbidden', /HTTP 403\b|forbidden/i],
  ['notfound', /HTTP 40[4]\b|HTTP 410\b/],
  ['down', /HTTP 5\d\d\b/],
  ['tls', /certificate|CERT_|\bSSL\b|\bTLS\b|self.signed|UNABLE_TO_(GET|VERIFY)/i],
  ['timeout', /timeout|timed out|ETIMEDOUT|aborted|TimeoutError/i],
  ['network', /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH|socket|network/i],
  ['format', /not JSON|parse|unknown shape|expected|validat|format|missing|not found|no .+ (yet|found)|changed|bad /i],
];
export function classify(raw) {
  const s = String(raw || '');
  for (const [c, re] of CLASSES) if (re.test(s)) return c;
  return 'unknown';
}
const hostOf = s => { const m = /https?:\/\/([^/\s:?#]+)/.exec(String(s || '')); return m ? m[1].replace(/^www\./, '') : ''; };

// why line from a technical message: "<reason class>. Source: <host>. Technically: <raw>"
function why(T, raw, source) {
  const c = classify(raw), r = T.reasons[c] || T.reasons.unknown;
  const src = source || hostOf(raw);
  return { cls: c, html: [esc(r.text) + '.', src ? esc(T.labels.source) + ': ' + esc(src) + '.' : '', raw ? esc(T.labels.raw) + ': ' + esc(String(raw).slice(0, 220)) : ''].filter(Boolean).join(' '), todo: r.todo || null };
}

function list(T, xs, n = 12) {
  const items = (xs || []).slice(0, n).map(x => typeof x === 'string' ? fill('{x}', { x }) : fill(T.templates.item_until, { name: x.name, until: fmtDay(x.until) }));
  return items.join('; ') + ((xs || []).length > n ? '; ' + fill(T.templates.more, { n: xs.length - n }) : '');
}

// derived params per template (formatting and the parts built from other templates)
const PREP = {
  feed_stale(p, T) {
    const w = why(T, p.raw);
    return { age: p.age === null || p.age === undefined ? T.units.never : fill(T.units.hours, { n: p.age }), reason: H(w.html), todo: H(fill(w.todo || T.todoDefault)),
      kept: H(p.updated ? fill(T.templates.kept_last, { updated: fmtIso(p.updated) }) : fill(T.templates.kept_none)) };
  },
  feed_ok: (p, T) => ({ duration: fmtDuration(p.durationMs || 0, T) }),
  load_error: (p, T) => ({ raw: H(why(T, p.raw).html) }),
  prov_down: (p, T) => ({ since: p.since ? fmtIso(p.since.replace(' ', 'T') + ':00Z') : '', kind: H(fill(T.templates[p.kind === 'format' ? 'prov_kind_format' : 'prov_kind_net']) + '. ' + why(T, p.raw).html) }),
  list_changed: (p, T) => ({ diff: H([p.added ? fill(T.templates.list_added, { x: p.added }) : '', p.removed ? fill(T.templates.list_removed, { x: p.removed }) : '', p.other ? fill(T.templates.list_other, { x: p.other }) : ''].filter(Boolean).join(' ')) }),
  price_held: (p, T) => ({ last: H(p.value ? fill(T.templates.price_last, { value: p.value, until: fmtDay(p.until) }) : '') }),
  reminder(p, T) {
    const g = k => Array.isArray(p[k]) && p[k].length ? fill(T.templates['reminder_' + k], { x: H(list(T, p[k], k === 'review' ? 30 : 12)) }) : '';
    const steps = ['owner', 'server', 'review', 'operators'].map(g).filter(Boolean);
    return { first: fmtDay(p.first), steps: H(steps.length ? steps.join('\n') + '\n' + fill(T.templates.reminder_end) : fill(T.templates.reminder_end) + (p.raw ? '\n' + esc(p.raw) : '')) };
  },
  expiry_soon: p => ({ until: fmtDay(p.until) }),
  expiry_expired: p => ({ until: fmtDay(p.until) }),
  expiry_lotba_programa: p => ({ until: fmtDay(p.until) }),
  expiry_lotba_precios: p => ({ until: fmtDay(p.until) }),
  fn_failing(p, T) { const w = why(T, p.raw, 'fortnite-api.com'); return { reason: H(w.html), todo: H(fill(w.todo || T.todoDefault)) }; },
  notice: p => ({ raw: String(p.raw || '').slice(0, 600) }),
  generic: p => ({ raw: String(p.raw || '').slice(0, 600) }),
  test: (p, T) => ({ from: T.templates[p.from === 'fnapi' ? 'test_from_fnapi' : 'test_from_feeds'] }),
};

// ctx: { site, scope: { feed } | { service } | null, now, test, T }
export function renderAlert(tpl, params = {}, ctx = {}) {
  const T = ctx.T || loadTemplates();
  const id = T.templates[tpl] && typeof T.templates[tpl] === 'object' ? tpl : 'generic';
  const t = T.templates[id];
  const domain = T.sites[ctx.site] || ctx.site || '';
  const feedName = params.feed && T.feedNames[params.feed] ? ' (' + T.feedNames[params.feed] + ')' : '';
  const p = { domain, feedName, todoDefault: H(fill(T.todoDefault)), ...params };
  if (id === 'generic' && tpl !== 'generic') p.raw = tpl + ': ' + (params.raw || JSON.stringify(params).slice(0, 300));
  Object.assign(p, (PREP[id] || (() => ({})))(p, T));
  const sev = ctx.sev || t.sev || 'yellow';
  const scope = ctx.scope || {};
  const hp = { emoji: T.emoji[sev] || '', domain, feed: scope.feed, service: scope.service };
  const header = (ctx.test ? T.testPrefix : '') + fill(T.header[ctx.digest ? 'digest' : scope.feed ? 'feed' : scope.service ? 'service' : 'site'], hp);
  const now = ctx.now || new Date();
  const what = fill(t.what, p);
  const lines = ['<b>' + header + '</b>', what];
  if (t.list) lines.push(fill(t.list, p));
  for (const k of ['why', 'did', 'todo']) { const v = t[k] ? fill(t[k], p) : ''; if (v.trim()) lines.push('<b>' + esc(T.labels[k]) + ':</b> ' + v); }
  lines.push(fill(T.time, { ar: fmtAt(now, AR), msk: fmtAt(now, MSK) }));
  let text = lines.join('\n');
  if (text.length > 4000) text = text.slice(0, 3990).replace(/<[^>]*$/, '').replace(/&[a-z]*$/, '') + ' …';
  return { text, sev, title: unesc(what).slice(0, 160) };
}

// ---- problems from a health report ----------------------------------------------------------------------------------------------

const RE = {
  prov: /^provincias: (.+?) failing since (\d{4}-\d\d-\d\d \d\d:\d\d) UTC, (\d+) runs, (page changed \(parser or address\)|no answer): ([\s\S]*?)\. Kept last good draws: ([\s\S]*); the other provinces publish\.$/,
  robots: /^(\S+) now keeps AI crawlers or us out \(([\s\S]*?)\): our server stops/,
  held: /^price (\S+) of (\S+) held back \(([\s\S]*)\); the last good one stays(?: \(([^,]*), until (\S+)\))?$/,
  cited: /^LOTBA (\S+) (\S+): cited values not found any more: ([\s\S]*?) \(the site keeps/,
  reminder: /expires on (\d\d)\.(\d\d)\.(\d{4}) \((\d+) days\)/,
};
function noticeProblem(x) {
  const id = x.id, text = x.text || '', base = { key: 'notice:' + id, group: 'notice:' + id, scope: { feed: x.feed } };
  let m;
  if (id.startsWith('prov-') && (m = RE.prov.exec(text))) return { ...base, tpl: 'prov_down', ok: 'prov_ok', params: { source: m[1], since: m[2], runs: Number(m[3]), kind: m[4].startsWith('page') ? 'format' : 'net', raw: m[5], last: m[6] } };
  if (id.startsWith('robots-') && (m = RE.robots.exec(text))) return { ...base, tpl: 'robots_blocked', ok: 'robots_ok', params: { url: m[1], raw: m[2] } };
  if (x.feed === 'listas' && id.startsWith('changed-') && text.includes(' changed on the official page;')) {
    const g = re => { const r = re.exec(text); return r ? r[1] : ''; };
    return { ...base, tpl: 'list_changed', ok: 'list_ok', params: { label: text.split(' changed on the official page;')[0], added: g(/Added: ([\s\S]*?)\. (?:Removed:|Other:|Fresh copy:)/), removed: g(/Removed: ([\s\S]*?)\. (?:Other:|Fresh copy:)/), other: g(/Other: ([\s\S]*?)\. Fresh copy:/).slice(0, 300) } };
  }
  if (id.startsWith('held-') && (m = RE.held.exec(text))) return { ...base, tpl: 'price_held', ok: 'price_ok', params: { price: m[1], ym: m[2], raw: m[3], value: m[4] || '', until: m[5] || '' } };
  if (x.feed === 'precios' && id.startsWith('changed-') && (m = RE.cited.exec(text))) return { ...base, tpl: 'cited_changed', ok: 'cited_ok', params: { doc: m[1], ym: m[2], list: m[3] } };
  if (id.startsWith('reminder-')) {
    const p = x.params && typeof x.params === 'object' ? x.params : null;
    if (p && p.first) return { ...base, tpl: 'reminder', ok: null, digest: false, params: { first: p.first, days: p.days, owner: p.owner, server: p.server, review: p.review, operators: p.operators } };
    if ((m = RE.reminder.exec(text))) return { ...base, tpl: 'reminder', ok: null, digest: false, params: { first: m[3] + '-' + m[2] + '-' + m[1], days: Number(m[4]), raw: text.split('\n').slice(1).join('\n').slice(0, 1500) } };
  }
  return { ...base, tpl: 'notice', ok: 'notice_ok', params: { feed: x.feed, raw: text } };
}

export function problemsOf(health) {
  const out = [];
  if (!health) return out;
  for (const e of health.loadErrors || []) out.push({ key: 'load:' + e.file, group: 'load:' + e.file, tpl: 'load_error', ok: 'load_ok', scope: { feed: String(e.file).replace(/\.mjs$/, '') }, params: { file: e.file, raw: String(e.error || '').slice(0, 300) } });
  for (const [n, f] of Object.entries(health.feeds || {})) {
    if (!f.stale) continue;
    out.push({ key: 'stale:' + n, group: 'stale:' + n, tpl: 'feed_stale', ok: 'feed_ok', scope: { feed: n }, params: { feed: n, age: f.ageHours, limit: f.maxAgeHours, updated: f.updated, raw: f.lastError ? String(f.lastError.message).slice(0, 300) : '' } });
  }
  for (const x of health.notices || []) out.push(noticeProblem(x));
  for (const x of health.expiries || []) {
    if (x.state !== 'soon' && x.state !== 'expired') continue;
    const tpl = x.state === 'soon' ? 'expiry_soon' : x.id === 'lotba-programa' ? 'expiry_lotba_programa' : x.id === 'lotba-precios' ? 'expiry_lotba_precios' : 'expiry_expired';
    out.push({ key: 'expiry:' + x.id + ':' + x.state, group: 'expiry:' + x.id, tpl, ok: 'expiry_ok', digest: x.state !== 'soon', scope: { feed: x.feed }, params: { id: x.id, until: x.until, days: x.daysLeft, raw: x.what } });
  }
  return out;
}

// ---- de-duplication -------------------------------------------------------------------------------------------------------------

// state: { v: 1, problems: { key: { tpl, ok, params, scope, group, since, lastSent, notified, closedAt? } }, lastDigest }
// o.seed: no state yet (first run of this layer): the open problems were alerted before, they are stored without a message and one
// digest lists them.
export function planAlerts(state, problems, now = new Date(), o = {}) {
  const t = now.getTime(), iso = now.toISOString();
  const st = { v: 1, problems: { ...((state && state.problems) || {}) }, lastDigest: (state && state.lastDigest) || null };
  const messages = [], cur = new Set(problems.map(p => p.key)), groups = new Set(problems.map(p => p.group || p.key));
  for (const p of problems) {
    const e = st.problems[p.key];
    const base = { tpl: p.tpl, ok: p.ok || null, params: p.params, scope: p.scope || null, group: p.group || p.key, digest: p.digest !== false };
    if (e && !e.closedAt) { st.problems[p.key] = { ...e, ...base }; continue; }
    if (o.seed) { st.problems[p.key] = { ...base, since: iso, lastSent: iso, notified: true }; continue; }
    if (e && e.closedAt && t - Date.parse(e.lastSent) < DEDUP_MS) { st.problems[p.key] = { ...base, since: e.since, lastSent: e.lastSent, notified: false }; continue; }
    st.problems[p.key] = { ...base, since: iso, lastSent: iso, notified: true };
    messages.push({ kind: 'alert', key: p.key, tpl: p.tpl, params: p.params, scope: base.scope });
  }
  for (const [k, e] of Object.entries(st.problems)) {
    if (e.closedAt || cur.has(k)) continue;
    st.problems[k] = { ...e, closedAt: iso, notified: false };
    if (e.notified && e.ok && !groups.has(e.group)) messages.push({ kind: 'ok', key: k, tpl: e.ok, params: { ...e.params, durationMs: t - Date.parse(e.since) }, scope: e.scope });
  }
  for (const [k, e] of Object.entries(st.problems)) if (e.closedAt && t - Date.parse(e.closedAt) > PRUNE_MS) delete st.problems[k];
  const open = Object.values(st.problems).filter(e => !e.closedAt && e.digest !== false);
  const due = o.seed || (open.some(e => t - Date.parse(e.since) >= DIGEST_MS) && (!st.lastDigest || t - Date.parse(st.lastDigest) >= DIGEST_MS));
  if (open.length && due) {
    messages.push({ kind: 'digest', first: !!o.seed, items: open.map(e => ({ tpl: e.tpl, params: e.params, scope: e.scope, since: e.since })) });
    st.lastDigest = iso;
  }
  return { messages, state: st };
}

export function composeTexts(messages, site, now = new Date(), T = loadTemplates()) {
  const one = m => {
    if (m.kind !== 'digest') return renderAlert(m.tpl, m.params, { site, scope: m.scope, now, T });
    // first digest: the start of a problem is unknown (it was alerted before this layer), so no "since"
    const items = m.items.map(i => fill(T.templates[m.first ? 'digest_item_plain' : 'digest_item'], { title: renderAlert(i.tpl, i.params, { site, scope: i.scope, now, T }).title, since: fmtIso(i.since) }));
    return renderAlert('digest', { intro: H(fill(T.templates[m.first ? 'digest_first' : 'digest_daily'])), n: m.items.length, items: H(items.join('\n')) }, { site, now, T, digest: true, sev: 'red' });
  };
  const all = messages.map(one);
  if (all.length <= MAX_MSGS) return all.map(r => r.text);
  const rest = all.slice(MAX_MSGS - 1);
  const items = rest.map(r => fill(T.templates.digest_item, { title: r.title, since: fmtAt(now, AR) + ' ART' }));
  return [...all.slice(0, MAX_MSGS - 1).map(r => r.text), renderAlert('overflow', { n: rest.length, items: H(items.join('\n')) }, { site, now, T }).text];
}
