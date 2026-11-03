// /kit/* - tools for every game: sensitivity converter, DPI meter, ping from Argentina. Every number on these pages is either
// computed by engine/games/* (build time and browser) or a quoted fact from data/sources/pingalto/sources.json.
import { cm360, convertSens, edpi, degPerCm } from '../../../engine/games/sens.mjs';
import { greatCircleKm, fibreRttMs } from '../../../engine/games/geo.mjs';
import { sensGames } from '../content/games.mjs';
import { fmt, fmtFixed, srcLine, quote, hero, ldPage, sec, kindTag } from './parts.mjs';

const opt = (list, sel) => list.map(g => '<option value="' + g.id + '"' + (g.id === sel ? ' selected' : '') + '>' + g.name + '</option>').join('');
const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const num = (id, name, value, attrs = '') => '<input id="' + id + '" name="' + name + '" type="number" inputmode="decimal" step="any" value="' + value + '"' + attrs + '>';

// Example shown before the visitor types (and without JavaScript): CS2 1.25 at 800 DPI -> Valorant.
const EX = { from: 'cs2', to: 'valorant', s: 1.25, dpi: 800, dpi2: 800 };

export const sensibilidad = {
  path: '/kit/sensibilidad',
  kind: 'tool',
  title: 'Convertidor de sensibilidad entre juegos y cm/360',
  description: 'Pasá tu sensibilidad de CS2 a Valorant, Overwatch 2 o Apex con el mismo giro de mano: cm/360, eDPI y la fuente de cada número.',
  h1: 'Convertidor de sensibilidad entre juegos',
  scripts: ['sens.js'],
  data: h => ({ games: sensGames(h).map(g => ({ id: g.id, name: g.name, short: g.short, yaw: g.yaw })) }),
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: h.page.h1, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es-AR', isAccessibleForFree: true, url: 'https://' + h.site.domain + h.page.path }]),
  render(h) {
    const G = sensGames(h), from = G.find(g => g.id === EX.from), to = G.find(g => g.id === EX.to);
    const out = convertSens({ sens: EX.s, dpi: EX.dpi, yaw: from.yaw, toDpi: EX.dpi2, toYaw: to.yaw });
    const cm = cm360({ dpi: EX.dpi, sens: EX.s, yaw: from.yaw });
    const form = '<form class="pa-c pa-fm" id="pa-sf" autocomplete="off">' +
      '<div class="pa-row">' + field('sf-from', 'Juego de origen', '<select id="sf-from" name="de">' + opt(G, EX.from) + '</select>') +
      field('sf-to', 'Juego de destino', '<select id="sf-to" name="a">' + opt(G, EX.to) + '</select>') + '</div>' +
      '<div class="pa-row">' + field('sf-s', 'Tu sensibilidad', num('sf-s', 's', EX.s, ' min="0.0001"')) + field('sf-d', 'Tu DPI', num('sf-d', 'dpi', EX.dpi, ' min="1"')) + '</div>' +
      field('sf-d2', 'DPI en el juego de destino', num('sf-d2', 'dpi2', EX.dpi2, ' min="1"'), 'Si usás el mismo mouse sin tocar nada, es el mismo DPI.') +
      '<p class="pa-x"><b>ejemplo</b> · cambiá cualquier valor y el resultado se actualiza solo</p></form>';
    const res = '<div class="pa-c pa-out" aria-live="polite">' +
      '<p class="pa-x">Sensibilidad en <b data-o="to">' + to.name + '</b></p>' +
      '<p class="pa-big" data-o="sens">' + fmt(out, 3) + '</p>' +
      '<p class="pa-say" data-o="say">Con esa sensibilidad, un giro completo de 360° te pide <b>' + fmt(cm, 1) + ' cm</b> de mouse en los dos juegos.</p>' +
      '<div class="pa-bar" style="--v:' + Math.min(100, cm).toFixed(1) + ';--tick:10%" role="img" aria-label="Distancia de mouse para un giro de 360°, en una regla de 100 cm" data-o="bar"><i></i><span data-o="cm">' + fmt(cm, 1) + ' cm / 360°</span></div>' +
      '<p class="pa-ch"><span data-o="e1">eDPI ' + from.short + ': ' + fmt(edpi({ dpi: EX.dpi, sens: EX.s }), 0) + '</span><span data-o="e2">eDPI ' + to.short + ': ' + fmt(edpi({ dpi: EX.dpi2, sens: out }), 0) + '</span><span data-o="deg">' + fmt(degPerCm({ dpi: EX.dpi, sens: EX.s, yaw: from.yaw }), 1) + '° por cm</span></p>' +
      '<div class="pa-share"><button type="button" data-pa-share>Copiar link con estos valores</button><output data-o="copied"></output></div>' +
      '<details class="pa-fx"><summary>Ver la fórmula</summary><code>destino = origen × DPI origen × yaw origen ÷ (DPI destino × yaw destino)\ncm/360 = 360 × 2,54 ÷ (DPI × sensibilidad × yaw)</code><p class="pa-src">2,54 cm es una pulgada exacta; el yaw es cuántos grados gira la vista por cada punto que manda el mouse con sensibilidad 1.</p></details></div>';
    const rows = G.map(g => '<tr><td>' + g.name + '</td><td class="pa-n">' + fmt(g.yaw, 4) + '°</td><td>' + kindTag(h, h.pa.doc(h.pa.src.facts[g.fact].doc).kind) + (g.extra ? ' ' + kindTag(h, h.pa.doc(h.pa.src.facts[g.extra].doc).kind) : '') + '</td></tr>').join('');
    const table = sec('El número de cada juego: el yaw', '<p>Cada juego convierte los puntos del mouse en grados con su propio factor. Por eso la misma sensibilidad no se siente igual en CS2 y en Valorant, y por eso el eDPI solo sirve para comparar dentro de un mismo juego.</p>' +
      '<div class="pa-tw" style="margin-top:14px"><table class="pa-tb"><thead><tr><th>Juego</th><th class="pa-n">Grados por punto (sens. 1)</th><th>Fuente</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="pa-two" style="margin-top:14px"><div>' + quote(h, 'yaw_source') + '<p class="pa-src">El código público del motor Source de Valve: el giro horizontal por defecto.</p></div><div>' + quote(h, 'yaw_cs2') + quote(h, 'yaw_valorant') + quote(h, 'yaw_ow2') + '</div></div>');
    const skip = sec('Lo que no convertimos, y por qué', '<div class="pa-three">' +
      '<div class="pa-c"><h3>Fortnite</h3><p>No encontramos el factor publicado por Epic Games, y las calculadoras de la comunidad no usan todas el mismo. Preferimos no darte un número que no podemos respaldar.</p></div>' +
      '<div class="pa-c"><h3>Free Fire y juegos de celular</h3><p>En el celular no hay DPI ni puntos de mouse: el giro depende del dedo, de la pantalla y del juego. Para eso armamos un <a href="' + h.href('/ff/sensibilidad') + '">calibrador paso a paso</a>.</p></div>' +
      '<div class="pa-c"><h3>Mira con zoom</h3><p>Este convertidor iguala el giro sin zoom. Cada juego escala distinto al apuntar con mira, así que esa parte la ajustás en el juego.</p></div></div>');
    const how = sec('Cómo comprobarlo en dos minutos', '<ol class="pa-steps"><li><span>Poné una marca en el pad (una cinta o una moneda) y apoyá el mouse ahí.</span></li><li><span>En el juego, mirá un punto fijo y deslizá el mouse hasta dar una vuelta completa.</span></li><li><span>Medí con una regla: tiene que dar los centímetros por vuelta que muestra el resultado. Si te da distinto, revisá que la aceleración del mouse esté apagada.</span></li></ol>');
    return hero(h, { ey: 'Kit · mouse · todos los juegos', sub: 'Elegí el juego de origen y el de destino: te damos la sensibilidad que gira lo mismo con el mismo movimiento de mano, y cuántos centímetros de pad te pide cada vuelta.' }) +
      '<div class="pa-tool">' + form + res + '</div>' + table + skip + how;
  },
};

