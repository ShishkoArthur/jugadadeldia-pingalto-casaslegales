// Quiniela results pages: today's grid, one page per jurisdiction we can fill, Nacional and Provincia side by side, the extract finder
// and the frequency of the endings. The numbers come from the server feed (tools/feeds/jugadadeldia/quiniela.mjs ->
// /data/feeds/quiniela*.json, official LOTBA and IPLyC copies, checked against each other); the browser draws them
// (client/extractos.js). The static page carries the frame, the method and what to do when the data is late. No number is typed by hand.
import { JURS, STALE_HOURS } from '../../../engine/lottery/extract.mjs';
import { rules } from '../../../engine/lottery/rules.mjs';
import { fmt } from '../../../engine/games/num.mjs';
import { hero, webPage, crumbs, btn, tiles, ICONS, cite, faq, faqLd } from './parts.mjs';
import { program } from './guias.mjs';
import { PROG_TYPES } from '../../../engine/lottery/programa.mjs';

const FEED = '/data/feeds/';
const J = Object.fromEntries(JURS.map(j => [j.id, j]));
const PROV_PAGES = [
  ['caba', '/quiniela/nacional/'], ['buenos-aires', '/quiniela/provincia/'], ['cordoba', '/quiniela/cordoba/'],
  ['santa-fe', '/quiniela/santa-fe/'], ['entre-rios', '/quiniela/entre-rios/'], ['mendoza', '/quiniela/mendoza/'],
];
export const PROV_PATH = Object.fromEntries(PROV_PAGES);
// Provinces with their own official page in the feed `provincias` (tools/feeds/jugadadeldia/provincias.mjs): built in pages/provincias.mjs.
export const PV_PAGES = [
  ['tucuman', '/quiniela/tucuman/', 'Quiniela de Tucumán', 'Caja Popular, cinco sorteos'],
  ['chaco', '/quiniela/chaco/', 'Quiniela Chaqueña', 'Lotería Chaqueña'],
  ['corrientes', '/quiniela/corrientes/', 'Quiniela Correntina', 'Copia de la Lotería Chaqueña'],
  ['san-juan', '/quiniela/san-juan/', 'Quiniela de San Juan', 'Caja de Acción Social'],
  ['misiones', '/quiniela/misiones/', 'Quiniela Misionera', 'IPLyC Misiones, con la Plus'],
];
const pvPaths = h => Object.fromEntries(PV_PAGES.filter(([, u]) => h.built(u)).flatMap(([id, u]) => id === 'misiones' ? [[id, u], ['misiones-plus', u]] : [[id, u]]));
const COLORS = ['#ff5a3c', '#2f7cf6', '#16b38a', '#8b5cf6', '#e8930c', '#e0447a'];

export const root = (mode, extra = '') => '<div class="jg-xq" data-xq="' + mode + '"' + extra + ' aria-live="polite">';
export const loading = '<p class="jg-xw" data-xw>Cargando los extractos…</p><noscript><p class="jg-note">Los extractos se muestran con JavaScript desde nuestra copia de los datos oficiales. Las fuentes están al final de la página.</p></noscript>';
export const pageData = h => ({ feed: FEED, stale: STALE_HOURS, paths: Object.fromEntries(PROV_PAGES.filter(([, u]) => h.built(u))), ppaths: pvPaths(h), tpaths: Object.fromEntries(TURNS.filter(x => h.built(x.path)).map(x => [x.t, x.path])) });

