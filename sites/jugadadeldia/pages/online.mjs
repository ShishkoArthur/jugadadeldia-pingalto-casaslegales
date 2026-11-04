// Guide "¿Se puede jugar a la quiniela online?" (owner 2026-11-04, audit section 6.5; key "quiniela online" 97k). Gambling is ruled
// by each province (PLAYBOOK 7.2, 7.4): the page says only what the official documents we saved say, each line with its quote
// (data/sources/lottery/online.json, lotba.json, pba.json), and "depende de la ley de tu provincia" for the rest. No operator is
// named or linked: links go to lotteries and regulators only. No win promise; 18+; the help block and the help pages close it.
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { hero, cite, crumbs, webPage, money, oneIn, btn, faq, faqLd } from './parts.mjs';

const n = q => toNumber(q);
const host = u => new URL(u).hostname.replace(/^www\./, '');
const off = (url, label) => '<a href="' + url + '" rel="noopener">' + (label || host(url)) + '</a>';

const ROWS = h => [
  { j: 'Ciudad de Buenos Aires', who: 'Lotería de la Ciudad (LOTBA)', site: 'https://quiniela.loteriadelaciudad.gob.ar/', online: 'sí',
    text: 'El reglamento de La Quiniela de la Ciudad admite apuestas por canales físicos <b>y en línea</b> que autorice LOTBA. Para jugar en línea hay que registrarse como usuario en el dominio que LOTBA determine, con documento y fecha de nacimiento, y los premios se acreditan en esa cuenta. Su sitio dice que se puede jugar en agencias oficiales y online. Además, la Ciudad publica la lista de las únicas agencias autorizadas para el juego en línea.',
    src: ['lotba.quiniela.channels', 'lotba.quiniela.online-register', 'lotba.quiniela.online-id', 'lotba.quiniela.online-prizes', 'lotba.quiniela.where-play', 'online.caba.list'] },
  { j: 'Río Negro', who: 'Lotería de Río Negro', site: 'https://www.loteriaderionegro.gob.ar/', online: 'sí',
    text: 'La Lotería de Río Negro tiene su propia plataforma, <b>La Rionegrina Online</b>, para jugar en línea a sus juegos lotéricos; entre los habilitados está la Quiniela Tradicional. Hay que ser mayor de edad para registrarse y el crédito se carga en una agencia o subagencia, con DNI.',
    src: ['online.rne.platform', 'online.rne.games', 'online.rne.age', 'online.rne.credit'] },
  { j: 'Provincia de Buenos Aires', who: 'Instituto Provincial de Lotería y Casinos (IPLyC)', site: 'https://www.loteria.gba.gob.ar/', online: 'licencias de juego online',
    text: 'Con la ley 15.079 y el decreto 181/19 se autorizaron ' + h.src.value('online.pba.licences') + ' licencias de juego online, y el Instituto dice que los sitios legales terminan en .bet.ar. El reglamento de la quiniela provincial, en cambio, habla de la agencia: la apuesta la registra la Agencia Oficial al entregar el ticket-recibo, que es el único comprobante válido. En esos documentos no encontramos una quiniela online propia de la Provincia.',
    src: ['online.pba.licences', 'online.pba.betar', 'pba.quiniela.agency-ticket'] },
  { j: 'Córdoba', who: 'Lotería de Córdoba', site: 'https://loteriadecordoba.com.ar/', online: 'lista de sitios online',
    text: 'La Lotería de Córdoba publica su lista de sitios oficiales de juego online y recuerda que los sitios que terminan en .bet.ar son legales. Esa página no dice cuáles de esos sitios venden quiniela.',
    src: ['online.cba.list', 'online.cba.betar'] },
  { j: 'Santa Fe', who: 'Lotería de Santa Fe', site: 'https://www.loteriasantafe.gov.ar/', online: 'casinos y apuestas online',
    text: 'Según la Lotería de Santa Fe, hay 2 plataformas de juego online y 4 de apuestas deportivas habilitadas por la Ley 14235/23. Su lista está dividida en casinos online y apuestas deportivas: la quiniela no aparece.',
    src: ['online.sfe.count'] },
  { j: 'Mendoza', who: 'Instituto Provincial de Juegos y Casinos', site: 'https://www.ipjyc.gob.ar/JEL/', online: 'lista de plataformas',
    text: 'El Instituto regula el juego en línea dentro de la provincia y publica la lista de plataformas autorizadas.',
    src: ['online.mza.regulator', 'online.mza.list'] },
  { j: 'La Rioja', who: 'Administración de Juegos de Azar (AJALAR)', site: 'https://ajalar.com.ar/', online: 'lista de plataformas',
    text: 'AJALAR publica la lista de plataformas autorizadas y dice que los sitios de apuestas en línea legales se identifican únicamente con el dominio .bet.ar.',
    src: ['online.lri.betar'] },
  { j: 'Neuquén', who: 'Instituto Provincial de Juegos de Azar (IJAN)', site: 'https://ijan-neuquen.com/', online: 'la quiniela, en agencias',
    text: 'Para el IJAN, la quiniela y los demás juegos lotéricos autorizados se venden en una agencia o subagencia oficial de lotería y quiniela. Juego ilegal es el que el Instituto no autorizó dentro de la provincia.',
    src: ['online.neu.list', 'online.neu.games', 'online.neu.illegal'] },
];

