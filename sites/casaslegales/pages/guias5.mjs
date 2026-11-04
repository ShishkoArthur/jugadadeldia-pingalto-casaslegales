// How-to pages (audit 2026-11-04, sections 5-6): /guia/apuestas-deportivas (how one bet works, the common markets, live and cash
// out, the margin and where it is legal; every number by engine/odds.mjs, the legal part from the verified lists and province
// data) and /guia/glosario (one line per term and the page that explains it). otherCalcs() is the "Otras calculadoras" block of
// the calculators.
import { single, margin, parlay, convertOdd, cashOut, settleHandicap, handicapLabel, handicapReturn } from '../../../engine/odds.mjs';
import { fmtInt } from '../../../engine/format.mjs';
import { provData, STATUS_LABEL, STATUS_ORDER } from '../content/provdata.mjs';
import { officialUrl } from '../content/official.mjs';
import { sectionHead, brandLink, hostHtml, officialLink } from './parts.mjs';
import { relief } from './provincia.mjs';

const dec = (x, d = 2) => x.toFixed(d).replace('.', ',');
const pct = (x, d = 1) => dec(x * 100, d) + ' %';
const ars = x => '$\u00a0' + fmtInt(Math.round(x));
const go = (h, list) => '<div class="rl-gd">' + list.filter(([u]) => h.built(u.split('#')[0])).map(([u, l], i) => '<a href="' + h.href(u) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + h.esc(l) + '</a>').join('') + '</div>';

const CALCS = [
  ['/calculadora/cuotas', 'Calculadora de cuotas', 'decimal, fraccional, americana y probabilidad'],
  ['/calculadora/margen', 'Calculadora de margen', 'cuánto se queda la casa en un mercado'],
  ['/calculadora/combinada', 'Calculadora de combinadas', 'cuota total y margen de varias selecciones'],
  ['/guia/handicap', 'Calculadora de hándicap asiático', 'qué pasa con tu apuesta en cada línea'],
];
export function otherCalcs(h, current) {
  const list = CALCS.filter(([u]) => u !== current && h.built(u));
  return '<section class="rl-sec">' + sectionHead(h, 'Otras calculadoras', 'sin datos de operadores, todo lo calcula el programa') +
    '<div class="rl-ocalc">' + list.map(([u, t, s]) => '<a href="' + h.href(u) + '"><b>' + h.esc(t) + '</b><span>' + h.esc(s) + '</span></a>').join('') +
    (h.built('/guia/glosario') ? '<a href="' + h.href('/guia/glosario') + '"><b>Glosario</b><span>cada término en una línea</span></a>' : '') + '</div></section>';
}

const STAKE = 1000;
const M = {
  x12: { odds: ['2,10', '3,20', '3,60'], labels: ['Local (1)', 'Empate (X)', 'Visitante (2)'], pick: 0 },
  ou: { odds: ['1,85', '1,95'], labels: ['Más de 2,5', 'Menos de 2,5'], pick: 0 },
  btts: { odds: ['1,80', '1,95'], labels: ['Sí', 'No'], pick: 0 },
};
const MATCH = ['Talleres', 'Belgrano'];
const HC = { line: -0.75, odd: 1.9, a: 2, b: 1 };
const LIVE = ['1,40', '4,20', '7,50'];
const COMBO = [
  { odds: M.x12.odds, pick: 0, label: 'Talleres gana' },
  { odds: M.ou.odds, pick: 0, label: 'Más de 2,5 goles en Rosario Central - Newell\'s' },
  { odds: M.btts.odds, pick: 0, label: 'Ambos marcan en Estudiantes - Gimnasia' },
];
const WORD = { win: 'gana entera', 'half-win': 'mitad gana, mitad vuelve', push: 'se devuelve', 'half-lose': 'mitad pierde, mitad vuelve', lose: 'pierde' };

