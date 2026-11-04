// Quiniela of the provinces that publish their own extracts on an official page we can read (feed `provincias`,
// tools/feeds/jugadadeldia/provincias.mjs -> /data/feeds/provincias.json and provincias-archivo.json): Tucumán (Caja Popular API),
// San Juan (CAS), Chaco and Corrientes (Lotería Chaqueña page, checked against our LOTBA/PBA copies), Misiones and Misionera Plus
// (IPLyC page, checked the same way). The browser draws the numbers (client/extractos.js, modes pv, pvweek, pvarch, pvfreq); the
// static page carries the frame, the method, the official address and, for Tucumán, the hours cited from the Caja Popular API.
// Each page has its own intro and order of blocks (plan note: not a template). No number is typed by hand.
import { hero, webPage, crumbs, btn, cite, faq, faqLd } from './parts.mjs';
import { root, loading, chance, provTiles, pageData, PV_PAGES } from './extractos.mjs';
import feed from '../../../tools/feeds/jugadadeldia/provincias.mjs';

const TUC_TIMES = [['MATU', 'Matutino', 'matutino'], ['VESP', 'Vespertino', 'vespertino'], ['SIES', 'De la Siesta', 'siesta'], ['TARD', 'De la Tarde', 'tarde'], ['NOCT', 'Nocturno', 'nocturno']];
const tucTimes = h => Object.fromEntries(TUC_TIMES.map(([t, , f]) => [t, h.src.value('cajapopular.quiniela.time-' + f)]));

const SRC = {
  tucuman: { host: 'resultadosquiniela.cajapopular.gov.ar', url: 'https://resultadosquiniela.cajapopular.gov.ar/', who: 'la Caja Popular de Ahorros de la Provincia de Tucumán' },
  'san-juan': { host: 'cas.gob.ar', url: 'https://cas.gob.ar/', who: 'la Caja de Acción Social de San Juan (CAS)' },
  chaco: { host: 'loteria.chaco.gov.ar', url: 'https://loteria.chaco.gov.ar/', who: 'la Lotería Chaqueña' },
  corrientes: { host: 'loteria.chaco.gov.ar', url: 'https://loteria.chaco.gov.ar/', who: 'la Lotería Chaqueña, que publica también la Correntina' },
  misiones: { host: 'loteriademisiones.com.ar', url: 'https://www.loteriademisiones.com.ar/portal/', who: 'el IPLyC de Misiones' },
};

const today = (id, title) => '<section class="jg-c w3" id="hoy"><span class="jg-tag">Hora argentina</span><h2>' + title + '</h2>' + root('pv', ' data-jur="' + id + '"') + loading + '</div></section>';
const week = (id, name) => '<section class="jg-c w3"><span class="jg-sm">Los últimos días</span><h2>Las cabezas de la ' + name + ', día por día</h2><div class="jg-xq" data-xq="pvweek" data-jur="' + id + '"><p class="jg-xw">Cargando…</p></div><p class="jg-note">Tocá una cabeza para ver su extracto completo arriba.</p></section>';
const check = (id, name) => '<section class="jg-c w2"><span class="jg-sm">Tu número</span><h2>¿Salió mi número?</h2><form class="jg-f jg-xf" data-xchk="' + id + '"><label class="jg-fl"><span>Tu número (2, 3 o 4 cifras)</span><input class="jg-in" name="n" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="47"></label></form><div data-xchk-out="' + id + '" class="jg-xo"></div><p class="jg-note">Lo buscamos en los sorteos de los últimos días de la ' + name + ', en los 20 lugares. Tu número no sale de esta página. Lo que cobra cada ubicación lo dice el reglamento de tu lotería y tu agencia.</p></section>';
const arch = (id, name) => '<section class="jg-c w3"><span class="jg-sm" data-xrange="' + id + '">Archivo</span><h2>Sorteos anteriores de la ' + name + '</h2><div class="jg-xq" data-xq="pvarch" data-jur="' + id + '"><p class="jg-xw">Cargando…</p></div></section>';
const freq = (id, name) => '<section class="jg-c w3"><span class="jg-sm">Frecuencias</span><h2>Los números que más salieron en la ' + name + '</h2><div class="jg-xq" data-xq="pvfreq" data-jur="' + id + '"><p class="jg-xw">Cargando…</p></div><p class="jg-note">Más oscuro: salió más de lo esperable; más claro: menos. Con pocos sorteos el mapa es casi puro azar: cada terminación tiene <b>1 en 100</b> de salir a la cabeza en el próximo.</p></section>';
function method(h, id, lines) {
  const s = SRC[id];
  return '<section class="jg-c w3"><span class="jg-sm">De dónde salen</span><h2>Cómo copiamos cada extracto</h2><ul class="jg-ul tx">' + lines.map(l => '<li>' + l + '</li>').join('') +
    '<li>Revisamos la fuente cada 15 minutos desde nuestro servidor. Si no responde, queda la última copia buena; si pasan más de ' + feed.maxAgeHours + ' horas sin poder revisar, la página dice «Sin datos» y no muestra el día como si estuviera al día.</li>' +
    '<li>La copia vale como información. Para cobrar manda el extracto oficial que tiene tu agencia.</li></ul>' +
    '<p class="jg-note">Fuente oficial: <a href="' + s.url + '" rel="noopener">' + s.host + '</a>' + (h.built('/de-donde-salen-los-datos/') ? ' · <a href="' + h.href('/de-donde-salen-los-datos/') + '">Más sobre nuestros datos</a>' : '') + '.</p></section>';
}
const more = (h, path) => '<section class="jg-c w3"><span class="jg-sm">Otras provincias</span><h2>Más extractos</h2>' + provTiles(h, path) + '<div class="jg-r">' + btn(h, '/quiniela/', 'Todas las cabezas de hoy', true) + btn(h, '/quiniela/nocturna/', 'La Nocturna en todas las provincias') + '</div></section>';
const checked = '<li>La misma página oficial trae también extractos de la Ciudad, la Provincia y Córdoba (o Santa Fe) del mismo turno. La usamos solo si esas columnas coinciden <b>cifra por cifra</b> con nuestras copias de LOTBA y de la Provincia: si una sola difiere, ese sorteo no se publica. Por eso lleva la marca <b>verificada</b>.</li>';

