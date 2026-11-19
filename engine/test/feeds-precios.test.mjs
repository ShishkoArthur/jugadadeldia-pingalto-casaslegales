// Prices of the monthly LOTBA programmes (feed precios): strict extraction, plausibility, the check of the other cited values, the
// runner contract (last good value stays, alerts once). Fixtures: text of the 2026-11 programmes (engine/test/fixtures/programa) and
// the saved PDFs of data/sources/lottery/_docs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { esWords, esAmount, extractPrices, extractPagePrices, judgePrice, confirmFacts, checkDocument, PRICES, DOCS, PAGE_PRICES, PAGE_VALID_DAYS } from '../lottery/precios.mjs';
import feed, { dueReason, pageDue, builtCopy } from '../../tools/feeds/jugadadeldia/precios.mjs';
import { main, alertsFor } from '../../tools/feeds/run.mjs';

const FX = new URL('./fixtures/programa/', import.meta.url);
const fx = f => readFileSync(new URL(f, FX), 'utf8');
const NOV = '2026-11';
const QUI = () => fx('202611QUI1.txt'), LTO = () => fx('202611LTO1.txt');
const ROOT = new URL('../../', import.meta.url);

test('Spanish amounts: words and digits', () => {
  assert.equal(esWords('CIENTO CINCUENTA'), 150);
  assert.equal(esWords('UN MIL SETECIENTOS'), 1700);
  assert.equal(esWords('DOS MILLONES CIEN MIL'), 2100000);
  assert.equal(esWords('TRES MIL QUINIENTAS'), 3500);
  assert.equal(esWords('CUATRO MIL'), 4000);
  assert.equal(esWords('DOSCIENTOS VEINTICINCO'), 225);
  assert.equal(esWords('DOS MILLONES CIE MIL'), null);
  assert.equal(esWords('MIL MIL'), null);
  assert.equal(esAmount('$2.100.000.-'.slice(1)), 2100000);
  assert.equal(esAmount('4.000'), 4000);
  assert.equal(esAmount('1700'), 1700);
  assert.equal(esAmount('1.70'), null);
});

test('prices of 2026-11: Quiniela minimum, Poceada, big prize, Loto Plus', () => {
  assert.deepEqual(extractPrices('QUI', QUI(), NOV), { values: { 'lotba.quiniela.min-bet': 150, 'lotba.quiniela.big-prize': 2100000, 'lotba.poceada.price': 1700 }, problems: {} });
  assert.deepEqual(extractPrices('LTO', LTO(), NOV), { values: { 'lotba.loto.price': 4000 }, problems: {} }, 'the extraordinary draw 3933* ($ 5.000) is not the price');
  const b = builtCopy();
  for (const id of Object.keys(PRICES)) assert.equal(b.values[id], { 'lotba.quiniela.min-bet': 150, 'lotba.quiniela.big-prize': 2100000, 'lotba.poceada.price': 1700, 'lotba.loto.price': 4000 }[id], id + ' equals the saved copy');
  assert.deepEqual(b.ym, { QUI: NOV, LTO: NOV });
});

test('prices: words against digits, several amounts, not found, loto table rows', () => {
  const q = QUI();
  assert.match(extractPrices('QUI', q.replace('PESOS CIENTO CINCUENTA ($150)', 'PESOS DOSCIENTOS ($150)'), NOV).problems['lotba.quiniela.min-bet'], /differ/);
  assert.match(extractPrices('QUI', q.replace('PESOS CIENTO CINCUENTA ($150)', 'PESOS CIENTO CINCUENTA ($15O)'), NOV).problems['lotba.quiniela.min-bet'], /not found|not readable/);
  const two = q.replace(/VALOR DE LA APUESTA: \$ 1700 \(PESOS UN MIL SETECIENTOS\)/, 'VALOR DE LA APUESTA: $ 1800 (PESOS UN MIL OCHOCIENTOS)');
  const pr = extractPrices('QUI', two, NOV);
  assert.ok(pr.values['lotba.poceada.price'] === 1800 || /several/.test(pr.problems['lotba.poceada.price'] || ''));
  assert.equal(extractPrices('QUI', q.replace(/por extracto apostado/g, 'por cada extracto'), NOV).problems['lotba.quiniela.min-bet'], 'not found');
  const l = LTO();
  assert.match(extractPrices('LTO', l.replace(/(3936\s+18\/11\/2026\s+22:00\s+\S+\s+\S+\s+\$\s+)4\.000/, '$14.500'), NOV).problems['lotba.loto.price'], /different prices/);
  assert.match(extractPrices('LTO', l.replace('3934         11/11/2026', '3994         11/11/2026'), NOV).problems['lotba.loto.price'], /consecutive/);
  assert.match(extractPrices('LTO', l, '2026-12').problems['lotba.loto.price'], /outside 2026-12/);
});

