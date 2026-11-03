// Quiniela extracts as published by the official lotteries (docs/FEEDS.md): parsing, validation, cross-check of the same draw
// from two sources, and the honest frequency count of the last two digits. Pure functions; the server feed
// (tools/feeds/jugadadeldia/quiniela.mjs) and the tests use them, the browser only reads their output.
//
// Sources: LOTBA (La Quiniela de la Ciudad) publishes one JSON per draw with six jurisdictions (codes below); the Provincia de
// Buenos Aires (IPLyC) publishes one PDF per turn with five columns. Both carry the Ciudad, Provincia, Cordoba, Santa Fe and
// Entre Rios extracts of the same turn, so those five can be checked number by number; Mendoza only comes from LOTBA.

export const TURNOS = [
  { id: 'PREV', name: 'La Previa', pba: 'PREVIA', file: 'LaPrevia' },
  { id: 'PRIM', name: 'Primera', pba: 'PRIMERO', file: 'ElPrimero' },
  { id: 'MATU', name: 'Matutina', pba: 'MATUTINA', file: 'Matutina' },
  { id: 'VESP', name: 'Vespertina', pba: 'VESPERTINA', file: 'Vespertina' },
  { id: 'NOCT', name: 'Nocturna', pba: 'NOCTURNA', file: 'Nocturna' },
];
export const JURS = [
  { id: 'caba', name: 'Ciudad', long: 'Ciudad de Buenos Aires (Nacional)', lotba: '51', pba: 'CIUDAD' },
  { id: 'buenos-aires', name: 'Provincia', long: 'Provincia de Buenos Aires', lotba: '53', pba: 'PROVINCIA' },
  { id: 'cordoba', name: 'Córdoba', long: 'Córdoba', lotba: '55', pba: 'CORDOBA' },
  { id: 'santa-fe', name: 'Santa Fe', long: 'Santa Fe', lotba: '72', pba: 'SANTA FE' },
  { id: 'entre-rios', name: 'Entre Ríos', long: 'Entre Ríos', lotba: '59', pba: 'ENTRE RIOS' },
  { id: 'mendoza', name: 'Mendoza', long: 'Mendoza', lotba: '64', pba: null },
];
// The site hides a day as current when the feed has not checked the sources for this long (feed maxAgeHours, pages, client).
export const STALE_HOURS = 3;
const TURNO_IDS = TURNOS.map(t => t.id);
export const turnoIndex = id => TURNO_IDS.indexOf(id);
const NUM4 = /^\d{4}$/;

export class ExtractError extends Error {}
const bad = msg => { throw new ExtractError(msg); };

// Twenty numbers of four digits, place 1 first.
export function checkTwenty(list, where) {
  if (!Array.isArray(list) || list.length !== 20) bad(where + ': expected 20 numbers, got ' + (Array.isArray(list) ? list.length : typeof list));
  for (const v of list) if (typeof v !== 'string' || !NUM4.test(v)) bad(where + ': not a 4-digit number: ' + JSON.stringify(v));
  return list;
}
const isoFromDmy = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; };

