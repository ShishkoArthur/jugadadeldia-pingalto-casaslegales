// Expiry dates of the casaslegales.com inputs our server cannot refresh by itself (docs/MAINTENANCE.md). No network: it reads the
// source descriptions synced with the feed code (JSON only, never the saved documents) and the last listas.json:
//   - owner copies (pages of sites that keep AI crawlers out, or geo-blocked outside Argentina): saved copy + OWNER_COPY_MAX_AGE
//     (180 days, tools/lib/copyage.mjs; owner 2026-11-04);
//   - review data of each brand (data/sources/reviews, collected from the owner's Chrome with an Argentine VPN exit): oldest copy,
//     screenshot or host status + maxAgeDays (REVIEW_MAX_AGE = OWNER_COPY_MAX_AGE, 180 days: the owner collects them every half year);
//   - operator copies and screenshots (data/sources/operators, data/shots): oldest + maxAgeDays of operators.json.
// Every entry has warnDays 0 (an alert only once expired). Instead, REMINDER_DAYS (21) before the first expiry of anything (these
// entries and the pages of listas.json) one reminder goes to Telegram with everything that expires within REMINDER_SPAN days of it,
// grouped by what has to be done (alerts id "reminder-<first day>": once per cycle).
// Two more, apart from that reminder:
//   - repo-gate (repoGate): the copies in the repository of the pages our server checks itself (not owner copies) stop the
//     build GATE_DAYS (maxAgeDays of their set, 100) after the oldest "fetched", however fresh the server's own copies are; the
//     entry warns GATE_WARN_DAYS (21) before (a yellow alert), so a deploy is never blocked by surprise. The cure is the agent's:
//     bash tools/feeds-server.sh casaslegales pull --write, npm test, commit, sync, deploy;
//   - resave-<YYYY-MM> (resaveAlert): once a month, a reminder to the owner to save again the licence lists our server cannot
//     download (owner registries: robots.txt keeps AI crawlers out, or geo-blocked), with what the light probe of listas found;
//     listed for RESAVE_LIST_DAYS days from the first run of the month (one Telegram message), skipped for lists saved less than
//     RESAVE_FRESH_DAYS ago.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSources, listDocs } from './listas.mjs';
import { isOwnerDoc, docMaxAge, docUntil } from '../../lib/ownercopy.mjs';
import { loadReviews, REVIEW_MAX_AGE } from '../../lib/revsources.mjs';

export const REMINDER_DAYS = 21, REMINDER_SPAN = 60, GATE_WARN_DAYS = 21, RESAVE_LIST_DAYS = 3, RESAVE_FRESH_DAYS = 20;
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const oldest = xs => xs.filter(x => DAY.test(x || '')).sort()[0] || null;
const dm = d => d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4);
const short = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const readJson = f => JSON.parse(readFileSync(f, 'utf8'));

export function loadInputs(root = ROOT) {
  const ops = join(root, 'data/sources/operators/operators.json'), shots = join(root, 'data/shots/shots.json');
  return { src: loadSources(), reviews: loadReviews(), operators: existsSync(ops) ? readJson(ops) : null, shots: existsSync(shots) ? readJson(shots).shots : {} };
}

// -> [{ id, what, until, warnDays: 0, kind: 'owner'|'review'|'operators', url? }]
export function ownerExpiries({ src, reviews, operators, shots }) {
  const out = [];
  const owner = (set, slug, d, maxAge) => out.push({ id: 'owner-' + slug, kind: 'owner', url: d.url, what: 'owner copy ' + slug + ' (' + set + '): ' + short(d.url) + ', saved ' + d.fetched + ', max ' + maxAge + ' days', until: plus(d.fetched, maxAge), warnDays: 0 });
  const seen = new Set();
  const once = (set, slug, d, maxAge) => { if (!DAY.test(d.fetched || '') || seen.has(slug)) return; seen.add(slug); owner(set, slug, d, maxAge); };
  for (const r of src.registries) for (const [slug, d] of Object.entries(r.docs)) if (isOwnerDoc(d)) once('registry ' + r.id, slug, d, docMaxAge(d, r.maxAgeDays));
  for (const [slug, d] of Object.entries(src.provinces.docs || {})) if (isOwnerDoc(d)) once('provinces', slug, d, docMaxAge(d, src.provinces.maxAgeDays));
  for (const [slug, d] of Object.entries(src.rg.docs || {})) if (isOwnerDoc(d)) once('help package', slug, d, docMaxAge(d, src.rg.maxAgeDays));
  for (const [brand, r] of Object.entries(reviews || {})) {
    const o = oldest([...Object.values(r.docs || {}).map(d => d.date), ...(r.shots || []).map(s => s.date), ...Object.values(r.status || {}).map(s => s.date)]);
    if (!o) continue;
    const max = r.maxAgeDays || REVIEW_MAX_AGE;
    out.push({ id: 'review-' + brand, kind: 'review', what: 'review data ' + brand + ': ' + Object.keys(r.docs || {}).length + ' copies, ' + (r.facts || []).length + ' facts, oldest ' + o + ', max ' + max + ' days', until: plus(o, max), warnDays: 0 });
  }
  if (operators) {
    const max = operators.maxAgeDays || 100;
    const pages = Object.entries(operators.docs || {}).filter(([, d]) => !d.official);
    const o = oldest(pages.map(([, d]) => d.fetched));
    if (o) out.push({ id: 'operators-pages', kind: 'operators', what: 'operator page copies: ' + pages.length + ', oldest ' + o + ', max ' + max + ' days', until: plus(o, max), warnDays: 0 });
    const used = new Set(Object.values(operators.brands || {}).flatMap(b => b.shots || []));
    const so = oldest(Object.entries(shots || {}).filter(([id, s]) => used.has(s.id || id)).map(([, s]) => s.date));
    if (so) out.push({ id: 'operators-shots', kind: 'operators', what: 'operator screenshots: ' + used.size + ', oldest ' + so + ', max ' + max + ' days', until: plus(so, max), warnDays: 0 });
  }
  return out.sort((a, b) => a.until < b.until ? -1 : a.until > b.until ? 1 : a.id < b.id ? -1 : 1);
}