function returnLine() {
  const r = directBet({ rules: 'lotba-quiniela', digits: 2, places: 1, stake: 100 });
  return { back: money(n(r.perHit) / r.oneIn), chance: oneIn(r.oneIn), pay: money(n(r.perHit)) };
}

const FAQ = h => {
  const rows = ROWS(h);
  const yes = rows.filter(r => r.online === 'sí').map(r => r.j);
  return [
    ['¿Es legal jugar a la quiniela online?', 'Depende de la provincia: el juego lo regula cada una. En los documentos oficiales que guardamos, ' + yes.join(' y ') + ' tienen un canal en línea de su propia lotería para la quiniela; en otras provincias la quiniela se vende en agencias. Esta página no es un consejo legal.'],
    ['¿Cómo sé si un sitio de quiniela online está autorizado?', 'Entrá al sitio oficial de la lotería o del organismo de juego de tu provincia, buscá su lista de sitios autorizados y compará la dirección letra por letra. Si el sitio no está en esa lista, ese organismo no lo autorizó.'],
    ['¿Desde qué edad se puede jugar a la quiniela?', 'Desde los 18 años. Los reglamentos de la quiniela de la Ciudad y de la Provincia de Buenos Aires prohíben jugar a los menores de 18, también por medio de otra persona.'],
    ['¿Jugar online cambia la chance de ganar?', 'No. A 2 cifras y a la cabeza la chance es <b>' + returnLine().chance + '</b> por jugada, en una agencia o en línea, y de cada $ 100 que se juegan así vuelven en premios, en promedio, ' + returnLine().back + '.'],
  ];
};
const FAQ_SRC = ['lotba.age', 'pba.age'];

