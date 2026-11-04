// Provincial quinielas for jugadadeldia.com (docs/FEEDS.md, research docs/research/JDD-SOURCES-2026-11-04.md). Every 15 minutes.
// Official sources, reachable from our server, robots.txt without rules against us or AI agents (checked 2026-11-04):
//   Tucumán (Caja Popular JSON; the server omits its intermediate CA: we add the pinned public intermediate, verification stays on),
//   San Juan (CAS HTML by date), Chaco and Corrientes (Lotería Chaqueña HTML by date and turn; Corrientes is the Chaco copy: the
//   Corrientes lottery publishes no extract we can read), Misiones and Misiones Plus (IPLyC HTML, latest draw of each turn).
// Chaco and Misiones pages also print the Ciudad/Provincia (and Córdoba) extract of the same turn: those columns must equal our
// LOTBA/PBA archive (quiniela-archivo.json) before the page is used - proof that the columns and places were read right.
// Output: provincias.json (last 7 draw days) and provincias-archivo.json (up to 120 days; also the state: checked days, dropped keys).
import tls from 'node:tls';
import { join } from 'node:path';
import { readFeed, zoneTime } from '../lib.mjs';
import { tucumanIntermediate, parseTucumanDay, parseTucumanRegistro, parseSanJuan, parseChaco, parseMisiones, CHACO_CODES, MIS_PAGES, dmyDash, checkTwenty } from './provincias-parse.mjs';

const TUC = 'https://resultadosquiniela.cajapopular.gov.ar/';
const TUC_DAY = d => TUC + 'api/extracto/?fecha_sorteo=' + d;
const TUC_REG = id => TUC + 'api/extracto-registro/?id=' + id;
const SJ = 'https://cas.gob.ar/';
const SJ_DAY = d => SJ + '?fecha=' + d;
const CHA = 'https://loteria.chaco.gov.ar/';
const CHA_PAGE = (d, t) => CHA + 'ver_extracto/' + dmyDash(d) + '/' + CHACO_CODES[t];
const MIS = 'https://www.loteriademisiones.com.ar/portal/juegos/';
const MIS_PAGE = t => MIS + MIS_PAGES[t] + '/';
const KEEP_DAYS = 120, DAYS_OUT = 7, BACK_DAYS = 21, BACK_PER_RUN = 1, STALE = 3;
// LOTBA grid (Chaco and Misiones draw at the same times): a turn page is asked for only after its time + 20 minutes.
const GRID = { PREV: '10:15', PRIM: '12:00', MATU: '15:00', VESP: '18:00', NOCT: '21:00' };
const GRID_T = Object.keys(GRID);

