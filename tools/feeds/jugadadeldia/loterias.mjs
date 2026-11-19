// Lotto games for jugadadeldia.com (docs/FEEDS.md, research docs/research/JDD-SOURCES-2026-11-04.md). Hourly.
// Official sources reachable from our server (robots.txt of each answers 404 = no rules; checked 2026-11-04, IPJyC 2026-11-19):
//   Loto Plus   LOTBA loto.loteriadelaciudad.gob.ar (operator; JSON in includes/resultados-data.php, with prizes) + copy at San Juan CAS
//   Telekino    www.telekino.com.ar (the game's own site, latest draw) + copy at San Juan CAS
//   Quini 6, Brinco   the operator (Lotería de Santa Fe) answers 403 / times out (geo-block, not bypassed). Two official copies:
//               San Juan CAS (history, lags behind: its latest page stopped at 28.10 in November 2026) and the IPJyC Mendoza
//               (Instituto Provincial de Juegos y Casinos) copy of the operator's signed "Extracto oficial" PDF, one file per game
//               overwritten after each draw (ipjycweb.mendoza.gov.ar/userfiles/file/<quini6|brinco>.pdf, http only; the latest draw,
//               about half a day after it). Each game carries `behind` (scheduled draws missing since its latest): the pages say
//               "pendiente de publicación oficial" instead of pretending the old draw is the newest, and from 2 missing draws the
//               feed lists an alert (data.alerts -> _health.json -> Telegram, one per game, a recovery note when it clears).
// Two copies of one draw must agree number by number ("2 fuentes"), else that draw is not published and goes to conflicts.
// Output: loterias.json { games: { id: { draws (newest first, up to KEEP), latest, behind, expected } }, conflicts, notes, alerts }.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFTOTEXT } from '../../../engine/pdf.mjs';
import { zoneTime } from '../lib.mjs';
import { decode, isoFromDmy } from './provincias-parse.mjs';

const LOTO = 'https://loto.loteriadelaciudad.gob.ar/';
const LOTO_DRAW = n => LOTO + 'includes/resultados-data.php?sorteo=' + n;
const TK = 'https://www.telekino.com.ar/';
const CAS = (g, d) => 'https://cas.gob.ar/juegos/sorteos/resultados?juego=' + g + (d ? '&fecha=' + d : '');
export const MZA = f => 'http://ipjycweb.mendoza.gov.ar/userfiles/file/' + f + '.pdf';
const KEEP = 30, STALE = 4;
export const ALERT_BEHIND = 2, RED_BEHIND = 4;

// schedule (days of week, 0 = Sunday) and the hour after which the day's draw should be published, Argentine time
export const GAMES = {
  'loto-plus': { name: 'Loto Plus', operator: 'Lotería de la Ciudad de Buenos Aires', cas: 'loto', hosts: 'loto.loteriadelaciudad.gob.ar, cas.gob.ar', days: [3, 6], after: '23:30', max: 45, size: 6,
    mods: { Tradicional: 'tradicional', Match: 'match', Desquite: 'desquite', 'Sale o Sale': 'sale-o-sale' } },
  telekino: { name: 'Telekino', operator: 'Telekino', cas: 'telekino', hosts: 'telekino.com.ar, cas.gob.ar', days: [0], after: '23:00', min: 1, max: 25, size: 15,
    mods: { '': 'telekino', Telekino: 'telekino', Rekino: 'rekino' } },
  'quini-6': { name: 'Quini 6', operator: 'Lotería de Santa Fe', cas: 'quini6', hosts: 'cas.gob.ar, ipjycweb.mendoza.gov.ar', days: [0, 3], after: '23:30', max: 45, size: 6,
    mods: { Tradicional: 'tradicional', 'Segunda Vuelta': 'segunda', Revancha: 'revancha', 'Siempre Sale': 'siempre-sale' },
    mza: { file: 'quini6', heads: { PRIMER: 'tradicional', SEGUNDA: 'segunda', REVANCHA: 'revancha', SIEMPRE: 'siempre-sale' }, is: t => /\bQUINI\b/.test(t) && !/\bBRINCO\b/.test(t) } },
  brinco: { name: 'Brinco', operator: 'Lotería de Santa Fe', cas: 'brinco', hosts: 'cas.gob.ar, ipjycweb.mendoza.gov.ar', days: [0], after: '23:00', max: 39, size: 6,
    mods: { Tradicional: 'tradicional', Junior: 'junior' },
    mza: { file: 'brinco', heads: { TRADICIONAL: 'tradicional', JUNIOR: 'junior' }, is: t => /\bBRINCO\b/.test(t) && !/\bQUINI\b/.test(t) } },
};
const MONTHS = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

