// Provincial quinielas (Tucumán, San Juan, Chaco, Corrientes, Misiones) and lotto games (Loto Plus, Telekino, Quini 6, Brinco):
// parsing of the official pages, cross-checks, and fixture runs of both feeds. Fixtures are real answers recorded from our server
// on 2026-11-04 around 06:30 Argentine time (engine/test/fixtures/provincias, engine/test/fixtures/loterias; pages cut down to the
// result blocks). Added 2026-11-05 04:10 Argentine time: the five Chaco pages of Sunday 01-11 (no draw: empty page, files 30-34),
// the Chaco Nocturna of 04-11 (35, the current layout) and the Tucumán day list of Sunday 01-11 (36, empty).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseTucumanDay, parseTucumanRegistro, tucumanIntermediate, parseSanJuan, parseChaco, parseMisiones, parseCorrientes, ProvError } from '../../tools/feeds/jugadadeldia/provincias-parse.mjs';
import { readXlsx } from '../../tools/lib/xlsx.mjs';
import prov, { refCheck, sourceState, isDown, kindOf, corrientesLink } from '../../tools/feeds/jugadadeldia/provincias.mjs';
import lot, { parseLoto, parseTelekino, parseCas, parseMza, pdfBbox, behindOf, LotError } from '../../tools/feeds/jugadadeldia/loterias.mjs';
import { runFeed } from '../../tools/feeds/run.mjs';

const FX = name => new URL('./fixtures/' + name + '/', import.meta.url);
const index = name => JSON.parse(readFileSync(new URL('index.json', FX(name)), 'utf8'));
const body = (name, url) => readFileSync(new URL(index(name)[url].file, FX(name)), 'utf8');
const NOW = '2026-11-04T09:30:00Z';
const TUC = 'https://resultadosquiniela.cajapopular.gov.ar/api/';
const CHA = 'https://loteria.chaco.gov.ar/ver_extracto/';
const MIS = 'https://www.loteriademisiones.com.ar/portal/juegos/';

test('Tucumán: day list, twenty numbers with place = posicion + 1, strict order', () => {
  const day = parseTucumanDay(JSON.parse(body('provincias', TUC + 'extracto/?fecha_sorteo=2026-11-03')), '2026-11-03');
  assert.deepEqual(day.map(x => x.turno), ['NOCT', 'TARD', 'SIES', 'VESP', 'MATU']);
  assert.equal(day[0].sorteo, 18377);
  assert.equal(day[0].time, '22:00');
  const reg = JSON.parse(body('provincias', TUC + 'extracto-registro/?id=18464'));
  const n = parseTucumanRegistro(reg, 18464);
  assert.equal(n[0], '8917');
  assert.equal(n[1], '0189', 'numbers below 1000 get their leading zeros');
  assert.throws(() => parseTucumanRegistro([...reg].reverse(), 18464), /descending/);
  assert.throws(() => parseTucumanRegistro(reg.slice(1), 18464), ProvError);
  assert.throws(() => parseTucumanDay(JSON.parse(body('provincias', TUC + 'extracto/?fecha_sorteo=2026-11-03')), '2026-11-02'), /another date/);
});

test('Tucumán: the pinned intermediate CA is checked before use', () => {
  assert.match(tucumanIntermediate(new Date('2026-11-04')), /BEGIN CERTIFICATE/);
  assert.throws(() => tucumanIntermediate(new Date('2036-04-01')), /not valid/);
});

test('San Juan: one block per turn, only the asked date', () => {
  const p = parseSanJuan(body('provincias', 'https://cas.gob.ar/?fecha=2026-11-03'), '2026-11-03');
  assert.deepEqual(p.draws.map(x => x.turno), ['VESP', 'TARD', 'NOCT']);
  assert.equal(p.draws[2].sorteo, 14065);
  assert.equal(p.draws[2].numbers[0], '6751');
  assert.equal(p.draws[2].numbers[19], '3616');
  const other = parseSanJuan(body('provincias', 'https://cas.gob.ar/?fecha=2026-11-03'), '2026-11-04');
  assert.equal(other.draws.length, 0);
  assert.equal(other.shown, '2026-11-03');
});

