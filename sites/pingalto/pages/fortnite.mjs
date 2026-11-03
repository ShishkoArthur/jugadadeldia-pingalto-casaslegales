// /fortnite/nube - Fortnite on Xbox Cloud Gaming from Argentina: availability and requirements quoted from Microsoft, and a data
// calculator (engine/games/stream.mjs) that turns a stream speed into GB. Microsoft publishes speeds, not GB per hour, so the page
// says what a stream at that speed moves, never what the game "uses".
import { gbPerHour, hoursFromPlan, gbForPlay } from '../../../engine/games/stream.mjs';
import { fmt, fmtInput, quote, hero, ldPage, sec } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const txt = (id, value, whole) => '<input id="' + id + '" type="text" inputmode="' + (whole ? 'numeric' : 'decimal') + '" autocomplete="off" value="' + fmtInput(value, 2) + '">';
const EX = { hours: 1.5, days: 5, plan: 10 };

export const fortniteNube = {
  path: '/fortnite/nube',
  kind: 'tool',
  title: 'Fortnite en Xbox Cloud desde Argentina: datos e internet',
  description: 'Cuántos datos mueve Fortnite en Xbox Cloud Gaming desde Argentina, qué velocidad pide Microsoft y cuántas horas te rinde el plan del celu.',
  h1: 'Fortnite en Xbox Cloud Gaming desde Argentina: datos e internet',
  scripts: ['nube.js'],
  data: h => ({ speeds: [h.pa.fact('xbox_min_mbps'), h.pa.fact('xbox_best_mbps')] }),
  ld: h => ldPage(h),
  render(h) {
    const lo = h.pa.fact('xbox_min_mbps'), hi = h.pa.fact('xbox_best_mbps');
    const speeds = [[lo, 'mínimo que pide Microsoft'], [hi, 'mejor calidad en algunos equipos']];
    const per = gbPerHour(lo), month = gbForPlay({ hoursPerDay: EX.hours, daysPerWeek: EX.days, mbps: lo }), last = hoursFromPlan({ gb: EX.plan, mbps: lo });
    const form = '<form class="pa-c pa-fm" id="pa-nb" autocomplete="off">' +
      field('nb-s', 'Velocidad del stream', '<select id="nb-s" name="s">' + speeds.map(([v, t], i) => '<option value="' + v + '"' + (i === 0 ? ' selected' : '') + '>' + fmt(v, 0) + ' Mbps · ' + t + '</option>').join('') + '</select>') +
      '<div class="pa-row">' + field('nb-h', 'Horas por día', txt('nb-h', EX.hours)) + field('nb-d', 'Días por semana', '<select id="nb-d" name="d">' + [1, 2, 3, 4, 5, 6, 7].map(d => '<option value="' + d + '"' + (d === EX.days ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>') + '</div>' +
      field('nb-p', 'GB de tu plan del celu por mes', txt('nb-p', EX.plan, true), 'Mirá cuántos te quedan en la app de tu compañía.') +
      '<p class="pa-x"><b>ejemplo</b> · cambiá los valores y la cuenta se actualiza</p></form>';
    const res = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Por hora de juego, a esa velocidad</p><p class="pa-big" data-o="per">' + fmt(per, 1) + ' <small>GB</small></p>' +
      '<p class="pa-say" data-o="say">Jugando ' + fmt(EX.hours, 1) + ' horas ' + EX.days + ' días por semana son unos <b>' + fmt(month, 0) + ' GB por mes</b>. Con ' + fmt(EX.plan, 0) + ' GB te alcanzan <b>' + fmt(last, 1) + ' horas</b>.</p>' +
      '<div class="pa-bar" style="--v:' + Math.min(100, (EX.plan / month) * 100).toFixed(1) + ';--tick:10%" role="img" aria-label="Parte del mes que cubre tu plan" data-o="bar"><i></i><span>' + fmt(Math.min(100, (EX.plan / month) * 100), 0) + ' % del mes</span></div>' +
      '<div class="pa-share"><button type="button" data-pa-share>Copiar link con estos valores</button><output data-o="copied"></output></div>' +
      '<details class="pa-fx"><summary>Ver la cuenta</summary><code>GB por hora = Mbps × 3600 ÷ 8 ÷ 1000\n' + fmt(lo, 0) + ' Mbps → ' + fmt(per, 1) + ' GB por hora · ' + fmt(hi, 0) + ' Mbps → ' + fmt(gbPerHour(hi), 1) + ' GB por hora\nmes = 30 días</code><p class="pa-src">Microsoft publica la velocidad que hace falta, no cuántos GB gasta una partida. La cuenta dice cuánto mueve un stream que va todo el tiempo a esa velocidad; el real puede ser menor o mayor según la imagen y tu conexión.</p></details></div>';
    const free = sec('¿Se puede jugar gratis desde Argentina?', '<div class="pa-two"><div><p>Sí: Xbox Cloud Gaming llegó a la Argentina en ' + h.fmtDate(h.pa.doc('xbox-wire-ar').published).slice(6) + ' y Fortnite se puede jugar sin suscripción, solo con una cuenta de Microsoft, desde el navegador del celular, la tablet o la compu.</p>' + quote(h, 'xbox_ar_launch') + quote(h, 'xbox_ar_fortnite') + '<p class="pa-src">Anuncio de Xbox del ' + h.fmtDate(h.pa.doc('xbox-wire-ar').published) + '.</p></div>' +
      '<div>' + quote(h, 'xbox_free_fortnite', 'es') + quote(h, 'xbox_touch') + '<p class="pa-src">Así lo dice hoy la página de Xbox para Argentina.</p></div></div>');
    const need = sec('Qué te pide Microsoft', '<div class="pa-three"><div class="pa-c"><h3>' + fmt(lo, 0) + ' Mbps de bajada</h3>' + quote(h, 'xbox_min_mbps', 'es') + quote(h, 'xbox_best_mbps', 'es') + '</div>' +
      '<div class="pa-c"><h3>Wi-Fi de 5 GHz</h3>' + quote(h, 'xbox_5ghz', 'es') + quote(h, 'xbox_perf', 'es') + '</div><div class="pa-c"><h3>Un navegador</h3>' + quote(h, 'xbox_browsers', 'es') + '<p class="pa-src">Entrás a xbox.com/play, iniciás sesión y elegís Fortnite: no se instala nada.</p></div></div>');
    const ping = sec('¿Y el ping?', '<p>Microsoft no publica desde qué centro de datos te transmite el juego ni un ping mínimo, así que no te damos uno. En la nube, a la demora de tu conexión se suma la del video que viaja hasta tu pantalla. Para ver cuánto le sacás a las ciudades más cercanas con servidores de juegos, usá el <a href="' + h.href('/kit/ping') + '">test de ping desde tu provincia</a>.</p>');
    const tips = sec('Para que rinda el plan', '<ol class="pa-steps"><li><span>Si podés, jugá con Wi-Fi: los datos del celu se van rápido con el video.</span></li><li><span>Si cuando se te acaban los GB tu compañía te baja la velocidad por debajo de ' + fmt(lo, 0) + ' Mbps, ya no llegás al mínimo que pide Microsoft para jugar en la nube.</span></li><li><span>Cerrá descargas y videos en otros equipos de tu casa mientras jugás.</span></li></ol>');
    return hero(h, { ey: 'Fortnite · nube · desde Argentina', sub: 'Jugar Fortnite sin consola ni compu potente: qué velocidad pide Microsoft y cuántos GB del plan se lleva, con la cuenta a la vista.' }) +
      '<div class="pa-tool">' + form + res + '</div>' + free + need + ping + tips;
  },
};
