// pingalto wave 4: the game hubs that already had Alt's scene (/dota2, /clash, /brawl, /rl, /eafc) and the pages that the new
// server feeds make honest: big events in hora argentina (torneos: Worlds, MSI, VCT, TI, RLCS, FC Pro), Argentine players
// (argentinos), our Dota 2 Elo (dotaelo), the decks and picks of the Argentine top in Clash Royale and Brawl Stars (clashmeta,
// brawlmeta), the Swiss stage simulator with Valve's pairing rules and the Valorant callout maps from the client data.
// The browser draws the feed data (client/events.js, client/meta.js, client/supercell.js, client/agenda.js); the page carries the
// frame, the method, the attribution and what we do not show and why.
import { fcPc } from './games2.mjs';
import { hero, ldPage, sec, quote, srcLine, fmt } from './parts.mjs';
import { agendaBlock, FEED, css, wait, PS, SC } from './feeds.mjs';
import { vrs } from '../content/vrs.mjs';
import { rlStart, clashStart, brawlStart } from './academy.mjs';
import { dota2Hub } from './dota2.mjs';

const cards = (h, list) => '<div class="pa-hub">' + list.filter(([u]) => h.built(u)).map(([u, t, s]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + s + '</p></a>').join('') + '</div>';
const box = (mode, attrs = '') => '<div class="pa-fd" data-fd="' + mode + '" data-fd-src="' + FEED + '"' + attrs + '>' + wait + '</div>';
const link = (h, u, t) => h.built(u) ? '<a href="' + h.href(u) + '">' + t + '</a>' : t;
const seriesLink = h => h.built('/esports/series') ? '<p>¿Qué chance tiene un equipo en un Bo3 o un Bo5 si sabés cuánto gana por mapa? Calculalo en la ' + link(h, '/esports/series', 'calculadora de series') + '.</p>' : '';

// ---------- Dota 2 (the game page /dota2 is in dota2.mjs) ----------
export const dota2Ti = {
  path: '/dota2/ti',
  kind: 'live',
  title: 'The International de Dota 2: cuadro y hora argentina',
  h1: 'The International de Dota 2',
  description: 'The International de Dota 2 en hora argentina: el cuadro de la última edición fase por fase, cada resultado, el campeón y los equipos de Sudamérica.',
  scripts: ['events.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Dota 2 · The International', sub: 'El torneo más grande de Dota 2, partido por partido: fase de grupos, eliminación y playoffs, con los horarios pasados a Argentina y los equipos sudamericanos marcados.' }) +
      sec('La última edición', box('event', ' data-ev="ti"') + PS, 'cuadro') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Las horas son de Argentina. Los resultados son de las series: cuántos mapas ganó cada equipo.</li><li>Las fases salen como las arma el torneo; tocá una para ver sus partidos.</li><li>Para la chance de un equipo contra otro hoy, usá el cara a cara del ' + (h.built('/dota2') ? '<a href="' + h.href('/dota2#ranking') + '">ranking de Dota 2</a>' : 'ranking de Dota 2') + '.</li></ul>' + seriesLink(h));
  },
};

// ---------- Clash Royale ----------
const CLASH = [
  ['/clash/mazos', 'Armá tu mazo', 'Elixir, ciclo, curva y comparación con el top argentino.'],
  ['/clash/meta', 'El meta de Argentina', 'Las cartas y los mazos que tienen hoy los mejores jugadores del país.'],
  ['/clash/cartas', 'Todas las cartas', 'Elixir, rareza y evolución, con filtros.'],
];
const typesNote = '<p class="pa-src">Tipo de carta: la API oficial no lo dice con palabras, pero cada código empieza igual según el tipo (26 tropas, 27 estructuras, 28 hechizos); lo leemos de ahí.</p>';
export const clashHub = {
  path: '/clash',
  kind: 'hub',
  title: 'Clash Royale en Argentina: mazos, cartas y meta',
  h1: 'Clash Royale: mazos, cartas y meta',
  description: 'Clash Royale desde Argentina: armá tu mazo y comparalo, mirá todas las cartas y lo que usan hoy los mejores jugadores de los clanes top del país.',
  scripts: ['meta.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Clash Royale · desde Argentina', girl: true, sub: 'Herramientas con la API oficial de Supercell: tu mazo, todas las cartas y lo que juegan hoy los mejores del país.' }) +
      clashStart(h) + sec('Herramientas', cards(h, CLASH)) +
      sec('Lo que más usa el top argentino', box('clashmeta', ' data-n="10" data-decks="no"') + SC + '<p>' + link(h, '/clash/meta', 'Ver el meta completo y los mazos repetidos') + '</p>');
  },
};

