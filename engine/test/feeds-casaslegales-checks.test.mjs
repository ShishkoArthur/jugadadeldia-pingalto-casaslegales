// casaslegales server checks added after the freshness audit of 2026-11-19 (docs/FEEDS.md, casaslegales): what the site shows when
// a list changed or could not be checked (hit / list flags of listas.json), the light probe of owner registries, the monthly recheck
// of operator addresses (accesos), the build gate of the repository copies and the owner's monthly re-save reminder (plazos).
// No network: fake contexts and fake DNS/TLS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judge, targets, loadSources, registryDiff, hitDocs, probeList, probeFetch, listDocs } from '../../tools/feeds/casaslegales/listas.mjs';
import accesos, { hostsOf, observe, judgeAccess, dueOf, probeHost, specOf, EXPECT, RETRY_DAYS } from '../../tools/feeds/casaslegales/accesos.mjs';
import plazos, { repoGate, resaveList, resaveAlert, loadInputs, ownerExpiries, reminder, GATE_WARN_DAYS, RESAVE_LIST_DAYS } from '../../tools/feeds/casaslegales/plazos.mjs';
import { problemsOf, renderAlert, loadTemplates } from '../../tools/feeds/alerts.mjs';
import { runFeed, buildHealth, alertsFor } from '../../tools/feeds/run.mjs';
import { readFeed } from '../../tools/feeds/lib.mjs';
import { docUntil, isOwnerDoc } from '../../tools/lib/ownercopy.mjs';
import { OPS, ACCESS_DATA } from '../../sites/casaslegales/content/operators.mjs';
import { DEAD } from '../../sites/casaslegales/content/official.mjs';
import { pageData } from '../../sites/casaslegales/layout.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const T = loadTemplates();
const day = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const reg = (src, id) => src.registries.find(r => r.id === id);
const saved = (src, id, slug) => readFileSync(join(ROOT, reg(src, id).docs[slug].file), 'utf8');

test('listas: a difference marks the documents it is about (hit), list documents carry list', () => {
  const src = loadSources(), pba = reg(src, 'buenos-aires');
  const quote = registryDiff(['buenos-aires: quote law not found verbatim in pba-ley-15079: "x"']);
  assert.deepEqual([...hitDocs(pba, quote)], ['pba-ley-15079'], 'a quote of the law page: not the list');
  const list = registryDiff(['buenos-aires: the official list has nuevo.bet.ar but the registry file does not']);
  assert.deepEqual([...hitDocs(pba, list)], ['pba-juego-online']);
  const t = targets(src);
  assert.equal(t.find(x => x.key === 'pba-juego-online').list, true);
  assert.equal(t.find(x => x.key === 'pba-ley-15079').list, false);
  assert.deepEqual(listDocs(reg(src, 'neuquen')).map(x => x.doc).sort(), ['neu-casinos', 'neu-juego-legal']);
});

