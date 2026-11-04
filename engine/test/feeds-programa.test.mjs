// LOTBA draw programme feed (/quiniela/horarios/) and the expiry list of the health report. Fixtures: the real programme of
// 2026-11 (engine/test/fixtures/programa: text of both versions, the PDF of the simple version, the "not loaded yet" notice).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseProgramText, validateMonth, mergeVersions, joinMonths, checkAgainstArchive, formAnswer, nextYm, monthEnd, ProgramError } from '../lottery/programa.mjs';
import feed, { dueReason } from '../../tools/feeds/jugadadeldia/programa.mjs';
import fuentes, { sourceExpiries, readSets, GAME_MAX_AGE } from '../../tools/feeds/jugadadeldia/fuentes.mjs';
import { GAME_MAX_AGE as SITE_GAME_MAX_AGE } from '../../sites/jugadadeldia/content/sources.mjs';
import { main, buildHealth, alertsFor, expiriesOf } from '../../tools/feeds/run.mjs';

const FX = new URL('./fixtures/programa/', import.meta.url);
const fx = f => readFileSync(new URL(f, FX), 'utf8');
const NOV = '2026-11';
const full = () => parseProgramText(fx('202611QUI1.txt'), NOV);
const simple = () => parseProgramText(fx('202611QUI0.txt'), NOV);
const clone = rows => rows.map(r => ({ ...r, j: [...r.j] }));
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

test('programme text: both versions of 2026-11, split type words, jurisdictions', () => {
  const a = full(), b = simple();
  assert.equal(a.length, 50, 'completa: only its first diagram sheet is text');
  assert.equal(b.length, 125, 'simple: the whole month');
  assert.deepEqual(a[0], { n: 53112, d: '2026-11-02', t: '10:15', type: 'La Previa', j: [1, 2, 3, 4, 6, 7] });
  assert.deepEqual(b[2], { n: 53114, d: '2026-11-02', t: '15:00', type: 'Matutina', j: [1, 2, 3, 4, 6, 7] }, '"MAT UT INA" is Matutina');
  assert.deepEqual(b.find(r => r.n === 53141).j, [1, 2, 3, 4, 5, 6, 7], 'Uruguay on the Saturday Nocturna');
  assert.deepEqual(validateMonth(a, NOV), { from: '2026-11-02', to: '2026-11-12' });
  assert.deepEqual(validateMonth(b, NOV), { from: '2026-11-02', to: '2026-11-30' });
  assert.ok(!b.some(r => new Date(r.d + 'T12:00:00Z').getUTCDay() === 0), 'no Sunday draws');
});

test('programme text: wrong month, no diagram, unknown row layout and type stop the parse', () => {
  assert.throws(() => parseProgramText(fx('202611QUI0.txt'), '2026-12'), /DICIEMBRE 2026/);
  assert.throws(() => parseProgramText('NOVIEMBRE 2026 nothing', NOV), /DIAGRAMA/);
  const t = fx('202611QUI0.txt');
  assert.throws(() => parseProgramText(t.replace('53113    2/11/2026     12:00', '53113    2/11/2026     12h00'), NOV), /unknown row layout/);
  assert.throws(() => parseProgramText(t.replace(/LA PRIMERA/, 'LA SEGUNDA'), NOV), /unknown draw type/);
  assert.throws(() => parseProgramText(t.replace('53112    2/11/2026', '53112    31/11/2026'), NOV), /bad date/);
});

test('programme checks: numbering, dates, order, Ciudad in every draw, gaps', () => {
  const b = simple();
  const bad = (f, re) => { const r = clone(b); f(r); assert.throws(() => validateMonth(r, NOV), re); };
  bad(r => r.splice(10, 1), /not consecutive/);
  bad(r => { r[0].d = '2026-10-31'; }, /outside the month/);
  bad(r => { r[3].t = '09:00'; }, /time not after/);
  bad(r => { r[1].type = 'La Previa'; }, /same day/);
  bad(r => { r[0].j = [2, 3]; }, /Ciudad/);
  bad(r => { r[0].j = [1, 3, 2]; }, /jurisdiction codes/);
  bad(r => { r[0].type = 'Siesta'; }, /unknown type/);
  bad(r => { for (const x of r) if (x.n > 53161) x.d = addDays(x.d, 5); }, /no draws from 2026-11-12/);
  assert.throws(() => validateMonth(b.slice(0, 10), NOV), /at least 20/);
});