export const clashMazos = {
  path: '/clash/mazos',
  kind: 'tool',
  title: 'Mazos de Clash Royale: armá el tuyo y comparalo',
  h1: 'Constructor de mazos de Clash Royale',
  description: 'Armá tu mazo de Clash Royale y mirá elixir promedio, ciclo, curva y tipos de carta, y cómo se compara con los mazos de los mejores de Argentina.',
  scripts: ['meta.js'],
  ld: h => ldPage(h),
  render(h) {
    const tool = '<div class="pa-fd pa-mz" data-fd="mazos" data-fd-src="' + FEED + '"><div class="pa-c"><h2>Elegí ocho cartas</h2><div data-pick>' + wait + '</div></div><div class="pa-c pa-out" aria-live="polite"><h2>Tu mazo</h2><div class="pa-share"><button type="button" data-clear>Vaciar</button><button type="button" data-top>Cargar el mazo más repetido del top</button></div><div data-deck></div></div></div>';
    return css(h) + hero(h, { ey: 'Clash Royale · constructor de mazos', sub: 'Tocá ocho cartas: te mostramos el elixir promedio, el ciclo, la curva y cuántos mazos del top argentino llevan cada una. El link guarda tu mazo para compartirlo.' }) +
      tool + SC +
      sec('Qué mira el análisis', '<div class="pa-two"><div><ul class="pa-dot"><li><b>Elixir promedio</b>: la suma de las ocho cartas dividida por ocho.</li><li><b>Ciclo</b>: lo que cuestan tus cuatro cartas más baratas, lo que gastás para volver a tener la primera en la mano.</li><li><b>Curva</b>: cuántas cartas tenés de cada costo.</li></ul>' + typesNote + '</div>' +
        '<div><p>La comparación usa los mazos que tienen elegidos hoy los jugadores con más copas de los mejores clanes de Argentina (detalle en ' + link(h, '/clash/meta', 'el meta argentino') + ').</p><p class="pa-src">No te ponemos una nota: no hay una fórmula oficial que diga qué mazo es bueno, y una nota inventada te haría cambiar cartas por nada. Mostramos números que podés revisar.</p></div></div>');
  },
};

export const clashMeta = {
  path: '/clash/meta',
  kind: 'live',
  title: 'Mejores mazos de Clash Royale en Argentina: el meta',
  h1: 'Los mazos del meta en Clash Royale',
  description: 'Las cartas y los mazos que tienen hoy los mejores jugadores de Clash Royale de Argentina, según la API oficial de Supercell. Se actualiza solo cada día.',
  scripts: ['meta.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Clash Royale · meta argentino', sub: 'Qué cartas llevan los que más copas tienen en los mejores clanes de Argentina, y qué mazos se repiten entre ellos.' }) +
      sec('Hoy en el top argentino', box('clashmeta', ' data-n="30"') + SC, 'meta') +
      sec('De dónde sale', '<ul class="pa-dot"><li>La tabla oficial de jugadores de Argentina viene vacía en la API (es por temporada). La de clanes sí está: tomamos los 10 mejores clanes del país, sus miembros con más copas (hasta 100) y el mazo que cada uno tiene elegido ahora.</li><li>Es el mazo elegido, no cuánto gana: la API no da el win rate de un mazo y no lo inventamos.</li><li>No guardamos nombres ni tags de jugadores: solo cuántos llevan cada carta.</li></ul>' + typesNote) +
      sec('Probalo con tu mazo', '<p>Armá el tuyo y fijate cuánto se parece al de los mejores en el ' + link(h, '/clash/mazos', 'constructor de mazos') + '.</p>');
  },
};

