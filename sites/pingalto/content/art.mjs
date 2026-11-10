// Official game art of pingalto (owner 2026-11-10), from the one list data/sources/pingalto/assets.json: a publisher switched off
// there disappears from every page with the next build (its files are no longer emitted, the pages fall back to text tiles).
import { readFileSync, existsSync } from 'node:fs';

const LIST = new URL('../../../data/sources/pingalto/assets.json', import.meta.url);
const ROOT = new URL('../../../', import.meta.url);
export const ASSETS = JSON.parse(readFileSync(LIST, 'utf8'));

export const artOn = pub => !!(ASSETS.publishers[pub] && ASSETS.publishers[pub].enabled === true);
export const artNotice = pub => ASSETS.publishers[pub].notice;
const setOf = id => ASSETS.sets.find(s => s.id === id);
const prefix = set => set.dir.replace(/^sites\/pingalto\/static\//, '') + '/';

export function artFiles(A = ASSETS) {
  const out = [];
  for (const s of A.sets) {
    if (!s.dir || !(A.publishers[s.publisher] && A.publishers[s.publisher].enabled === true)) continue;
    for (const f of s.files || []) if (existsSync(new URL(s.dir + '/' + f.file, ROOT))) out.push(prefix(s) + f.file);
  }
  return out;
}

export function lolArt(champId) {
  const s = setOf('riot-lol');
  if (!s || !artOn(s.publisher)) return null;
  const f = (s.files || []).find(x => x.of === champId);
  return f ? prefix(s) + f.file : null;
}

export const artSets = () => ASSETS.sets.filter(s => artOn(s.publisher));
export const PUBLISHER = { riot: 'Riot Games', supercell: 'Supercell' };
export const anyArt = () => artSets().length > 0;
