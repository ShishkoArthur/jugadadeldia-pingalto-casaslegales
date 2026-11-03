// Quiniela extracts for jugadadeldia.com (docs/FEEDS.md). Every 15 minutes from cron on our server.
// Sources (official, no key, robots allow): LOTBA results JSON (Ciudad, Provincia, Cordoba, Santa Fe, Entre Rios, Mendoza in one
// answer per draw) and the IPLyC PBA day page (one PDF per turn with Provincia, Ciudad, Cordoba, Santa Fe, Entre Rios; text via
// pdftotext). The Lotería de Córdoba API is NOT used: its robots.txt disallows AI crawlers (owner rule 2026-11-03); its extract
// comes from the LOTBA and PBA copies. Tucumán is not used: its certificate does not verify and we do not switch checks off.
// A jurisdiction of a draw is published when its 20 numbers parse; it is marked "2 sources" when LOTBA and PBA agree digit by digit
// and is dropped when they differ. Output: quiniela.json (last 7 draw days, small), quiniela-archivo.json (up to 120 days, the
// history and the state of this feed), quiniela-frecuencia.json (counts of the endings 00-99).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLotba, lotbaLatest, pbaPdfs, parsePbaText, frequency, chiSquareP, JURS, TURNOS, turnoIndex, STALE_HOURS } from '../../../engine/lottery/extract.mjs';
import { readFeed, zoneTime } from '../lib.mjs';