// ---------- Brawl Stars ----------
const BRAWL = [
  ['/brawl/meta', 'El meta del top argentino', 'Qué brawlers eligen los 100 mejores de Argentina en cada modo y mapa.'],
  ['/brawl/eventos', 'Eventos de hoy', 'Mapas y modos de la rotación con cuenta regresiva en hora argentina.'],
  ['/brawl/brawlers', 'Todos los brawlers', 'Habilidades estelares, gadgets y las copas de los 200 mejores del país.'],
];
export const brawlHub = {
  path: '/brawl',
  kind: 'hub',
  title: 'Brawl Stars en Argentina: brawlers, meta y eventos',
  h1: 'Brawl Stars: brawlers, meta y eventos',
  description: 'Brawl Stars desde Argentina: todos los brawlers, el meta del top argentino y los eventos de hoy con cuánto falta para que cambien, en hora argentina.',
  scripts: ['supercell.js', 'meta.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Brawl Stars · desde Argentina', girl: true, sub: 'La rotación de ahora, los brawlers que más eligen los mejores del país y todas las herramientas, con la API oficial de Supercell.' }) +
      brawlStart(h) + sec('Herramientas', cards(h, BRAWL)) +
      sec('Ahora en la rotación', box('brawl-events') + SC, 'eventos') +
      sec('Lo más elegido por el top argentino', box('brawlmeta', ' data-n="10"') + '<p>' + link(h, '/brawl/meta', 'Por modo, por mapa y con cuánto ganan') + '</p>');
  },
};

export const brawlMeta = {
  path: '/brawl/meta',
  kind: 'live',
  title: 'Meta de Brawl Stars: qué usan los mejores de Argentina',
  h1: 'Meta de Brawl Stars',
  description: 'El meta de Brawl Stars según las últimas partidas de los 100 mejores de Argentina: qué brawlers eligen en cada modo y mapa y cuánto ganan, con su margen.',
  scripts: ['meta.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Brawl Stars · meta argentino', sub: 'Miramos las últimas partidas de los 100 mejores jugadores de Argentina y contamos qué brawler llevó cada uno, modo por modo y en los mapas de la rotación de ahora.' }) +
      sec('Qué juegan los mejores del país', box('brawlmeta') + SC, 'meta') +
      sec('Cómo se lee', '<ul class="pa-dot"><li><b>Elegido</b>: en qué parte de las partidas el jugador del top llevó ese brawler.</li><li><b>Gana</b>: en los modos de equipo, cuántas de esas partidas ganó. Entre paréntesis va el margen con 95 % de confianza (intervalo de Wilson): con pocas partidas el margen es grande y no conviene sacar conclusiones.</li><li>Contamos partidas de trofeos y de ranked. La API da las últimas 25 de cada jugador, así que la foto es de las últimas horas.</li><li>No guardamos nombres ni tags: solo cuentas.</li></ul>') +
      sec('Seguí con', cards(h, BRAWL.filter(([u]) => u !== '/brawl/meta')));
  },
};

// ---------- Rocket League and EA Sports FC ----------
export const rlHub = {
  path: '/rl',
  kind: 'hub',
  title: 'Rocket League en Argentina: RLCS, campeones y argentinos',
  h1: 'Rocket League: la RLCS desde Argentina',
  description: 'Rocket League desde Argentina: el último mundial y los Majors de la RLCS en hora argentina, quién ganó cada uno y los jugadores argentinos con equipo.',
  scripts: ['events.js', 'agenda.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Rocket League · RLCS', girl: true, sub: 'El competitivo de Rocket League con los horarios de Argentina: el mundial, los Majors, los campeones y los argentinos que juegan en equipos.' }) +
      rlStart(h) + sec('Los campeones de la temporada', box('champs', ' data-g="rl"') + PS) +
      sec('El último mundial', box('event', ' data-ev="rlcs-worlds"'), 'mundial') +
      agendaBlock(h, 'rl', 'Próximos partidos de Rocket League') +
      sec('Argentinos en Rocket League', box('argentinos', ' data-g="rl"')) +
      sec('Lo que todavía no hay', '<ul class="pa-dot"><li>Rangos, MMR y hitbox de los autos: Psyonix no tiene una API pública ni una página que podamos citar con fecha, así que no publicamos tablas copiadas de otros sitios.</li><li>Torneos sudamericanos chicos: solo mostramos lo que PandaScore tiene cargado.</li></ul>' + seriesLink(h));
  },
};