test('two versions: the completa wins, the simple fills the rest only when they agree', () => {
  const m = mergeVersions(full(), simple(), NOV);
  assert.equal(m.rows.length, 125);
  assert.deepEqual(m.used, ['completa', 'simple']);
  assert.deepEqual(m.notes, []);
  const s = clone(simple()); s[5].j = [1, 2];
  const c = mergeVersions(full(), s, NOV);
  assert.equal(c.rows.length, 50, 'they disagree: completa only');
  assert.match(c.notes[0], /differs/);
  assert.equal(mergeVersions(null, simple(), NOV).rows.length, 125);
  assert.equal(mergeVersions(null, null, NOV), null);
});

// a December programme that continues November (synthetic: same weekly pattern, next numbers)
function december(nov, shift = 0) {
  const last = nov[nov.length - 1];
  const out = [];
  let n = last.n + 1 + shift;
  for (let d = '2026-12-01'; d <= '2026-12-31'; d = addDays(d, 1)) {
    if (new Date(d + 'T12:00:00Z').getUTCDay() === 0) continue;
    for (const r of nov.filter(x => x.d === '2026-11-02')) out.push({ ...r, n: n++, d, j: [...r.j] });
  }
  return out;
}

test('months join with continuous numbering', () => {
  const nov = simple();
  const rows = joinMonths([{ ym: '2026-12', rows: december(nov) }, { ym: NOV, rows: nov }]);
  assert.equal(rows[0].d, '2026-11-02');
  assert.equal(rows.at(-1).d, '2026-12-31');
  assert.throws(() => joinMonths([{ ym: NOV, rows: nov }, { ym: '2026-12', rows: december(nov, 3) }]), /starts at draw/);
  assert.equal(nextYm('2026-12'), '2027-01');
  assert.equal(monthEnd('2028-02'), '2028-02-29');
});

test('programme against the draws that happened', () => {
  const rows = simple();
  assert.equal(checkAgainstArchive(rows, [{ d: '2026-11-02', t: 'NOCT', s: 53116 }, { d: '2026-10-31', t: 'NOCT', s: 53111 }, { d: '2026-11-03', t: 'PREV' }]), 1);
  assert.throws(() => checkAgainstArchive(rows, [{ d: '2026-11-02', t: 'VESP', s: 53116 }]), ProgramError);
});

test('download form: PDF, "not loaded yet" notice, anything else stops', () => {
  assert.deepEqual(formAnswer(readFileSync(new URL('202611QUI0.pdf', FX)), 'application/pdf'), { pdf: true, start: 269 }, 'the served PDF starts after a <style> block');
  assert.deepEqual(formAnswer(Buffer.from('%PDF-1.7 x'), 'application/pdf'), { pdf: true, start: 0 });
  assert.deepEqual(formAnswer(readFileSync(new URL('not-loaded.html', FX)), 'text/html; charset=UTF-8'), { pdf: false, missing: true });
  assert.throws(() => formAnswer(Buffer.from('<html>error</html>'), 'text/html'), /neither a PDF/);
});

test('when the feed asks the source', () => {
  const prev = { rows: [[1]], checked: '2026-11-03', to: '2026-11-30' };
  assert.equal(dueReason(null, '2026-11-03'), 'no programme yet');
  assert.equal(dueReason(prev, '2026-11-04'), null);
  assert.equal(dueReason(prev, '2026-11-24'), null);
  assert.match(dueReason(prev, '2026-11-25'), /ends 2026-11-30/);
  assert.match(dueReason(prev, '2026-12-01'), /new month/);
  assert.equal(dueReason(prev, '2026-11-04', true), 'forced');
  assert.equal(dueReason({ ...prev, checked: '2026-11-01', to: '2027-01-31' }, '2026-11-30'), null);
});

function fixturesDir() {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-prog-'));
  const fixtures = join(dir, 'fx'), out = join(dir, 'out');
  cpSync(FX, join(fixtures, 'programa'), { recursive: true });
  mkdirSync(out, { recursive: true });
  return { fixtures, out };
}
const quietly = async f => { const l = console.log, e = console.error; console.log = () => {}; console.error = () => {}; try { return await f(); } finally { console.log = l; console.error = e; } };
const readOut = (out, n) => JSON.parse(readFileSync(join(out, n + '.json'), 'utf8'));