export class LotError extends Error {}
const bad = m => { throw new LotError(m); };
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = iso => new Date(iso + 'T12:00:00Z').getUTCDay();

function checkSet(list, g, where) {
  const G = GAMES[g], min = G.min || 0;
  if (!Array.isArray(list) || list.length !== G.size) bad(where + ': expected ' + G.size + ' numbers, got ' + (list && list.length));
  for (const v of list) if (!/^\d{2}$/.test(v) || Number(v) < min || Number(v) > G.max) bad(where + ': number out of range ' + JSON.stringify(v));
  if (new Set(list).size !== list.length) bad(where + ': repeated number');
  return list;
}
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// LOTBA Loto Plus draw -> { g, s, d, mods: { id: [6] }, plus: 'N', pozo, prizes: [{ mod, hits, winners, each }] } or null (no draw).
export function parseLoto(text, n) {
  const m = /window\.RESULTADOS_DATA\s*=\s*(\[[\s\S]*?\])\s*;\s*window\.PREMIOS_DATA\s*=\s*(\[[\s\S]*?\])\s*;\s*window\./.exec(text);
  if (!m) bad('Loto ' + n + ': no RESULTADOS_DATA/PREMIOS_DATA');
  const r = JSON.parse(m[1]), p = JSON.parse(m[2]);
  if (!r.length) return null;
  const d = r[0], P = p[0] || {};
  if (Number(d.sorteo) !== n || Number(P.sorteo) !== n) bad('Loto: asked for ' + n + ', got ' + d.sorteo);
  const date = isoFromDmy(d.fecha) || bad('Loto ' + n + ': bad date');
  const mods = {};
  for (const [name, id] of Object.entries(GAMES['loto-plus'].mods)) mods[id] = checkSet((d.numeros_juegos || {})[name], 'loto-plus', 'Loto ' + n + ' ' + name);
  const plus = ((d.numeros_juegos || {})['Número Plus'] || [])[0];
  if (!/^\d$/.test(plus || '')) bad('Loto ' + n + ': bad Número Plus');
  const prizes = [];
  for (const j of P.juegos || []) for (const l of j.niveles || []) {
    const winners = l.ganadores === 'VACANTE' ? 0 : l.ganadores;
    if (!Number.isInteger(winners) || winners < 0 || !(l.premio_unid >= 0)) bad('Loto ' + n + ': bad prize row ' + j.juego);
    prizes.push({ mod: j.juego, hits: l.aciertos, winners, each: Math.round(l.premio_unid * 100) / 100 });
  }
  return { g: 'loto-plus', s: n, d: date, mods, plus, pozo: Number.isFinite(P.pozoEstimado) ? P.pozoEstimado : null, prizes };
}

// Telekino site home: the latest draw -> { g, s, d, mods: { telekino, rekino } }.
export function parseTelekino(html) {
  const h = String(html);
  const head = [...h.matchAll(/<strong class="fontSize1"[^>]*>([^<]+)<\/strong>/g)].map(x => x[1].trim());
  const s = Number(head[0]), d = isoFromDmy(head[1]);
  if (!(s > 0) || !d) bad('Telekino: no draw number/date');
  const tk = [...h.matchAll(/<strong class="tamNumTelekino\d+"[^>]*>(\d{2})<\/strong>/g)].map(x => x[1]);
  const rk = [...h.matchAll(/<strong class="fontSizeRekino\d+"[^>]*>(\d{2})<\/strong>/g)].map(x => x[1]);
  return { g: 'telekino', s, d, mods: { telekino: checkSet(tk, 'telekino', 'Telekino ' + s), rekino: checkSet(rk, 'telekino', 'Rekino ' + s) } };
}