const LOTBA = 'https://quiniela.loteriadelaciudad.gob.ar/';
const LOTBA_DRAW = n => LOTBA + 'includes/resultados-data.php?sorteo=' + n;
const PBA_DAY = d => 'https://loteria.gba.gob.ar/api-loteria/extractos/' + d;
const KEEP_DAYS = 120, DAYS_OUT = 7, BACKFILL_PER_RUN = 60, MAX_EMPTY = 15;
const PBA_JURS = JURS.filter(j => j.pba).map(j => j.id);

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const key = d => d.d + '|' + d.t;
const order = (a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : turnoIndex(a.t) - turnoIndex(b.t);

// Archive entry (compact, also what the pages read): { d: date, t: turn, s: LOTBA draw, p: PBA draw, h: 'HH:MM' (PBA "Realizado a
// las"), j: { jur: [80-digit string of the 20 numbers, 'LP' | 'L' | 'P'] }, x: [jurisdictions dropped: the two copies differ] }.
// The archive document also keeps the backfill state: gaps (LOTBA numbers that answer an empty list) and floor (a draw number
// older than the kept window: the backfill never goes below it).
function archiveOf(outDir) {
  const doc = readFeed(join(outDir, 'quiniela-archivo.json'));
  const d = doc && doc.data;
  return { draws: d && Array.isArray(d.draws) ? d.draws : [], gaps: new Set(d && d.gaps || []), floor: d && d.floor || 0 };
}
const complete = e => JURS.every(J => (e.j && e.j[J.id]) || (e.x || []).includes(J.id));

function pdfText(b64) {
  const dir = mkdtempSync(join(tmpdir(), 'pba-'));
  try {
    const f = join(dir, 'x.pdf');
    writeFileSync(f, Buffer.from(b64, 'base64'));
    return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 << 20 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export default {
  name: 'quiniela',
  cadence: 'run',
  maxAgeHours: STALE_HOURS,
  timeoutSec: 600,
  async fetch(ctx) {
    const today = ctx.today();
    const st = archiveOf(ctx.outDir), archive = st.draws;
    const have = new Map(archive.map(e => [e.s, e]));
    const out = { today, lotba: [], pba: [], notes: [], gaps: [...st.gaps], floor: st.floor, fetched: new Date().toISOString(), source: { url: LOTBA, also: [PBA_DAY(today)] } };
    // LOTBA: the newest draw from the home page, the next two numbers (the home page may lag), recent draws not complete yet,
    // then older numbers missing from the archive (backfill, limited per run)
    let latest = null;
    try {
      latest = lotbaLatest((await ctx.getText(LOTBA, { ttlHours: 0.15 })).text);
    } catch (e) { out.notes.push('LOTBA home: ' + e.message); }
    if (latest) {
      const want = [latest + 2, latest + 1];
      for (let n = latest; n > latest - 12; n--) { const e = have.get(n); if (!e || !complete(e)) want.push(n); }
      let empty = 0, back = 0;
      const oldest = addDays(today, -KEEP_DAYS);
      for (let n = latest - 12; back < BACKFILL_PER_RUN && n > st.floor && n > 0; n--) {
        if (have.has(n) || st.gaps.has(n)) continue;
        want.push(n); back++;
      }
      for (const n of want) {
        if (empty >= MAX_EMPTY) break;
        try {
          const d = parseLotba((await ctx.getText(LOTBA_DRAW(n), { accept: '*/*' })).text, n);
          if (!d) { if (n < latest) { empty++; out.gaps.push(n); } continue; }
          empty = 0;
          if (d.date < oldest) { out.floor = Math.max(out.floor, n); break; }
          out.lotba.push(d);
        } catch (e) { out.notes.push('LOTBA ' + n + ': ' + e.message.slice(0, 160)); }
      }
    }
    // PBA: today and yesterday, only while some draw of that day is not checked against it yet (5 MB per day: at most every 80 min)
    const pending = new Set();
    const byDate = {};
    for (const e of archive) (byDate[e.d] = byDate[e.d] || []).push(e);
    for (const d of out.lotba) (byDate[d.date] = byDate[d.date] || []).push({ d: d.date, t: d.turno, j: Object.fromEntries(Object.keys(d.jur).map(k => [k, ['', 'L']])) });
    for (const day of [today, addDays(today, -1)]) {
      const list = byDate[day] || [];
      if (day === today || list.some(e => PBA_JURS.some(id => e.j[id] && e.j[id][1] === 'L'))) pending.add(day);
    }
    for (const day of pending) {
      try {
        const { json } = await ctx.getJson(PBA_DAY(day), { ttlHours: day === today ? 1.3 : 20, timeoutMs: 120000 });
        for (const f of pbaPdfs(json)) {
          try { out.pba.push(parsePbaText(pdfText(f.b64), { date: day, turno: f.turno })); }
          catch (e) { out.notes.push('PBA ' + day + ' ' + f.turno + ': ' + e.message.slice(0, 160)); }
        }
      } catch (e) { out.notes.push('PBA ' + day + ': ' + e.message.slice(0, 160)); }
    }
    out.archive = archive;
    return out;
  },
  validate(raw) {
    if (!raw.lotba.length && !raw.pba.length && !raw.archive.length) throw new Error('no source answered: ' + raw.notes.join(' | '));
    if (!raw.lotba.length && !raw.pba.length && raw.notes.some(n => n.startsWith('LOTBA home'))) throw new Error('LOTBA and PBA failed: ' + raw.notes.join(' | ').slice(0, 300));
    for (const d of [...raw.lotba, ...raw.pba]) if (d.date > raw.today) throw new Error('draw in the future: ' + d.date + ' ' + d.turno);
    const ls = [...raw.lotba].sort((a, b) => a.sorteo - b.sorteo);
    for (let i = 1; i < ls.length; i++) {
      const a = ls[i - 1], b = ls[i];
      if (a.date > b.date || (a.date === b.date && turnoIndex(a.turno) >= turnoIndex(b.turno))) throw new Error('LOTBA draws out of order: ' + a.sorteo + ' ' + a.date + ' ' + a.turno + ' / ' + b.sorteo + ' ' + b.date + ' ' + b.turno);
    }
  },
  compute(raw, prev, ctx) {
    const map = new Map(raw.archive.map(e => [key(e), { ...e, j: { ...e.j }, x: [...(e.x || [])] }]));
    const conflicts = [];
    for (const d of raw.lotba) {
      const k = d.date + '|' + d.turno;
      const e = map.get(k) || { d: d.date, t: d.turno, j: {}, x: [] };
      e.s = d.sorteo;
      for (const [id, n] of Object.entries(d.jur)) {
        if (e.x.includes(id)) continue;
        const s = n.join(''), cur = e.j[id];
        e.j[id] = cur && cur[0] === s ? [s, cur[1].includes('L') ? cur[1] : 'LP'] : [s, 'L'];
      }
      map.set(k, e);
    }
    for (const p of raw.pba) {
      const k = p.date + '|' + p.turno;
      const e = map.get(k) || { d: p.date, t: p.turno, j: {}, x: [] };
      e.p = p.sorteo; e.h = p.time;
      for (const [id, n] of Object.entries(p.jur)) {
        if (e.x.includes(id)) continue;
        const s = n.join(''), cur = e.j[id];
        if (!cur) e.j[id] = [s, 'P'];
        else if (cur[0] === s) e.j[id] = [s, cur[1] === 'P' ? 'P' : 'LP'];
        else { delete e.j[id]; e.x.push(id); conflicts.push({ d: p.date, t: p.turno, jur: id }); }
      }
      map.set(k, e);
    }
    const oldest = addDays(raw.today, -KEEP_DAYS);
    const draws = [...map.values()].filter(e => e.d >= oldest && Object.keys(e.j).length).map(e => { if (!e.x.length) delete e.x; return e; }).sort(order);
    if (!draws.length) throw new Error('no draws after merge');
    const days = [...new Set(draws.map(e => e.d))].sort().slice(-DAYS_OUT);
    const recent = draws.filter(e => days.includes(e.d));
    const times = {};
    for (const e of draws) if (e.h) times[e.t] = e.h;
    const last = draws[draws.length - 1];
    const freq = {};
    for (const J of JURS) {
      const f = frequency(draws.map(e => ({ jur: e.j[J.id] ? { [J.id]: e.j[J.id][0].match(/\d{4}/g) } : {} })), J.id);
      freq[J.id] = { ...f, pHead: f.draws ? chiSquareP(f.chiHead, 99) : null, pAll: f.draws ? chiSquareP(f.chiAll, 99) : null };
      if (freq[J.id].pHead === null) { delete freq[J.id].pHead; delete freq[J.id].pAll; }
    }
    const meta = {
      today: raw.today, checkedAt: zoneTime(ctx.now || new Date()),
      jurs: JURS.map(J => ({ id: J.id, name: J.name, long: J.long, two: !!J.pba })),
      turnos: TURNOS.map(T => ({ id: T.id, name: T.name, time: times[T.id] || null })),
      sources: { lotba: LOTBA, pba: 'https://loteria.gba.gob.ar/' },
    };
    return {
      ...meta, latest: { d: last.d, t: last.t }, days, draws: recent,
      conflicts: [...conflicts, ...((prev && prev.conflicts) || []).filter(c => c.d >= addDays(raw.today, -7))].slice(0, 40),
      notes: raw.notes.slice(0, 12),
      __files: {
        'quiniela-archivo': { ...meta, from: draws[0].d, to: last.d, draws, floor: raw.floor, gaps: [...new Set(raw.gaps)].filter(n => n > raw.floor).sort((a, b) => a - b).slice(-200) },
        'quiniela-frecuencia': { ...meta, from: draws[0].d, to: last.d, freq },
      },
    };
  },
};