test('listas: light probe of owner registries - AI-blocked hosts and robots.txt are never passed, the list is compared', async () => {
  const src = loadSources(), list = targets(src), asked = [];
  const sfe = saved(src, 'santa-fe', 'santa-fe-plataformas'), mza = saved(src, 'mendoza', 'mendoza-plataformas');
  const ctx = (pages, robots = {}) => ({
    async getText(u) { asked.push(u); const o = new URL(u).origin; if (robots[o]) return { text: robots[o] }; const e = new Error('HTTP 404 ' + u); e.status = 404; throw e; },
    async getBytes(u) { asked.push(u); if (pages[u] === undefined) throw new Error('fetch failed'); return { buf: Buffer.from(pages[u], 'utf8') }; },
  });
  const pages = { 'https://www.loteriasantafe.gov.ar/casinos/': sfe, 'https://www.ipjyc.gob.ar/JEL/': mza };
  const probe = await probeFetch(ctx(pages, { 'https://www.ipjyc.gob.ar': 'User-agent: GPTBot\nDisallow: /\n' }), list);
  assert.ok(!asked.some(u => /loteriadecordoba|ijan-neuquen|loteriaderionegro/.test(u)), 'AI_BLOCKED_HOSTS: no request at all');
  assert.ok(!asked.includes('https://www.ipjyc.gob.ar/JEL/'), 'robots.txt keeps an AI crawler out: the page is not fetched');
  assert.match(probe['cba-juegos-online'].robots, /AI_BLOCKED_HOSTS/);
  assert.ok(probe['mendoza-plataformas'].robots);
  assert.ok(probe['santa-fe-plataformas'].buf);
  const run = (p, prev, today) => judge({ today, src, list, fresh: {}, only: new Set(), probe: p }, prev, null);
  const a = run(probe, null, '2026-12-01');
  assert.equal(a.docs['santa-fe-plataformas'].state, 'owner');
  assert.deepEqual(a.docs['santa-fe-plataformas'].probe, { on: '2026-12-01', result: 'same' });
  assert.equal(a.docs['mendoza-plataformas'].probe.result, 'robots');
  assert.equal(a.docs['cba-juegos-online'].probe.result, 'robots');
  assert.equal(a.alerts.length, 0);
  assert.equal(probeList(reg(src, 'santa-fe'), { 'santa-fe-plataformas': '<p>nothing</p>' }).result, 'unknown', 'pattern finds nothing: no verdict');
  // the regulator replaced a site: the copy turns "changed" (hit, list), the alert names the difference; since stays next month
  const moved = { ...probe, 'santa-fe-plataformas': { buf: Buffer.from(sfe.replaceAll('jugadon.bet.ar', 'nuevo.bet.ar'), 'utf8') } };
  const b = run(moved, { docs: a.docs }, '2026-12-29');
  const d = b.docs['santa-fe-plataformas'];
  assert.equal(d.state, 'changed');
  assert.equal(d.hit, true);
  assert.equal(d.list, true);
  assert.equal(d.since, '2026-12-29');
  assert.deepEqual(d.probe.added, ['nuevo.bet.ar']);
  assert.deepEqual(d.probe.removed, ['jugadon.bet.ar']);
  assert.equal(b.docs['santa-fe-inicio'].state, 'owner', 'the other owner copy of the registry is not touched');
  assert.equal(b.alerts.length, 1);
  assert.match(b.alerts[0].text, /^registry santa-fe \(owner copy\) changed on the official page; .*Added: nuevo\.bet\.ar\. Removed: jugadon\.bet\.ar\./);
  const c = run(moved, { docs: b.docs }, '2027-01-26');
  assert.equal(c.docs['santa-fe-plataformas'].since, '2026-12-29', 'first day of the change kept');
  // a retry run (no probe) keeps the finding
  const r = judge({ today: '2027-01-29', src, list, fresh: {}, only: new Set(['caba-agencias']) }, { docs: c.docs }, null);
  assert.equal(r.docs['santa-fe-plataformas'].state, 'changed');
  assert.equal(r.docs['santa-fe-plataformas'].hit, true);
  // the alert reaches Telegram as list_changed
  const p = problemsOf({ notices: b.alerts.map(x => ({ ...x, feed: 'listas' })) });
  assert.equal(p[0].tpl, 'list_changed');
});

test('accesos: hosts of access.json and the dead addresses are the ones the pages use', () => {
  const list = hostsOf(ACCESS_DATA);
  assert.ok(list.some(x => x.host === 'arbet.bet.ar' && x.kind === 'dns'));
  assert.ok(list.some(x => x.host === 'super7.com.ar' && x.kind === 'tls' && x.slug === 'super7'));
  for (const [slug, a] of Object.entries(ACCESS_DATA.operators)) {
    assert.deepEqual(OPS.find(o => o.slug === slug).access, a, slug);
    assert.ok(EXPECT[a.kind], a.kind);
  }
  assert.equal(DEAD, ACCESS_DATA.dead);
  assert.equal(specOf(list), specOf(hostsOf(JSON.parse(JSON.stringify(ACCESS_DATA)))));
});

