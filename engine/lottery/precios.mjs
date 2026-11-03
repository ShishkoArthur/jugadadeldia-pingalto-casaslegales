// Prices and other values of the monthly LOTBA programmes (Quiniela de la Ciudad "QUI", Loto Plus "LTO"; docs/FEEDS.md): strict
// extraction of the prices from the PDF text (pdftotext -layout), the check of every other cited value of the month against its
// quote, and the plausibility rules (range, jump against the last good value). Pure functions: the server feed
// (tools/feeds/jugadadeldia/precios.mjs) and the tests use them; the pages read the feed output in the browser.
import { normalize, hasQuote } from '../text.mjs';
import { parseProgramText } from './programa.mjs';

// Prices shown on the pages. digits and words must agree ("PESOS CIENTO CINCUENTA ($150)"); range in pesos; jump: the largest
// accepted change against the last good value (a larger one is held for a person to look at).
export const MAX_JUMP = 0.5;
export const PRICES = {
  'lotba.quiniela.min-bet': { juego: 'QUI', doc: 'quiniela-programa', range: [10, 100000],
    re: /PESOS ([A-ZÁÉÍÓÚÑ ]+?) \(\$ ?(\d[\d.]*)\) por extracto apostado de cada jurisdicci[oó]n/g, words: 1, digits: 2 },
  'lotba.quiniela.big-prize': { juego: 'QUI', doc: 'quiniela-programa', range: [100000, 1e10],
    re: /premios que superen la suma de PESOS ([A-ZÁÉÍÓÚÑ ]+?) \(\$ ?(\d[\d.]*?)\.?-?\)/g, words: 1, digits: 2 },
  'lotba.poceada.price': { juego: 'QUI', doc: 'quiniela-programa', range: [100, 1e6],
    re: /APUESTA SIMPLE ?= ?OCHO \(8\) N[UÚ]MEROS ?= ?VALOR DE LA APUESTA: ?\$ ?(\d[\d.]*) \(PESOS ([A-ZÁÉÍÓÚÑ ]+?)\)/g, words: 2, digits: 1 },
  'lotba.loto.price': { juego: 'LTO', doc: 'loto-programa', range: [100, 1e6], table: true },
};
// Values that are checked through the draw rows of the month instead of their quote (the quote is a dated row).
export const TIMES = {
  'lotba.quiniela.time-previa': 'La Previa', 'lotba.quiniela.time-primera': 'La Primera', 'lotba.quiniela.time-matutina': 'Matutina',
  'lotba.quiniela.time-vespertina': 'Vespertina', 'lotba.quiniela.time-nocturna': 'Nocturna', 'lotba.quiniela.saturday-nocturna': 'Nocturna',
};
export const DOCS = { QUI: 'quiniela-programa', LTO: 'loto-programa' };

const UNITS = { UN: 1, UNO: 1, UNA: 1, DOS: 2, TRES: 3, CUATRO: 4, CINCO: 5, SEIS: 6, SIETE: 7, OCHO: 8, NUEVE: 9, DIEZ: 10, ONCE: 11, DOCE: 12, TRECE: 13,
  CATORCE: 14, QUINCE: 15, DIECISEIS: 16, DIECISIETE: 17, DIECIOCHO: 18, DIECINUEVE: 19, VEINTE: 20, VEINTIUN: 21, VEINTIUNO: 21, VEINTIDOS: 22,
  VEINTITRES: 23, VEINTICUATRO: 24, VEINTICINCO: 25, VEINTISEIS: 26, VEINTISIETE: 27, VEINTIOCHO: 28, VEINTINUEVE: 29, TREINTA: 30, CUARENTA: 40,
  CINCUENTA: 50, SESENTA: 60, SETENTA: 70, OCHENTA: 80, NOVENTA: 90, CIEN: 100, CIENTO: 100, DOSCIENTOS: 200, TRESCIENTOS: 300, CUATROCIENTOS: 400,
  QUINIENTOS: 500, SEISCIENTOS: 600, SETECIENTOS: 700, OCHOCIENTOS: 800, NOVECIENTOS: 900 };
const plain = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

// Spanish number words as the programmes write them ("UN MIL SETECIENTOS", "DOS MILLONES CIEN MIL") -> integer, or null.
export function esWords(s) {
  const words = plain(String(s)).replace(/AS\b/g, 'OS').trim().split(/\s+/).filter(w => w && w !== 'Y');
  if (!words.length) return null;
  let total = 0, cur = 0, last = Infinity;
  for (const w of words) {
    if (w === 'MILLON' || w === 'MILLONES') { if (last <= 1e6) return null; total += (cur || 1) * 1e6; cur = 0; last = 1e6; }
    else if (w === 'MIL') { if (last <= 1000) return null; total += (cur || 1) * 1000; cur = 0; last = 1000; }
    else if (w in UNITS) cur += UNITS[w];
    else return null;
  }
  return total + cur;
}
// "$2.100.000.-", "1700", "4.000" -> integer, or null (only dots as thousands separators).
export function esAmount(s) {
  const t = String(s).trim().replace(/\.-?$/, '');
  if (!/^\d{1,3}(\.\d{3})+$|^\d+$/.test(t)) return null;
  return +t.replace(/\./g, '');
}

