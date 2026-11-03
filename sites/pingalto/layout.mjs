// pingalto.com page frame: head, sticky header with the logo (home link), menu (burger on phones) and theme switch; footer
// "sin apuestas, sin skins, sin cajas" with the trademark note. Pages give { path, title, description, h1, ld, scripts, riot }
// and a body string; the shared build (tools/render.mjs) passes the helper h.
import { GAMES, sectionOf } from './content/visual.mjs';
import { LOGO as MARKS } from './logo.mjs';
import { logoSvg, iconLinks } from '../../tools/lib/icons.mjs';

const MARK = logoSvg(MARKS, MARKS.pick, { mode: 'page', attrs: ' class="pa-lgm" aria-hidden="true"' });

const NAV = [
  ['/kit/ping', 'Ping'],
  ['/tier-list', 'Tier list'],
  ['games', 'Juegos'],
  ['/esports', 'Esports'],
];
const FOOT = [
  ['/equipo', 'Equipo'],
  ['/metodo', 'Método'],
  ['/datos', 'Datos'],
  ['/contacto', 'Contacto'],
  ['/legal', 'Legal'],
];
const MOON = '<svg class="pa-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const SUN = '<svg class="pa-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>';
const BURGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const THEME_JS = "try{var t=localStorage.getItem('pa-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}";
// Riot Games legal notice (Riot "Legal Jibber Jabber", docs/research/APIS-2026-11-02.md B.2) on pages about Valorant and LoL.
const RIOT = 'pingalto isn\'t endorsed by Riot Games and doesn\'t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.';

// "Juegos": a menu button with the game list (hover with a close delay or click on wide screens, an open list in the phone menu);
// each game is its monogram and name in our own type, no publisher logo (data/sources/pingalto/brand-policies.json).
function games(h, current) {
  const list = GAMES.filter(g => h.built(g.path));
  if (!list.length) return '';
  const sec = sectionOf(current), on = !!(sec && list.some(g => g.id === sec.id));
  const items = list.map(g => '<a class="pa-gmi pa-g-' + g.id + '" href="' + h.href(g.path) + '"' + (sec && sec.id === g.id ? (current === g.path ? ' aria-current="page"' : ' aria-current="true"') : '') + '><i aria-hidden="true">' + h.esc(g.mono) + '</i><span>' + h.esc(g.name) + '</span></a>').join('');
  return '<div class="pa-dd" data-pa-dd><button type="button" aria-expanded="false" aria-controls="pa-ddp"' + (on ? ' data-on' : '') + '>Juegos<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><div class="pa-ddp" id="pa-ddp">' + items + '</div></div>';
}
function links(h, list, current) {
  return list.filter(([u]) => u === 'games' || h.built(u)).map(([u, label]) => u === 'games' ? games(h, current) : '<a href="' + h.href(u) + '"' + (u === current ? ' aria-current="page"' : current.startsWith(u + '/') ? ' aria-current="true"' : '') + '>' + h.esc(label) + '</a>').join('');
}

export function page(h, p, body) {
  const url = 'https://' + h.site.domain + p.path;
  const ld = (p.ld || []).map(o => '<script type="application/ld+json">' + h.jsonScript(o) + '</script>').join('');
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>' + h.esc(p.title) + '</title>',
    p.description ? '<meta name="description" content="' + h.esc(p.description) + '">' : '',
    p.is404 ? '<meta name="robots" content="noindex,follow">' : '<link rel="canonical" href="' + url + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="pingalto">',
    '<meta property="og:locale" content="' + h.site.ogLocale + '">',
    '<meta property="og:title" content="' + h.esc(p.ogTitle || p.h1) + '">',
    p.description ? '<meta property="og:description" content="' + h.esc(p.description) + '">' : '',
    '<meta property="og:url" content="' + url + '">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="theme-color" content="#f6f4fb" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#110e1d" media="(prefers-color-scheme: dark)">',
    iconLinks(),
    h.site.preload.map(f => '<link rel="preload" href="' + h.asset(f) + '" as="font" type="font/woff2" crossorigin>').join(''),
    '<link rel="stylesheet" href="' + h.asset('pa.css') + '">',
    '<script>' + THEME_JS + '</script>',
    ld,
  ].join('');
  const header = '<header class="pa-hd"><a class="pa-lg" href="/" aria-label="pingalto, inicio">' + MARK + '<span>ping<b>alto</b></span></a>' +
    '<nav class="pa-nv" id="pa-nv" aria-label="Principal">' + links(h, NAV, p.path) + '</nav>' +
    '<button class="pa-ib" type="button" data-pa-theme aria-label="Cambiar entre tema claro y oscuro">' + MOON + SUN + '</button>' +
    '<button class="pa-ib pa-bu" type="button" data-pa-menu aria-controls="pa-nv" aria-expanded="false" aria-label="Menú">' + BURGER + '</button></header>';
  const footer = '<footer class="pa-ft"><p>Sin apuestas, sin skins, sin cajas: solo herramientas y datos.</p>' +
    '<nav aria-label="Pie">' + links(h, FOOT, p.path) + '</nav>' +
    '<small>Los nombres de juegos son marcas de sus dueños; pingalto no está afiliado a ningún editor y no usa sus logos ni su arte: los fondos y Alt son ilustraciones propias hechas con IA. Cada número tiene su fuente en la página de datos.</small>' +
    (p.riot ? '<small lang="en">' + h.esc(RIOT) + '</small>' : '') + '</footer>';
  const data = p.data ? '<script type="application/json" id="pa-d">' + h.jsonScript(p.data(h)) + '</script>' : '';
  const js = ['pa.js', ...(p.scripts || [])].map(s => '<script type="module" src="' + h.asset(s) + '"></script>').join('');
  return '<!doctype html><html lang="' + h.site.htmlLang + '"><head>' + head + '</head><body>' +
    '<a class="pa-skip" href="#main">Saltar al contenido</a>' + header + '<main class="pa-main" id="main">' + body + '</main>' + footer + data + js + '</body></html>';
}
