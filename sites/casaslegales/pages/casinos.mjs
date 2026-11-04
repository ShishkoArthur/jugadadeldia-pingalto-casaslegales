// /casinos-online-legales: what each verified list says about online casino. Two lists name the casino apart (Neuquen: the table
// "CASINOS ONLINE PERMITIDOS"; Santa Fe: the block CASINOS ONLINE), the others authorise online gaming without saying, site by
// site, which games. Everything is read from the registries; the build stops when a list changes shape.
import { isoMap, isoHeight } from './iso.mjs';
import { provData } from '../content/provdata.mjs';
import { sfeCats } from './operador.mjs';
import { quote, sectionHead, brandLink } from './parts.mjs';
import { listsDate } from './opparts.mjs';
import { CODE } from '../content/map.mjs';
import { officialUrl, DEAD } from '../content/official.mjs';
import { OPS } from '../content/operators.mjs';
import { review } from '../content/reviews.mjs';
import { providersOf } from './review.mjs';
import { isAbsence } from '../../../tools/lib/revsources.mjs';

const goBtn = (h, r, l) => DEAD[l.host] ? '' : '<a class="rl-off rl-off-t" href="' + h.esc(officialUrl(l)) + '" rel="nofollow noopener" target="_blank" aria-label="' + h.esc('Ir al sitio oficial de ' + h.names[l.brand] + ' (' + h.rg.prov(r.id).name + ')') + '"><span>Ir</span></a>';
const pct = x => (x * 100).toFixed(2).replace('.', ',') + ' %';
// the house edge of roulette from its own rules (a straight bet pays 35 to 1): code, not a typed number
function roulette(zeros) {
  const n = 36 + zeros, win = 1 / n, edge = -(win * 35 - (1 - win));
  return { n, edge, rtp: 1 - edge };
}

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
  title: 'Casino online en Argentina: sitios legales por provincia',
  description: 'Casino online en Argentina: qué es, cuánto se queda la casa (ruleta y RTP, calculado), slots y casino en vivo, y qué sitios figuran en cada lista oficial.',
  h1: 'Casino online en Argentina: cómo funciona y qué sitios son legales en tu provincia',
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
        '<ul class="rl-cl">' + x.casino.map(l => '<li>' + brandLink(h, l.brand) + '<span class="rl-host">' + h.esc(l.host) + goBtn(h, x.r, l) + '</span></li>').join('') + '</ul>' +
        '<p>' + x.casino.length + ' de ' + x.r.licensees.length + ' direcciones de la lista figuran como casino online.' + (h.built('/provincia/' + x.r.id) ? ' <a href="' + h.href('/provincia/' + x.r.id) + '">Lista completa de ' + h.esc(x.prov) + '</a>' : '') + '</p></article>').join('') + '</div></section>';

    const stack = '<ul class="rl-cst" aria-hidden="true">' + L.map(x => '<li><ol>' + x.r.licensees.map(l => '<li' + (x.casino && x.casino.includes(l) ? ' class="rl-cc"' : '') + '></li>').join('') + '</ol><span>' + h.esc(CODE[x.r.id]) + '</span><b>' + x.r.licensees.length + '</b></li>').join('') + '</ul>';
    const genSec = '<section class="rl-sec">' + sectionHead(h, 'Las otras ' + gen.length + ' listas: juego online, sin separar', 'cada bloque es un sitio de la lista') +
      '<div class="rl-card rl-cstc" data-nosnippet>' + stack + '<p class="rl-cap">En verde, los sitios que su lista nombra como casino online. En las demás listas el regulador no lo dice sitio por sitio: para saber qué juegos ofrece un sitio habilitado, el dato está en el propio sitio, no en la lista.</p></div>' +
      '<div class="rl-law">' + gen.map(x => '<article><span class="rl-tag">' + h.esc(CODE[x.r.id]) + '</span><h3>' + h.esc(x.prov) + '</h3>' + quote(h, x.q, x.r.regulator.name) +
        '<ul class="rl-cl">' + x.r.licensees.map(l => '<li>' + brandLink(h, l.brand) + '<span class="rl-host">' + h.esc(l.host) + goBtn(h, x.r, l) + '</span></li>').join('') + '</ul></article>').join('') + '</div></section>';

    const named = Object.entries(h.names).filter(([, n]) => /casino/i.test(n)).map(([b, n]) => ({ b, n, in: L.filter(x => x.r.licensees.some(l => l.brand === b)) })).filter(x => x.in.length);
    const nameSec = '<section class="rl-sec">' + sectionHead(h, 'El nombre no alcanza') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>«Casino» en la marca</h3><p>' + named.length + ' marcas de las listas llevan «casino» en el nombre. Eso no dice qué les autorizó el regulador: lo que vale es la lista de tu provincia y la dirección exacta.</p>' +
      '<ul class="rl-cl">' + named.map(x => '<li>' + brandLink(h, x.b) + '<span>' + x.in.map(y => CODE[y.r.id]).join(' · ') + '</span></li>').join('') + '</ul></div>' +
      '<div class="rl-box"><h3>Un sitio de otra provincia</h3><p>Un casino online que figura en la lista de una provincia está habilitado ahí. Si vivís en otra, buscá tu provincia: cada regulador publica su propia lista y su propia línea de ayuda.</p>' +
      (h.built('/verificador') ? '<p><a href="' + h.href('/verificador') + '">Verificá una dirección contra las ' + L.length + ' listas</a></p>' : '') + '</div></div></section>';

    const links = [['/licencias', 'Todas las licencias, sitio por sitio'], ['/provincias', 'Las 24 jurisdicciones, una por una'], ['/guia/bet-ar', 'Qué garantiza el dominio .bet.ar'], ['/guia/sitios-ilegales', 'Sitios sin licencia: riesgos y denuncias'], ['/juego-responsable', 'Ayuda y autoexclusión en tu provincia']].filter(([u]) => h.built(u));
    const next = '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + '<div class="rl-gd">' + links.map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div></section>';
    // what an online casino is, in numbers the code computes, and what the reviewed sites show (data/sources/reviews)
    const eu = roulette(1), us = roulette(2), rtp = 0.96, stake = 1000;
    const revs = OPS.map(o => ({ o, R: review(h.today, o.brand) })).filter(x => x.R && x.R.r.facts.length);
    const real = f => f && !isAbsence(f.value) && f.value !== false;
    const live = revs.filter(x => real(x.R.one('casino.live')));
    const rtpNo = revs.filter(x => x.R.all('casino.rtpPublished').some(f => isAbsence(f.value)));
    const what = '<section class="rl-sec" id="que-es">' + sectionHead(h, 'Qué es un casino online', 'dos tipos de juego') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Tragamonedas y juegos de mesa digitales</h3><p>Los resultados salen de un programa del proveedor del juego, no del sitio. Cada juego tiene un retorno al jugador (RTP): la parte de lo apostado que el juego devuelve en promedio, a muy largo plazo.</p></div>' +
      '<div class="rl-box"><h3>Casino en vivo</h3><p>Una persona reparte cartas o tira la bola de la ruleta frente a una cámara, y apostás desde el sitio. Las reglas y la ventaja de la casa son las del juego de mesa.' +
      (revs.length ? ' De los ' + revs.length + ' sitios que reseñamos, ' + live.length + ' ' + (live.length === 1 ? 'muestra' : 'muestran') + ' una sección de casino en vivo en su página pública.' : '') + '</p></div></div></section>';
    const edge = '<section class="rl-sec" id="ventaja">' + sectionHead(h, 'Cuánto se queda la casa', 'calculado con las reglas de cada juego') + '<div class="rl-two">' +
      '<div class="rl-box"><h3>Ruleta: ' + pct(eu.edge) + ' con un cero</h3><p>La ruleta europea tiene ' + eu.n + ' números y un pleno paga 35 a 1. Si apostás a un número, ganás 1 de cada ' + eu.n + ' veces en promedio: la casa se queda con ' + pct(eu.edge) + ' de lo apostado (retorno ' + pct(eu.rtp) + '). Con dos ceros (' + us.n + ' números), la ventaja sube a ' + pct(us.edge) + '.</p></div>' +
      '<div class="rl-box"><h3>Tragamonedas: RTP</h3><p>Por ejemplo, con un RTP de ' + pct(rtp).replace(',00', '') + ', de cada $' + stake + ' apostados el juego devuelve en promedio $' + Math.round(stake * rtp) + ' y retiene $' + Math.round(stake * (1 - rtp)) + ', a muy largo plazo. En una sesión corta el resultado puede ser cualquiera; ningún método cambia ese promedio.</p>' +
      (rtpNo.length ? '<p class="rl-note">En la página de reglas de ' + rtpNo.map(x => brandLink(h, x.o.brand)).join(', ') + ' no encontramos el RTP publicado (ver cada reseña).</p>' : '') + '</div></div>' +
      (h.built('/calculadora/margen') ? '<p class="rl-note">En las apuestas deportivas, lo mismo se llama margen: <a href="' + h.href('/calculadora/margen') + '">calculalo con tus cuotas</a>.</p>' : '') + '</section>';
    const withCasino = OPS.filter(o => h.built('/operador/' + o.slug + '/casino'));
    const brands = withCasino.length ? '<section class="rl-sec" id="marcas">' + sectionHead(h, 'Los casinos de las marcas que reseñamos', 'páginas públicas vistas desde Argentina') + '<div class="rl-gd">' +
      withCasino.map((o, i) => { const R = review(h.today, o.brand), P = R && providersOf(R); return '<a href="' + h.href('/operador/' + o.slug + '/casino') + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(h.names[o.brand] + ' Casino' + (P ? ': ' + P.names.length + ' proveedores' : '')) + '</a>'; }).join('') + '</div></section>' : '';
    const before = '<section class="rl-sec" id="antes">' + sectionHead(h, 'Antes de entrar a un casino online') + '<ol class="rl-steps">' +
      '<li><b>Solo mayores de 18</b><p>Todos los sitios de las listas lo exigen y piden verificar la identidad antes de retirar.</p></li>' +
      '<li><b>El sitio de tu provincia</b><p>Una licencia vale en la provincia que la dio. Usá la dirección de la lista de donde estás' + (h.built('/verificador') ? ' o pegala en el <a href="' + h.href('/verificador') + '">verificador</a>' : '') + '.</p></li>' +
      '<li><b>Límites antes de empezar</b><p>Los sitios de las listas ofrecen límites de depósito y autoexclusión; cada provincia tiene además su propio registro.' + (h.built('/juego-responsable') ? ' <a href="' + h.href('/juego-responsable') + '">Ayuda y autoexclusión</a>' : '') + '</p></li></ol></section>';
    return hero + what + edge + expSec + genSec + brands + nameSec + before + next;
  },
};