export function method(h, { two = true } = {}) {
  return '<section class="jg-c w3"><span class="jg-sm">De dónde salen</span><h2>Cómo armamos cada extracto</h2><ul class="jg-ul tx">' +
    '<li>Leemos los resultados oficiales de <b>La Quiniela de la Ciudad (LOTBA)</b>, que publica en la misma página los extractos de la Ciudad, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza.</li>' +
    (two ? '<li>Los comparamos con el <b>extracto oficial de la Provincia de Buenos Aires</b> (IPLyC), que trae Provincia, Ciudad, Córdoba, Santa Fe y Entre Ríos del mismo turno. Si las dos copias coinciden cifra por cifra, el sorteo lleva la marca <b>2 fuentes</b>; si difieren en una sola cifra, no lo mostramos.</li>' : '<li>Mendoza solo llega por la copia de LOTBA: lleva la marca <b>1 fuente</b>.</li>') +
    '<li>Lo revisamos cada 15 minutos desde nuestro servidor. Si una fuente no responde, queda la última copia buena; si pasan más de ' + STALE_HOURS + ' horas sin poder revisar, la página lo dice y no muestra el día como si estuviera al día.</li>' +
    '<li>La copia vale como información. Para cobrar manda el extracto oficial que tiene tu agencia.</li></ul>' +
    '<p class="jg-note">Fuentes: <a href="https://quiniela.loteriadelaciudad.gob.ar/" rel="noopener">quiniela.loteriadelaciudad.gob.ar</a> · <a href="https://loteria.gba.gob.ar/" rel="noopener">loteria.gba.gob.ar</a>. ' + (h.built('/de-donde-salen-los-datos/') ? '<a href="' + h.href('/de-donde-salen-los-datos/') + '">Más sobre nuestros datos</a>.' : '') + '</p></section>';
}
export const chance = '<section class="jg-c"><span class="jg-sm">La chance</span><h2>Ningún número avisa</h2><p>Cada terminación de dos cifras tiene la misma chance en cada lugar: <b>1 en 100</b>. Lo que salió ayer no cambia lo que sale hoy.</p></section>';
export const provTiles = (h, except) => tiles(h, [...PROV_PAGES.map(([id, u]) => [u, 'Quiniela ' + (id === 'caba' ? 'Nacional' : id === 'buenos-aires' ? 'de la Provincia' : 'de ' + J[id].name), id === 'mendoza' ? 'Copia de LOTBA' : 'LOTBA y Provincia, comparadas']), ...PV_PAGES.map(([, u, t, sub]) => [u, t, sub])]
  .filter(([u]) => u !== except).map(([u, t, sub], i) => [u, t, sub, COLORS[i % COLORS.length], ICONS.pin]));
const otras = h => PV_PAGES.some(([, u]) => h.built(u)) ? '<section class="jg-c w3"><span class="jg-tag">Más provincias</span><h2>Tucumán, Chaco, Corrientes, San Juan y Misiones</h2>' + root('otras') + loading + '</div><p class="jg-note">Cada provincia tiene sus propios turnos y horarios: tocá una para ver sus extractos completos.</p></section>' : '';

