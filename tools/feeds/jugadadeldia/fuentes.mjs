// Expiry dates of the saved sources jugadadeldia.com is built from (docs/FEEDS.md, half-year check). No network: it reads the source
// descriptions synced with the feed code (data/sources/<set>/*.json, without the saved documents) and lists, for the health report,
// the last day each input is valid:
//   - lottery rules and pages (LOTBA, PBA, CAS): saved copy + maxAgeDays of its file (after that the build stops);
//   - the monthly programmes (a document fetched with a form "mes") are not listed here: the feed precios checks every cited value
//     against the programme of each new month and lists how far they are confirmed;
//   - the help package (rg): oldest copy + maxAgeDays (after that its lines are hidden and the build gate fails);
//   - card and dice game rules: oldest copy + GAME_MAX_AGE (sites/jugadadeldia/content/sources.mjs).
// warnDays 14 (an alert two weeks ahead).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../../data/sources/', import.meta.url));
export const GAME_MAX_AGE = 183;
export const WARN_DAYS = 14;
const GAMES = ['truco', 'generala', 'chinchon', 'escoba', 'burako'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const readJson = f => JSON.parse(readFileSync(f, 'utf8'));
const oldest = docs => Object.values(docs || {}).map(d => d && d.fetched).filter(x => DAY.test(x || '')).sort()[0] || null;

// sets: { lottery: [{ id, maxAgeDays, docs }], rg: { maxAgeDays, docs }, games: { <game>: { docs } } } -> expiries
export function sourceExpiries(sets) {
  const out = [];
  for (const f of sets.lottery || []) {
    for (const [slug, d] of Object.entries(f.docs || {})) {
      if (!DAY.test(d.fetched || '')) throw new Error('sources: ' + f.id + ' ' + slug + ' has no fetched date');
      if (/(?:^|&)ano=\d{4}&mes=\d{2}(?:&|$)/.test(d.form || '')) continue;
      if (!(f.maxAgeDays > 0)) throw new Error('sources: ' + f.id + ' has no maxAgeDays');
      out.push({ id: f.id + '-' + slug, what: f.id.toUpperCase() + ' ' + slug + ': saved copy of ' + d.fetched + ', max ' + f.maxAgeDays + ' days', until: plus(d.fetched, f.maxAgeDays), warnDays: WARN_DAYS });
    }
  }
  if (sets.rg) {
    const o = oldest(sets.rg.docs), max = sets.rg.maxAgeDays || 100;
    if (!o) throw new Error('sources: the help package has no dated documents');
    out.push({ id: 'rg-package', what: 'help package (lines, self-exclusion, ages): ' + Object.keys(sets.rg.docs).length + ' copies, oldest ' + o + ', max ' + max + ' days', until: plus(o, max), warnDays: WARN_DAYS });
  }
  for (const [g, j] of Object.entries(sets.games || {})) {
    const o = oldest(j.docs);
    if (!o) throw new Error('sources: ' + g + ' rules have no dated documents');
    out.push({ id: 'rules-' + g, what: g + ' rules: ' + Object.keys(j.docs).length + ' copies, oldest ' + o + ', max ' + GAME_MAX_AGE + ' days', until: plus(o, GAME_MAX_AGE), warnDays: WARN_DAYS });
  }
  return out;
}

export function readSets(root = SRC) {
  const dir = join(root, 'lottery');
  if (!existsSync(dir)) throw new Error('sources not synced: ' + dir);
  const lottery = readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => readJson(join(dir, f))).filter(f => f.docs && Object.keys(f.docs).length);
  const rg = readJson(join(root, 'rg/helplines.json'));
  const games = Object.fromEntries(GAMES.map(g => [g, readJson(join(root, g, 'rules.json'))]));
  return { lottery: lottery.map(f => ({ id: f.id, maxAgeDays: f.maxAgeDays, docs: f.docs })), rg: { maxAgeDays: rg.maxAgeDays, docs: rg.docs }, games: Object.fromEntries(Object.entries(games).map(([g, j]) => [g, { docs: j.docs }])) };
}

export default {
  name: 'fuentes',
  cadence: 'daily',
  maxAgeHours: 72,
  async fetch() {
    return { sets: readSets(), fetched: new Date().toISOString(), source: { url: null } };
  },
  validate(raw) {
    if (!raw.sets.lottery.length) throw new Error('sources: no lottery files');
    sourceExpiries(raw.sets);
  },
  compute(raw) {
    const expiries = sourceExpiries(raw.sets);
    return { count: expiries.length, expiries };
  },
};
