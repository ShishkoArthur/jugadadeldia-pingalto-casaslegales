// Lotto games for jugadadeldia.com (docs/FEEDS.md, research docs/research/JDD-SOURCES-2026-11-04.md). Hourly.
// Official sources reachable from our server (robots.txt of each answers 404 = no rules; checked 2026-11-04):
//   Loto Plus   LOTBA loto.loteriadelaciudad.gob.ar (operator; JSON in includes/resultados-data.php, with prizes) + copy at San Juan CAS
//   Telekino    www.telekino.com.ar (the game's own site, latest draw) + copy at San Juan CAS
//   Quini 6, Brinco   only the copy at San Juan CAS: the operator (Lotería de Santa Fe) answers 403 to our server (geo-block, not
//               bypassed). CAS lags behind sometimes: each game carries `behind` (scheduled draws missing since its latest) and the
//               pages must say "pendiente de publicación oficial" instead of pretending the old draw is the newest.
// Two copies of one draw must agree number by number ("2 fuentes"), else that draw is not published and goes to conflicts.
// Output: loterias.json { games: { id: { draws (newest first, up to KEEP), latest, behind, expected } }, conflicts, notes }.
import { zoneTime } from '../lib.mjs';
import { decode, isoFromDmy } from './provincias-parse.mjs';

const LOTO = 'https://loto.loteriadelaciudad.gob.ar/';
const LOTO_DRAW = n => LOTO + 'includes/resultados-data.php?sorteo=' + n;
const TK = 'https://www.telekino.com.ar/';
const CAS = (g, d) => 'https://cas.gob.ar/juegos/sorteos/resultados?juego=' + g + (d ? '&fecha=' + d : '');
const KEEP = 30, STALE = 4;

// schedule (days of week, 0 = Sunday) and the hour after which the day's draw should be published, Argentine time
export const GAMES = {
  'loto-plus': { name: 'Loto Plus', operator: 'Lotería de la Ciudad de Buenos Aires', cas: 'loto', days: [3, 6], after: '23:30', max: 45, size: 6,
    mods: { Tradicional: 'tradicional', Match: 'match', Desquite: 'desquite', 'Sale o Sale': 'sale-o-sale' } },
  telekino: { name: 'Telekino', operator: 'Telekino', cas: 'telekino', days: [0], after: '23:00', min: 1, max: 25, size: 15,
    mods: { '': 'telekino', Telekino: 'telekino', Rekino: 'rekino' } },
  'quini-6': { name: 'Quini 6', operator: 'Lotería de Santa Fe', cas: 'quini6', days: [0, 3], after: '23:30', max: 45, size: 6,
    mods: { Tradicional: 'tradicional', 'Segunda Vuelta': 'segunda', Revancha: 'revancha', 'Siempre Sale': 'siempre-sale' } },
  brinco: { name: 'Brinco', operator: 'Lotería de Santa Fe', cas: 'brinco', days: [0], after: '23:00', max: 39, size: 6,
    mods: { Tradicional: 'tradicional', Junior: 'junior' } },
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
    const out = { today: ctx.today(), now: zoneTime(ctx.now || new Date()), got: [], notes: [], ok: 0, failed: 0, next: { ...((prev && prev.next) || {}) }, prev, fetched: new Date().toISOString(), source: { url: LOTO, also: [TK, 'https://cas.gob.ar/'] } };
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
      sources: { L: LOTO, T: TK, C: 'https://cas.gob.ar/juegos/sorteos/resultados' },
      conflicts: conflicts.slice(-40), notes: raw.notes.slice(0, 12),
    };
  },
};
