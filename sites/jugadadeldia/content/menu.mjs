// Menus of jugadadeldia.com. The main menu lists every page of the build (owner 2026-11-04: "the whole list of pages in a
// convenient form"), grouped by tools/lib/navtree.mjs with the rules below: a new page lands in its section by its path and the
// plan section, ordered by the plan (hub first, then wave and demand). Desktop: one panel of group cards per section (hover with a
// close delay or click); phone: the burger opens a full-height panel with the sections as an accordion and the search on top.
// Help pages show only HELP_NAV (gate helpnav) and the search limited to help and site pages (client/busca.js).
import { navTree, holds, crumbs as crumbTrail } from '../../../tools/lib/navtree.mjs';

const seg = p => p.path.split('/').filter(Boolean);
const under = base => p => p.path.startsWith(base);
const HOY = ['/quiniela/', '/quiniela/nacional-y-provincia/', '/quiniela/horarios/', '/quiniela/extractos/'];
const TURNOS = ['/quiniela/la-previa/', '/quiniela/la-primera/', '/quiniela/matutina/', '/quiniela/vespertina/', '/quiniela/nocturna/'];
const COMPARE = ['/cuanto-devuelve-cada-juego/', '/calendario-de-sorteos/', '/premios-e-impuestos/'];
const tombola = (p, pl) => pl.section === 'Tómbola' || p.path.startsWith('/tombola/');
const parent = p => seg(p).length === 2 ? '/' + seg(p)[0] + '/' : null;

const LABEL = {
  '/': 'Inicio',
  '/quiniela/': 'Quiniela de hoy',
  '/quiniela/nacional-y-provincia/': 'Nacional y Provincia',
  '/quiniela/horarios/': 'Horarios de hoy',
  '/quiniela/extractos/': 'Extractos anteriores',
  '/quiniela/la-previa/': 'La Previa', '/quiniela/la-primera/': 'La Primera', '/quiniela/matutina/': 'Matutina',
  '/quiniela/vespertina/': 'Vespertina', '/quiniela/nocturna/': 'Nocturna',
  '/quiniela/nacional/': 'Nacional', '/quiniela/provincia/': 'Provincia de Buenos Aires',
  '/quiniela/cuanto-paga/': '¿Cuánto paga?', '/quiniela/redoblona/': 'Redoblona', '/quiniela/como-se-juega/': 'Cómo se juega',
  '/quiniela/online/': '¿Se puede jugar online?', '/quiniela/numeros-que-mas-salen/': 'Números que más salen',
  '/quiniela/significado-de-los-numeros/': 'Significado de los números', '/quiniela/simulador/': 'Simulador de un año',
  '/quini-6/': 'Quini 6: resultados', '/quini-6/controlar/': 'Controlar tu boleta', '/quini-6/como-se-juega/': 'Cómo se juega',
  '/loto-plus/': 'Loto Plus', '/brinco/': 'Brinco', '/telekino/': 'Telekino', '/poceada/': 'Poceada', '/quiniela-plus/': 'Quiniela Plus',
  '/cuanto-devuelve-cada-juego/': '¿Cuánto devuelve cada juego?',
  '/truco/': 'Todo el truco', '/truco/jugar/': 'Jugar contra la compu', '/truco/anotador/': 'Anotador',
  '/truco/valores-de-las-cartas/': 'Valores de las cartas', '/truco/senas/': 'Señas', '/truco/envido/': 'Envido: contá tus tantos',
  '/truco/reglas/': 'Reglas', '/truco/puntos/': 'Cuánto vale cada canto', '/truco/quiero-o-no-quiero/': '¿Quiero o no quiero?', '/truco/flor/': 'La flor',
  '/juegos-de-cartas/': 'Todos los juegos', '/generala/': 'Generala', '/chinchon/': 'Chinchón', '/escoba-de-15/': 'Escoba de 15',
  '/burako/': 'Burako', '/dados/': 'Dados', '/bolillero/': 'Bolillero', '/generala/probabilidades/': 'Probabilidades',
  '/juego-responsable/': 'Líneas de ayuda', '/juego-responsable/autoexclusion/': 'Autoexclusión',
  '/quienes-somos/': 'Quiénes somos', '/quien-escribe/': 'Quién escribe', '/de-donde-salen-los-datos/': 'De dónde salen los datos',
  '/glosario/': 'Glosario', '/politica-de-privacidad/': 'Privacidad',
};
const LAST = { jugar: 'Jugar contra la compu', anotador: 'Anotador', controlar: 'Controlar', probabilidades: 'Probabilidades', 'como-se-juega': 'Cómo se juega' };

