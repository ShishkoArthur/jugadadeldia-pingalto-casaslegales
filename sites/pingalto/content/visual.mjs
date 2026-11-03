// Games of pingalto as the site shows them: the "Juegos" menu, the game row on the home page and the hero background of each game
// section. No publisher logo is used (data/sources/pingalto/brand-policies.json): a game is its name in our own type plus a short
// monogram, and its background is our own generated scene (data/art/backgrounds.mjs -> static/bg/bg-<id>-<w>.webp).
import { existsSync, readdirSync } from 'node:fs';

const BG_DIR = new URL('../static/bg/', import.meta.url);
export const BG_W = [480, 960, 1600];

export const GAMES = [
  { id: 'ff', name: 'Free Fire', mono: 'FF', tag: 'Battle royale en el celu', path: '/ff', match: ['/ff'], alt: 'Ilustración propia: isla tropical con un pueblo y paracaídas a lo lejos' },
  { id: 'valorant', name: 'Valorant', mono: 'VAL', tag: 'Shooter táctico 5 contra 5', path: '/valorant', match: ['/valorant'], alt: 'Ilustración propia: plaza futurista con luces de neón' },
  { id: 'lol', name: 'League of Legends', short: 'LoL', mono: 'LoL', tag: 'MOBA de Riot', path: '/lol', match: ['/lol'], alt: 'Ilustración propia: valle de fantasía con un río y dos torres de piedra' },
  { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', mono: 'CS2', tag: 'Shooter táctico de Valve', path: '/cs2', match: ['/cs2'], alt: 'Ilustración propia: pueblo del desierto visto desde arriba' },
  { id: 'fortnite', name: 'Fortnite', mono: 'FN', tag: 'Battle royale, también en la nube', path: '/fortnite/nube', match: ['/fortnite'], alt: 'Ilustración propia: isla de dibujo animado con una tormenta violeta' },
];
const SECTIONS = [...GAMES, { id: 'esports', match: ['/esports'] }];

export const bgFiles = () => existsSync(BG_DIR) ? readdirSync(BG_DIR).filter(f => f.endsWith('.webp')).map(f => 'bg/' + f) : [];
const has = id => BG_W.every(w => existsSync(new URL('bg-' + id + '-' + w + '.webp', BG_DIR)));
export const bgName = (id, w) => 'bg/bg-' + id + '-' + w + '.webp';

export function sectionOf(path) {
  return SECTIONS.find(s => s.match.some(m => path === m || path.startsWith(m + '/')));
}
export function bgOf(path) {
  const s = sectionOf(path);
  return s && has(s.id) ? s.id : null;
}
export const hasBg = has;
