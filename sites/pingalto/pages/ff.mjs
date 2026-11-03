// /ff/sensibilidad - Free Fire sensitivity, honest version: Garena does not publish how a slider turns into rotation, so no page
// can "generate" the right number for your phone. The tool finds YOUR number by halving (engine/games/bisect.mjs): you try a
// value in the game, answer "me pasé" / "me quedé corto" / "justo", and the interval that can hold the answer halves each time.
import { start, answer, triesLeft } from '../../../engine/games/bisect.mjs';
import { fmt, hero, ldPage, sec } from './parts.mjs';

const SLIDERS = ['General', 'Punto rojo', 'Mira 2x', 'Mira 4x', 'Francotirador', 'Cámara libre'];
const EX = { value: 100, lo: 0, hi: 200 };

export const ffSensibilidad = {
  path: '/ff/sensibilidad',
  kind: 'tool',
  title: 'Sensibilidad para Free Fire: calibrá la tuya paso a paso',
  description: 'Encontrá tu sensibilidad de Free Fire en pocos intentos: probás en el juego, contestás si te pasaste o te quedaste corto y te damos el próximo valor.',
  h1: 'Sensibilidad para Free Fire, calibrada en tu celular',
  scripts: ['ff.js'],
  data: () => ({ sliders: SLIDERS }),
  ld: h => ldPage(h),
  render(h) {
    let s = start(EX);
    const first = triesLeft(s);
    s = answer(s, 'fast');
    const rows = SLIDERS.map((name, i) => '<div data-row="' + i + '"><div class="pa-f"><label for="ff-n' + i + '">Deslizador</label><input id="ff-n' + i + '" value="' + h.esc(name) + '" maxlength="24"></div>' +
      '<div class="pa-f"><label for="ff-v' + i + '">Hoy tenés</label><input id="ff-v' + i + '" type="text" inputmode="numeric" autocomplete="off" value=""></div>' +
      '<div class="pa-f"><label for="ff-m' + i + '">Máximo</label><input id="ff-m' + i + '" type="text" inputmode="numeric" autocomplete="off" value=""></div>' +
      '<button type="button" data-pick="' + i + '" aria-pressed="' + (i === 0) + '">Calibrar</button></div>').join('');
    const tool = '<div class="pa-tool"><div class="pa-c pa-fm"><h2>Tus deslizadores</h2><p class="pa-x">Copiá los valores de la parte de sensibilidad en los ajustes del juego. El máximo es el número más alto que te deja poner tu versión del juego.</p><div class="pa-sl">' + rows + '</div>' +
      '<div class="pa-share"><button type="button" data-pa-share>Copiar link con mis valores</button><output data-o="copied"></output></div></div>' +
      '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Probá en el juego: <b data-o="name">' + h.esc(SLIDERS[0]) + '</b></p>' +
      '<p class="pa-big" data-o="value">-</p>' +
      '<p class="pa-say" data-o="say">Completá el valor de hoy y el máximo del deslizador que querés calibrar, y apretá Calibrar.</p>' +
      '<div class="pa-int" role="img" aria-label="Rango donde todavía puede estar tu valor" data-o="int"><i style="left:0;width:100%"></i><b style="left:50%"></b></div>' +
      '<div class="pa-seg" style="margin-top:14px"><button type="button" data-a="fast" disabled>Me pasé</button><button type="button" data-a="slow" disabled>Me quedé corto</button><button type="button" data-a="ok" disabled>Quedó justo</button></div>' +
      '<p class="pa-ch"><span data-o="left">Intentos que quedan: -</span><span data-o="tries">Probados: -</span></p>' +
      '<details class="pa-fx"><summary>Por qué alcanza con pocos intentos</summary><p>Cada respuesta descarta la mitad de los valores posibles. En un deslizador de ' + fmt(EX.lo, 0) + ' a ' + fmt(EX.hi, 0) + ' te alcanzan ' + fmt(first, 0) + ' intentos como mucho; si arrancás en ' + fmt(EX.value, 0) + ' y te pasás, el próximo valor es ' + fmt(s.value, 0) + '.</p></details></div></div>';
    const test = sec('La prueba, siempre la misma', '<ol class="pa-steps"><li><span>Entrá al modo de entrenamiento del juego y elegí un blanco fijo que quede a tu costado.</span></li><li><span>Con el deslizador que estás calibrando (sin mira para General, con la mira que corresponda para las otras), hacé un solo deslizamiento rápido para poner la mira sobre el blanco.</span></li><li><span>Si te pasaste, apretá <b>Me pasé</b>; si no llegaste, <b>Me quedé corto</b>. Hacelo tres veces y quedate con lo que te pasó más seguido.</span></li><li><span>Cuando quede justo, pasá al siguiente deslizador. Tus valores quedan guardados en este navegador.</span></li></ol>');
    const honest = sec('Lo que nadie te puede dar', '<div class="pa-three"><div class="pa-c"><h3>No hay «todo rojo»</h3><p>Ninguna sensibilidad hace que las balas vayan a la cabeza. Lo que cambia es cuánto gira la mira por cada centímetro de dedo: si te queda cómoda, apuntás mejor vos.</p></div>' +
      '<div class="pa-c"><h3>No hay tabla por celular</h3><p>Garena no publica cómo convierte el número del deslizador en giro, ni si cambia con la pantalla. Una tabla «para tu modelo» es una suposición; tus propios intentos, no.</p></div>' +
      '<div class="pa-c"><h3>Qué hace cada deslizador</h3><p>Cada uno decide cuánto gira la vista en una situación: sin mira (General), con punto rojo, con mira 2x o 4x, con francotirador, y al mirar alrededor sin girar al personaje (Cámara libre).</p></div></div>');
    const mouse = sec('¿Jugás con mouse?', '<p>En la compu, el giro sí se puede medir en centímetros. Usá el <a href="' + h.href('/kit/dpi') + '">medidor de DPI</a> y el <a href="' + h.href('/kit/sensibilidad') + '">convertidor de sensibilidad</a>.</p>');
    return hero(h, { ey: 'Free Fire · celular', sub: 'No te vendemos una sensibilidad mágica. Te ayudamos a encontrar la tuya: probás un valor, nos contás qué pasó y te damos el siguiente.' }) + tool + test + honest + mouse;
  },
};