export const quinielaOnline = {
  path: '/quiniela/online/', kind: 'lottery', section: 'quiniela',
  title: 'Quiniela online: ¿se puede jugar? Lo legal en tu provincia',
  h1: '¿Se puede jugar a la quiniela online?',
  description: 'Quiniela online: qué loterías oficiales la venden por internet, qué dice cada provincia con su cita, cómo reconocer un sitio no autorizado y 18+.',
  ld: h => [webPage(h), crumbs(h, h.built('/quiniela/') ? [['/quiniela/', 'Quiniela de hoy']] : []), faqLd(FAQ(h))],
  render(h) {
    const rows = ROWS(h);
    const r = returnLine();
    const table = '<div class="jg-tw"><table class="jg-tbl" data-nosnippet><thead><tr><th>Jurisdicción</th><th>Organismo</th><th>Canal en línea</th></tr></thead><tbody>' +
      rows.map(x => '<tr><td><a href="#' + x.j.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-') + '">' + x.j + '</a></td><td>' + x.who + '</td><td>' + x.online + '</td></tr>').join('') + '</tbody></table></div>';
    const card = x => '<article class="jg-c" id="' + x.j.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-') + '"><span class="jg-sm">' + x.who + '</span><h3>' + x.j + '</h3><p>' + x.text + '</p><p class="jg-note">Sitio oficial: ' + off(x.site) + '</p>' + cite(h, x.src) + '</article>';
    return hero(h, { kicker: 'Quiniela · online · 18+', lede: 'Depende de dónde vivís: el juego lo regula cada provincia. Algunas loterías oficiales venden la quiniela por internet y otras solo en agencias. Acá está lo que dicen sus propios documentos, con la cita, y cómo darte cuenta de si un sitio está autorizado. No es un consejo legal.', actions: '<a class="jg-b p" href="#provincias">Ver tu provincia</a><a class="jg-b" href="#comprobar">Cómo comprobar un sitio</a>' }) +
      '<div class="jg-mn">' +
      '<section class="jg-c w3" id="respuesta"><span class="jg-tag">La respuesta corta</span><h2>Sí, en algunas provincias, y solo por el canal oficial</h2>' +
      '<ul class="jg-ul tx"><li><b>Con canal oficial en línea:</b> la Lotería de la Ciudad admite la quiniela por canales en línea que ella autoriza, y la Lotería de Río Negro tiene su plataforma La Rionegrina Online, con la Quiniela Tradicional.</li>' +
      '<li><b>Solo en agencias, según sus documentos:</b> en Neuquén la quiniela se vende en agencias o subagencias oficiales; el reglamento de la quiniela de la Provincia de Buenos Aires habla del ticket-recibo que entrega la Agencia Oficial.</li>' +
      '<li><b>Listas de juego online:</b> varias provincias publican qué sitios autorizaron (casinos, apuestas o juegos online). Un sitio que no está en la lista de tu provincia no está autorizado por ese organismo.</li>' +
      '<li><b>Para el resto del país</b> no guardamos un documento oficial sobre el juego en línea: preguntá en la lotería de tu provincia. Lo que vale para vos depende de la ley de tu provincia.</li></ul></section>' +
      '<section class="jg-c w3" id="provincias"><span class="jg-sm">Lo que dice cada organismo</span><h2>Provincia por provincia</h2>' + table +
      '<p class="jg-note">Copias de las páginas oficiales del ' + h.fmtDate(h.src.fact('online.caba.list').d.fetched) + '. Cada provincia cambia sus listas cuando otorga o quita una licencia: la que vale es la del sitio oficial.</p></section>' +
      rows.map(card).join('') +
      '<section class="jg-c w2" id="fuera-de-las-listas"><span class="jg-sm">Fuera de las listas</span><h2>¿Y los sitios de «quiniela online» que no figuran en ninguna?</h2>' +
      '<p>Si un sitio no está en la lista oficial de tu provincia, el organismo de tu provincia no lo autorizó. Neuquén lo dice así: juego ilegal es el que el Instituto no autorizó dentro de la provincia.</p>' +
      '<p>Tres organismos (Provincia de Buenos Aires, Córdoba y La Rioja) dicen que los sitios legales terminan en <b>.bet.ar</b>. Esa terminación no alcanza sola: cada lista es de su provincia, y la que importa es la de la tuya.</p>' +
      '<p>En la Provincia de Buenos Aires, el único comprobante válido de una apuesta de quiniela es el ticket-recibo de la Agencia Oficial: una jugada «tomada» por mensaje, sin ese ticket, no te da nada para reclamar.</p>' +
      cite(h, ['online.neu.illegal', 'online.pba.betar', 'online.cba.betar', 'online.lri.betar', 'pba.quiniela.agency-ticket']) + '</section>' +
      '<section class="jg-c" id="comprobar"><span class="jg-sm">Antes de cargar plata</span><h2>Cómo comprobar un sitio</h2><ol class="jg-ul"><li>Entrá al sitio oficial de la lotería o del organismo de juego de tu provincia escribiendo la dirección vos, no desde un enlace que te mandaron.</li>' +
      '<li>Buscá su lista de sitios autorizados.</li><li>Compará la dirección del sitio letra por letra con la de la lista.</li><li>Si no está, no juegues ahí. Podés denunciarlo: Córdoba tiene un formulario para reportar un sitio de apuestas ilegal, Río Negro la línea ' + h.esc(h.src.value('online.rne.report')) + ' y Neuquén la ' + h.esc(h.src.value('online.neu.report')) + '.</li></ol>' +
      '<p class="jg-note">Córdoba ofrece además NoVa+, una aplicación para proteger a tu familia de sitios ilegales.</p>' + cite(h, ['online.cba.report', 'online.rne.report', 'online.neu.report', 'online.cba.nova']) + '</section>' +
      '<section class="jg-c w2" id="edad"><span class="jg-tag">18+</span><h2>Solo mayores de 18, también en línea</h2><p>Los reglamentos de la quiniela de la Ciudad y de la Provincia de Buenos Aires prohíben jugar a los menores de 18 años, también por medio de otra persona. La Provincia y La Rioja lo repiten para toda apuesta en línea, Santa Fe recuerda que las plataformas de apuestas están prohibidas por ley para chicas, chicos y adolescentes, y para registrarse en La Rionegrina Online hay que ser mayor de edad.</p>' +
      cite(h, ['lotba.age', 'pba.age', 'online.pba.age', 'online.lri.age', 'online.sfe.age', 'online.rne.age']) + '</section>' +
      '<section class="jg-c" id="la-cuenta"><span class="jg-sm">Online o en la agencia</span><h2>La cuenta es la misma</h2><p>A 2 cifras y a la cabeza, en la Ciudad: <b>' + r.chance + '</b> por jugada; si sale, con $ 100 cobrás ' + r.pay + '. En promedio vuelven <b>' + r.back + '</b> de cada $ 100. Jugar desde el teléfono no cambia ese número: solo hace más fácil jugar más seguido.</p><div class="jg-r">' + btn(h, '/quiniela/cuanto-paga/', '¿Cuánto paga cada jugada?') + btn(h, '/quiniela/simulador/', 'Un año jugando, en pesos') + '</div></section>' +
      '<section class="jg-c w3 jg-calm" id="ayuda"><span class="jg-sm">Si se te va de las manos</span><h2>Ayuda gratuita y autoexclusión</h2><p>Si jugás más de lo que querías o para recuperar lo perdido, hay líneas gratuitas en cada provincia y programas para pedir que no te dejen jugar.</p><div class="jg-r">' + btn(h, '/juego-responsable/', 'Líneas de ayuda por provincia', true) + btn(h, '/juego-responsable/autoexclusion/', 'Cómo pedir la autoexclusión') + '</div></section>' +
      faq(h, 'Preguntas sobre la quiniela online', FAQ(h), FAQ_SRC) +
      '<section class="jg-c w3"><span class="jg-sm">Seguí con</span><h2>La quiniela de hoy</h2><div class="jg-r">' + btn(h, '/quiniela/', 'Las cabezas de hoy', true) + btn(h, '/quiniela/como-se-juega/', 'Cómo se juega') + btn(h, '/quiniela/horarios/', 'Horarios') + '</div></section>' +
      '</div>';
  },
};
