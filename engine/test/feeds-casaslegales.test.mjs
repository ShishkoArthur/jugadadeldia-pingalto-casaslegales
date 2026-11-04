// casaslegales server feeds (tools/feeds/casaslegales): robots.txt rules, the monthly recheck of the official pages (feed listas:
// unchanged -> renewed date, changed -> last good kept + one alert with the difference, robots -> never fetched, retry of failures),
// the expiry list and the single reminder (feed plazos), the pull into the repository (pull-apply.mjs) and the HEAD-only sync.
// Fixtures: the saved copies of data/sources (they pass the build checks, so a fresh copy equal to them is "unchanged").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, existsSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseRobots, allowed, robotsVerdict } from '../../tools/feeds/casaslegales/robots-txt.mjs';
import listas, { targets, loadSources, registryDiff, dueReason, specHash } from '../../tools/feeds/casaslegales/listas.mjs';
import plazos, { ownerExpiries, reminder, loadInputs, REMINDER_DAYS } from '../../tools/feeds/casaslegales/plazos.mjs';
import { applyPull } from '../../tools/feeds/casaslegales/pull-apply.mjs';
import { runFeed, alertsFor, buildHealth } from '../../tools/feeds/run.mjs';
import { readFeed } from '../../tools/feeds/lib.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const tmp = p => mkdtempSync(join(tmpdir(), 'cl-' + p + '-'));
const hasPdf = spawnSync('pdftotext', ['-v']).status === 0 || spawnSync('pdftotext', ['-v']).stderr?.length > 0;

test('robots.txt: AI crawlers, our agent, longest match', () => {
  const ai = 'User-agent: *\nAllow: /\n\nUser-agent: ClaudeBot\nUser-agent: GPTBot\nDisallow: /\n';
  assert.equal(robotsVerdict(ai, '/juegos/online').ok, false);
  assert.match(robotsVerdict(ai, '/').why, /claudebot/);
  assert.equal(robotsVerdict('User-agent: *\nDisallow: /admin\n', '/juego-online').ok, true);
  assert.equal(robotsVerdict('User-agent: *\nDisallow: /\n', '/x').ok, false, 'everyone kept out, us too');
  assert.equal(robotsVerdict('User-agent: Casaslegales\nDisallow: /lista\n', '/lista/a').ok, false);
  assert.equal(robotsVerdict('', '/x').ok, true, 'no robots.txt');
  const g = parseRobots('User-agent: *\nDisallow: /a\nAllow: /a/b\n');
  assert.equal(allowed(g, 'x', '/a/c'), false);
  assert.equal(allowed(g, 'x', '/a/b/c'), true, 'longer Allow wins');
  assert.equal(allowed(parseRobots('User-agent: *\nDisallow: /*.php$\n'), 'x', '/juego.php'), false);
  assert.equal(allowed(parseRobots('User-agent: *\nDisallow: /*.php$\n'), 'x', '/juego.php?a=1'), true);
  assert.equal(robotsVerdict('User-agent: ClaudeBot\nDisallow: /privado\n', '/lista').ok, true, 'an AI rule for another path');
});

test('registry difference from the check findings', () => {
  const d = registryDiff(['caba: the official list has nuevo.bet.ar but the registry file does not', 'caba: codere.bet.ar is in the registry file but not in the official list', 'caba: quote regulator not found verbatim in caba-agencias: "x"']);
  assert.deepEqual(d.added, ['nuevo.bet.ar']);
  assert.deepEqual(d.removed, ['codere.bet.ar']);
  assert.equal(d.other.length, 1);
});