test('document of the month and game', () => {
  assert.equal(checkDocument('QUI', QUI(), NOV), null);
  assert.equal(checkDocument('LTO', LTO(), NOV), null);
  assert.match(checkDocument('QUI', QUI(), '2026-12'), /DICIEMBRE/);
  assert.match(checkDocument('LTO', QUI(), NOV), /Loto Plus/);
});

test('every other cited value of 2026-11 is confirmed; a changed one is reported', () => {
  const { facts } = builtCopy();
  const q = confirmFacts(facts.QUI, QUI(), NOV, 'QUI'), l = confirmFacts(facts.LTO, LTO(), NOV, 'LTO');
  assert.deepEqual(q.changed, []);
  assert.deepEqual(l.changed, []);
  assert.equal(q.confirmed.length + l.confirmed.length + Object.keys(PRICES).length, facts.QUI.length + facts.LTO.length);
  assert.ok(q.confirmed.includes('lotba.quiniela.time-nocturna') && q.confirmed.includes('lotba.quiniela.saturday-nocturna'));
  const c = confirmFacts(facts.QUI, QUI().replace(/SETENTA \(70\) VECES lo apostado/g, 'OCHENTA (80) VECES lo apostado'), NOV, 'QUI');
  assert.deepEqual(c.changed, ['lotba.quiniela.pay-2']);
  assert.ok(confirmFacts(facts.QUI, QUI().replace(/21:00/g, '21:30'), NOV, 'QUI').changed.includes('lotba.quiniela.time-nocturna'));
});

test('plausibility: range and jump', () => {
  assert.equal(judgePrice('lotba.quiniela.min-bet', 200, 150), null);
  assert.match(judgePrice('lotba.quiniela.min-bet', 400, 150), /jump/);
  assert.match(judgePrice('lotba.quiniela.min-bet', 5, null), /outside/);
  assert.match(judgePrice('lotba.loto.price', 4000.5, 4000), /outside/);
});

test('when the feed asks the source', () => {
  const prev = { prices: { a: { until: '2026-11-30' } }, checked: '2026-11-03' };
  assert.equal(dueReason(null, '2026-11-03'), 'no prices yet');
  assert.equal(dueReason(prev, '2026-11-10'), null);
  assert.match(dueReason(prev, '2026-11-25'), /prices end/);
  assert.match(dueReason(prev, '2026-12-01'), /new month/);
});

const doc = (juego, ym, values, problems = {}, changed = []) => ({ juego, ym, sha256: juego + ym, bytes: 1, fetched: ym + '-01T10:00:00Z', file: null, form: '', values, problems, changed });
const NOVDOCS = [doc('QUI', NOV, { 'lotba.quiniela.min-bet': 150, 'lotba.quiniela.big-prize': 2100000, 'lotba.poceada.price': 1700 }), doc('LTO', NOV, { 'lotba.loto.price': 4000 })];
const raw = (today, docs, reason = 'x') => ({ today, reason, docs, missing: [], built: builtCopy() });

