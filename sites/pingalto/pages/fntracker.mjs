// /fortnite/tracker - stats of any Fortnite player by Epic name (owner 2026-11-04: fortnite-api.com key; DECISIONS). The browser asks our
// proxy /api/fn/stats (tools/fnapi/server.mjs: key on the server, 10 min cache, limits); the page carries the empty board with the
// meaning of every number, the browser fills it (client/fntracker.js). No skins, no shop. Data source named on the page, with the note
// that fortnite-api.com is not affiliated with Epic Games.
import { FN, PLACES } from '../../../engine/games/fnstats.mjs';
import { fmt, hero, ldPage, sec } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const nameInput = (id, ph) => '<input id="' + id + '" name="' + id + '" type="text" maxlength="' + FN.nameMax + '" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="' + ph + '">';
const opt = list => list.map(([v, t], i) => '<option value="' + v + '"' + (i === 0 ? ' selected' : '') + '>' + t + '</option>').join('');
export const FT_PLATFORMS = [['all', 'Todo junto'], ['keyboardMouse', 'Teclado y mouse'], ['gamepad', 'Joystick'], ['touch', 'Pantalla táctil']];
const CARDS = [
  ['wins', 'Victorias', 'Las partidas que ganó: el último jugador o equipo en pie.'],
  ['winRate', 'De cada 100 partidas', 'Cuántas de cada 100 partidas terminan con su victoria.'],
  ['kd', 'K/D', 'Eliminaciones por cada vez que lo eliminan.'],
  ['kpm', 'Eliminaciones por partida', 'Cuántos rivales elimina en una partida promedio.'],
  ['matches', 'Partidas', 'Todas las partidas que cuentan en este filtro.'],
  ['time', 'Tiempo jugado', 'Horas dentro de las partidas, sin contar menús ni esperas.'],
];