// a fixture directory for feed listas: every page the server may fetch -> its saved copy, robots.txt -> 404
function fixtures(mut = {}) {
  const dir = tmp('fx'), fx = join(dir, 'listas'), index = {};
  mkdirSync(fx, { recursive: true });
  const src = loadSources(), files = {};
  for (const r of src.registries) for (const [slug, d] of Object.entries(r.docs)) files[slug] = d.file;
  for (const [slug, d] of Object.entries(src.provinces.docs)) files['pv:' + slug] = d.file;
  for (const [slug, d] of Object.entries(src.rg.docs)) files['rg:' + slug] = d.file;
  let n = 0;
  for (const t of targets(src).filter(t => !t.owner)) {
    const origin = new URL(t.url).origin;
    index[origin + '/robots.txt'] = mut.robots && mut.robots[origin] ? 'robots-' + n + '.txt' : { status: 404 };
    if (mut.robots && mut.robots[origin]) writeFileSync(join(fx, 'robots-' + n + '.txt'), mut.robots[origin]);
    if (mut.status && mut.status[t.key]) { index[t.url] = { status: mut.status[t.key] }; n++; continue; }
    if (index[t.url]) continue;
    const name = 'doc-' + (n++) + t.ext;
    let buf = readFileSync(join(ROOT, files[t.key]));
    if (mut.edit && mut.edit[t.key]) buf = Buffer.from(mut.edit[t.key](buf.toString('utf8')), 'utf8');
    writeFileSync(join(fx, name), buf);
    index[t.url] = name;
  }
  writeFileSync(join(fx, 'index.json'), JSON.stringify(index));
  return dir;
}
const run = (fx, out, docs, now, force = false) => runFeed(listas, { out, fixtures: fx, now: new Date(now + 'T12:00:00Z'), ua: 'test', force, docsDir: docs });

test('listas: unchanged pages renew the date; owner copies are never fetched', { skip: !hasPdf && 'pdftotext missing' }, async () => {
  const out = tmp('out'), docs = tmp('docs');
  const r = await run(fixtures(), out, docs, '2026-12-03');
  assert.equal(r.ok, true, r.error);
  const d = readFeed(join(out, 'listas.json')).data;
  const list = targets();
  const own = list.filter(t => t.owner), mine = list.filter(t => !t.owner);
  assert.ok(own.length >= 10 && mine.length >= 30);
  for (const t of mine) assert.equal(d.docs[t.key].state, 'ok', t.key + ': ' + d.docs[t.key].reason);
  for (const t of own) assert.equal(d.docs[t.key].state, 'owner', t.key);
  assert.equal(d.docs['caba-agencias'].revisado, '2026-12-03');
  assert.equal(d.checkedOn, '2026-12-03');
  assert.ok(existsSync(join(docs, 'listas', 'caba-agencias.html')));
  assert.deepEqual(d.alerts, []);
  assert.ok(d.expiries.every(x => x.until === '2027-03-13' || x.until > '2027-03-01'), 'expiry = check + maxAgeDays');
  // the next day nothing is due: no requests, same data
  const r2 = await run(fixtures(), out, docs, '2026-12-04');
  assert.equal(r2.requests, 0);
  assert.equal(readFeed(join(out, 'listas.json')).data.checkedOn, '2026-12-03');
  // 28 days later: monthly
  assert.equal(dueReason(d, '2026-12-31', d.spec, false, list).reason, 'monthly');
  assert.equal(dueReason(d, '2026-12-30', d.spec, false, list), null);
  assert.equal(dueReason(d, '2026-12-05', 'other', false, list).reason, 'synced data changed');
});

test('listas: a changed list keeps the last good date and alerts once with the difference', { skip: !hasPdf && 'pdftotext missing' }, async () => {
  const caba = loadSources().registries.find(r => r.id === 'caba');
  const host = caba.licensees[0].host;
  const out = tmp('out'), docs = tmp('docs');
  await run(fixtures(), out, docs, '2026-12-03');
  const before = readFeed(join(out, 'listas.json'));
  // a month later the regulator removed one site and added another
  const fx = fixtures({ edit: { 'caba-agencias': h => h.replaceAll(host, 'nuevo-sitio.bet.ar') } });
  const r = await run(fx, out, docs, '2027-01-02');
  assert.equal(r.ok, true, r.error);
  const d = readFeed(join(out, 'listas.json')).data;
  assert.equal(d.docs['caba-agencias'].state, 'changed');
  assert.equal(d.docs['caba-agencias'].revisado, '2026-12-03', 'last good date stays');
  assert.equal(d.docs['caba-agencias'].sha256, before.data.docs['caba-agencias'].sha256);
  assert.equal(d.docs['pba-juego-online'].revisado, '2027-01-02', 'other registries renew');
  assert.equal(d.alerts.length, 1);
  assert.match(d.alerts[0].text, new RegExp('Added: nuevo-sitio\\.bet\\.ar\\. Removed: ' + host.replace(/\./g, '\\.')));
  assert.ok(existsSync(join(docs, 'listas-pending', 'caba-agencias.html')));
  assert.equal(readFileSync(join(docs, 'listas', 'caba-agencias.html'), 'utf8').includes('nuevo-sitio'), false, 'the good server copy is not replaced');
  // the health report alerts once; the same difference next month is not alerted again
  const h1 = buildHealth([listas], out, [], [], new Date('2027-01-02T12:00:00Z'), {}, 'casaslegales');
  const a1 = alertsFor(null, h1, 'casaslegales');
  assert.equal(a1.filter(x => /changed on the official page/.test(x)).length, 1);
  assert.equal(h1.ok, false);
  await run(fx, out, docs, '2027-01-31');
  const h2 = buildHealth([listas], out, [], [], new Date('2027-01-31T12:00:00Z'), {}, 'casaslegales');
  assert.equal(alertsFor(h1, h2, 'casaslegales').filter(x => /changed on the official page/.test(x)).length, 0);
});

