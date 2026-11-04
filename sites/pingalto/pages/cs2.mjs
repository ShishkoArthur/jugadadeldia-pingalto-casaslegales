// /cs2/mira - CS2 crosshair builder for the share code format of the CS2 update of 2026-09-30 ("CS" + 44 characters) and the
// console commands. The codec is engine/games/xhair.mjs (port of the MIT library akiver/csgo-sharecode, locked by its test codes,
// two exported by the game); its constants must match the quoted ones here or the build stops.
import { encode, decode, convars, previewSvg, DEFAULTS, DICT, CHARS, BYTES, PREFIX, STYLES } from '../../../engine/games/xhair.mjs';
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const range = (id, k, min, max, step, v, digits = 0) => '<div class="pa-f pa-rg"><label for="' + id + '">' + RLABEL[k] + ' <output data-v="' + k + '">' + fmt(v, digits) + '</output></label><input id="' + id + '" type="range" name="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '" data-d="' + digits + '"></div>';
const check = (k, label, on) => '<label class="pa-ck"><input type="checkbox" name="' + k + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>';
const RLABEL = { thickness: 'Grosor (px)', length: 'Largo (px)', gap: 'Separación (px)', alpha: 'Opacidad', outlineAlpha: 'Opacidad del contorno', dynamicSpreadLimit: 'Límite de apertura dinámica', splitDistance: 'Distancia de división', innerSplitAlpha: 'Opacidad interior dividida', outerSplitAlpha: 'Opacidad exterior dividida', splitSizeRatio: 'Proporción de división', scopeDotScale: 'Tamaño del punto con mira' };
const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
const HEIGHTS = [720, 768, 900, 1080, 1440, 2160];
// Starting example: a small static cross, green, full outline, 1080 lines.
const EX = { ...DEFAULTS, style: 4, thickness: 1, length: 5, gap: 2, red: 0, green: 255, blue: 170 };

