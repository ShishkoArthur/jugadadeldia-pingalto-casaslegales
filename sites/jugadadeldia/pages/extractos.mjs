// Quiniela results pages: today's grid, one page per jurisdiction we can fill, Nacional and Provincia side by side, the extract finder
// and the frequency of the endings. The numbers come from the server feed (tools/feeds/jugadadeldia/quiniela.mjs ->
// /data/feeds/quiniela*.json, official LOTBA and IPLyC copies, checked against each other); the browser draws them
// (client/extractos.js). The static page carries the frame, the method and what to do when the data is late. No number is typed by hand.
import { JURS, STALE_HOURS } from '../../../engine/lottery/extract.mjs';
import { rules } from '../../../engine/lottery/rules.mjs';
import { fmt } from '../../../engine/games/num.mjs';
import { hero, webPage, crumbs, btn, tiles, ICONS } from './parts.mjs';

const FEED = '/data/feeds/';
const J = Object.fromEntries(JURS.map(j => [j.id, j]));
const PROV_PAGES = [
  ['caba', '/quiniela/nacional/'], ['buenos-aires', '/quiniela/provincia/'], ['cordoba', '/quiniela/cordoba/'],
  ['santa-fe', '/quiniela/santa-fe/'], ['entre-rios', '/quiniela/entre-rios/'], ['mendoza', '/quiniela/mendoza/'],
];
export const PROV_PATH = Object.fromEntries(PROV_PAGES);
const COLORS = ['#ff5a3c', '#2f7cf6', '#16b38a', '#8b5cf6', '#e8930c', '#e0447a'];

const root = (mode, extra = '') => '<div class="jg-xq" data-xq="' + mode + '"' + extra + ' aria-live="polite">';
const loading = '<p class="jg-xw" data-xw>Cargando los extractos…</p><noscript><p class="jg-note">Los extractos se muestran con JavaScript desde nuestra copia de los datos oficiales. Las fuentes están al final de la página.</p></noscript>';
const pageData = h => ({ feed: FEED, stale: STALE_HOURS, paths: Object.fromEntries(PROV_PAGES.filter(([, u]) => h.built(u))) });

function method(h, { two = true } = {}) {
  return '<section class="jg-c w3"><span class="jg-sm">De dónde salen</span><h2>Cómo armamos cada extracto</h2><ul class="jg-ul tx">' +
    '<li>Leemos los resultados oficiales de <b>La Quiniela de la Ciudad (LOTBA)</b>, que publica en la misma página los extractos de la Ciudad, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza.</li>' +
    (two ? '<li>Los comparamos con el <b>extracto oficial de la Provincia de Buenos Aires</b> (IPLyC), que trae Provincia, Ciudad, Córdoba, Santa Fe y Entre Ríos del mismo turno. Si las dos copias coinciden cifra por cifra, el sorteo lleva la marca <b>2 fuentes</b>; si difieren en una sola cifra, no lo mostramos.</li>' : '<li>Mendoza solo llega por la copia de LOTBA: lleva la marca <b>1 fuente</b>.</li>') +
    '<li>Lo revisamos cada 15 minutos desde nuestro servidor. Si una fuente no responde, queda la última copia buena; si pasan más de ' + STALE_HOURS + ' horas sin poder revisar, la página lo dice y no muestra el día como si estuviera al día.</li>' +
    '<li>La copia vale como información. Para cobrar manda el extracto oficial que tiene tu agencia.</li></ul>' +
    '<p class="jg-note">Fuentes: <a href="https://quiniela.loteriadelaciudad.gob.ar/" rel="noopener">quiniela.loteriadelaciudad.gob.ar</a> · <a href="https://loteria.gba.gob.ar/" rel="noopener">loteria.gba.gob.ar</a>. ' + (h.built('/de-donde-salen-los-datos/') ? '<a href="' + h.href('/de-donde-salen-los-datos/') + '">Más sobre nuestros datos</a>.' : '') + '</p></section>';
}
const chance = '<section class="jg-c"><span class="jg-sm">La chance</span><h2>Ningún número avisa</h2><p>Cada terminación de dos cifras tiene la misma chance en cada lugar: <b>1 en 100</b>. Lo que salió ayer no cambia lo que sale hoy.</p></section>';
const provTiles = (h, except) => tiles(h, PROV_PAGES.filter(([id, u]) => u !== except).map(([id, u], i) => [u, 'Quiniela ' + (id === 'caba' ? 'Nacional' : id === 'buenos-aires' ? 'de la Provincia' : 'de ' + J[id].name), id === 'mendoza' ? 'Copia de LOTBA' : 'LOTBA y Provincia, comparadas', COLORS[i % COLORS.length], ICONS.pin]));