// San Juan CAS results page of one game -> { g, s, d, mods, prev: date of the previous draw link or null }.
export function parseCas(html, g) {
  const h = String(html), G = GAMES[g];
  const dm = /<p class="mb-0">Sorteo del\s*<strong>(\d{1,2}) de ([A-Za-z]+) de (\d{4})<\/strong>/.exec(h);
  if (!dm || !MONTHS[dm[2].toLowerCase()]) bad('CAS ' + g + ': no draw date');
  const d = dm[3] + '-' + String(MONTHS[dm[2].toLowerCase()]).padStart(2, '0') + '-' + dm[1].padStart(2, '0');
  const cards = h.split('<div class="quiniela-card-header">').slice(1);
  if (!cards.length) bad('CAS ' + g + ': no result cards');
  const mods = {};
  let s = null;
  for (const c of cards) {
    const name = decode((/<h4 class="mb-0">([^<]*)<\/h4>/.exec(c) || [])[1] || '').trim();
    const id = G.mods[name] || bad('CAS ' + g + ': unknown modality ' + JSON.stringify(name));
    const n = Number((/Sorteo N° (\d+)/.exec(c) || [])[1]);
    if (!(n > 0) || (s !== null && n !== s)) bad('CAS ' + g + ': draw numbers differ between cards');
    s = n;
    if (mods[id]) bad('CAS ' + g + ': modality twice ' + id);
    mods[id] = checkSet([...c.matchAll(/<div class="quini6-ball">(\d{2})<\/div>/g)].map(x => x[1]), g, 'CAS ' + g + ' ' + name);
  }
  for (const id of new Set(Object.values(G.mods))) if (!mods[id]) bad('CAS ' + g + ': modality missing ' + id);
  const pm = /href="\/juegos\/sorteos\/resultados\?juego=[a-z0-9]+&amp;fecha=(\d{4}-\d{2}-\d{2})"[^>]*aria-label="Sorteo anterior"/.exec(h);
  return { g, s, d, mods, prev: pm ? pm[1] : null };
}

