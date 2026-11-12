// /cs2 - Valve Regional Standings (global and Americas, the saved tables of 2026-11-02) with search, the Americas teams marked in
// the world list and a head-to-head with the expected chance of Valve's own model (engine/games/vrs.mjs, locked against a
// port of Valve's code). /cs2/major - the Major format quoted from Valve's rulebook and the exact Swiss stage calculator.
import { expected, gapFor } from '../../../engine/games/vrs.mjs';
import { mapChanceFor, swiss, swissCounts } from '../../../engine/games/series.mjs';
import { swissSvg, swissRecords } from '../../../engine/games/seriesviz.mjs';
import { vrs, rowsForClient } from '../content/vrs.mjs';
import { fmt, fmtPct, fmtInput, quote, hero, ldPage, sec, srcLine } from './parts.mjs';
import { agendaBlock } from './feeds.mjs';
import { cs2Req, cs2ReqData, cs2About, cs2Servers, cs16 } from './games2.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const SHOW = 30;

function rowHtml(h, r, region) {
  const name = r.masked ? '<span class="pa-x">Nombre oculto: lleva una marca de apuestas</span>' : '<b>' + h.esc(r.team) + '</b>';
  return '<tr' + (region === 'gl' && r.americas ? ' class="pa-am"' : '') + '><td class="pa-n">' + r.rank + '</td><td>' + name + (region === 'gl' && r.americas ? ' <span class="pa-tag pa-of">Américas</span>' : '') + '<small class="pa-ro">' + h.esc(r.roster.join(', ')) + '</small></td><td class="pa-n">' + fmt(r.points, 0) + '</td><td class="pa-n">' + (region === 'am' ? r.global : '') + '</td></tr>';
}
function table(h, rows, region) {
  return '<table class="pa-tb pa-vt"><thead><tr><th class="pa-n">#</th><th>Equipo y jugadores</th><th class="pa-n">Puntos</th><th class="pa-n">' + (region === 'am' ? 'Mundo' : '') + '</th></tr></thead><tbody>' + rows.slice(0, SHOW).map(r => rowHtml(h, r, region)).join('') + '</tbody></table>';
}
function h2h(V) {
  const rows = V.am.rows.filter(r => !r.masked);
  const a = rows[0], b = rows[4];
  const x = expected(a.points, b.points), pm = mapChanceFor(3, x);
  return { a, b, x, pm };
}
const optLabel = r => r.team + ' · ' + r.rank + '.º del mundo';