export const quinielaHoy = {
  path: '/quiniela/', kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
  title: 'Quiniela de hoy: cabezas y resultados de cada provincia',
  h1: 'Quiniela de hoy: todas las cabezas',
  description: 'La quiniela de hoy en seis jurisdicciones: las cabezas de la Previa a la Nocturna y los 20 números de cada sorteo, de las copias oficiales comparadas.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: pageData,
  render(h) {
    return hero(h, { kicker: 'Quiniela · extractos de hoy', scene: 'quiniela', lede: 'Las cabezas de cada turno en la Ciudad, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza. Tocá una cabeza para ver los 20 números del extracto.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w3"><span class="jg-tag">Hora argentina</span><h2>Las cabezas del día</h2>' + root('hoy') + loading + '</div></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Por provincia</span><h2>El extracto de tu provincia</h2>' + provTiles(h) + '</section>' + chance +
      (h.built('/quiniela/cuanto-paga/') ? '<section class="jg-c w3"><span class="jg-sm">Si te tocó</span><h2>¿Cuánto paga?</h2><p>A 2 cifras a la cabeza, La Quiniela de la Ciudad paga ' + fmt(rules('quiniela', 'lotba-quiniela').pay[2].v, 0) + ' veces lo apostado; a 4 cifras, ' + fmt(rules('quiniela', 'lotba-quiniela').pay[4].v, 0) + '. La cuenta completa, con la chance de cada jugada:</p><div class="jg-r">' + btn(h, '/quiniela/cuanto-paga/', 'Calcular mi premio', true) + btn(h, '/quiniela/extractos/', 'Buscar un sorteo anterior') + '</div></section>' : '') +
      '<section class="jg-c w3"><span class="jg-sm">Para entender la quiniela</span><h2>Herramientas</h2>' + tiles(h, [['/quiniela/horarios/', '¿Hay quiniela hoy?', 'Horarios y cuenta regresiva', '#e8930c', ICONS.pin], ['/quiniela/como-se-juega/', 'Cómo se juega', 'La boleta campo por campo', '#2f7cf6', ICONS.book], ['/quiniela/simulador/', 'Un año jugando', 'Simulador en pesos', '#8b5cf6', ICONS.calc], ['/cuanto-devuelve-cada-juego/', 'Cuánto devuelve cada juego', 'De cada $ 100', '#16b38a', ICONS.calc]]) + '</section>' +
      method(h) + '</div>';
  },
};

function provPage(id, path, o) {
  const j = J[id];
  return {
    path, kind: 'lottery', section: 'quiniela', jurisdiction: id, css: ['extractos.css'], js: ['extractos.js'],
    title: o.title, h1: o.h1, description: o.description,
    ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : [])],
    data: h => ({ ...pageData(h), jur: id, rules: o.rules || null }),
    render(h) {
      return hero(h, { kicker: 'Quiniela · ' + j.long, scene: o.scene, lede: o.lede }) +
        '<div class="jg-mn">' +
        '<section class="jg-c w3"><span class="jg-tag" data-xs>' + (j.pba ? 'LOTBA y Provincia' : 'Copia de LOTBA') + '</span><h2>El último sorteo</h2>' + root('jur', ' data-jur="' + id + '"') + loading + '</div></section>' +
        '<section class="jg-c w2"><span class="jg-sm">Tu número</span><h2>¿Salió mi número?</h2><form class="jg-f jg-xf" data-xchk><label class="jg-fl"><span>Tu número (2, 3 o 4 cifras)</span><input class="jg-in" name="n" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="47"></label>' +
        (o.rules ? '<label class="jg-fl"><span>Apostaste (pesos, opcional)</span><input class="jg-in" name="s" type="text" inputmode="decimal" autocomplete="off" placeholder="100"></label><label class="jg-fl"><span>Ubicación</span><select class="jg-se" name="u"><option value="1">A la cabeza</option><option value="5">A los 5</option><option value="10">A los 10</option><option value="20">A los 20</option></select></label>' : '') +
        '</form><div data-xchk-out class="jg-xo"></div><p class="jg-note">Buscamos tu número en los sorteos de esta semana de ' + h.esc(j.long) + '. Tu número no sale de esta página.' + (o.rules ? ' El premio lo calcula el código con el reglamento de ' + (o.rules === 'lotba-quiniela' ? 'La Quiniela de la Ciudad' : 'la Provincia') + '.' : '') + '</p></section>' + chance +
        '<section class="jg-c w3"><span class="jg-sm">La semana</span><h2>Las cabezas de los últimos días</h2><div data-xweek><p class="jg-xw">Cargando…</p></div></section>' +
        (o.extra ? o.extra(h) : '') +
        '<section class="jg-c w3"><span class="jg-sm">Otras provincias</span><h2>Más extractos</h2>' + provTiles(h, path) + '<div class="jg-r">' + btn(h, '/quiniela/', 'Todas las cabezas de hoy', true) + btn(h, '/quiniela/numeros-que-mas-salen/', 'Los números que más salen') + '</div></section>' +
        method(h, { two: !!j.pba }) + '</div>';
    },
  };
}

