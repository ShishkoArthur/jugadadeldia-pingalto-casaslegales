// /casinos-online-legales: what each verified list says about online casino. Two lists name the casino apart (Neuquen: the table
// "CASINOS ONLINE PERMITIDOS"; Santa Fe: the block CASINOS ONLINE), the others authorise online gaming without saying, site by
// site, which games. Everything is read from the registries; the build stops when a list changes shape.
import { isoMap, isoHeight } from './iso.mjs';
import { provData } from '../content/provdata.mjs';
import { sfeCats } from './operador.mjs';
import { quote, sectionHead, brandLink } from './parts.mjs';
import { listsDate } from './opparts.mjs';
import { CODE } from '../content/map.mjs';

const GENERAL_QUOTE = { 'buenos-aires': 'licences', caba: 'list', cordoba: 'list', 'la-rioja': 'regulator', mendoza: 'law', 'rio-negro': 'list' };

export function casinoLists(h) {
  return h.regs.map(r => {
    let casino = null, q = null;
    if (r.id === 'neuquen') {
      q = r.quotes.casinos;
      if (!q || q.doc !== r.list.doc) throw new Error('/casinos-online-legales: the Neuquen casino table quote is not on its list page');
      casino = r.licensees.filter(l => l.evidence.doc === r.list.doc);
    } else if (r.id === 'santa-fe') {
      q = r.quotes.count;
      const cats = sfeCats(h);
      casino = r.licensees.filter(l => cats[l.host].includes('casinos online'));
    } else {
      q = r.quotes[GENERAL_QUOTE[r.id]];
      if (!q) throw new Error('/casinos-online-legales: no wording quote for the ' + r.id + ' list');
    }
    if (casino && !casino.length) throw new Error('/casinos-online-legales: no casino site found in ' + r.id);
    return { r, casino, q, prov: h.rg.prov(r.id).name };
  });
}