export const SPEC = {
  sections: [
    {
      id: 'quiniela', name: 'Quiniela', hub: '/quiniela/', groups: [
        { id: 'hoy', name: 'Hoy', order: HOY, test: p => HOY.includes(p.path) },
        { id: 'turno', name: 'Por turno', order: TURNOS, test: p => TURNOS.includes(p.path) },
        { id: 'prov', name: 'Por provincia', test: (p, pl) => pl.section === 'Quiniela por provincia' },
        { id: 'saber', name: 'Para entenderla', test: under('/quiniela/') },
      ],
    },
    {
      id: 'loterias', name: 'Loterías', groups: [
        { id: 'quini6', name: 'Quini 6', test: under('/quini-6/') },
        { id: 'sorteos', name: 'Más sorteos', nest: parent, test: (p, pl) => p.kind === 'lottery' && !COMPARE.includes(p.path) && !tombola(p, pl) },
        { id: 'tombola', name: 'Tómbola', test: tombola },
        { id: 'comparar', name: 'Para comparar', order: COMPARE, test: p => COMPARE.includes(p.path) },
      ],
    },
    {
      id: 'truco', name: 'Truco', hub: '/truco/', groups: [
        { id: 'mesa', name: 'En la mesa', order: ['/truco/'], test: p => p.path === '/truco/' || /^\/truco\/(jugar|anotador)\/$/.test(p.path) },
        { id: 'reglas', name: 'Reglas y cantos', test: under('/truco/') },
      ],
    },
    { id: 'juegos', name: 'Juegos', hub: '/juegos-de-cartas/', groups: [{ id: 'juegos', name: 'Cartas y dados', order: ['/juegos-de-cartas/'], nest: parent, test: p => p.kind === 'game' }] },
    {
      id: 'ayuda', name: 'Ayuda', hub: '/juego-responsable/', groups: [
        { id: 'ayuda', name: 'Ayuda con el juego', order: ['/juego-responsable/', '/juego-responsable/autoexclusion/'], test: p => ['/juego-responsable/', '/juego-responsable/autoexclusion/'].includes(p.path) },
        { id: 'prov', name: 'En tu provincia', sort: 'label', test: under('/juego-responsable/') },
      ],
    },
    {
      id: 'sitio', name: 'El sitio', groups: [
        { id: 'sitio', name: 'Jugada del Día', order: ['/'], test: p => p.path === '/' || p.kind === 'service' },
        { id: 'mas', name: 'Más páginas', test: () => false },
      ],
    },
  ],
  rest: { section: 'sitio', group: 'mas' },
  label(p, h) {
    if (LABEL[p.path]) return LABEL[p.path];
    const s = seg(p);
    const prov = h.rg.pack.provinces.find(x => x.id === s[1]);
    if ((s[0] === 'quiniela' || s[0] === 'juego-responsable') && s.length === 2 && prov) return prov.name;
    if (s.length === 2 && LAST[s[1]]) return LAST[s[1]];
    return null;
  },
};

const link = (h, it, cur) => '<a href="' + h.href(it.path) + '"' + (it.path === cur ? ' aria-current="page"' : '') + '>' + h.esc(it.label) + '</a>';
const items = (h, list, cur) => list.map(it => it.kids.length ? '<div class="jg-mk">' + link(h, it, cur) + '<span>' + it.kids.map(k => link(h, k, cur)).join('') + '</span></div>' : link(h, it, cur)).join('');

// the whole menu: <nav data-jg-all> (gate "menu": every page of the sitemap exactly once in it)
export function mainNav(h, p) {
  const cur = p.path;
  const tree = navTree(h, SPEC);
  const secs = tree.map(s => '<div class="jg-dd" data-jg-dd><button type="button" aria-expanded="false" aria-controls="jg-m-' + s.id + '"' + (holds(s, cur) ? ' data-on' : '') + '>' + h.esc(s.name) + '</button>' +
    '<div class="jg-mp" id="jg-m-' + s.id + '"><div class="jg-pin">' + s.groups.map(g => {
      const n = [g.head, ...g.items].filter(Boolean).length + g.items.reduce((a, it) => a + it.kids.length, 0);
      return '<div class="jg-mg' + (n > 9 ? ' jg-mg2' : '') + '"><b>' + h.esc(g.name) + '</b>' + (g.head ? link(h, g.head, cur) : '') + items(h, g.items, cur) + '</div>';
    }).join('') + '</div></div></div>').join('');
  return '<nav class="jg-menu jg-sg" id="jg-nav" aria-label="Principal" data-jg-all><div class="jg-nq"><input type="search" data-jg-q placeholder="Buscar en Jugada del Día" aria-label="Buscar en Jugada del Día" autocomplete="off" enterkeyhint="search"><div class="jg-nqr" data-jg-qr hidden></div></div>' + secs + '</nav>';
}

// BreadcrumbList from the menu tree (home -> section hub -> parent -> page)
export function crumbsLd(h, p) {
  const t = crumbTrail(navTree(h, SPEC), p.path, 'Inicio');
  return t ? h.crumbs(t.map(([u, n]) => [u, n || p.h1])) : null;
}

export const HELP_NAV = [['/juego-responsable/', 'Líneas de ayuda'], ['/juego-responsable/autoexclusion/', 'Autoexclusión'], ['/quienes-somos/', 'Quiénes somos']];
export const FOOT = [['/quienes-somos/', 'Quiénes somos'], ['/quien-escribe/', 'Quién escribe'], ['/de-donde-salen-los-datos/', 'De dónde salen los datos'], ['/glosario/', 'Glosario'], ['/politica-de-privacidad/', 'Privacidad'], ['/juego-responsable/', 'Juego responsable']];
