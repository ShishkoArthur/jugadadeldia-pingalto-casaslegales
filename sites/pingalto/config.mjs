// pingalto.com - site settings read by the shared build tools (tools/render.mjs, tools/check-dist.mjs, tools/deploy.sh).
// Own URL scheme: "game -> tool", no trailing slash, up to three levels (/valorant/rangos -> file valorant/rangos.html; Caddy
// tries {path}.html and sends any path ending in "/" to the same path without it with a 301). Own asset folder /s/ with names
// "<base>.<10 hex of sha256>.<ext>". Not a gambling site: no help block, no 18+ mark (gate.gambling = false).
import { extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { bgFiles } from './content/visual.mjs';

const SCENES = new URL('./content/scenes.json', import.meta.url);
const sceneFiles = () => existsSync(SCENES) ? Object.values(JSON.parse(readFileSync(SCENES, 'utf8')).pages).flatMap(p => p.files.map(f => f.name)) : [];
const base = n => n.split('/').pop().replace(/\.[0-9a-f]{10}(?=\.[a-z0-9]+$)/, '').replace(/\.[a-z0-9]+$/, '');
const SEG = '[a-z0-9]+(-[a-z0-9]+)*';

export const SITE = {
  id: 'pingalto',
  domain: 'pingalto.com',
  name: 'pingalto',
  htmlLang: 'es-AR',
  ogLocale: 'es_AR',
  assetDir: 's',
  assetName: (name, hash) => base(name) + '.' + hash.slice(0, 10) + extname(name),
  pathRe: new RegExp('^/$|^/' + SEG + '(/' + SEG + '){0,2}$'),
  fileOf: p => (p === '/' ? 'index.html' : p.slice(1) + '.html'),
  notFoundFile: '404.html',
  images: [...sceneFiles(), ...bgFiles()],
  fonts: ['rounded-800-latin.woff2', 'vietnam-400-latin.woff2', 'vietnam-600-latin.woff2'],
  preload: ['rounded-800-latin.woff2', 'vietnam-400-latin.woff2'],
  engineDirs: ['games'],
  registries: [],
  // site search (tools/lib/search.mjs, engine/search.mjs, client/pa.js): one index per language, loaded on the first search
  search: { file: lang => (lang === 'es' ? '' : '/' + lang) + '/indice.json' },
  gate: {
    menuAll: 'data-pa-all',
    gambling: false,
    samplePage: '/metodo',
    siteMenu: /<nav class="pa-nv"/,
    decimalComma: true,
    decimalOk: /Counter-Strike 1\.6|CC BY(-SA)? \d\.\d/g,
  },
  deployCheck: ['/', '/esports/agenda', '/clash/cartas', '/brawl/brawlers', '/brawl/eventos', '/data/feeds/agenda.json', '/kit/sensibilidad', '/kit/dpi', '/kit/ping', '/ff/sensibilidad', '/valorant/rangos', '/lol/rangos', '/tier-list', '/valorant/agentes', '/cs2/mira', '/ff/nombres', '/ff/espacio-invisible', '/fortnite/nube', '/fortnite', '/ff/max', '/ff', '/ff/codigos', '/valorant', '/lol', '/cs2', '/cs2/major', '/esports', '/esports/series', '/equipo', '/metodo', '/datos', '/contacto', '/legal', '/dota2', '/dota2/ti', '/clash', '/clash/mazos', '/clash/meta', '/brawl', '/brawl/meta', '/rl', '/eafc', '/lol/worlds', '/lol/msi', '/valorant/champions', '/esports/argentinos', '/esports/latam', '/esports/sistema-suizo', '/valorant/mapas/ascent', '/valorant/mapas/split', '/data/feeds/torneos.json', '/kit/ping/', '/no-existe'],
};