export const fortniteTracker = {
  path: '/fortnite/tracker',
  kind: 'live',
  title: 'Fortnite tracker: estadísticas, K/D y victorias por jugador',
  description: 'Buscá a cualquier jugador de Fortnite por su nombre de Epic: victorias, K/D, partidas y puestos por modo. Compará dos jugadores y compartí el link.',
  h1: 'Fortnite tracker: estadísticas de cualquier jugador',
  scripts: ['fntracker.js'],
  data: () => ({ api: '/api/fn/stats', min: FN.nameMin, max: FN.nameMax, perMin: FN.perIpPerMin, cacheMin: FN.cacheMin }),
  ld: h => ldPage(h),
  render(h) {
    const form = '<form class="pa-c pa-fm" id="pa-ft" autocomplete="off" novalidate>' +
      field('ft-n', 'Nombre de Epic del jugador', nameInput('ft-n', 'Por ejemplo, Ninja'), 'De ' + FN.nameMin + ' a ' + FN.nameMax + ' caracteres: letras, números, espacio, punto, guion o guion bajo. Mayúsculas o minúsculas, da igual.') +
      field('ft-v', 'Comparar con otro jugador (opcional)', nameInput('ft-v', 'Otro nombre de Epic')) +
      '<div class="pa-row">' + field('ft-p', 'Con qué juega', '<select id="ft-p" name="p">' + opt(FT_PLATFORMS) + '</select>') +
      field('ft-w', 'Período', '<select id="ft-w" name="w">' + opt([['lifetime', 'Desde siempre'], ['season', 'Esta temporada']]) + '</select>') + '</div>' +
      '<button class="pa-btn pa-b1" type="submit">Buscar estadísticas</button>' +
      '<p class="pa-x" data-o="ftnote">Hasta ' + FN.perIpPerMin + ' búsquedas por minuto. Cada respuesta se guarda ' + FN.cacheMin + ' minutos: una partida recién terminada puede tardar en aparecer.</p></form>';
    const card = ([k, label, say]) => '<div class="pa-c pa-fts" data-k="' + k + '"><p class="pa-x">' + label + '</p><p class="pa-big pa-nk" data-v>—</p><p class="pa-ftsay" data-s>' + say + '</p></div>';
    const out = '<div class="pa-out pa-ftout" aria-live="polite" aria-busy="false">' +
      '<div class="pa-fthd"><h2 data-o="ftname">Escribí un nombre y tocá «Buscar»</h2><p class="pa-x" data-o="ftmeta">Las estadísticas aparecen acá, en grande, con lo que quiere decir cada número.</p></div>' +
      '<p class="pa-ftmsg" data-o="ftmsg" role="status" hidden></p>' +
      '<div class="pa-ftg">' + CARDS.map(card).join('') + '</div>' +
      '<div data-o="ftmodes"></div><div data-o="ftvs"></div>' +
      '<div class="pa-c pa-ftkd" data-o="ftkd" hidden><h3>¿Cuánto te falta para un K/D?</h3>' +
      '<div class="pa-row">' + field('ft-k', 'K/D que querés', '<input id="ft-k" type="text" inputmode="decimal" autocomplete="off" value="' + fmt(2, 1) + '">') + '<div class="pa-f"><span>Con estas estadísticas</span><p class="pa-ftsay" data-o="ftkdnow"></p></div></div>' +
      '<p class="pa-say" data-o="ftkdsay"></p></div>' +
      '<div class="pa-share" data-o="ftshare" hidden><button type="button" data-pa-share>Copiar link de esta búsqueda</button><output data-o="copied"></output></div></div>';
    const modes = sec('Solo, dúo y escuadras: por qué los puestos cambian', '<p>En solo cada uno juega por su cuenta; en dúo van de a dos y en escuadras de a cuatro. Con equipos más grandes hay menos equipos por partida, así que los cortes de los puestos también son otros:</p>' +
      '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Modo</th><th>Cuenta cuántas veces quedó entre los…</th></tr></thead><tbody>' +
      [['Solo', PLACES.solo], ['Dúo', PLACES.duo], ['Escuadras', PLACES.squad]].map(([m, p]) => '<tr><td>' + m + '</td><td>' + p.map(n => n + ' primeros').join(' y entre los ') + '</td></tr>').join('') +
      '</tbody></table></div><p>Así lo separa la API que usamos. El total de arriba suma todos los modos, también tríos y los modos por tiempo limitado, que no aparecen por separado.</p>');
    const words = sec('Qué quiere decir cada número', '<div class="pa-three">' +
      '<div class="pa-c"><h3>K/D</h3><p>Eliminaciones dividido por las veces que te eliminaron. Un K/D de ' + fmt(2, 0) + ' quiere decir que, en promedio, sacás a dos rivales antes de caer. Si ganás la partida no te eliminan, por eso los que ganan mucho tienen K/D altos.</p></div>' +
      '<div class="pa-c"><h3>Victorias y porcentaje</h3><p>Una victoria es terminar primero, solo o con tu equipo. El porcentaje es victorias dividido por partidas: con ' + fmt(5, 0) + ' victorias en ' + fmt(100, 0) + ' partidas ganás 1 de cada ' + fmt(20, 0) + '.</p></div>' +
      '<div class="pa-c"><h3>Con qué juega</h3><p>Epic separa las partidas según el control: teclado y mouse, joystick o pantalla táctil. «Todo junto» las suma. Si alguien juega en PC con joystick, esas partidas van a joystick.</p></div></div>' +
      '<p class="pa-src">Si querés entender más términos del juego competitivo, están en el <a href="' + h.href('/esports/glosario') + '">glosario de esports</a>.</p>');
    const priv = sec('Si te dice que las estadísticas son privadas', '<div class="pa-two"><ol class="pa-steps">' +
      '<li><span>Abrí Fortnite y entrá a la configuración (el engranaje del menú).</span></li>' +
      '<li><span>Buscá la pestaña de cuenta y privacidad.</span></li>' +
      '<li><span>Activá la opción de mostrarte en las tablas de clasificación de la trayectoria (en inglés, «Show on Career Leaderboard») y guardá.</span></li>' +
      '<li><span>Volvé a buscarte en un rato: guardamos cada respuesta ' + FN.cacheMin + ' minutos y la API también tarda en enterarse.</span></li></ol>' +
      '<div><p>Solo vos podés hacer públicas tus estadísticas: si la cuenta es de otra persona, no hay forma de verlas.</p><p>Los nombres de la opción pueden cambiar entre temporadas; si no la encontrás, buscá dentro de la configuración la parte de privacidad del juego.</p></div></div>');
    const name = sec('Nombre de Epic, no el de la consola', '<p>La búsqueda es por el nombre de la cuenta de Epic Games, el que ves en el lobby y en tu perfil de Fortnite. Si jugás en PlayStation, Xbox o Switch, igual tenés una cuenta de Epic vinculada: ese es el nombre que va acá, no el de PSN o Xbox.</p>' +
      '<p>Los nombres llevan de ' + FN.nameMin + ' a ' + FN.nameMax + ' caracteres. Si cambiaste de nombre hace poco, buscá con el nuevo.</p>');
    const src = sec('De dónde salen los datos', '<div class="pa-two"><div><p>Los números vienen de <a href="https://fortnite-api.com/" rel="noopener">fortnite-api.com</a>, un servicio que no es oficial y no está afiliado a Epic Games ni respaldado por ella. Fortnite y Epic Games son marcas de Epic Games, Inc.</p>' +
      '<p>Le preguntamos a esa API desde nuestro servidor cuando buscás a alguien. No guardamos tus búsquedas: la respuesta queda ' + FN.cacheMin + ' minutos en memoria para no repetir la consulta y después se borra.</p></div>' +
      '<div><p>Para que alcance para todos, cada persona puede hacer hasta ' + FN.perIpPerMin + ' búsquedas por minuto. Comparar dos jugadores cuenta como dos.</p><p>Acá no hay skins, tienda ni pavos: en pingalto no tratamos compras dentro de los juegos.</p>' +
      '<p>¿Recién empezás? En <a href="' + h.href('/fortnite') + '">Fortnite desde Argentina</a> te contamos dónde bajarlo, y si tu compu no da, cómo <a href="' + h.href('/fortnite/nube') + '">jugarlo en la nube</a>.</p></div></div>');
    return hero(h, { ey: 'Fortnite · estadísticas · por nombre de Epic', sub: 'Escribí el nombre de Epic de cualquier jugador y mirá sus victorias, K/D y partidas por modo. Gratis, sin cuenta y sin skins.' }) +
      '<div class="pa-tool pa-ft">' + form + out + '</div>' + words + modes + priv + name + src;
  },
};