export const eafcHub = {
  path: '/eafc',
  kind: 'hub',
  title: 'EA Sports FC 27 desde Argentina: requisitos en PC y esports',
  h1: 'EA Sports FC 27 desde Argentina: PC y competitivo',
  description: 'EA Sports FC 27 desde Argentina: requisitos y precio en Steam, el último mundial FC Pro partido por partido y los jugadores argentinos que compiten.',
  scripts: ['events.js', 'agenda.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'EA Sports FC · PC y competitivo', girl: true, sub: 'Qué pide FC 27 en la compu según Steam y el mundial de FC Pro con los horarios de Argentina, el camino de cada jugador y los argentinos que compiten.' }) +
      fcPc(h) + sec('El último FC Pro World Championship', box('event', ' data-ev="fc-worlds"') + PS, 'mundial') +
      agendaBlock(h, 'eafc', 'Próximos partidos de EA Sports FC') +
      sec('Argentinos en EA Sports FC', box('argentinos', ' data-g="fifa"')) +
      sec('Lo que no mostramos', '<ul class="pa-dot"><li>Valoraciones de jugadores, química de Ultimate Team, versiones de consola y su precio: EA no permite que robots lean su sitio y no copiamos sitios no oficiales.</li><li>Sobres, monedas o FC Points: nada de compras ni de cajas sorpresa.</li></ul>');
  },
};

// ---------- LoL and Valorant events ----------
const lolNote = h => '<ul class="pa-dot"><li>Las horas son de Argentina. LoL se juega en Bo1, Bo3 o Bo5 según la fase: lo marcamos en cada partido.</li><li>Tocá una fase para ver sus partidos; el cuadro se actualiza solo cada hora.</li><li>Los equipos de Latinoamérica aparecen marcados cuando juegan.</li></ul>' + seriesLink(h);
export const lolWorlds = {
  path: '/lol/worlds',
  kind: 'live',
  riot: true,
  title: 'Worlds de LoL en hora argentina: formato, cuadro y campeones',
  h1: 'Worlds de League of Legends en hora argentina',
  description: 'El Worlds de League of Legends en hora argentina: play-in, fase suiza y playoffs partido por partido, lo que viene hoy, los resultados y el campeón.',
  scripts: ['events.js', 'agenda.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'LoL · Worlds', sub: 'El mundial de League of Legends con los horarios pasados a Argentina: lo que se juega hoy, cada fase con sus resultados y quién se lleva la copa.' }) +
      sec('Worlds, partido por partido', box('event', ' data-ev="worlds"') + PS, 'cuadro') +
      sec('Cómo se lee', lolNote(h)) +
      sec('Los otros torneos de Riot', box('champs', ' data-g="lol"') + '<p>' + link(h, '/lol/msi', 'El MSI, fase por fase') + ' · ' + link(h, '/lol', 'Todos los campeones de LoL') + '</p>');
  },
};

export const lolMsi = {
  path: '/lol/msi',
  kind: 'live',
  riot: true,
  title: 'MSI de LoL en hora argentina: formato y cuadro',
  h1: 'MSI de League of Legends',
  description: 'El MSI de League of Legends en hora argentina: qué es, cómo se juega, el cuadro de la última edición partido por partido y quién fue el campeón.',
  scripts: ['events.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'LoL · MSI', sub: 'El Mid-Season Invitational junta a los campeones de cada liga a mitad de año. Acá está la última edición con los horarios de Argentina y cada resultado.' }) +
      sec('La última edición', box('event', ' data-ev="msi"') + PS, 'cuadro') +
      sec('Cómo se lee', lolNote(h)) + sec('Y a fin de año', '<p>El torneo grande es el ' + link(h, '/lol/worlds', 'Worlds, en hora argentina') + '.</p>');
  },
};

