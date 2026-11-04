// casaslegales.com page frame: head, sticky header, footer with the help block. Pages give { path, title, description, h1,
// help, nav, ld } and a body string; the shared build (tools/render.mjs) passes the helper h.
import { TILES } from './content/map.mjs';
import { provData } from './content/provdata.mjs';
import { LOGO as MARKS } from './logo.mjs';
import { logoSvg, iconLinks } from '../../tools/lib/icons.mjs';
const NAV = [
  ['/verificador', 'Verificador'],
  ['/licencias', 'Licencias'],
  ['/operadores', 'Operadores'],
  ['/provincias', 'Provincias'],
  ['/guia/como-verificar', 'Cómo verificar'],
  ['/juego-responsable', 'Ayuda'],
];
const FOOT = [
  ['/casinos-online-legales', 'Casinos online legales', 'bet'],
  ['/guia/apuestas-deportivas', 'Cómo funcionan las apuestas', 'bet'],
  ['/guia/glosario', 'Glosario de apuestas', 'bet'],
  ['/guia/bet-ar', 'El dominio .bet.ar'],
  ['/guia/sitios-ilegales', 'Sitios sin licencia'],
  ['/guia/menores', 'Menores y apuestas'],
  ['/calculadora/margen', 'Calculadora de margen', 'bet'],
  ['/guia/handicap', 'Hándicap asiático', 'bet'],
  ['/calculadora/cuotas', 'Calculadora de cuotas', 'bet'],
  ['/calculadora/combinada', 'Combinadas y margen', 'bet'],
  ['/guia/ley-federal', 'Ley federal: estado del proyecto'],
  ['/metodologia', 'Metodología'],
  ['/redaccion', 'Redacción'],
  ['/registro-de-fuentes', 'Registro de fuentes'],
  ['/juego-responsable', 'Juego responsable'],
  ['/aviso-legal', 'Aviso legal'],
  ['/privacidad', 'Privacidad'],
  ['/contacto', 'Contacto'],
];
const HELP_NAV = [['/juego-responsable', 'Líneas de ayuda'], ['/juego-responsable/autoexclusion', 'Autoexclusión'], ['/redaccion', 'Quiénes somos']];

const MOON = '<svg class="rl-moon" viewBox="0 0 20 20" aria-hidden="true"><path d="M15 12.5A6.5 6.5 0 0 1 7.5 5a6.5 6.5 0 1 0 7.5 7.5z" fill="currentColor"/></svg>';
const SUN = '<svg class="rl-sun" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="currentColor"/><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2 16 16M4 16l1.8-1.8M14.2 5.8 16 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const LOGO = logoSvg(MARKS, MARKS.pick, { mode: 'page', attrs: ' class="rl-lgm" aria-hidden="true"' });
const BURGER = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const THEME_JS = "try{var t=localStorage.getItem('rl-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add('js')";

function links(h, list, current) {
  return list.filter(([u]) => h.built(u)).map(([u, label]) => '<a href="' + h.href(u) + '"' + (u === current ? ' aria-current="page"' : '') + '>' + h.esc(label) + '</a>').join('');
}

export function helpBlock(h, p) {
  const jid = p.jurisdiction || h.site.defaultJurisdiction;
  const j = h.rg.prov(jid);
  const c = h.rg.crisis;
  const line = j.line
    ? '<p data-rl-line' + (p.jurisdiction ? ' data-rl-fixed="1"' : '') + '>¿El juego dejó de ser un juego? Línea ' + (j.line.free ? 'gratuita ' : '') + 'de <span data-rl-name>' + h.esc(j.name) + '</span>: <a href="tel:' + h.esc(j.line.phoneTel) + '">' + h.esc(j.line.phone) + '</a></p>'
    : '<p>¿El juego dejó de ser un juego? En ' + h.esc(j.name) + ' no verificamos una línea propia: usá la línea nacional de abajo.</p>';
  const crisis = '<p class="rl-cr">Urgencia de salud mental, en todo el país: <a href="tel:' + h.esc(c.phoneTel) + '">' + h.esc(c.phone) + '</a>, ' + h.esc(c.hours) + '.</p>';
  const more = h.built('/juego-responsable') ? '<p><a href="' + h.href('/juego-responsable') + '">Líneas y autoexclusión de cada provincia</a></p>' : '';
  return '<aside class="rl-ay" aria-label="Ayuda con el juego"><b class="rl-18">18+</b>' + line + crisis + more + '</aside>';
}

