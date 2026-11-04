// Quiniela feed: parsing of the official LOTBA and PBA extracts, validation, cross-check, frequency, and the runner contract
// (last good data stays on failure). Fixtures are real answers of 2026-11-02/03 (engine/test/fixtures/quiniela).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLotba, lotbaLatest, parsePbaText, frequency, chiSquareP, checkTwenty, ExtractError } from '../lottery/extract.mjs';
import feed from '../../tools/feeds/jugadadeldia/quiniela.mjs';
import { main, alertsFor } from '../../tools/feeds/run.mjs';

const FX = new URL('./fixtures/quiniela/', import.meta.url);
const fx = f => readFileSync(new URL(f, FX), 'utf8');

test('LOTBA: one draw, six jurisdictions, 20 numbers each', () => {
  const d = parseLotba(fx('lotba-53116.js'), 53116);
  assert.equal(d.date, '2026-11-02');
  assert.equal(d.turno, 'NOCT');
  assert.deepEqual(Object.keys(d.jur).sort(), ['buenos-aires', 'caba', 'cordoba', 'entre-rios', 'mendoza', 'santa-fe']);
  assert.equal(d.jur.caba[0], '2875');
  for (const l of Object.values(d.jur)) checkTwenty(l, 'x');
  assert.equal(parseLotba('window.RESULTADOS_DATA = [];window.POZO_ULTIMO_SORTEO = 0;', 53119), null);
  assert.throws(() => parseLotba(fx('lotba-53116.js'), 53117), ExtractError);
  assert.equal(lotbaLatest(fx('lotba-home.html')), 53118);
});

test('LOTBA: a partly published jurisdiction is held back', () => {
  const t = fx('lotba-53118.js').replace('"val":"3937"', '"val":"39"');
  const d = parseLotba(t, 53118);
  assert.ok(d.missing.includes('caba'));
  assert.ok(!d.jur.caba);
});

test('PBA PDF text: five columns, places in order, head equals place 1', () => {
  const p = parsePbaText(fx('pba-nocturna-2026-11-02.txt'), { date: '2026-11-02', turno: 'NOCT' });
  assert.equal(p.time, '21:00');
  assert.equal(p.sorteo, 12904);
  assert.deepEqual(Object.keys(p.jur).sort(), ['buenos-aires', 'caba', 'cordoba', 'entre-rios', 'santa-fe']);
  const l = parseLotba(fx('lotba-53116.js'), 53116);
  for (const id of Object.keys(p.jur)) assert.deepEqual(p.jur[id], l.jur[id], id + ': LOTBA and PBA copies agree');
  assert.throws(() => parsePbaText(fx('pba-nocturna-2026-11-02.txt'), { date: '2026-11-03' }), /date/);
  assert.throws(() => parsePbaText(fx('pba-vespertina-2026-11-02.txt'), { turno: 'NOCT' }), /turn/);
  assert.throws(() => parsePbaText(fx('pba-vespertina-2026-11-02.txt').replace(/ 2978 /, ' 2979 ')), ExtractError);
  assert.throws(() => parsePbaText('QUINIELA\n02/11/2026\n'), ExtractError);
});

test('frequency and chi-square tail', () => {
  const draws = Array.from({ length: 100 }, (_, i) => ({ jur: { x: Array.from({ length: 20 }, (_, k) => String(1000 + ((i + k) % 100)).padStart(4, '0')) } }));
  const f = frequency(draws, 'x');
  assert.equal(f.draws, 100);
  assert.equal(f.head.reduce((a, b) => a + b), 100);
  assert.ok(f.head.every(v => v === 1));
  assert.equal(f.chiHead, 0);
  assert.ok(Math.abs(chiSquareP(99, 99) - 0.4811) < 0.002);
  assert.ok(Math.abs(chiSquareP(123.225, 99) - 0.05) < 0.002);
  assert.ok(Math.abs(chiSquareP(3.841, 1) - 0.05) < 0.001);
});

const raw = (lotba, pba, archive = []) => ({ today: '2026-11-02', lotba, pba, notes: [], gaps: [], floor: 0, archive });

test('compute: agreeing copies become "LP", a differing one is dropped and remembered', () => {
  const l = parseLotba(fx('lotba-53116.js'), 53116);
  const p = parsePbaText(fx('pba-nocturna-2026-11-02.txt'));
  const out = feed.compute(raw([l], [p]), null, { now: new Date('2026-11-02T23:00:00Z') });
  const e = out.draws.find(x => x.t === 'NOCT');
  assert.equal(e.j.caba[1], 'LP');
  assert.equal(e.j.mendoza[1], 'L');
  assert.equal(e.h, '21:00');
  const p2 = JSON.parse(JSON.stringify(p));
  p2.jur.cordoba[5] = '0000';
  const out2 = feed.compute(raw([l], [p2]), null, { now: new Date('2026-11-02T23:00:00Z') });
  const e2 = out2.draws.find(x => x.t === 'NOCT');
  assert.ok(!e2.j.cordoba);
  assert.deepEqual(e2.x, ['cordoba']);
  assert.equal(out2.conflicts.length, 1);
  const out3 = feed.compute(raw([l], [], out2.__files['quiniela-archivo'].draws), null, { now: new Date() });
  assert.ok(!out3.draws.find(x => x.t === 'NOCT').j.cordoba, 'a dropped jurisdiction does not come back from LOTBA alone');
  assert.ok(out.__files['quiniela-frecuencia'].freq.caba.draws >= 1);
});

