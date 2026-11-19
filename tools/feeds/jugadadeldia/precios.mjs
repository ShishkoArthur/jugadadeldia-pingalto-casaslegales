// Prices of the monthly LOTBA programmes for jugadadeldia.com (docs/FEEDS.md): minimum Quiniela bet, Poceada and Loto Plus ticket,
// the big-prize threshold; and the check that every other value the site cites from these programmes is still in the new month's
// programme. Daily from cron; asks the source like the programa feed: once a month, and every day while the newest good prices
// end within NEAR_DAYS. Source (official, no key, robots.txt of both hosts answers 404; the public form, no personal data):
// POST <host>/includes/descargaPrograma.php ano=YYYY&mes=MM&version=1&juego=QUI|LTO (the "completa" version: the approved
// instrument with the rules), this month and the next. Each PDF is kept on the server (state/docs/, never published) with sha256 and
// date. A price is published only when it parses strictly (digits = words, one amount), lies in its range and moved at most MAX_JUMP
// against the last good value; otherwise the last good one stays and an alert goes out. A good price is valid until the end of its
// month ("vigente hasta"); the pages hide it after that date. The Quiniela Plus ticket of the Provincia has no monthly programme: it is
// read from the official page loteria.gba.gob.ar/juegos-tradicionales (robots.txt: "*" may read it; no AI rule) every
// PAGE_RECHECK_DAYS with the same checks, and a good value is shown for PAGE_VALID_DAYS after its last successful read.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formAnswer, monthEnd, nextYm, ymOf } from '../../../engine/lottery/programa.mjs';
import { PRICES, DOCS, PAGE_PRICES, PAGES, PAGE_VALID_DAYS, PAGE_RECHECK_DAYS, extractPrices, extractPagePrices, judgePrice, confirmFacts, checkDocument } from '../../../engine/lottery/precios.mjs';
import { PDFTOTEXT } from '../../../engine/pdf.mjs';

export const HOSTS = { QUI: 'https://quiniela.loteriadelaciudad.gob.ar/', LTO: 'https://loto.loteriadelaciudad.gob.ar/' };
export const LINKS = { QUI: HOSTS.QUI + '#programacion', LTO: HOSTS.LTO + '#programacion', PBA: PAGES.PBA.url };
const FORM = j => HOSTS[j] + 'includes/descargaPrograma.php';
const body = (ym, j) => 'ano=' + ym.slice(0, 4) + '&mes=' + ym.slice(5, 7) + '&version=1&juego=' + j;
const SRC = f => fileURLToPath(new URL('../../../data/sources/lottery/' + f + '.json', import.meta.url));
const LOTBA = SRC('lotba');
export const NEAR_DAYS = 5, RECHECK_DAYS = 31, KEEP_DOCS = 8;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
export const addDays = (d, k) => new Date(Date.parse(d + 'T12:00:00Z') + k * 864e5).toISOString().slice(0, 10);
const isPage = id => !!PAGE_PRICES[id];