export const casinos = {
  path: '/casinos-online-legales',
  id: 'casinos-online-legales',
  kind: 'registry',
  title: 'Casinos online legales en Argentina, provincia por provincia',
  description: 'Casinos online legales en Argentina: qué listas oficiales nombran el casino online, qué sitios figuran en cada provincia y qué dice cada regulador.',
  h1: 'Casinos online legales: qué listas oficiales nombran el casino y qué sitios figuran',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/licencias') ? [['/licencias', 'Licencias']] : []), ['/casinos-online-legales', 'Casinos online']])],
  render(h) {
    const L = casinoLists(h), P = provData(h);
    const exp = L.filter(x => x.casino), gen = L.filter(x => !x.casino);
    const nCasino = exp.reduce((n, x) => n + x.casino.length, 0);
    const byId = Object.fromEntries(L.map(x => [x.r.id, x]));
    const map = isoMap(h, t => {
      const x = byId[t.id], name = h.rg.prov(t.id).name;
      if (x && x.casino) return { kind: 'list', h: isoHeight('list', x.casino.length), on: true, label: t.code + ' · ' + x.casino.length, title: name + ': la lista nombra ' + x.casino.length + ' casinos online' };
      if (x) return { kind: 'platform', h: isoHeight('platform'), title: name + ': lista oficial de juego online, sin separar el casino' };
      return { kind: 'none', h: isoHeight(P.one(t.id).st === 'blocked' ? 'blocked' : 'none'), title: name + ': sin lista oficial verificada' };
    }, { size: 'm', aria: 'Mapa: en verde y más altas, las provincias cuya lista oficial nombra el casino online aparte' });
    const legend = '<div class="rl-leg"><span><i class="rl-s-list"></i>la lista nombra el casino online</span><span><i class="rl-s-platform"></i>lista de juego online, sin separar</span><span><i class="rl-s-none"></i>sin lista verificada</span></div>';
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + h.t('{{reg_total}} listas oficiales') + ' · copiadas el ' + listsDate(h) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">En Argentina no hay una lista nacional: cada provincia publica la suya. De las ' + L.length + ' listas oficiales que guardamos, ' + exp.length + ' separan el casino online de las apuestas deportivas. Las otras ' + gen.length + ' autorizan sitios de juego online sin decir, sitio por sitio, qué juegos tiene cada uno.</p>' +
      '<p class="rl-note">Sin bonos ni afiliados. Depende de la ley de tu provincia; esto no es asesoramiento legal.</p></div>' +
      '<div class="rl-pvv">' + map + '<p class="rl-pvn"><b>' + nCasino + '</b><span>direcciones figuran como casino online en ' + exp.map(x => x.prov).join(' y ') + '</span></p>' + legend + '</div></section>';

    const expSec = '<section class="rl-sec">' + sectionHead(h, 'Las listas que nombran el casino online', 'citas textuales de cada regulador') + '<div class="rl-law">' +
      exp.map(x => '<article><span class="rl-tag">' + h.esc(CODE[x.r.id]) + '</span><h3>' + h.esc(x.prov) + '</h3>' + quote(h, x.q, x.r.regulator.name) +
        '<ul class="rl-cl">' + x.casino.map(l => '<li>' + brandLink(h, l.brand) + '<span class="rl-host">' + h.esc(l.host) + '</span></li>').join('') + '</ul>' +
        '<p>' + x.casino.length + ' de ' + x.r.licensees.length + ' direcciones de la lista figuran como casino online.' + (h.built('/provincia/' + x.r.id) ? ' <a href="' + h.href('/provincia/' + x.r.id) + '">Lista completa de ' + h.esc(x.prov) + '</a>' : '') + '</p></article>').join('') + '</div></section>';

    const stack = '<ul class="rl-cst" aria-hidden="true">' + L.map(x => '<li><ol>' + x.r.licensees.map(l => '<li' + (x.casino && x.casino.includes(l) ? ' class="rl-cc"' : '') + '></li>').join('') + '</ol><span>' + h.esc(CODE[x.r.id]) + '</span><b>' + x.r.licensees.length + '</b></li>').join('') + '</ul>';
    const genSec = '<section class="rl-sec">' + sectionHead(h, 'Las otras ' + gen.length + ' listas: juego online, sin separar', 'cada bloque es un sitio de la lista') +
      '<div class="rl-card rl-cstc" data-nosnippet>' + stack + '<p class="rl-cap">En verde, los sitios que su lista nombra como casino online. En las demás listas el regulador no lo dice sitio por sitio: para saber qué juegos ofrece un sitio habilitado, el dato está en el propio sitio, no en la lista.</p></div>' +
      '<div class="rl-law">' + gen.map(x => '<article><span class="rl-tag">' + h.esc(CODE[x.r.id]) + '</span><h3>' + h.esc(x.prov) + '</h3>' + quote(h, x.q, x.r.regulator.name) +
        '<p>' + x.r.licensees.length + ' sitios: ' + x.r.licensees.map(l => brandLink(h, l.brand)).join(', ') + '.</p></article>').join('') + '</div></section>';

    const named = Object.entries(h.names).filter(([, n]) => /casino/i.test(n)).map(([b, n]) => ({ b, n, in: L.filter(x => x.r.licensees.some(l => l.brand === b)) })).filter(x => x.in.length);
    const nameSec = '<section class="rl-sec">' + sectionHead(h, 'El nombre no alcanza') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>«Casino» en la marca</h3><p>' + named.length + ' marcas de las listas llevan «casino» en el nombre. Eso no dice qué les autorizó el regulador: lo que vale es la lista de tu provincia y la dirección exacta.</p>' +
      '<ul class="rl-cl">' + named.map(x => '<li>' + brandLink(h, x.b) + '<span>' + x.in.map(y => CODE[y.r.id]).join(' · ') + '</span></li>').join('') + '</ul></div>' +
      '<div class="rl-box"><h3>Un sitio de otra provincia</h3><p>Un casino online que figura en la lista de una provincia está habilitado ahí. Si vivís en otra, buscá tu provincia: cada regulador publica su propia lista y su propia línea de ayuda.</p>' +
      (h.built('/verificador') ? '<p><a href="' + h.href('/verificador') + '">Verificá una dirección contra las ' + L.length + ' listas</a></p>' : '') + '</div></div></section>';

    const links = [['/licencias', 'Todas las licencias, sitio por sitio'], ['/provincias', 'Las 24 jurisdicciones, una por una'], ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar'], ['/guia/sitios-ilegales', 'Sitios sin licencia: riesgos y denuncias'], ['/juego-responsable', 'Ayuda y autoexclusión en tu provincia']].filter(([u]) => h.built(u));
    const next = '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
    return hero + expSec + genSec + nameSec + next;
  },
};