export const provPages = [
  provPage('caba', '/quiniela/nacional/', {
    title: 'Quiniela Nacional de hoy: resultados de la Ciudad', h1: 'Quiniela Nacional (de la Ciudad)', scene: 'quiniela-nacional', rules: 'lotba-quiniela',
    description: 'La Quiniela Nacional de hoy, de la Ciudad de Buenos Aires: el último sorteo en grande, las cabezas de la semana y cuánto cobraba tu número.',
    lede: 'La «Nacional» que se juega en todo el país hoy es La Quiniela de la Ciudad (LOTBA). Acá está su último extracto completo y las cabezas de la semana.',
  }),
  provPage('buenos-aires', '/quiniela/provincia/', {
    title: 'Quiniela de la Provincia de Buenos Aires: extractos de hoy', h1: 'Quiniela de la Provincia', scene: 'quiniela-provincia', rules: 'pba-quiniela',
    description: 'Quiniela de la Provincia de Buenos Aires de hoy: el extracto oficial del día, los últimos siete días y cuánto cobraba tu número, con la ayuda bonaerense.',
    lede: 'El extracto de la Lotería de la Provincia (IPLyC) de cada turno, comparado con la copia que publica LOTBA, y las cabezas de los últimos siete días.',
  }),
  provPage('cordoba', '/quiniela/cordoba/', {
    title: 'Quiniela de Córdoba: extractos de hoy y anteriores', h1: 'Quiniela de Córdoba', scene: 'quiniela-cordoba',
    description: 'Quiniela de Córdoba: extractos de hoy y de la semana, de las copias oficiales de LOTBA y de la Provincia comparadas número por número, con la ayuda local.',
    lede: 'El extracto de Córdoba de cada turno, tal como lo republican LOTBA y la Provincia de Buenos Aires, comparado cifra por cifra.',
  }),
  provPage('santa-fe', '/quiniela/santa-fe/', {
    title: 'Quiniela de Santa Fe: resultados y turnos', h1: 'Quiniela de Santa Fe',
    description: 'Quiniela de Santa Fe: resultados de cada turno y extractos de la semana, de las copias oficiales de LOTBA y de la Provincia de Buenos Aires, comparadas.',
    lede: 'El extracto de Santa Fe de cada turno, tal como lo republican LOTBA y la Provincia de Buenos Aires, comparado cifra por cifra.',
  }),
  provPage('entre-rios', '/quiniela/entre-rios/', {
    title: 'Quiniela de Entre Ríos: resultados del día', h1: 'Quiniela de Entre Ríos',
    description: 'Quiniela de Entre Ríos: resultados del día y extractos de la semana, de las copias oficiales de LOTBA y de la Provincia comparadas cifra por cifra.',
    lede: 'El extracto de Entre Ríos de cada turno, tal como lo republican LOTBA y la Provincia de Buenos Aires, comparado cifra por cifra.',
  }),
  provPage('mendoza', '/quiniela/mendoza/', {
    title: 'Quiniela de Mendoza hoy: resultados de cada turno', h1: 'Quiniela de Mendoza', scene: 'quiniela-mendoza',
    description: 'Quiniela de Mendoza de hoy: los resultados de cada turno y las cabezas de la semana, de la copia oficial que publica LOTBA, y la línea de ayuda de Mendoza.',
    lede: 'El extracto de Mendoza de cada turno, de la copia oficial que publica La Quiniela de la Ciudad. Es la única copia que podemos leer: lleva la marca «1 fuente».',
  }),
];