export const valorantChampions = {
  path: '/valorant/champions',
  kind: 'live',
  riot: true,
  title: 'VCT: Champions, Masters y Américas en hora argentina',
  h1: 'VCT: Champions, Masters y la liga de Américas',
  description: 'El VCT de Valorant en hora argentina: el cuadro de Champions y de los dos últimos Masters, la liga de las Américas y los equipos argentinos marcados.',
  scripts: ['events.js'],
  ld: h => ldPage(h),
  render(h) {
    const tabs = [['champions', 0, 'Champions'], ['masters', 0, 'Último Masters'], ['masters', 1, 'Masters anterior'], ['americas', 0, 'Liga de Américas']];
    return css(h) + hero(h, { ey: 'Valorant · VCT', girl: true, sub: 'Champions, los Masters y la liga de las Américas, donde juegan los equipos de Argentina, con los horarios pasados a hora argentina y cada resultado.' }) +
      sec('Los campeones', box('champs', ' data-g="valorant"') + PS) +
      tabs.map(([k, i, t]) => sec(t, box('event', ' data-ev="' + k + '" data-ed="' + i + '"'))).join('') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Las horas son de Argentina y los equipos argentinos van marcados con AR, según el país que PandaScore le asigna a cada equipo.</li><li>Tocá una fase para ver sus partidos.</li></ul>' + seriesLink(h) + '<p>' + link(h, '/valorant', 'Todo Valorant desde Argentina') + '</p>');
  },
};

// ---------- Esports ----------
export const esportsArgentinos = {
  path: '/esports/argentinos',
  kind: 'live',
  title: 'Jugadores argentinos en los esports: equipos y partidos',
  h1: 'Argentinos en los esports',
  description: 'Los jugadores argentinos de esports con equipo hoy: en qué juego y en qué club, quiénes juegan afuera y los próximos partidos donde aparecen.',
  scripts: ['events.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Esports · Argentina', girl: true, sub: 'Todos los jugadores con nacionalidad argentina que PandaScore tiene con equipo hoy, juego por juego, con los que juegan en clubes de otros países y sus próximos partidos.' }) +
      sec('Los argentinos, juego por juego', box('argentinos') + PS, 'jugadores') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Mostramos el nick, el equipo y el país del equipo. No publicamos nombres reales ni fechas de nacimiento.</li><li>«Afuera» quiere decir que el equipo está registrado en otro país.</li><li>Los logros de cada jugador no están en estos datos: no los inventamos.</li></ul>' + '<p>' + link(h, '/esports/latam', 'Las ligas de Latinoamérica de esta semana') + '</p>');
  },
};

export const esportsLatam = {
  path: '/esports/latam',
  kind: 'live',
  title: 'Ligas de esports en Latinoamérica: qué mirar en cada juego',
  h1: 'Ligas de esports de Latinoamérica',
  description: 'Las ligas de esports con equipos de Latinoamérica esta semana, juego por juego: el próximo partido en hora argentina y en cuáles juegan equipos argentinos.',
  scripts: ['events.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Esports · Latinoamérica', sub: 'De la agenda de la semana separamos las ligas y torneos donde juegan equipos de la región, primero los que tienen argentinos.' }) +
      sec('Esta semana', box('latam') + PS, 'ligas') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Un torneo entra si tiene equipos de un país de Latinoamérica o si es de la región Sudamérica, según PandaScore.</li><li>Free Fire y Mobile Legends de la región no están en la agenda que leemos: no los listamos.</li></ul><p>' + link(h, '/esports/agenda', 'La agenda completa') + ' · ' + link(h, '/esports/argentinos', 'Los argentinos en los esports') + '</p>');
  },
};