function pdfText(buf) {
  const dir = mkdtempSync(join(tmpdir(), 'prc-'));
  try {
    const f = join(dir, 'p.pdf');
    writeFileSync(f, buf);
    return execFileSync(PDFTOTEXT, ['-q', '-layout', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 << 20 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// the saved copy the site was built from: the reference of the first jump check, the list of cited facts per document
export function builtCopy(file = LOTBA, src = SRC) {
  const f = JSON.parse(readFileSync(file, 'utf8'));
  const facts = {}, ym = {};
  for (const [j, doc] of Object.entries(DOCS)) {
    facts[j] = f.facts.filter(x => x.doc === doc);
    const m = /ano=(\d{4})&mes=(\d{2})/.exec((f.docs[doc] || {}).form || '');
    if (!m) throw new Error('precios: the saved copy of ' + doc + ' has no month');
    ym[j] = m[1] + '-' + m[2];
  }
  const values = Object.fromEntries(Object.keys(PRICES).map(id => [id, f.facts.find(x => x.id === id)?.value]));
  for (const [j, pg] of Object.entries(PAGES)) {
    const g = JSON.parse(readFileSync(src(pg.file), 'utf8'));
    facts[j] = g.facts.filter(x => x.doc === pg.doc);
    for (const id of Object.keys(PAGE_PRICES)) if (PAGE_PRICES[id].juego === j) values[id] = g.facts.find(x => x.id === id)?.value;
  }
  return { facts, ym, values };
}

export function dueReason(prev, today, force) {
  if (force) return 'forced';
  const own = prev && prev.prices ? Object.entries(prev.prices).filter(([id]) => !isPage(id)).map(([, p]) => p) : [];
  if (!own.length) return 'no prices yet';
  if (!prev.checked || ymOf(prev.checked) !== ymOf(today)) return 'new month';
  if (days(prev.checked, today) >= RECHECK_DAYS) return 'monthly recheck';
  const until = own.map(p => p.until).sort()[0];
  if (days(today, until) <= NEAR_DAYS) return 'prices end ' + until;
  return null;
}

// the official pages with a price (Quiniela Plus): read when no good value yet, or the last read is PAGE_RECHECK_DAYS old
export function pageDue(prev, today, force, j = 'PBA') {
  if (force) return 'forced';
  const last = prev && prev.pages && prev.pages[j];
  if (!last || !last.checked) return 'no page price yet';
  if (days(last.checked, today) >= PAGE_RECHECK_DAYS) return 'page recheck';
  return null;
}

function keep(dir, name, buf) {
  if (!dir) return null;
  mkdirSync(dir, { recursive: true });
  const f = join(dir, name);
  if (!existsSync(f)) writeFileSync(f, buf);
  const ym = x => x.slice(10, 17);
  const ours = readdirSync(dir).filter(x => /^lotba-(QUI|LTO)-\d{4}-\d{2}-[0-9a-f]{12}\.pdf$/.test(x));
  const months = [...new Set(ours.map(ym))].sort().reverse().slice(0, KEEP_DOCS);
  for (const old of ours) if (!months.includes(ym(old))) rmSync(join(dir, old), { force: true });
  return name;
}

export default {
  name: 'precios',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 300,
  async fetch(ctx) {
    const today = ctx.today();
    const prev = ctx.prev && ctx.prev.data;
    const reason = dueReason(prev, today, ctx.force);
    const out = { today, reason, docs: [], missing: [], pages: [], built: builtCopy(), fetched: new Date().toISOString(), source: { url: HOSTS.QUI, also: [FORM('QUI'), FORM('LTO'), PAGES.PBA.url] } };
    for (const [j, pg] of Object.entries(PAGES)) {
      const why = pageDue(prev, today, ctx.force, j);
      if (!why) continue;
      try {
        const r = await ctx.getText(pg.url, { ttlHours: 20, timeoutMs: 60000 });
        const { text, ...got } = extractPagePrices(j, r.text);
        out.pages.push({ juego: j, url: pg.url, reason: why, fetched: r.fetched, sha256: createHash('sha256').update(r.text).digest('hex'), ...got, ...confirmFacts(out.built.facts[j], text, null, j) });
      } catch (e) { out.pages.push({ juego: j, url: pg.url, reason: why, error: String(e.message || e).slice(0, 200) }); }
    }
    if (!reason) return out;
    for (const ym of [ymOf(today), nextYm(ymOf(today))]) {
      for (const j of ['QUI', 'LTO']) {
        const r = await ctx.getBytes(FORM(j), { method: 'POST', body: body(ym, j), ttlHours: 20, timeoutMs: 120000, headers: { Referer: HOSTS[j] } });
        const a = formAnswer(r.buf, r.type);
        if (!a.pdf) { out.missing.push(j + ' ' + ym); continue; }
        const pdf = r.buf.subarray(a.start), sha256 = createHash('sha256').update(pdf).digest('hex');
        const text = pdfText(pdf);
        const docErr = checkDocument(j, text, ym);
        if (docErr) throw new Error('precios ' + j + ' ' + ym + ': ' + docErr);
        const file = keep(ctx.docsDir, 'lotba-' + j + '-' + ym + '-' + sha256.slice(0, 12) + '.pdf', pdf);
        out.docs.push({ juego: j, ym, sha256, bytes: pdf.length, fetched: r.fetched, file, form: body(ym, j), ...extractPrices(j, text, ym), ...confirmFacts(out.built.facts[j], text, ym, j) });
      }
    }
    return out;
  },
  validate(raw) {
    for (const d of raw.docs) if (!Object.keys(d.values).length && !Object.keys(d.problems).length) throw new Error('precios ' + d.juego + ' ' + d.ym + ': no price looked for');
    for (const d of raw.pages || []) if (!d.error && !Object.keys(d.values).length && !Object.keys(d.problems).length) throw new Error('precios page ' + d.juego + ': no price looked for');
  },
  compute(raw, prev) {
    const prices = { ...((prev && prev.prices) || {}) };
    const confirmed = { ...Object.fromEntries(Object.entries(DOCS).map(([j, doc]) => [doc, { ym: raw.built.ym[j], until: monthEnd(raw.built.ym[j]), sha256: null }])), ...((prev && prev.confirmed) || {}) };
    const docs = raw.reason ? raw.docs.map(({ values, problems, confirmed: c, changed, ...d }) => ({ ...d, prices: values, problems, changed })) : (prev && prev.docs) || [];
    let alerts = raw.reason ? [] : (prev && prev.alerts) || [];
    if (raw.reason) {
      for (const d of [...raw.docs].sort((a, b) => a.ym < b.ym ? -1 : 1)) {
        const doc = { juego: d.juego, ym: d.ym, sha256: d.sha256, fetched: d.fetched.slice(0, 10) };
        for (const [id, p] of Object.entries(PRICES)) {
          if (p.juego !== d.juego) continue;
          const last = prices[id] && prices[id].ym <= d.ym ? prices[id] : null;
          if (prices[id] && prices[id].ym > d.ym) continue;
          const why = d.problems[id] || judgePrice(id, d.values[id], last ? last.value : raw.built.values[id]);
          if (why) { alerts.push({ id: 'held-' + id + '-' + d.ym, text: 'price ' + id + ' of ' + d.ym + ' held back (' + why + '); the last good one stays' + (last ? ' (' + last.value + ', until ' + last.until + ')' : '') }); continue; }
          prices[id] = { value: d.values[id], ym: d.ym, until: monthEnd(d.ym), juego: d.juego, doc };
        }
        const docId = DOCS[d.juego];
        if (d.changed.length) alerts.push({ id: 'changed-' + docId + '-' + d.ym, text: 'LOTBA ' + docId + ' ' + d.ym + ': cited values not found any more: ' + d.changed.join(', ') + ' (the site keeps the saved copy; check and update data/sources/lottery)' });
        else if (!confirmed[docId] || confirmed[docId].ym <= d.ym) confirmed[docId] = { ym: d.ym, until: monthEnd(d.ym), sha256: d.sha256 };
      }
    }
    const pages = { ...((prev && prev.pages) || {}) };
    let pageAlerts = (prev && prev.pageAlerts) || [];
    for (const d of raw.pages || []) {
      const rest = pageAlerts.filter(a => !a.id.startsWith('page-' + d.juego + '-'));
      const add = [];
      if (d.error) {
        add.push({ id: 'page-' + d.juego + '-failed', text: 'price page ' + d.url + ' not read (' + d.error + '); the last good price stays' + (pages[d.juego] ? ' (read ' + pages[d.juego].checked + ')' : '') });
        pageAlerts = [...rest, ...add];
        continue;
      }
      const doc = { juego: d.juego, url: d.url, sha256: d.sha256, fetched: d.fetched.slice(0, 10) };
      for (const [id, p] of Object.entries(PAGE_PRICES)) {
        if (p.juego !== d.juego) continue;
        const last = prices[id] || null;
        const why = d.problems[id] || judgePrice(id, d.values[id], last ? last.value : raw.built.values[id]);
        if (why) { add.push({ id: 'page-' + d.juego + '-held-' + id, text: 'price ' + id + ' of ' + d.url + ' held back (' + why + '); the last good one stays' + (last ? ' (' + last.value + ', until ' + last.until + ')' : '') }); continue; }
        prices[id] = { value: d.values[id], ym: ymOf(raw.today), until: addDays(raw.today, PAGE_VALID_DAYS), juego: d.juego, kind: 'page', checked: raw.today, doc };
      }
      if (d.changed.length) add.push({ id: 'page-' + d.juego + '-changed', text: 'price page ' + d.url + ': cited values not found any more: ' + d.changed.join(', ') + ' (the site keeps the saved copy; check and update data/sources/lottery)' });
      pages[d.juego] = { checked: raw.today, sha256: d.sha256, changed: d.changed };
      pageAlerts = [...rest, ...add];
    }
    alerts = [...alerts.filter(a => !a.id.startsWith('page-')), ...pageAlerts];
    if (!Object.keys(prices).length) throw new Error('precios: no good price yet (' + (raw.missing.join(', ') || 'nothing fetched') + ')');
    const own = Object.entries(prices).filter(([id]) => !isPage(id)).map(([, p]) => p);
    const until = (own.length ? own : Object.values(prices)).map(p => p.until).sort()[0];
    return {
      checked: raw.reason ? raw.today : (prev && prev.checked) || raw.today,
      lastReason: raw.reason || (prev && prev.lastReason) || null,
      prices, confirmed, links: LINKS, pages, pageAlerts,
      docs, missing: raw.reason ? raw.missing : (prev && prev.missing) || [],
      alerts,
      expiries: [
        { id: 'lotba-precios', what: 'LOTBA prices shown on the pages (hidden after this day without a newer programme)', until, warnDays: 0 },
        ...Object.entries(DOCS).map(([j, doc]) => ({ id: 'lotba-' + doc, what: 'LOTBA ' + doc + ': every other cited value confirmed by the programme of ' + confirmed[doc].ym, until: confirmed[doc].until, warnDays: 0 })),
        ...Object.keys(PAGE_PRICES).filter(id => prices[id]).map(id => ({ id: 'precio-' + id, what: 'price ' + id + ' read from ' + prices[id].doc.url + ' (hidden after this day without a newer good read)', until: prices[id].until, warnDays: 0 })),
      ],
    };
  },
};