test('feed: November from the form, December not uploaded yet, expiry in the health report', async () => {
  const { fixtures, out } = fixturesDir();
  writeFileSync(join(out, 'quiniela-archivo.json'), JSON.stringify({ name: 'quiniela-archivo', updated: '2026-11-03T20:00:00Z', data: { draws: [{ d: '2026-11-02', t: 'NOCT', s: 53116 }] } }));
  await quietly(() => main(['--site', 'jugadadeldia', 'programa', '--out', out, '--fixtures', fixtures, '--now', '2026-11-03T21:00:00Z'], {}));
  const p = readOut(out, 'programa').data;
  assert.equal(p.from, '2026-11-02');
  assert.equal(p.to, '2026-11-30');
  assert.equal(p.rows.length, 125);
  assert.deepEqual(p.rows[0], [53112, '2026-11-02', '10:15', 'La Previa', [1, 2, 3, 4, 6, 7]]);
  assert.equal(p.compared, 1);
  assert.deepEqual(p.months.map(m => [m.ym, m.used.join('+'), m.draws]), [['2026-11', 'simple', 125]]);
  assert.ok(p.notes.includes('2026-12: not published yet'));
  assert.equal(p.checked, '2026-11-03');
  const h = readOut(out, '_health');
  const x = h.expiries.find(e => e.id === 'lotba-programa');
  assert.deepEqual([x.until, x.daysLeft, x.state, x.warnDays], ['2026-11-30', 27, 'ok', 0]);

  const t0 = readOut(out, 'programa').updated;
  writeFileSync(join(fixtures, 'programa/index.json'), '{}');
  const rc = await quietly(() => main(['--site', 'jugadadeldia', 'programa', '--out', out, '--fixtures', fixtures, '--now', '2026-11-05T21:00:00Z'], {}));
  const p2 = readOut(out, 'programa');
  assert.notEqual(p2.updated, t0, 'not due: the previous programme is written again without a request');
  assert.equal(p2.data.checked, '2026-11-03');
  assert.equal(rc, 1, 'other feeds of the site have no file in this test');

  const rc3 = await quietly(() => main(['--site', 'jugadadeldia', 'programa', '--out', out, '--fixtures', fixtures, '--now', '2026-11-26T21:00:00Z'], {}));
  assert.ok(rc3 >= 0);
  const h3 = readOut(out, '_health');
  assert.equal(h3.feeds.programa.consecutiveFailures, 1, 'near the end it asks the form; a broken answer is a failure');
  assert.equal(readOut(out, 'programa').data.to, '2026-11-30', 'and the last good programme stays');
});

test('feed: a programme that disagrees with the real draws is not written', async () => {
  const { fixtures, out } = fixturesDir();
  writeFileSync(join(out, 'quiniela-archivo.json'), JSON.stringify({ name: 'quiniela-archivo', updated: '2026-11-03T20:00:00Z', data: { draws: [{ d: '2026-11-02', t: 'VESP', s: 53116 }] } }));
  await quietly(() => main(['--site', 'jugadadeldia', 'programa', '--out', out, '--fixtures', fixtures, '--now', '2026-11-03T21:00:00Z'], {}));
  assert.equal(readOut(out, '_health').feeds.programa.consecutiveFailures, 1);
  assert.throws(() => readOut(out, 'programa'));
});

test('compute keeps months from the month before today on and joins a new month', () => {
  const nov = simple(), dec = december(nov);
  const prevData = { checked: '2026-11-03', months: [{ ym: NOV, used: ['simple'], files: [] }], rows: nov.map(r => [r.n, r.d, r.t, r.type, r.j]) };
  const d = feed.compute({ today: '2026-11-27', reason: 'programme ends 2026-11-30', months: { '2026-12': { rows: dec, used: ['completa'], files: [] } }, missing: [], notes: [], archive: [] }, prevData);
  assert.equal(d.from, '2026-11-02');
  assert.equal(d.to, '2026-12-31');
  assert.equal(d.expiries[0].until, '2026-12-31');
  const j = feed.compute({ today: '2027-01-04', reason: 'new month', months: {}, missing: ['2027-01', '2027-02'], notes: [], archive: [] }, { ...d, rows: d.rows });
  assert.equal(j.from, '2026-12-01', 'November is dropped in January');
  assert.equal(j.expiries[0].until, '2026-12-31');
  assert.ok(j.notes.includes('2027-01: not published yet'));
});