export const sistemaSuizo = {
  path: '/esports/sistema-suizo',
  kind: 'tool',
  title: 'Sistema suizo en esports: cómo funciona y simulador',
  h1: 'Simulador de fase suiza',
  description: 'Simulá una fase suiza de 16 equipos con el ranking de Valve o con el tuyo y mirá la chance de 3-0, de pasar o de 0-3, con las reglas de cruces del Major.',
  scripts: ['swisssim.js'],
  data: h => { const V = vrs(h); return { top: V.gl.rows.filter(r => !r.masked).slice(0, 16).map(r => [r.team, r.points, r.americas ? 1 : 0]) }; },
  ld: h => ldPage(h),
  render(h) {
    const V = vrs(h), top = V.gl.rows.filter(r => !r.masked).slice(0, 16);
    const tool = '<form class="pa-c pa-fm" id="pa-ss" autocomplete="off"><h2>Los 16 equipos</h2><div class="pa-f"><label for="ss-src">Arrancar con</label><select id="ss-src"><option value="vrs">Los 16 primeros del ranking de Valve</option><option value="eq">16 equipos iguales</option><option value="own">Mi lista</option></select></div>' +
      '<div class="pa-f"><label for="ss-teams">Una línea por equipo: nombre y puntos, de la siembra 1 a la 16</label><textarea id="ss-teams" rows="16" spellcheck="false">' + top.map(r => h.esc(r.team) + ', ' + r.points).join('&#10;') + '</textarea><small>Los puntos son del ranking de Valve; la chance de cada mapa sale de su propia fórmula.</small></div><p class="pa-note" data-o="ssn" aria-live="polite"></p><button type="submit" class="pa-b1">Simular de nuevo</button></form>';
    const out = '<div class="pa-c pa-out"><h2>Resultado de 10.000 fases simuladas</h2><div class="pa-tw" data-o="ss"><p class="pa-fdw">Calculando…</p></div><p class="pa-src">Barra de récords, de izquierda a derecha: 3-0, 3-1, 3-2, 2-3, 1-3 y 0-3. Marcados, los equipos de las Américas en el ranking de Valve (ahí compite Argentina).</p></div>';
    const rules = sec('Las reglas de cruces, según Valve', '<div class="pa-two"><div>' + quote(h, 'major_identical') + quote(h, 'major_3w3l') + quote(h, 'major_bo3') + quote(h, 'major_bo1') + quote(h, 'major_rematch') + '</div><div>' + quote(h, 'major_r1') + quote(h, 'major_r23') + quote(h, 'major_table') + quote(h, 'major_order') + quote(h, 'major_buchholz') + '</div></div>' + srcLine(h, 'major-rules', 'versión del ' + h.fmtDate(h.pa.doc('major-rules').published)));
    const how = sec('Cómo funciona una fase suiza', '<div class="pa-three"><div class="pa-c"><h3>Cruces por récord</h3><p>En cada ronda juegan entre sí equipos con el mismo récord: 1-0 contra 1-0, 0-1 contra 0-1. Así los que vienen ganando se cruzan entre ellos.</p></div><div class="pa-c"><h3>Tres y afuera</h3><p>Con 3 victorias pasás, con 3 derrotas quedás afuera. En 16 equipos siempre pasan 8: dos con 3-0, tres con 3-1 y tres con 3-2.</p></div><div class="pa-c"><h3>El que te tocó importa</h3><p>Dentro de un récord, la siembra se ordena por la dificultad de tus rivales (Buchholz): si le ganaste a equipos que siguen ganando, quedás más arriba y te toca un rival más bajo.</p></div></div>');
    const sim = sec('Cómo simulamos', '<ul class="pa-dot"><li>Cada partido se juega con la chance que da la fórmula de Valve para la diferencia de puntos de los dos equipos; un Bo3 se gana con dos mapas.</li><li>Los cruces de cada ronda siguen el reglamento: 1 contra 9 en la primera, el más alto contra el más bajo sin repetir rival en la segunda y la tercera, y la tabla de prioridades de Valve en la cuarta y la quinta.</li><li>Repetimos la fase 10.000 veces con una semilla fija: la misma lista da siempre los mismos números. Con equipos iguales, la simulación da exacto lo que da la cuenta de un equipo solo (lo prueba nuestro test).</li></ul><p>Para la chance de un solo equipo con una chance fija por mapa, sin simular, está ' + link(h, '/cs2/major', 'el Major de CS2 explicado') + '.</p>');
    return hero(h, { ey: 'Esports · fase suiza', girl: true, sub: 'Cargá 16 equipos y simulamos 10.000 veces una fase suiza con las reglas de cruces del Major de CS2: quién pasa, quién hace 3-0 y quién se va 0-3.' }) +
      '<div class="pa-tool pa-oo">' + tool + out + '</div>' + how + sim + rules;
  },
};

