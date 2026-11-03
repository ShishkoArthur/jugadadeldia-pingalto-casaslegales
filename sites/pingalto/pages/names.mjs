// /ff/nombres and /ff/espacio-invisible - nickname tools that need no game data: Unicode styled alphabets (engine/games/fancy.mjs,
// each style checked against NFKC in the tests) and the two invisible characters people use for a space inside a name. Garena does
// not publish the length limit nor which characters the name accepts, so the pages count and warn instead of promising.
import { STYLES, style, frame, FRAMES, lengths, HANGUL_FILLER, BRAILLE_BLANK } from '../../../engine/games/fancy.mjs';
import { fmt, quote, hero, ldPage, sec } from './parts.mjs';

const EX = 'ElCapo10';
export const IDEAS = ['Che', 'Capo', 'Pibe', 'Piba', 'Crack', 'Gaucho', 'Pampa', 'Tango', 'Mate', 'Asado', 'Bondi', 'Alfajor', 'Cóndor', 'Puma', 'Ñandú'];
const app = h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: h.page.h1, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es-AR', isAccessibleForFree: true, url: 'https://' + h.site.domain + h.page.path }]);
const cpHex = s => 'U+' + s.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

function row(h, id, label, text) {
  const n = lengths(text);
  return '<li data-st="' + id + '"><span class="pa-nk" data-t>' + h.esc(text) + '</span><small>' + h.esc(label) + ' · <span data-l>' + fmt(n.chars, 0) + ' caracteres · ' + fmt(n.units, 0) + ' unidades</span></small><button type="button" data-cp>Copiar</button></li>';
}

export const ffNombres = {
  path: '/ff/nombres',
  kind: 'tool',
  title: 'Nombres para Free Fire: generador con letras y símbolos',
  description: 'Creá nombres para Free Fire con letras raras y símbolos, mirá cuántos caracteres ocupa cada versión y probá ideas bien argentinas, con ñ y tildes.',
  h1: 'Generador de nombres para Free Fire',
  scripts: ['names.js'],
  data: () => ({ ideas: IDEAS }),
  ld: app,
  render(h) {
    const list = [{ id: 'normal', label: 'Normal' }, ...STYLES];
    const tool = '<div class="pa-tool"><div class="pa-c pa-fm" id="pa-nf"><div class="pa-f"><label for="nf-t">Tu nombre</label><input id="nf-t" type="text" maxlength="40" autocomplete="off" spellcheck="false" value="' + EX + '"></div>' +
      '<div class="pa-f"><label for="nf-fr">Adorno</label><select id="nf-fr">' + FRAMES.map((f, i) => '<option value="' + i + '">' + (i ? h.esc(frame('nombre', i)) : 'Sin adorno') + '</option>').join('') + '</select></div>' +
      '<div class="pa-f"><span>Ideas bien argentinas</span><div class="pa-seg">' + IDEAS.map(w => '<button type="button" data-idea="' + h.esc(w) + '">' + h.esc(w) + '</button>').join('') + '</div><small>Tocá una y se suma a tu nombre.</small></div>' +
      '<p class="pa-x"><b>ejemplo</b> · escribí el tuyo y cambian todas las versiones</p></div>' +
      '<div class="pa-c pa-out" aria-live="polite"><ul class="pa-nl" id="nf-out">' + list.map(s => row(h, s.id, s.label, s.id === 'normal' ? EX : style(EX, s.id))).join('') + '</ul><output data-o="copied" class="pa-src"></output></div></div>';
    const count = sec('Cuántos caracteres te deja poner', '<div class="pa-two"><div><p>Garena no publica en ninguna página oficial que hayamos encontrado cuántos caracteres acepta el nombre ni qué símbolos deja pasar. Por eso te mostramos dos cuentas: los caracteres como los ves y las unidades que usan muchos programas, donde cada letra de los alfabetos matemáticos vale dos.</p><p>Si el juego te dice que el nombre es muy largo, probá la versión con menos unidades o sacá el adorno.</p></div>' +
      '<div class="pa-c"><h3>Antes de cambiar el nombre</h3><p>Copiá la versión que te guste y pegala primero en el campo del nombre sin confirmar: si el juego muestra cuadraditos o te avisa que hay caracteres no válidos, elegí otra.</p></div></div>');
    const why = sec('Por qué son letras distintas', '<div class="pa-two"><div><p>No es una fuente instalada: cada versión usa otros caracteres de Unicode, el estándar que usan todos los celulares. Las letras negritas, góticas o de doble trazo vienen del bloque de símbolos alfanuméricos matemáticos; la versión ancha, del bloque de formas de ancho completo; los círculos, de los alfanuméricos encerrados.</p><p>La ñ y las letras con tilde no tienen versión en esos alfabetos, así que quedan como las escribiste. Si en esta página ves cuadraditos, a tu celular le falta la fuente y en el juego puede pasar lo mismo.</p></div>' +
      '<div>' + quote(h, 'uni_math') + quote(h, 'uni_fullwidth') + quote(h, 'uni_enclosed') + '<p class="pa-src">Lista de bloques de Unicode, versión ' + h.esc(h.pa.fact('uni_version')) + '.</p></div></div>');
    const more = sec('También te puede servir', '<div class="pa-three"><div class="pa-c"><h3>Espacio invisible</h3><p>Para un nombre con espacio en el medio: <a href="' + h.href('/ff/espacio-invisible') + '">copiá el carácter invisible</a>.</p></div><div class="pa-c"><h3>Sensibilidad</h3><p>Calibrá tu sensibilidad de Free Fire <a href="' + h.href('/ff/sensibilidad') + '">paso a paso en tu celular</a>.</p></div><div class="pa-c"><h3>Sin trucos</h3><p>No hay generadores de diamantes ni nombres que den ventajas. Acá solo armás cómo se ve tu nombre.</p></div></div>');
    return hero(h, { ey: 'Free Fire · nombre', sub: 'Escribí tu nombre y elegí entre ' + fmt(STYLES.length, 0) + ' estilos de letras y ' + fmt(FRAMES.length - 1, 0) + ' adornos. Copiás con un toque y te mostramos cuánto ocupa cada versión.' }) + tool + count + why + more;
  },
};

