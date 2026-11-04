// /esports/series - from the chance of winning one map to the chance of winning a Bo1, Bo3, Bo5 or Bo7 (engine/games/series.mjs,
// exact), every final score, a score in the middle, the inverse and the curves; formats of the CS2 Major quoted from Valve.
// /esports - hub of the esports pages. No odds and no betting words: probability only.
import { series, closedForm, mapChanceFor, FORMATS } from '../../../engine/games/series.mjs';
import { expected } from '../../../engine/games/vrs.mjs';
import { curvesSvg, scoreTable, invTable } from '../../../engine/games/seriesviz.mjs';
import { vrs } from '../content/vrs.mjs';
import { fmt, fmtPct, fmtInput, quote, hero, ldPage, sec, srcLine } from './parts.mjs';
import { agendaBlock } from './feeds.mjs';

const EX = { n: 3, p: 0.6 };
const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const pctIn = (id, v, extra = '') => '<input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" value="' + fmtInput(v * 100, 1) + '"' + extra + '>';
const app = h => ({ '@context': 'https://schema.org', '@type': 'WebApplication', name: h.page.h1, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es-AR', isAccessibleForFree: true, url: 'https://' + h.site.domain + h.page.path });

function legend() {
  return '<ul class="pa-lgd">' + FORMATS.map((n, i) => '<li><i class="pa-l' + i + '"></i>Bo' + n + '</li>').join('') + '</ul>';
}
function example(h) {
  const V = vrs(h), rows = V.am.rows.filter(r => !r.masked);
  const a = rows[0], b = rows[4];
  const x = expected(a.points, b.points), pm = mapChanceFor(3, x);
  return { a, b, x, pm, bo1: closedForm(1, pm), bo5: closedForm(5, pm), date: V.date };
}

export const esportsSeries = {
  path: '/esports/series',
  kind: 'tool',
  title: 'Bo1, Bo3, Bo5: probabilidad de ganar una serie',
  description: 'De la chance de ganar un mapa a la de ganar la serie: Bo1, Bo3, Bo5 y Bo7 con cada resultado posible, el marcador en vivo y la cuenta al revés. Sin cuotas.',
  h1: 'Probabilidad de ganar una serie Bo1, Bo3 o Bo5',
  scripts: ['series.js'],
  ld: h => ldPage(h, [app(h)]),
  render(h) {
    const r = series(EX.n, EX.p);
    const seg = '<div class="pa-seg" role="group" aria-label="Formato de la serie">' + FORMATS.map(n => '<button type="button" data-bo="' + n + '" aria-pressed="' + (n === EX.n) + '">Bo' + n + '</button>').join('') + '</div>';
    const opts = w => Array.from({ length: w }, (_, i) => '<option value="' + i + '">' + i + '</option>').join('');
    const form = '<form class="pa-c pa-fm" id="pa-sf" autocomplete="off"><h2>Tu serie</h2>' + seg +
      field('sr-p', 'Chance del equipo A de ganar un mapa (%)', pctIn('sr-p', EX.p), 'Si no sabés, probá con 50 % (parejos) y subí de a poco.') +
      '<label class="pa-ck"><input type="checkbox" id="sr-each"><span>Una chance distinta para cada mapa (por ejemplo, el mapa que eligió cada uno)</span></label>' +
      '<div class="pa-row pa-mp" id="sr-maps" hidden>' + Array.from({ length: FORMATS.at(-1) }, (_, i) => field('sr-m' + (i + 1), 'Mapa ' + (i + 1) + ' (%)', pctIn('sr-m' + (i + 1), EX.p))).join('') + '</div>' +
      '<div class="pa-row">' + field('sr-a', 'Mapas que ya ganó A', '<select id="sr-a">' + opts(r.w) + '</select>') + field('sr-b', 'Mapas que ya ganó B', '<select id="sr-b">' + opts(r.w) + '</select>') + '</div>' +
      '<p class="pa-x"><b>ejemplo</b> · Bo3 con 60 % por mapa: cambiá cualquier valor y se recalcula</p></form>';
    const out = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Chance de que A gane la serie</p><p class="pa-big" data-o="pa">' + fmtPct(r.pA, 1) + '</p>' +
      '<div class="pa-bar" style="--v:' + Math.round(r.pA * 100) + '" data-o="bar"><i></i><span>B: ' + fmtPct(r.pB, 1) + '</span></div>' +
      '<p class="pa-say" data-o="say">Con ' + fmtPct(EX.p, 0) + ' por mapa, un Bo3 le da al equipo A ' + fmtPct(r.pA, 1) + ': el formato largo agranda la ventaja del que es mejor mapa a mapa.</p>' +
      '<div class="pa-tw" data-o="tbl">' + scoreTable(r) + '</div>' +
      '<p class="pa-src" data-o="len">Mapas que se juegan en promedio: ' + fmt(r.expectedMaps, 2) + ' de ' + EX.n + '. Chance de que haya mapa ' + EX.n + ': ' + fmtPct(r.played[EX.n - 1], 1) + '.</p>' +
      '<div class="pa-share"><button type="button" data-pa-share>Copiar link con estos valores</button><output data-o="copied"></output></div></div>';
    const curves = sec('Cuánto agranda la ventaja cada formato', '<div class="pa-two"><div class="pa-c"><div data-o="curve">' + curvesSvg(FORMATS, EX.p) + '</div>' + legend() + '<p class="pa-src">Eje horizontal: chance de ganar un mapa (%). Vertical: chance de ganar la serie (%). La línea marca tu valor.</p></div>' +
      '<div><div class="pa-tw"><table class="pa-tb"><thead><tr><th>Por mapa</th>' + FORMATS.map(n => '<th class="pa-n">Bo' + n + '</th>').join('') + '</tr></thead><tbody>' +
      [0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9].map(p => '<tr><td>' + fmtPct(p, 0) + '</td>' + FORMATS.map(n => '<td class="pa-n">' + fmtPct(closedForm(n, p), 1) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<p class="pa-src">Con 50 % por mapa la serie es 50 % en cualquier formato. Cuanto más largo el formato, más cerca de 0 o de 100 queda la serie: un Bo1 deja más lugar a la sorpresa.</p></div></div>');
    const inv = sec('La cuenta al revés', '<div class="pa-two"><div class="pa-c pa-fm"><h3>¿Cuánto hay que ganar por mapa?</h3>' + field('sr-t', 'Chance de ganar la serie que querés (%)', pctIn('sr-t', 0.75)) +
      '<div class="pa-tw" data-o="inv">' + invTable(0.75) + '</div></div><div><p>Sirve para leer una chance de serie que viste en algún lado: si un modelo dice que un equipo gana un Bo3 con 75 %, eso equivale a ganar cada mapa con ' + fmtPct(mapChanceFor(3, 0.75), 1) + '. Con ese mismo nivel, en un Bo1 tendría ' + fmtPct(mapChanceFor(3, 0.75), 1) + ' y en un Bo5, ' + fmtPct(closedForm(5, mapChanceFor(3, 0.75)), 1) + '.</p>' +
      '<p class="pa-src">La calculadora busca ese número por bisección hasta 15 decimales; la chance de la serie siempre sube con la del mapa, así que hay un único valor.</p></div></div>');
    const math = sec('La cuenta, paso a paso', '<div class="pa-two"><div class="pa-c"><h3>Bo3 con la misma chance en cada mapa</h3><p>Si A gana cada mapa con chance <i>p</i>, gana 2-0 con <i>p</i>·<i>p</i> y 2-1 de dos maneras (pierde el primero o el segundo), cada una con <i>p</i>·<i>p</i>·(1 − <i>p</i>). Total: <i>p</i>² + 2·<i>p</i>²·(1 − <i>p</i>).</p><p>Con 60 %: ' + fmtPct(0.36, 0) + ' + ' + fmtPct(0.288, 1) + ' = ' + fmtPct(closedForm(3, 0.6), 1) + '.</p></div>' +
      '<div class="pa-c"><h3>Cualquier formato</h3><p>Para ganar un Bo<i>n</i> hacen falta <i>w</i> = (<i>n</i> + 1) / 2 mapas. A gana <i>w</i> a <i>k</i> cuando el último mapa es suyo y antes ganó <i>w</i> − 1 de <i>w</i> − 1 + <i>k</i>: hay C(<i>w</i> − 1 + <i>k</i>, <i>k</i>) órdenes posibles. La suma para <i>k</i> de 0 a <i>w</i> − 1 da la chance de la serie.</p><p class="pa-src">Con una chance distinta por mapa la página suma marcador por marcador (programación dinámica), sin aproximar; las dos cuentas dan lo mismo cuando todos los mapas son iguales y lo comprobamos en cada compilación.</p></div></div>');
    const E = example(h);
    const where = sec('Dónde se juega cada formato: el Major de CS2', '<div class="pa-two"><div>' + quote(h, 'major_bo3') + quote(h, 'major_bo1') + quote(h, 'major_po_bo3') + '</div><div><p>En la fase suiza del Major, los partidos donde un equipo se clasifica o queda afuera son Bo3 y el resto Bo1; los playoffs son todos Bo3. Cómo cambia eso la chance de pasar de fase está en <a href="' + h.href('/cs2/major') + '">el Major de CS2 explicado</a>.</p>' + srcLine(h, 'major-rules') + '</div></div>');
    const ar = sec('Con el ranking de Valve, en las Américas', '<div class="pa-two"><div class="pa-c"><h3>' + h.esc(E.a.team) + ' contra ' + h.esc(E.b.team) + '</h3><p>En el ranking de Valve de las Américas del ' + h.fmtDate(E.date) + ', ' + h.esc(E.a.team) + ' (1.º, ' + fmt(E.a.points, 0) + ' puntos) y ' + h.esc(E.b.team) + ' (5.º, ' + fmt(E.b.points, 0) + '). El modelo de Valve le da al primero ' + fmtPct(E.x, 1) + ' de ganar el partido.</p>' +
      '<p>Si ese partido fuera un Bo3, equivale a ganar cada mapa con ' + fmtPct(E.pm, 1) + ': en un Bo1 serían ' + fmtPct(E.bo1, 1) + ' y en un Bo5, ' + fmtPct(E.bo5, 1) + '.</p><p class="pa-src">El modelo de Valve no distingue formatos; suponer que el partido es un Bo3 es nuestra lectura.</p></div>' +
      '<div><p>Argentina cuenta como Sudamérica en el modelo de Valve, y Sudamérica juega en la región Américas: ahí compiten los equipos con mayoría de jugadores argentinos.</p>' + quote(h, 'vrs_ar') + quote(h, 'vrs_amer') + '<p>Todos los equipos y la calculadora entre dos de ellos, en el <a href="' + h.href('/cs2#ranking') + '">ranking de CS2</a>.</p></div></div>');
    const not = sec('Lo que esta cuenta no hace', '<ul class="pa-dot"><li>Supone mapas independientes: no sabe de rachas, de presión ni de quién eligió el mapa, salvo que cargues una chance distinta por mapa.</li><li>No es un pronóstico: sale de la chance que cargás vos. Si esa chance está mal, la de la serie también.</li><li>No tiene cuotas ni nada que ver con apuestas: es probabilidad para entender formatos.</li></ul>');
    return hero(h, { ey: 'Esports · series · Bo1 a Bo7', sub: 'Cargás la chance de ganar un mapa y ves la de ganar la serie, cada resultado posible y cómo cambia si ya van 1-0. Sirve para CS2, Valorant, LoL o cualquier juego que se defina por mapas.' }) +
      '<div class="pa-tool pa-oo">' + form + out + '</div>' + curves + inv + math + where + ar + not;
  },
};

const HUB = [
  ['/esports/agenda', 'Agenda de esports', 'Los partidos de hoy y de la semana en hora argentina, con los equipos argentinos primero.'],
  ['/cs2#ranking', 'Ranking de CS2 de Valve', 'Todos los equipos del mundo y de las Américas, con la chance entre dos según el modelo de Valve.'],
  ['/cs2/major', 'El Major de CS2, explicado', 'Tres fases suizas, playoffs, cuándo se juega Bo1 y cuándo Bo3, y tu chance de pasar una fase.'],
  ['/esports/series', 'Probabilidad de una serie', 'De la chance de un mapa a la de un Bo3 o Bo5, con cada resultado y el marcador en vivo.'],
  ['/esports/sistema-suizo', 'Simulador de fase suiza', 'Cargá 16 equipos y mirá quién hace 3-0, quién pasa y quién se va 0-3, con las reglas de cruces de Valve.'],
  ['/esports/argentinos', 'Argentinos en los esports', 'Los jugadores argentinos con equipo hoy, juego por juego, y sus próximos partidos.'],
  ['/esports/latam', 'Ligas de Latinoamérica', 'Qué torneos con equipos de la región se juegan esta semana.'],
  ['/lol/worlds', 'Worlds de LoL', 'El mundial de League of Legends en hora argentina, fase por fase.'],
  ['/valorant/champions', 'VCT de Valorant', 'Champions, Masters y la liga de Américas con los equipos argentinos marcados.'],
  ['/dota2#ranking', 'Ranking de Dota 2', 'Nuestro Elo con las series de seis meses, con Sudamérica y cara a cara.'],
  ['/kit/ping', 'Ping desde tu provincia', 'Cuánto tarda tu conexión hasta los servidores de Santiago, São Paulo y Miami.'],
  ['/esports/glosario', 'Glosario de esports', 'Bo3, VRS, eDPI, LAS, meta: cada palabra en una línea, con la herramienta que la explica.'],
];

export const esportsHub = {
  path: '/esports',
  kind: 'hub',
  scripts: ['agenda.js'],
  title: 'Esports desde Argentina: ranking de CS2 y series',
  description: 'Esports desde Argentina: el ranking de Valve de CS2 con las Américas, cómo funciona el Major y la probabilidad de un Bo3 o un Bo5, cada número con fuente.',
  h1: 'Esports desde Argentina',
  ld: h => ldPage(h),
  render(h) {
    const V = vrs(h);
    const top = V.am.rows.slice(0, 8);
    const cards = '<div class="pa-hub">' + HUB.filter(([u]) => h.built(u.split('#')[0])).map(([u, t, s]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + s + '</p></a>').join('') + '</div>';
    const tbl = '<div class="pa-tw"><table class="pa-tb"><thead><tr><th class="pa-n">Américas</th><th>Equipo</th><th class="pa-n">Puntos</th><th class="pa-n">Mundo</th></tr></thead><tbody>' +
      top.map(r => '<tr><td class="pa-n">' + r.rank + '</td><td>' + h.esc(V.label(r)) + '</td><td class="pa-n">' + fmt(r.points, 0) + '</td><td class="pa-n">' + r.global + '</td></tr>').join('') + '</tbody></table></div>';
    const vr = sec('Las Américas en el ranking de Valve', '<div class="pa-two"><div>' + tbl + srcLine(h, 'vrs-americas', 'tabla del ' + h.fmtDate(V.date)) + '</div><div><p>Valve ordena a los equipos de CS2 en tres regiones para invitarlos al Major: Europa, Américas y Asia. Argentina juega en las Américas, junto con el resto de Sudamérica y Norteamérica.</p>' + quote(h, 'major_regions') + '<p><a href="' + h.href('/cs2#ranking') + '">Ver los ' + fmt(V.am.rows.length, 0) + ' equipos de las Américas</a></p></div></div>');
    const missing = sec('Lo que todavía no está', '<ul class="pa-dot"><li>Free Fire competitivo: no hay una fuente de partidos que podamos usar con sus condiciones.</li><li>Tablas de ligas de Valorant y LoL: sus ligas no publican tablas abiertas que podamos copiar con fecha.</li></ul>');
    return hero(h, { ey: 'Esports · desde Argentina', girl: true, sub: 'Rankings oficiales con fecha, formatos de torneo explicados con el reglamento en la mano y la matemática de las series. Sin apuestas y sin humo.' }) +
      sec('Herramientas', cards) + (h.built('/esports/agenda') ? agendaBlock(h, '', 'Próximos partidos') : '') + vr + missing;
  },
};
