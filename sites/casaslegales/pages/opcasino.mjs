// /operador/<slug>/casino: the casino section of a brand, built only for brands whose review data has casino facts (owner
// 2026-11-04: casino pages per brand). What the casino section shows (live, categories, providers, RTP), in which provinces the
// brand is licensed and what each list says about casino (only Neuquen and Santa Fe name casino apart; the others authorise
// "juego online" without separating), responsible gaming, and the official address of each list.
import { OPS } from '../content/operators.mjs';
import { loadReviews, isAbsence } from '../../../tools/lib/revsources.mjs';
import { review } from '../content/reviews.mjs';
import { opData, quotesOf } from '../content/opdata.mjs';
import { rowOf } from './operador.mjs';
import { casinoLists } from './casinos.mjs';
import { reviewSection, reviewShots, viewLabel, providersOf, SIN } from './review.mjs';
import { quote, sectionHead, officialLinks, brandLink } from './parts.mjs';
import { codeOf } from './opparts.mjs';
import { brandNames } from '../../../tools/lib/sources.mjs';

const hasCasino = r => (r.facts || []).some(f => f.field.startsWith('casino.') && !isAbsence(f.value));
const BRANDS = Object.entries(loadReviews()).filter(([, r]) => hasCasino(r)).map(([b]) => b);
const fit = (a, b) => (a.length <= 60 ? a : b);
const fitD = (a, b) => (a.length <= 155 ? a : b);

