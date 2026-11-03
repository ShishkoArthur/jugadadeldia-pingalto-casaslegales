// jugadadeldia.com - site settings read by the shared build tools (tools/render.mjs, tools/check-dist.mjs, tools/deploy.sh).
// Own URL scheme: folders with a trailing slash, up to three levels (/quiniela/cuanto-paga/ -> file quiniela/cuanto-paga/index.html;
// Caddy sends a path without the slash to the folder with a 301). Own asset folder /v/ with names "<8 hex of sha256>-<name>".
// Quiniela and lottery pages carry the help block and 18+; card and dice game pages (kind "game") do not - they are not
// gambling (PLAYBOOK 1.1, 7). Help pages hide the game menu (gate helpnav) and never link to lottery or game pages.

import { readFileSync, existsSync } from 'node:fs';

const SEG = '[a-z0-9]+(-[a-z0-9]+)*';
const SCENES = new URL('./content/scenes.json', import.meta.url);
const sceneFiles = () => existsSync(SCENES) ? Object.values(JSON.parse(readFileSync(SCENES, 'utf8')).pages).flatMap(p => p.files.map(f => f.name)) : [];
const bare = n => n.split('/').pop().replace(/^[0-9a-f]{8}-/, '');

export const SITE = {
  id: 'jugadadeldia',
  domain: 'jugadadeldia.com',
  name: 'Jugada del Día',
  htmlLang: 'es-AR',
  ogLocale: 'es_AR',
  assetDir: 'v',
  assetName: (name, hash) => hash.slice(0, 8) + '-' + bare(name),
  pathRe: new RegExp('^/$|^/' + SEG + '/(' + SEG + '/){0,2}$'),
  fileOf: p => (p === '/' ? 'index.html' : p.slice(1) + 'index.html'),
  notFoundFile: '404.html',
  images: sceneFiles(),
  fonts: ['kanit-400.woff2', 'kanit-700.woff2'],
  preload: ['kanit-700.woff2'],
  engineDirs: ['games', 'lottery', 'cards', 'truco', 'generala', 'chinchon', 'escoba'],
  iconBackground: '#edf1f6',
  registries: [],
  defaultJurisdiction: 'buenos-aires',
  noPerson: false,
  gate: {
    rgBlock: /<aside class="jg-rg"/,
    rgSample: '<aside class="jg-rg">x</aside>',
    helpMark: /<body[^>]*\sdata-jg-ayuda[\s>]/,
    helpAttr: 'data-jg-ayuda',
    age: /class="jg-18"[^>]*>18\+</,
    siteMenu: /<nav class="jg-menu"/,
    navSample: '<nav class="jg-menu" id="x"></nav>',
    noRgKinds: ['game'],
    samplePage: '/quienes-somos/',
    deadLink: '/no-existe/',
    offScheme: '/quienes-somos',
    decimalComma: true,
  },
  deployCheck: ['/', '/quiniela/cuanto-paga/', '/quiniela/redoblona/', '/quini-6/', '/truco/', '/truco/jugar/', '/truco/anotador/', '/generala/jugar/', '/chinchon/jugar/', '/escoba-de-15/jugar/', '/dados/', '/juego-responsable/', '/juego-responsable/caba/', '/quien-escribe/', '/de-donde-salen-los-datos/', '/truco', '/no-existe/'],
};
