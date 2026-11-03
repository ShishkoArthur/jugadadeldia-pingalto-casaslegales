// casaslegales.com - site settings read by the shared build tools (tools/render.mjs, tools/check-dist.mjs, tools/deploy.sh).
// Own URL scheme: no trailing slash, at most two levels (/provincia/cordoba -> file provincia/cordoba.html; Caddy tries
// {path}.html; the only third level is operator x province, /operador/<brand>/<jurisdiction>). Own asset folder /_r/ with content-hash names only. Everything visible lives in this folder.
import { extname } from 'node:path';
import { SHOT_FILES } from './content/opdata.mjs';
import { opPath } from './content/operators.mjs';
import { brandNames } from '../../tools/lib/sources.mjs';

export const SITE = {
  id: 'casaslegales',
  domain: 'casaslegales.com',
  name: 'casaslegales',
  htmlLang: 'es-AR',
  ogLocale: 'es_AR',
  assetDir: '_r',
  assetName: (name, hash) => hash.slice(0, 12) + extname(name),
  pathRe: /^\/$|^\/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)?$|^\/operador\/[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/,
  fileOf: p => (p === '/' ? 'index.html' : p.slice(1) + '.html'),
  notFoundFile: '404.html',
  fonts: ['gabarito-var-latin.woff2', 'ubuntu-sans-mono-var-latin.woff2'],
  preload: ['gabarito-var-latin.woff2'],
  images: SHOT_FILES(),
  registries: ['buenos-aires', 'caba', 'cordoba', 'la-rioja', 'neuquen', 'rio-negro', 'santa-fe', 'mendoza'],
  defaultJurisdiction: 'buenos-aires',
  gate: {
    rgBlock: /<aside class="rl-ay"/,
    helpMark: /<body[^>]*\sdata-calma[\s>]/,
    age: /class="rl-18"[^>]*>18\+</,
    siteMenu: /<nav class="rl-nav"/,
    // every brand of a verified list shown in a registry table or list is a link to its operator page (owner 2026-11-03)
    brandLinks: {
      scope: /<(table|ul|div) class="(rl-tbl|rl-reg|rl-sites|rl-dom|rl-opcs|rl-law)[" ]/g,
      names: () => Object.entries(brandNames()).map(([brand, name]) => ({ name, href: opPath(brand) })),
      corrupt: [
        ['/licencias', s => s.replace(/(<th scope="row">)<a href="\/operador\/[^"]+">([^<]+)<\/a>/, '$1$2')],
        ['/provincia/cordoba', s => s.replace(/(<ul class="rl-sites"[^>]*><li><h3>)<a href="\/operador\/[^"]+">([^<]+)<\/a>/, '$1$2')],
        ['/operadores', s => s.replace(/<a class="rl-opc" href="\/operador\/[^"]+">/, '<a class="rl-opc" href="/operador/betsson">').replace(/(<a class="rl-opc" href="\/operador\/betsson">[\s\S]*?)<a class="rl-opc" href="\/operador\/betsson">/, '$1<a class="rl-opc" href="/operador/bet365">')],
      ],
    },
  },
  deployCheck: ['/', '/licencias', '/verificador', '/operadores', '/operador/betsson', '/operador/jugadon', '/verificar/zeus', '/guia/bet-ar', '/juego-responsable/autoexclusion', '/provincia/cordoba', '/provincias', '/provincia/neuquen', '/provincia/entre-rios', '/provincia/salta', '/provincia/mendoza', '/guia/como-verificar', '/guia/menores', '/calculadora/margen', '/guia/handicap', '/operador/betsson/caba', '/operador/bplay/cordoba', '/operador/casino-club', '/operador/la-neuquina-online', '/operador/betfun', '/operador/mitesoro', '/calculadora/cuotas', '/calculadora/combinada', '/guia/ley-federal', '/juego-responsable', '/casinos-online-legales', '/operador/jugadon/la-rioja', '/operador/super7/mendoza', '/verificar/mystake', '/verificar/jugabet', '/aviso-legal', '/privacidad', '/contacto', '/no-existe'],
};
