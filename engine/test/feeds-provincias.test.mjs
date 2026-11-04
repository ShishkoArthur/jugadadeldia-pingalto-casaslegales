// Provincial quinielas (Tucumán, San Juan, Chaco, Corrientes, Misiones) and lotto games (Loto Plus, Telekino, Quini 6, Brinco):
// parsing of the official pages, cross-checks, and fixture runs of both feeds. Fixtures are real answers recorded from our server
// on 2026-11-04 around 06:30 Argentine time (engine/test/fixtures/provincias, engine/test/fixtures/loterias; pages cut down to the
// result blocks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseTucumanDay, parseTucumanRegistro, tucumanIntermediate, parseSanJuan, parseChaco, parseMisiones, ProvError } from '../../tools/feeds/jugadadeldia/provincias-parse.mjs';
import prov, { refCheck } from '../../tools/feeds/jugadadeldia/provincias.mjs';
import lot, { parseLoto, parseTelekino, parseCas, behindOf, LotError } from '../../tools/feeds/jugadadeldia/loterias.mjs';
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

test('provincias feed: fixture run publishes six jurisdictions; a failing run keeps the last good file', async () => {
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
  // next run: only backfill days without fixtures are asked -> every source fails -> the run fails, the file stays
  const r2 = await runFeed(prov, { out, fixtures, now: new Date(NOW), ua: 'test' });
  assert.ok(!r2.ok && /all provincial sources failed/.test(r2.error), r2.error);
  assert.equal(JSON.parse(readFileSync(join(out, 'provincias.json'), 'utf8')).data.latest.tucuman.d, '2026-11-03');
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
});