// the build gate of the repository copies the server refreshes (pull): the first day after which a deploy stops
export function repoGate({ src, operators }) {
  const rows = [];
  const add = (set, slug, d, max) => { if (d && !isOwnerDoc(d) && DAY.test(d.fetched || '')) rows.push({ set, slug, fetched: d.fetched, until: docUntil(d, max) }); };
  for (const r of src.registries) for (const [slug, d] of Object.entries(r.docs)) add('registry ' + r.id, slug, d, r.maxAgeDays);
  for (const [slug, d] of Object.entries(src.provinces.docs || {})) add('provinces', slug, d, src.provinces.maxAgeDays);
  for (const [slug, d] of Object.entries(src.rg.docs || {})) add('help package', slug, d, src.rg.maxAgeDays);
  if (operators) for (const [slug, d] of Object.entries(operators.docs || {})) if (d.official) add('operators', slug, d, operators.maxAgeDays);
  if (!rows.length) return null;
  rows.sort((a, b) => a.until < b.until ? -1 : a.until > b.until ? 1 : a.slug < b.slug ? -1 : 1);
  const first = rows[0], same = rows.filter(x => x.until === first.until).length;
  return { id: 'repo-gate', kind: 'repo', what: 'repository copies of the pages our server checks: ' + rows.length + ', oldest saved ' + first.fetched + ' (' + first.set + ' ' + first.slug + (same > 1 ? ' and ' + (same - 1) + ' more' : '') + '); deploys stop after ' + first.until + ' - bash tools/feeds-server.sh casaslegales pull --write, npm test, commit, sync, deploy', until: first.until, warnDays: GATE_WARN_DAYS };
}

// the licence lists only the owner can save, with the probe finding of listas.json for each
export function resaveList(src, today, listas) {
  const L = (listas && listas.docs) || {}, out = [];
  for (const r of src.registries) {
    const own = Object.entries(r.docs).filter(([, d]) => isOwnerDoc(d) && DAY.test(d.fetched || ''));
    if (!own.length) continue;
    const oldest = own.map(([, d]) => d.fetched).sort()[0];
    if (days(oldest, today) < RESAVE_FRESH_DAYS) continue;
    const pr = listDocs(r).map(x => L[x.doc] && L[x.doc].probe).find(Boolean) || null;
    out.push({ id: r.id, regulator: r.regulator && r.regulator.short || r.id, argentina: JSON.stringify(r).includes('outside Argentina'),
      docs: own.map(([slug, d]) => ({ slug, url: d.url, fetched: d.fetched, until: docUntil(d, r.maxAgeDays) })), probe: pr && pr.on ? { result: pr.result, on: pr.on, reason: pr.reason || '' } : null });
  }
  return out;
}
// prev: { month, on } of the last run -> { state, alert | null }
export function resaveAlert(today, list, prev) {
  const month = today.slice(0, 7), on = prev && prev.month === month && DAY.test(prev.on || '') ? prev.on : today;
  const state = { month, on };
  if (!list.length || days(on, today) >= RESAVE_LIST_DAYS) return { state, alert: null };
  const docs = list.flatMap(r => r.docs.map(d => ({ r, d })));
  const text = 'casaslegales monthly: save again from your Chrome the ' + list.length + ' licence lists our server cannot download (' + list.map(r => r.id).join(', ') + '): ' +
    docs.map(({ r, d }) => d.slug + ' ' + short(d.url) + (r.argentina ? ' (from Argentina)' : '') + ', saved ' + d.fetched).join('; ') + '. How: docs/reference/owner-saves/README.md. Server probe: ' +
    (list.map(r => r.id + ' ' + (r.probe ? r.probe.result + ' on ' + r.probe.on : 'not yet')).join('; ')) + '.';
  const params = { n: list.length, items: docs.map(({ r, d }) => ({ name: d.slug + ' ' + short(d.url) + (r.argentina ? ' (AR)' : ''), until: d.until })), probe: list.map(r => ({ name: r.id + ' (' + r.regulator + ')', result: r.probe ? r.probe.result : 'none', on: r.probe ? r.probe.on : '' })) };
  return { state, alert: { id: 'resave-' + month, text: text.slice(0, 3800), params } };
}