export const quinielaHoy = {
  path: '/quiniela/', kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
  title: 'Quiniela de hoy en vivo: resultados y cabezas por provincia',
  h1: 'Quiniela de hoy en vivo: todas las cabezas',
  description: 'La quiniela de hoy en vivo, revisada cada 15 minutos: cabezas y extractos de la Nacional, la Provincia, Córdoba, Santa Fe, Tucumán, Chaco y más.',
  ld: h => [webPage(h), crumbs(h, [])],
  data: pageData,
  render(h) {
    return hero(h, { kicker: 'Quiniela · extractos de hoy', scene: 'quiniela', lede: 'Las cabezas de cada turno en la Ciudad, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza, a medida que salen, y más abajo Tucumán, Chaco, Corrientes, San Juan y Misiones: revisamos las fuentes oficiales cada 15 minutos. Tocá una cabeza para ver los 20 números del extracto.' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w3"><span class="jg-tag">Hora argentina</span><h2>Las cabezas del día</h2>' + root('hoy') + loading + '</div></section>' +
      otras(h) + '<section class="jg-c w2"><span class="jg-sm">Por provincia</span><h2>El extracto de tu provincia</h2>' + provTiles(h) + '</section>' + chance +
      '<section class="jg-c w3"><span class="jg-sm">Por turno</span><h2>Un turno en todas las provincias</h2>' + turnTiles(h) + '</section>' +
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
    title: 'Quiniela Nacional de hoy: la Nocturna y todos los turnos', h1: 'Quiniela Nacional de hoy', scene: 'quiniela-nacional', rules: 'lotba-quiniela',
    description: 'La Quiniela Nacional de hoy (Ciudad de Buenos Aires), de la Previa a la Nocturna de las 21: el último sorteo en grande, la semana y cuánto cobra tu número.',
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
  title: 'Quiniela Nacional y Provincia de hoy en vivo, turno a turno',
  h1: 'Nacional y Provincia, lado a lado',
  description: 'La Nacional y la Provincia de hoy, del mismo turno y lado a lado, de la Previa a la Nocturna, con las terminaciones que coinciden marcadas. Elegí el turno.',
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
  title: 'Extractos de la quiniela de ayer y anteriores, por fecha',
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

// One page per turn (owner keys: "quiniela nocturna" 110k, "matutina" 40k, "vespertina" 18k, "previa" 15k): the latest draw of that
// turn in every jurisdiction of the feed, the cabezas of that turn over the week, and the hour from the saved LOTBA programme.
const TURNS = [
  { t: 'NOCT', path: '/quiniela/nocturna/', fact: 'lotba.quiniela.time-nocturna' },
  { t: 'MATU', path: '/quiniela/matutina/', fact: 'lotba.quiniela.time-matutina' },
  { t: 'VESP', path: '/quiniela/vespertina/', fact: 'lotba.quiniela.time-vespertina' },
  { t: 'PRIM', path: '/quiniela/la-primera/', fact: 'lotba.quiniela.time-primera' },
  { t: 'PREV', path: '/quiniela/la-previa/', fact: 'lotba.quiniela.time-previa' },
];
const TURN_TEXT = {
  NOCT: { title: n => 'Quiniela Nocturna de hoy en vivo: Nacional, Provincia y más', d: x => 'La Quiniela Nocturna de hoy, de las ' + x + ': la cabeza y los 20 números de la Nacional, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza.' },
  MATU: { title: n => 'Quiniela Matutina de hoy: cabezas de Nacional y Provincia', d: x => 'La Quiniela Matutina de hoy, de las ' + x + ': cabezas y extractos de la Nacional, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza, y la semana.' },
  VESP: { title: n => 'Quiniela Vespertina de hoy: cabezas de Nacional y Provincia', d: x => 'La Quiniela Vespertina de hoy, de las ' + x + ': cabezas y extractos de la Nacional, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza, y la semana.' },
  PRIM: { title: n => 'Quiniela La Primera de hoy: cabezas de cada provincia', d: x => 'La Primera de la quiniela de hoy, de las ' + x + ': la cabeza y los 20 números de la Nacional, la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza.' },
  PREV: { title: n => 'Quiniela La Previa de hoy: cabezas de cada provincia', d: x => 'La Previa de la quiniela de hoy, de las ' + x + ': el primer sorteo del día con su cabeza y los 20 números de la Nacional, la Provincia y más.' },
};
const TURN_PV = { NOCT: 'La Nocturna', MATU: 'La Matutina', VESP: 'La Vespertina', PRIM: 'La Primera', PREV: 'La Previa' };
const turnName = t => PROG_TYPES.find(x => x.turno === t).name;
// 'la Matutina' but 'La Previa' (the article is part of some turn names)
const theTurn = (n, cap) => /^La /.test(n) ? (cap ? n : 'la ' + n.slice(3)) : (cap ? 'La ' : 'la ') + n;
const turnTime = t => { const name = turnName(t), set = [...new Set(program().rows.filter(r => r.type === name).map(r => r.t))]; return set.join(' / '); };
const turnTiles = (h, except) => tiles(h, TURNS.filter(x => x.path !== except).map((x, i) => [x.path, turnName(x.t), 'a las ' + turnTime(x.t), COLORS[(i + 2) % COLORS.length], ICONS.pin]));

// FAQ of the Nocturna page: the hours from the saved LOTBA programme, the Quiniela Plus rule of the Provincia and, when the Tucumán
// page is built, the hours of the Caja Popular list.
const NOCT_FAQ_SRC = h => ['lotba.quiniela.time-nocturna', 'lotba.quiniela.saturday-nocturna', 'pba.qplus.nocturna'].concat(h.built('/quiniela/tucuman/') ? ['cajapopular.quiniela.time-nocturno', 'cajapopular.quiniela.time-nocturno-20'] : []);
function noctFaq(h) {
  const time = turnTime('NOCT');
  return [
    ['¿A qué hora sale la Quiniela Nocturna?', 'A las ' + time + ', hora argentina, según el programa oficial de la Lotería de la Ciudad. Esta página revisa los extractos oficiales cada 15 minutos y muestra la Nocturna apenas está publicada.'],
    ['¿Hay Nocturna los sábados?', 'Sí. En el programa oficial de la Lotería de la Ciudad el sábado también tiene Nocturna, a las ' + h.src.value('lotba.quiniela.saturday-nocturna') + '.'],
    ['¿Qué se resuelve con la Nocturna de la Provincia?', 'La Quiniela Plus: se sortea con la Nocturna de la Provincia, de lunes a sábados a las ' + h.src.value('pba.qplus.nocturna') + ' hs.'],
    ...(h.built('/quiniela/tucuman/') ? [['¿La Nocturna de Tucumán sale a la misma hora?', 'No: cada lotería sortea a su hora. En la lista de sorteos de la Caja Popular de Tucumán el Nocturno figura a las ' + h.src.value('cajapopular.quiniela.time-nocturno') + ', y también hay un Nocturno a las ' + h.src.value('cajapopular.quiniela.time-nocturno-20') + '.']] : []),
    ['¿Hay números que salen más en la Nocturna?', 'No. Cada terminación de dos cifras tiene <b>1 en 100</b> de salir a la cabeza, en la Nocturna y en cualquier turno. Lo que salió ayer no cambia lo que sale hoy.'],
  ];
}

function turnPage(T) {
  const name = turnName(T.t), tx = TURN_TEXT[T.t];
  return {
    path: T.path, kind: 'lottery', section: 'quiniela', css: ['extractos.css'], js: ['extractos.js'],
    get title() { return tx.title(name); }, h1: 'Quiniela ' + name + ' de hoy',
    get description() { return tx.d(turnTime(T.t)); },
    ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : []), ...(T.t === 'NOCT' ? [faqLd(noctFaq(h))] : [])],
    data: h => ({ ...pageData(h), turno: T.t }),
    render(h) {
      const time = turnTime(T.t);
      return hero(h, { kicker: 'Quiniela · ' + time + ' hs, hora argentina', scene: true, lede: theTurn(name, true) + ' se sortea a las <b>' + time + '</b>. Acá está su último extracto en la Ciudad (Nacional), la Provincia, Córdoba, Santa Fe, Entre Ríos y Mendoza, y la página se actualiza sola cada 15 minutos.', actions: '<a class="jg-b p" href="#turno">Ver ' + h.esc(theTurn(name)) + '</a>' + btn(h, '/quiniela/cuanto-paga/', '¿Cuánto paga?') }) +
        '<div class="jg-mn">' +
        '<section class="jg-c w3" id="turno"><span class="jg-tag">' + h.esc(name) + ' · ' + time + ' hs</span><h2>' + h.esc(theTurn(name, true)) + ', provincia por provincia</h2>' + root('turno', ' data-t="' + T.t + '"') + loading + '</div></section>' +
        '<section class="jg-c w3"><span class="jg-sm">La semana</span><h2>Las cabezas de ' + h.esc(theTurn(name)) + ', día por día</h2><div data-xtweek><p class="jg-xw">Cargando…</p></div></section>' +
        (PV_PAGES.some(([, u]) => h.built(u)) ? '<section class="jg-c w3"><span class="jg-sm">Otras provincias</span><h2>' + h.esc(TURN_PV[T.t]) + ' en otras provincias</h2>' + root('tprov', ' data-t="' + T.t + '"') + loading + '</div><p class="jg-note">Cada lotería sortea a su hora: la hora de cada provincia es la que publica su lotería, si la publica.</p></section>' : '') +
        (T.t === 'NOCT' && h.built('/quiniela-plus/') ? '<section class="jg-c w2"><span class="jg-sm">Con la Nocturna</span><h2>Quiniela Plus</h2><p>La Quiniela Plus de la Provincia se resuelve con los 20 números de la Nocturna de la Provincia, de lunes a sábados a las ' + h.src.value('pba.qplus.nocturna') + '.</p><div class="jg-r">' + btn(h, '/quiniela-plus/', 'Controlar mi Quiniela Plus', true) + btn(h, '/quiniela/nacional-y-provincia/', 'Nacional y Provincia, lado a lado') + '</div>' + cite(h, ['pba.qplus.nocturna']) + '</section>' : '') +
        chance +
        '<section class="jg-c w3"><span class="jg-sm">Los otros turnos</span><h2>Toda la quiniela del día</h2>' + turnTiles(h, T.path) + '<div class="jg-r">' + btn(h, '/quiniela/', 'Todas las cabezas de hoy', true) + btn(h, '/quiniela/horarios/', '¿Hay quiniela hoy?') + btn(h, '/quiniela/extractos/', 'Buscar un sorteo anterior') + '</div>' + cite(h, [T.fact], 'El horario, del programa oficial') + '</section>' +
        (T.t === 'NOCT' ? faq(h, 'Preguntas sobre la Nocturna', noctFaq(h), NOCT_FAQ_SRC(h)) : '') +
        method(h) + '</div>';
    },
  };
}
export const turnPages = TURNS.map(turnPage);
export const TURN_PATHS = Object.fromEntries(TURNS.map(x => [x.t, x.path]));

export const EXTRACT_PAGES = [quinielaHoy, ...turnPages, ...provPages, nacionalYProvincia, extractosPage, numerosPage];