export function casinoPage(o) {
  const name = brandNames()[o.brand];
  const path = '/operador/' + o.slug + '/casino';
  return {
    path, id: 'operador-' + o.slug + '-casino', kind: 'operator', brand: o.brand,
    title: fit(name + ' Casino en Argentina: juegos, proveedores y licencia', name + ' Casino: juegos, proveedores y licencia'),
    description: fitD(name + ' Casino en Argentina: qué juegos y proveedores muestra su sitio, si tiene casino en vivo y en qué provincias tiene licencia, con fecha.', name + ' Casino: juegos, proveedores, casino en vivo y en qué provincias tiene licencia según las listas oficiales.'),
    h1: name + ' Casino: qué juegos muestra y en qué provincias tiene licencia',
    ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ...(h.built('/operadores') ? [['/operadores', 'Operadores']] : []), ['/operador/' + o.slug, name], [path, 'Casino']])],
    render(h) {
      const R = review(h.today, o.brand), row = rowOf(h, o.brand), D = opData(h.today);
      if (!R || !hasCasino(R.r)) throw new Error(path + ': no casino facts in the review data');
      const P = providersOf(R);
      const jids = h.regs.filter(r => row.cells[r.id]).map(r => r.id);
      const L = casinoLists(h).filter(x => row.cells[x.r.id]);
      const named = L.filter(x => x.casino && x.casino.some(l => l.brand === o.brand));
      const apart = L.filter(x => x.casino && !x.casino.some(l => l.brand === o.brand));
      const general = L.filter(x => !x.casino);
      const seen = [...new Set(R.pre('casino').map(f => new URL(R.doc(f.doc).url).hostname))];
      const joinY = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a.at(-1);
      const lead = 'Lo que muestra la sección de casino de ' + name + ' en ' + joinY(seen) + ', visto desde Argentina sin abrir cuenta' + (P ? ' (' + P.names.length + ' proveedores en su filtro)' : '') + '. ' +
        (named.length ? 'La lista de ' + joinY(named.map(x => x.prov)) + ' lo nombra como casino online. ' : '') +
        (general.length ? (general.length === 1 ? 'La lista de ' + general[0].prov + ' autoriza' : 'Las listas de ' + joinY(general.map(x => x.prov)) + ' autorizan') + ' juego online sin decir, sitio por sitio, si incluye casino.' : '');
      const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">' + brandLink(h, o.brand, name) + h.esc(' · casino · páginas vistas el ' + h.fmtDate(R.r.collected || R.shots.map(s => s.date).sort()[0])) + '</p><h1>' + h.esc(h.page.h1) + '</h1>' +
        '<p class="rl-lead">' + h.esc(lead) + '</p>' + officialLinks(h, o.brand, jids) + '<p class="rl-note">Sin promociones ni afiliados. Los juegos de casino son solo para mayores de 18 años; depende de la ley de tu provincia.</p></div>' +
        '<div class="rl-big"><b>' + (P ? P.names.length : named.length + general.length) + '</b><span>' + (P ? 'proveedores en el filtro de su casino' : 'listas oficiales lo nombran') + '</span><small>copia del ' + h.fmtDate(R.doc(R.pre('casino')[0].doc).date) + '</small></div></section>';
      const shots = R.shots.filter(s => /casino/.test(s.view));
      const what = reviewSection(h, R, ['casino', 'Qué tiene su casino', 'casino'], { casino: shots.length ? '<div class="rl-shots">' + reviewShots(h, { ...R, shots }, viewLabel) + '</div>' : '' });
      const lic = '<section class="rl-sec" id="licencias">' + sectionHead(h, 'En qué provincias tiene licencia de casino', 'según cada lista oficial') + '<div class="rl-law">' +
        named.map(x => { const c = row.cells[x.r.id]; return '<article><span class="rl-tag">' + h.esc(codeOf(x.r.id)) + '</span><p><b>' + h.esc(x.prov) + ':</b> la lista nombra <span class="rl-host">' + h.esc(c.host) + '</span> como casino online.</p>' + quote(h, x.q, x.r.regulator.name) + '</article>'; }).join('') +
        apart.map(x => { const c = row.cells[x.r.id]; return '<article><span class="rl-tag">' + h.esc(codeOf(x.r.id)) + '</span><p><b>' + h.esc(x.prov) + ':</b> <span class="rl-host">' + h.esc(c.host) + '</span> figura en la lista, pero no entre los casinos online: la lista lo ubica en otra categoría.</p>' + quote(h, x.q, x.r.regulator.name) + '</article>'; }).join('') +
        general.map(x => { const c = row.cells[x.r.id]; return '<article><span class="rl-tag">' + h.esc(codeOf(x.r.id)) + '</span><p><b>' + h.esc(x.prov) + ':</b> <span class="rl-host">' + h.esc(c.host) + '</span> figura en la lista de juego online. La lista no separa casino de apuestas deportivas.</p>' + quote(h, x.q, x.r.regulator.name) + '</article>'; }).join('') +
        '</div><p class="rl-cap">Que una lista no nombre el casino aparte no quiere decir que esté prohibido: quiere decir que la lista no lo dice sitio por sitio. Lo que vale es la ley de tu provincia.' + (h.built('/casinos-online-legales') ? ' <a href="' + h.href('/casinos-online-legales') + '">Qué dice cada lista sobre el casino online</a>' : '') + '</p></section>';
      const rgOld = quotesOf(D, o.brand, 'rg').length;
      const rg = reviewSection(h, R, ['juego-responsable', 'Juego responsable', 'rg'], { why: { 'juego-responsable': SIN }, 'juego-responsable': rgOld && !R.pre('rg').length ? '<p class="rl-note">Las herramientas que citamos de sus páginas están en la <a href="' + h.href('/operador/' + o.slug) + '#juego-responsable">reseña de ' + h.esc(name) + '</a>.</p>' : '' });
      const links = [['/operador/' + o.slug, 'Reseña completa de ' + name], ['/casinos-online-legales', 'Casinos online legales por provincia'], ...jids.map(j => ['/provincia/' + j, 'Lista completa de ' + h.rg.prov(j).name]), ['/verificador', 'Verificá la dirección que tenés abierta']].filter(([u]) => h.built(u));
      const next = '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
      return hero + what + lic + rg + next;
    },
  };
}
export const casinoPages = OPS.filter(o => BRANDS.includes(o.brand)).map(casinoPage);
