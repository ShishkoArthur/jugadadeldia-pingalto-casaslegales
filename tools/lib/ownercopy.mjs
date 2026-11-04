// Sites whose robots.txt disallows ClaudeBot and other AI crawlers (docs/TRAPS.md, 2026-11-03; hcdn.gob.ar found by the server
// recheck tools/feeds/casaslegales/listas.mjs on 2026-11-04): we never download them again.
// Copies already saved from them stay (the facts on the site keep their quotes), marked pendingOwnerCopy: true; the owner saves
// the same pages from his own browser (docs/reference/owner-saves/README.md) and tools/owner-copy.mjs swaps the copy in
// (copiedBy: "owner", pendingOwnerCopy removed). The build prints the pending list as a reminder; it does not fail.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../env.mjs';
import { daysBetween } from '../../engine/format.mjs';

export const AI_BLOCKED_HOSTS = ['loteriadecordoba.com.ar', 'ijan-neuquen.com', 'loteriaderionegro.gob.ar', 'enrejasalta.com.ar', 'hcdn.gob.ar'];
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
export const isAiBlocked = url => AI_BLOCKED_HOSTS.some(h => hostOf(url) === h || hostOf(url).endsWith('.' + h));

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
// every saved document of every source set: { set, file (json), slug, doc }
export function allSourceDocs() {
  const out = [];
  const regDir = 'data/sources/registries';
  for (const f of fs.readdirSync(path.join(ROOT, regDir)).filter(f => f.endsWith('.json')).sort()) {
    const j = read(regDir + '/' + f);
    for (const [slug, doc] of Object.entries(j.docs || {})) out.push({ set: 'registry ' + j.id, json: regDir + '/' + f, slug, doc });
  }
  for (const [set, json] of [['provinces', 'data/sources/provinces/provinces.json'], ['help package', 'data/sources/rg/helplines.json'], ['operators', 'data/sources/operators/operators.json']]) {
    if (!fs.existsSync(path.join(ROOT, json))) continue;
    for (const [slug, doc] of Object.entries(read(json).docs || {})) out.push({ set, json, slug, doc });
  }
  return out;
}

export function ownerCopyPending() {
  return allSourceDocs().filter(x => x.doc.pendingOwnerCopy);
}

// a document from an AI-blocking site must be either an owner copy or marked as pending one
export function ownerCopyProblems() {
  return allSourceDocs().filter(x => isAiBlocked(x.doc.url) && !x.doc.pendingOwnerCopy && x.doc.copiedBy !== 'owner')
    .map(x => 'owner copies: ' + x.set + ' ' + x.slug + ' (' + x.doc.url + ') comes from a site that blocks AI crawlers in robots.txt; mark it pendingOwnerCopy or swap in the owner copy (tools/owner-copy.mjs)');
}

export function ownerCopyReminder(today, log = console.log, maxAge = 100) {
  const list = ownerCopyPending();
  if (!list.length) return 0;
  const seen = new Map();
  for (const x of list) {
    const k = x.doc.url;
    if (!seen.has(k)) seen.set(k, { url: k, slugs: [], fetched: x.doc.fetched });
    seen.get(k).slugs.push(x.slug);
    if (x.doc.fetched < seen.get(k).fetched) seen.get(k).fetched = x.doc.fetched;
  }
  log('owner copies pending (' + seen.size + ' pages; see docs/reference/owner-saves/README.md):');
  for (const e of [...seen.values()].sort((a, b) => a.fetched.localeCompare(b.fetched) || a.url.localeCompare(b.url))) {
    const left = maxAge - daysBetween(e.fetched, today);
    log('  ' + e.url + '  [' + [...new Set(e.slugs)].join(', ') + ']  our copy ' + e.fetched + ', ' + left + ' days left');
  }
  return seen.size;
}