test('compute: a new month with moderate changes is published, a jump or a missing price is held with an alert', () => {
  const nov = feed.compute(raw('2026-11-03', NOVDOCS), null);
  assert.equal(nov.prices['lotba.loto.price'].until, '2026-11-30');
  assert.deepEqual(nov.alerts, []);
  assert.deepEqual(nov.expiries.map(x => [x.id, x.until]), [['lotba-precios', '2026-11-30'], ['lotba-quiniela-programa', '2026-11-30'], ['lotba-loto-programa', '2026-11-30']]);
  const dec = feed.compute(raw('2026-11-27', [doc('QUI', '2026-12', { 'lotba.quiniela.min-bet': 200, 'lotba.quiniela.big-prize': 2100000 }, { 'lotba.poceada.price': 'not found' }), doc('LTO', '2026-12', { 'lotba.loto.price': 9000 }, {}, ['lotba.loto.fund'])]), nov);
  assert.deepEqual([dec.prices['lotba.quiniela.min-bet'].value, dec.prices['lotba.quiniela.min-bet'].until], [200, '2026-12-31']);
  assert.deepEqual([dec.prices['lotba.poceada.price'].value, dec.prices['lotba.poceada.price'].until], [1700, '2026-11-30'], 'missing: the last good one stays');
  assert.deepEqual([dec.prices['lotba.loto.price'].value, dec.prices['lotba.loto.price'].until], [4000, '2026-11-30'], 'jump: held');
  assert.deepEqual(dec.alerts.map(a => a.id).sort(), ['changed-loto-programa-2026-12', 'held-lotba.loto.price-2026-12', 'held-lotba.poceada.price-2026-12']);
  assert.equal(dec.confirmed['quiniela-programa'].until, '2026-12-31');
  assert.equal(dec.confirmed['loto-programa'].until, '2026-11-30', 'a changed cited value does not extend the confirmation');
  assert.equal(dec.expiries[0].until, '2026-11-30');
  const later = feed.compute(raw('2026-11-28', [], null), dec);
  assert.deepEqual(later.alerts, dec.alerts, 'not due: the alerts stay listed (sent once)');
  assert.throws(() => feed.compute(raw('2026-11-03', [doc('QUI', NOV, {}, { 'lotba.quiniela.min-bet': 'not found', 'lotba.quiniela.big-prize': 'not found', 'lotba.poceada.price': 'not found' })]), null), /no good price/);
});

test('feed with the real 2026-11 PDFs: prices, saved copies with sha256, December not uploaded; alerts once', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-prc-'));
  const fixtures = join(dir, 'fx'), out = join(dir, 'out'), fxd = join(fixtures, 'precios');
  mkdirSync(fxd, { recursive: true });
  copyFileSync(new URL('data/sources/lottery/_docs/lotba-quiniela-programa-2026-11.pdf', ROOT), join(fxd, 'qui.pdf'));
  copyFileSync(new URL('data/sources/lottery/_docs/lotba-loto-plus-programa-2026-11.pdf', ROOT), join(fxd, 'lto.pdf'));
  copyFileSync(new URL('not-loaded.html', FX), join(fxd, 'no.html'));
  copyFileSync(new URL('data/sources/lottery/_docs/pba-juegos-tradicionales.html', ROOT), join(fxd, 'pba.html'));
  const F = { QUI: 'https://quiniela.loteriadelaciudad.gob.ar/includes/descargaPrograma.php', LTO: 'https://loto.loteriadelaciudad.gob.ar/includes/descargaPrograma.php' };
  const k = (j, m) => F[j] + ' ano=2026&mes=' + m + '&version=1&juego=' + j;
  writeFileSync(join(fxd, 'index.json'), JSON.stringify({ [k('QUI', 11)]: { file: 'qui.pdf', type: 'application/pdf' }, [k('LTO', 11)]: { file: 'lto.pdf', type: 'application/pdf' }, [k('QUI', 12)]: { file: 'no.html', type: 'text/html' }, [k('LTO', 12)]: { file: 'no.html', type: 'text/html' }, 'https://loteria.gba.gob.ar/juegos-tradicionales': { file: 'pba.html', type: 'text/html' } }));
  const quiet = console.log, errs = console.error; console.log = () => {}; console.error = () => {};
  try {
    await main(['--site', 'jugadadeldia', 'precios', '--out', out, '--fixtures', fixtures, '--log', join(dir, 'state/_log.json'), '--now', '2026-11-03T21:00:00Z'], {});
    const p = JSON.parse(readFileSync(join(out, 'precios.json'), 'utf8')).data;
    assert.deepEqual(Object.fromEntries(Object.entries(p.prices).map(([id, x]) => [id, [x.value, x.until]])), { 'lotba.quiniela.min-bet': [150, '2026-11-30'], 'lotba.quiniela.big-prize': [2100000, '2026-11-30'], 'lotba.poceada.price': [1700, '2026-11-30'], 'lotba.loto.price': [4000, '2026-11-30'], 'pba.qplus.price': [1000, '2026-12-13'] });
    assert.equal(p.prices['pba.qplus.price'].kind, 'page');
    assert.equal(p.pages.PBA.checked, '2026-11-03');
    assert.deepEqual(p.pages.PBA.changed, [], 'the other cited values of the PBA page are still there');
    assert.equal(p.links.PBA, 'https://loteria.gba.gob.ar/juegos-tradicionales');
    assert.deepEqual(p.missing, ['QUI 2026-12', 'LTO 2026-12']);
    assert.deepEqual(p.alerts, []);
    const kept = readdirSync(join(dir, 'state/docs')).sort();
    assert.equal(kept.length, 2);
    for (const d of p.docs) { assert.ok(kept.includes(d.file)); assert.match(d.sha256, /^[0-9a-f]{64}$/); }
    assert.ok(!readdirSync(out).some(f => f.endsWith('.pdf')), 'the copies are never in the public folder');
    const h = JSON.parse(readFileSync(join(out, '_health.json'), 'utf8'));
    assert.equal(h.expiries.find(x => x.id === 'lotba-precios').until, '2026-11-30');
    assert.equal(h.expiries.find(x => x.id === 'precio-pba.qplus.price').until, '2026-12-13');
    const withNotice = { ...h, notices: [{ id: 'held-x', text: 'price x held' }] };
    assert.equal(alertsFor(h, withNotice, 'jdd').filter(a => /held/.test(a)).length, 1);
    assert.equal(alertsFor(withNotice, withNotice, 'jdd').filter(a => /held/.test(a)).length, 0);
  } finally { console.log = quiet; console.error = errs; }
});