test('Chaco: five named columns, Chaqueña and Correntina besides the LOTBA/PBA/Córdoba copies', () => {
  const html = body('provincias', CHA + '03-11-2026/NOC');
  const p = parseChaco(html, '2026-11-03', 'NOCT');
  assert.deepEqual(Object.keys(p.cols).sort(), ['buenos-aires', 'caba', 'chaco', 'cordoba', 'corrientes']);
  assert.equal(p.sorteo, 15377);
  assert.equal(p.cols.chaco[0], '8823');
  assert.equal(p.cols.corrientes[0], '4783');
  assert.equal(p.cols.chaco[19], '2174');
  assert.throws(() => parseChaco(html, '2026-11-03', 'VESP'), /turn title/);
  assert.throws(() => parseChaco(html, '2026-11-02', 'NOCT'), /page date/);
  assert.equal(parseChaco(body('provincias', CHA + '03-11-2026/PRI'), '2026-11-03', 'PRIM').cols.chaco.length, 20, '"La Primera" is the Primera turn');
});

test('Chaco: a page without a draw (Sunday 01-11) is null, a changed empty page throws; the 04-11 layout still parses', () => {
  for (const [c, t] of [['PRE', 'PREV'], ['PRI', 'PRIM'], ['MAT', 'MATU'], ['Ves', 'VESP'], ['NOC', 'NOCT']]) assert.equal(parseChaco(body('provincias', CHA + '01-11-2026/' + c), '2026-11-01', t), null, c);
  const sun = body('provincias', CHA + '01-11-2026/PRE');
  assert.throws(() => parseChaco(sun, '2026-11-02', 'PREV'), /no draw number\/date/, 'an empty page of another date is not a day without draw');
  const rows = sun.replace('<p class="results-number">Ubicación</p>', '<p class="results-number">Ubicación</p><p class="results-number">Chaqueña</p>');
  assert.throws(() => parseChaco(rows, '2026-11-01', 'PREV'), /no draw number\/date/, 'columns without a draw number: changed page');
  const p = parseChaco(body('provincias', CHA + '04-11-2026/NOC'), '2026-11-04', 'NOCT');
  assert.equal(p.sorteo, 15378);
  assert.equal(p.cols.chaco[0], '7248');
  assert.deepEqual(Object.keys(p.cols).sort(), ['buenos-aires', 'caba', 'chaco', 'cordoba', 'corrientes']);
});

test('source health: a changed page is down after 3 runs, no answer after 2 runs and 3 h; an answer clears it', () => {
  const at = h => new Date(Date.parse('2026-11-05T03:19:00Z') + h * 3600e3).toISOString();
  const fmt = [{ kind: 'format', msg: 'Chaco x: no draw number/date' }], net = [{ kind: 'network', msg: 'HTTP 503' }];
  let s = null;
  for (let i = 0; i < 3; i++) { s = sourceState(s, 0, fmt, at(i / 4)); assert.equal(isDown(s, Date.parse(at(i / 4))), i === 2, 'format run ' + (i + 1)); }
  assert.equal(s.since, at(0));
  assert.deepEqual(sourceState(s, 0, [], at(1)), s, 'not asked: unchanged');
  assert.deepEqual(sourceState(s, 2, [], at(1)), { lastOk: at(1) });
  let n = sourceState(sourceState(null, 0, net, at(0)), 1, net, at(1));
  assert.equal(n.kind, 'network');
  assert.ok(!isDown(n, Date.parse(at(1))) && isDown(n, Date.parse(at(3))));
  assert.equal(kindOf(new ProvError('x')), 'format');
  assert.equal(kindOf(Object.assign(new Error('HTTP 404'), { status: 404 })), 'format');
  assert.equal(kindOf(new Error('fetch failed')), 'network');
});

test('Misiones: latest draw of a turn page, Plus column and reference columns', () => {
  const p = parseMisiones(body('provincias', MIS + 'quiniela-nocturna/'), 'NOCT');
  assert.equal(p.date, '2026-11-03');
  assert.equal(p.sorteo, 14255);
  assert.equal(p.cols.misiones[0], '6631');
  assert.equal(p.cols['misiones-plus'][0], '8019');
  assert.deepEqual(Object.keys(p.cols).sort(), ['buenos-aires', 'caba', 'misiones', 'misiones-plus']);
  const q = parseMisiones(body('provincias', MIS + 'quiniela-la-previa/'), 'PREV');
  assert.ok(q.cols['santa-fe'] && !q.cols['misiones-plus']);
  assert.throws(() => parseMisiones(body('provincias', MIS + 'quiniela-nocturna/'), 'VESP'), /another turn/);
});