export const dpi = {
  path: '/kit/dpi',
  kind: 'tool',
  title: 'DPI del mouse: medí el tuyo con la tarjeta SUBE',
  description: 'Medí el DPI real de tu mouse en el navegador usando la SUBE o una tarjeta bancaria como regla, compará con el de fábrica y calculá tu eDPI.',
  h1: 'Medí el DPI real de tu mouse con la SUBE',
  scripts: ['dpi.js'],
  data: h => ({ cardMm: h.pa.fact('id1_mm'), games: sensGames(h).map(g => ({ id: g.id, name: g.name })) }),
  ld: h => ldPage(h),
  render(h) {
    const W = h.pa.fact('id1_mm'), H = h.pa.fact('id1_h_mm');
    const G = sensGames(h);
    const tool = '<div class="pa-tool"><div class="pa-c pa-fm">' +
      '<div class="pa-card" aria-hidden="true">' + fmtFixed(W, 2) + ' mm</div>' +
      '<ol class="pa-steps"><li><span>Apoyá la SUBE (o una tarjeta bancaria) sobre el pad, a lo largo.</span></li><li><span>Poné el borde izquierdo del mouse alineado con el borde izquierdo de la tarjeta.</span></li><li><span>Apretá <b>Empezar</b>, deslizá el mouse en línea recta hasta el otro borde de la tarjeta y hacé clic.</span></li><li><span>Repetilo tres veces: usamos la mediana.</span></li></ol>' +
      '<div class="pa-row">' + field('dp-dist', 'Distancia que recorrés', '<select id="dp-dist" name="dist"><option value="card">Largo de la tarjeta: ' + fmtFixed(W, 2) + ' mm</option><option value="mm">Otra (la medís con regla)</option></select>') +
      field('dp-mm', 'Milímetros', num('dp-mm', 'mm', W, ' min="10" disabled')) + '</div>' +
      '<div class="pa-row">' + field('dp-decl', 'DPI de fábrica (opcional)', num('dp-decl', 'decl', '', ' min="1" placeholder="por ejemplo 800"')) +
      field('dp-game', 'Juego para el eDPI', '<select id="dp-game" name="game">' + opt(G, 'valorant') + '</select>') + '</div>' +
      field('dp-sens', 'Tu sensibilidad en ese juego', num('dp-sens', 'sens', '', ' min="0.0001" placeholder="por ejemplo 0.4"')) +
      '</div><div class="pa-c pa-out" aria-live="polite">' +
      '<p class="pa-x">DPI medido</p><p class="pa-big" data-o="dpi">-</p>' +
      '<p class="pa-say" data-o="say">Todavía no mediste. Necesitás una compu con mouse: en el celular no hay puntero que medir.</p>' +
      '<div class="pa-bt"><button type="button" class="pa-btn pa-b1" data-pa-start>Empezar</button><button type="button" class="pa-btn" data-pa-reset>Borrar mediciones</button></div>' +
      '<p class="pa-ch" data-o="runs"></p><p class="pa-ch"><span data-o="dev">Diferencia con fábrica: -</span><span data-o="edpi">eDPI: -</span></p>' +
      '<p class="pa-src" data-o="raw">Usamos la lectura directa del mouse cuando el navegador la permite (Chrome y Edge). Si no, la mide el sistema y puede sumar aceleración: apagá «Mejorar la precisión del puntero» en Windows.</p>' +
      '<details class="pa-fx"><summary>Ver la fórmula</summary><code>DPI = puntos contados ÷ (milímetros ÷ 25,4)</code><p class="pa-src">25,4 mm es una pulgada exacta. DPI quiere decir puntos por pulgada.</p></details></div></div>';
    const card = sec('Por qué la SUBE sirve de regla', '<div class="pa-two"><div><p>El formato internacional ID-1, el de la mayoría de las tarjetas bancarias y de identidad, mide ' + fmtFixed(W, 2) + ' × ' + fmtFixed(H, 2) + ' mm. La SUBE tiene ese mismo tamaño. Es una medida fija de fábrica, así que te sirve como regla aunque no tengas una a mano.</p>' +
      quote(h, 'id1_mm') + quote(h, 'id1_use') + '</div><div>' + quote(h, 'sube_mm', 'es') + '<p class="pa-src">Si querés estar seguro, medí tu tarjeta con una regla y elegí «Otra» con los milímetros que te den.</p></div></div>');
    const why = sec('Para qué te sirve', '<div class="pa-three"><div class="pa-c"><h3>Saber si tu mouse miente</h3><p>Muchos mouses no dan exacto el DPI de la caja. Si el tuyo se va lejos, tu sensibilidad copiada de otro jugador no va a sentirse igual.</p></div>' +
      '<div class="pa-c"><h3>Calcular tu eDPI real</h3><p>eDPI es DPI × sensibilidad. Con el DPI medido, tu eDPI es el que de verdad usás.</p></div>' +
      '<div class="pa-c"><h3>Pasar a otro juego</h3><p>Con el DPI real, el <a href="' + h.href('/kit/sensibilidad') + '">convertidor de sensibilidad</a> te da un giro idéntico entre juegos.</p></div></div>');
    return hero(h, { ey: 'Kit · mouse · sin instalar nada', sub: 'Deslizás el mouse a lo largo de la tarjeta y contamos los puntos que manda. El número de la tarjeta no se escribe en ningún lado: solo usamos su tamaño.' }) + tool + card + why;
  },
};