function pvPage(id, o) {
  const [, path] = PV_PAGES.find(p => p[0] === id);
  return {
    path, kind: 'lottery', section: 'quiniela', jurisdiction: id, css: ['extractos.css'], js: ['extractos.js'],
    title: o.title, h1: o.h1, description: o.description,
    ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : []), ...(o.faq ? [faqLd(o.faq(h))] : [])],
    data: h => ({ ...pageData(h), jur: id, times: o.times ? o.times(h) : null }),
    render(h) {
      return hero(h, { kicker: o.kicker, scene: true, lede: o.lede(h), actions: '<a class="jg-b p" href="#hoy">' + o.cta + '</a>' + btn(h, '/quiniela/cuanto-paga/', '¿Cuánto paga?') }) +
        '<div class="jg-mn">' + o.blocks(h).join('') + '</div>';
    },
  };
}

function tucFaq(h) {
  const t = tucTimes(h);
  return [
    ['¿Cuántos sorteos tiene la quiniela de Tucumán por día?', 'Cinco: Matutino (' + t.MATU + '), Vespertino (' + t.VESP + '), De la Siesta (' + t.SIES + '), De la Tarde (' + t.TARD + ') y Nocturno (' + t.NOCT + '), en hora argentina, según la lista de sorteos que publica la Caja Popular de Ahorros.'],
    ['¿A qué hora sale el Nocturno de Tucumán?', 'A las ' + t.NOCT + ' según la lista de la Caja Popular, que trae además un Nocturno a las ' + h.src.value('cajapopular.quiniela.time-nocturno-20') + '. Si un día sale a esa hora, el extracto de arriba lo dice.'],
    ['¿De dónde salen estos números?', 'Del sitio oficial de resultados de la Caja Popular de Ahorros de Tucumán, que revisamos cada 15 minutos. Ninguna otra lotería oficial republica la quiniela tucumana, así que cada extracto lleva la marca «1 fuente».'],
    ['¿Me sirve esta página para cobrar?', 'No. La copia vale como información: para cobrar manda el extracto oficial que tiene tu agencia.'],
    ['¿Hay números que salen más en Tucumán?', 'No. Cada terminación de dos cifras tiene <b>1 en 100</b> de salir a la cabeza en cada sorteo, sin importar lo que salió antes. El mapa de frecuencias muestra cuánto salió cada una, no lo que va a salir.'],
  ];
}