// LOTBA includes/resultados-data.php?sorteo=N: "window.RESULTADOS_DATA = [ {...} ];window.POZO_ULTIMO_SORTEO = ...;".
// Returns null for a draw number that does not exist (empty array), otherwise { sorteo, date, turno, jur: { id: [20] }, missing: [ids] }.
// A jurisdiction with anything but 20 four-digit numbers at places 01..20 goes to `missing` (published partly, read again later).
export function parseLotba(text, sorteo) {
  const m = /window\.RESULTADOS_DATA\s*=\s*(\[[\s\S]*?\])\s*;\s*window\./.exec(text) || /window\.RESULTADOS_DATA\s*=\s*(\[[\s\S]*\])\s*;?\s*$/.exec(text);
  if (!m) bad('LOTBA ' + sorteo + ': no RESULTADOS_DATA');
  let arr;
  try { arr = JSON.parse(m[1]); } catch { bad('LOTBA ' + sorteo + ': RESULTADOS_DATA is not JSON'); }
  if (!Array.isArray(arr)) bad('LOTBA ' + sorteo + ': RESULTADOS_DATA is not a list');
  if (!arr.length) return null;
  if (arr.length !== 1) bad('LOTBA ' + sorteo + ': ' + arr.length + ' draws in one answer');
  const d = arr[0];
  if (Number(d.sorteo) !== Number(sorteo)) bad('LOTBA: asked for draw ' + sorteo + ', got ' + d.sorteo);
  const date = isoFromDmy(d.fecha);
  if (!date) bad('LOTBA ' + sorteo + ': bad date ' + JSON.stringify(d.fecha));
  if (!TURNO_IDS.includes(d.modalidad)) bad('LOTBA ' + sorteo + ': unknown turn ' + JSON.stringify(d.modalidad));
  const jur = {}, missing = [];
  const src = d.jurisdicciones || bad('LOTBA ' + sorteo + ': no jurisdicciones');
  for (const J of JURS) {
    const x = src[J.lotba];
    let list = null;
    if (x && Array.isArray(x.numeros) && x.numeros.length === 20) {
      const byPos = {};
      for (const e of x.numeros) byPos[Number(e && e.pos)] = e && e.val;
      list = Array.from({ length: 20 }, (_, i) => byPos[i + 1]);
      if (!list.every(v => typeof v === 'string' && NUM4.test(v))) list = null;
    }
    if (list) jur[J.id] = list; else missing.push(J.id);
  }
  return { sorteo: Number(d.sorteo), date, turno: d.modalidad, jur, missing };
}

// The latest draw number on the LOTBA home page (the script tag of the current results).
export function lotbaLatest(html) {
  const all = [...String(html).matchAll(/resultados-data\.php\?sorteo=(\d{4,7})/g)].map(m => Number(m[1]));
  if (!all.length) bad('LOTBA home: no draw number');
  return Math.max(...all);
}

// The PBA day answer api-loteria/extractos/YYYY-MM-DD: { html } with base64 PDFs; returns [{ file, turno, b64 }] for the one-turn
// "Quiniela<Turn>.pdf" files (the five-column extract of each turn).
export function pbaPdfs(json) {
  if (!json || typeof json.html !== 'string') bad('PBA: no html');
  const out = [];
  for (const m of json.html.matchAll(/<p>\s*([\w.-]+\.pdf)\s*<\/p>\s*<a\s+href="data:application\/pdf;base64,([A-Za-z0-9+/=]+)"/g)) {
    const t = TURNOS.find(x => m[1] === 'Quiniela' + x.file + '.pdf');
    if (t) out.push({ file: m[1], turno: t.id, b64: m[2] });
  }
  return out;
}