export const ping = {
  path: '/kit/ping',
  kind: 'tool',
  title: 'Test de ping desde Argentina a servidores de juegos',
  description: 'El ping mínimo que permite la física desde tu provincia hasta Santiago, São Paulo y Miami, más una medición real desde tu conexión.',
  h1: 'Ping desde tu provincia a Santiago, São Paulo y Miami',
  scripts: ['ping.js'],
  data: h => pingData(h),
  ld: h => ldPage(h),
  render(h) {
    const d = pingData(h);
    const caba = d.rows.find(r => r.id === 'Q1486');
    const max = Math.max(...d.rows.flatMap(r => r.ms));
    const gauge = (r, i) => '<div class="pa-gg"><i style="--v:' + Math.round((r.ms[i] / max) * 100) + '"><span data-g="' + i + '">' + fmt(r.ms[i], 0) + '</span></i><p><b>' + d.targets[i].name + '</b><small><span data-k="' + i + '">' + fmt(r.km[i], 0) + '</span> km · ms mínimos</small></p></div>';
    const pick = '<div class="pa-f"><label for="pg-prov">Tu provincia</label><select id="pg-prov">' + d.rows.map(r => '<option value="' + r.id + '"' + (r.id === caba.id ? ' selected' : '') + '>' + h.esc(r.prov) + ' · ' + h.esc(r.city) + '</option>').join('') + '</select></div>';
    const strip = '<section class="pa-pg" aria-labelledby="pg-h"><div><h2 id="pg-h">El piso físico</h2><p>Ida y vuelta por fibra en línea recta. Ninguna conexión real baja de esto.</p>' + pick + '</div>' + d.targets.map((t, i) => gauge(caba, i)).join('') + '</section>';
    const c = h.pa.fact('c_ms'), n = h.pa.fact('fiber_n'), R = h.pa.fact('earth_r_km');
    const km100 = fibreRttMs({ km: 100, c, n });
    const floor = sec('Cómo sale ese número', '<div class="pa-two"><div><p>La luz en la fibra óptica viaja más lenta que en el vacío: la velocidad es c ÷ n, donde n es el índice de refracción del vidrio. Con la distancia en línea recta (círculo máximo sobre la Tierra) y la ida y vuelta, cada 100 km suman ' + fmt(km100, 2) + ' ms como mínimo.</p>' +
      '<details class="pa-fx"><summary>Ver la fórmula</summary><code>ping mínimo (ms) = 2 × km × 1000 ÷ (c ÷ n) × 1000\nc = ' + fmt(c, 0) + ' m/s · n = ' + fmt(n, 4) + ' · radio de la Tierra = ' + fmt(R, 3) + ' km</code></details>' +
      '<p class="pa-src">Las coordenadas de cada capital y de las tres ciudades salen de Wikidata. Las rutas reales nunca son rectas y pasan por equipos que suman tiempo, así que tu ping real siempre es mayor.</p>' + srcLine(h, 'wd-capitals') + '</div><div>' + quote(h, 'c_ms') + quote(h, 'fiber_n') + quote(h, 'earth_r_km') + '</div></div>');
    const live = sec('Medí tu conexión ahora', '<div class="pa-tool" style="padding:0"><div class="pa-c"><p>Tu navegador hace varias peticiones HTTPS cortas a dos servidores públicos de Amazon Web Services y tomamos la mediana del tiempo de ida y vuelta. <b>No es el servidor de tu juego</b>: es una referencia de tu ruta hasta esa ciudad, con el tiempo que tarda el servidor en contestar incluido.</p>' +
      '<div class="pa-bt"><button type="button" class="pa-btn pa-b1" data-pa-run>Medir desde mi conexión</button></div><p class="pa-src">Al apretar, tu navegador se conecta a amazonaws.com (lo explicamos en <a href="' + h.href('/legal') + '">Legal</a>). Nada se guarda ni se manda a pingalto.</p></div>' +
      '<div class="pa-c pa-live" aria-live="polite">' + d.live.map((e, i) => '<div><b data-l="' + i + '">-</b><span>ms · ' + h.esc(e.label) + '</span><small data-lj="' + i + '">' + h.esc(e.host) + '</small></div>').join('') + '<p class="pa-src" data-o="cmp"></p></div></div>' +
      '<div class="pa-two" style="margin-top:14px"><div>' + quote(h, 'aws_sp') + '</div><div>' + quote(h, 'aws_va') + '</div></div>');
    const v = d.valve;
    const valve = sec('Lo que publica Valve: ping típico desde su punto de Buenos Aires', '<p>Valve entrega en su API de Steam la red de puntos que usa CS2 (configuración SDR de la app 730), con el ping típico medido entre ellos. Tiene un punto en ' + h.esc(v.home.desc) + '.</p>' +
      '<div class="pa-tw" style="margin-top:14px"><table class="pa-tb"><thead><tr><th>Desde ' + h.esc(v.home.desc) + ' hasta</th><th class="pa-n">Ping típico de Valve</th><th class="pa-n">Piso físico</th><th class="pa-n">Veces el piso</th></tr></thead><tbody>' +
      v.rows.map(r => '<tr><td>' + h.esc(r.desc) + '</td><td class="pa-n">' + fmt(r.ms, 0) + ' ms</td><td class="pa-n">' + fmt(r.floor, 1) + ' ms</td><td class="pa-n">' + fmt(r.ms / r.floor, 1) + '×</td></tr>').join('') +
      '</tbody></table></div>' + srcLine(h, 'valve-sdr', 'revisión ' + v.revision) + '<p class="pa-src">Los valores salen del archivo tal como lo publica Valve; el piso físico lo calculamos con las coordenadas que trae el mismo archivo.</p>');
    const where = sec('Dónde juega Argentina', '<div class="pa-three">' +
      '<div class="pa-c"><h3>Valorant: Santiago</h3>' + quote(h, 'val_scl', 'es') + quote(h, 'val_scl_ar', 'es') + '<p class="pa-src">Anuncio de Riot del ' + h.fmtDate(h.pa.doc('riot-latam').published) + ', cuando llegó Valorant a la región. Puede haber cambios posteriores que esa nota no cuenta.</p></div>' +
      '<div class="pa-c"><h3>LoL LAS: Santiago</h3>' + quote(h, 'lol_las_scl') + '</div>' +
      '<div class="pa-c"><h3>LoL LAN: Miami</h3>' + quote(h, 'lol_lan_mia', 'es') + '</div></div>');
    const table = sec('Las 24 jurisdicciones', '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Provincia · capital</th>' + d.targets.map(t => '<th class="pa-n">' + t.name + '</th>').join('') + '</tr></thead><tbody>' +
      d.rows.map(r => '<tr><td>' + h.esc(r.prov) + ' · ' + h.esc(r.city) + '</td>' + r.ms.map(x => '<td class="pa-n">' + fmt(x, 1) + ' ms</td>').join('') + '</tr>').join('') +
      '</tbody></table></div><p class="pa-src">Ping mínimo de ida y vuelta por fibra recta desde la capital de cada provincia (y la Ciudad de Buenos Aires).</p>');
    return hero(h, { ey: 'Kit · red · desde Argentina', sub: 'Dos cosas distintas, bien separadas: lo que <b>calculamos</b> con la física y lo que <b>medís</b> vos desde tu conexión.' }) + strip + floor + live + valve + where + table;
  },
};