export function page(h, p, body) {
  const url = 'https://' + h.site.domain + p.path;
  const title = p.title;
  const ld = (p.ld || []).map(o => '<script type="application/ld+json">' + h.jsonScript(o) + '</script>').join('');
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>' + h.esc(title) + '</title>',
    p.description ? '<meta name="description" content="' + h.esc(p.description) + '">' : '',
    p.is404 ? '<meta name="robots" content="noindex,follow">' : '<link rel="canonical" href="' + url + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="casaslegales.com">',
    '<meta property="og:locale" content="' + h.site.ogLocale + '">',
    '<meta property="og:title" content="' + h.esc(p.ogTitle || p.h1) + '">',
    p.description ? '<meta property="og:description" content="' + h.esc(p.description) + '">' : '',
    '<meta property="og:url" content="' + url + '">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="theme-color" content="#e9efe6" media="(prefers-color-scheme: light)">',
    '<meta name="theme-color" content="#07120e" media="(prefers-color-scheme: dark)">',
    iconLinks(),
    h.site.preload.map(f => '<link rel="preload" href="' + h.asset(f) + '" as="font" type="font/woff2" crossorigin>').join(''),
    '<link rel="stylesheet" href="' + h.asset('site.css') + '">',
    '<script>' + THEME_JS + '</script>',
    ld,
  ].join('');
  const nav = p.help
    ? '<nav class="rl-hnav" aria-label="Ayuda">' + links(h, HELP_NAV, p.path) + '</nav>'
    : '<nav class="rl-nav" id="rl-nav" aria-label="Principal">' + links(h, NAV, p.path) + '</nav>';
  const header = '<header class="rl-top"><a class="rl-logo" href="/">' + LOGO + '<span>casas<b>legales</b></span></a>' + nav +
    '<button class="rl-ib" type="button" data-rl-theme aria-label="Cambiar entre tema claro y oscuro">' + MOON + SUN + '</button>' +
    (p.help ? '' : '<button class="rl-ib rl-bu" type="button" data-rl-menu aria-controls="rl-nav" aria-expanded="false" aria-label="Menú">' + BURGER + '</button>') + '</header>';
  const footer = '<footer class="rl-ft"><p>Sin bonos ni afiliados: solo enlazamos la dirección que publica cada lista oficial. No es asesoramiento legal: depende de la ley de tu provincia.</p>' +
    '<nav aria-label="Pie">' + links(h, p.help ? FOOT.filter(f => !f[2]) : FOOT, p.path) + '</nav>' +
    (p.help ? '<p><b class="rl-18">18+</b> Los juegos de apuestas son solo para mayores de 18 años.</p>' : helpBlock(h, p)) +
    '<p class="rl-fine">casaslegales.com · datos oficiales revisados el ' + h.fmtDate(h.checked) + ' · redacción independiente, sin acuerdos con operadores</p></footer>';
  const data = '<script type="application/json" id="rl-data">' + h.jsonScript(h.clientData()) + '</script>';
  const js = '<script type="module" src="' + h.asset('ui.js') + '"></script>';
  return '<!doctype html><html lang="' + h.site.htmlLang + '"><head>' + head + '</head><body' + (p.help ? ' data-calma' : '') + '>' +
    '<a class="rl-skip" href="#main">Saltar al contenido</a>' + header + '<main class="rl-main" id="main">' + body + '</main>' + footer + data + js + '</body></html>';
}

// Data for the browser (sites/casaslegales/client/ui.js): per jurisdiction name, count, regulator, date, help line, page; UI words.
export function clientData(h) {
  const j = {};
  for (const t of TILES) {
    const p = h.rg.prov(t.id), r = h.regs.find(x => x.id === t.id);
    const u = '/provincia/' + t.id;
    const x = provData(h).one(t.id);
    const k = x.st === 'list' ? (x.n === 1 ? 'sitio en la lista oficial' : 'sitios en la lista oficial') : x.st === 'platform' ? (x.n === 1 ? 'plataforma enlazada por el regulador' : 'plataformas enlazadas por el regulador') : x.label;
    const m = x.st === 'list' ? r.regulator.short + ' · revisado ' + h.fmtDate(r.checked) : x.st === 'platform' ? x.e.platforms.map(q => q.name).join(', ') + ' · copia del ' + h.fmtDate(x.date) :
      x.st === 'none' ? 'No hay una lista oficial que podamos citar.' : x.e.reason === 'geo' ? 'La fuente oficial no abre desde fuera de Argentina: copia pendiente.' : 'La fuente oficial no está en condiciones de citarse.';
    j[t.id] = { n: p.name, co: t.code, s: x.st, c: x.n, k, m, l: p.line ? { p: p.line.phone, t: p.line.phoneTel } : null, u: h.built(u) ? u : null };
  }
  return {
    j,
    crisis: { p: h.rg.crisis.phone, t: h.rg.crisis.phoneTel },
    s: { dash: '-', help: 'Ayuda:', helpNone: 'Sin línea provincial verificada. Línea nacional:', go: 'Ver {n}' },
  };
}
