// casaslegales.com - site settings read by the shared build tools (tools/render.mjs, tools/check-dist.mjs, tools/deploy.sh).
// Own URL scheme: no trailing slash, at most two levels (/provincia/cordoba -> file provincia/cordoba.html; Caddy tries
// {path}.html). Own asset folder /_r/ with content-hash names only. Everything visible lives in this folder.
import { extname } from 'node:path';
import { SHOT_FILES } from './content/opdata.mjs';

export const SITE = {
  id: 'casaslegales',
  domain: 'casaslegales.com',
  name: 'casaslegales',
  htmlLang: 'es-AR',
  ogLocale: 'es_AR',
  assetDir: '_r',
  assetName: (name, hash) => hash.slice(0, 12) + extname(name),
  pathRe: /^\/$|^\/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)?$/,
  fileOf: p => (p === '/' ? 'index.html' : p.slice(1) + '.html'),
  notFoundFile: '404.html',
  fonts: ['gabarito-var-latin.woff2', 'ubuntu-sans-mono-var-latin.woff2'],
  preload: ['gabarito-var-latin.woff2'],
  images: SHOT_FILES(),
  registries: ['buenos-aires', 'caba', 'cordoba'],
  defaultJurisdiction: 'buenos-aires',
  gate: {
    rgBlock: /<aside class="rl-ay"/,
    helpMark: /<body[^>]*\sdata-calma[\s>]/,
    age: /class="rl-18"[^>]*>18\+</,
    siteMenu: /<nav class="rl-nav"/,
  },
  deployCheck: ['/', '/licencias', '/verificador', '/operadores', '/operador/betsson', '/operador/jugadon', '/verificar/zeus', '/guia/bet-ar', '/juego-responsable/autoexclusion', '/provincia/cordoba', '/juego-responsable', '/no-existe'],
};
