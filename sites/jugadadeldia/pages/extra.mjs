// Wave 2 extras: the home bolillero with printable cartones (kind "game"), the glossary that sends every term to the tool that
// computes it, and the privacy page (both "service": help block and 18+). No number is typed by hand here.
import { hero, crumbs, webPage, tiles, ICONS, btn } from './parts.mjs';

const sel = (name, opts) => '<select class="jg-se" name="' + name + '">' + opts.map(([v, l, s]) => '<option value="' + v + '"' + (s ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
const TG = 'https://t.me/deniskrazok';

export const bolillero = {
  path: '/bolillero/', kind: 'game', section: 'juegos', css: ['guias.css'], js: ['bolillero.js'],
  title: 'Bolillero online: bingo y lotería familiar',
  h1: 'Bolillero para jugar en casa',
  description: 'Bolillero online para jugar al bingo o a la lotería familiar en casa: sacá bolillas del 1 al 90 con voz, tablero de salidas y cartones para imprimir.',
  ld: h => [webPage(h), crumbs(h, [['/juegos-de-cartas/', 'Juegos']])],
  render(h) {
    const board = '<div class="jg-b90" data-o="board" aria-label="Bolillas que salieron">' + Array.from({ length: 90 }, (_, i) => '<span data-b="' + (i + 1) + '">' + (i + 1) + '</span>').join('') + '</div>';
    return '<section class="jg-play jg-noprint" data-bol><div class="jg-ph"><h1 class="jg-h1 sm">' + h.esc(h.page.h1) + '</h1><form class="jg-cfg" data-cfg><label><span class="jg-sm">Bolillas</span>' + sel('r', [['90', 'Del 1 al 90', true], ['99', 'Del 00 al 99']]) + '</label><button class="jg-b s" type="button" data-voice aria-pressed="false">Voz: no</button></form></div>' +
      '<div class="jg-felt jg-dfelt"><div class="jg-bb" data-o="ball" aria-live="assertive">?</div><p class="jg-info" data-o="info">Tocá «Sacar bolilla».</p><div class="jg-calls"><button class="jg-b p" type="button" data-draw>Sacar bolilla</button><button class="jg-b s" type="button" data-undo>Volver una</button><button class="jg-b s" type="button" data-new>Partida nueva</button></div></div></section>' +
      '<div class="jg-mn" style="margin-top:22px"><section class="jg-c w2 jg-noprint"><span class="jg-sm">Tablero</span><h2>Lo que salió</h2>' + board + '<p class="jg-note">La partida queda guardada en este navegador: si se corta, la seguís.</p></section>' +
      '<section class="jg-c jg-noprint"><span class="jg-sm">Cómo funciona</span><h2>Azar del navegador</h2><p>Cada bolilla sale de <code>crypto.getRandomValues</code>, el generador criptográfico del navegador, entre las que todavía están en el bolillero. Ninguna se repite y nada se manda a ningún lado.</p><p class="jg-note">Es para jugar en casa, sin plata de por medio.</p></section>' +
      '<section class="jg-c w3" data-cartones><span class="jg-sm jg-noprint">Para imprimir</span><h2 class="jg-noprint">Cartones</h2><div class="jg-r jg-noprint"><label class="jg-fl"><span>Cuántos</span>' + sel('n', [2, 4, 6, 8, 12].map(v => [v, String(v), v === 6])) + '</label><button class="jg-b s" type="button" data-make>Hacer otros</button><button class="jg-b p" type="button" data-print>Imprimir</button></div>' +
      '<p class="jg-note jg-noprint">Cartón clásico de 3 filas por 9 columnas: 5 números por fila, cada columna con su decena (1 a 9, 10 a 19… 80 a 90).</p><div class="jg-cts" data-o="cts"></div></section>' +
      '<section class="jg-c w3 jg-noprint"><span class="jg-sm">Más juegos</span><h2>Para la sobremesa</h2>' + tiles(h, [['/generala/', 'Anotador de generala', 'De 2 a 8 jugadores', '#e8930c', ICONS.dice], ['/dados/', 'Tirador de dados', 'De 1 a 10 dados', '#16b38a', ICONS.dice], ['/truco/anotador/', 'Anotador de truco', 'Con fósforos', '#ff5a3c', ICONS.pencil]]) + '</section></div>';
  },
};

// Glossary: [term, group, definition, page]. The page is shown only when it is built.
const TERMS = [
  ['A la cabeza', 'Quiniela', 'Jugar a que tu número salga en el primer lugar del extracto.', '/quiniela/cuanto-paga/'],
  ['A los 5, a los 10, a los 20', 'Quiniela', 'Tu número vale si sale en cualquiera de esos primeros lugares; la apuesta se reparte entre ellos, y el premio también.', '/quiniela/cuanto-paga/'],
  ['Extracto', 'Quiniela', 'La lista oficial de los números de un sorteo, en el orden en que salieron.', '/quiniela/extractos/'],
  ['Terminación', 'Quiniela', 'Las últimas cifras del número que sale: a dos cifras cuentan las dos últimas.', '/quiniela/numeros-que-mas-salen/'],
  ['Turno', 'Quiniela', 'Cada sorteo del día: La Previa, La Primera, Matutina, Vespertina y Nocturna.', '/quiniela/horarios/'],
  ['Nacional', 'Quiniela', 'Como se le sigue diciendo a la quiniela de la Ciudad de Buenos Aires.', '/quiniela/nacional/'],
  ['Redoblona', 'Quiniela', 'Dos números de dos cifras en el mismo extracto: lo que ganás con el primero se juega al segundo.', '/quiniela/redoblona/'],
  ['Tope de banca', 'Quiniela', 'Si los premios de un sorteo superan cierto múltiplo de lo recaudado, la lotería puede pagarlos a prorrata.', '/quiniela/cuanto-paga/'],
  ['Boleta', 'Quiniela', 'El ticket de la agencia: número, ubicación, lotería e importe.', '/quiniela/como-se-juega/'],
  ['Pozo', 'Loterías', 'La parte de lo recaudado que va a premios y se reparte entre los ganadores de cada categoría.', '/cuanto-devuelve-cada-juego/'],
  ['Tombolina', 'Loterías', 'Juego de la Ciudad: elegís varios números de dos cifras y se resuelve con el extracto de la quiniela.', '/cuanto-devuelve-cada-juego/'],
  ['Revancha', 'Quini 6', 'Otro sorteo del Quini 6 con la misma boleta: solo paga con los 6 aciertos.', '/quini-6/como-se-juega/'],
  ['Siempre Sale', 'Quini 6', 'Modalidad en la que cobra el que más acierte, aunque no llegue a 6.', '/quini-6/como-se-juega/'],
  ['Premio Extra', 'Quini 6', 'Reparto entre las boletas que tienen sus seis números entre todos los que salieron en Tradicional, La Segunda y Revancha.', '/quini-6/controlar/'],
  ['Cartón', 'Telekino', 'Tu jugada del Telekino: los números ya vienen impresos.', '/telekino/controlar/'],
  ['Rekino', 'Telekino', 'El sorteo de revancha del Telekino con el mismo cartón: gana el que más acierte.', '/telekino/controlar/'],
  ['Mano', 'Truco', 'El jugador que juega primero en una mano y gana los empates.', '/truco/reglas/'],
  ['Baza', 'Truco', 'Cada vuelta de cartas: se juegan hasta tres y gana la mano quien gana dos.', '/truco/reglas/'],
  ['Parda', 'Truco', 'Empate en una baza. Tiene reglas propias para decidir la mano.', '/truco/reglas/'],
  ['Bravas', 'Truco', 'Las cuatro cartas más altas: ancho de espadas, ancho de bastos, siete de espadas y siete de oros.', '/truco/valores-de-las-cartas/'],
  ['Envido', 'Truco', 'El canto de los tantos: gana el que suma más con dos cartas del mismo palo.', '/truco/envido/'],
  ['Real envido y falta envido', 'Truco', 'Subidas del envido. La falta vale lo que le falta a uno para ganar el partido.', '/truco/puntos/'],
  ['Truco, retruco, vale cuatro', 'Truco', 'Los cantos que suben lo que vale la mano.', '/truco/puntos/'],
  ['Quiero / no quiero', 'Truco', 'Aceptar o rechazar un canto. Si no querés, el otro cobra lo que ya valía.', '/truco/quiero-o-no-quiero/'],
  ['Flor y contraflor', 'Truco', 'Tres cartas del mismo palo, si se juega con flor; la contraflor la pone en juego contra otra flor.', '/truco/flor/'],
  ['Irse al mazo', 'Truco', 'Abandonar la mano: el otro cobra lo que esté en juego.', '/truco/reglas/'],
  ['Malas y buenas', 'Truco', 'Las dos mitades del partido: primero se juntan las malas y después las buenas.', '/truco/anotador/'],
  ['Señas', 'Truco', 'Gestos para avisarle al compañero qué cartas tenés, en el truco de a cuatro.', '/truco/senas/'],
  ['Cortar', 'Chinchón', 'Cerrar la mano cuando lo que te queda suelto suma poco.', '/chinchon/'],
  ['Reenganche', 'Chinchón', 'Volver al partido después de pasarte del límite, con el puntaje del que va más alto.', '/chinchon/anotador/'],
  ['Escoba', 'Escoba de 15', 'Levantar todas las cartas de la mesa sumando 15 con la tuya.', '/escoba-de-15/'],
  ['Setenta', 'Escoba de 15', 'El punto de la mejor carta de cada palo, con una escala propia.', '/escoba-de-15/'],
  ['Canasta', 'Burako', 'Un juego largo de fichas. Pura, sin comodín; impura, con comodín.', '/burako/'],
  ['Muerto', 'Burako', 'El montón aparte que comprás al quedarte sin fichas.', '/burako/'],
  ['Servida', 'Generala', 'Una jugada que sale en el primer tiro de los cinco dados.', '/generala/probabilidades/'],
  ['Bolillero', 'Juegos', 'El bombo del que salen las bolillas numeradas.', '/bolillero/'],
];

export const glosario = {
  path: '/glosario/', kind: 'service',
  css: ['guias.css'], js: ['glosario.js'],
  title: 'Glosario de quiniela y truco: cabeza, redoblona, envido',
  h1: 'Glosario',
  description: 'Glosario de la quiniela y el truco como se habla en Argentina: cabeza, redoblona, a los 5, envido y más, cada término con la herramienta que lo calcula.',
  ld: h => [webPage(h), crumbs(h, []), { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Glosario de Jugada del Día', inLanguage: 'es-AR', hasDefinedTerm: TERMS.map(([t, , d]) => ({ '@type': 'DefinedTerm', name: t, description: d })) }],
  render(h) {
    const groups = [...new Set(TERMS.map(t => t[1]))];
    const li = ([t, g, d, u]) => '<li data-t="' + h.esc((t + ' ' + d).toLowerCase()) + '"><small>' + g + '</small><b>' + t + '</b>' + d + (h.built(u) ? ' <a href="' + h.href(u) + '">Ver</a>' : '') + '</li>';
    return hero(h, { kicker: 'Glosario · ' + TERMS.length + ' palabras', lede: 'Las palabras de la quiniela, las loterías y las cartas como se usan acá. Cada una te lleva a la herramienta donde la ves en acción.' }) +
      '<div class="jg-mn"><section class="jg-c w3" data-glosario><label class="jg-fl"><span>Buscar</span><input class="jg-in" type="search" data-q placeholder="Escribí, por ejemplo, parda" autocomplete="off"></label><div class="jg-sg" role="group" aria-label="Temas" style="margin-top:10px"><button type="button" data-g="" aria-pressed="true">Todo</button>' + groups.map(g => '<button type="button" data-g="' + g + '" aria-pressed="false">' + g + '</button>').join('') + '</div>' +
      '<ul class="jg-gl" style="margin-top:14px">' + TERMS.map(li).join('') + '</ul><p class="jg-note" data-o="none" hidden>No hay palabras con eso.</p></section></div>';
  },
};

export const privacidad = {
  path: '/politica-de-privacidad/', kind: 'service',
  css: ['guias.css'],
  title: 'Política de privacidad de Jugada del Día',
  h1: 'Política de privacidad',
  description: 'Política de privacidad de Jugada del Día: qué guarda tu navegador, como los anotadores, qué no recolectamos y cómo pedir que borremos o corrijamos algo.',
  ld: h => [h.webPage(), crumbs(h, [])],
  render(h) {
    const kept = [
      ['Los anotadores y las partidas', 'truco, generala, chinchón, burako, bolillero y los juegos contra la compu'],
      ['Tus boletas y cartones', 'los números que cargás para controlar el Quini 6, el Telekino y otras loterías'],
      ['Tus preferencias', 'tema claro u oscuro, sonido y la provincia de la línea de ayuda'],
    ];
    return '<section class="jg-hero no-g"><div><span class="jg-k">El sitio</span><h1>' + h.esc(h.page.h1) + '</h1><p class="jg-lede">Corta: no tenemos cuentas, no usamos cookies de seguimiento ni publicidad, y lo que cargás en las herramientas se queda en tu teléfono.</p></div></section>' +
      '<div class="jg-mn">' +
      '<section class="jg-c w2"><span class="jg-sm">En tu navegador</span><h2>Lo que se guarda en tu teléfono</h2><ol class="jg-steps">' + kept.map(([a, b]) => '<li><b>' + a + '</b>' + b + '.</li>').join('') + '</ol>' +
      '<p class="jg-hon">Todo eso vive en el almacenamiento local de tu navegador (localStorage). No nos llega: lo borrás vos limpiando los datos del sitio en el navegador. Los números de tus boletas tampoco van en el link de «compartir».</p></section>' +
      '<section class="jg-c"><span class="jg-sm">Lo que no hacemos</span><h2>Nada de esto</h2><ul class="jg-ul"><li>Cuentas o registro.</li><li>Cookies de seguimiento, analítica de terceros o publicidad.</li><li>Formularios que pidan tus datos.</li><li>Vender o pasar datos a nadie.</li></ul></section>' +
      '<section class="jg-c w2"><span class="jg-sm">Al visitar la página</span><h2>Lo técnico</h2><p>Como cualquier sitio, para mandarte la página el servidor y la red que la entrega y protege (Cloudflare) procesan datos técnicos del pedido: dirección IP, página pedida, navegador y hora. No los usamos para saber quién sos ni los cruzamos con nada.</p><p>Los resultados de la quiniela se leen desde nuestro propio servidor: tu navegador no se conecta con las loterías.</p></section>' +
      '<section class="jg-c"><span class="jg-sm">Tus derechos</span><h2>Pedir o corregir</h2><p>La ley argentina de protección de datos personales te da derecho a saber qué datos tuyos hay, y a pedir que se corrijan o borren. Escribinos por Telegram a Denis Krazok.</p><p><a class="jg-b" href="' + TG + '" rel="noopener">Telegram @deniskrazok</a></p>' + btn(h, '/quienes-somos/', 'Quiénes somos') + '</section></div>';
  },
};