function bars(h, m, labels) {
  return '<ul class="rl-mkb">' + m.odds.map((o, i) => '<li><span>' + h.esc(labels[i]) + '</span><b>' + dec(o) + '</b><i style="--w:' + (100 * m.implied[i]).toFixed(2) + '%" aria-hidden="true"></i><em>' + pct(m.implied[i]) + '</em></li>').join('') + '</ul>';
}
function market(h, k, title, what, ex) {
  const d = M[k], m = margin(d.odds), s = single(STAKE, d.odds[d.pick]);
  return '<article id="' + k.replace('x12', '1x2').replace('ou', 'mas-menos').replace('btts', 'ambos-marcan') + '" class="rl-mk"><h3>' + h.esc(title) + '</h3><p>' + h.esc(what) + '</p>' + bars(h, m, d.labels) +
    '<p class="rl-mkf">Suman ' + pct(m.sum, 2) + ' · margen <b>' + pct(m.margin, 2) + '</b></p>' +
    '<p class="rl-mkr">' + h.esc(ex) + ' a ' + dec(s.odd) + ': con ' + ars(STAKE) + ' cobrás <b>' + ars(s.pays) + '</b> si acertás.</p></article>';
}

function platformLink(h, p, d) {
  const u = officialUrl(p);
  return '<a class="rl-off rl-off-s" href="' + h.esc(u) + '" rel="nofollow noopener" target="_blank"><span>Ir al sitio oficial (' + h.esc(p.name) + ')</span><small>' + h.esc(new URL(u).hostname) + ' · enlazado por ' + h.esc(d.host) + '</small></a>';
}

function legal(h) {
  const P = provData(h);
  const map = relief(h, P, null, { links: true });
  const lists = P.all.filter(x => x.st === 'list').sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'es'));
  const plats = P.all.filter(x => x.st === 'platform');
  const rest = P.all.filter(x => x.st === 'none' || x.st === 'blocked');
  const sites = new Set(lists.flatMap(x => x.reg.licensees.map(l => l.host))).size;
  const prov = x => h.built('/provincia/' + x.id) ? '<a href="' + h.href('/provincia/' + x.id) + '">' + h.esc(x.name) + '</a>' : h.esc(x.name);
  const det = lists.map(x => '<details class="rl-box rl-lg"><summary><span class="rl-tag">' + h.esc(x.code) + '</span>' + h.esc(x.name) + ' · ' + x.n + (x.n === 1 ? ' sitio' : ' sitios') + ' en la lista de ' + h.esc(x.reg.regulator.short) + '</summary>' +
    '<ul class="rl-sites">' + x.reg.licensees.map(l => '<li><h3>' + brandLink(h, l.brand) + '</h3>' + hostHtml(h, l.host) + officialLink(h, x.id, l.brand, { small: true, host: l.host }) + '</li>').join('') + '</ul>' +
    '<p class="rl-src">' + prov(x) + ': la lista con su fuente y fecha</p></details>').join('');
  const pl = plats.length ? '<div class="rl-plat rl-lgp">' + plats.map(x => '<article><h3>' + prov(x) + '</h3><p>' + h.esc(x.label) + '</p>' + x.e.platforms.map(p => hostHtml(h, p.host) + platformLink(h, p, P.doc(p.evidence.doc))).join('') + '</article>').join('') + '</div>' : '';
  const counts = STATUS_ORDER.map(s => '<li><i class="rl-s-' + s + '"></i><b>' + P.count[s] + '</b> ' + h.esc(STATUS_LABEL[s]) + '</li>').join('');
  return '<section class="rl-sec" id="donde-es-legal">' + sectionHead(h, 'Dónde es legal apostar online en Argentina', 'cada provincia autoriza sus sitios') +
    '<div class="rl-two"><div class="rl-pvv">' + map + '<p class="rl-pvcap">Tocá tu provincia para ver su página</p></div>' +
    '<div class="rl-box"><h3>No hay una licencia nacional</h3><p>Cada provincia decide qué sitios autoriza, y la licencia vale en esa provincia. De ' + P.all.length + ' jurisdicciones:</p><ul class="rl-lgc">' + counts + '</ul>' +
    '<p>Las ' + lists.length + ' listas verificadas nombran ' + sites + ' direcciones distintas. Apostá solo en un sitio de la lista de la provincia donde estás.</p>' +
    (h.built('/guia/ley-federal') ? '<p><a href="' + h.href('/guia/ley-federal') + '">Cómo va la ley federal</a></p>' : '') + '</div></div>' +
    '<h3 class="rl-lgh">Las listas oficiales, con el botón a cada sitio</h3>' + det +
    (pl ? '<h3 class="rl-lgh">Provincias con una plataforma enlazada por el regulador</h3>' + pl : '') +
    '<p class="rl-note">Sin lista ni plataforma verificada: ' + rest.map(prov).join(', ') + '. Eso no dice que ahí todo esté prohibido ni permitido: dice que no tenemos una fuente oficial que citar.</p>' +
    '<p class="rl-offn">Los botones llevan a la dirección que publica el regulador, sin códigos de afiliado. Solo mayores de 18.</p></section>';
}

