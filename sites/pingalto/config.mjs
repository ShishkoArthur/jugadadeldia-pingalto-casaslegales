// pingalto.com - site settings read by the shared build tools (tools/render.mjs, tools/check-dist.mjs, tools/deploy.sh).
// Own URL scheme: "game -> tool", no trailing slash, up to three levels (/valorant/rangos -> file valorant/rangos.html; Caddy
// tries {path}.html and sends any path ending in "/" to the same path without it with a 301). Own asset folder /s/ with names
// "<base>.<10 hex of sha256>.<ext>". Not a gambling site: no help block, no 18+ mark (gate.gambling = false).
import { extname } from 'node:path';

const base = n => n.replace(/\.[0-9a-f]{10}(?=\.[a-z0-9]+$)/, '').replace(/\.[a-z0-9]+$/, '');
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
  fonts: ['rounded-800-latin.woff2', 'vietnam-400-latin.woff2', 'vietnam-600-latin.woff2'],
  preload: ['rounded-800-latin.woff2', 'vietnam-400-latin.woff2'],
  engineDirs: ['games'],
  iconBackground: '#f6f4fb',
  registries: [],
  gate: {
    gambling: false,
    samplePage: '/metodo',
    siteMenu: /<nav class="pa-nv"/,
  },
  deployCheck: ['/', '/kit/sensibilidad', '/kit/dpi', '/kit/ping', '/ff/sensibilidad', '/valorant/rangos', '/lol/rangos', '/equipo', '/metodo', '/datos', '/contacto', '/legal', '/kit/ping/', '/no-existe'],
};