// Text of one PBA turn PDF (pdftotext -layout). Strict: an unknown layout throws instead of guessing.
// -> { date, turno, sorteo, time, jur: { id: [20] } }
export function parsePbaText(text, expect = {}) {
  const lines = String(text).split('\n');
  const dm = /(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  if (!dm) bad('PBA: no date');
  const date = dm[3] + '-' + dm[2] + '-' + dm[1];
  if (expect.date && expect.date !== date) bad('PBA: date ' + date + ', expected ' + expect.date);
  const ti = lines.findIndex(l => { const w = l.trim().split(/\s+/); return w.length >= 5 && w.every(x => TURNOS.some(t => t.pba === x)); });
  if (ti < 0) bad('PBA: no turn line');
  const words = lines[ti].trim().split(/\s+/);
  if (new Set(words).size !== 1) bad('PBA: mixed turns ' + words.join(' '));
  const T = TURNOS.find(t => t.pba === words[0]);
  if (expect.turno && expect.turno !== T.id) bad('PBA: turn ' + T.id + ', expected ' + expect.turno);
  const ncol = words.length;
  const sw = (lines[ti + 1] || '').trim().split(/\s+/);
  if (sw.length !== ncol || !sw.every(x => /^\d{3,6}$/.test(x)) || new Set(sw).size !== 1) bad('PBA: no draw number line');
  const tm = [...(lines[ti + 2] || '').matchAll(/Realizado a las (\d{2}):(\d{2})/g)];
  if (tm.length !== ncol) bad('PBA: no time line');
  const time = tm[0][1] + ':' + tm[0][2];
  const hi = lines.findIndex((l, i) => i > ti && /PROVINCIA/.test(l) && /CIUDAD/.test(l));
  if (hi < 0) bad('PBA: no jurisdiction header');
  const names = lines[hi].trim().split(/\s{2,}/);
  if (names.length !== ncol) bad('PBA: ' + names.length + ' jurisdiction names for ' + ncol + ' columns');
  const cols = names.map(n => { const J = JURS.find(j => j.pba === n); if (!J) bad('PBA: unknown jurisdiction ' + JSON.stringify(n)); return J.id; });
  const rows = [];
  for (const l of lines.slice(hi + 1)) {
    const tok = l.trim().split(/\s+/);
    if (tok.length === 4 * ncol && tok.every(x => /^\d+$/.test(x))) rows.push(tok);
  }
  if (rows.length !== 10) bad('PBA: ' + rows.length + ' number rows, expected 10');
  const jur = {};
  cols.forEach((id, c) => {
    const list = new Array(20);
    rows.forEach((tok, r) => {
      const [p1, v1, p2, v2] = tok.slice(4 * c, 4 * c + 4);
      if (Number(p1) !== r + 1 || Number(p2) !== r + 11) bad('PBA: places out of order in column ' + id);
      list[r] = v1; list[r + 10] = v2;
    });
    jur[id] = checkTwenty(list, 'PBA ' + id);
  });
  const heads = [...text.matchAll(/Premio\s+(\d{4})/g)].map(m => m[1]);
  if (heads.length === ncol) cols.forEach((id, c) => { if (heads[c] !== jur[id][0]) bad('PBA: head ' + heads[c] + ' differs from place 1 in ' + id); });
  return { date, turno: T.id, sorteo: Number(sw[0]), time, jur };
}

// How often each ending 00-99 came out: at the head (place 1) and in all 20 places, per jurisdiction, over the given draws
// ({ jur: { id: [20] } } or { jur: { id: { n } } }). expected = draws / 100 at the head, draws * 20 / 100 in all places.
export function frequency(draws, jurId) {
  const head = new Array(100).fill(0), all = new Array(100).fill(0);
  let n = 0;
  for (const d of draws) {
    const x = d.jur && d.jur[jurId];
    const list = Array.isArray(x) ? x : x && x.n;
    if (!list) continue;
    n++;
    head[Number(list[0].slice(2))]++;
    for (const v of list) all[Number(v.slice(2))]++;
  }
  const chi = (obs, e) => e > 0 ? obs.reduce((s, o) => s + (o - e) ** 2 / e, 0) : 0;
  return { draws: n, head, all, expectedHead: n / 100, expectedAll: n * 20 / 100, chiHead: chi(head, n / 100), chiAll: chi(all, n * 20 / 100) };
}

// Upper tail of the chi-square distribution with k degrees of freedom: P(X >= x), via the regularized incomplete gamma
// function (series below a + 1, continued fraction above; Numerical Recipes 6.2). Used for "is this unevenness unusual?".
function lnGamma(z) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const v of c) s += v / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
}
export function chiSquareP(x, k) {
  if (!(x >= 0) || !(k > 0)) return NaN;
  const a = k / 2, z = x / 2;
  if (z === 0) return 1;
  const gl = lnGamma(a);
  if (z < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let i = 0; i < 500; i++) { ap += 1; del *= z / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; }
    return 1 - sum * Math.exp(-z + a * Math.log(z) - gl);
  }
  let b = z + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.exp(-z + a * Math.log(z) - gl) * h;
}