// IPJyC Mendoza copy of the Lotería de Santa Fe "Extracto oficial" PDF, as words with boxes (pdftotext -bbox) -> { g, s, d, mods }.
// Layout (checked 2026-11-19 on Quini 6 N° 3426 and Brinco N° 1380): "EXTRACTO OFICIAL CONCURSO Nº N", "SORTEO REALIZADO EL DD/MM/YYYY
// A LAS HH:MM EN SANTA FE", then per modality a heading line (font about 14 pt) and one row of balls (two digits, font about 34 pt);
// prize figures and the 18 numbers of the Premio Extra are in smaller fonts. A row belongs to the nearest heading above it.
const WORD = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
export function parseMza(bbox, g) {
  const G = GAMES[g], M = G.mza || bad('IPJyC: no copy for ' + g);
  const where = 'IPJyC ' + g;
  const words = [];
  let page = 0;
  for (const part of String(bbox).split(/<page /).slice(1)) {
    page++;
    for (const m of part.matchAll(WORD)) words.push({ p: page, x: +m[1], y: +m[2], h: +m[4] - +m[2], t: decode(m[5]).trim() });
  }
  if (!words.length) bad(where + ': no text in the PDF');
  const text = words.map(w => w.t).join(' ');
  const sm = /EXTRACTO OFICIAL CONCURSO N\S{0,2}\s*(\d{3,6})\b/.exec(text);
  const dm = /SORTEO REALIZADO EL (\d{2}\/\d{2}\/\d{4}) A LAS \d{1,2}:\d{2} (?:HS\.? )?EN SANTA FE/.exec(text);
  if (!sm || !dm) bad(where + ': no draw number/date');
  if (!M.is(text)) bad(where + ': the PDF is not the extract of ' + G.name);
  const s = Number(sm[1]), d = isoFromDmy(dm[1]) || bad(where + ': bad date');
  const heads = words.filter(w => M.heads[w.t] && w.h >= 10 && w.h < 22);
  for (const k of Object.keys(M.heads)) { const n = heads.filter(w => w.t === k).length; if (n !== 1) bad(where + ': heading ' + k + ' found ' + n + ' times'); }
  const rows = [];
  for (const w of words.filter(x => /^\d{2}$/.test(x.t) && x.h >= 25)) {
    const r = rows.find(z => z.p === w.p && Math.abs(z.y - w.y) < 3);
    if (r) r.w.push(w); else rows.push({ p: w.p, y: w.y, w: [w] });
  }
  const mods = {};
  for (const r of rows) {
    const above = heads.filter(x => x.p === r.p && x.y < r.y).sort((a, b) => b.y - a.y)[0];
    const id = above ? M.heads[above.t] : bad(where + ': balls without a heading');
    if (mods[id]) bad(where + ': modality twice ' + id);
    mods[id] = checkSet(r.w.sort((a, b) => a.x - b.x).map(w => w.t), g, where + ' ' + id);
  }
  for (const id of new Set(Object.values(G.mods))) if (!mods[id]) bad(where + ': modality missing ' + id);
  return { g, s, d, mods };
}
export function pdfBbox(buf) {
  if (!Buffer.isBuffer(buf) || buf.subarray(0, 5).toString('latin1') !== '%PDF-') bad('not a PDF');
  const dir = mkdtempSync(join(tmpdir(), 'mza-'));
  try {
    const f = join(dir, 'x.pdf');
    writeFileSync(f, buf);
    return execFileSync(PDFTOTEXT, ['-bbox', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 << 20 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Alerts for the health report (tools/feeds/run.mjs noticesOf -> tools/feeds/alerts.mjs): a game with ALERT_BEHIND or more scheduled
// draws missing in every official copy. One id per game; params.level turns red from RED_BEHIND (the alert layer escalates once).
const firstAfter = (g, d) => { for (let x = addDays(d, 1), i = 0; i < 14; x = addDays(x, 1), i++) if (GAMES[g].days.includes(dow(x))) return x; return null; };
export function behindAlerts(games) {
  const out = [];
  for (const [g, x] of Object.entries(games)) {
    if (!(x.behind >= ALERT_BEHIND) || !x.latest) continue;
    out.push({ id: 'lot-behind-' + g, text: x.name + ': ' + x.behind + ' scheduled draws missing in the official copies (latest #' + x.latest.s + ' of ' + x.latest.d + ', expected one of ' + x.expected + ')',
      params: { game: g, name: x.name, behind: x.behind, s: x.latest.s, d: x.latest.d, expected: x.expected, first: firstAfter(g, x.latest.d), hosts: GAMES[g].hosts, level: x.behind >= RED_BEHIND ? 'red' : 'yellow' } });
  }
  return out;
}

// Scheduled draw days after `latest` that should be published by now (holidays can move a draw: the pages say "según la fuente").
export function behindOf(g, latest, today, nowHm) {
  const G = GAMES[g];
  let n = 0, expected = null;
  for (let d = addDays(latest, 1); d <= today; d = addDays(d, 1)) {
    if (!G.days.includes(dow(d))) continue;
    if (d === today && nowHm < G.after) continue;
    n++; expected = d;
  }
  return { behind: n, expected };
}

function textMods(m) { return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.join(' ')])); }

export default {
  name: 'loterias',
  cadence: 'hourly',
  maxAgeHours: STALE,
  timeoutSec: 300,
  async fetch(ctx) {
    const prev = ctx.prev && ctx.prev.data;
    const have = g => new Set(((prev && prev.games && prev.games[g] && prev.games[g].draws) || []).map(x => x.s));
    const out = { today: ctx.today(), now: zoneTime(ctx.now || new Date()), got: [], notes: [], ok: 0, failed: 0, next: { ...((prev && prev.next) || {}) }, prev, fetched: new Date().toISOString(), source: { url: LOTO, also: [TK, 'https://cas.gob.ar/', 'http://ipjycweb.mendoza.gov.ar/'] } };
    const tryGet = async (what, fn) => { try { const r = await fn(); out.ok++; return r; } catch (e) { out.failed++; out.notes.push((what + ': ' + e.message).slice(0, 200)); return null; } };
    // LOTBA Loto Plus: the newest draw from the home page, the next number (the home may lag), one older missing draw (backfill)
    const latest = await tryGet('LOTBA loto home', async () => {
      const all = [...(await ctx.getText(LOTO, { ttlHours: 0.5 })).text.matchAll(/resultados-data\.php\?sorteo=(\d{3,6})/g)].map(m => Number(m[1]));
      return all.length ? Math.max(...all) : bad('no draw number');
    });
    if (latest) {
      const known = have('loto-plus');
      const want = [latest + 1, latest];
      for (let n = latest - 1; n > latest - KEEP; n--) if (!known.has(n)) { want.push(n); break; }
      for (const n of want) {
        if (known.has(n) && n !== latest) continue;
        const d = await tryGet('LOTBA loto ' + n, async () => parseLoto((await ctx.getText(LOTO_DRAW(n), { accept: '*/*', ttlHours: n === latest + 1 ? 0.5 : 6 })).text, n));
        if (d) out.got.push({ src: 'L', ...d });
      }
    }
    const tk = await tryGet('Telekino', async () => parseTelekino((await ctx.getText(TK, { ttlHours: 0.5 })).text));
    if (tk) out.got.push({ src: 'T', ...tk });
    // San Juan CAS: the latest page of each game, then one older page (follows "Sorteo anterior") until KEEP draws are kept
    for (const g of Object.keys(GAMES)) {
      const c = await tryGet('CAS ' + g, async () => parseCas((await ctx.getText(CAS(GAMES[g].cas), { ttlHours: 0.5 })).text, g));
      if (!c) continue;
      out.got.push({ src: 'C', ...c });
      const known = have(g);
      let back = out.next[g] || c.prev;
      if (known.size < KEEP && back) {
        const o = await tryGet('CAS ' + g + ' ' + back, async () => parseCas((await ctx.getText(CAS(GAMES[g].cas, back), { ttlHours: 24 })).text, g));
        if (o) { if (o.d !== back) out.notes.push('CAS ' + g + ' ' + back + ': page shows ' + o.d); else { out.got.push({ src: 'C', ...o }); } out.next[g] = o.prev || null; }
      }
    }
    // IPJyC Mendoza: the latest extract PDF of Quini 6 and Brinco (the file is overwritten after each draw)
    for (const g of Object.keys(GAMES).filter(k => GAMES[k].mza)) {
      const m = await tryGet('IPJyC ' + g, async () => parseMza(pdfBbox((await ctx.getBytes(MZA(GAMES[g].mza.file), { ttlHours: 0.5, timeoutMs: 60000 })).buf), g));
      if (m) out.got.push({ src: 'M', ...m });
    }
    return out;
  },
  validate(raw) {
    if (!raw.ok && raw.failed) throw new Error('no source answered: ' + raw.notes.join(' | ').slice(0, 300));
    for (const x of raw.got) if (x.d > raw.today) throw new Error('draw in the future: ' + x.g + ' ' + x.d);
  },
  compute(raw, prevData) {
    const prev = prevData || raw.prev || {};
    const conflicts = [...((prev.conflicts) || [])].filter(c => c.d >= addDays(raw.today, -30));
    const dropped = new Set(conflicts.map(c => c.g + '|' + c.s));
    const games = {};
    for (const g of Object.keys(GAMES)) {
      const map = new Map(((prev.games && prev.games[g] && prev.games[g].draws) || []).map(x => [x.s, { ...x }]));
      for (const x of raw.got.filter(y => y.g === g)) {
        if (dropped.has(g + '|' + x.s)) continue;
        const mods = textMods(x.mods), cur = map.get(x.s);
        if (!cur) { map.set(x.s, { s: x.s, d: x.d, mods, src: x.src, ...(x.plus ? { plus: x.plus } : {}), ...(x.prizes ? { pozo: x.pozo, prizes: x.prizes } : {}) }); continue; }
        const agree = cur.d === x.d && Object.entries(mods).every(([k, v]) => !cur.mods[k] || sameSet(cur.mods[k].split(' '), v.split(' '))) && Object.keys(cur.mods).every(k => mods[k]);
        if (!agree) { map.delete(x.s); dropped.add(g + '|' + x.s); conflicts.push({ g, s: x.s, d: x.d, why: 'copies differ (' + cur.src + '/' + x.src + ')' }); continue; }
        if (!cur.src.includes(x.src)) cur.src = [...new Set((cur.src + x.src).split(''))].sort().join('');
        if (x.prizes) { cur.pozo = x.pozo; cur.prizes = x.prizes; if (x.plus) cur.plus = x.plus; }
      }
      const draws = [...map.values()].sort((a, b) => b.s - a.s).slice(0, KEEP);
      for (let i = 1; i < draws.length; i++) if (draws[i].d > draws[i - 1].d) throw new Error(g + ': draw numbers and dates disagree: #' + draws[i].s + ' ' + draws[i].d + ' / #' + draws[i - 1].s + ' ' + draws[i - 1].d);
      const last = draws[0] || null;
      games[g] = { name: GAMES[g].name, operator: GAMES[g].operator, latest: last ? { s: last.s, d: last.d } : null, ...(last ? behindOf(g, last.d, raw.today, raw.now) : { behind: null, expected: null }), draws };
    }
    if (!Object.values(games).some(x => x.draws.length)) throw new Error('no lotto draws yet');
    return {
      today: raw.today, checkedAt: raw.now, games, next: raw.next,
      sources: { L: LOTO, T: TK, C: 'https://cas.gob.ar/juegos/sorteos/resultados', M: MZA('quini6').replace('quini6.pdf', '') },
      conflicts: conflicts.slice(-40), notes: raw.notes.slice(0, 12), alerts: behindAlerts(games),
    };
  },
};