// listas: data of listas.json (its expiries name pages the server checks; one that is not "ok" needs a person too)
export function reminder(today, own, listas) {
  const server = ((listas && listas.expiries) || []).map(x => ({ ...x, kind: 'server', state: listas.docs && listas.docs[x.id] ? listas.docs[x.id].state : '?' }));
  const all = [...own, ...server].filter(x => DAY.test(x.until || ''));
  if (!all.length) return null;
  const first = all.map(x => x.until).sort()[0];
  if (days(today, first) > REMINDER_DAYS) return null;
  const due = all.filter(x => x.until <= plus(first, REMINDER_SPAN));
  const list = (xs, f, n = 12) => xs.slice(0, n).map(f).join('; ') + (xs.length > n ? '; and ' + (xs.length - n) + ' more' : '');
  const g = k => due.filter(x => x.kind === k);
  const parts = ['casaslegales reminder: the first input expires on ' + dm(first) + ' (' + days(today, first) + ' days). The live site keeps working, but deploys stop and help lines hide when copies are too old.'];
  if (g('owner').length) parts.push('1) Save from your Chrome (Ctrl+U, Ctrl+S, page source .html; Santa Fe, Mendoza and Tucumán from Argentina): ' + list(g('owner'), x => x.id.replace(/^owner-/, '') + ' ' + short(x.url) + ' until ' + dm(x.until)) + '. How: docs/reference/owner-saves/README.md.');
  if (g('server').length) parts.push('2) Our server could not refresh (save these from Chrome in Argentina too): ' + list(g('server'), x => x.id + ' until ' + dm(x.until) + ' (' + x.state + ')') + '.');
  if (g('review').length) parts.push('3) Collect the reviews again from Chrome with the Argentine VPN (docs/REVIEWS-DATA.md): ' + list(g('review'), x => x.id.replace(/^review-/, '') + ' until ' + dm(x.until), 30) + '.');
  if (g('operators').length) parts.push('4) Operator copies and screenshots (node tools/capture-shots.mjs, Chrome in Argentina for geo-blocked ones): ' + list(g('operators'), x => x.id + ' until ' + dm(x.until)) + '.');
  parts.push('Then send the files to the agent; checklist: docs/MAINTENANCE.md.');
  // params: the same lists for the Russian Telegram template (tools/feeds/alerts.mjs, data/alerts/ru.json)
  const items = (k, f, n = 40) => g(k).slice(0, n).map(x => ({ name: f(x), until: x.until }));
  const params = { first, days: days(today, first), owner: items('owner', x => x.id.replace(/^owner-/, '') + ' ' + short(x.url)), server: items('server', x => x.id + ' (' + x.state + ')'),
    review: items('review', x => x.id.replace(/^review-/, '')), operators: items('operators', x => x.id) };
  return { id: 'reminder-' + first, text: parts.join('\n').slice(0, 3800), params };
}

export default {
  name: 'plazos',
  cadence: 'run',
  maxAgeHours: 72,
  async fetch(ctx) {
    let listas = null;
    try { const f = join(ctx.outDir || '', 'listas.json'); if (ctx.outDir && existsSync(f)) listas = readJson(f).data; } catch { listas = null; }
    return { inputs: loadInputs(), listas, today: ctx.today(), fetched: new Date().toISOString(), source: { url: null } };
  },
  validate(raw) {
    if (!raw.inputs.src.registries.length) throw new Error('plazos: no registries synced');
    ownerExpiries(raw.inputs);
  },
  compute(raw, prev) {
    const own = ownerExpiries(raw.inputs), gate = repoGate(raw.inputs);
    const expiries = gate ? [...own, gate] : own;
    const r = reminder(raw.today, own, raw.listas);
    const rs = resaveAlert(raw.today, resaveList(raw.inputs.src, raw.today, raw.listas), prev && prev.resave);
    return { count: expiries.length, reminderDays: REMINDER_DAYS, gate: gate ? gate.until : null, expiries, resave: rs.state, alerts: [...(r ? [r] : []), ...(rs.alert ? [rs.alert] : [])] };
  },
};