test('listas: robots.txt that keeps AI crawlers out stops the fetch; failures are retried', { skip: !hasPdf && 'pdftotext missing' }, async () => {
  const out = tmp('out'), docs = tmp('docs');
  const fx = fixtures({ robots: { 'https://ajalar.com.ar': 'User-agent: ClaudeBot\nDisallow: /\n' }, status: { 'pv:cas-inicio': 503, 'rg:ar-j-cas-juego-responsable': 503 } });
  const r = await run(fx, out, docs, '2026-12-03');
  assert.equal(r.ok, true, r.error);
  let d = readFeed(join(out, 'listas.json')).data;
  assert.equal(d.docs['lri-plataformas'].state, 'robots');
  assert.ok(d.alerts.some(a => a.id === 'robots-lri-plataformas'));
  const down = Object.entries(d.docs).filter(([, x]) => x.state === 'unreachable').map(([k]) => k);
  assert.ok(down.length >= 1, 'a page that answers 503 is unreachable');
  for (const k of down) assert.equal(d.docs[k].since, '2026-12-03');
  // 3 days later only the failing pages are fetched again; the robots alert stays
  const r2 = await run(fixtures(), out, docs, '2026-12-06');
  assert.ok(r2.requests > 0 && r2.requests < 10, 'retry fetches only the failing pages (' + r2.requests + ')');
  d = readFeed(join(out, 'listas.json')).data;
  for (const k of down) assert.equal(d.docs[k].state, 'ok', k);
  assert.ok(d.alerts.some(a => a.id === 'robots-lri-plataformas'), 'findings of untouched sets stay');
  assert.equal(d.checkedOn, '2026-12-03', 'a retry is not a full check');
});

test('plazos: owner copies, reviews and operator copies with dates; one reminder 21 days before the first expiry', () => {
  const inputs = loadInputs();
  const own = ownerExpiries(inputs);
  assert.ok(own.some(x => x.id === 'owner-cba-juegos-online' && x.kind === 'owner'));
  assert.ok(own.some(x => x.kind === 'review'));
  assert.ok(own.every(x => x.warnDays === 0 && /^\d{4}-\d{2}-\d{2}$/.test(x.until)));
  const first = own.map(x => x.until).sort()[0];
  const day = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  assert.equal(reminder(day(first, -REMINDER_DAYS - 1), own, null), null);
  const r = reminder(day(first, -REMINDER_DAYS), own, null);
  assert.equal(r.id, 'reminder-' + first);
  assert.match(r.text, /Save from your Chrome/);
  assert.match(r.text, /cba-juegos-online/);
  assert.ok(r.text.length < 4000);
  // a page the server could not refresh joins the same reminder
  const listasData = { docs: { 'pv:cas-inicio': { state: 'unreachable' } }, expiries: [{ id: 'pv:cas-inicio', what: 'x', until: day(first, 5), warnDays: 0 }] };
  assert.match(reminder(day(first, -REMINDER_DAYS), own, listasData).text, /pv:cas-inicio until .* \(unreachable\)/);
  const rv = own.find(x => x.kind === 'review');
  assert.match(rv.what, /max 180 days/, 'review data: half-year limit');
});

test('plazos feed: health lists every expiry; the reminder is alerted once', async () => {
  const out = tmp('out');
  const first = ownerExpiries(loadInputs()).map(x => x.until).sort()[0];
  const now = new Date(Date.parse(first + 'T12:00:00Z') - 10 * 864e5);
  const r = await runFeed(plazos, { out, fixtures: tmp('fx'), now, ua: 'test' });
  assert.equal(r.ok, true, r.error);
  const h = buildHealth([plazos], out, [], [], now, {}, 'casaslegales');
  assert.ok(h.expiries.length >= 10);
  const a = alertsFor(null, h, 'casaslegales');
  assert.equal(a.filter(x => /reminder/.test(x)).length, 1);
  assert.equal(alertsFor(h, h, 'casaslegales').length, 0);
});