export const apuestasDeportivas = {
  path: '/guia/apuestas-deportivas',
  id: 'guia-apuestas-deportivas',
  kind: 'guide',
  title: 'Apuestas deportivas online en Argentina: cómo funcionan',
  description: 'Cómo funcionan las apuestas deportivas online: cuota y probabilidad, 1X2, más/menos, ambos marcan, hándicap, combinadas, cash out, margen y dónde es legal.',
  h1: 'Apuestas deportivas online: cómo funciona una apuesta y dónde es legal',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/apuestas-deportivas', 'Apuestas deportivas']])],
  render(h) {
    const m = margin(M.x12.odds), s = single(STAKE, M.x12.odds[0]);
    const slip = '<div class="rl-slip" aria-label="Ejemplo de boleto"><p class="rl-slip-h">Boleto de ejemplo</p><p class="rl-slip-m">' + h.esc(MATCH.join(' - ')) + ' · 1X2</p>' +
      '<dl><div><dt>Tu elección</dt><dd>Local (' + h.esc(MATCH[0]) + ')</dd></div><div><dt>Cuota</dt><dd>' + dec(s.odd) + '</dd></div><div><dt>Monto</dt><dd>' + ars(STAKE) + '</dd></div>' +
      '<div class="rl-slip-w"><dt>Si gana, cobrás</dt><dd>' + ars(s.pays) + '</dd></div><div><dt>Ganancia</dt><dd>' + ars(s.profit) + '</dd></div><div><dt>Si no gana</dt><dd>perdés ' + ars(STAKE) + '</dd></div></dl>' +
      '<p class="rl-slip-f">Cuota inventada, no de un sitio real</p></div>';
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Guía · cada número lo calcula el programa</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Una apuesta deportiva es un monto a un resultado, con una cuota fijada antes. Si acertás, cobrás monto × cuota; si no, lo perdés. Acá está cómo leer la cuota, los mercados más comunes, qué cobra la casa y en qué provincias es legal.</p></div>' + slip + '</section>';
    const steps = '<section class="rl-sec">' + sectionHead(h, 'Una apuesta, paso a paso', 'con el boleto de ejemplo') + '<ol class="rl-steps">' +
      '<li><b>Elegís partido y mercado</b><p>' + h.esc(MATCH.join(' - ')) + ', mercado 1X2: gana el local, empate o gana el visitante.</p></li>' +
      '<li><b>Mirás la cuota</b><p>La cuota decimal ya incluye lo apostado: ' + ars(STAKE) + ' × ' + dec(s.odd) + ' = ' + ars(s.pays) + ' si gana ' + h.esc(MATCH[0]) + '. La ganancia es ' + ars(s.profit) + '.</p></li>' +
      '<li><b>La pasás a probabilidad</b><p>1 / ' + dec(s.odd) + ' = ' + pct(s.implied) + '. Para que esa apuesta fuera pareja, ' + h.esc(MATCH[0]) + ' tendría que ganar ' + pct(s.implied) + ' de las veces.</p></li>' +
      '<li><b>Sumás el mercado</b><p>Las tres cuotas (' + M.x12.odds.join(' · ') + ') implican ' + m.implied.map(p => pct(p, 2)).join(' + ') + ' = ' + pct(m.sum, 2) + '. Lo que pasa del 100 % es el margen de la casa: ' + pct(m.margin, 2) + '.</p></li>' +
      '<li><b>Se resuelve al final</b><p>Según el reglamento del sitio: en fútbol, fijate si el mercado cuenta el alargue y los penales. Ganás, perdés o, en algunos mercados, te devuelven lo apostado.</p></li></ol></section>';
    const lad = [1.25, 1.5, 2, 3, 5].map(d => convertOdd(d));
    const odds = '<section class="rl-sec" id="cuotas">' + sectionHead(h, 'Cuota y probabilidad', 'cuanto más alta la cuota, menos probable el resultado') +
      '<div class="rl-two"><div class="rl-card rl-osc rl-osc2" data-nosnippet><ul>' + lad.map(c => '<li style="--w:' + (100 * c.implied).toFixed(2) + '%"><b>' + dec(c.decimal) + '</b><span>' + ars(STAKE * c.decimal) + '</span><i aria-hidden="true"></i><em>' + pct(c.implied) + '</em></li>').join('') + '</ul>' +
      '<p class="rl-cap">Cuota decimal, cuánto cobrás con ' + ars(STAKE) + ' y la probabilidad implícita (1 / cuota).</p></div>' +
      '<div class="rl-box"><h3>Qué te dice y qué no</h3><p>La probabilidad implícita es la que la casa le pone al resultado, con su margen adentro. No es la probabilidad real y no dice quién va a ganar.</p>' +
      (h.built('/calculadora/cuotas') ? '<p><a href="' + h.href('/calculadora/cuotas') + '">Pasá cualquier cuota a probabilidad, fraccional o americana</a></p>' : '') + '</div></div></section>';
    const hs = settleHandicap(HC.line, HC.a - HC.b), hk = handicapLabel(hs), hr = handicapReturn(HC.line, HC.a - HC.b, HC.odd, STAKE);
    const P = parlay(COMBO);
    const hcCard = '<article id="handicap" class="rl-mk"><h3>Hándicap asiático</h3><p>Le suma o resta goles a un equipo antes de mirar el resultado. Con líneas de cuarto, la mitad del monto va a cada línea vecina.</p>' +
      '<p class="rl-mkx">' + h.esc(MATCH[0]) + ' ' + (HC.line < 0 ? '−' : '+') + dec(Math.abs(HC.line)) + ' a ' + dec(HC.odd) + ', termina ' + HC.a + '-' + HC.b + ': <b>' + h.esc(WORD[hk]) + '</b></p>' +
      '<p class="rl-mkr">De ' + ars(STAKE) + ' vuelven <b>' + ars(hr) + '</b>: ' + ars(STAKE * hs.win) + ' a ' + dec(HC.odd) + ' y ' + ars(STAKE * hs.push) + ' devueltos.</p>' +
      (h.built('/guia/handicap') ? '<p><a href="' + h.href('/guia/handicap') + '">Cada línea y cada resultado, en una tabla</a></p>' : '') + '</article>';
    const comboCard = '<article id="combinada" class="rl-mk"><h3>Combinada</h3><p>Varias selecciones en un solo boleto: las cuotas se multiplican y tienen que salir todas.</p>' +
      '<ol class="rl-mkl">' + P.steps.map((st, i) => '<li>' + h.esc(COMBO[i].label) + ' <b>' + dec(st.pickOdd) + '</b></li>').join('') + '</ol>' +
      '<p class="rl-mkf">Cuota total ' + P.steps.map(st => dec(st.pickOdd)).join(' × ') + ' = <b>' + dec(P.odd) + '</b> · acertar las ' + P.legs + ': 1 en ' + dec(P.oneIn, 1) + '</p>' +
      '<p class="rl-mkr">Con ' + ars(STAKE) + ' cobrás <b>' + ars(STAKE * P.odd) + '</b> si salen todas; la casa se queda ' + pct(P.edge) + ' en promedio, más que en cada apuesta sola.</p>' +
      (h.built('/calculadora/combinada') ? '<p><a href="' + h.href('/calculadora/combinada') + '">Calculá tu combinada</a></p>' : '') + '</article>';
    const markets = '<section class="rl-sec" id="mercados">' + sectionHead(h, 'Los mercados más comunes', 'cuotas de ejemplo; la barra es la probabilidad implícita') + '<div class="rl-mks">' +
      market(h, 'x12', '1X2: quién gana', 'Tres resultados: 1 gana el local, X empate, 2 gana el visitante.', 'Local') +
      market(h, 'ou', 'Más/menos goles', 'Si el partido termina con más o con menos goles que la línea. Con 2,5 no hay empate: 3 goles o más es «más».', 'Más de 2,5') +
      market(h, 'btts', 'Ambos marcan', 'Sí: los dos equipos hacen al menos un gol. No: al menos uno se queda en cero.', 'Sí') +
      hcCard + comboCard + '</div></section>';
    const c = cashOut(STAKE, M.x12.odds[0], LIVE, 0), lm = margin(LIVE);
    const live = '<section class="rl-sec">' + sectionHead(h, 'En vivo y cash out', 'el mismo boleto, en el minuto 60') + '<div class="rl-two">' +
      '<div class="rl-box" id="en-vivo"><h3>Apuestas en vivo</h3><p>Durante el partido las cuotas cambian con cada gol, tarjeta o minuto que pasa. Si ' + h.esc(MATCH[0]) + ' va ganando 1-0, el 1X2 en vivo podría ser ' + LIVE.join(' · ') + '.</p>' +
      bars(h, lm, M.x12.labels) + '<p class="rl-mkf">Suman ' + pct(lm.sum, 2) + ' · margen ' + pct(lm.margin, 2) + '. En vivo la casa también cobra, y las cuotas cambian en segundos.</p></div>' +
      '<div class="rl-box" id="cash-out"><h3>Cash out: cerrar antes del final</h3><p>Es una oferta del sitio para pagarte ahora una parte y cerrar tu apuesta. El monto lo decide el sitio. Con qué compararlo:</p>' +
      '<ol class="rl-cflow"><li><span>Tu boleto</span><b>' + ars(STAKE) + ' a ' + dec(s.odd) + ' → ' + ars(c.potential) + '</b></li><li><span>Probabilidad sin margen del local, en vivo</span><b>' + pct(c.fairProb) + '</b></li><li><span>Lo que vale tu boleto en promedio</span><b>' + ars(c.potential) + ' × ' + pct(c.fairProb) + ' = ' + ars(c.fair) + '</b></li></ol>' +
      '<p>Si te ofrecen menos de ' + ars(c.fair) + ', la diferencia es lo que cobra la casa por cerrar antes. Aceptar o no es tu decisión: ninguna de las dos opciones gana a la larga.</p></div></div></section>';
    const mg = '<section class="rl-sec" id="margen">' + sectionHead(h, 'El margen: lo que cobra la casa') + '<div class="rl-two">' +
      '<div class="rl-big"><b>' + ars(STAKE * m.payout) + '</b><span>vuelven en promedio de cada ' + ars(STAKE) + ' apostados en el 1X2 de ejemplo (margen ' + pct(m.margin, 2) + ')</span><small>devolución = 1 / ' + dec(m.sum, 4) + '</small></div>' +
      '<div class="rl-box"><h3>Por qué a la larga se pierde</h3><p>La casa paga un poco menos de lo que paga un resultado según su probabilidad. Una apuesta puede salir bien; muchas, en promedio, dejan el margen en la casa. En la combinada de ejemplo se queda ' + pct(P.edge) + '.</p>' +
      (h.built('/calculadora/margen') ? '<p><a href="' + h.href('/calculadora/margen') + '">Medí el margen de cualquier mercado</a></p>' : '') + '</div></div></section>';
    const rg = '<section class="rl-sec">' + sectionHead(h, 'Antes de apostar') + '<ol class="rl-steps rl-steps-c">' +
      '<li><b>Solo mayores de 18</b><p>La edad que piden las provincias en sus páginas oficiales.' + (h.built('/guia/menores') ? ' <a href="' + h.href('/guia/menores') + '">Qué dice cada una</a>.' : '') + '</p></li>' +
      '<li><b>Un sitio de la lista de tu provincia</b><p>La dirección exacta, letra por letra.' + (h.built('/verificador') ? ' <a href="' + h.href('/verificador') + '">Pegala en el verificador</a>.' : '') + '</p></li>' +
      '<li><b>Un tope que podés perder</b><p>Decidilo antes y no lo subas para recuperar. Si no podés parar, pedí la autoexclusión.' + (h.built('/juego-responsable/autoexclusion') ? ' <a href="' + h.href('/juego-responsable/autoexclusion') + '">Cómo se pide</a>.' : '') + '</p></li></ol></section>';
    return hero + steps + odds + markets + live + mg + legal(h) + rg +
      '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/calculadora/cuotas', 'Calculadora de cuotas'], ['/calculadora/margen', 'Calculadora de margen'], ['/calculadora/combinada', 'Calculadora de combinadas'], ['/guia/handicap', 'Hándicap asiático, línea por línea'], ['/guia/glosario', 'Glosario de apuestas'], ['/guia/como-verificar', 'Cómo verificar un sitio']]) + '</section>';
  },
};