export const nacionalYProvincia = {
  path: '/quiniela/nacional-y-provincia/', kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
  title: 'Quiniela Nacional y Provincia: los dos sorteos, lado a lado',
  h1: 'Nacional y Provincia, lado a lado',
  description: 'La Nacional y la Provincia del mismo turno, una al lado de la otra, con las terminaciones que coinciden marcadas. Elegí el turno y el día de la semana.',
  ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : [])],
  data: pageData,
  render(h) {
    return hero(h, { kicker: 'Quiniela · comparación', scene: 'quiniela-nacional-y-provincia', lede: 'Los dos extractos del mismo turno, lugar por lugar. Las terminaciones de dos cifras que salen en los dos quedan marcadas.' }) +
      '<div class="jg-mn"><section class="jg-c w3"><span class="jg-tag">Mismo turno</span><h2>Los 20 números de cada una</h2>' + root('nyp') + loading + '</div></section>' +
      '<section class="jg-c w2"><span class="jg-sm">¿Casualidad?</span><h2>Que coincidan es lo normal</h2><p>Con 20 números de cada lado, lo esperable es que <b>alguna terminación se repita</b> entre los dos extractos casi siempre. La página cuenta cuántas veces pasó en la semana y lo compara con lo que da el azar.</p><div data-xnyp-week></div></section>' + chance +
      method(h) + '</div>';
  },
};

export const extractosPage = {
  path: '/quiniela/extractos/', kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
  title: 'Extractos de la quiniela: buscá cualquier sorteo por fecha',
  h1: 'Extractos anteriores de la quiniela',
  description: 'Buscá el extracto de cualquier sorteo de la quiniela de los últimos meses por fecha, provincia y turno, y fijate cuándo salió un número a la cabeza.',
  ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : [])],
  data: pageData,
  render(h) {
    return hero(h, { kicker: 'Quiniela · archivo', lede: 'Elegí el día, el turno y la provincia y mirá los 20 números. O escribí una terminación y te decimos cuántas veces salió a la cabeza.' }) +
      '<div class="jg-mn"><section class="jg-c w3"><span class="jg-tag" data-xrange>Archivo</span><h2>Buscá un sorteo</h2>' + root('ext') + loading + '</div></section>' +
      '<section class="jg-c w3"><span class="jg-sm">Una terminación</span><h2>¿Cuándo salió a la cabeza?</h2><form class="jg-f jg-xf" data-xwhen><label class="jg-fl"><span>Terminación (00 a 99)</span><input class="jg-in" name="n" type="text" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="47"></label><label class="jg-fl"><span>Provincia</span><select class="jg-se" name="j">' +
      JURS.map(j => '<option value="' + j.id + '">' + h.esc(j.long) + '</option>').join('') + '</select></label></form><div data-xwhen-out class="jg-xo"></div></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Ojo</span><h2>Lo esperable</h2><p>En 100 sorteos, una terminación sale a la cabeza <b>una vez en promedio</b>. Que lleve semanas sin salir no la hace más probable: cada sorteo empieza de cero.</p></section>' + chance +
      method(h) + '</div>';
  },
};

export const numerosPage = {
  path: '/quiniela/numeros-que-mas-salen/', kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
  title: 'Números que más salen en la quiniela: ¿sirve saberlo?',
  h1: 'Los números que más salen, puestos a prueba',
  description: 'Los números que más salen en la quiniela de cada provincia, en un mapa de calor comparado con un sorteo al azar. Mirá por qué los atrasados no avisan nada.',
  ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : [])],
  data: pageData,
  render(h) {
    return hero(h, { kicker: 'Quiniela · frecuencias', lede: 'Contamos cuántas veces salió cada terminación del 00 al 99 en los sorteos de los últimos meses y lo ponemos al lado de un sorteo inventado por la compu, con la misma cantidad de extractos.' }) +
      '<div class="jg-mn"><section class="jg-c w3"><span class="jg-tag" data-xrange>Archivo</span><h2>El mapa de calor</h2>' + root('freq') + loading + '</div></section>' +
      '<section class="jg-c w2"><span class="jg-sm">La cuenta</span><h2>¿Es más desparejo que el azar?</h2><p>Para eso está la prueba de chi cuadrado: compara lo que salió con lo esperable (la misma cantidad para cada terminación) y dice cada cuánto el puro azar da un desorden así o mayor. Si ese número es alto, no hay nada raro.</p><div data-xchi></div></section>' +
      '<section class="jg-c"><span class="jg-sm">La chance</span><h2>1 en 100, siempre</h2><p>La terminación que más salió y la que menos tienen la misma chance en el próximo sorteo: <b>1 en 100</b> a la cabeza. Las bolillas no se acuerdan.</p></section>' +
      method(h) + '</div>';
  },
};

export const EXTRACT_PAGES = [quinielaHoy, ...provPages, nacionalYProvincia, extractosPage, numerosPage];