test('validate: draws in the future and out of order stop the run', () => {
  const l = parseLotba(fx('lotba-53116.js'), 53116);
  assert.throws(() => feed.validate({ ...raw([l], []), today: '2026-11-01' }), /future/);
  const m = parseLotba(fx('lotba-53118.js'), 53118);
  assert.throws(() => feed.validate({ ...raw([{ ...m, sorteo: 53115 }, l], []), today: '2026-11-03' }), /order/);
  assert.throws(() => feed.validate(raw([], [])), /no source/);
});

test('runner: fixtures run writes the feed and health; a failing run keeps the last good file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-feeds-'));
  const fixtures = join(dir, 'fx'), out = join(dir, 'out');
  mkdirSync(join(fixtures, 'quiniela'), { recursive: true });
  const L = 'https://quiniela.loteriadelaciudad.gob.ar/';
  const index = { [L]: 'home.html', [L + 'includes/resultados-data.php?sorteo=53116']: 'd16.js', [L + 'includes/resultados-data.php?sorteo=53117']: 'empty.js', [L + 'includes/resultados-data.php?sorteo=53118']: 'empty.js', 'https://loteria.gba.gob.ar/api-loteria/extractos/2026-11-02': { status: 403 } };
  for (let n = 53115; n > 53116 - 12; n--) index[L + 'includes/resultados-data.php?sorteo=' + n] = 'empty.js';
  for (let n = 53104; n > 53104 - 60; n--) index[L + 'includes/resultados-data.php?sorteo=' + n] = 'empty.js';
  writeFileSync(join(fixtures, 'quiniela/index.json'), JSON.stringify(index));
  writeFileSync(join(fixtures, 'quiniela/home.html'), '<script src="includes/resultados-data.php?sorteo=53116"></script>');
  writeFileSync(join(fixtures, 'quiniela/d16.js'), fx('lotba-53116.js'));
  writeFileSync(join(fixtures, 'quiniela/empty.js'), 'window.RESULTADOS_DATA = [];window.POZO_ULTIMO_SORTEO = 0;');
  cpSync(new URL('./fixtures/programa/', import.meta.url), join(fixtures, 'programa'), { recursive: true });
  cpSync(new URL('./fixtures/provincias/', import.meta.url), join(fixtures, 'provincias'), { recursive: true });
  cpSync(new URL('./fixtures/loterias/', import.meta.url), join(fixtures, 'loterias'), { recursive: true });
  const pr = join(fixtures, 'precios'), DOC = new URL('../../data/sources/lottery/_docs/', import.meta.url);
  mkdirSync(pr, { recursive: true });
  cpSync(new URL('lotba-quiniela-programa-2026-11.pdf', DOC), join(pr, 'qui.pdf'));
  cpSync(new URL('lotba-loto-plus-programa-2026-11.pdf', DOC), join(pr, 'lto.pdf'));
  cpSync(new URL('./fixtures/programa/not-loaded.html', import.meta.url), join(pr, 'no.html'));
  const PF = j => 'https://' + (j === 'QUI' ? 'quiniela' : 'loto') + '.loteriadelaciudad.gob.ar/includes/descargaPrograma.php ano=2026&mes=';
  writeFileSync(join(pr, 'index.json'), JSON.stringify({ [PF('QUI') + '11&version=1&juego=QUI']: { file: 'qui.pdf', type: 'application/pdf' }, [PF('LTO') + '11&version=1&juego=LTO']: { file: 'lto.pdf', type: 'application/pdf' }, [PF('QUI') + '12&version=1&juego=QUI']: { file: 'no.html', type: 'text/html' }, [PF('LTO') + '12&version=1&juego=LTO']: { file: 'no.html', type: 'text/html' } }));
  const quiet = console.log; console.log = () => {};
  const errs = console.error; console.error = () => {};
  try {
    const rc = await main(['--site', 'jugadadeldia', '--out', out, '--fixtures', fixtures, '--log', join(dir, 'state/_log.json'), '--now', '2026-11-02T23:30:00Z'], {});
    assert.equal(rc, 0);
    const q = JSON.parse(readFileSync(join(out, 'quiniela.json'), 'utf8'));
    assert.equal(q.data.draws.at(-1).j.caba[0].slice(0, 4), '2875');
    assert.ok(q.data.notes.some(n => n.includes('PBA')));
    assert.ok(existsSync(join(out, 'quiniela-archivo.json')) && existsSync(join(out, 'quiniela-frecuencia.json')));
    writeFileSync(join(fixtures, 'quiniela/home.html'), 'broken');
    index[L + 'includes/resultados-data.php?sorteo=53116'] = { status: 500 };
    writeFileSync(join(fixtures, 'quiniela/index.json'), JSON.stringify(index));
    const rc2 = await main(['--site', 'jugadadeldia', '--out', out, '--fixtures', fixtures, '--log', join(dir, 'state/_log.json'), '--now', '2026-11-03T05:00:00Z'], {});
    const h = JSON.parse(readFileSync(join(out, '_health.json'), 'utf8'));
    assert.equal(h.feeds.quiniela.consecutiveFailures, 1, 'no source answered: the run fails');
    assert.equal(rc2, 1, 'and the data is older than maxAgeHours');
    assert.equal(JSON.parse(readFileSync(join(out, 'quiniela.json'), 'utf8')).data.draws.at(-1).j.caba[0].slice(0, 4), '2875');
  } finally { console.log = quiet; console.error = errs; }
});

test('alerts only on state changes', () => {
  const a = { feeds: { q: { stale: false } } }, b = { feeds: { q: { stale: true, ageHours: 4, maxAgeHours: 3, lastError: null } } };
  assert.equal(alertsFor(a, b, 'jdd').length, 1);
  assert.equal(alertsFor(b, b, 'jdd').length, 0);
  assert.match(alertsFor(b, a, 'jdd')[0], /recovered/);
});