test('reference check: Chaco columns equal our LOTBA/PBA archive, a changed digit is caught', () => {
  const arch = JSON.parse(readFileSync(new URL('quiniela-archivo.json', FX('provincias')), 'utf8')).data.draws.find(e => e.d === '2026-11-03' && e.t === 'NOCT');
  const ref = Object.fromEntries(Object.entries(arch.j).map(([k, v]) => [k, v[0]]));
  const p = parseChaco(body('provincias', CHA + '03-11-2026/NOC'), '2026-11-03', 'NOCT');
  assert.deepEqual(refCheck(p.cols, ref), { ok: 3, bad: [] });
  const bad = { ...ref, cordoba: '9' + ref.cordoba.slice(1) };
  assert.deepEqual(refCheck(p.cols, bad).bad, ['cordoba']);
  const raw = { today: '2026-11-03', found: [], refs: [{ src: 'cha', ...p }], reference: { '2026-11-03|NOCT': bad }, notes: [], ok: { cha: 1 }, failed: {}, checkedNew: { tuc: [], sj: [], cha: [] }, archive: [{ j: 'tucuman', d: '2026-11-03', t: 'NOCT', s: 1, n: '1'.repeat(80) }], x: [], checked: {} };
  const out = prov.compute(raw, null, { now: new Date(NOW) });
  assert.ok(!out.draws.some(e => e.j === 'chaco'), 'a page whose copies differ is not used');
  assert.equal(out.conflicts.length, 1);
  const held = prov.compute({ ...raw, reference: {} }, null, { now: new Date(NOW) });
  assert.ok(!held.draws.some(e => e.j === 'chaco') && held.notes.some(n => /held back/.test(n)), 'no reference yet: held back');
});

function outWithReference() {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-prov-'));
  const out = join(dir, 'out'), fixtures = join(dir, 'fx');
  mkdirSync(out, { recursive: true });
  cpSync(new URL('quiniela-archivo.json', FX('provincias')), join(out, 'quiniela-archivo.json'));
  cpSync(FX('provincias'), join(fixtures, 'provincias'), { recursive: true });
  cpSync(FX('loterias'), join(fixtures, 'loterias'), { recursive: true });
  return { out, fixtures };
}

