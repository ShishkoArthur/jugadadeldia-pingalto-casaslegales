// Telegram alert layer (tools/feeds/alerts.mjs, Russian templates in data/alerts/ru.json; owner 2026-11-05): header with the project
// domain and the feed or service, reason classes, parsing of the feeds' notices, de-duplication (12 h), recovery notes, the daily
// digest, the overflow message, the sender. Russian strings are read from the template file (no Cyrillic in code).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAlert, classify, problemsOf, planAlerts, composeTexts, loadTemplates, fill, DEDUP_MS, MAX_MSGS } from '../../tools/feeds/alerts.mjs';
import { sendAlerts } from '../../tools/feeds/run.mjs';
import { sendTelegram } from '../../tools/feeds/lib.mjs';
import { main as notify } from '../../tools/feeds/notify.mjs';
import { Alarm } from '../../tools/fnapi/core.mjs';

const T = loadTemplates();
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const NOW = new Date('2026-11-05T15:30:00Z');
const H = 3600e3;
const firstLine = s => s.split('\n')[0].replace(/<\/?b>/g, '');

test('alerts: the header names the project domain and the feed or service, with the severity emoji', () => {
  const r = renderAlert('feed_stale', { feed: 'provincias', age: 3.25, limit: 3, updated: '2026-11-05T11:00:00Z', raw: 'all provincial sources failed: Chaco timeout after 30 s' }, { site: 'jugadadeldia', scope: { feed: 'provincias' }, now: NOW });
  assert.equal(firstLine(r.text), fill(T.header.feed, { emoji: T.emoji.red, domain: 'jugadadeldia.com', feed: 'provincias' }));
  assert.ok(r.text.startsWith('<b>' + T.emoji.red + ' jugadadeldia.com'));
  for (const k of ['why', 'did', 'todo']) assert.ok(r.text.includes('<b>' + T.labels[k] + ':</b>'), k);
  assert.ok(r.text.includes(T.reasons.timeout.text), 'reason class timeout');
  assert.ok(r.text.includes('Chaco timeout after 30 s'), 'the original reason stays');
  assert.ok(r.text.includes(T.todoDefault));
  assert.ok(r.text.includes('05.11 08:00 ART'), 'kept data time in Argentina');
  assert.ok(r.text.endsWith(fill(T.time, { ar: '05.11 12:30', msk: '05.11 18:30' })), 'time in Argentina and Moscow');
  const s = renderAlert('fn_key', {}, { site: 'pingalto', scope: { service: 'fortnite-tracker' }, now: NOW });
  assert.equal(firstLine(s.text), fill(T.header.service, { emoji: T.emoji.red, domain: 'pingalto.com', service: 'fortnite-tracker' }));
  const ok = renderAlert('feed_ok', { feed: 'quiniela', durationMs: 5 * H }, { site: 'jugadadeldia', scope: { feed: 'quiniela' }, now: NOW });
  assert.ok(ok.text.startsWith('<b>' + T.emoji.green), 'recovery is green');
  assert.ok(ok.text.includes(fill(T.units.hours, { n: 5 })));
  const t = renderAlert('test', { from: 'feeds' }, { site: 'casaslegales', test: true, now: NOW });
  assert.ok(firstLine(t.text).startsWith(T.testPrefix + T.emoji.green + ' casaslegales.com'));
});

test('alerts: params are HTML-escaped, the text stays under the Telegram limit, no placeholder is left', () => {
  const r = renderAlert('notice', { feed: 'listas', raw: 'a <script> & b' + 'x'.repeat(5000) }, { site: 'casaslegales', scope: { feed: 'listas' }, now: NOW });
  assert.ok(r.text.includes('a &lt;script&gt; &amp; b'));
  assert.ok(!r.text.includes('<script>'));
  assert.ok(r.text.length <= 4000);
  const ids = Object.keys(T.templates).filter(k => typeof T.templates[k] === 'object');
  for (const id of ids) {
    const x = renderAlert(id, { feed: 'quiniela', raw: 'HTTP 500 https://x.example/', fails: 3, n: 2, items: 'a', intro: 'b' }, { site: 'pingalto', scope: { feed: 'quiniela' }, now: NOW });
    assert.ok(!/\{[a-zA-Z]+\}/.test(x.text), id + ' leaves a placeholder: ' + x.text);
    assert.ok(x.text.split('\n').length >= 3, id);
  }
  const g = renderAlert('no_such_template', { raw: 'boom' }, { site: 'pingalto', now: NOW });
  assert.ok(g.text.includes('no_such_template') && g.text.includes('boom'), 'unknown -> generic with the original reason');
});