const tucuman = pvPage('tucuman', {
  title: 'Quiniela de Tucumán hoy: resultados del último sorteo',
  h1: 'Quiniela de Tucumán de hoy',
  description: 'Quiniela de Tucumán de hoy: los resultados de los cinco sorteos de la Caja Popular, del Matutino al Nocturno, el último extracto y los anteriores.',
  kicker: 'Quiniela · Tucumán · Caja Popular',
  cta: 'Ver el último sorteo',
  times: tucTimes,
  faq: tucFaq,
  lede: h => 'La Caja Popular de Ahorros sortea la quiniela tucumana cinco veces por día: Matutino, Vespertino, De la Siesta, De la Tarde y Nocturno. Copiamos cada extracto de su sitio oficial de resultados a los pocos minutos: el último sorteo queda arriba, con sus 20 números.',
  blocks: h => {
    const t = tucTimes(h);
    const hours = '<section class="jg-c w2"><span class="jg-sm">Horarios</span><h2>¿A qué hora sale cada sorteo?</h2><div class="jg-tw"><table class="jg-tbl"><thead><tr><th>Sorteo</th><th class="n">Hora</th></tr></thead><tbody>' +
      TUC_TIMES.map(([k, name]) => '<tr><td>' + name + '</td><td class="n">' + t[k] + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="jg-note">Hora argentina, según la lista de sorteos que publica la Caja Popular. Esa lista trae además un Nocturno a las ' + h.src.value('cajapopular.quiniela.time-nocturno-20') + ': si un día el Nocturno sale a esa hora, el extracto de arriba lo dice.</p>' +
      cite(h, TUC_TIMES.map(([, , f]) => 'cajapopular.quiniela.time-' + f).concat('cajapopular.quiniela.time-nocturno-20'), 'De dónde salen los horarios') + '</section>';
    return [today('tucuman', 'El último sorteo y los cinco de hoy'), hours, check('tucuman', 'Quiniela de Tucumán'), week('tucuman', 'Quiniela de Tucumán'), arch('tucuman', 'Quiniela de Tucumán'), freq('tucuman', 'Quiniela de Tucumán'), chance,
      method(h, 'tucuman', ['Leemos el sitio oficial de resultados de la <b>Caja Popular de Ahorros</b>: la lista de sorteos de cada día y los 20 números de cada uno, en el mismo orden en que los muestra la página oficial.', 'Ninguna otra lotería oficial republica la quiniela de Tucumán, así que no hay una segunda copia para comparar: cada extracto lleva la marca <b>1 fuente</b>. Revisamos que tenga 20 números de cuatro cifras, la fecha pedida y un turno conocido; si algo no cuadra, no se publica.']),
      faq(h, 'Preguntas sobre la quiniela de Tucumán', tucFaq(h), TUC_TIMES.map(([, , f]) => 'cajapopular.quiniela.time-' + f).concat('cajapopular.quiniela.time-nocturno-20')), more(h, '/quiniela/tucuman/')];
  },
});

const sanJuan = pvPage('san-juan', {
  title: 'Quiniela de San Juan hoy: Vespertina, Nocturna y más',
  h1: 'Quiniela de San Juan de hoy',
  description: 'Quiniela de San Juan de hoy: la Vespertina, la de la Tarde y la Nocturna de la Caja de Acción Social, con el extracto completo y los sorteos anteriores.',
  kicker: 'Quiniela · San Juan · CAS',
  cta: 'Ver los sorteos de hoy',
  lede: () => 'Los extractos de la quiniela sanjuanina tal como los publica la Caja de Acción Social (CAS) en su sitio: cada sorteo con sus 20 números, la cabeza bien grande y los días anteriores.',
  blocks: h => [today('san-juan', 'Los sorteos de hoy y el último'), week('san-juan', 'Quiniela de San Juan'), check('san-juan', 'Quiniela de San Juan'), chance, arch('san-juan', 'Quiniela de San Juan'), freq('san-juan', 'Quiniela de San Juan'),
    method(h, 'san-juan', ['Leemos la página de extractos de la <b>Caja de Acción Social de San Juan</b>, que publica cada sorteo con su número y sus 20 ubicaciones.', 'No hay otra copia oficial de la quiniela sanjuanina para comparar: lleva la marca <b>1 fuente</b>. Si el sorteo no trae 20 números de cuatro cifras o la fecha no coincide, no se publica.', 'Mostramos los turnos que la CAS publicó en los últimos días; si un turno no aparece, es porque no está en su página.']),
    more(h, '/quiniela/san-juan/')],
});

const chaco = pvPage('chaco', {
  title: 'Quiniela Chaqueña de hoy: resultados y extractos',
  h1: 'Quiniela Chaqueña de hoy',
  description: 'Quiniela Chaqueña de hoy: la cabeza y los 20 números de la Previa a la Nocturna, de la página oficial de la Lotería Chaqueña, y los extractos anteriores.',
  kicker: 'Quiniela · Chaco · Lotería Chaqueña',
  cta: 'Ver la Chaqueña de hoy',
  lede: () => 'Cinco sorteos por día, de La Previa a la Nocturna. Los copiamos de la página de extractos de la Lotería Chaqueña y los comparamos con nuestras copias de la Ciudad y la Provincia que trae esa misma página.',
  blocks: h => [today('chaco', 'La Chaqueña de hoy, turno por turno'), check('chaco', 'Quiniela Chaqueña'), week('chaco', 'Quiniela Chaqueña'), freq('chaco', 'Quiniela Chaqueña'), arch('chaco', 'Quiniela Chaqueña'), chance,
    method(h, 'chaco', ['Leemos la página de extractos de la <b>Lotería Chaqueña</b>, día por día y turno por turno.', checked]),
    more(h, '/quiniela/chaco/')],
});

const corrientes = pvPage('corrientes', {
  title: 'Quiniela Correntina de hoy: resultados de cada turno',
  h1: 'Quiniela Correntina de hoy',
  description: 'Quiniela Correntina de hoy: la cabeza y el extracto de cada turno, de la Previa a la Nocturna, de la copia oficial de la Lotería Chaqueña.',
  kicker: 'Quiniela · Corrientes',
  cta: 'Ver la Correntina de hoy',
  lede: () => 'La quiniela de Corrientes, turno por turno. La copia oficial que podemos leer es la que publica la Lotería Chaqueña en su página de extractos, al lado de la Chaqueña: la usamos solo cuando el resto de esa página coincide con nuestras copias.',
  blocks: h => [today('corrientes', 'La Correntina de hoy'), week('corrientes', 'Quiniela Correntina'), chance, check('corrientes', 'Quiniela Correntina'), arch('corrientes', 'Quiniela Correntina'), freq('corrientes', 'Quiniela Correntina'),
    method(h, 'corrientes', ['La quiniela de Corrientes la organiza el <b>Instituto de Lotería y Casinos de Corrientes</b>. Su sitio no tiene una página de extractos que podamos leer desde nuestro servidor, así que tomamos la copia que publica la <b>Lotería Chaqueña</b> en la misma tabla que la Chaqueña.', checked]),
    more(h, '/quiniela/corrientes/')],
});

const misiones = pvPage('misiones', {
  title: 'Quiniela Misionera de hoy: extractos y Misionera Plus',
  h1: 'Quiniela Misionera de hoy',
  description: 'Quiniela Misionera de hoy: el último extracto de cada turno del IPLyC de Misiones, de la Previa a la Nocturna, y los números de la Misionera Plus.',
  kicker: 'Quiniela · Misiones · IPLyC',
  cta: 'Ver la Misionera de hoy',
  lede: () => 'El último extracto de cada turno de la quiniela misionera, de la página oficial del IPLyC, y la Misionera Plus de los turnos que la tienen. Cada uno con sus 20 números.',
  blocks: h => [today('misiones', 'La Misionera de hoy'),
    '<section class="jg-c w3"><span class="jg-tag">Misionera Plus</span><h2>Quiniela Misionera Plus</h2><p class="jg-mu">La Plus tiene su propio extracto, en los turnos en que el IPLyC la publica.</p>' + root('pv', ' data-jur="misiones-plus"') + loading + '</div></section>',
    check('misiones', 'Quiniela Misionera'), week('misiones', 'Quiniela Misionera'), arch('misiones', 'Quiniela Misionera'), freq('misiones', 'Quiniela Misionera'), chance,
    method(h, 'misiones', ['Leemos la página de cada turno de la quiniela del <b>IPLyC de Misiones</b>, que muestra el último sorteo de ese turno con la Misionera, la Misionera Plus y otros extractos del mismo turno. Por las reglas de su sitio solo pedimos esa página, sin buscar fechas: el archivo de abajo crece con cada sorteo que copiamos.', checked]),
    more(h, '/quiniela/misiones/')],
});

export const PV_PAGE_LIST = [tucuman, sanJuan, chaco, corrientes, misiones];