test('accesos: observed state, robots.txt respected, a change alerts only when a second check confirms it', async () => {
  assert.equal(observe({ dns: 'ENOTFOUND' }), 'dns');
  assert.equal(observe({ dns: 'EAI_AGAIN' }), 'error', 'a DNS timeout is never a change');
  assert.equal(observe({ dns: 'ok', tls: 'ECONNRESET' }), 'tls');
  assert.equal(observe({ dns: 'ok', tls: 'CERT_HAS_EXPIRED' }), 'tls');
  assert.equal(observe({ dns: 'ok', tls: 'ok', robots: 'closed' }), 'robots');
  assert.equal(observe({ dns: 'ok', tls: 'ok', robots: 'none', http: 403 }), 'blocked');
  assert.equal(observe({ dns: 'ok', tls: 'ok', robots: 'open', http: 200 }), 'open');
  const asked = [];
  const ctx = { async getText(u, o = {}) { asked.push((o.method || 'GET') + ' ' + u); if (u.endsWith('/robots.txt')) return { text: 'User-agent: ClaudeBot\nDisallow: /\n' }; return { text: '' }; } };
  const net = { dns: async () => 'ok', tls: async () => 'ok' };
  const p = await probeHost(ctx, 'casinosmacgroup.bet.ar', net);
  assert.deepEqual(p, { dns: 'ok', tls: 'ok', robots: 'closed', http: null });
  assert.deepEqual(asked, ['GET https://casinosmacgroup.bet.ar/robots.txt'], 'no request to the site past robots.txt');
  const dead = await probeHost(ctx, 'arbet.bet.ar', { dns: async () => 'ENOTFOUND', tls: async () => assert.fail('no TLS without DNS') });
  assert.equal(dead.dns, 'ENOTFOUND');
  const www = await probeHost(ctx, 'arbet.bet.ar', { dns: async h => h === 'www.arbet.bet.ar' ? 'ok' : 'ENOTFOUND', tls: async h => h === 'www.arbet.bet.ar' ? 'ok' : assert.fail(h) });
  assert.equal(www.name, 'www.arbet.bet.ar', 'the www. name the list links is tried too');
  assert.equal(observe(www), 'robots');

  const list = hostsOf(ACCESS_DATA), spec = specOf(list);
  const same = h => h === 'arbet.bet.ar' ? { dns: 'ENOTFOUND', tls: null, robots: null, http: null } : { dns: 'ok', tls: 'ok', robots: 'closed', http: null };
  const probes = mut => Object.fromEntries(list.map(x => [x.host, mut[x.host] || (x.kind === 'tls' ? { dns: 'ok', tls: 'ECONNRESET' } : x.kind === 'geo' ? { dns: 'ok', tls: 'ok', robots: 'open', http: 200 } : same(x.host))]));
  const a = judgeAccess({ today: '2026-12-01', list, probes: probes({}) }, null);
  for (const [h, x] of Object.entries(a.hosts)) assert.equal(x.same, true, h + ' ' + x.observed);
  assert.equal(a.hosts['arbet.bet.ar'].lastSame, '2026-12-01');
  assert.equal(a.alerts.length, 0);
  // arbet.bet.ar resolves now: noted, checked again after RETRY_DAYS, then confirmed and alerted once
  const up = { 'arbet.bet.ar': { dns: 'ok', tls: 'ok', robots: 'open', http: 200 } };
  const b = judgeAccess({ today: '2026-12-29', list, probes: probes(up) }, { hosts: a.hosts });
  assert.equal(b.hosts['arbet.bet.ar'].same, false);
  assert.equal(b.hosts['arbet.bet.ar'].confirmed, false);
  assert.equal(b.hosts['arbet.bet.ar'].lastSame, '2026-12-01');
  assert.equal(b.alerts.length, 0, 'one finding is not enough');
  const prev = { checkedOn: '2026-12-29', spec, hosts: b.hosts };
  assert.equal(dueOf(prev, day('2026-12-29', RETRY_DAYS - 1), spec, false), null);
  const due = dueOf(prev, day('2026-12-29', RETRY_DAYS), spec, false);
  assert.equal(due.reason, 'retry');
  assert.deepEqual([...due.only], ['arbet.bet.ar']);
  const c = judgeAccess({ today: '2027-01-01', list, probes: { 'arbet.bet.ar': up['arbet.bet.ar'] } }, prev);
  assert.equal(c.hosts['arbet.bet.ar'].confirmed, true);
  assert.equal(c.hosts['arbet.bet.ar'].since, '2026-12-29');
  assert.equal(c.hosts['super7.com.ar'].checked, '2026-12-29', 'hosts not rechecked keep their last check');
  assert.equal(c.alerts.length, 1);
  assert.match(c.alerts[0].text, /^operator address arbet\.bet\.ar no longer behaves as its page says \(dns, written 2026-11-03\): the server finds open since 2026-12-29/);
  assert.match(c.alerts[0].text, /capture-shots/);
  const pr = problemsOf({ notices: c.alerts.map(x => ({ ...x, feed: 'accesos' })) })[0];
  assert.equal(pr.tpl, 'access_changed');
  const txt = renderAlert(pr.tpl, pr.params, { site: 'casaslegales', scope: pr.scope }).text;
  assert.ok(txt.includes('arbet.bet.ar') && txt.includes('29.12.2026') && !/\{[a-z]+\}/i.test(txt));
  assert.equal(dueOf(prev, '2027-01-26', spec, false).reason, 'monthly');
  assert.equal(dueOf(prev, '2027-01-02', 'other', false).reason, 'synced data changed');
});