function check7(h) {
  const want = { xhair_prefix: PREFIX, xhair_chars: CHARS, xhair_bytes: BYTES, xhair_dict: DICT };
  for (const [k, v] of Object.entries(want)) if (h.pa.fact(k) !== v) throw new Error('cs2 crosshair: ' + k + ' changed in the source (' + h.pa.fact(k) + ' vs ' + v + ')');
  const names = h.pa.fact('xhair_styles');
  if (names.length !== STYLES) throw new Error('cs2 crosshair: style list changed');
  return names;
}
function updateDate(h, factId) {
  const q = h.pa.src.facts[factId].quote;
  const item = h.pa.json('steam-cs2-news').appnews.newsitems.find(n => n.contents.includes(q.replace(/"/g, '\\"')) || n.contents.includes(q));
  if (!item) throw new Error('cs2: update with the quote not found');
  return new Date(item.date * 1000).toISOString().slice(0, 10);
}

export const cs2Mira = {
  path: '/cs2/mira',
  kind: 'tool',
  title: 'Miras de CS2: creador de crosshair con código y comandos',
  description: 'Armá tu mira de CS2 con vista previa y copiá el código nuevo que empieza con CS o los comandos de consola. Probado con códigos que exporta el juego.',
  h1: 'Creador de miras para CS2',
  scripts: ['xhair.js'],
  data: h => ({ styles: check7(h), heights: HEIGHTS, len: CHARS + PREFIX.length }),
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: h.page.h1, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es-AR', isAccessibleForFree: true, url: 'https://' + h.site.domain + h.page.path }]),
  render(h) {
    const names = check7(h);
    const code = encode(EX);
    if (JSON.stringify(decode(code)) !== JSON.stringify(EX)) throw new Error('cs2 crosshair: example does not round trip');
    const when = h.fmtDate(updateDate(h, 'cs2_code_format'));
    const form = '<form class="pa-c pa-fm" id="pa-xf" autocomplete="off">' +
      field('xh-style', 'Estilo', '<select id="xh-style" name="style">' + names.map((n, i) => '<option value="' + i + '"' + (i === EX.style ? ' selected' : '') + '>' + h.esc(n) + '</option>').join('') + '</select>', 'Los nombres, como aparecen en el juego en inglés.') +
      '<div class="pa-row">' + field('xh-color', 'Color', '<input id="xh-color" type="color" name="color" value="' + hex(EX.red, EX.green, EX.blue) + '">') + range('xh-alpha', 'alpha', 0, 255, 1, EX.alpha) + '</div>' +
      range('xh-th', 'thickness', 0, 10, 1, EX.thickness) + range('xh-len', 'length', 0, 40, 1, EX.length) + range('xh-gap', 'gap', -10, 30, 1, EX.gap) +
      '<div class="pa-row">' + field('xh-om', 'Contorno', '<select id="xh-om" name="outlineMode"><option value="0">Sin contorno</option><option value="1" selected>Completo</option><option value="2">Medio (arriba e izquierda)</option></select>') +
      field('xh-oc', 'Color del contorno', '<input id="xh-oc" type="color" name="ocolor" value="' + hex(EX.outlineRed, EX.outlineGreen, EX.outlineBlue) + '">') + '</div>' +
      '<div class="pa-cks">' + check('centerDotEnabled', 'Punto central', EX.centerDotEnabled) + check('tStyleEnabled', 'Estilo T (sin línea de arriba)', EX.tStyleEnabled) + check('followRecoil', 'Sigue el retroceso', EX.followRecoil) + '</div>' +
      field('xh-sh', 'Alto de tu resolución', '<select id="xh-sh" name="screenHeight">' + HEIGHTS.map(v => '<option value="' + v + '"' + (v === EX.screenHeight ? ' selected' : '') + '>' + fmt(v, 0) + ' líneas</option>').join('') + '</select>', 'CS2 guarda los píxeles junto con la resolución en la que armaste la mira y la reescala si cambiás de resolución.') +
      '<details class="pa-fx"><summary>Más ajustes</summary><div class="pa-fm">' + range('xh-ds', 'dynamicSpreadLimit', 0, 255, 1, EX.dynamicSpreadLimit) + range('xh-sd', 'splitDistance', 0, 127, 1, EX.splitDistance) +
      range('xh-ia', 'innerSplitAlpha', 0, 1, 0.01, EX.innerSplitAlpha, 2) + range('xh-oa', 'outerSplitAlpha', 0.3, 1, 0.01, EX.outerSplitAlpha, 2) + range('xh-sr', 'splitSizeRatio', 0, 1, 0.01, EX.splitSizeRatio, 2) +
      range('xh-oal', 'outlineAlpha', 0, 255, 1, EX.outlineAlpha) + range('xh-sc', 'scopeDotScale', 0.1, 2, 0.01, EX.scopeDotScale, 2) + check('scopeDotUseCrosshairColor', 'Punto de la mira con zoom del mismo color', EX.scopeDotUseCrosshairColor) + '</div></details>' +
      '<p class="pa-x"><b>ejemplo</b> · cambiá cualquier valor y el código se arma solo</p></form>';
    const res = '<div class="pa-c pa-out" aria-live="polite">' +
      '<div class="pa-xp" data-o="prev">' + previewSvg(EX) + '</div><p class="pa-src">Vista previa aproximada en píxeles, ampliada y quieta: la mira dinámica se abre en el juego al moverte y al disparar.</p>' +
      '<p class="pa-x">Tu código para CS2</p><p class="pa-code"><code data-o="code">' + code + '</code></p>' +
      '<div class="pa-share"><button type="button" data-copy="code">Copiar código</button><button type="button" data-pa-share>Copiar link</button><output data-o="copied"></output></div>' +
      '<details class="pa-fx"><summary>Comandos para la consola</summary><code data-o="cvars">' + h.esc(convars(EX)) + '</code><div class="pa-share" style="margin-top:10px"><button type="button" data-copy="cvars">Copiar comandos</button></div></details>' +
      '<div class="pa-f" style="margin-top:6px"><label for="xh-in">¿Ya tenés un código? Pegalo y lo cargamos</label><input id="xh-in" type="text" autocomplete="off" spellcheck="false" placeholder="CS…"><small data-o="in">Solo códigos nuevos: empiezan con CS y tienen ' + fmt(CHARS + PREFIX.length, 0) + ' caracteres.</small></div></div>';
    const fmtSec = sec('El código nuevo de CS2, desde el ' + when, '<div class="pa-two"><div><p>Valve cambió el formato del código de mira en la actualización del ' + when + ': ahora guarda el tamaño en píxeles, la resolución en la que la armaste, el color del contorno y el punto de la mira con zoom. Los códigos viejos que empiezan con CSGO ya no sirven para importar.</p>' +
      quote(h, 'cs2_code_format') + quote(h, 'cs2_code_scope') + '</div><div>' + quote(h, 'cs2_px') + quote(h, 'cs2_rescale') + quote(h, 'xhair_legacy') + '</div></div>');
    const how = sec('Cómo verificamos que el código sirve', '<div class="pa-two"><div><p>El código es un número grande escrito con ' + fmt(DICT.length, 0) + ' letras y números (sin los que se confunden, como la I mayúscula o el 0), que guarda ' + fmt(BYTES, 0) + ' bytes: el primero es la suma de control de los demás. Usamos la misma cuenta que la librería abierta csgo-sharecode y, en cada compilación, el sitio comprueba que arma y lee exactamente sus códigos de prueba, dos de ellos exportados por el juego.</p>' +
      srcLine(h, 'xhair-codec', 'licencia MIT') + '</div><div>' + quote(h, 'xhair_game_vector') + quote(h, 'xhair_chars') + '</div></div>');
    const steps = sec('Cómo cargarla en CS2', '<ol class="pa-steps"><li><span>Copiá el código con el botón.</span></li><li><span>En CS2 abrí los ajustes y entrá a la pestaña de miras (Crosshair/Scopes en inglés).</span></li><li><span>Buscá la opción para importar un código, pegalo y guardá. Si preferís la consola, pegá los comandos de a uno o todos juntos.</span></li></ol>' + quote(h, 'cs2_tab') +
      '<p class="pa-src">Los comandos van con punto decimal porque así los lee la consola del juego.</p>');
    const ar = sec('Desde Argentina', '<div class="pa-three"><div class="pa-c"><h3>Los servidores</h3><p>Valve tiene un punto de su red en Buenos Aires. Cuánto ping le sacás desde tu provincia, en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p></div>' +
      '<div class="pa-c"><h3>Tu sensibilidad</h3><p>Si venís de Valorant u Overwatch 2, pasá el mismo giro de mano con el <a href="' + h.href('/kit/sensibilidad') + '">convertidor de sensibilidad</a>.</p></div>' +
      '<div class="pa-c"><h3>Miras de jugadores argentinos</h3><p>No las copiamos de páginas de terceros: solo vamos a sumar las que un jugador publique él mismo, con el link y la fecha.</p></div></div>');
    return hero(h, { ey: 'CS2 · mira · código nuevo', sub: 'Armás la mira con la vista previa, copiás el código de CS2 o los comandos y listo. Funciona con el formato de código que el juego usa desde el ' + when + '.' }) +
      '<div class="pa-tool pa-oo">' + form + res + '</div>' + fmtSec + steps + how + ar;
  },
};