test('the two programmes cover every cited value of their documents', () => {
  const { facts } = builtCopy();
  assert.deepEqual(Object.keys(DOCS), ['QUI', 'LTO']);
  assert.ok(facts.QUI.length > 30 && facts.LTO.length > 10);
});

const PBA = () => readFileSync(new URL('data/sources/lottery/_docs/pba-juegos-tradicionales.html', ROOT), 'utf8');
test('Quiniela Plus price from the official PBA page: the quote with the amount, one amount, other cited values', () => {
  const r = extractPagePrices('PBA', PBA());
  assert.deepEqual([r.values, r.problems], [{ 'pba.qplus.price': 1000 }, {}]);
  assert.equal(builtCopy().values['pba.qplus.price'], 1000, 'equals the saved copy');
  assert.deepEqual(extractPagePrices('PBA', PBA().replace('apuesta fija de $1000', 'apuesta fija de $1.200')).values, { 'pba.qplus.price': 1200 });
  assert.equal(extractPagePrices('PBA', PBA().replace('apuesta fija de $1000', 'apuesta de $1000')).problems['pba.qplus.price'], 'not found');
  assert.match(extractPagePrices('PBA', PBA() + '<p>Con una apuesta fija de $900, el apostador participa de tres modalidades: Quiniela Plus, Quiniela Super Plus y Quiniela Chance Plus.</p>').problems['pba.qplus.price'], /several/);
  assert.deepEqual(extractPagePrices('QUI', PBA()).values, {}, 'only the prices of that page');
  const { facts } = builtCopy();
  const ok = confirmFacts(facts.PBA, r.text, null, 'PBA');
  assert.deepEqual(ok.changed, []);
  assert.deepEqual(ok.confirmed.sort(), facts.PBA.map(f => f.id).filter(id => !PAGE_PRICES[id]).sort());
  assert.ok(ok.confirmed.includes('pba.qplus.nocturna'));
  const t = extractPagePrices('PBA', PBA().replace('a las 21hs', 'a las 22hs')).text;
  assert.deepEqual(confirmFacts(facts.PBA, t, null, 'PBA').changed, ['pba.qplus.nocturna']);
  assert.match(judgePrice('pba.qplus.price', 5000, 1000), /jump/);
  assert.equal(judgePrice('pba.qplus.price', 1200, 1000), null);
});

