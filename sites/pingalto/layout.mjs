// pingalto.com page frame: head, sticky header with the logo (home link), the whole menu (content/menu.mjs; burger on phones), search
// and theme switch; footer
// "sin apuestas, sin skins, sin cajas" with the trademark note. Pages give { path, title, description, h1, ld, scripts, riot }
// and a body string; the shared build (tools/render.mjs) passes the helper h.
import { mainNav, crumbsLd } from './content/menu.mjs';
import { LOGO as MARKS } from './logo.mjs';
import { logoSvg, iconLinks } from '../../tools/lib/icons.mjs';
import { DATA as DATA_EN } from './i18n/en.mjs';

const MARK = logoSvg(MARKS, MARKS.pick, { mode: 'page', attrs: ' class="pa-lgm" aria-hidden="true"' });

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

function links(h, list, current) {
  return list.filter(([u]) => h.built(u)).map(([u, label]) => '<a href="' + h.href(u) + '"' + (u === current ? ' aria-current="page"' : '') + '>' + h.esc(label) + '</a>').join('');
}
const FIND = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>';
// Language switcher (docs/I18N.md): a pill with the other language between the menu and the search button; hreflang + translate="no"
const langSlot = (h, p) => {
  const o = (h.langs ? h.langs() : []).find(x => !x.current);
  if (!o || p.is404) return '';
  const label = o.lang === 'en' ? 'English version' : 'Versión en español';
  return '<a class="pa-ib pa-lang" href="' + o.href + '" hreflang="' + o.code + '" lang="' + o.code + '" translate="no" aria-label="' + label + '" title="' + label + '">' + o.lang.toUpperCase() + '</a>';
};
// page data for the browser in the language of the pass: on /en/ the strings listed in i18n/en.mjs DATA go through h.tr
function dataOf(h, p) {
  const d = p.data(h), spec = h.lang === 'en' && DATA_EN[p.path];
  if (!spec) return d;
  const o = JSON.parse(JSON.stringify(d));
  const at = (x, keys, f) => {
    if (x == null || !keys.length) return;
    const [k, ...rest] = keys;
    const ks = k === '*' ? (Array.isArray(x) ? x.keys() : []) : [k];
    for (const i of ks) { if (!rest.length) { if (typeof x[i] === 'string') x[i] = f(x[i]); } else at(x[i], rest, f); }
  };
  for (const path of spec.tr || []) at(o, path.split('.'), s => h.tr(s));
  for (const [k, v] of Object.entries(spec.set || {})) at(o, k.split('.'), () => v);
  return o;
}

export function page(h, p, body) {
  const url = 'https://' + h.site.domain + p.path;
  const crumb = p.is404 ? null : crumbsLd(h, p);
  const ld = [...(p.ld || []).filter(o => !(crumb && o && o['@type'] === 'BreadcrumbList')), crumb].filter(Boolean).map(o => '<script type="application/ld+json">' + h.jsonScript(o) + '</script>').join('');
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
    mainNav(h, p) + langSlot(h, p) +
    '<button class="pa-ib pa-fb" type="button" data-pa-find data-pa-idx="' + h.site.search.file(h.lang || 'es') + '" aria-label="Buscar en pingalto" aria-keyshortcuts="/">' + FIND + '</button>' +
    '<button class="pa-ib" type="button" data-pa-theme aria-label="Cambiar entre tema claro y oscuro">' + MOON + SUN + '</button>' +
    '<button class="pa-ib pa-bu" type="button" data-pa-menu aria-controls="pa-nv" aria-expanded="false" aria-label="Menú">' + BURGER + '</button></header>';
  const footer = '<footer class="pa-ft"><p>Sin apuestas, sin skins, sin cajas: solo herramientas y datos.</p>' +
    '<nav aria-label="Pie">' + links(h, FOOT, p.path) + '</nav>' +
    '<small>Los nombres de juegos son marcas de sus dueños; pingalto no está afiliado a ningún editor y no usa sus logos ni su arte: los fondos y Alt son ilustraciones propias hechas con IA. Cada número tiene su fuente en la página de datos.</small>' +
    (p.riot ? '<small lang="en">' + h.esc(RIOT) + '</small>' : '') + '</footer>';
  const data = p.data ? '<script type="application/json" id="pa-d">' + h.jsonScript(dataOf(h, p)) + '</script>' : '';
  const js = ['pa.js', ...(p.scripts || [])].map(s => '<script type="module" src="' + h.asset(s) + '"></script>').join('');
  return '<!doctype html><html lang="' + h.site.htmlLang + '"><head>' + head + '</head><body>' +
    '<a class="pa-skip" href="#main">Saltar al contenido</a>' + header + '<main class="pa-main" id="main">' + body + '</main>' + footer + data + js + '</body></html>';
}
