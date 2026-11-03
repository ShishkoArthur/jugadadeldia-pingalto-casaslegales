// The monthly draw programme of La Quiniela de la Ciudad (LOTBA "programación", docs/FEEDS.md): parsing of the PDF text
// (pdftotext -layout), strict validation, merge of the two published versions of a month and of consecutive months, and the check
// against the draws that really happened (feed archive). Pure functions: the build (sites/jugadadeldia/pages/guias.mjs), the server
// feed (tools/feeds/jugadadeldia/programa.mjs) and the tests use them; the browser only reads their output.
//
// The official download form (POST includes/descargaPrograma.php, fields ano, mes, version, juego=QUI) serves two PDFs per month:
// version 1 "completa" (rules, payouts, and the draw diagram; in 2026-11 only its first diagram sheet is text, the second is an image)
// and version 0 "simple" (the diagram only, every sheet as text). A row of the diagram:
//   53112    2/11/2026 10:15   1  2  3  4     6  7   LA PREVIA    3/11/2026   2/12/2026
// = draw number, date, time, the participating jurisdiction codes (1 Ciudad .. 7 Entre Rios), type, payment start, prescription.
// pdftotext may split a word of the type ("MAT UT INA"); spaces inside the type are ignored.

export const PROG_CODES = { 1: 'Ciudad', 2: 'Provincia', 3: 'Córdoba', 4: 'Santa Fe', 5: 'Uruguay', 6: 'Mendoza', 7: 'Entre Ríos' };
export const PROG_TYPES = [
  { key: 'LAPREVIA', name: 'La Previa', turno: 'PREV' },
  { key: 'LAPRIMERA', name: 'La Primera', turno: 'PRIM' },
  { key: 'MATUTINA', name: 'Matutina', turno: 'MATU' },
  { key: 'VESPERTINA', name: 'Vespertina', turno: 'VESP' },
  { key: 'NOCTURNA', name: 'Nocturna', turno: 'NOCT' },
];
const BY_KEY = Object.fromEntries(PROG_TYPES.map((t, i) => [t.key, { ...t, i }]));
const BY_NAME = Object.fromEntries(PROG_TYPES.map((t, i) => [t.name, { ...t, i }]));
const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
export const MAX_GAP_DAYS = 4;
export const MIN_ROWS = 20;

export class ProgramError extends Error {}
const bad = m => { throw new ProgramError(m); };
const two = x => String(x).padStart(2, '0');
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
export const ymOf = d => d.slice(0, 7);
export function nextYm(ym) {
  const y = +ym.slice(0, 4), m = +ym.slice(5, 7);
  return m === 12 ? (y + 1) + '-01' : y + '-' + two(m + 1);
}
export function monthEnd(ym) {
  const y = +ym.slice(0, 4), m = +ym.slice(5, 7);
  return ym + '-' + two(new Date(Date.UTC(y, m, 0)).getUTCDate());
}
function realDate(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const ROW_START = /^\s*\d{5}\s+\d{1,2}\/\d{1,2}\/\d{4}\s/;
const ROW = /^\s*(\d{5})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d\d):(\d\d)\s+((?:[1-7]\s+)*[1-7])\s+([A-Z][A-Z ]*?[A-Z])\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*$/;

// Text of one PDF -> rows { n, d, t, type, j } in the order of the diagram. ym ('YYYY-MM') is the month asked for: the text must name
// it ("NOVIEMBRE 2026" / "NOVIEMBRE DE 2026"). Any line that starts like a row but does not parse stops the parse (unknown layout).
export function parseProgramText(text, ym) {
  if (typeof text !== 'string' || !text.length) bad('program: empty text');
  const flat = text.toUpperCase().replace(/\s+/g, '');
  if (!flat.includes('DIAGRAMADESORTEOS')) bad('program: no draw diagram (DIAGRAMA DE SORTEOS) in the text');
  const y = ym.slice(0, 4), name = MONTHS[+ym.slice(5, 7) - 1];
  if (!name || !(flat.includes(name + y) || flat.includes(name + 'DE' + y))) bad('program: the text does not name ' + name + ' ' + y);
  const rows = [];
  for (const line of text.split('\n')) {
    if (!ROW_START.test(line)) continue;
    const m = ROW.exec(line);
    if (!m) bad('program: unknown row layout: ' + line.trim().slice(0, 120));
    const type = BY_KEY[m[8].replace(/ /g, '')];
    if (!type) bad('program: unknown draw type ' + m[8] + ' in row ' + m[1]);
    const dy = +m[4], mo = +m[3], da = +m[2], hh = +m[5], mi = +m[6];
    if (!realDate(dy, mo, da)) bad('program: bad date in row ' + m[1]);
    if (hh > 23 || mi > 59) bad('program: bad time in row ' + m[1]);
    const j = m[7].split(/\s+/).map(Number);
    rows.push({ n: +m[1], d: dy + '-' + two(mo) + '-' + two(da), t: m[5] + ':' + m[6], type: type.name, j });
  }
  return rows;
}