test('expiries: states, problems and alerts once per state change', () => {
  const now = new Date('2026-11-20T15:00:00Z');
  const docs = [['f', { data: { expiries: [
    { id: 'a', what: 'A', until: '2026-11-30', warnDays: 14 },
    { id: 'b', what: 'B', until: '2026-11-19', warnDays: 0 },
    { id: 'c', what: 'C', until: '2027-01-30', warnDays: 14 },
    { id: 'd', what: 'D', until: '2026-11-20', warnDays: 0 },
  ] } }]];
  const ex = expiriesOf(docs, now);
  assert.deepEqual(ex.map(x => [x.id, x.state, x.daysLeft]), [['b', 'expired', -1], ['d', 'ok', 0], ['a', 'soon', 10], ['c', 'ok', 71]]);
  const before = { feeds: {}, expiries: [] }, after = { feeds: {}, expiries: ex };
  const al = alertsFor(before, after, 'jugadadeldia');
  assert.equal(al.length, 2);
  assert.match(al.join('\n'), /EXPIRED since 2026-11-19: b/);
  assert.match(al.join('\n'), /expires 2026-11-30 \(10 days\): a/);
  assert.equal(alertsFor(after, after, 'jugadadeldia').length, 0);
});

test('health lists the expiries of every feed and counts expired ones as problems', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jdd-health-'));
  writeFileSync(join(dir, 'x.json'), JSON.stringify({ name: 'x', updated: '2026-11-20T14:00:00Z', data: { expiries: [{ id: 'old', what: 'old copy', until: '2026-11-01', warnDays: 14 }] } }));
  const h = buildHealth([{ name: 'x', cadence: 'daily', maxAgeHours: 72 }], dir, [], [], new Date('2026-11-20T15:00:00Z'));
  assert.equal(h.ok, false);
  assert.equal(h.expiries[0].state, 'expired');
  assert.match(h.problems[0], /expired 2026-11-01: old/);
});

test('source expiries of jugadadeldia: lottery copies, monthly programmes, help package, game rules', async () => {
  assert.equal(GAME_MAX_AGE, SITE_GAME_MAX_AGE, 'same limit as the build');
  const sets = readSets();
  const ex = sourceExpiries(sets);
  const by = Object.fromEntries(ex.map(x => [x.id, x]));
  assert.ok(!by['lotba-quiniela-programa'] && !by['lotba-loto-programa'], 'the monthly programmes are checked by the feed precios');
  const reg = sets.lottery.find(l => l.id === 'lotba').docs['quiniela-reglamento'];
  assert.equal(by['lotba-quiniela-reglamento'].until, addDays(reg.fetched, sets.lottery.find(l => l.id === 'lotba').maxAgeDays));
  assert.equal(by['lotba-quiniela-reglamento'].warnDays, 14);
  const lim = d => ['owner', 'owner-browser'].includes(d.copiedBy) || d.pendingOwnerCopy ? 180 : sets.rg.maxAgeDays;
  const firstRg = Object.values(sets.rg.docs).map(d => addDays(d.fetched, lim(d))).sort()[0];
  assert.equal(by['rg-package'].until, firstRg, 'help package: the first copy to expire (owner copies 180 days)');
  const online = sets.lottery.find(l => l.id === 'online');
  const [ownSlug, ownDoc] = Object.entries(online.docs).find(([, d]) => ['owner', 'owner-browser'].includes(d.copiedBy));
  assert.equal(by['online-' + ownSlug].until, addDays(ownDoc.fetched, 180), 'an owner copy in a lottery file: 180 days');
  const [dlSlug, dlDoc] = Object.entries(online.docs).find(([, d]) => !d.copiedBy && !d.pendingOwnerCopy && !/loteriadecordoba|ijan-neuquen|loteriaderionegro|enrejasalta|hcdn/.test(d.url));
  assert.equal(by['online-' + dlSlug].until, addDays(dlDoc.fetched, online.maxAgeDays), 'a downloaded copy: maxAgeDays of its file');
  for (const g of ['truco', 'generala', 'chinchon', 'escoba', 'burako']) assert.ok(by['rules-' + g], g);
  assert.ok(!ex.some(x => /casas|operator|registr|gambeteo|pingalto/i.test(x.id + ' ' + x.what)), 'only this site\'s own sources (the health file is public)');
  const raw = await fuentes.fetch();
  fuentes.validate(raw);
  assert.equal(fuentes.compute(raw).count, ex.length);
  assert.throws(() => sourceExpiries({ lottery: [{ id: 'x', docs: { a: { fetched: '2026-11-01' } } }] }), /maxAgeDays/);
});
