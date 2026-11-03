// LOTBA draw programme (programación) of La Quiniela de la Ciudad for /quiniela/horarios/ (docs/FEEDS.md). Daily from cron, but it
// asks the source only when needed: once a month (a new month, or 31 days since the last check), and every day while the newest
// valid programme ends within NEAR_DAYS (or has ended). Source (official, no key; robots.txt of the host answers 404 = no rules;
// the same public form the site offers, no personal data): POST includes/descargaPrograma.php ano=YYYY&mes=MM&version=1|0&juego=QUI
// for this month and the next one. PDF text via pdftotext; parse, merge and checks in engine/lottery/programa.mjs. A month that is not
// uploaded yet answers an HTML notice: the previous months stay, nothing fails. Output programa.json: the rows of the kept months
// (from the month before today on), their sources, and one expiry (the last programmed day) for the health report: the alert goes
// out only once that day has passed without a newer programme.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseProgramText, mergeVersions, joinMonths, checkAgainstArchive, formAnswer, validateMonth, ymOf, nextYm } from '../../../engine/lottery/programa.mjs';
import { readFeed } from '../lib.mjs';

const HOME = 'https://quiniela.loteriadelaciudad.gob.ar/';
const FORM = HOME + 'includes/descargaPrograma.php';
const body = (ym, v) => 'ano=' + ym.slice(0, 4) + '&mes=' + ym.slice(5, 7) + '&version=' + v + '&juego=QUI';
const VERSIONS = [[1, 'completa'], [0, 'simple']];
export const NEAR_DAYS = 5;
export const RECHECK_DAYS = 31;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const prevYm = ym => { const y = +ym.slice(0, 4), m = +ym.slice(5, 7); return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0'); };

function pdfText(buf) {
  const dir = mkdtempSync(join(tmpdir(), 'prog-'));
  try {
    const f = join(dir, 'p.pdf');
    writeFileSync(f, buf);
    return execFileSync('pdftotext', ['-q', '-layout', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 << 20 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Is a request due? prev: the previous data. Returns the reason or null.
export function dueReason(prev, today, force) {
  if (force) return 'forced';
  if (!prev || !Array.isArray(prev.rows) || !prev.rows.length) return 'no programme yet';
  if (!prev.checked || ymOf(prev.checked) !== ymOf(today)) return 'new month';
  if (days(prev.checked, today) >= RECHECK_DAYS) return 'monthly recheck';
  if (days(today, prev.to) <= NEAR_DAYS) return 'programme ends ' + prev.to;
  return null;
}

// rows of the document <-> compact rows of the file [n, date, time, type, jurisdictions]
const pack = r => [r.n, r.d, r.t, r.type, r.j];
const unpack = a => ({ n: a[0], d: a[1], t: a[2], type: a[3], j: a[4] });

export default {
  name: 'programa',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 300,
  async fetch(ctx) {
    const today = ctx.today();
    const prev = ctx.prev && ctx.prev.data;
    const reason = dueReason(prev, today, ctx.force);
    const doc = readFeed(join(ctx.outDir, 'quiniela-archivo.json'));
    const out = { today, reason, months: {}, missing: [], notes: [], archive: doc && doc.data && Array.isArray(doc.data.draws) ? doc.data.draws : [], prev: prev || null, fetched: new Date().toISOString(), source: { url: HOME, also: [FORM] } };
    if (!reason) return out;
    for (const ym of [ymOf(today), nextYm(ymOf(today))]) {
      const got = {}, files = [];
      for (const [v, label] of VERSIONS) {
        const r = await ctx.getBytes(FORM, { method: 'POST', body: body(ym, v), ttlHours: 20, timeoutMs: 120000, headers: { Referer: HOME } });
        const a = formAnswer(r.buf, r.type);
        if (!a.pdf) continue;
        got[label] = parseProgramText(pdfText(r.buf.subarray(a.start)), ym);
        files.push({ version: label, form: body(ym, v), bytes: r.buf.length, sha256: createHash('sha256').update(r.buf).digest('hex'), fetched: r.fetched });
      }
      if (!files.length) { out.missing.push(ym); continue; }
      const m = mergeVersions(got.completa && got.completa.length ? got.completa : null, got.simple && got.simple.length ? got.simple : null, ym);
      if (!m) throw new Error('program ' + ym + ': PDF without any draw row');
      out.months[ym] = { rows: m.rows, used: m.used, files };
      out.notes.push(...m.notes);
    }
    return out;
  },
  validate(raw) {
    for (const [ym, m] of Object.entries(raw.months)) validateMonth(m.rows, ym);
  },
  compute(raw, prevData) {
    const keepFrom = prevYm(ymOf(raw.today));
    const months = {};
    for (const m of (prevData && prevData.months) || []) if (m.ym >= keepFrom) months[m.ym] = { ...m, rows: (prevData.rows || []).map(unpack).filter(r => ymOf(r.d) === m.ym) };
    for (const [ym, m] of Object.entries(raw.months)) months[ym] = { ym, used: m.used, files: m.files, rows: m.rows };
    const list = Object.values(months).filter(m => m.rows.length);
    if (!list.length) throw new Error('program: nothing published yet for ' + ymOf(raw.today) + ' and no previous programme');
    const rows = joinMonths(list);
    const compared = checkAgainstArchive(rows, raw.archive);
    const from = rows[0].d, to = rows[rows.length - 1].d;
    const checked = raw.reason ? raw.today : (prevData && prevData.checked) || raw.today;
    const notes = raw.reason ? [...raw.notes, ...raw.missing.map(ym => ym + ': not published yet')] : (prevData && prevData.notes) || [];
    return {
      from, to, checked, lastReason: raw.reason || (prevData && prevData.lastReason) || null, compared,
      months: list.map(m => ({ ym: m.ym, used: m.used, files: m.files, from: m.rows[0].d, to: m.rows[m.rows.length - 1].d, draws: m.rows.length })),
      notes,
      rows: rows.map(pack),
      expiries: [{ id: 'lotba-programa', what: 'LOTBA draw programme (quiniela/horarios); next month from the form ' + FORM, until: to, warnDays: 0 }],
    };
  },
};