// The ordinary price of the Loto Plus draws of the month: the first draw table of the document ("Sorteo Fecha Hora ... valor
// apuesta"), rows "3932 4/11/2026 22:00 5/11/2026 4/12/2026 $ 4.000"; draws marked * are extraordinary (another price).
function lotoPrice(layoutText, ym) {
  const lines = layoutText.split('\n');
  const h = lines.findIndex(l => /^\s*Sorteo\s+Fecha\s+Hora\b.*valor apuesta\s*$/.test(l));
  if (h < 0) return { error: 'no draw table' };
  const rows = [];
  let i = h + 1;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim() || (!rows.length && /^\s*Premios\s*$/.test(l))) continue;
    const m = /^\s*(\d{4})(\*?)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d\d:\d\d)\s+\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}\/\d{1,2}\/\d{4}\s+\$\s*(\d[\d.]*)\s*$/.exec(l);
    if (!m) break;
    const d = m[5] + '-' + m[4].padStart(2, '0') + '-' + m[3].padStart(2, '0');
    if (d.slice(0, 7) !== ym) return { error: 'draw ' + m[1] + ' dated ' + d + ' outside ' + ym };
    rows.push({ n: +m[1], extra: m[2] === '*', price: esAmount(m[7]) });
  }
  if (rows.length < 3) return { error: 'draw table with ' + rows.length + ' rows' };
  for (let k = 1; k < rows.length; k++) if (rows[k].n !== rows[k - 1].n + 1) return { error: 'draw numbers not consecutive at ' + rows[k].n };
  const ord = rows.filter(r => !r.extra);
  if (ord.length < 3 || ord.some(r => r.price === null)) return { error: 'ordinary draws without a readable price' };
  const set = new Set(ord.map(r => r.price));
  if (set.size !== 1) return { error: 'ordinary draws with different prices ' + [...set].join('/') };
  return { value: ord[0].price, rows: rows.length };
}

// Both checks of the document of a month name the game and the month. text: pdftotext -layout output.
const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
export function checkDocument(juego, text, ym) {
  const flat = plain(text).replace(/\s+/g, '');
  const name = MONTHS[+ym.slice(5, 7) - 1], y = ym.slice(0, 4);
  if (!(flat.includes('MESDE' + name + y) || flat.includes('MES' + name + y) || flat.includes(name + 'DE' + y))) return 'the text does not name ' + name + ' ' + y;
  if (juego === 'QUI' && !flat.includes('QUINIELADELACIUDAD')) return 'not the Quiniela de la Ciudad programme';
  if (juego === 'LTO' && !flat.includes('LOTOPLUS')) return 'not the Loto Plus programme';
  return null;
}

// Prices of one document -> { values: { id: number }, problems: { id: reason } }. Every match of a price in the text must give the
// same amount; words that spell another number stop it; at least one match must spell the amount (the 2026-11 programme has a typo
// "DOS MILLONES CIE MIL" in one of its three copies of the big-prize sentence: unreadable words are tolerated next to a correct one).
export function extractPrices(juego, text, ym) {
  const values = {}, problems = {};
  const flat = normalize(text);
  for (const [id, p] of Object.entries(PRICES)) {
    if (p.juego !== juego) continue;
    if (p.table) { const r = lotoPrice(text, ym); if (r.error) problems[id] = r.error; else values[id] = r.value; continue; }
    const found = new Set();
    let bad = null, agree = 0, typo = 0;
    for (const m of flat.matchAll(p.re)) {
      const n = esAmount(m[p.digits]), w = esWords(m[p.words]);
      if (n === null) { bad = 'amount "' + m[p.digits] + '" not readable'; break; }
      found.add(n);
      if (w === n) agree++;
      else if (w === null) typo++;
      else { bad = 'digits ' + n + ' and words "' + m[p.words].trim() + '" (' + w + ') differ'; break; }
    }
    if (bad) problems[id] = bad;
    else if (!found.size) problems[id] = 'not found';
    else if (found.size > 1) problems[id] = 'several amounts ' + [...found].join('/');
    else if (!agree) problems[id] = 'the words never spell the amount ' + [...found][0];
    else values[id] = [...found][0];
  }
  return { values, problems };
}

// Range and jump against the reference (last good value, or the value of the saved copy the site was built from). null = fine.
export function judgePrice(id, value, ref, maxJump = MAX_JUMP) {
  const p = PRICES[id];
  if (!Number.isInteger(value) || value < p.range[0] || value > p.range[1]) return 'outside ' + p.range.join('..');
  if (Number.isFinite(ref) && ref > 0 && Math.abs(value - ref) / ref > maxJump) return 'jump ' + ref + ' -> ' + value + ' (more than ' + Math.round(maxJump * 100) + ' %)';
  return null;
}

// The other cited values of a document: the quote verbatim (compared without whitespace, as tools/verify-sources.mjs), the draw
// times through the draw rows of the month. facts: the facts of data/sources/lottery/lotba.json citing this document.
export function confirmFacts(facts, text, ym, juego) {
  const confirmed = [], changed = [];
  const flat = normalize(text);
  let rows = null;
  if (juego === 'QUI') { try { rows = parseProgramText(text, ym); } catch { rows = []; } }
  for (const f of facts) {
    if (PRICES[f.id]) continue;
    if (TIMES[f.id]) {
      let rs = (rows || []).filter(r => r.type === TIMES[f.id]);
      if (f.id.includes('saturday')) rs = rs.filter(r => new Date(r.d + 'T12:00:00Z').getUTCDay() === 6);
      (rs.length && rs.every(r => r.t === f.value) ? confirmed : changed).push(f.id);
      continue;
    }
    (hasQuote(flat, true, f.quote) ? confirmed : changed).push(f.id);
  }
  return { confirmed, changed };
}