export const ffEspacio = {
  path: '/ff/espacio-invisible',
  kind: 'tool',
  title: 'Espacio invisible para Free Fire: copiar y pegar',
  description: 'Copiá el espacio invisible para tu nombre de Free Fire con un toque, probá cómo se ve acá mismo y armá un nick con espacio en el medio, con ñ y tildes.',
  h1: 'Espacio invisible para Free Fire',
  scripts: ['names.js'],
  ld: app,
  render(h) {
    const chars = [[HANGUL_FILLER, 'Relleno hangul', 'El más usado para nombres. No se ve y, según el programa, ocupa el lugar de un espacio o nada: probalo abajo.'], [BRAILLE_BLANK, 'Braille vacío', 'El primer carácter del bloque braille, el que no tiene ningún punto. Probalo si el otro no anda.']];
    const copy = '<div class="pa-two" style="padding:28px 28px 0">' + chars.map(([c, name, note]) => '<div class="pa-c pa-inv"><p class="pa-x">' + cpHex(c) + '</p><h2>' + name + '</h2><p>' + note + '</p><div class="pa-bt"><button type="button" class="pa-btn pa-b1" data-inv="' + cpHex(c) + '">Copiar invisible</button></div><output class="pa-src" data-o="c' + cpHex(c).slice(2) + '"></output></div>').join('') + '</div>';
    const build = '<div class="pa-tool"><div class="pa-c pa-fm" id="pa-if"><h2>Nombre con espacio</h2><div class="pa-row"><div class="pa-f"><label for="if-a">Primera parte</label><input id="if-a" type="text" maxlength="20" autocomplete="off" value="Pibe"></div><div class="pa-f"><label for="if-b">Segunda parte</label><input id="if-b" type="text" maxlength="20" autocomplete="off" value="Ñandú"></div></div>' +
      '<div class="pa-f"><label for="if-c">Invisible</label><select id="if-c">' + chars.map(([c, name]) => '<option value="' + cpHex(c) + '">' + name + ' · ' + cpHex(c) + '</option>').join('') + '</select></div></div>' +
      '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Tu nombre</p><p class="pa-nk pa-big" data-o="nick">Pibe' + HANGUL_FILLER + 'Ñandú</p><p class="pa-src" data-o="show">Pibe[3164]Ñandú</p>' +
      '<div class="pa-share"><button type="button" data-cpnick>Copiar nombre</button><output data-o="copied"></output></div>' +
      '<div class="pa-f" style="margin-top:8px"><label for="if-t">Probador: pegá acá lo que copiaste</label><input id="if-t" type="text" autocomplete="off" spellcheck="false"><small data-o="test">Te mostramos qué caracteres invisibles tiene y cuánto ocupan en este navegador.</small></div></div></div>';
    const honest = sec('Lo que no te podemos asegurar', '<div class="pa-two"><div><p>Garena no publica qué caracteres acepta el nombre de Free Fire. El relleno hangul es el que más se usa, pero el juego puede cambiar sus reglas en cualquier actualización: probalo en el campo del nombre antes de confirmar el cambio.</p><p>Para Unicode ninguno de los dos es un espacio: el relleno hangul es una letra y el braille vacío, un símbolo. Por eso no se borran como un espacio común cuando un programa limpia los bordes de un texto.</p></div>' +
      '<div>' + quote(h, 'hangul_filler') + quote(h, 'uni_hcj') + quote(h, 'uni_braille') + '</div></div>');
    const more = sec('Para el resto del nombre', '<p>Letras negritas, góticas, de doble trazo y adornos, con ideas bien argentinas: <a href="' + h.href('/ff/nombres') + '">generador de nombres para Free Fire</a>.</p>');
    return hero(h, { ey: 'Free Fire · nombre · copiar y pegar', sub: 'Dos caracteres que no se ven pero ocupan lugar, listos para copiar. Armá tu nombre con espacio en el medio y comprobá acá mismo qué copiaste.' }) + copy + build + honest + more;
  },
};
