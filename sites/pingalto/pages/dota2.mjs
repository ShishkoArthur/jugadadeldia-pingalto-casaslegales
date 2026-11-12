// /dota2 - the Dota 2 game page (audit 2026-11-04: intent «dota 2» is the game, like /cs2): what it is in Valve's own words
// (Steam listing for Argentina), a "does it run" check against Valve's minimum and the download time, how to start, the points of
// Valve's network for Dota 2 near Argentina (GetSDRConfig of app 570) next to the physical floor of /kit/ping, and our Elo ranking
// of teams from PandaScore series (feed dotaelo) as a section (#ranking), with the agenda and The International.
// No OpenDota: its robots.txt disallows AI agents (TRAPS 03.11), so there are no medals, heroes or win rates here.
import { steamApp } from '../content/stores.mjs';
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';
import { agendaBlock, FEED, css, wait, PS } from './feeds.mjs';
import { greatCircleKm, fibreRttMs } from '../../../engine/games/geo.mjs';
import { ELO } from '../../../engine/games/elo.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const opt = (list, sel) => list.map(([v, t]) => '<option value="' + v + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + t + '</option>').join('');
const cards = (h, list) => '<div class="pa-hub">' + list.filter(([u]) => h.built(u.split('#')[0])).map(([u, t, s]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + s + '</p></a>').join('') + '</div>';
const box = (mode, attrs = '') => '<div class="pa-fd" data-fd="' + mode + '" data-fd-src="' + FEED + '"' + attrs + '>' + wait + '</div>';
const DL_EX = 50;
const NEAR = ['scl', 'gru', 'lim'];

export function d2Facts(h) {
  const A = steamApp(h, 'steam-dota2', 570);
  if (!A.free) throw new Error('dota2: Steam no longer lists Dota 2 as free');
  const os = A.min['SO *'] || A.min.SO;
  const cores = /de (doble|cuatro) núcleo/.exec(A.min.Procesador || '');
  const ghz = /a ([\d,]+) GHz/.exec(A.min.Procesador || '');
  const dx = /Versión (\d+)/.exec(A.min.DirectX || '');
  if (!/^Windows 7 o posterior$/.test(os || '') || !cores || !ghz || !dx || !A.ramGb || !A.diskGb) throw new Error('dota2: Steam minimum requirements changed shape: ' + JSON.stringify(A.min));
  const D = h.pa.json('steam-dota2')['570'].data;
  const osOf = r => (r && /<strong>SO:<\/strong>\s*([^<]+)</.exec(r.minimum || '') || [])[1];
  const mac = osOf(D.mac_requirements), linux = osOf(D.linux_requirements);
  if (A.platforms.mac && !mac) throw new Error('dota2: Mac listed without its requirements');
  if (A.platforms.linux && !linux) throw new Error('dota2: Linux listed without its requirements');
  const es = A.langs.filter(l => /^Español/.test(l));
  return { A, os, cores: cores[1] === 'doble' ? 2 : 4, ghz: ghz[1], dx: +dx[1], mac: mac && mac.trim(), linux: linux && linux.trim(), es };
}
export function d2Data(h) {
  const F = d2Facts(h);
  return { req: { cores: F.cores, ram: F.A.ramGb, disk: F.A.diskGb, dx: F.dx } };
}
function d2Servers(h) {
  const sdr = h.pa.json('valve-sdr-570');
  const pop = c => { const p = sdr.pops[c]; if (!p || !p.geo) throw new Error('dota2: no Valve point ' + c + ' in the Dota 2 network'); return { code: c, desc: p.desc, lon: p.geo[0], lat: p.geo[1] }; };
  const typ = (a, b) => { const r = sdr.typical_pings.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (!r) throw new Error('dota2: no typical ping ' + a + '-' + b); return r[2]; };
  const c = h.pa.fact('c_ms'), n = h.pa.fact('fiber_n'), R = h.pa.fact('earth_r_km');
  const home = pop('eze');
  const rows = NEAR.map(code => { const t = pop(code); const floor = fibreRttMs({ km: greatCircleKm(home, t, R), c, n }); return { desc: t.desc, ms: typ('eze', code), floor }; });
  const south = Object.entries(sdr.pops).filter(([, p]) => p.geo && (p.relays || []).length && p.geo[1] < 0 && p.geo[0] < -30 && p.geo[0] > -90).map(([, p]) => p.desc).sort();
  return { home, rows, south, revision: sdr.revision };
}

export const dota2Hub = {
  path: '/dota2',
  kind: 'hub',
  title: 'Dota 2 desde Argentina: requisitos, servidores y ranking',
  h1: 'Dota 2 desde Argentina',
  description: 'Dota 2 es gratis en Steam: si te corre según el mínimo de Valve, cuánto tarda la descarga, los servidores cerca de Argentina y un ranking de equipos.',
  scripts: ['d2req.js', 'events.js', 'agenda.js'],
  data: h => d2Data(h),
  ld: h => ldPage(h),
  render(h) {
    const F = d2Facts(h), A = F.A, S = d2Servers(h);
    const plat = [A.platforms.windows && 'Windows', A.platforms.mac && 'Mac', A.platforms.linux && 'Linux'].filter(Boolean);
    const and = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a.join('');
    const facts = '<div class="pa-gd"><section class="pa-c pa-w2"><p class="pa-big pa-nk">Gratis</p><p>En Steam figura como Free to Play, y los héroes vienen todos incluidos: no se compran. Lo que se vende es ropa cosmética, que en pingalto no tratamos.</p></section>' +
      '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + plat.length + ' <small>sistemas</small></p><p>' + and(plat) + '. No hay versión para consolas ni para celulares: es un juego de compu.</p></section>' +
      '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + fmt(A.diskGb, 0) + ' <small>GB</small></p><p>de espacio libre que pide Steam' + (F.es.length ? '. Textos en ' + h.esc(F.es.map(l => l.replace(/^Español/, 'español')).join(' y ')) : '') + '.</p></section></div>';

    const hrs = (A.diskGb * 8000) / DL_EX / 3600;
    const form = '<form class="pa-c pa-fm" id="pa-d2" autocomplete="off"><h2>¿Te corre Dota 2?</h2>' +
      field('d2-os', 'Sistema', '<select id="d2-os" name="os">' + opt([['win', 'Windows 7 o más nuevo'], ['mac', 'Mac'], ['linux', 'Linux'], ['old', 'Windows XP o Vista']], 'win') + '</select>') +
      '<div class="pa-row">' + field('d2-cpu', 'Núcleos del procesador', '<select id="d2-cpu" name="cpu">' + opt([['1', '1'], ['2', '2'], ['4', '4'], ['6', '6 o más'], ['0', 'No sé']], 4) + '</select>', 'Administrador de tareas, Rendimiento: «Núcleos».') +
      field('d2-ram', 'Memoria RAM', '<select id="d2-ram" name="ram">' + opt([[2, '2 GB'], [3, '3 GB'], [4, '4 GB'], [6, '6 GB'], [8, '8 GB'], [16, '16 GB o más']], 8) + '</select>') + '</div>' +
      '<div class="pa-row">' + field('d2-gpu', 'Placa de video con DirectX ' + F.dx, '<select id="d2-gpu" name="gpu">' + opt([['1', 'Sí'], ['-1', 'No'], ['0', 'No sé']], 1) + '</select>', 'En Windows: tecla Windows + R, escribí dxdiag.') +
      field('d2-disk', 'GB libres en el disco', '<input id="d2-disk" name="disk" type="text" inputmode="numeric" autocomplete="off" value="120">') + '</div>' +
      field('d2-net', 'Tu internet, en Mbps', '<input id="d2-net" name="net" type="text" inputmode="decimal" autocomplete="off" value="' + DL_EX + '">', 'Lo ves en un test de velocidad o en tu factura.') +
      '<p class="pa-x"><b>ejemplo</b> · cambiá los valores y la respuesta se actualiza</p></form>';
    const row = (k, l, need) => '<li data-rq="' + k + '" data-st="ok"><b>Sí</b><span>' + l + ': <small>' + need + '</small></span></li>';
    const res = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Contra el mínimo que publica Valve en Steam</p><p class="pa-big pa-nk" data-o="rq">Sí, llega</p>' +
      '<ul class="pa-rq">' + row('os', 'Sistema', h.esc(F.os)) + row('cpu', 'Procesador', 'doble núcleo a ' + h.esc(F.ghz) + ' GHz') + row('ram', 'RAM', fmt(A.ramGb, 0) + ' GB') + row('gpu', 'Placa de video', 'DirectX ' + F.dx) + row('disk', 'Disco', fmt(A.diskGb, 0) + ' GB libres') + '</ul>' +
      '<p class="pa-say" data-o="rqsay">Llegar al mínimo quiere decir que el juego arranca; para jugar fluido conviene tener más.</p>' +
      '<p class="pa-x">Descarga de ' + fmt(A.diskGb, 0) + ' GB</p><p class="pa-big pa-nk" data-o="dl">' + fmt(hrs, 1) + ' <small>horas</small></p>' +
      '<p class="pa-say" data-o="dlsay">A ' + fmt(DL_EX, 0) + ' Mbps, si la conexión va todo el tiempo a esa velocidad.</p>' +
      '<details class="pa-fx"><summary>Ver la cuenta</summary><code>horas = GB × 8.000 ÷ Mbps ÷ 3.600\n' + fmt(A.diskGb, 0) + ' × 8.000 ÷ ' + fmt(DL_EX, 0) + ' ÷ 3.600 = ' + fmt(hrs, 2) + '</code><p class="pa-src">1 GB = 8.000 megabits. Steam puede bajar algo menos que el espacio que pide, y tu conexión casi nunca va al máximo todo el rato: tomalo como una idea, no como un reloj.</p></details></div>';
    const tool = '<div class="pa-tool">' + form + res + '</div>';

    const what = sec('Qué es Dota 2', '<div class="pa-two"><div><p>Dota 2 es un juego de estrategia por equipos de Valve, gratis en Steam desde el ' + h.esc(A.date.toLowerCase()) + '. Cada jugador maneja un héroe con sus habilidades, junta oro y objetos durante la partida, y gana el equipo que destruye la base del rival. Es de la misma familia que League of Legends: los dos son MOBA.</p>' +
      '<p>Pide paciencia: hay muchos héroes y cada partida es distinta. Por eso Valve recomienda arrancar contra bots.</p></div>' +
      '<div>' + quote(h, 'd2_heroes', 'es') + quote(h, 'd2_all_free', 'es') + quote(h, 'd2_ready', 'es') + srcLine(h, 'steam-dota2', '<a href="' + h.esc(h.pa.doc('steam-dota2').page) + '" rel="noopener">ficha de Steam</a>') + '</div></div>');

    const steps = sec('Cómo empezar a jugar', '<div class="pa-two"><ol class="pa-steps"><li><span>Creá una cuenta de Steam y bajá Steam en tu compu desde <a href="https://store.steampowered.com/" rel="noopener">store.steampowered.com</a>.</span></li>' +
      '<li><span>Buscá Dota 2 en la tienda y tocá «Jugar». Se baja como cualquier juego de Steam: fijate arriba cuánto tarda con tu internet.</span></li>' +
      '<li><span>Hacé las primeras partidas contra bots, en modo cooperativo: es lo que recomienda Valve para aprender lo básico.</span>' + quote(h, 'd2_bots', 'es') + '</li>' +
      '<li><span>Cuando busques partida, marcá las regiones más cerca tuyo: cuanto más lejos el servidor, más ping. Abajo están los puntos de Valve en Sudamérica y el <a href="' + h.href('/kit/ping') + '">test de ping</a> mide desde tu provincia.</span></li></ol>' +
      '<div class="pa-c"><h3>Lo que pide Valve, tal cual</h3><div class="pa-tw"><table class="pa-tb"><tbody>' + Object.entries(A.min).map(([k, v]) => '<tr><td>' + h.esc(k.replace(/\s*\*$/, '')) + '</td><td lang="es"><samp>' + h.esc(v) + '</samp></td></tr>').join('') + '</tbody></table></div>' +
      '<p class="pa-src">Mínimo para Windows. ' + (F.mac ? 'En Mac pide <samp>' + h.esc(F.mac) + '</samp>; ' : '') + (F.linux ? 'en Linux, <samp>' + h.esc(F.linux) + '</samp>.' : '') + '</p>' +
      srcLine(h, 'steam-dota2', 'requisitos mínimos, <a href="' + h.esc(h.pa.doc('steam-dota2').page) + '" rel="noopener">ficha de Steam</a>') + '</div></div>');

    const servers = sec('Los servidores de Valve más cerca', '<div class="pa-two"><div class="pa-tw"><table class="pa-tb"><thead><tr><th>Desde ' + h.esc(S.home.desc) + ' hasta</th><th class="pa-n">Ping típico de Valve</th><th class="pa-n">Piso físico</th></tr></thead><tbody>' +
      S.rows.map(r => '<tr><td>' + h.esc(r.desc) + '</td><td class="pa-n">' + fmt(r.ms, 0) + ' ms</td><td class="pa-n">' + fmt(r.floor, 1) + ' ms</td></tr>').join('') + '</tbody></table></div>' +
      '<div><p>Valve publica en su API la red de puntos que usa Dota 2, con el ping típico entre ellos. En Sudamérica tiene ' + fmt(S.south.length, 0) + ' con relés propios: ' + h.esc(and(S.south)) + '. El piso físico es el mínimo que permite la luz en una fibra recta entre las dos ciudades: ninguna conexión baja de ahí.</p>' +
      '<p>Tu ping real suma el tramo desde tu casa hasta el punto de Buenos Aires. Medilo desde tu provincia en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p>' +
      srcLine(h, 'valve-sdr-570', 'revisión ' + h.esc(String(S.revision))) + '</div></div>');

    const tools = sec('Herramientas para Dota 2', cards(h, [['/kit/ping', 'Test de ping', 'Tu ping desde tu provincia y el mínimo que permite la física.'], ['/esports/series', 'Calculadora de series', 'De la chance por mapa a la chance de ganar un Bo3 o un Bo5.'], ['/dota2/ti', 'The International', 'El torneo más grande, fase por fase y en hora argentina.'], ['/esports/agenda', 'Agenda de esports', 'Los partidos de hoy en hora argentina.'], ['/tier-list', 'Tier list', 'Armá la tuya de héroes y compartila.']]));

    const method = sec('Cómo armamos el ranking', '<div class="pa-two"><div><p>Valve no publica un ranking de equipos de Dota 2, así que hacemos el nuestro con una cuenta conocida: <b>Elo</b>. Cada equipo arranca con ' + fmt(ELO.start, 0) + ' puntos; cuando gana una serie le saca puntos al rival, más si el rival estaba más arriba. Usamos todas las series terminadas de los últimos 180 días que lista PandaScore.</p><p>Cuenta solo quién ganó cada serie, no por cuánto. Un equipo nuevo necesita varias series para quedar bien ubicado: por eso mostramos los que jugaron al menos 8 y siguen activos.</p></div>' +
      '<div class="pa-c"><h3>La fórmula</h3><p>Chance de A contra B = 1 / (1 + 10<sup>(Elo B − Elo A) / 400</sup>). Después de la serie, el ganador suma ' + ELO.k + ' × (1 − su chance) y el perdedor resta lo mismo.</p><p class="pa-src">Debajo de la tabla está la prueba hacia atrás: con el Elo de antes de cada serie de los últimos 60 días, cuántas veces ganó el que estaba arriba. Es la forma honesta de saber cuánto sirve.</p></div></div>');

    const parents = sec('Para padres y lo que no mostramos', '<div class="pa-three pa-3w">' +
      '<div class="pa-c"><h3>Medallas y héroes</h3><p>Distribución de medallas, héroes más jugados o win rate por héroe: esos datos salen de servicios que no permiten que los lean agentes de IA o de una clave de Valve que no tenemos.</p></div>' +
      '<div class="pa-c"><h3>Apuestas</h3><p>Nunca: ni cuotas ni casas de apuestas. Los nombres de equipos con marcas de apuestas aparecen tapados.</p></div>' +
      '<div class="pa-c"><h3>Qué dice Steam del contenido</h3>' + quote(h, 'd2_content', 'es') + '<p>Se juega en línea, con otras personas que no conocés.</p></div></div>');

    return css(h) + hero(h, { ey: 'Dota 2 · gratis en Steam · desde Argentina', girl: true, sub: 'Si tu compu lo corre según Valve, cuánto tarda la descarga, cómo empezar, el ping a los servidores de Sudamérica y quién está arriba en nuestro ranking de equipos.' }) +
      facts + tool + what + steps + tools + servers +
      sec('Ranking de equipos', box('dotaelo') + PS, 'ranking') + agendaBlock(h, 'dota2', 'Próximos partidos de Dota 2') +
      sec('The International', box('champs', ' data-g="dota2"') + (h.built('/dota2/ti') ? '<p>El cuadro completo de la última edición, en <a href="' + h.href('/dota2/ti') + '">The International en hora argentina</a>.</p>' : '')) + method + parents;
  },
};