function terms(h) {
  const r = id => h.reg(id).regulator;
  const regs = h.regs.map(x => ({ t: x.regulator.short, d: (x.regulator.name === x.regulator.short ? 'El' : x.regulator.name + ': el') + ' regulador de ' + h.rg.prov(x.id).name + '. Publica la lista de sitios autorizados ahí (' + x.licensees.length + ' direcciones en nuestra copia).', u: '/provincia/' + x.id, l: 'Lista de ' + h.rg.prov(x.id).name }));
  const m = margin(M.x12.odds);
  return [
    { g: 'Cuotas y mercados', items: [
      { t: 'Cuota', d: 'Lo que paga una apuesta por cada peso, con lo apostado incluido (cuota decimal). ' + ars(STAKE) + ' a ' + dec(2.1) + ' cobran ' + ars(single(STAKE, 2.1).pays) + '.', u: '/calculadora/cuotas', l: 'Calculadora de cuotas' },
      { t: 'Cuota fraccional y americana', d: 'La misma cuota escrita de otra forma: 3/2 o +150 equivalen a ' + dec(convertOdd('3/2', 'fractional').decimal) + ' decimal.', u: '/calculadora/cuotas', l: 'Conversor' },
      { t: 'Probabilidad implícita', d: '1 / cuota: la probabilidad que la casa le pone al resultado, con su margen adentro.', u: '/guia/apuestas-deportivas#cuotas', l: 'Cuota y probabilidad' },
      { t: 'Margen', d: 'Lo que las probabilidades implícitas de un mercado pasan del 100 %. En el 1X2 ' + M.x12.odds.join(' · ') + ': ' + pct(m.margin, 2) + '.', u: '/calculadora/margen', l: 'Calculadora de margen' },
      { t: 'Devolución teórica', d: '1 / suma de probabilidades: cuánto vuelve en promedio de lo apostado en un mercado.', u: '/calculadora/margen', l: 'Calculadora de margen' },
      { t: 'Cuota justa', d: 'La cuota sin el margen de la casa: cuota × suma de probabilidades del mercado.', u: '/calculadora/margen', l: 'Calculadora de margen' },
      { t: '1X2', d: 'Mercado de tres resultados: 1 gana el local, X empate, 2 gana el visitante.', u: '/guia/apuestas-deportivas#1x2', l: 'Los mercados' },
      { t: 'Más/menos', d: 'Si hay más o menos goles que la línea (por ejemplo 2,5).', u: '/guia/apuestas-deportivas#mas-menos', l: 'Los mercados' },
      { t: 'Ambos marcan', d: 'Sí, si los dos equipos hacen al menos un gol; no, si alguno no marca.', u: '/guia/apuestas-deportivas#ambos-marcan', l: 'Los mercados' },
      { t: 'Hándicap asiático', d: 'Goles de ventaja o desventaja sumados a un equipo; si queda empate con la línea, se devuelve lo apostado.', u: '/guia/handicap', l: 'Guía del hándicap' },
      { t: 'Hándicap europeo', d: 'Hándicap de tres resultados, como un 1X2 con goles sumados: el empate con la línea es una opción más y no hay devolución.', u: '/guia/handicap', l: 'Guía del hándicap' },
      { t: 'Línea de cuarto', d: '−0,25, −0,75 y parecidas: la mitad del monto va a cada línea vecina, por eso se puede ganar o perder la mitad.', u: '/guia/handicap', l: 'Tabla de líneas' },
      { t: 'Simple', d: 'Una apuesta a un solo resultado.', u: '/guia/apuestas-deportivas', l: 'Paso a paso' },
      { t: 'Combinada', d: 'Varias selecciones en un boleto: las cuotas se multiplican y tienen que salir todas; el margen también se multiplica.', u: '/calculadora/combinada', l: 'Calculadora de combinadas' },
      { t: 'En vivo', d: 'Apuesta hecha durante el partido, con cuotas que cambian a cada minuto.', u: '/guia/apuestas-deportivas#en-vivo', l: 'En vivo' },
      { t: 'Cash out', d: 'Oferta del sitio para cerrar tu apuesta antes del final por un monto que decide el sitio.', u: '/guia/apuestas-deportivas#cash-out', l: 'Cómo compararlo' },
    ] },
    { g: 'Licencias y control', items: [
      { t: 'Licencia provincial', d: 'Autorización de una provincia para que un sitio ofrezca juego online ahí. Vale en esa provincia.', u: '/licencias', l: 'Todas las licencias' },
      { t: 'Lista oficial', d: 'La página donde un regulador nombra los sitios que autorizó. Es la prueba de la licencia.', u: '/provincias', l: 'Qué publica cada provincia' },
      { t: '.bet.ar', d: 'Terminación de dirección que usan casi todos los sitios con licencia; ayuda, pero no prueba nada sola.', u: '/guia/bet-ar', l: 'Qué garantiza' },
      ...regs,
      { t: 'Sitio sin licencia', d: 'Un sitio que no figura en la lista oficial de tu provincia.', u: '/guia/sitios-ilegales', l: 'Riesgos y denuncias' },
      { t: 'Media sanción', d: 'Un proyecto aprobado por una de las dos cámaras del Congreso; todavía no es ley.', u: '/guia/ley-federal', l: 'Ley federal' },
    ] },
    { g: 'Ayuda', items: [
      { t: 'Autoexclusión', d: 'Pedido para que no te dejen jugar durante un plazo, en los sitios o salas de tu provincia.', u: '/juego-responsable/autoexclusion', l: 'Cómo se pide' },
      { t: 'Línea de ayuda', d: 'Teléfono de tu provincia para hablar del juego con alguien que sabe del tema.', u: '/juego-responsable', l: 'Líneas de cada provincia' },
      { t: 'Mayoría de edad', d: '18 años en las páginas oficiales que guardamos.', u: '/guia/menores', l: 'Menores y apuestas' },
    ] },
  ];
}

