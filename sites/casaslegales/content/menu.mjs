// Main menu of casaslegales.com: every page of the build (owner 2026-11-04 "the whole list of pages in a convenient form"), grouped
// by tools/lib/navtree.mjs with the rules below; a new page lands in its section by its path, ordered by the plan (hub first, then
// wave and demand; provinces and brand checks alphabetically). Operators: each brand with its own pages (casino, cómo ingresar,
// each province) next to it. Desktop: a panel per section (hover with a close delay or click); phone: the burger opens a
// full-height panel with the sections as an accordion and the search on top. Help pages keep only HELP_NAV in the layout.
import { navTree, holds, crumbs as crumbTrail } from '../../../tools/lib/navtree.mjs';

const seg = p => p.path.split('/').filter(Boolean);
const under = base => p => p.path === base || p.path.startsWith(base + '/');
const REG = ['/licencias', '/verificador', '/casinos-online-legales', '/cambios', '/margen-medido', '/comparar'];
const LABEL = {
  '/': 'Inicio',
  '/operadores': 'Todos los operadores',
  '/provincias': 'Todas las jurisdicciones',
  '/licencias': 'Registro de licencias',
  '/verificador': 'Verificador de direcciones',
  '/casinos-online-legales': 'Casinos online legales',
  '/guia/bet-ar': 'El dominio .bet.ar',
  '/guia/sitios-ilegales': 'Sitios sin licencia',
  '/guia/como-verificar': 'Cómo verificar una licencia',
  '/guia/menores': 'Menores y apuestas',
  '/guia/handicap': 'Hándicap asiático',
  '/guia/apuestas-deportivas': 'Cómo funcionan las apuestas',
  '/guia/glosario': 'Glosario de apuestas',
  '/guia/ley-federal': 'Ley federal: estado del proyecto',
  '/calculadora/margen': 'Calculadora de margen',
  '/calculadora/cuotas': 'Calculadora de cuotas',
  '/calculadora/combinada': 'Combinadas y margen',
  '/juego-responsable': 'Líneas de ayuda',
  '/juego-responsable/autoexclusion': 'Autoexclusión',
  '/redaccion': 'La redacción',
  '/metodologia': 'Metodología',
  '/registro-de-fuentes': 'Registro de fuentes',
  '/aviso-legal': 'Aviso legal',
  '/privacidad': 'Privacidad',
  '/contacto': 'Contacto y correcciones',
};
const SHORT = { 'buenos-aires': 'PBA', caba: 'CABA', casino: 'Casino', ingresar: 'Cómo ingresar' };

export const SPEC = {
  sections: [
    { id: 'operadores', name: 'Operadores', hub: '/operadores', groups: [{ id: 'marcas', name: 'Con licencia provincial', order: ['/operadores'], nest: p => seg(p).length === 3 ? '/operador/' + seg(p)[1] : null, test: p => p.path === '/operadores' || under('/operador')(p) }] },
    { id: 'provincias', name: 'Provincias', hub: '/provincias', groups: [{ id: 'prov', name: 'Quién regula en cada una', sort: 'label', test: p => p.path === '/provincias' || under('/provincia')(p) }] },
    {
      id: 'licencias', name: 'Licencias', hub: '/licencias', groups: [
        { id: 'reg', name: 'Registros oficiales', order: REG, test: p => REG.includes(p.path) || p.kind === 'registry' },
        { id: 'check', name: '¿Figura en un registro?', sort: 'label', test: under('/verificar') },
      ],
    },
    {
      id: 'guias', name: 'Guías', groups: [
        { id: 'guias', name: 'Cómo funciona', test: under('/guia') },
        { id: 'calc', name: 'Calculadoras', test: p => under('/calculadora')(p) || p.kind === 'tool' },
      ],
    },
    { id: 'ayuda', name: 'Ayuda', hub: '/juego-responsable', groups: [{ id: 'ayuda', name: 'Juego responsable', order: ['/juego-responsable'], test: under('/juego-responsable') }] },
    {
      id: 'sitio', name: 'Redacción', groups: [
        { id: 'sitio', name: 'casaslegales.com', order: ['/', '/redaccion', '/metodologia', '/registro-de-fuentes'], test: p => p.path === '/' || p.kind === 'service' },
        { id: 'mas', name: 'Más páginas', test: () => false },
      ],
    },
  ],
  rest: { section: 'sitio', group: 'mas' },
  label(p, h) {
    if (LABEL[p.path]) return LABEL[p.path];
    const s = seg(p);
    const prov = id => (h.rg.pack.provinces.find(x => x.id === id) || {}).name;
    if (s[0] === 'operador' && s.length === 2 && p.brand && h.names[p.brand]) return h.names[p.brand];
    if (s[0] === 'operador' && s.length === 3) return SHORT[s[2]] || prov(s[2]) || null;
    if (s[0] === 'provincia' && prov(s[1])) return prov(s[1]);
    if (s[0] === 'verificar') { const m = h.t(p.h1).match(/^¿(.+?) figura/); if (m) return m[1]; }
    return null;
  },
};

const a = (h, it, cur, cls) => '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + h.href(it.path) + '"' + (it.path === cur ? ' aria-current="page"' : '') + '>' + h.esc(it.label) + '</a>';
const li = (h, it, cur) => '<li>' + a(h, it, cur) + (it.kids.length ? '<span>' + it.kids.map(k => a(h, k, cur)).join('') + '</span>' : '') + '</li>';

// the whole menu: <nav data-rl-all> (gate "menu": every page of the sitemap exactly once in it)
export function mainNav(h, p) {
  const cur = p.path;
  const secs = navTree(h, SPEC).map(s => {
    const n = s.groups.reduce((x, g) => x + g.items.length, 0);
    return '<div class="rl-dd" data-rl-dd><button type="button" aria-expanded="false" aria-controls="rl-m-' + s.id + '"' + (holds(s, cur) ? ' data-on' : '') + '>' + h.esc(s.name) + '</button>' +
      '<div class="rl-mp" id="rl-m-' + s.id + '"><div class="rl-mpi' + (n > 12 ? ' rl-mw' : '') + '">' + s.groups.map(g => '<div class="rl-mc"><p class="rl-mh">' + h.esc(g.name) + '</p><ul>' + [g.head, ...g.items].filter(Boolean).map(it => li(h, it, cur)).join('') + '</ul></div>').join('') + '</div></div></div>';
  }).join('');
  return '<nav class="rl-nav" id="rl-nav" aria-label="Principal" data-rl-all><div class="rl-nq"><input type="search" data-rl-q placeholder="Buscar operador, provincia o tema" aria-label="Buscar en casaslegales" autocomplete="off" enterkeyhint="search"><div class="rl-nqr" data-rl-qr hidden></div></div>' + secs + '</nav>';
}

// BreadcrumbList from the menu tree (home -> section hub -> brand -> page)
export function crumbsLd(h, p) {
  const t = crumbTrail(navTree(h, SPEC), p.path, 'Inicio');
  return t ? h.crumbs(t.map(([u, n]) => [u, n || p.h1])) : null;
}