// ---------- Valorant callout maps ----------
const MAPS = { ascent: 'Ascent', split: 'Split' };
const SUPER = { A: 'Sitio A', B: 'Sitio B', C: 'Sitio C', Mid: 'Mid', Atacantes: 'Base atacante', Defensores: 'Base defensora' };
export function callouts(h, id) {
  const es = h.pa.json('valapi-maps').data, en = h.pa.json('valapi-maps-en').data;
  const a = es.find(m => m.displayName === MAPS[id]);
  if (!a) throw new Error('callouts: no map ' + id);
  const b = en.find(m => m.uuid === a.uuid);
  if (!b || b.callouts.length !== a.callouts.length) throw new Error('callouts: English data does not match ' + id);
  const list = a.callouts.map((c, i) => {
    const e = b.callouts[i];
    if (e.location.x !== c.location.x || e.location.y !== c.location.y) throw new Error('callouts: order differs on ' + id);
    const x = c.location.y * a.xMultiplier + a.xScalarToAdd, y = c.location.x * a.yMultiplier + a.yScalarToAdd;
    if (!(x > -0.1 && x < 1.1 && y > -0.1 && y < 1.1)) throw new Error('callouts: point outside the map on ' + id);
    return { es: c.regionName, sup: c.superRegionName, en: e.regionName, enSup: e.superRegionName, x: +x.toFixed(4), y: +y.toFixed(4) };
  });
  if (list.length < 15) throw new Error('callouts: only ' + list.length + ' on ' + id);
  return { name: a.displayName, desc: a.tacticalDescription, list };
}
// Spanish label as players say it: the zone first (A Principal, Mid Pizza), the spawns as Aparición atacante / defensora.
const fullEs = c => /^(Atacantes|Defensores)$/.test(c.sup) ? c.es + (c.sup === 'Atacantes' ? ' atacante' : ' defensora') : c.sup + ' ' + c.es;
const grp = s => /^A/.test(s) ? 'a' : /^B/.test(s) ? 'b' : /^C/.test(s) ? 'c' : /^Mid/.test(s) ? 'm' : /^Ata/.test(s) ? 't' : 'd';
// labels near the left/right edge are anchored inward so the phone size (30 units) is not cut by the viewBox
const edge = (x, W, n) => { const half = n * 0.55 * 30 / 2; return x - half < 8 ? ' class="pa-cs"' : x + half > W - 8 ? ' class="pa-ce"' : ''; };
function mapSvg(h, C) {
  const xs = C.list.map(c => c.x), ys = C.list.map(c => c.y);
  const x0 = Math.min(...xs) - 0.06, x1 = Math.max(...xs) + 0.06, y0 = Math.min(...ys) - 0.05, y1 = Math.max(...ys) + 0.05;
  const W = 1000, H = Math.round((W * (y1 - y0)) / (x1 - x0));
  const X = x => Math.round(((x - x0) / (x1 - x0)) * W), Y = y => Math.round(((y - y0) / (y1 - y0)) * H);
  return '<svg class="pa-cmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Puntos de los callouts de ' + h.esc(C.name) + ' en el mapa"><rect width="' + W + '" height="' + H + '" rx="24"/>' +
    C.list.map((c, i) => '<g class="pa-cp pa-cp-' + grp(c.sup) + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + h.esc(fullEs(c)) + '"><circle cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="15"/><text x="' + X(c.x) + '" y="' + (Y(c.y) - 22) + '"' + edge(X(c.x), W, Math.max(fullEs(c).length, (c.enSup + ' ' + c.en).length)) + ' data-es="' + h.esc(fullEs(c)) + '" data-en="' + h.esc(c.enSup + ' ' + c.en) + '">' + h.esc(fullEs(c)) + '</text></g>').join('') + '</svg>';
}
function mapPage(id, meta) {
  return {
    path: '/valorant/mapas/' + id,
    kind: 'tool',
    riot: true,
    ...meta,
    scripts: ['callouts.js'],
    data: h => ({ c: callouts(h, id).list.map(c => [fullEs(c), c.enSup + ' ' + c.en]) }),
    ld: h => ldPage(h),
    render(h) {
      const C = callouts(h, id);
      const zones = [...new Set(C.list.map(c => c.sup))];
      const seg = '<div class="pa-seg" role="group" aria-label="Idioma de los nombres"><button type="button" data-lang="es" aria-pressed="true">Español</button><button type="button" data-lang="en" aria-pressed="false">Inglés</button></div>';
      const tool = '<div class="pa-tool pa-cm"><div class="pa-c">' + seg + mapSvg(h, C) + '<p class="pa-src">Cada punto es un callout en la posición que trae el juego; el dibujo es nuestro, no el minimapa de Riot. Arriba y abajo no coinciden con la vista de cada lado.</p></div>' +
        '<div class="pa-c pa-out" aria-live="polite"><h2>¿Dónde queda?</h2><p class="pa-say" data-o="q">Tocá un punto para ver su nombre en español y en inglés.</p><div class="pa-share"><button type="button" data-quiz>Jugar: encontrá el callout</button></div><p class="pa-big" data-o="sc"></p><p class="pa-x" data-o="sel"></p></div></div>';
      const table = '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Zona</th><th>En español (LATAM)</th><th>En inglés</th></tr></thead><tbody>' + zones.map(z => C.list.filter(c => c.sup === z).map((c, i) => '<tr><td>' + (i ? '' : '<b>' + h.esc(SUPER[z] || z) + '</b>') + '</td><td>' + h.esc(fullEs(c)) + '</td><td lang="en">' + h.esc(c.enSup + ' ' + c.en) + '</td></tr>').join('')).join('') + '</tbody></table></div>';
      const ar = sec('Para jugar desde Argentina', '<div class="pa-two"><div><p>En las partidas de Latinoamérica conviven los dos idiomas: el cliente en español usa los nombres de la columna del medio, y muchos jugadores y streams usan los de inglés. Saberte los dos te ahorra segundos en cada ronda.</p>' + quote(h, 'val_scl', 'es') + '</div><div><p>¿Cuánto ping le sacás al servidor de Santiago desde tu provincia? Medilo en el ' + link(h, '/kit/ping', 'test de ping') + '. Los agentes y sus habilidades, en ' + link(h, '/valorant/agentes', 'agentes de Valorant') + '.</p></div></div>');
      return hero(h, { ey: 'Valorant · ' + C.name + ' · ' + C.desc, sub: fmt(C.list.length, 0) + ' callouts de ' + C.name + ' con el nombre que usa el juego en español de Latinoamérica y en inglés, sobre un mapa que podés tocar y con un juego para aprenderlos.' }) +
        tool + sec('Todos los callouts', table + srcLine(h, 'valapi-maps', 'nombres en español') + srcLine(h, 'valapi-maps-en', 'nombres en inglés')) + ar +
        sec('Lo que no mostramos', '<ul class="pa-dot"><li>Tiempos de corrida y rotaciones: el juego no publica la longitud de los caminos, y una distancia en línea recta engaña.</li><li>La rotación de mapas del competitivo: no está en los datos del cliente.</li></ul>');
    },
  };
}
export const ascent = mapPage('ascent', {
  title: 'Ascent en Valorant: callouts en español y mapa interactivo',
  h1: 'Ascent: mapa interactivo con callouts en español',
  description: 'Mapa interactivo de Ascent con los callouts en español y en inglés tal como los trae el juego, por zona, y un juego para aprenderlos antes de jugar.',
});
export const split = mapPage('split', {
  title: 'Split en Valorant: callouts en español y en inglés',
  h1: 'Split: mapa con callouts en español',
  description: 'Mapa interactivo de Split con los callouts en español y en inglés tal como los trae el juego, por zona, y un juego para aprenderlos antes de jugar.',
});

export const WAVE4 = [dota2Hub, dota2Ti, clashHub, clashMazos, clashMeta, brawlHub, brawlMeta, rlHub, eafcHub, lolWorlds, lolMsi, valorantChampions, esportsArgentinos, esportsLatam, sistemaSuizo, ascent, split];