test('when the feed reads the PBA page; the page price does not move the LOTBA schedule', () => {
  assert.equal(pageDue(null, '2026-11-03'), 'no page price yet');
  assert.equal(pageDue({ pages: { PBA: { checked: '2026-11-03' } } }, '2026-11-09'), null);
  assert.equal(pageDue({ pages: { PBA: { checked: '2026-11-03' } } }, '2026-11-10'), 'page recheck');
  assert.equal(pageDue({ pages: { PBA: { checked: '2026-11-03' } } }, '2026-11-04', true), 'forced');
  assert.equal(dueReason({ prices: { 'pba.qplus.price': { until: '2026-11-20' } }, checked: '2026-11-03' }, '2026-11-18'), 'no prices yet');
  assert.equal(dueReason({ prices: { 'lotba.loto.price': { until: '2026-11-30' }, 'pba.qplus.price': { until: '2026-11-20' } }, checked: '2026-11-03' }, '2026-11-18'), null);
});

const page = (values, problems = {}, changed = []) => ({ juego: 'PBA', url: 'https://loteria.gba.gob.ar/juegos-tradicionales', reason: 'x', fetched: '2026-11-03T10:00:00Z', sha256: 'p', values, problems, confirmed: [], changed });
test('compute: the page price is valid PAGE_VALID_DAYS after its read; a jump, a failed read or a changed quote alerts and keeps the last good one', () => {
  const nov = feed.compute({ ...raw('2026-11-03', NOVDOCS), pages: [page({ 'pba.qplus.price': 1000 })] }, null);
  assert.deepEqual([nov.prices['pba.qplus.price'].value, nov.prices['pba.qplus.price'].until, nov.prices['pba.qplus.price'].checked], [1000, '2026-12-13', '2026-11-03']);
  assert.equal(PAGE_VALID_DAYS, 40);
  assert.deepEqual(nov.alerts, []);
  assert.equal(nov.expiries.find(x => x.id === 'lotba-precios').until, '2026-11-30', 'the LOTBA expiry stays on the LOTBA prices');
  const later = feed.compute({ ...raw('2026-11-10', [], null), pages: [page({ 'pba.qplus.price': 1200 })] }, nov);
  assert.deepEqual([later.prices['pba.qplus.price'].value, later.prices['pba.qplus.price'].until, later.pages.PBA.checked], [1200, '2026-12-20', '2026-11-10']);
  assert.equal(later.prices['lotba.loto.price'].value, 4000, 'LOTBA prices are kept when only the page was due');
  const jump = feed.compute({ ...raw('2026-11-17', [], null), pages: [page({ 'pba.qplus.price': 9000 })] }, later);
  assert.equal(jump.prices['pba.qplus.price'].value, 1200);
  assert.deepEqual(jump.alerts.map(a => a.id), ['page-PBA-held-pba.qplus.price']);
  const fail = feed.compute({ ...raw('2026-11-18', [], null), pages: [{ juego: 'PBA', url: 'u', reason: 'x', error: 'HTTP 503' }] }, jump);
  assert.deepEqual(fail.alerts.map(a => a.id), ['page-PBA-failed']);
  assert.equal(fail.prices['pba.qplus.price'].until, '2026-12-20');
  const quiet = feed.compute(raw('2026-11-19', [], null), fail);
  assert.deepEqual(quiet.alerts, fail.alerts, 'not due: the page alert stays listed (sent once)');
  const back = feed.compute({ ...raw('2026-11-19', [], null), pages: [page({ 'pba.qplus.price': 1200 }, {}, ['pba.qplus.nocturna'])] }, fail);
  assert.deepEqual(back.alerts.map(a => a.id), ['page-PBA-changed']);
  const dec = feed.compute(raw('2026-12-01', [doc('QUI', '2026-12', { 'lotba.quiniela.min-bet': 160, 'lotba.quiniela.big-prize': 2100000, 'lotba.poceada.price': 1700 }), doc('LTO', '2026-12', { 'lotba.loto.price': 4000 })]), back);
  assert.deepEqual(dec.alerts.map(a => a.id), ['page-PBA-changed'], 'a LOTBA run keeps the page alerts');
  assert.equal(dec.prices['pba.qplus.price'].value, 1200);
});