const slug = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const glosario = {
  path: '/guia/glosario',
  id: 'guia-glosario',
  kind: 'guide',
  title: 'Glosario de apuestas: cuota, margen, hándicap y licencias',
  description: 'Glosario de apuestas deportivas y licencias en Argentina: cuota, margen, hándicap asiático y europeo, combinada, cash out, .bet.ar, IPLyC, LOTBA y más.',
  h1: 'Glosario de apuestas y licencias, en una línea cada término',
  ld: h => [h.webPage(), h.crumbs([['/', 'Inicio'], ['/guia/glosario', 'Glosario']]),
    { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Glosario de apuestas y licencias', url: 'https://' + h.site.domain + '/guia/glosario', inLanguage: h.site.htmlLang,
      hasDefinedTerm: terms(h).flatMap(g => g.items).map(x => ({ '@type': 'DefinedTerm', name: x.t, description: x.d, url: 'https://' + h.site.domain + '/guia/glosario#' + slug(x.t) })) }],
  render(h) {
    const G = terms(h);
    const all = G.flatMap(g => g.items);
    const ids = all.map(x => slug(x.t));
    if (new Set(ids).size !== ids.length) throw new Error('/guia/glosario: two terms with the same anchor');
    const jump = '<nav class="rl-gjump" aria-label="Términos">' + G.map(g => '<a href="#' + slug(g.g) + '">' + h.esc(g.g) + ' <small>' + g.items.length + '</small></a>').join('') + '</nav>';
    const hero = '<section class="rl-hero rl-hero-pv"><div><p class="rl-kick">Guía · ' + all.length + ' términos</p><h1>' + h.esc(h.page.h1) + '</h1>' +
      '<p class="rl-lead">Las palabras que aparecen en los sitios de apuestas y en las páginas de los reguladores, explicadas en una línea. Cada una lleva a la página donde está la cuenta o la fuente.</p>' + jump + '</div></section>';
    const body = G.map(g => '<section class="rl-sec" id="' + slug(g.g) + '">' + sectionHead(h, g.g) + '<dl class="rl-gl">' + g.items.map(x => {
      const base = x.u.split('#')[0];
      const link = h.built(base) ? '<a href="' + h.href(x.u) + '">' + h.esc(x.l) + '</a>' : '';
      return '<div id="' + slug(x.t) + '"><dt>' + h.esc(x.t) + '</dt><dd>' + h.esc(x.d) + (link ? ' ' + link : '') + '</dd></div>';
    }).join('') + '</dl></section>').join('');
    return hero + body + '<section class="rl-sec">' + sectionHead(h, 'Para seguir') + go(h, [['/guia/apuestas-deportivas', 'Cómo funcionan las apuestas deportivas'], ['/guia/como-verificar', 'Cómo verificar un sitio'], ['/juego-responsable', 'Ayuda en tu provincia']]) + '</section>';
  },
};