export const JURS = [
  { id: 'tucuman', name: 'Tucumán', long: 'Quiniela de Tucumán', operator: 'Caja Popular de Ahorros de la Provincia de Tucumán', source: TUC, src: 'tuc',
    turnos: [['MATU', 'Matutino', '11:30'], ['VESP', 'Vespertino', '14:30'], ['SIES', 'De la Siesta', '17:30'], ['TARD', 'De la Tarde', '19:30'], ['NOCT', 'Nocturno', '22:00']] },
  { id: 'san-juan', name: 'San Juan', long: 'Quiniela de San Juan', operator: 'Caja de Acción Social de San Juan', source: SJ, src: 'sj',
    turnos: [['PREV', 'La Previa', null], ['PRIM', 'Primera', null], ['MATU', 'Matutino', null], ['VESP', 'Vespertino', null], ['TARD', 'Tarde', null], ['NOCT', 'Nocturno', null]] },
  { id: 'chaco', name: 'Chaco', long: 'Quiniela Chaqueña', operator: 'Lotería Chaqueña', source: CHA, src: 'cha', grid: true },
  { id: 'corrientes', name: 'Corrientes', long: 'Quiniela Correntina', operator: 'Instituto de Lotería y Casinos de Corrientes', source: CHA, src: 'cha', via: 'Lotería Chaqueña', grid: true },
  { id: 'misiones', name: 'Misiones', long: 'Quiniela Misionera', operator: 'IPLyC S.E. Misiones', source: 'https://www.loteriademisiones.com.ar/portal/', src: 'mis', grid: true },
  { id: 'misiones-plus', name: 'Misiones Plus', long: 'Quiniela Misionera Plus', operator: 'IPLyC S.E. Misiones', source: 'https://www.loteriademisiones.com.ar/portal/', src: 'mis', grid: true },
];
const GRID_NAMES = { PREV: 'La Previa', PRIM: 'Primera', MATU: 'Matutina', VESP: 'Vespertina', NOCT: 'Nocturna' };
for (const J of JURS) if (J.grid) J.turnos = GRID_T.map(t => [t, GRID_NAMES[t], GRID[t]]);
const ORDER = Object.fromEntries(JURS.map(J => [J.id, J.turnos.map(t => t[0])]));
const REF = ['caba', 'buenos-aires', 'cordoba', 'santa-fe', 'entre-rios'];
let caAdded = false;

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const key = e => e.j + '|' + e.d + '|' + e.t;
const minutes = hm => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
const order = (a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.j < b.j ? -1 : a.j > b.j ? 1 : ORDER[a.j].indexOf(a.t) - ORDER[b.j].indexOf(b.t);

function stateOf(outDir) {
  const doc = readFeed(join(outDir, 'provincias-archivo.json'));
  const d = doc && doc.data;
  return { draws: d && Array.isArray(d.draws) ? d.draws : [], checked: d && d.checked || {}, x: d && Array.isArray(d.x) ? d.x : [] };
}
// The LOTBA/PBA archive of the quiniela feed: "date|turn" -> { caba, buenos-aires, cordoba, santa-fe, entre-rios: 80-digit strings }.
function referenceOf(outDir) {
  const doc = readFeed(join(outDir, 'quiniela-archivo.json'));
  const map = new Map();
  for (const e of (doc && doc.data && doc.data.draws) || []) {
    const r = {};
    for (const id of REF) if (e.j && e.j[id]) r[id] = e.j[id][0];
    map.set(e.d + '|' + e.t, r);
  }
  return map;
}
// Compares the reference columns of a Chaco/Misiones page with our archive: { ok: matched count, bad: [ids that differ] }.
export function refCheck(cols, ref) {
  const out = { ok: 0, bad: [] };
  for (const id of REF) {
    if (!cols[id] || !ref || !ref[id]) continue;
    if (cols[id].join('') === ref[id]) out.ok++; else out.bad.push(id);
  }
  return out;
}

export default {
  name: 'provincias',
  cadence: 'run',
  maxAgeHours: STALE,
  timeoutSec: 420,
  async fetch(ctx) {
    const now = ctx.now || new Date();
    const today = ctx.today(), yesterday = addDays(today, -1), nowMin = minutes(zoneTime(now));
    const st = stateOf(ctx.outDir);
    const have = new Set(st.draws.map(key));
    const has = (j, d, t) => have.has(j + '|' + d + '|' + t);
    const checked = Object.fromEntries(['tuc', 'sj', 'cha'].map(s => [s, new Set(st.checked[s] || [])]));
    const out = { today, found: [], refs: [], notes: [], ok: {}, failed: {}, checkedNew: { tuc: [], sj: [], cha: [] }, archive: st.draws, x: st.x, checked: st.checked, fetched: now.toISOString(), source: { url: TUC, also: [SJ, CHA, MIS] } };
    const fail = (src, msg) => { out.failed[src] = (out.failed[src] || 0) + 1; out.notes.push(msg.slice(0, 200)); };
    const okd = src => { out.ok[src] = (out.ok[src] || 0) + 1; };
    // the days to look at for a date-addressable source: today, yesterday, then the newest unchecked older days (backfill)
    const daysFor = src => {
      const list = [today, yesterday].filter(d => !checked[src].has(d));
      let back = 0;
      for (let i = 2; i <= BACK_DAYS && back < BACK_PER_RUN; i++) { const d = addDays(today, -i); if (!checked[src].has(d)) { list.push(d); back++; } }
      return list;
    };
    // Tucumán: the day list, then the numbers of each turn we do not have yet
    let ca = null;
    try { ca = tucumanIntermediate(now); } catch (e) { fail('tuc', e.message); }
    if (ca) {
      if (!caAdded) { tls.setDefaultCACertificates([...tls.getCACertificates('default'), ca]); caAdded = true; }
      for (const d of daysFor('tuc')) {
        if (d === today && nowMin < minutes('11:45')) continue;
        try {
          const items = parseTucumanDay((await ctx.getJson(TUC_DAY(d), { ttlHours: d === today ? 0.2 : 2 })).json, d);
          okd('tuc');
          let complete = true;
          for (const it of items) {
            if (has('tucuman', d, it.turno)) continue;
            try { out.found.push({ j: 'tucuman', d, t: it.turno, s: it.sorteo, h: it.time, n: parseTucumanRegistro((await ctx.getJson(TUC_REG(it.id), { ttlHours: 24 })).json, it.id) }); }
            catch (e) { complete = false; fail('tuc', e.message); }
          }
          if (d < today && complete) out.checkedNew.tuc.push(d);
        } catch (e) { fail('tuc', e.message.startsWith('Tucumán') ? e.message : 'Tucumán ' + d + ': ' + e.message); }
      }
    }
    // San Juan: one page per day with all its turns
    for (const d of daysFor('sj')) {
      if (d === today && nowMin < minutes('11:00')) continue;
      try {
        const p = parseSanJuan((await ctx.getText(SJ_DAY(d), { ttlHours: d === today ? 0.2 : 2 })).text, d);
        okd('sj');
        for (const x of p.draws) if (!has('san-juan', d, x.turno)) out.found.push({ j: 'san-juan', d, t: x.turno, s: x.sorteo, n: x.numbers });
        if (d < today) out.checkedNew.sj.push(d);
      } catch (e) { fail('sj', e.message.startsWith('San Juan') ? e.message : 'San Juan ' + d + ': ' + e.message); }
    }
    // Chaco (Chaqueña + Correntina): one page per day and turn, only for turns we do not have and that should be drawn by now
    for (const d of daysFor('cha')) {
      let complete = true;
      for (const t of GRID_T) {
        if (has('chaco', d, t)) continue;
        if (d === today && nowMin < minutes(GRID[t]) + 20) { complete = false; continue; }
        try {
          const p = parseChaco((await ctx.getText(CHA_PAGE(d, t), { ttlHours: d === today ? 0.2 : 2 })).text, d, t);
          okd('cha');
          if (p) out.refs.push({ src: 'cha', ...p }); else if (d === today) complete = false;
        } catch (e) { complete = false; fail('cha', e.message.startsWith('Chaco') ? e.message : 'Chaco ' + d + ' ' + t + ': ' + e.message); }
      }
      if (d < today && complete) out.checkedNew.cha.push(d);
    }
    // Misiones: the latest draw of each turn page (no other date can be asked for)
    for (const t of GRID_T) {
      const due = nowMin >= minutes(GRID[t]) + 20;
      if (due ? has('misiones', today, t) : has('misiones', yesterday, t)) continue;
      try {
        const p = parseMisiones((await ctx.getText(MIS_PAGE(t), { ttlHours: due ? 0.2 : 2 })).text, t);
        okd('mis');
        out.refs.push({ src: 'mis', ...p });
      } catch (e) { fail('mis', e.message.startsWith('Misiones') ? e.message : 'Misiones ' + t + ': ' + e.message); }
    }
    out.reference = Object.fromEntries([...new Set(out.refs.map(r => r.date + '|' + r.turno))].map(k => [k, referenceOf(ctx.outDir).get(k) || null]));
    return out;
  },
  validate(raw) {
    const asked = Object.keys(raw.ok).length + Object.keys(raw.failed).length;
    if (asked && !Object.keys(raw.ok).length && !raw.archive.length) throw new Error('no source answered: ' + raw.notes.join(' | ').slice(0, 300));
    if (asked && !Object.keys(raw.ok).length && Object.values(raw.failed).reduce((a, b) => a + b, 0) >= 3) throw new Error('all provincial sources failed: ' + raw.notes.join(' | ').slice(0, 300));
    for (const f of raw.found) {
      if (f.d > raw.today) throw new Error('draw in the future: ' + f.j + ' ' + f.d);
      checkTwenty(f.n, f.j + ' ' + f.d + ' ' + f.t);
    }
  },
  compute(raw, prev, ctx) {
    const map = new Map(raw.archive.map(e => [key(e), e]));
    const dropped = new Set(raw.x);
    const conflicts = [], notes = [...raw.notes];
    const put = (e, extra) => {
      const k = key(e);
      if (dropped.has(k)) return;
      const n = e.n.join('');
      const cur = map.get(k);
      if (cur && cur.n !== n) { map.delete(k); dropped.add(k); conflicts.push({ j: e.j, d: e.d, t: e.t, why: 'source changed the numbers' }); return; }
      if (!cur) map.set(k, { j: e.j, d: e.d, t: e.t, s: e.s, ...(e.h ? { h: e.h } : {}), ...extra, n });
    };
    for (const f of raw.found) put(f, {});
    for (const p of raw.refs) {
      if (p.date > raw.today) { notes.push(p.src + ' ' + p.turno + ': page date ' + p.date + ' is after today'); continue; }
      const chk = refCheck(p.cols, raw.reference[p.date + '|' + p.turno]);
      if (chk.bad.length) { conflicts.push({ j: p.src === 'cha' ? 'chaco' : 'misiones', d: p.date, t: p.turno, why: 'reference columns differ from LOTBA/PBA: ' + chk.bad.join(',') }); continue; }
      if (!chk.ok) { notes.push(p.src + ' ' + p.date + ' ' + p.turno + ': held back until LOTBA/PBA have this turn'); continue; }
      const own = p.src === 'cha' ? ['chaco', 'corrientes'] : ['misiones', 'misiones-plus'];
      for (const j of own) {
        if (!p.cols[j]) continue;
        if (REF.some(r => p.cols[r] && p.cols[r].join('') === p.cols[j].join(''))) { conflicts.push({ j, d: p.date, t: p.turno, why: 'equals a reference column' }); continue; }
        put({ j, d: p.date, t: p.turno, s: p.sorteo, n: p.cols[j] }, { c: chk.ok });
      }
    }
    const oldest = addDays(raw.today, -KEEP_DAYS);
    const draws = [...map.values()].filter(e => e.d >= oldest).sort(order);
    // draw numbers of one jurisdiction and turn grow with the date (a step back is reported, the pages still show both days)
    const lastS = {};
    for (const e of draws) {
      const k = e.j + '|' + e.t;
      if (lastS[k] && e.s <= lastS[k].s && e.d > lastS[k].d) notes.push('draw number goes back: ' + e.j + ' ' + e.t + ' ' + lastS[k].d + ' #' + lastS[k].s + ' / ' + e.d + ' #' + e.s);
      lastS[k] = e;
    }
    if (!draws.length) throw new Error('no provincial draws yet');
    const days = [...new Set(draws.map(e => e.d))].sort().slice(-DAYS_OUT);
    const latest = {};
    for (const e of draws) latest[e.j] = { d: e.d, t: e.t };
    const checked = {};
    for (const s of ['tuc', 'sj', 'cha']) checked[s] = [...new Set([...(raw.checked[s] || []), ...raw.checkedNew[s]])].filter(d => d >= addDays(raw.today, -BACK_DAYS - 2)).sort();
    const meta = {
      today: raw.today, checkedAt: zoneTime(ctx.now || new Date()),
      jurs: JURS.map(J => ({ id: J.id, name: J.name, long: J.long, operator: J.operator, source: J.source, ...(J.via ? { via: J.via } : {}), checked: J.src === 'cha' || J.src === 'mis', turnos: J.turnos.map(([id, name, time]) => ({ id, name, time })) })),
      sources: { ok: raw.ok, failed: raw.failed },
    };
    return {
      ...meta, latest, days, draws: draws.filter(e => days.includes(e.d)),
      conflicts: [...conflicts, ...((prev && prev.conflicts) || []).filter(c => c.d >= addDays(raw.today, -7))].slice(0, 40),
      notes: notes.slice(0, 16),
      __files: { 'provincias-archivo': { ...meta, from: draws[0].d, to: draws[draws.length - 1].d, draws, checked, x: [...dropped].slice(-300) } },
    };
  },
};
