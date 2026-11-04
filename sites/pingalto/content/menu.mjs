// Main menu of pingalto.com (owner 2026-11-04: every page reachable from a section submenu, the whole list in a convenient form).
// Built from the pages of the build by tools/lib/navtree.mjs: a new page lands in its game or section by its path, ordered by
// the plan (hub first, then wave and demand). Desktop: a mega panel per section (hover with a close delay or click); phone: the
// burger opens a full-height panel with the sections as an accordion and the search field on top (client/pa.js).
import { navTree, holds, crumbs as crumbTrail } from '../../../tools/lib/navtree.mjs';
import { GAMES } from './visual.mjs';

const under = base => p => p.path === base || p.path.startsWith(base + '/');
// short labels inside a game or section (the panel already says which game)
const LABEL = {
  '/': 'Inicio',
  '/kit/ping': 'Ping desde tu provincia',
  '/kit/sensibilidad': 'Convertidor de sensibilidad',
  '/kit/dpi': 'DPI real del mouse',
  '/tier-list': 'Creador de tier list',
  '/ff/sensibilidad': 'Sensibilidad',
  '/ff/nombres': 'Generador de nombres',
  '/ff/espacio-invisible': 'Espacio invisible',
  '/ff/codigos': 'Canjear códigos',
  '/ff/max': 'Free Fire MAX o Free Fire',
  '/valorant/rangos': 'Rangos y calculadora de RR',
  '/valorant/agentes': 'Agentes y habilidades',
  '/valorant/mapas/ascent': 'Mapa de Ascent',
  '/valorant/mapas/split': 'Mapa de Split',
  '/valorant/champions': 'Champions y VCT',
  '/cs2/major': 'Cómo funciona el Major',
  '/cs2/mira': 'Creador de miras',
  '/lol/rangos': 'Rangos en LAS',
  '/lol/worlds': 'Worlds en hora argentina',
  '/lol/msi': 'MSI',
  '/fortnite/nube': 'Jugar en la nube',
  '/dota2/ti': 'The International',
  '/clash/mazos': 'Constructor de mazos',
  '/clash/meta': 'Mazos del meta',
  '/clash/cartas': 'Todas las cartas',
  '/brawl/brawlers': 'Todos los brawlers',
  '/brawl/meta': 'Meta',
  '/brawl/eventos': 'Eventos de hoy',
  '/esports': 'Esports desde Argentina',
  '/esports/agenda': 'Agenda de hoy',
  '/esports/argentinos': 'Argentinos en los esports',
  '/esports/latam': 'Ligas de Latinoamérica',
  '/esports/glosario': 'Glosario de esports',
  '/esports/series': 'Probabilidad de una serie',
  '/esports/sistema-suizo': 'Simulador de fase suiza',
  '/equipo': 'Equipo',
  '/metodo': 'Método',
  '/datos': 'Datos y licencias',
  '/contacto': 'Contacto',
  '/legal': 'Aviso legal y privacidad',
};
const gameOf = p => GAMES.find(g => under(g.path)(p));

export const SPEC = {
  sections: [
    { id: 'juegos', name: 'Juegos', groups: GAMES.map(g => ({ id: g.id, name: g.name, head: g.path, test: under(g.path), game: g })) },
    {
      id: 'esports', name: 'Esports', hub: '/esports', groups: [
        { id: 'al-dia', name: 'Torneos y equipos', head: '/esports', test: p => under('/esports')(p) && p.kind !== 'tool' },
        { id: 'calc', name: 'Calculadoras', test: p => under('/esports')(p) },
      ],
    },
    { id: 'kit', name: 'Kit', groups: [{ id: 'kit', name: 'Para cualquier juego', test: p => under('/kit')(p) || p.path === '/tier-list' }] },
    {
      id: 'sitio', name: 'Nosotros', groups: [
        { id: 'sitio', name: 'pingalto', order: ['/'], test: p => p.path === '/' || p.kind === 'service' },
        { id: 'mas', name: 'Más páginas', test: () => false },
      ],
    },
  ],
  rest: { section: 'sitio', group: 'mas' },
  label(p, h) {
    if (LABEL[p.path]) return LABEL[p.path];
    const g = gameOf(p);
    if (g && p.path === g.path) return g.name;
    const t = h.t(p.h1).split(/:\s/)[0];
    return g ? t.replace(new RegExp('\\s(de|en|para)\\s' + g.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'), '').replace(/\sdesde Argentina$/, '') : t;
  },
};

const CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const link = (h, it, cur, cls = '') => '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + h.href(it.path) + '"' + (it.path === cur ? ' aria-current="page"' : '') + '>' + h.esc(it.label) + '</a>';
const list = (h, items, cur) => items.length ? '<ul>' + items.map(it => '<li>' + link(h, it, cur) + (it.kids.length ? list(h, it.kids, cur) : '') + '</li>').join('') + '</ul>' : '';

function panel(h, s, cur) {
  if (s.id === 'juegos') {
    return s.groups.map(g => {
      const G = g.spec.game, head = g.head ? '<a class="pa-mh pa-g-' + G.id + '" href="' + h.href(g.head.path) + '"' + (g.head.path === cur ? ' aria-current="page"' : '') + '><i aria-hidden="true">' + h.esc(G.mono) + '</i><span>' + h.esc(G.name) + '</span></a>' : '<b class="pa-mh pa-g-' + G.id + '"><i aria-hidden="true">' + h.esc(G.mono) + '</i><span>' + h.esc(G.name) + '</span></b>';
      return '<div class="pa-mg">' + head + list(h, g.items, cur) + '</div>';
    }).join('');
  }
  return s.groups.map(g => '<div class="pa-mg">' + (g.head ? link(h, g.head, cur, 'pa-mt') : '<b class="pa-mt">' + h.esc(g.name) + '</b>') + list(h, g.items, cur) + '</div>').join('');
}

// the whole menu: <nav data-pa-all> (gate "menu": every page of the sitemap exactly once in it)
export function mainNav(h, p) {
  const cur = p.path;
  const tree = navTree(h, SPEC);
  const secs = tree.map(s => {
    const on = holds(s, cur);
    return '<div class="pa-dd' + (s.id === 'juegos' ? ' pa-ddj' : '') + '" data-pa-dd><button type="button" aria-expanded="false" aria-controls="pa-m-' + s.id + '"' + (on ? ' data-on' : '') + '>' + h.esc(s.name) + CHEV + '</button>' +
      '<div class="pa-mm" id="pa-m-' + s.id + '">' + panel(h, s, cur) + '</div></div>';
  }).join('');
  return '<nav class="pa-nv" id="pa-nv" aria-label="Principal" data-pa-all><div class="pa-qb"><input type="search" data-pa-q placeholder="Buscar en pingalto" aria-label="Buscar en pingalto" autocomplete="off" enterkeyhint="search"><div class="pa-qr" data-pa-qr hidden></div></div>' + secs + '</nav>';
}

// BreadcrumbList from the menu tree (home -> section hub -> game -> page)
export function crumbsLd(h, p) {
  const t = crumbTrail(navTree(h, SPEC), p.path, 'pingalto');
  return t ? h.crumbs(t.map(([u, n]) => [u, n || p.h1])) : null;
}