test('accesos feed: runs with a fake network, writes hosts and alerts, nothing due the next day', async () => {
  const out = mkdtempSync(join(tmpdir(), 'cl-acc-'));
  const net = { dns: async h => /arbet/.test(h) ? 'ENOTFOUND' : 'ok', tls: async h => /super7/.test(h) ? 'ECONNRESET' : 'ok' };
  const feed = { ...accesos, fetch: ctx => { ctx.net = net; return accesos.fetch(ctx); } };
  const fx = mkdtempSync(join(tmpdir(), 'cl-accfx-'));
  const r = await runFeed(feed, { out, fixtures: fx, now: new Date('2026-12-01T12:00:00Z'), ua: 'test' });
  assert.equal(r.ok, true, r.error);
  const d = readFeed(join(out, 'accesos.json')).data;
  assert.equal(d.checkedOn, '2026-12-01');
  assert.equal(d.hosts['super7.com.ar'].observed, 'tls');
  assert.equal(d.hosts['arbet.bet.ar'].observed, 'dns');
  const r2 = await runFeed(feed, { out, fixtures: fx, now: new Date('2026-12-02T12:00:00Z'), ua: 'test' });
  assert.equal(r2.requests, 0);
});

test('plazos: the build gate of the repository copies warns 21 days before, apart from the owner reminder', () => {
  const inputs = loadInputs(), g = repoGate(inputs);
  const { src } = inputs;
  const all = [...src.registries.flatMap(r => Object.values(r.docs).map(d => [d, r.maxAgeDays])), ...Object.values(src.provinces.docs).map(d => [d, src.provinces.maxAgeDays]), ...Object.values(src.rg.docs).map(d => [d, src.rg.maxAgeDays])]
    .filter(([d]) => !isOwnerDoc(d)).map(([d, m]) => docUntil(d, m)).sort();
  assert.equal(g.until <= all[0], true);
  assert.equal(g.id, 'repo-gate');
  assert.equal(g.warnDays, GATE_WARN_DAYS);
  assert.match(g.what, /pull --write/);
  assert.equal(reminder(day(g.until, -GATE_WARN_DAYS), ownerExpiries(inputs), null), null, 'the gate is not part of the owner reminder');
  const h = { expiries: [{ id: 'repo-gate', state: 'soon', until: g.until, daysLeft: 21, what: g.what, feed: 'plazos' }] };
  const p = problemsOf(h)[0];
  assert.equal(p.tpl, 'expiry_repo_gate_soon');
  const t = renderAlert(p.tpl, p.params, { site: 'casaslegales', scope: p.scope });
  assert.equal(t.sev, 'yellow');
  assert.ok(t.text.includes('pull --write') && !/\{[a-z]+\}/i.test(t.text));
  assert.equal(problemsOf({ expiries: [{ ...h.expiries[0], state: 'expired' }] })[0].tpl, 'expiry_repo_gate');
});