// Strict checks of the rows of one month: dates inside the month, draw numbers consecutive, dates and times in order, known types in
// their daily order, at most one draw of a type per day, jurisdiction codes 1..7 ascending with the Ciudad (1) in every draw, no
// stretch longer than MAX_GAP_DAYS without draws. Returns { from, to }.
export function validateMonth(rows, ym) {
  if (!Array.isArray(rows) || rows.length < MIN_ROWS) bad('program ' + ym + ': ' + (rows ? rows.length : 0) + ' rows (at least ' + MIN_ROWS + ')');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], at = 'program ' + ym + ' row ' + r.n + ': ';
    if (!Number.isInteger(r.n) || r.n <= 0) bad(at + 'bad draw number');
    if (!DAY.test(r.d) || ymOf(r.d) !== ym) bad(at + 'date ' + r.d + ' outside the month');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.t)) bad(at + 'bad time ' + r.t);
    if (!BY_NAME[r.type]) bad(at + 'unknown type ' + r.type);
    if (!Array.isArray(r.j) || !r.j.length || r.j[0] !== 1) bad(at + 'the Ciudad (1) does not take part');
    for (let k = 0; k < r.j.length; k++) if (!(r.j[k] >= 1 && r.j[k] <= 7 && Number.isInteger(r.j[k])) || (k && r.j[k] <= r.j[k - 1])) bad(at + 'bad jurisdiction codes ' + r.j.join(' '));
    if (!i) continue;
    const p = rows[i - 1];
    if (r.n !== p.n + 1) bad(at + 'draw numbers not consecutive (' + p.n + ' -> ' + r.n + ')');
    if (r.d < p.d) bad(at + 'date goes back (' + p.d + ' -> ' + r.d + ')');
    if (r.d === p.d) {
      if (r.t <= p.t) bad(at + 'time not after the previous draw of the day');
      if (BY_NAME[r.type].i <= BY_NAME[p.type].i) bad(at + r.type + ' after ' + p.type + ' on the same day');
    } else if (days(p.d, r.d) > MAX_GAP_DAYS) bad(at + 'no draws from ' + p.d + ' to ' + r.d);
  }
  return { from: rows[0].d, to: rows[rows.length - 1].d };
}

const same = (a, b) => a.n === b.n && a.d === b.d && a.t === b.t && a.type === b.type && a.j.join() === b.j.join();

// One month from its two versions (either may be null: not published). The "completa" version is the approved instrument and wins;
// rows of the "simple" version are added only for draw numbers the completa text does not have, and only when both agree on every
// draw they share. When they disagree, only the completa rows are used (the simple one is older) and a note says so.
export function mergeVersions(full, simple, ym) {
  const notes = [];
  if (!full && !simple) return null;
  if (!full) return { rows: simple, used: ['simple'], notes };
  if (!simple) return { rows: full, used: ['completa'], notes };
  const byN = new Map(simple.map(r => [r.n, r]));
  const diff = full.filter(r => byN.has(r.n) && !same(r, byN.get(r.n)));
  if (diff.length) { notes.push(ym + ': the simple version differs from the completa on ' + diff.length + ' draws (first ' + diff[0].n + '); using the completa only'); return { rows: full, used: ['completa'], notes }; }
  const have = new Set(full.map(r => r.n));
  const rows = [...full, ...simple.filter(r => !have.has(r.n))].sort((a, b) => a.n - b.n);
  return { rows, used: simple.some(r => !have.has(r.n)) ? ['completa', 'simple'] : ['completa'], notes };
}

// Months in order -> one list; adjacent months must continue the draw numbering (no missing draw between them).
export function joinMonths(months) {
  const list = [...months].sort((a, b) => a.ym < b.ym ? -1 : 1);
  const rows = [];
  for (let i = 0; i < list.length; i++) {
    validateMonth(list[i].rows, list[i].ym);
    if (i && nextYm(list[i - 1].ym) === list[i].ym) {
      const a = list[i - 1].rows[list[i - 1].rows.length - 1], b = list[i].rows[0];
      if (b.n !== a.n + 1) bad('program: ' + list[i].ym + ' starts at draw ' + b.n + ', ' + list[i - 1].ym + ' ended at ' + a.n);
      if (days(a.d, b.d) > MAX_GAP_DAYS) bad('program: no draws from ' + a.d + ' to ' + b.d);
    } else if (i && list[i].rows[0].n <= list[i - 1].rows[list[i - 1].rows.length - 1].n) bad('program: draw numbers of ' + list[i].ym + ' overlap the month before');
    rows.push(...list[i].rows);
  }
  return rows;
}

// The draws that really happened (feed archive entries { d, t: turno id, s: LOTBA draw number }) must match the programme: same
// number -> same date and turn. Returns how many draws were compared.
export function checkAgainstArchive(rows, archive) {
  const byN = new Map(rows.map(r => [r.n, r]));
  let n = 0;
  for (const e of archive || []) {
    if (!e || !Number.isInteger(e.s)) continue;
    const r = byN.get(e.s);
    if (!r) continue;
    n++;
    if (r.d !== e.d || BY_NAME[r.type].turno !== e.t) bad('program: draw ' + e.s + ' is ' + r.d + ' ' + r.type + ' in the programme but ' + e.d + ' ' + e.t + ' in the results');
  }
  return n;
}

// The answer of the download form: a PDF, or the HTML notice "El documento <file> no fue cargado aún o no existe". The PDF answer
// starts with the notice's <style> block (seen 2026-11): the PDF is the part from "%PDF-" (within the first 4 KB) on.
export function formAnswer(buf, contentType) {
  const start = buf.subarray(0, 4096).indexOf('%PDF-');
  if (start >= 0 && (!contentType || /application\/pdf/i.test(contentType))) return { pdf: true, start };
  const text = buf.toString('utf8');
  if (/text\/html/i.test(contentType || '') && /no fue cargado a[uú]n o no existe/i.test(text)) return { pdf: false, missing: true };
  bad('program: the form answered neither a PDF nor the "not loaded yet" notice (' + (contentType || '?') + ', ' + buf.length + ' bytes)');
}