test('pull-apply: server copies replace older repository copies (bytes, sha256, date), only when checked and intact', () => {
  const root = tmp('root');
  for (const p of ['data/sources/registries/caba.json', 'data/sources/rg/helplines.json']) { mkdirSync(join(root, dirname(p)), { recursive: true }); copyFileSync(join(ROOT, p), join(root, p)); }
  const caba = JSON.parse(readFileSync(join(ROOT, 'data/sources/registries/caba.json'), 'utf8'));
  const d = caba.docs['caba-agencias'];
  mkdirSync(join(root, dirname(d.file)), { recursive: true });
  copyFileSync(join(ROOT, d.file), join(root, d.file));
  const docsDir = tmp('pulled');
  mkdirSync(join(docsDir, 'listas'));
  const fresh = Buffer.from(readFileSync(join(ROOT, d.file), 'utf8') + '\n', 'utf8');
  writeFileSync(join(docsDir, 'listas', 'caba-agencias.html'), fresh);
  const sha = (b => { const c = spawnSync('sha256sum', [], { input: b }); return c.stdout.toString().slice(0, 64); })(fresh);
  const listasData = { checkedOn: '2027-01-02', docs: { 'caba-agencias': { url: d.url, state: 'ok', revisado: '2027-01-02', sha256: sha }, 'rg:ar-c-juegosegurolegal': { url: 'https://other/', state: 'ok', revisado: '2027-01-02', sha256: 'x' } } };
  const log = [];
  assert.equal(applyPull({ root, listas: listasData, docsDir, write: false, log: m => log.push(m) }).applied, 1);
  assert.equal(JSON.parse(readFileSync(join(root, 'data/sources/registries/caba.json'), 'utf8')).docs['caba-agencias'].fetched, d.fetched, 'dry run writes nothing');
  applyPull({ root, listas: listasData, docsDir, write: true, log: () => {} });
  const after = JSON.parse(readFileSync(join(root, 'data/sources/registries/caba.json'), 'utf8'));
  assert.equal(after.docs['caba-agencias'].fetched, '2027-01-02');
  assert.equal(after.docs['caba-agencias'].sha256, sha);
  assert.equal(after.checked, '2027-01-02');
  assert.deepEqual(readFileSync(join(root, d.file)), fresh);
  // a changed or broken server copy is never taken
  writeFileSync(join(docsDir, 'listas', 'caba-agencias.html'), 'broken');
  listasData.docs['caba-agencias'].revisado = '2027-02-01';
  assert.equal(applyPull({ root, listas: listasData, docsDir, write: true, log: () => {} }).applied, 0);
  listasData.docs['caba-agencias'].state = 'changed';
  assert.equal(applyPull({ root, listas: listasData, docsDir, write: true, log: () => {} }).applied, 0);
});

test('feeds-server.sh stage ships the last commit only (git archive HEAD)', { skip: spawnSync('git', ['--version']).status !== 0 && 'no git' }, () => {
  const dir = tmp('stage');
  const r = spawnSync('bash', [join(ROOT, 'tools/feeds-server.sh'), 'casaslegales', 'stage', join(dir, 'app')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const files = [];
  const walk = (d, rel = '') => { for (const f of readdirSync(join(d, rel), { withFileTypes: true })) f.isDirectory() ? walk(d, rel + f.name + '/') : files.push(rel + f.name); };
  walk(join(dir, 'app'));
  assert.ok(files.includes('tools/feeds/run.mjs') && files.includes('data/sources/registries/caba.json') && files.includes('tools/lib/sources.mjs'));
  assert.ok(!files.some(f => f.includes('/_docs/') || f.endsWith('.test.mjs')), 'no saved documents, no tests');
  const tree = new Map(spawnSync('git', ['-C', ROOT, 'ls-tree', '-r', 'HEAD'], { encoding: 'utf8', maxBuffer: 64 << 20 }).stdout.trim().split('\n').map(l => { const [meta, p] = l.split('\t'); return [p, meta.split(' ')[2]]; }));
  const hashes = spawnSync('git', ['hash-object', '--stdin-paths'], { input: files.map(f => join(dir, 'app', f)).join('\n'), encoding: 'utf8' }).stdout.trim().split('\n');
  files.forEach((f, i) => assert.equal(hashes[i], tree.get(f), f + ' differs from HEAD'));
});
