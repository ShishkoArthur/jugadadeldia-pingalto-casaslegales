// Official game art of pingalto (owner 2026-11-10), from the one list data/sources/pingalto/assets.json: a publisher switched off
// there disappears from every page with the next build (its files are no longer emitted, the pages fall back to text tiles).
import { readFileSync, existsSync } from 'node:fs';

const LIST = new URL('../../../data/sources/pingalto/assets.json', import.meta.url);
const ROOT = new URL('../../../', import.meta.url);
export const ASSETS = JSON.parse(readFileSync(LIST, 'utf8'));

const on = (P, pub) => !!(P[pub] && P[pub].enabled === true && (!P[pub].requires || on(P, P[pub].requires)));
export const artOn = pub => on(ASSETS.publishers, pub);
export const artNotice = pub => ASSETS.publishers[pub].notice;
const setOf = id => ASSETS.sets.find(s => s.id === id);
const prefix = set => set.dir.replace(/^sites\/pingalto\/static\//, '') + '/';

export function artFiles(A = ASSETS) {
  const out = [];
  for (const s of A.sets) {
    if (!s.dir || !on(A.publishers, s.publisher)) continue;
    for (const f of s.files || []) if (existsSync(new URL(s.dir + '/' + f.file, ROOT))) out.push(prefix(s) + f.file);
  }
  return out;
}

export function artFor(setId, of) {
  const s = setOf(setId);
  if (!s || !artOn(s.publisher)) return null;
  const f = (s.files || []).find(x => x.of === of);
  return f ? prefix(s) + f.file : null;
}
export const lolArt = champId => artFor('riot-lol', champId);

export const artSets = () => ASSETS.sets.filter(s => artOn(s.publisher));
export const PUBLISHER = { riot: 'Riot Games', supercell: 'Supercell', brawlify: 'Supercell (copia de Brawlify)', valorantapi: 'Riot Games (copia de valorant-api.com)' };
export const anyArt = () => artSets().length > 0;