test('provincias feed: fixture run publishes six jurisdictions; a day without draw is no failure; a failing source keeps its last good draws, the others publish', async () => {
  const { out, fixtures } = outWithReference();
  const r = await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(r.ok, r.error);
  const d = JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data;
  for (const j of ['tucuman', 'san-juan', 'chaco', 'corrientes', 'misiones', 'misiones-plus']) assert.deepEqual(d.latest[j], { d: '2026-11-03', t: 'NOCT' }, j);
  const chaco = d.draws.find(e => e.j === 'chaco' && e.d === '2026-11-03' && e.t === 'NOCT');
  assert.equal(chaco.n.slice(0, 4), '8823');
  assert.equal(chaco.c, 3);
  assert.equal(d.draws.find(e => e.j === 'misiones' && e.t === 'NOCT').c, 2);
  assert.equal(d.draws.filter(e => e.j === 'tucuman').length, 10);
  assert.deepEqual(d.conflicts, []);
  const a = JSON.parse(readFileSync(join(out, 'provincias-archivo.json'), 'utf8')).data;
  assert.deepEqual(a.checked.tuc, ['2026-11-02', '2026-11-03']);
  assert.deepEqual(d.alerts, []);
  // next run: the backfill day is Sunday 01-11. Tucumán and Chaco answer "no draw" (not a failure, the day is closed); San Juan has
  // no fixture for it (404: a changed address) -> only San Juan fails, the feed still publishes
  const read = () => JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data;
  const r2 = await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(r2.ok, r2.error);
  let e = read();
  assert.deepEqual(e.sources.none, { tuc: ['2026-11-01'], cha: ['2026-11-01 PREV', '2026-11-01 PRIM', '2026-11-01 MATU', '2026-11-01 VESP', '2026-11-01 NOCT'] });
  assert.ok(!e.sources.state.cha.since && !e.sources.state.tuc.since, 'a day without draw is not a failure');
  assert.equal(e.sources.state.sj.runs, 1);
  assert.deepEqual(e.alerts, []);
  assert.ok(!e.jurs.some(J => J.stale));
  const a2 = JSON.parse(readFileSync(join(out, 'provincias-archivo.json'), 'utf8')).data;
  assert.ok(a2.checked.cha.includes('2026-11-01') && a2.checked.tuc.includes('2026-11-01') && !a2.checked.sj.includes('2026-11-01'));
  // San Juan keeps failing: down on the 3rd run in a row -> one alert naming the source and why; only San Juan is marked stale
  for (let i = 0; i < 2; i++) assert.ok((await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' })).ok);
  e = read();
  assert.equal(e.sources.state.sj.runs, 3);
  assert.equal(e.alerts.length, 1);
  assert.match(e.alerts[0].id, /^prov-sj-/);
  assert.match(e.alerts[0].text, /San Juan \(CAS\) failing since .*page changed.*fixture missing.*San Juan 2026-11-03 NOCT/);
  assert.deepEqual(e.jurs.filter(J => J.stale).map(J => J.id), ['san-juan']);
  for (const j of ['tucuman', 'san-juan', 'chaco', 'corrientes', 'misiones', 'misiones-plus']) assert.deepEqual(e.latest[j], { d: '2026-11-03', t: 'NOCT' }, j);
});

test('provincias feed: the 05-11 night (only Sunday Chaco pages asked) publishes with no failure', async () => {
  const { out, fixtures } = outWithReference();
  assert.ok((await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' })).ok);
  const f = join(out, 'provincias-archivo.json'), doc = JSON.parse(readFileSync(f, 'utf8'));
  const past = Array.from({ length: 21 }, (_, i) => new Date(Date.parse('2026-11-03T12:00:00Z') - i * 864e5).toISOString().slice(0, 10)).sort();
  for (const s of ['tuc', 'sj']) doc.data.checked[s] = past;
  doc.data.checked.cha = past.filter(d => d !== '2026-11-01');
  writeFileSync(f, JSON.stringify(doc));
  const r = await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(r.ok, r.error);
  assert.equal(r.requests, 5);
  const d = JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data;
  assert.deepEqual(d.sources.failed, {});
  assert.equal(d.sources.none.cha.length, 5);
  assert.ok(JSON.parse(readFileSync(f, 'utf8')).data.checked.cha.includes('2026-11-01'));
});

test('lotto parsers: LOTBA Loto Plus with prizes, Telekino site, San Juan CAS copies', () => {
  const L = parseLoto(body('loterias', 'https://loto.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=3931'), 3931);
  assert.equal(L.d, '2026-10-31');
  assert.deepEqual(L.mods.tradicional, ['02', '08', '20', '24', '30', '40']);
  assert.equal(L.plus, '6');
  assert.ok(L.prizes.some(p => p.mod === 'Tradicional' && p.hits === 5 && p.winners === 12));
  assert.equal(parseLoto(body('loterias', 'https://loto.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=3932'), 3932), null);
  const T = parseTelekino(body('loterias', 'https://www.telekino.com.ar/'));
  assert.equal(T.s, 2452);
  assert.equal(T.mods.telekino.length, 15);
  const C = parseCas(body('loterias', 'https://cas.gob.ar/juegos/sorteos/resultados?juego=telekino'), 'telekino');
  assert.deepEqual(C.mods, T.mods, 'Telekino site and CAS agree');
  const Q = parseCas(body('loterias', 'https://cas.gob.ar/juegos/sorteos/resultados?juego=quini6'), 'quini-6');
  assert.equal(Q.s, 3421);
  assert.deepEqual(Object.keys(Q.mods).sort(), ['revancha', 'segunda', 'siempre-sale', 'tradicional']);
  assert.equal(Q.prev, '2026-10-25');
  assert.throws(() => parseCas(body('loterias', 'https://cas.gob.ar/juegos/sorteos/resultados?juego=quini6'), 'brinco'), LotError);
  assert.deepEqual(behindOf('quini-6', '2026-10-28', '2026-11-04', '06:30'), { behind: 1, expected: '2026-11-01' });
  assert.deepEqual(behindOf('quini-6', '2026-10-28', '2026-11-04', '23:45'), { behind: 2, expected: '2026-11-04' });
});

test('loterias feed: fixture run, two copies agree; a differing copy drops the draw', async () => {
  const { out, fixtures } = outWithReference();
  const r = await runFeed(lot, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(r.ok, r.error);
  const d = JSON.parse(readFileSync(join(out, 'loterias.json'), 'utf8')).data;
  assert.equal(d.games['loto-plus'].latest.s, 3931);
  assert.equal(d.games['loto-plus'].draws[0].src, 'CL');
  assert.equal(d.games.telekino.draws[0].src, 'CT');
  assert.equal(d.games['quini-6'].behind, 1);
  assert.equal(d.games.brinco.latest.d, '2026-10-25');
  const raw = { today: '2026-11-04', now: '06:30', notes: [], next: {}, got: [{ src: 'L', ...parseLoto(body('loterias', 'https://loto.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=3931'), 3931) }] };
  const C = parseCas(body('loterias', 'https://cas.gob.ar/juegos/sorteos/resultados?juego=loto'), 'loto-plus');
  C.mods.match = ['01', '14', '16', '19', '27', '42'];
  raw.got.push({ src: 'C', ...C }, { src: 'T', ...parseTelekino(body('loterias', 'https://www.telekino.com.ar/')) });
  const x = lot.compute(raw, null);
  assert.equal(x.games['loto-plus'].draws.length, 0);
  assert.equal(x.conflicts[0].s, 3931);
  assert.ok(d.notes.some(n => n.startsWith('IPJyC quini-6')), 'the IPJyC copy is asked for (no fixture of 04.11: noted, the feed goes on)');
  assert.deepEqual(d.alerts, [], 'one missing draw is no alert');
});

// IPJyC Mendoza copies of the Lotería de Santa Fe extract PDFs, recorded 2026-11-19 05:50 Argentine time from this repository's
// machine (pdftotext -bbox of ipjycweb.mendoza.gov.ar/userfiles/file/quini6.pdf and brinco.pdf, both of the draws of 15-11).
const MZA_Q6 = () => readFileSync(new URL('14-ipjyc-quini6-3426.bbox.html', FX('loterias')), 'utf8');
const MZA_BR = () => readFileSync(new URL('15-ipjyc-brinco-1380.bbox.html', FX('loterias')), 'utf8');

test('lotto parsers: IPJyC Mendoza copy of the Santa Fe extract (Quini 6, Brinco), by the boxes of the words', () => {
  const Q = parseMza(MZA_Q6(), 'quini-6');
  assert.equal(Q.s, 3426);
  assert.equal(Q.d, '2026-11-15');
  assert.deepEqual(Q.mods, { tradicional: ['01', '02', '10', '13', '38', '39'], segunda: ['11', '17', '19', '21', '27', '28'], revancha: ['01', '16', '27', '33', '37', '40'], 'siempre-sale': ['01', '02', '24', '33', '38', '43'] });
  const B = parseMza(MZA_BR(), 'brinco');
  assert.deepEqual([B.s, B.d], [1380, '2026-11-15']);
  assert.deepEqual(B.mods, { tradicional: ['06', '09', '16', '28', '33', '34'], junior: ['01', '03', '11', '25', '28', '36'] });
  assert.throws(() => parseMza(MZA_Q6(), 'brinco'), /not the extract of Brinco/, 'a swapped file is refused');
  assert.throws(() => parseMza(MZA_BR(), 'quini-6'), LotError);
  assert.throws(() => parseMza(MZA_Q6().replace(/>REVANCHA</, '>OTRA<'), 'quini-6'), LotError, 'a missing heading stops the parse');
  assert.throws(() => parseMza(MZA_Q6().replace(/(yMax="415\.\d+">)40</, '$1'), 'quini-6'), /expected 6 numbers/, 'a row with a missing ball stops');
  assert.throws(() => parseMza(MZA_Q6().replace('15/11/2026', '15-11'), 'quini-6'), /no draw number\/date/);
  assert.throws(() => parseMza('', 'quini-6'), /no text/);
  assert.throws(() => pdfBbox(Buffer.from('<html>403</html>')), /not a PDF/);
});

test('loterias: the IPJyC copy brings Quini 6 and Brinco up to date, agrees with or conflicts with CAS, and lagging games raise alerts', async () => {
  const { out, fixtures } = outWithReference();
  const r = await runFeed(lot, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(r.ok, r.error);
  const prev = JSON.parse(readFileSync(join(out, 'loterias.json'), 'utf8')).data;
  const mza = { src: 'M', ...parseMza(MZA_Q6(), 'quini-6') }, mzb = { src: 'M', ...parseMza(MZA_BR(), 'brinco') };
  const raw = { today: '2026-11-19', now: '05:50', notes: [], next: {}, got: [mza, mzb] };
  const x = lot.compute(raw, prev);
  assert.deepEqual(x.games['quini-6'].latest, { s: 3426, d: '2026-11-15' });
  assert.deepEqual([x.games['quini-6'].behind, x.games['quini-6'].expected], [1, '2026-11-18'], 'the draw of 18-11 is not in the copy yet');
  assert.deepEqual([x.games.brinco.latest.s, x.games.brinco.behind], [1380, 0]);
  assert.equal(x.games['quini-6'].draws[0].src, 'M');
  assert.equal(x.games['quini-6'].draws[1].s, 3421, 'the older CAS draws stay');
  assert.deepEqual(x.alerts.map(a => a.id).sort(), ['lot-behind-loto-plus', 'lot-behind-telekino'], 'only the games still behind 2+ draws');
  const tk = x.alerts.find(a => a.id === 'lot-behind-telekino').params;
  assert.deepEqual([tk.behind, tk.s, tk.first, tk.expected, tk.level], [2, 2452, '2026-11-08', '2026-11-15', 'yellow']);
  assert.equal(x.alerts.find(a => a.id === 'lot-behind-loto-plus').params.level, 'red');
  const before = lot.compute({ ...raw, got: [] }, prev);
  assert.deepEqual(before.alerts.map(a => a.id).sort(), ['lot-behind-brinco', 'lot-behind-loto-plus', 'lot-behind-quini-6', 'lot-behind-telekino'], 'without the IPJyC copy all four lag');
  const cas = { ...mza, src: 'C', mods: { ...mza.mods } };
  const both = lot.compute({ ...raw, got: [mza, cas] }, prev);
  assert.equal(both.games['quini-6'].draws[0].src, 'CM', 'two official copies agree');
  const differ = lot.compute({ ...raw, got: [mza, { ...cas, mods: { ...cas.mods, revancha: ['01', '16', '27', '33', '37', '41'] } }] }, prev);
  assert.equal(differ.games['quini-6'].latest.s, 3421, 'copies differ: the draw is not published');
  assert.ok(differ.conflicts.some(c => c.g === 'quini-6' && c.s === 3426));
});

// Corrientes press workbook (engine/test/fixtures/provincias-cor, recorded from our server on 2026-11-21 around 00:50 Argentine time,
// during the Lotería Chaqueña outage of 20-11): "EXTRACTO NOCTURNO.xlsx" linked from loteriacorrentina.gob.ar/juegos/quiniela, cut
// to the workbook, the strings and the one sheet with values (images, styles and empty cells removed).
const COR_FX = FX('provincias-cor');
const corBook = () => readFileSync(new URL('nocturno-2026-11-20.xlsx', COR_FX));
const corRef = () => Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL('quiniela-archivo.json', COR_FX), 'utf8')).data.draws[0].j).map(([k, v]) => [k, v[0]]));

test('Corrientes workbook: seven columns, both blocks agree, the five reference columns equal our LOTBA/PBA archive', () => {
  const p = parseCorrientes(readXlsx(corBook()));
  assert.equal(p.date, '2026-11-20');
  assert.equal(p.turno, 'NOCT');
  assert.equal(p.sorteo, 17967);
  assert.equal(p.hour, '21:00');
  assert.equal(p.blocks, 2);
  assert.deepEqual(Object.keys(p.cols).sort(), ['buenos-aires', 'caba', 'chaco', 'cordoba', 'corrientes', 'entre-rios', 'santa-fe']);
  assert.deepEqual(p.cols.corrientes.slice(0, 3), ['4382', '5194', '0765']);
  assert.equal(p.cols.corrientes[19], '0249', 'place 20 has a label without the degree sign in the file');
  assert.deepEqual(p.cols.chaco.slice(0, 3), ['4908', '1392', '0273']);
  assert.deepEqual(refCheck(p.cols, corRef()), { ok: 5, bad: [] });
  assert.equal(corrientesLink(readFileSync(new URL('quiniela.html', COR_FX), 'utf8')), 'https://www.loteriacorrentina.gob.ar/_files/ugd/e7f41c_622ab22512d64c1a8e4089fe30511534.xlsx?dn=EXTRACTO%2520NOCTURNO.xlsx');
  assert.throws(() => corrientesLink('<a href="/_files/ugd/x.xlsx?dn=POCEADA%2520CORRENTINA.xlsx">'), ProvError);
  const sheets = readXlsx(corBook());
  const cells = sheets[0].cells, ref = Object.keys(cells).find(k => cells[k] === p.cols.chaco[0] && /^U/.test(k));
  cells[ref] = '1111';
  assert.throws(() => parseCorrientes(sheets), /blocks of the sheet differ/);
  assert.throws(() => parseCorrientes([{ name: 'x', cells: { A1: 'MATUTINA' } }]), ProvError);
});

function corRun() {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-cor-'));
  const out = join(dir, 'out'), fixtures = join(dir, 'fx');
  mkdirSync(out, { recursive: true });
  cpSync(new URL('quiniela-archivo.json', COR_FX), join(out, 'quiniela-archivo.json'));
  cpSync(COR_FX, join(fixtures, 'provincias'), { recursive: true });
  return { out, fixtures };
}

test('provincias feed: while the Chaco page does not answer, the Corrientes workbook brings the Nocturna of Chaco and Corrientes', async () => {
  const { out, fixtures } = corRun();
  const NIGHT = '2026-11-21T03:00:00Z';
  const r = await runFeed(prov, { out, fixtures, now: new Date(NIGHT), ua: 'test' });
  assert.ok(r.ok, r.error);
  const d = JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data;
  const ch = d.draws.find(e => e.j === 'chaco' && e.d === '2026-11-20' && e.t === 'NOCT'), co = d.draws.find(e => e.j === 'corrientes' && e.d === '2026-11-20' && e.t === 'NOCT');
  assert.equal(ch.n.slice(0, 12), '490813920273');
  assert.equal(co.n.slice(0, 12), '438251940765');
  for (const e of [ch, co]) { assert.equal(e.v, 'cor'); assert.equal(e.c, 5); assert.ok(!('s' in e), 'the workbook number is the Correntina one: not used'); }
  assert.ok(d.sources.ok.cor >= 1 && d.sources.failed.cha >= 1, 'Chaco fails, the workbook answers');
  assert.deepEqual(d.jurs.find(J => J.id === 'corrientes').alt.turnos, ['NOCT']);
  // the next run has the night: the workbook is not asked again
  const r2 = await runFeed(prov, { out, fixtures, now: new Date(NIGHT), ua: 'test' });
  assert.ok(r2.ok, r2.error);
  assert.ok(!JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data.sources.ok.cor);
});

test('provincias: the Chaco page later fills the draw number of a workbook draw; a page that differs from the workbook drops the draw', () => {
  const p = parseCorrientes(readXlsx(corBook()));
  const ref = { '2026-11-20|NOCT': corRef() };
  const base = { today: '2026-11-21', found: [], notes: [], ok: { cor: 1 }, failed: {}, checkedNew: { tuc: [], sj: [], cha: [] }, x: [], checked: {}, reference: ref };
  const first = prov.compute({ ...base, refs: [{ src: 'cor', ...p }], archive: [] }, null, { now: new Date('2026-11-21T03:00:00Z') });
  const arch = first.__files['provincias-archivo'].draws;
  const page = { src: 'cha', date: '2026-11-20', turno: 'NOCT', sorteo: 15392, cols: { caba: p.cols.caba, 'buenos-aires': p.cols['buenos-aires'], cordoba: p.cols.cordoba, chaco: p.cols.chaco, corrientes: p.cols.corrientes } };
  const later = prov.compute({ ...base, ok: { cha: 1 }, refs: [page], archive: arch }, null, { now: new Date('2026-11-21T12:00:00Z') });
  assert.equal(later.draws.find(e => e.j === 'chaco' && e.t === 'NOCT').s, 15392);
  const other = { ...page, cols: { ...page.cols, chaco: ['9999', ...p.cols.chaco.slice(1)] } };
  const bad = prov.compute({ ...base, ok: { cha: 1 }, refs: [other], archive: arch }, null, { now: new Date('2026-11-21T12:00:00Z') });
  assert.ok(!bad.draws.some(e => e.j === 'chaco' && e.d === '2026-11-20' && e.t === 'NOCT'));
  assert.match(bad.conflicts.find(c => c.j === 'chaco').why, /Chaco page and Corrientes workbook differ/);
});