export const cs2Ranking = {
  path: '/cs2',
  kind: 'hub',
  title: 'Counter-Strike 2 (CS2) desde Argentina: requisitos y ranking',
  description: 'CS2 es gratis en Steam: si te corre según el mínimo de Valve, cuánto tarda la descarga, los servidores cerca de Argentina y el ranking oficial de equipos.',
  h1: 'Counter-Strike 2 desde Argentina',
  scripts: ['req.js', 'vrs.js', 'agenda.js'],
  data: h => {
    const V = vrs(h), gl = rowsForClient(V.gl.rows, true);
    if (gl.some((r, i) => r[0] !== i + 1) || V.am.rows.some((r, i) => r.rank !== i + 1)) throw new Error('vrs: ranks are not 1..n, the client rebuilds them from the order');
    return { gl: gl.map(r => r.slice(1)), am: V.am.rows.map(r => r.global), show: SHOW, ...cs2ReqData(h) };
  },
  ld: h => ldPage(h),
  render(h) {
    const V = vrs(h), E = h2h(V);
    const amG = V.gl.rows.slice(0, 40);
    const chart = '<div class="pa-c"><h3>Los 40 primeros del mundo</h3><p class="pa-x">puntos de cada equipo · en rosa, los de las Américas</p><div class="pa-chart pa-vc">' +
      amG.map(r => '<i' + (r.americas ? ' class="pa-m"' : '') + ' style="height:' + Math.round(((r.points - 1000) / (V.gl.rows[0].points - 1000)) * 100) + '%" title="' + h.esc(V.label(r)) + ' ' + fmt(r.points, 0) + '"></i>').join('') + '</div>' +
      '<div class="pa-axis"><span>1.º · ' + fmt(V.gl.rows[0].points, 0) + '</span><span>40.º · ' + fmt(amG.at(-1).points, 0) + '</span></div><p class="pa-src">La barra arranca en 1.000 puntos para que se vean las diferencias. De los 40 primeros, ' + fmt(amG.filter(r => r.americas).length, 0) + ' son de las Américas.</p></div>';
    const seg = '<div class="pa-seg" role="group" aria-label="Región"><button type="button" data-rg="am" aria-pressed="true">Américas · ' + fmt(V.am.rows.length, 0) + '</button><button type="button" data-rg="gl" aria-pressed="false">Mundo · ' + fmt(V.gl.rows.length, 0) + '</button></div>';
    const list = '<div class="pa-c pa-fm" id="pa-vr"><h2>La tabla</h2>' + seg +
      field('vr-q', 'Buscá un equipo o un jugador', '<input id="vr-q" type="search" autocomplete="off" placeholder="por ejemplo 9z o luchov">') +
      '<div class="pa-tw" data-o="vt">' + table(h, V.am.rows, 'am') + '</div><div class="pa-share"><button type="button" data-o="more">Ver los ' + fmt(V.am.rows.length, 0) + '</button><output data-o="vn">' + fmt(Math.min(SHOW, V.am.rows.length), 0) + ' de ' + fmt(V.am.rows.length, 0) + '</output></div>' +
      srcLine(h, 'vrs-americas', 'tabla del ' + h.fmtDate(V.date)) + srcLine(h, 'vrs-global', 'tabla del ' + h.fmtDate(V.date)) + '</div>';
    const opts = sel => V.gl.rows.filter(r => !r.masked).map(r => '<option value="' + r.rank + '"' + (r.rank === sel ? ' selected' : '') + '>' + h.esc(optLabel(r)) + '</option>').join('');
    const duel = '<div class="pa-c pa-fm" id="pa-vd"><h2>Cara a cara</h2><div class="pa-row">' + field('vd-a', 'Equipo A', '<select id="vd-a">' + opts(E.a.global) + '</select>') + field('vd-b', 'Equipo B', '<select id="vd-b">' + opts(E.b.global) + '</select>') + '</div>' +
      '<div class="pa-out" aria-live="polite"><p class="pa-x">Chance de que A gane el partido, según el modelo de Valve</p><p class="pa-big" data-o="dx">' + fmtPct(E.x, 1) + '</p>' +
      '<div class="pa-bar" style="--v:' + Math.round(E.x * 100) + '" data-o="dbar"><i></i><span>B: ' + fmtPct(1 - E.x, 1) + '</span></div>' +
      '<p class="pa-say" data-o="dsay">' + h.esc(E.a.team) + ' le saca ' + fmt(E.a.points - E.b.points, 0) + ' puntos a ' + h.esc(E.b.team) + '. Si el partido fuera un Bo3, equivale a ganar cada mapa con ' + fmtPct(E.pm, 1) + '.</p>' +
      '<p class="pa-more"><a data-o="dlink" href="' + h.href('/esports/series') + '?bo=3&amp;p=' + fmtInput(E.pm * 100, 1) + '">Ver esa serie mapa por mapa</a></p></div>' +
      '<p class="pa-x"><b>ejemplo</b> · 1.º contra 5.º de las Américas</p></div>';
    const model = sec('Cómo arma Valve el ranking y la chance', '<div class="pa-two"><div><p>Valve usa este ranking para invitar equipos a sus torneos, así que lo arma para predecir quién gana el próximo partido. La diferencia de puntos entre dos equipos se traduce en una chance esperada de ganar, con la misma fórmula que publica en su código.</p>' +
      quote(h, 'vrs_goal') + quote(h, 'vrs_ewr') + '<p>Con la fórmula de Valve, ' + fmt(Math.round(gapFor(0.6)), 0) + ' puntos de diferencia dan 60 %; ' + fmt(Math.round(gapFor(0.75)), 0) + ', 75 %; y ' + fmt(Math.round(gapFor(0.9)), 0) + ', 90 %.</p></div>' +
      '<div><div class="pa-c"><h3>La fórmula, tal cual está en el código de Valve</h3>' + quote(h, 'vrs_400') + quote(h, 'vrs_ev') + quote(h, 'vrs_fixed_rd') + '<p class="pa-src">Con RD fijo en ' + fmt(h.pa.fact('vrs_fixed_rd'), 0) + ', el factor g vale ' + fmt(1 / Math.sqrt(1 + (3 * (Math.log(10) / 400) ** 2 * 75 ** 2) / Math.PI ** 2), 4) + '. La página usa la misma cuenta y la compara con una copia de la función de Valve en cada compilación.</p></div></div></div>' +
      '<div class="pa-two" style="margin-top:14px"><div class="pa-c"><h3>Qué tan bien acierta</h3>' + quote(h, 'vrs_rho') + quote(h, 'vrs_slope') + '<p class="pa-src">O sea: ordena bien a los equipos, pero tiende a exagerar al favorito cuando la diferencia es grande. Tomá las chances altas con pinzas.</p></div>' +
      '<div class="pa-c"><h3>Por qué no ves algunos nombres</h3><p>Algunos equipos llevan en el nombre la marca de una casa de apuestas. En pingalto no mostramos marcas de apuestas: dejamos su puesto, sus puntos y sus jugadores, y tapamos el nombre.</p></div></div>');
    const ar = sec('Argentina en el ranking', '<div class="pa-two"><div><p>Valve asigna cada plantel a una región según de dónde son la mayoría de sus jugadores. En su código, Argentina está en Sudamérica, y Sudamérica cuenta como Américas, junto con Norteamérica.</p>' + quote(h, 'major_assign') + quote(h, 'vrs_ar') + quote(h, 'vrs_amer') + '</div>' +
      '<div><p>Valve no publica la nacionalidad de cada jugador en estas tablas, así que no marcamos equipos como argentinos. Buscá el tuyo por nombre o por un jugador en la tabla de arriba.</p><p>Valve tiene un punto de su red en Buenos Aires: tu ping hasta ahí, y hasta Santiago o São Paulo, en el <a href="' + h.href('/kit/ping') + '">test de ping</a>. Cómo usa Valve estas tablas para invitar al Major, en <a href="' + h.href('/cs2/major') + '">el Major de CS2 explicado</a>.</p></div></div>');
    const when = sec('Cada cuánto cambia', '<p>Valve sube una tabla nueva a su repositorio cada tanto. La que ves es la del ' + h.fmtDate(V.date) + ', copiada el ' + h.fmtDate(h.pa.doc('vrs-americas').fetched) + '. Por ahora la actualizamos a mano: si ves una más nueva en el repositorio de Valve, esta ya quedó vieja.</p>');
    const B = cs2About(h);
    const tools = sec('Herramientas para CS2', '<div class="pa-hub">' + [['/cs2/mira', 'Mira con código', 'Armá tu mira, copiá el código del juego o pegá uno para verlo.'], ['/kit/sensibilidad', 'Sensibilidad desde otro juego', 'Pasá la de Valorant u Overwatch 2 con el mismo giro.'], ['/kit/dpi', 'DPI real del mouse', 'Medilo con la tarjeta SUBE.'], ['/kit/ping', 'Test de ping', 'Tu ping desde tu provincia a los puntos de Valve.'], ['/cs2/major', 'El Major explicado', 'Fases, Bo1 y Bo3, y la chance de pasar la suiza.'], ['/esports/series', 'Bo1, Bo3, Bo5', 'De la chance por mapa a la chance de la serie.']].filter(([u]) => h.built(u)).map(([u, t, x]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + x + '</p></a>').join('') + '</div>');
    const rank = '<section class="pa-sec" id="ranking"><h2>Ranking de equipos de Valve</h2><p>El ranking oficial con el que Valve invita a sus torneos: los ' + fmt(V.gl.rows.length, 0) + ' equipos del mundo, las Américas aparte y la chance entre dos equipos con la fórmula de su propio modelo. Tabla del ' + h.fmtDate(V.date) + '.</p></section>';
    return hero(h, { ey: 'CS2 · gratis en Steam · desde Argentina', girl: true, sub: 'Si tu compu lo corre según Valve, cuánto tarda la descarga, los servidores más cerca y el ranking oficial de equipos, con las fuentes a la vista.', buttons: '<a class="pa-b1" href="#pa-rq">¿Me corre?</a><a href="#ranking">Ranking</a>' }) +
      B.facts + cs2Req(h) + B.steps + tools + cs2Servers(h) + rank + '<div class="pa-tool">' + duel + list + '</div>' + (h.built('/esports/agenda') ? agendaBlock(h, 'cs2', 'Próximos partidos de CS2') : '') + sec('El mundo y las Américas', chart) + model + ar + when + cs16(h);
  },
};

const EXP = 0.55;
function swissBlock(p) {
  const r = swiss(p), one = swiss(p, { decider: 1 });
  return { r, one };
}
export const cs2Major = {
  path: '/cs2/major',
  jump: true,
  kind: 'tool',
  title: 'Major de CS2: formato, fase suiza y chance de pasar',
  description: 'Cómo es el Major de CS2 según el reglamento de Valve: fases suizas, playoffs, cuándo se juega Bo1 o Bo3 y tu chance de pasar una fase, con cuenta exacta.',
  h1: 'Cómo funciona el Major de CS2',
  scripts: ['swiss.js'],
  ld: h => ldPage(h),
  render(h) {
    const F = k => h.pa.fact(k);
    const [b1a, b1b, b1c] = F('major_ban1');
    const pool1 = b1a + b1b + b1c + 1, pool3 = 1 + 1 + 2 + 1 + 1 + 1;
    if (pool1 !== pool3) throw new Error('major: Bo1 and Bo3 pick-ban give different pools');
    if (F('major_s1') + F('major_s2') + F('major_s3') !== F('major_32')) throw new Error('major: invitations do not add up to the teams');
    const C = swissCounts(F('major_stage16'));
    const adv = C.filter(c => c.w > c.l).reduce((t, c) => t + c.teams, 0);
    if (adv !== F('major_s2') || adv !== F('major_s3') || adv !== F('major_bracket')[0]) throw new Error('major: teams that advance do not match the invitations');
    const flow = '<ol class="pa-flow">' +
      [['Fase 1', F('major_s1') + ' invitados', 'Suiza · ' + F('major_stage16') + ' equipos'], ['Fase 2', F('major_s2') + ' invitados + ' + adv + ' que pasan', 'Suiza · ' + F('major_stage16') + ' equipos'], ['Fase 3', F('major_s3') + ' invitados + ' + adv + ' que pasan', 'Suiza · ' + F('major_stage16') + ' equipos'], ['Playoffs', adv + ' que pasan', 'Eliminación directa · Bo3']]
        .map(([t, a, b]) => '<li class="pa-c"><h3>' + t + '</h3><p>' + a + '</p><p class="pa-x">' + b + '</p></li>').join('') + '</ol>';
    const fmtSec = sec('Las fases, según el reglamento de Valve', flow + '<div class="pa-two" style="margin-top:14px"><div>' + quote(h, 'major_32') + quote(h, 'major_s1') + quote(h, 'major_s2') + quote(h, 'major_s3') + '</div><div>' + quote(h, 'major_stage16') + quote(h, 'major_bracket') + '<p class="pa-src">En una fase suiza de ' + F('major_stage16') + ' equipos, si cada ronda cruza equipos con el mismo récord, la mitad de cada grupo gana. Al final pasan siempre ' + adv + ' (' + C.filter(c => c.w > c.l).map(c => c.teams + ' con ' + c.w + '-' + c.l).join(', ') + ') y quedan afuera otros ' + (F('major_stage16') - adv) + '. Por eso las fases 2 y 3 se completan con ' + adv + ' invitados más.</p>' + srcLine(h, 'major-rules', 'versión del ' + h.fmtDate(h.pa.doc('major-rules').published)) + '</div></div>');
    const { r, one } = swissBlock(EXP);
    const tool = '<div class="pa-tool pa-oo"><form class="pa-c pa-fm" id="pa-sw" autocomplete="off"><h2>Tu chance en una fase suiza</h2>' +
      field('sw-p', 'Chance de tu equipo de ganar un mapa (%)', '<input id="sw-p" type="text" inputmode="decimal" autocomplete="off" value="' + fmtInput(EXP * 100, 1) + '">', 'Contra un rival promedio de la fase. 50 % es estar en la mitad de la tabla.') +
      '<p class="pa-x"><b>ejemplo</b> · 55 % por mapa</p><p class="pa-src">La cuenta es exacta: recorre todos los récords posibles. Supone la misma chance contra todos los rivales; en la realidad los cruces van por récord y por siembra.</p></form>' +
      '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Chance de pasar la fase (3 victorias)</p><p class="pa-big" data-o="adv">' + fmtPct(r.advance, 1) + '</p>' +
      '<p class="pa-say" data-o="say">Con la regla de Valve, ' + fmtPct(r.advance, 1) + '; si todos los partidos fueran Bo1, ' + fmtPct(one.advance, 1) + '. Los Bo3 en los partidos decisivos ayudan al que es mejor.</p>' +
      '<div class="pa-tw" data-o="rec">' + swissRecords(r, one) + '</div>' +
      '<p class="pa-src" data-o="len">Partidos que jugás en promedio: ' + fmt(r.matches, 2) + ', de ellos Bo3: ' + fmt(r.bo3, 2) + '. Un partido Bo1 lo ganás con ' + fmtPct(r.pBo1, 1) + ' y un Bo3 con ' + fmtPct(r.pBo3, 1) + '.</p></div></div>' +
      sec('El camino, récord por récord', '<div class="pa-c pa-swc"><div data-o="grid">' + swissSvg(r) + '</div><p class="pa-src">Cada casilla es un récord (victorias-derrotas) con la chance de llegar a jugarlo. Bo3 marca los partidos donde una victoria te clasifica o una derrota te elimina.</p></div>');
    const rules = sec('Bo1, Bo3 y quién juega con quién', '<div class="pa-two"><div>' + quote(h, 'major_identical') + quote(h, 'major_3w3l') + quote(h, 'major_bo3') + quote(h, 'major_bo1') + '</div><div>' + quote(h, 'major_r1') + '<p>En la primera ronda, el sembrado 1 juega con el 9, el 2 con el 10 y así hasta el 8 contra el 16. Después, los cruces van entre equipos con el mismo récord.' + (h.built('/esports/sistema-suizo') ? ' Con los 16 equipos y estas reglas de cruces, simulalo en el <a href="' + h.href('/esports/sistema-suizo') + '">simulador de fase suiza</a>.' : '') + '</p>' + quote(h, 'major_seed') + '</div></div>');
    const veto = sec('Cómo se eligen los mapas', '<div class="pa-two"><div class="pa-c"><h3>Bo1</h3><ol class="pa-steps"><li><span>El mejor sembrado elige ser equipo A o B.</span></li><li><span>A saca ' + b1a + ' mapas.</span></li><li><span>B saca ' + b1b + '.</span></li><li><span>A saca ' + b1c + ' más; se juega el que queda.</span></li><li><span>B elige de qué lado empieza.</span></li></ol>' + quote(h, 'major_ban1') + '</div>' +
      '<div class="pa-c"><h3>Bo3</h3><ol class="pa-steps"><li><span>A saca un mapa y B saca otro.</span></li><li><span>A elige el mapa 1 y B, de qué lado empieza.</span></li><li><span>B elige el mapa 2 y A, el lado.</span></li><li><span>B saca uno, A saca otro y el que queda es el mapa 3.</span></li></ol>' + quote(h, 'major_ban3') + '</div></div>' +
      '<p class="pa-note" style="margin-top:14px">Las dos cuentas dan un grupo de ' + pool1 + ' mapas: en el Bo1 se sacan ' + (b1a + b1b + b1c) + ' y se juega 1; en el Bo3 se sacan 4, se eligen 2 y queda 1. Valve no nombra los mapas en el reglamento: dice que se usa el grupo Active Duty del juego.</p>' + quote(h, 'major_active'));
    const ar = sec('Cómo llega un equipo argentino', '<div class="pa-two"><div><p>Las invitaciones salen del ranking de Valve por región. Argentina está en Sudamérica y Sudamérica cuenta como Américas, así que un equipo con mayoría de jugadores argentinos compite por los lugares de las Américas.</p>' + quote(h, 'major_regions') + quote(h, 'vrs_ar') + '</div><div><p>Mirá en qué puesto de las Américas está cada equipo en el <a href="' + h.href('/cs2#ranking') + '">ranking de CS2</a>, y la chance de un Bo3 o un Bo5 mapa por mapa en la <a href="' + h.href('/esports/series') + '">calculadora de series</a>.</p><p class="pa-src">Fechas y horarios del próximo Major en hora argentina: todavía no los mostramos, porque no tenemos una fuente oficial con fecha que podamos citar.</p></div></div>');
    return hero(h, { ey: 'CS2 · Major · reglamento de Valve', sub: fmt(h.pa.fact('major_32'), 0) + ' equipos, tres fases suizas y playoffs. Acá está cada regla con la cita de Valve, cuándo se juega Bo1 o Bo3 y una cuenta exacta de tu chance de pasar una fase.' }) +
      fmtSec + tool + rules + veto + ar;
  },
};
