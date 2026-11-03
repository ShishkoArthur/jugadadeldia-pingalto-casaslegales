// jugadadeldia.com page frame (design r3 "06 Menu principal"): sticky header with the ball logo, top menu, full menu panel,
// theme switch; footer with the help block on quiniela and lottery pages. Pages give { path, title, description, h1, kind,
// section, help, jurisdiction, css, js, data, ld } and a body string; the shared build (tools/render.mjs) passes the helper h.
import { MENU, TOP, HELP_NAV, FOOT } from './content/menu.mjs';
import { LOGO } from './logo.mjs';
import { logoSvg, iconLinks } from '../../tools/lib/icons.mjs';

const MARK = logoSvg(LOGO, LOGO.pick, { mode: 'page', attrs: ' class="jg-lgm" aria-hidden="true"' });

const ICON = {
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  burger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
};
const THEME_JS = "try{var t=localStorage.getItem('jg-tema');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')";

const linkList = (h, list, current) => list.filter(([u]) => h.built(u)).map(([u, label]) => '<a href="' + h.href(u) + '"' + (u === current ? ' aria-current="page"' : '') + '>' + h.esc(label) + '</a>').join('');

function menuPanel(h, p) {
  const groups = MENU.map(g => {
    const items = g.items.filter(([u]) => h.built(u));
    if (!items.length) return '';
    return '<div class="jg-mg"><b>' + h.esc(g.name) + '</b>' + linkList(h, items, p.path) + '</div>';
  }).join('');
  return '<div class="jg-panel" id="jg-panel" hidden><div class="jg-pin">' + groups + '</div></div>';
}

export function helpBlock(h, p) {
  const j = h.rg.prov(p.jurisdiction || h.site.defaultJurisdiction);
  const c = h.rg.crisis;
  const fixed = p.jurisdiction ? ' data-fijo="1"' : '';
  const line = j.line
    ? '<p data-jg-line' + fixed + '>¿El juego dejó de ser un juego? Línea ' + (j.line.free ? 'gratuita ' : '') + 'de <span data-jg-name>' + h.esc(j.name) + '</span>: <a href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a></p>'
    : '<p>¿El juego dejó de ser un juego? En ' + h.esc(j.name) + ' no encontramos una línea propia verificada: usá la línea nacional.</p>';
  const crisis = '<p class="jg-cr">Urgencia de salud mental, en todo el país: <a href="tel:' + h.esc(c.phoneTel) + '">' + h.esc(c.phone) + '</a>, ' + h.esc(c.hours) + '.</p>';
  const more = h.built('/juego-responsable/') ? '<p><a href="' + h.href('/juego-responsable/') + '">Ayuda y autoexclusión en cada provincia</a></p>' : '';
  return '<aside class="jg-rg" aria-label="Ayuda con el juego"><b class="jg-18">18+</b><div>' + line + crisis + more + '</div></aside>';
}

function footer(h, p) {
  const rgPage = p.kind !== 'game';
  const bottom = p.help
    ? '<p class="jg-rs"><b class="jg-18">18+</b><span>Los juegos de azar son solo para mayores de 18 años. Esta página no lleva a ningún juego.</span></p>'
    : rgPage ? helpBlock(h, p)
      : '<p class="jg-rs jg-rs-j"><span>Juegos de mesa para pasar el rato: sin plata, sin apuestas y sin registro.</span></p>';
  return '<footer class="jg-ft"><div class="jg-ftt"><b>Sin apuestas online ni operadores: datos oficiales y la cuenta hecha por código.</b>' +
    '<nav class="jg-sg" aria-label="Institucional">' + linkList(h, FOOT, p.path) + '</nav></div>' + bottom +
    '<p class="jg-fine">jugadadeldia.com · Argentina · textos de Denis Krazok con ayuda de IA · fuentes revisadas el ' + h.fmtDate(h.checked) + '</p></footer>';
}

export function page(h, p, body) {
  const url = 'https://' + h.site.domain + p.path;
  const ld = (p.ld || []).map(o => '<script type="application/ld+json">' + h.jsonScript(o) + '</script>').join('');
  const css = ['jg.css', ...(p.css || [])];
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<title>' + h.esc(p.title) + '</title>',
    p.description ? '<meta name="description" content="' + h.esc(p.description) + '">' : '',
    p.is404 ? '<meta name="robots" content="noindex,follow">' : '<link rel="canonical" href="' + url + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Jugada del Día">',
    '<meta property="og:locale" content="' + h.site.ogLocale + '">',
    '<meta property="og:title" content="' + h.esc(p.h1) + '">',
    p.description ? '<meta property="og:description" content="' + h.esc(p.description) + '">' : '',
    '<meta property="og:url" content="' + url + '">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="theme-color" content="#edf1f6" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#0a111c" media="(prefers-color-scheme: dark)">',
    iconLinks(),
    h.site.preload.map(f => '<link rel="preload" href="' + h.asset(f) + '" as="font" type="font/woff2" crossorigin>').join(''),
    css.map(f => '<link rel="stylesheet" href="' + h.asset(f) + '">').join(''),
    '<script>' + THEME_JS + '</script>',
    ld,
  ].join('');
  const nav = p.help
    ? '<nav class="jg-sg jg-hnav" aria-label="Ayuda">' + linkList(h, HELP_NAV, p.path) + '</nav>'
    : '<nav class="jg-menu jg-sg" aria-label="Principal">' + TOP.filter(([u]) => h.built(u)).map(([u, label, sec]) => '<a href="' + h.href(u) + '"' + (u === p.path || sec === p.section ? ' aria-current="' + (u === p.path ? 'page' : 'true') + '"' : '') + '>' + h.esc(label) + '</a>').join('') + '</nav>';
  const header = '<header class="jg-h"><a class="jg-lg" href="/">' + MARK + '<span>jugada<b>del</b>día</span></a>' + nav +
    '<button class="jg-ib" type="button" data-jg-tema aria-label="Cambiar entre tema claro y oscuro">' + ICON.moon + ICON.sun + '</button>' +
    (p.help ? '' : '<button class="jg-ib jg-bu" type="button" data-jg-menu aria-controls="jg-panel" aria-expanded="false" aria-label="Menú">' + ICON.burger + '</button>') + '</header>' +
    (p.help ? '' : menuPanel(h, p));
  const data = '<script type="application/json" id="jg-data">' + h.jsonScript(h.clientData()) + '</script>' +
    (p.data ? '<script type="application/json" id="jg-page">' + h.jsonScript(p.data(h)) + '</script>' : '');
  const js = ['jg.js', ...(p.js || [])].map(f => '<script type="module" src="' + h.asset(f) + '"></script>').join('');
  return '<!doctype html><html lang="' + h.site.htmlLang + '"><head>' + head + '</head><body' + (p.help ? ' data-jg-ayuda' : '') + ' data-k="' + h.esc(p.kind || 'x') + '">' +
    '<a class="jg-skip" href="#main">Saltar al contenido</a>' + header + '<main class="jg-main" id="main">' + body + '</main>' + footer(h, p) + data + js + '</body></html>';
}

// Data for the browser (client/jg.js): help line of every jurisdiction that has one, to follow the visitor's province.
export function clientData(h) {
  const lines = {};
  for (const pr of h.rg.pack.provinces) {
    const j = h.rg.prov(pr.id);
    if (j.line) lines[pr.id] = { n: j.name, p: j.line.phone, t: j.line.phoneTel, f: !!j.line.free };
  }
  return { lines, w: { free: 'gratuita ' } };
}