test('plazos feed: the gate becomes one yellow alert 21 days before it', async () => {
  const out = mkdtempSync(join(tmpdir(), 'cl-gate-'));
  const g = repoGate(loadInputs());
  const at = d => new Date(d + 'T12:00:00Z');
  await runFeed(plazos, { out, fixtures: mkdtempSync(join(tmpdir(), 'cl-gfx-')), now: at(day(g.until, -GATE_WARN_DAYS - 1)), ua: 'test' });
  const h1 = buildHealth([plazos], out, [], [], at(day(g.until, -GATE_WARN_DAYS - 1)), {}, 'casaslegales');
  assert.equal(h1.expiries.find(x => x.id === 'repo-gate').state, 'ok');
  const h2 = buildHealth([plazos], out, [], [], at(day(g.until, -GATE_WARN_DAYS)), {}, 'casaslegales');
  assert.equal(h2.expiries.find(x => x.id === 'repo-gate').state, 'soon');
  assert.equal(alertsFor(h1, h2, 'casaslegales').filter(x => /repo-gate/.test(x)).length, 1);
});

test('plazos: monthly re-save reminder of the owner registries, once a month, with the probe finding', () => {
  const src = loadSources();
  const listas = { docs: { 'santa-fe-plataformas': { state: 'owner', probe: { on: '2026-11-30', result: 'unreachable', reason: 'fetch failed' } }, 'mendoza-plataformas': { state: 'owner', probe: { on: '2026-11-30', result: 'same' } } } };
  const owners = src.registries.filter(r => Object.values(r.docs).some(isOwnerDoc)).map(r => r.id).sort();
  assert.deepEqual(owners, ['cordoba', 'mendoza', 'neuquen', 'rio-negro', 'santa-fe']);
  assert.deepEqual(resaveList(src, '2026-11-19', listas), [], 'lists saved less than 20 days ago wait');
  assert.deepEqual(resaveList(src, '2026-11-24', listas).map(r => r.id), ['rio-negro']);
  const l = resaveList(src, '2026-12-01', listas);
  assert.deepEqual(l.map(r => r.id).sort(), owners);
  assert.equal(l.find(r => r.id === 'santa-fe').argentina, true);
  assert.equal(l.find(r => r.id === 'cordoba').argentina, false);
  const a = resaveAlert('2026-12-01', l, { month: '2026-11', on: '2026-11-19' });
  assert.equal(a.alert.id, 'resave-2026-12');
  assert.deepEqual(a.state, { month: '2026-12', on: '2026-12-01' });
  assert.match(a.alert.text, /santa-fe-plataformas loteriasantafe\.gov\.ar\/casinos \(from Argentina\)/);
  assert.match(a.alert.text, /owner-saves\/README\.md/);
  assert.equal(resaveAlert(day('2026-12-01', RESAVE_LIST_DAYS - 1), l, a.state).alert.id, 'resave-2026-12');
  assert.equal(resaveAlert(day('2026-12-01', RESAVE_LIST_DAYS), l, a.state).alert, null, 'listed a few days, then gone until next month');
  assert.equal(resaveAlert('2027-01-02', l, a.state).alert.id, 'resave-2027-01');
  const p = problemsOf({ notices: [{ ...a.alert, feed: 'plazos' }] })[0];
  assert.equal(p.tpl, 'resave_monthly');
  assert.equal(p.digest, false, 'no daily digest for a reminder');
  const txt = renderAlert(p.tpl, p.params, { site: 'casaslegales', scope: p.scope }).text;
  assert.ok(txt.includes('santa-fe-plataformas') && txt.includes('owner-saves/README.md') && !/\{[a-z]+\}/i.test(txt));
  assert.ok(txt.includes(T.templates.resave_probe_same.replace('{name}', 'mendoza (IPJyC)').replace('{on}', '30.11.2026')), 'probe finding in the message');
});

test('layout: pages without the interactive map get only the footer help lines', () => {
  const d = { j: { a: { n: 'A', co: 'AA', s: 'list', l: { p: '0800', t: '0800' }, u: '/x' }, b: { n: 'B', co: 'BB', s: 'none' } }, t: ['x'], crisis: {}, s: {} };
  assert.deepEqual(pageData(d, '<main>no map</main>'), { j: { a: { n: 'A', l: { p: '0800', t: '0800' } } } });
  assert.equal(pageData(d, '<div data-rl-map>'), d);
  assert.equal(pageData(null, ''), null);
});