test('alerts: every template id used in code exists in ru.json', () => {
  const code = ['tools/feeds/alerts.mjs', 'tools/fnapi/core.mjs', 'tools/fnapi-server.sh', 'tools/feeds/run.mjs'].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  const used = new Set([...code.matchAll(/(?:tpl[,:] |tpl = |'|send\(|fn_restarted)'?([a-z]+_[a-z_]+)'/g)].map(m => m[1]).filter(x => /^(feed|load|prov|robots|list|price|cited|expiry|fn|kept|reminder|digest|test|notice)_/.test(x)));
  used.add('fn_restarted');
  for (const id of used) assert.ok(T.templates[id] !== undefined, id);
  for (const c of ['robots', 'key', 'rate', 'forbidden', 'notfound', 'down', 'tls', 'timeout', 'network', 'format', 'unknown']) assert.ok(T.reasons[c] && T.reasons[c].text, c);
  assert.ok(!existsSync(join(ROOT, 'sites/jugadadeldia/data/alerts')), 'never inside a site folder');
});

test('alerts: reason classes', () => {
  const cases = { 'HTTP 401 https://api.pandascore.co/x': 'key', 'HTTP 429 https://a/': 'rate', 'HTTP 403 https://a/': 'forbidden', 'HTTP 404 https://a/': 'notfound',
    'HTTP 503 https://a/': 'down', 'unable to verify the first certificate': 'tls', 'timeout after 240 s': 'timeout', 'fetch failed': 'network',
    'not JSON: https://a/': 'format', 'robots.txt disallows ClaudeBot': 'robots', 'something odd': 'unknown' };
  for (const [s, c] of Object.entries(cases)) assert.equal(classify(s), c, s);
});

const health = (o = {}) => ({ feeds: { quiniela: { stale: false, ageHours: 0.2, maxAgeHours: 3, updated: '2026-11-05T15:00:00Z', lastError: null }, ...(o.feeds || {}) }, notices: o.notices || [], expiries: o.expiries || [], loadErrors: o.loadErrors || [] });
const stale = { stale: true, ageHours: 3.25, maxAgeHours: 3, updated: '2026-11-05T12:15:00Z', lastError: { at: '', message: 'HTTP 503 https://www.loteria.chaco.gov.ar/x' } };

test('alerts: notices of the feeds get their specific templates', () => {
  const notices = [
    { feed: 'provincias', id: 'prov-cha-2026-11-05T10:00:00.000Z', text: 'provincias: Chaco and Corrientes (Lotería Chaqueña) failing since 2026-11-05 10:00 UTC, 4 runs, no answer: timeout after 30 s. Kept last good draws: Chaco 2026-11-04 nocturna, Corrientes 2026-11-04 nocturna; the other provinces publish.' },
    { feed: 'listas', id: 'robots-hcdn', text: 'https://www.hcdn.gob.ar/x now keeps AI crawlers or us out (robots.txt disallows ClaudeBot): our server stops fetching it; the owner saves it from his browser (docs/reference/owner-saves/README.md), then mark it pendingOwnerCopy' },
    { feed: 'listas', id: 'changed-registry-caba-1234abcd', text: 'CABA agencias changed on the official page; the site keeps the last checked data. Added: nuevo.bet.ar. Removed: viejo.bet.ar. Fresh copy: state/docs/listas-pending on the server; fix the data by hand after reading the page (docs/MAINTENANCE.md).' },
    { feed: 'precios', id: 'held-quiniela-2026-12', text: 'price quiniela of 2026-12 held back (jump 300%); the last good one stays (500, until 2026-11-30)' },
    { feed: 'precios', id: 'changed-quiniela-2026-12', text: 'LOTBA quiniela 2026-12: cited values not found any more: 70 a 1, 600 a 1 (the site keeps the saved copy; check and update data/sources/lottery)' },
    { feed: 'plazos', id: 'reminder-2027-04-30', text: 'casaslegales reminder: the first input expires on 30.04.2027 (21 days).', params: { first: '2027-04-30', days: 21, owner: [{ name: 'santafe x.gob.ar', until: '2027-04-30' }], server: [], review: [], operators: [] } },
    { feed: 'listas', id: 'weird-1', text: 'something new' },
  ];
  const ps = problemsOf(health({ notices }));
  assert.deepEqual(ps.map(p => p.tpl), ['prov_down', 'robots_blocked', 'list_changed', 'price_held', 'cited_changed', 'reminder', 'notice']);
  assert.equal(ps[0].params.source, 'Chaco and Corrientes (Lotería Chaqueña)');
  assert.equal(ps[0].params.kind, 'net');
  assert.equal(ps[1].params.url, 'https://www.hcdn.gob.ar/x');
  assert.equal(ps[2].params.added, 'nuevo.bet.ar');
  assert.equal(ps[2].params.removed, 'viejo.bet.ar');
  assert.equal(ps[3].params.value, '500');
  assert.equal(ps[4].params.list, '70 a 1, 600 a 1');
  assert.equal(ps[5].ok, null, 'a reminder has no recovery note');
  const texts = ps.map(p => renderAlert(p.tpl, p.params, { site: 'casaslegales', scope: p.scope, now: NOW }).text);
  assert.ok(texts[0].includes('05.11 07:00 ART') && texts[0].includes(T.templates.prov_kind_net));
  assert.ok(texts[1].includes(T.reasons.robots.todo.slice(0, 20)) || texts[1].includes('owner-saves'));
  assert.ok(texts[5].includes('30.04.2027') && texts[5].includes('santafe x.gob.ar') && texts[5].includes(fill(T.templates.reminder_end)));
  assert.ok(texts[6].includes('something new'), 'unknown notice: the original text');
});

test('alerts: expiries and stale feeds become problems; soon -> expired is a new alert without a recovery note', () => {
  const ex = s => ({ id: 'lotba-programa', what: 'LOTBA draw programme', until: '2026-11-30', daysLeft: s === 'soon' ? 3 : -1, warnDays: 5, state: s, feed: 'programa' });
  let { messages, state } = planAlerts({ problems: {} }, problemsOf(health({ expiries: [ex('soon')] })), NOW);
  assert.deepEqual(messages.map(m => m.tpl), ['expiry_soon']);
  ({ messages, state } = planAlerts(state, problemsOf(health({ expiries: [ex('expired')] })), new Date(NOW.getTime() + 4 * 864e5)));
  assert.deepEqual(messages.map(m => m.tpl), ['expiry_lotba_programa']);
  ({ messages } = planAlerts(state, problemsOf(health()), new Date(NOW.getTime() + 5 * 864e5)));
  assert.deepEqual(messages.map(m => m.tpl), ['expiry_ok']);
  const load = problemsOf(health({ loadErrors: [{ file: 'agenda.mjs', error: 'SyntaxError' }], feeds: { agenda: stale } }));
  assert.deepEqual(load.map(p => p.tpl), ['load_error', 'feed_stale']);
});

test('alerts: de-duplication, recovery note, flap within 12 h, daily digest, first run seeds without a burst', () => {
  const at = h => new Date(NOW.getTime() + h * H);
  const bad = problemsOf(health({ feeds: { provincias: stale } })), good = problemsOf(health());
  let r = planAlerts({ problems: {} }, bad, at(0));
  assert.deepEqual(r.messages.map(m => m.kind + ':' + m.tpl), ['alert:feed_stale']);
  r = planAlerts(r.state, bad, at(1));
  assert.equal(r.messages.length, 0, 'the same problem is not sent again');
  r = planAlerts(r.state, good, at(2));
  assert.deepEqual(r.messages.map(m => m.kind + ':' + m.tpl), ['ok:feed_ok']);
  assert.ok(r.messages[0].params.durationMs === 2 * H);
  r = planAlerts(r.state, bad, at(3));
  assert.equal(r.messages.length, 0, 'flap within 12 h: silent');
  r = planAlerts(r.state, good, at(4));
  assert.equal(r.messages.length, 0, 'no recovery note for a silent flap');
  r = planAlerts(r.state, bad, at(0) && new Date(NOW.getTime() + DEDUP_MS + 1));
  assert.equal(r.messages.length, 1, 'after 12 h it is a new alert');
  let s = r.state;
  for (let h = 13; h <= 36; h++) { r = planAlerts(s, bad, at(h)); s = r.state; if (r.messages.length) break; }
  assert.equal(r.messages.length, 1);
  assert.equal(r.messages[0].kind, 'digest', 'daily digest while still broken');
  r = planAlerts(s, bad, at(40));
  assert.equal(r.messages.length, 0, 'one digest a day');
  const seeded = planAlerts(null, [...bad, ...problemsOf(health({ notices: [{ feed: 'plazos', id: 'reminder-2027-04-30', text: 'x expires on 30.04.2027 (21 days)' }] }))], at(0), { seed: true });
  assert.deepEqual(seeded.messages.map(m => m.kind), ['digest'], 'first run: one digest, no burst');
  assert.equal(seeded.messages[0].items.length, 1, 'reminders are not in the digest');
  const texts = composeTexts(seeded.messages, 'jugadadeldia', at(0));
  assert.equal(texts.length, 1);
  assert.equal(firstLine(texts[0]), fill(T.header.digest, { emoji: T.emoji.red, domain: 'jugadadeldia.com' }));
  assert.ok(texts[0].includes(fill(T.templates.digest_first)));
});

test('alerts: more than MAX_MSGS in one run -> the rest in one overflow message', () => {
  const notices = Array.from({ length: 12 }, (_, i) => ({ feed: 'listas', id: 'n' + i, text: 'problem ' + i }));
  const { messages } = planAlerts({ problems: {} }, problemsOf(health({ notices })), NOW);
  assert.equal(messages.length, 12);
  const texts = composeTexts(messages, 'casaslegales', NOW);
  assert.equal(texts.length, MAX_MSGS);
  assert.ok(texts[MAX_MSGS - 1].includes('problem 11'));
});

test('alerts: sendAlerts keeps the state only when every message went out', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'alerts-')), f = join(dir, '_alerts.json');
  const h = health({ feeds: { provincias: stale } });
  await sendAlerts('jugadadeldia', health(), f, {}, NOW, async () => ({ ok: false, configured: false, log: 'x' }));
  assert.ok(existsSync(f), 'not configured: state kept (seeded)');
  const sent = [];
  const fail = async t => { sent.push(t); return { ok: false, configured: true, log: 'fail' }; };
  const r1 = await sendAlerts('jugadadeldia', h, f, {}, NOW, fail);
  assert.equal(r1.ok, false);
  const ok = async t => { sent.push(t); return { ok: true, configured: true, log: 'ok' }; };
  await sendAlerts('jugadadeldia', h, f, {}, NOW, ok);
  assert.equal(sent.length, 2, 'the failed message is tried again');
  await sendAlerts('jugadadeldia', h, f, {}, NOW, ok);
  assert.equal(sent.length, 2, 'then de-duplicated');
  assert.ok(JSON.parse(readFileSync(f, 'utf8')).problems['stale:provincias']);
});

test('alerts: sendTelegram posts HTML and never logs the token; notify --dry renders', async () => {
  const r0 = await sendTelegram('x', {});
  assert.equal(r0.configured, false);
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, o) => { calls.push({ url, body: JSON.parse(o.body) }); return calls.length === 1 ? new Response(JSON.stringify({ ok: false, error_code: 429, parameters: { retry_after: 1 } }), { status: 429 }) : new Response(JSON.stringify({ ok: true }), { status: 200 }); };
  try {
    const r = await sendTelegram('<b>hi</b>', { TG_BOT_TOKEN: 'SECRET123', TG_CHAT_ID: '42' }, { retryMs: 0 });
    assert.equal(r.ok, true);
    assert.equal(calls.length, 2, 'retried after 429');
    assert.equal(calls[1].body.parse_mode, 'HTML');
    assert.ok(!r.log.includes('SECRET123') && !r.log.includes('42 '));
    globalThis.fetch = async () => { throw new Error('connect to https://api.telegram.org/botSECRET123/sendMessage failed'); };
    const e = await sendTelegram('x', { TG_BOT_TOKEN: 'SECRET123', TG_CHAT_ID: '42' }, { retryMs: 0 });
    assert.equal(e.ok, false);
    assert.ok(!e.log.includes('SECRET123'), e.log);
  } finally { globalThis.fetch = real; }
  const out = [], log = console.log;
  console.log = s => out.push(s);
  try { assert.equal(await notify(['pingalto', 'fn_restarted', '--service', 'fortnite-tracker', 'state=exited', '--dry'], {}), 0); } finally { console.log = log; }
  assert.ok(out[0].includes('pingalto.com') && out[0].includes('exited'));
});

test('fn tracker alarm: template ids, at once for a bad key, once per period, recovery note', () => {
  let t = 0;
  const sent = [];
  const a = new Alarm({ after: 3, everyMs: 1000, send: (id, p) => sent.push([id, p]), now: () => t });
  a.fail('x'); a.fail('x'); a.fail('HTTP 429');
  assert.deepEqual(sent.map(s => s[0]), ['fn_failing']);
  assert.equal(sent[0][1].fails, 3);
  a.fail('x');
  assert.equal(sent.length, 1);
  a.ok();
  assert.deepEqual(sent.map(s => s[0]), ['fn_failing', 'fn_ok']);
  t = 5000;
  a.fail('HTTP 401', { key: true });
  assert.equal(sent[2][0], 'fn_key');
  assert.equal(new Alarm({ send() {} }).everyMs, 12 * H, 'default: at most once per 12 h');
  for (const [id, p] of sent) assert.ok(!/\{[a-zA-Z]+\}/.test(renderAlert(id, p, { site: 'pingalto', scope: { service: 'fortnite-tracker' } }).text));
  assert.ok(readdirSync(join(ROOT, 'data/alerts')).includes('ru.json'));
});
