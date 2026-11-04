// pingalto "academy" (audit 2026-11-04, docs/AUDIT-PINGALTO-2026-11-04.md, sections 5-6): the "how do I start from Argentina"
// block that opens the hubs of LoL, Valorant, Rocket League, Clash Royale and Brawl Stars (price, where it runs, the server and
// the physical ping floor from Buenos Aires, the minimum the publisher asks for, first steps with our tools), and the esports
// glossary (/esports/glosario: one line per term and the page or tool that explains it). Every requirement comes from a saved
// official page (Riot support, the Steam listing, Google Play and the App Store for Argentina) through a quoted fact or a store
// reader that stops the build when the listing changes shape.
import { steamReq, itunes, play } from '../content/stores.mjs';
import { greatCircleKm, fibreRttMs } from '../../../engine/games/geo.mjs';
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';

const link = (h, u, t) => h.built(u.replace(/[#?].*$/, '')) ? '<a href="' + h.href(u.replace(/[#?].*$/, '')) + u.replace(/^[^#?]*/, '') + '">' + t + '</a>' : t;
const ext = (url, t) => '<a href="' + url + '" rel="noopener">' + t + '</a>';
const F = (h, id) => h.pa.fact(id);

// Round trip over a straight fibre from the city of Buenos Aires to a Wikidata city (same model as /kit/ping).
function floorMs(h, q) {
  const P = h.pa, a = P.city('Q1486'), b = P.city(q);
  return fibreRttMs({ km: greatCircleKm(a, b, P.fact('earth_r_km')), c: P.fact('c_ms'), n: P.fact('fiber_n') });
}
const SCL = 'Q2887';

function fact(big, text, small = '') {
  return '<div class="pa-c pa-acf"><p class="pa-big pa-nk">' + big + (small ? ' <small>' + small + '</small>' : '') + '</p><p>' + text + '</p></div>';
}
function reqTable(h, head, rows) {
  return '<div class="pa-tw"><table class="pa-tb pa-acr"><thead><tr><th></th>' + head.map(x => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(([k, ...v]) => '<tr><td>' + k + '</td>' + v.map(x => '<td><samp>' + h.esc(String(x)) + '</samp></td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
function block(h, { title, facts, steps, req, quotes, note = '' }) {
  return '<section class="pa-sec pa-ac" id="empezar"><h2>' + title + '</h2><div class="pa-acg">' + facts.join('') + '</div>' +
    '<div class="pa-two pa-acs"><div><h3>Paso a paso</h3><ol class="pa-steps">' + steps.map(s => '<li><span>' + s + '</span></li>').join('') + '</ol></div>' +
    '<div class="pa-c">' + req + (quotes.length ? '<details class="pa-fx"><summary>Lo que dice la fuente, tal cual</summary>' + quotes.join('') + '</details>' : '') + '</div></div>' + note + '</section>';
}
const sclSay = (h, game) => {
  const ms = floorMs(h, SCL), valve = h.pa.typical('eze', 'scl');
  return 'Desde CABA el piso físico es ' + fmt(ms, 1) + ' ms; entre los puntos de Valve en Buenos Aires y Santiago, el ping típico es ' + fmt(valve, 0) + ' ms. Tu ping real a ' + game + ' suma el tramo desde tu casa.';
};

// ---------- League of Legends ----------
export function lolStart(h) {
  const cpu = F(h, 'lol_req_cpu'), ram = F(h, 'lol_req_ram'), vram = F(h, 'lol_req_vram'), mac = F(h, 'lol_req_mac');
  if (cpu.length !== 4 || ram.length !== 2 || vram.length !== 2 || mac.length !== 3) throw new Error('lol start: requirement facts changed shape');
  const req = '<h3>Lo que pide Riot para Windows</h3>' + reqTable(h, ['Mínimo', 'Recomendado'], [
    ['Procesador', 'Intel ' + cpu[0] + ' o AMD ' + cpu[1], 'Intel ' + cpu[2] + ' o AMD ' + cpu[3]],
    ['Memoria RAM', ram[0] + ' GB', ram[1] + ' GB'],
    ['Memoria de video', vram[0] + ' GB', vram[1] + ' GB'],
    ['Disco libre', F(h, 'lol_req_disk') + ' GB', F(h, 'lol_req_disk') + ' GB (SSD)'],
    ['Sistema', 'Windows 10 (compilación ' + F(h, 'lol_req_win') + ' o posterior) o Windows 11', 'Windows 11 con TPM 2.0'],
    ['Gráficos', F(h, 'lol_req_dx'), F(h, 'lol_req_dx')],
  ]) + '<p class="pa-src">En Mac pide un chip Apple ' + h.esc(F(h, 'lol_req_m1')) + ', ' + h.esc(mac[1]) + ', ' + fmt(mac[2], 0) + ' GB de memoria y ' + fmt(mac[0], 0) + ' GB libres.</p>' +
    srcLine(h, 'riot-lol-req', 'requisitos mínimos y recomendados');
  return block(h, {
    title: 'Cómo empezar a jugar LoL desde Argentina',
    facts: [
      fact('Gratis', 'Se baja y se juega sin pagar: Riot lo anuncia con «Juega gratis» en su sitio.'),
      fact('Windows o Mac', 'Solo compu. Riot no da soporte en Linux, ni en el celu: lo del celu es otro juego, Wild Rift.'),
      fact('LAS', sclSay(h, 'LAS'), 'Santiago'),
      fact(fmt(F(h, 'lol_req_disk'), 0), 'de disco libre en Windows y ' + fmt(ram[0], 0) + ' GB de RAM como mínimo; con lo mínimo, Riot avisa que puede andar con tirones.', 'GB'),
    ],
    steps: [
      'Entrá a ' + ext('https://www.leagueoflegends.com/es-mx/', 'leagueoflegends.com') + ', tocá «Juega gratis», creá tu cuenta de Riot y bajá el instalador.',
      'Elegí el servidor <b>Latinoamérica Sur (LAS)</b>: es el de Argentina y está en Santiago de Chile. LAN es el de Latinoamérica Norte, en Miami.',
      'Hacé el tutorial y unas partidas contra bots. Para tus primeros campeones, ordená la lista de esta página por «Dificultad (de Riot)» y arrancá por los más fáciles.',
      'Cuando llegues a las clasificatorias, mirá cómo se sube de división y cuántas partidas te faltan en ' + link(h, '/lol/rangos', 'rangos de LoL') + '.',
      'Medí tu ping a Santiago desde tu provincia con el ' + link(h, '/kit/ping', 'test de ping') + ' y, si algo no te queda claro, buscalo en el ' + link(h, '/esports/glosario', 'glosario') + '.',
    ],
    req,
    quotes: [quote(h, 'lol_free', 'es'), quote(h, 'lol_req_os', 'es'), quote(h, 'lol_req_warn', 'es'), quote(h, 'lol_las_scl')],
  });
}

// ---------- Valorant ----------
export function valorantStart(h) {
  const fps = F(h, 'val_req_fps'), cpu = F(h, 'val_req_cpu'), gpu = F(h, 'val_req_gpu');
  if (fps.length !== 3 || cpu.length !== 6 || gpu.length !== 7) throw new Error('valorant start: requirement facts changed shape');
  const req = '<h3>Lo que pide Riot</h3>' + reqTable(h, fps.map((f, i) => ['Mínimo', 'Recomendado', 'Alto'][i] + ' · ' + f + ' FPS'), [
    ['Procesador', cpu[0] + ' / ' + cpu[1], cpu[2] + ' / ' + cpu[3], cpu[4] + ' / ' + cpu[5]],
    ['Placa de video', gpu[0] + ' / ' + gpu[1], gpu[2] + ' / ' + gpu[3], gpu[4] + ' / ' + gpu[5] + ' / ' + gpu[6]],
    ['Memoria RAM', F(h, 'val_req_ram') + ' GB', F(h, 'val_req_ram') + ' GB', F(h, 'val_req_ram') + ' GB'],
  ]) + '<p class="pa-src">Con placa de video aparte, al menos ' + fmt(F(h, 'val_req_vram'), 0) + ' GB de memoria de video. Windows 10 (compilación ' + F(h, 'val_req_os') + ' o posterior) u 11, de 64 bits, con ' + h.esc(F(h, 'val_req_dx')) + '.</p>' +
    srcLine(h, 'riot-val-req', 'requisitos para PC');
  return block(h, {
    title: 'Cómo empezar a jugar Valorant desde Argentina',
    facts: [
      fact('Gratis', 'Riot lo ofrece con «Juega gratis»: se baja y se juega sin pagar.'),
      fact('Windows', 'En compu, Windows 10 u 11 de 64 bits. No anda en la nube ni en máquinas virtuales.'),
      fact('Santiago', sclSay(h, 'Valorant'), 'servidor'),
      fact(fmt(F(h, 'val_req_ram'), 0), 'de RAM pide Riot en las tres columnas; para el mínimo apunta a ' + fmt(fps[0], 0) + ' cuadros por segundo.', 'GB'),
    ],
    steps: [
      'Entrá a ' + ext('https://playvalorant.com/es-mx/', 'playvalorant.com') + ', tocá «Juega gratis», creá tu cuenta de Riot y bajá el instalador.',
      'El juego instala también Vanguard, el antitrampas de Riot, y puede pedirte reiniciar. En Windows 11 necesita <samp>TPM 2.0</samp> y arranque seguro activados.',
      'Antes de la primera partida pasá tu sensibilidad de otro juego con el ' + link(h, '/kit/sensibilidad', 'convertidor') + ' y medí el DPI real de tu mouse con el ' + link(h, '/kit/dpi', 'test de DPI') + '.',
      'Elegí un agente para aprender: roles y habilidades en ' + link(h, '/valorant/agentes', 'agentes') + ', y los nombres de cada zona en ' + link(h, '/valorant/mapas/ascent', 'callouts de Ascent') + '.',
      'Para el competitivo, cómo se sube y cuántas partidas te faltan en ' + link(h, '/valorant/rangos', 'rangos de Valorant') + '. Tu ping a Santiago, en el ' + link(h, '/kit/ping', 'test de ping') + '.',
    ],
    req,
    quotes: [quote(h, 'val_free', 'es'), quote(h, 'val_req_os', 'es'), quote(h, 'val_req_cloud', 'es'), quote(h, 'val_scl_ar', 'es')],
  });
}

// ---------- Rocket League ----------
export function rlStart(h) {
  const S = steamReq(h, 'steam-rl', 252950);
  if (!S.ramGb || !S.recRamGb || !S.diskGb || !S.min.Procesador || !S.min['Gráficos']) throw new Error('rl start: Steam requirements changed shape: ' + JSON.stringify(S.min));
  const cons = F(h, 'rl_platforms').filter(p => p !== 'Windows');
  const req = '<h3>Lo que pide Psyonix en compu</h3>' + reqTable(h, ['Mínimo', 'Recomendado'], [
    ['Procesador', S.min.Procesador, S.rec.Procesador],
    ['Memoria RAM', S.min.Memoria, S.rec.Memoria],
    ['Placa de video', S.min['Gráficos'], S.rec['Gráficos']],
    ['Disco libre', S.min.Almacenamiento, S.rec.Almacenamiento],
    ['Sistema', S.min['SO *'] || S.min.SO, (S.rec['SO *'] || S.rec.SO)],
  ]) + '<p class="pa-src">Los requisitos están en la ficha de Steam, que sigue publicada aunque el juego ya no se vende ahí. La página de Epic no se deja leer por programas como el nuestro, así que no la copiamos.</p>' +
    srcLine(h, 'steam-rl', ext(h.esc(h.pa.doc('steam-rl').page), 'ficha de Steam'));
  return block(h, {
    title: 'Cómo empezar a jugar Rocket League desde Argentina',
    facts: [
      fact('Gratis', 'Es free-to-play desde 2020 en todas sus plataformas: se baja sin pagar.'),
      fact('PC y consolas', 'Windows por Epic Games, y ' + cons.map(c => h.esc(c)).join(', ') + '. En Mac y Linux ya no tiene juego en línea.'),
      fact(fmt(S.diskGb, 0), 'de disco libre y ' + fmt(S.ramGb, 0) + ' GB de RAM como mínimo en compu; recomendado, ' + fmt(S.recRamGb, 0) + ' GB.', 'GB'),
    ],
    steps: [
      'En compu, bajá la tienda de ' + ext('https://store.epicgames.com/', 'Epic Games') + ', creá tu cuenta y buscá Rocket League. Si ya lo tenías en Steam, sigue funcionando ahí.',
      'En consola, bajalo de la tienda de tu PlayStation, Xbox o Switch. Para jugar en línea no te piden PlayStation Plus ni Nintendo Switch Online.',
      'Conseguí un joystick si podés: es lo que recomienda Psyonix en la ficha («' + h.esc(S.rec['Notas adicionales'] || 'Gamepad or Controller Recommended') + '»).',
      'Hacé el entrenamiento del juego y unas partidas casuales antes del competitivo.',
      'Seguí la RLCS en esta misma página: ' + link(h, '/rl#mundial', 'el último mundial') + ' y los próximos partidos en hora argentina. ¿Qué chance tiene un equipo en una serie larga? Probalo en la ' + link(h, '/esports/series', 'calculadora de series') + '.',
    ],
    req,
    quotes: [quote(h, 'rl_f2p'), quote(h, 'rl_epic'), quote(h, 'rl_steam_keep'), quote(h, 'rl_noplus'), quote(h, 'rl_mac')],
    note: '<p class="pa-src">Psyonix no publica dónde están sus servidores en una página que podamos citar, así que no te damos un ping inventado. El piso físico desde tu provincia a Santiago y São Paulo está en el ' + link(h, '/kit/ping', 'test de ping') + '.</p>',
  });
}

// ---------- Clash Royale and Brawl Stars ----------
function mobile(h, { name, pre, playSlug, iosSlug, steps, extraFact, quotes }) {
  const P = play(h, playSlug), I = itunes(h, iosSlug);
  if (!I.found || !I.free) throw new Error(name + ' start: the App Store lookup for Argentina changed');
  const age = F(h, pre + '_age');
  const pc = h.pa.src.facts[pre + '_pc'] ? F(h, pre + '_pc') : null;
  const req = '<h3>Lo que dicen las tiendas de Argentina</h3>' + reqTable(h, ['Google Play', 'App Store'], [
    ['Precio', 'Gratis, con compras', I.free ? 'Gratis, con compras' : '-'],
    ['Descargas', P.downloads, 'no lo publica'],
    ['Pide', 'según el celu', 'iOS ' + I.minOs.replace(/\.0$/, '') + ' o más nuevo'],
    ['Tamaño', 'según el celu', fmt(I.bytes / 1e9, 2) + ' GB'],
    ['Edad', 'mayores de ' + age + ' años', I.rating],
  ]) + srcLine(h, playSlug, P.install ? 'con el botón Instalar' : 'sin el botón Instalar en nuestra copia') + srcLine(h, iosSlug, ext(h.esc(h.pa.doc(iosSlug).page), 'ficha del App Store'));
  return block(h, {
    title: 'Cómo empezar a jugar ' + name + ' desde Argentina',
    facts: [
      fact('Gratis', 'Se baja y se juega sin pagar; tiene compras con plata real, algunas con premios al azar.'),
      fact(pc ? 'Celu y PC' : 'Celu', pc ? 'Android y iPhone, y en compu con Google Play Juegos para Windows.' : 'Android y iPhone, desde las tiendas oficiales de Argentina.'),
      extraFact,
      fact('+' + age, 'Google Play lo marca para mayores de ' + age + ' años; el App Store, ' + h.esc(I.rating) + '.', 'años'),
    ],
    steps,
    req,
    quotes,
    note: '<p class="pa-src">Supercell no publica dónde están sus servidores, así que no te damos un ping inventado. Las tiendas cambian: estos datos son de la copia del ' + h.fmtDate(h.pa.doc(playSlug).fetched) + '.</p>',
  });
}
export function clashStart(h) {
  return mobile(h, {
    name: 'Clash Royale', pre: 'cr', playSlug: 'play-cr-ar', iosSlug: 'itunes-cr-ar',
    extraFact: fact('PvP', 'Partidas en vivo contra otra persona: cada uno con su mazo, a voltear las torres del otro.'),
    steps: [
      'Bajalo de Google Play o del App Store, siempre desde la tienda: un APK de otra página puede traer cualquier cosa.',
      'Vinculá tu cuenta con Supercell ID en los ajustes del juego, así no la perdés si cambiás de celu.',
      'Jugá con el mazo que te da el juego y, cuando tengas cartas, armá el tuyo en el ' + link(h, '/clash/mazos', 'constructor de mazos') + ' y mirá todas en ' + link(h, '/clash/cartas', 'cartas') + '.',
      'Fijate qué llevan los mejores del país en ' + link(h, '/clash/meta', 'el meta argentino') + ' y sumate a un clan para pedir cartas.',
      'Si el celu es de un chico, desactivá las compras integradas en los ajustes del teléfono.',
    ],
    quotes: [quote(h, 'cr_free', 'es'), quote(h, 'cr_nobuy', 'es'), quote(h, 'cr_pvp', 'es'), quote(h, 'cr_pc', 'es')],
  });
}
export function brawlStart(h) {
  return mobile(h, {
    name: 'Brawl Stars', pre: 'bs', playSlug: 'play-bs-ar', iosSlug: 'itunes-bs-ar',
    extraFact: fact('3c3', 'Peleas de a tres contra tres, y modos de supervivencia; según Supercell, partidas de menos de tres minutos.'),
    steps: [
      'Bajalo de Google Play o del App Store, siempre desde la tienda: un APK de otra página puede traer cualquier cosa.',
      'Vinculá tu cuenta con Supercell ID en los ajustes del juego, así no la perdés si cambiás de celu.',
      'Mirá qué modos y mapas están hoy en ' + link(h, '/brawl/eventos', 'los eventos') + ' y con qué brawler conviene entrar en ' + link(h, '/brawl/meta', 'el meta argentino') + '.',
      'Conocé cada brawler, sus gadgets y habilidades estelares en ' + link(h, '/brawl/brawlers', 'todos los brawlers') + '.',
      'Si el celu es de un chico, deshabilitá las compras integradas en los ajustes del teléfono.',
    ],
    quotes: [quote(h, 'bs_free', 'es'), quote(h, 'bs_nobuy', 'es'), quote(h, 'bs_3v3', 'es'), quote(h, 'bs_short', 'es')],
  });
}

// ---------- /esports/glosario ----------
const CATS = [['fmt', 'Formatos y torneos'], ['rank', 'Rankings y rangos'], ['mouse', 'Mouse y mira'], ['red', 'Red y servidores'], ['game', 'Juegos y partidas']];
// [term, also called, category, one line, [path, link text]]
const TERMS = [
  ['Bo1', 'al mejor de uno', 'fmt', 'Un solo mapa o partida decide la serie: el formato con más sorpresas.', ['/esports/series', 'Calculadora de series']],
  ['Bo3', 'al mejor de tres', 'fmt', 'Gana la serie el primero que se lleva dos mapas; el formato más común en CS2 y Valorant.', ['/esports/series', 'De la chance por mapa a la de la serie']],
  ['Bo5', 'al mejor de cinco', 'fmt', 'Gana el primero que llega a tres: se usa en finales y le deja poco lugar a la suerte.', ['/esports/series', 'Calculadora de series']],
  ['Sistema suizo', 'Swiss', 'fmt', 'Fase donde cada ronda te cruza con equipos que tienen tu mismo récord, hasta que pasás o quedás afuera.', ['/esports/sistema-suizo', 'Simulador de sistema suizo']],
  ['Major', '', 'fmt', 'Los torneos más grandes de CS2, con fases suizas e invitaciones según el ranking de Valve.', ['/cs2/major', 'El Major explicado']],
  ['Playoffs', 'eliminación directa', 'fmt', 'Llaves en las que el que pierde la serie queda afuera, después de la fase de grupos o la suiza.', ['/cs2/major', 'Fases del Major']],
  ['Worlds', 'el mundial de LoL', 'fmt', 'El campeonato mundial de League of Legends, el torneo más importante del año en LoL.', ['/lol/worlds', 'Worlds en hora argentina']],
  ['MSI', 'Mid-Season Invitational', 'fmt', 'El torneo internacional de mitad de año de LoL, con los campeones de cada liga.', ['/lol/msi', 'MSI']],
  ['VCT', 'Valorant Champions Tour', 'fmt', 'El circuito oficial de Valorant: ligas regionales, Masters y Champions al final.', ['/valorant/champions', 'VCT en hora argentina']],
  ['The International', 'TI', 'fmt', 'El mundial de Dota 2.', ['/dota2/ti', 'The International']],
  ['RLCS', 'Rocket League Championship Series', 'fmt', 'El circuito oficial de Rocket League, con Majors y un mundial.', ['/rl', 'La RLCS desde Argentina']],
  ['LAN', 'torneo presencial', 'fmt', 'Torneo con todos los equipos en el mismo lugar, sin ping de por medio. No confundir con el servidor LAN de LoL.', ['/esports/agenda', 'Agenda de partidos']],
  ['VRS', 'Valve Regional Standings', 'rank', 'El ranking oficial de equipos de CS2 que arma Valve y usa para invitar a sus torneos.', ['/cs2#ranking', 'Ranking VRS']],
  ['Elo', '', 'rank', 'Sistema de puntos en el que ganarle a alguien más fuerte suma más que ganarle a uno más débil.', ['/cs2#ranking', 'Cómo arma Valve su ranking']],
  ['MMR', 'matchmaking rating', 'rank', 'El puntaje oculto que usa el juego para armar partidas parejas; no es lo mismo que el rango que ves.', ['/valorant/rangos', 'Rangos de Valorant']],
  ['RR', 'CR, clasificación de rango', 'rank', 'Los puntos que ganás o perdés en cada partida competitiva de Valorant para subir de rango.', ['/valorant/rangos', 'Calculadora de RR']],
  ['PL', 'puntos de liga, LP', 'rank', 'Los puntos de las clasificatorias de LoL: juntás los que pide Riot y subís de división.', ['/lol/rangos', 'Rangos de LoL']],
  ['División', '', 'rank', 'Cada escalón dentro de un rango, como Oro IV a Oro I en LoL.', ['/lol/rangos', 'Rangos y divisiones']],
  ['Tier list', '', 'rank', 'Ranking de personajes, cartas o mapas en filas (S, A, B…) según qué tan buenos son hoy.', ['/tier-list', 'Armá tu tier list']],
  ['Meta', '', 'rank', 'Lo que más se usa en un momento porque hoy rinde más: cambia con cada actualización.', ['/clash/meta', 'Meta de Clash Royale']],
  ['DPI', 'CPI', 'mouse', 'Cuántos puntos manda el mouse por cada pulgada que lo movés; la caja no siempre dice la verdad.', ['/kit/dpi', 'Medí tu DPI real']],
  ['eDPI', '', 'mouse', 'DPI por sensibilidad del juego: sirve para comparar tu ajuste con el de otro jugador del mismo juego.', ['/kit/dpi', 'Test de DPI']],
  ['cm/360', 'centímetros por vuelta', 'mouse', 'Cuántos centímetros movés el mouse para dar una vuelta completa; sirve para comparar entre juegos.', ['/kit/sensibilidad', 'Convertidor de sensibilidad']],
  ['Sensibilidad', 'sens', 'mouse', 'El multiplicador del juego para el movimiento del mouse o del dedo en el celu.', ['/ff/sensibilidad', 'Sensibilidad de Free Fire']],
  ['Mira', 'crosshair', 'mouse', 'La marca del centro de la pantalla; en CS2 se comparte con un código.', ['/cs2/mira', 'Creador de miras de CS2']],
  ['Callouts', '', 'mouse', 'Los nombres de cada zona de un mapa para avisarle al equipo dónde está el rival.', ['/valorant/mapas/ascent', 'Callouts de Ascent']],
  ['Ping', 'latencia', 'red', 'Lo que tarda un dato en ir hasta el servidor y volver, en milisegundos: menos es mejor.', ['/kit/ping', 'Test de ping']],
  ['LAS', 'Latinoamérica Sur', 'red', 'El servidor de LoL para Argentina, en Santiago de Chile.', ['/lol', 'LoL desde Argentina']],
  ['LAN', 'Latinoamérica Norte', 'red', 'El servidor de LoL para el norte de Latinoamérica, en Miami: desde Argentina queda lejos.', ['/kit/ping', 'Ping a Miami']],
  ['FPS', 'cuadros por segundo', 'red', 'Cuántas imágenes por segundo dibuja tu compu; los requisitos de Riot para Valorant se miden así.', ['/valorant#empezar', 'Lo que pide Valorant']],
  ['Nube', 'cloud gaming', 'red', 'Jugar en un servidor remoto que te manda el video: no hace falta bajar el juego, sí buena conexión.', ['/fortnite/nube', 'Fortnite en la nube']],
  ['MOBA', '', 'game', 'Dos equipos de cinco que empujan por carriles para romper la base rival, como LoL o Dota 2.', ['/lol', 'League of Legends']],
  ['Battle royale', '', 'game', 'Muchos jugadores caen a un mapa que se achica y gana el último en pie.', ['/ff', 'Free Fire']],
  ['Shooter táctico', '', 'game', 'Disparos de equipo por rondas, con un objetivo como plantar una bomba, como CS2 o Valorant.', ['/cs2', 'Counter-Strike 2']],
  ['Free-to-play', 'F2P', 'game', 'Se baja y se juega gratis; el juego vende cosas adentro.', ['/rl#empezar', 'Ejemplo: Rocket League']],
  ['Agente', '', 'game', 'Cada personaje de Valorant, con sus habilidades y su rol.', ['/valorant/agentes', 'Agentes de Valorant']],
  ['Campeón', 'champ', 'game', 'Cada personaje que elegís en LoL.', ['/lol', 'Todos los campeones']],
  ['Brawler', '', 'game', 'Cada personaje de Brawl Stars, con su ataque, su súper, gadgets y habilidades estelares.', ['/brawl/brawlers', 'Todos los brawlers']],
  ['Mazo', 'deck', 'game', 'Las ocho cartas con las que entrás a una partida de Clash Royale.', ['/clash/mazos', 'Constructor de mazos']],
  ['Elixir', '', 'game', 'El recurso de Clash Royale que se recarga solo y pagás para tirar cada carta.', ['/clash/cartas', 'Todas las cartas']],
  ['Ciclo', '', 'game', 'Lo que te cuesta volver a tener una carta en la mano en Clash Royale: mazos baratos ciclan más rápido.', ['/clash/mazos', 'Medí el ciclo de tu mazo']],
];
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const glosario = {
  path: '/esports/glosario',
  kind: 'hub',
  title: 'Glosario de esports: Bo3, VRS, eDPI, LAS, meta y más',
  description: 'Las palabras de los esports y los juegos competitivos explicadas en una línea: Bo1, Bo3, sistema suizo, VRS, MMR, eDPI, cm/360, LAS, meta y tier list.',
  h1: 'Glosario de esports',
  scripts: ['gloss.js'],
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Glosario de esports de pingalto', inLanguage: 'es-AR', url: 'https://' + h.site.domain + h.page.path,
    hasDefinedTerm: TERMS.map(([t, a, , d]) => ({ '@type': 'DefinedTerm', name: t, ...(a ? { alternateName: a } : {}), description: d })) }]),
  render(h) {
    const seen = new Set();
    const idOf = t => { let id = 'g-' + norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); while (seen.has(id)) id += '-2'; seen.add(id); return id; };
    const card = ([t, a, c, d, [u, lt]]) => '<li class="pa-c pa-gl" id="' + idOf(t) + '" data-c="' + c + '" data-q="' + h.esc(norm(t + ' ' + a + ' ' + d)) + '"><h3>' + h.esc(t) + (a ? ' <small>' + h.esc(a) + '</small>' : '') + '</h3><p>' + h.esc(d) + '</p>' +
      (h.built(u.replace(/#.*$/, '')) ? '<p class="pa-gll">' + link(h, u, h.esc(lt) + ' →') + '</p>' : '') + '</li>';
    const seg = '<div class="pa-seg" role="group" aria-label="Filtrar por tema"><button type="button" data-gc="" aria-pressed="true">Todo · ' + fmt(TERMS.length, 0) + '</button>' +
      CATS.map(([k, l]) => '<button type="button" data-gc="' + k + '" aria-pressed="false">' + l + '</button>').join('') + '</div>';
    const tool = '<div class="pa-sec"><div class="pa-c pa-fm" id="pa-gs"><div class="pa-f"><label for="gl-q">Buscá una palabra</label><input id="gl-q" type="search" autocomplete="off" placeholder="por ejemplo Bo3 o eDPI"></div>' + seg + '<p class="pa-x" data-o="gn">' + fmt(TERMS.length, 0) + ' palabras</p></div></div>';
    const groups = CATS.map(([k, l]) => '<section class="pa-sec" data-gs="' + k + '"><h2>' + l + '</h2><ul class="pa-gls">' + TERMS.filter(x => x[2] === k).map(card).join('') + '</ul></section>').join('');
    return hero(h, { ey: 'Esports · glosario · en una línea', sub: 'Las palabras que vas a escuchar en un stream o en una partida, cada una con la herramienta o la página de pingalto que la explica a fondo.' }) +
      tool + groups + '<div class="pa-sec"><p class="pa-src" data-o="g0" hidden>No encontramos esa palabra. Probá con otra o escribinos desde ' + link(h, '/contacto', 'contacto') + ' para sumarla.</p></div>';
  },
};