function pingData(h) {
  const P = h.pa, c = P.fact('c_ms'), n = P.fact('fiber_n'), R = P.fact('earth_r_km');
  const targets = [['Q2887', 'Santiago'], ['Q174', 'São Paulo'], ['Q8652', 'Miami']].map(([q, name]) => ({ ...P.city(q), name }));
  const caba = P.city('Q1486');
  const places = [{ id: caba.id, prov: 'Ciudad de Buenos Aires', city: 'CABA', lat: caba.lat, lon: caba.lon }, ...P.capitals].sort((a, b) => a.prov.localeCompare(b.prov, 'es'));
  const rows = places.map(p => { const km = targets.map(t => greatCircleKm(p, t, R)); return { id: p.id, prov: p.prov, city: p.city, km, ms: km.map(k => fibreRttMs({ km: k, c, n })) }; });
  const home = P.pop('eze');
  const valve = { home, revision: P.sdrRevision, rows: ['scl', 'gru', 'lim', 'iad'].map(code => { const t = P.pop(code); return { desc: t.desc, ms: P.typical('eze', code), floor: fibreRttMs({ km: greatCircleKm(home, t, R), c, n }) }; }) };
  const sp = rows.map(r => ({ id: r.id, floor: r.ms[1] }));
  const live = [
    { host: P.fact('aws_sp'), label: 'Amazon · São Paulo (sa-east-1)', floorIdx: 1 },
    { host: P.fact('aws_va'), label: 'Amazon · Virginia, EE. UU. (us-east-1)', floorIdx: null },
  ];
  return { targets: targets.map(t => ({ name: t.name })), rows, valve, live, sp };
}
