// Game hubs that answer "what is this game and how do I play it from Argentina" (audit 2026-11-04, docs/AUDIT-PINGALTO-2026-11-04.md):
// pieces of the /cs2 hub (Steam's own minimum requirements with a "does it run" check and the download time, Valve's network
// points near Argentina, Counter-Strike 1.6 on Steam), /fortnite (where and how to play from Argentina on each device, from the
// Google Play listing for Argentina, Wikipedia and Microsoft's Xbox page) and /ff/max (Free Fire or Free Fire MAX: Garena's own
// words, the Google Play and App Store listings for Argentina, and what that means for your phone). Every value comes from a
// saved listing (content/stores.mjs); a listing that changed shape stops the build.
import { steamApp, itunes, play, millions } from '../content/stores.mjs';
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const cards = (h, list) => '<div class="pa-hub">' + list.filter(([u]) => h.built(u)).map(([u, t, s]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + s + '</p></a>').join('') + '</div>';
const opt = (list, sel) => list.map(([v, t]) => '<option value="' + v + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + t + '</option>').join('');
const usd = p => 'US$ ' + fmt(p.cents / 100, 2);
const steamLink = (h, slug) => h.esc(h.pa.doc(slug).page);

// ---------- /cs2: requirements, download, servers, 1.6 ----------
export function cs2Facts(h) {
  const A = steamApp(h, 'steam-cs2', 730);
  if (!A.free) throw new Error('cs2: Steam no longer lists CS2 as free');
  const threads = /CPU de (\d+) subprocesos/.exec(A.min.Procesador);
  const vram = /al menos (\d+) GB/.exec(A.min['Gráficos']);
  const dx = /Versión (\d+)/.exec(A.min.DirectX || '');
  if (!threads || !vram || !dx || !A.ramGb || !A.diskGb || !/^Windows® 10$/.test(A.min.SO)) throw new Error('cs2: Steam minimum requirements changed shape: ' + JSON.stringify(A.min));
  const es = A.langs.filter(l => /^Español/.test(l));
  return { A, threads: +threads[1], vram: +vram[1], dx: +dx[1], es };
}
const DL_EX = 50;
export function cs2ReqData(h) {
  const F = cs2Facts(h);
  return { req: { threads: F.threads, ram: F.A.ramGb, vram: F.vram, disk: F.A.diskGb } };
}
export function cs2Req(h) {
  const F = cs2Facts(h), A = F.A;
  const hrs = (A.diskGb * 8000) / DL_EX / 3600;
  const form = '<form class="pa-c pa-fm" id="pa-rq" autocomplete="off"><h2>¿Te corre CS2?</h2>' +
    field('rq-os', 'Sistema', '<select id="rq-os" name="os">' + opt([['win', 'Windows 10 u 11'], ['old', 'Windows 7 u 8'], ['linux', 'Linux'], ['mac', 'Mac']], 'win') + '</select>') +
    '<div class="pa-row">' + field('rq-cpu', 'Hilos del procesador', '<select id="rq-cpu" name="cpu">' + opt([['2', '2'], ['4', '4'], ['6', '6'], ['8', '8'], ['12', '12 o más'], ['0', 'No sé']], 4) + '</select>', 'Administrador de tareas, Rendimiento: «Procesadores lógicos».') +
    field('rq-ram', 'Memoria RAM', '<select id="rq-ram" name="ram">' + opt([[4, '4 GB'], [6, '6 GB'], [8, '8 GB'], [12, '12 GB'], [16, '16 GB'], [32, '32 GB o más']], 8) + '</select>') + '</div>' +
    '<div class="pa-row">' + field('rq-gpu', 'Memoria de la placa de video', '<select id="rq-gpu" name="gpu">' + opt([[0, 'Menos de 1 GB o no sé'], [1, '1 GB'], [2, '2 GB'], [4, '4 GB'], [6, '6 GB'], [8, '8 GB o más']], 2) + '</select>') +
    field('rq-disk', 'GB libres en el disco', '<input id="rq-disk" name="disk" type="text" inputmode="numeric" autocomplete="off" value="120">') + '</div>' +
    field('rq-net', 'Tu internet, en Mbps', '<input id="rq-net" name="net" type="text" inputmode="decimal" autocomplete="off" value="' + DL_EX + '">', 'Lo ves en un test de velocidad o en tu factura.') +
    '<p class="pa-x"><b>ejemplo</b> · cambiá los valores y la respuesta se actualiza</p></form>';
  const row = (k, l, need) => '<li data-rq="' + k + '" data-st="ok"><b>Sí</b><span>' + l + ': <small>' + need + '</small></span></li>';
  const res = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Contra el mínimo que publica Valve en Steam</p><p class="pa-big pa-nk" data-o="rq">Sí, llega</p>' +
    '<ul class="pa-rq">' + row('os', 'Sistema', h.esc(A.min.SO) + ' (o Linux)') + row('cpu', 'Procesador', fmt(F.threads, 0) + ' hilos') + row('ram', 'RAM', fmt(A.ramGb, 0) + ' GB') + row('gpu', 'Placa de video', fmt(F.vram, 0) + ' GB, DirectX ' + F.dx) + row('disk', 'Disco', fmt(A.diskGb, 0) + ' GB libres') + '</ul>' +
    '<p class="pa-say" data-o="rqsay">Llegar al mínimo quiere decir que el juego arranca; para jugar fluido conviene tener más.</p>' +
    '<p class="pa-x">Descarga de ' + fmt(A.diskGb, 0) + ' GB</p><p class="pa-big pa-nk" data-o="dl">' + fmt(hrs, 1) + ' <small>horas</small></p>' +
    '<p class="pa-say" data-o="dlsay">A ' + fmt(DL_EX, 0) + ' Mbps, si la conexión va todo el tiempo a esa velocidad.</p>' +
    '<details class="pa-fx"><summary>Ver la cuenta</summary><code>horas = GB × 8.000 ÷ Mbps ÷ 3.600\n' + fmt(A.diskGb, 0) + ' × 8.000 ÷ ' + fmt(DL_EX, 0) + ' ÷ 3.600 = ' + fmt(hrs, 2) + '</code><p class="pa-src">1 GB = 8.000 megabits. Steam puede bajar algo menos que el espacio que pide, y tu conexión casi nunca va al máximo todo el rato: tomalo como una idea, no como un reloj.</p></details></div>';
  return '<div class="pa-tool">' + form + res + '</div>';
}
export function cs2About(h) {
  const F = cs2Facts(h), A = F.A;
  const plat = [A.platforms.windows && 'Windows', A.platforms.linux && 'Linux'].filter(Boolean);
  const facts = '<div class="pa-gd"><section class="pa-c pa-w2"><p class="pa-big pa-nk">Gratis</p><p>En Steam figura como Free to Play: se baja y se juega sin pagar. Tiene compras dentro del juego, que en pingalto no tratamos.</p></section>' +
    '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + plat.join(' y ') + '</p><p>' + (A.platforms.mac ? 'También Mac.' : 'No hay versión para Mac ni para consolas: es un juego de compu.') + '</p></section>' +
    '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + fmt(A.diskGb, 0) + ' <small>GB</small></p><p>de espacio libre que pide Steam' + (F.es.length ? '. Textos en ' + h.esc(F.es.map(l => l.replace(/^Español/, 'español')).join(' y ')) : '') + '.</p></section></div>';
  const steps = sec('Cómo empezar a jugar', '<div class="pa-two"><ol class="pa-steps"><li><span>Creá una cuenta de Steam y bajá Steam en tu compu desde <a href="https://store.steampowered.com/" rel="noopener">store.steampowered.com</a>.</span></li>' +
    '<li><span>Buscá Counter-Strike 2 en la tienda y tocá «Jugar». Se baja como cualquier juego de Steam: fijate arriba cuánto tarda con tu internet.</span></li>' +
    '<li><span>Antes de la primera partida, pasá tu sensibilidad de otro juego con el <a href="' + h.href('/kit/sensibilidad') + '">conversor</a> y armá tu mira con el <a href="' + h.href('/cs2/mira') + '">creador de miras</a>.</span></li>' +
    '<li><span>Mirá cuánto ping le sacás a Buenos Aires, Santiago o São Paulo con el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</span></li></ol>' +
    '<div class="pa-c"><h3>Lo que pide Valve, tal cual</h3><div class="pa-tw"><table class="pa-tb"><tbody>' + Object.entries(A.min).map(([k, v]) => '<tr><td>' + h.esc(k) + '</td><td lang="es"><samp>' + h.esc(v) + '</samp></td></tr>').join('') + '</tbody></table></div>' +
    srcLine(h, 'steam-cs2', 'requisitos mínimos para Windows, <a href="' + steamLink(h, 'steam-cs2') + '" rel="noopener">ficha de Steam</a>') + '</div></div>');
  return { facts, steps };
}
export function cs2Servers(h) {
  const P = h.pa, home = P.pop('eze');
  const rows = ['scl', 'gru', 'lim'].map(c => { const t = P.pop(c); return [t.desc, P.typical('eze', c)]; });
  return sec('Los servidores de Valve más cerca', '<div class="pa-two"><div class="pa-tw"><table class="pa-tb"><thead><tr><th>Desde ' + h.esc(home.desc) + ' hasta</th><th class="pa-n">Ping típico de Valve</th></tr></thead><tbody>' +
    rows.map(([d, ms]) => '<tr><td>' + h.esc(d) + '</td><td class="pa-n">' + fmt(ms, 0) + ' ms</td></tr>').join('') + '</tbody></table></div>' +
    '<div><p>Valve tiene un punto de su red en Buenos Aires. Los números son los pings típicos entre sus propios puntos que Valve publica en su configuración de red: tu ping real suma el tramo desde tu casa. Medilo desde tu provincia en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p>' + srcLine(h, 'valve-sdr', 'revisión ' + h.esc(String(P.sdrRevision))) + '</div></div>');
}
export function cs16(h) {
  const A = steamApp(h, 'steam-cs16', 10);
  if (A.free || !A.price) throw new Error('cs16: expected a paid app');
  return sec('¿Y Counter-Strike 1.6?', '<div class="pa-two"><div><p>El clásico de los cyber sigue a la venta en Steam como «' + h.esc(A.name) + '»: cuesta <b>' + usd(A.price) + '</b> en la tienda para Argentina y salió el ' + h.esc(A.date.toLowerCase()) + '. Es la única copia oficial: los «Counter-Strike 1.6 descargar gratis» de otras páginas no son de Valve y pueden traer cualquier cosa.</p>' +
    srcLine(h, 'steam-cs16', '<a href="' + steamLink(h, 'steam-cs16') + '" rel="noopener">ficha de Steam</a>') + '</div>' +
    '<div class="pa-c"><h3>Lo que pide</h3><p lang="es">' + h.esc(strip16(A)) + '</p><p class="pa-src">Corre en casi cualquier compu de hoy. Si querés el juego gratis y actual de la saga, es Counter-Strike 2.</p></div></div>');
}
function strip16(A) {
  const t = A.min['Mínimo'];
  if (!/MHz/.test(t || '')) throw new Error('cs16: requirements changed: ' + JSON.stringify(A.min));
  return t;
}

// ---------- /fortnite ----------
const DEV = [
  ['android', 'Celular Android'],
  ['iphone', 'iPhone o iPad'],
  ['pc', 'Compu'],
  ['console', 'Consola'],
  ['low', 'Celu o compu con poco espacio'],
];
export const fortniteHub = {
  path: '/fortnite',
  kind: 'hub',
  title: 'Fortnite en Argentina: cómo jugarlo gratis en cada aparato',
  description: 'Cómo jugar Fortnite gratis desde Argentina en Android, iPhone, compu o consola: qué tienda sirve, qué pasa en iPhone y cómo jugarlo en la nube sin bajarlo.',
  h1: 'Fortnite desde Argentina: dónde y cómo jugarlo',
  scripts: ['fnhub.js'],
  ld: h => ldPage(h),
  render(h) {
    const P = play(h, 'play-fortnite-ar');
    if (!P.install) throw new Error('fortnite: the saved Google Play listing for Argentina no longer shows Install');
    const plats = h.pa.fact('fn_platforms');
    const modes = h.pa.fact('fn_modes');
    const lo = h.pa.fact('xbox_min_mbps');
    const how = {
      android: '<ol class="pa-steps"><li><span>Abrí Google Play y buscá Fortnite, de Epic Games. En la ficha para Argentina que guardamos aparece el botón Instalar.</span></li><li><span>Instalala, abrila e iniciá sesión con una cuenta de Epic Games (si no tenés, se crea ahí).</span></li><li><span>Bajá solo de Google Play: las «Fortnite APK» de otras páginas no son de Epic.</span></li></ol>',
      iphone: '<ol class="pa-steps"><li><span>Fortnite volvió al App Store de Estados Unidos y a Europa por otra tienda; para Argentina no encontramos esa vuelta en las fuentes que citamos.</span></li><li><span>La vía que sí está confirmada para el país: Xbox Cloud Gaming, gratis y sin suscripción, desde Safari en xbox.com/play.</span></li><li><span>Necesitás unos ' + fmt(lo, 0) + ' Mbps: mirá cuántos GB del plan se lleva en <a href="' + h.href('/fortnite/nube') + '">Fortnite en la nube</a>.</span></li></ol>',
      pc: '<ol class="pa-steps"><li><span>En Windows, se juega con el lanzador de Epic Games: lo bajás de la web de Epic e instalás Fortnite desde ahí.</span></li><li><span>En Mac, el cliente ya no se actualiza: jugá en la nube desde el navegador.</span></li><li><span>Con una compu vieja también sirve la nube: el juego corre en un servidor y a vos te llega el video.</span></li></ol>',
      console: '<ol class="pa-steps"><li><span>Está en PlayStation 4 y 5, Xbox One y Series X/S, y Nintendo Switch y Switch 2.</span></li><li><span>Se baja gratis desde la tienda de tu consola.</span></li><li><span>La misma cuenta de Epic te sirve en todos lados: lo que tengas en un aparato lo ves en otro.</span></li></ol>',
      low: '<ol class="pa-steps"><li><span>Si no te entra o tu aparato no da, jugá en la nube: Xbox Cloud Gaming, gratis para Fortnite, desde el navegador.</span></li><li><span>Pide ' + fmt(lo, 0) + ' Mbps de bajada y mejor Wi-Fi de 5 GHz.</span></li><li><span>Cuántos GB se lleva por hora y cuánto te rinde el plan: <a href="' + h.href('/fortnite/nube') + '">calculadora de la nube</a>.</span></li></ol>',
    };
    const seg = '<div class="pa-seg" role="group" aria-label="Tu aparato">' + DEV.map(([k, t], i) => '<button type="button" data-dev="' + k + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + t + '</button>').join('') + '</div>';
    const tool = '<div class="pa-c pa-fm" id="pa-fn" style="margin:28px 28px 0"><h2>¿Con qué vas a jugar?</h2>' + seg +
      DEV.map(([k], i) => '<div data-how="' + k + '"' + (i === 0 ? '' : ' hidden') + '>' + how[k] + '</div>').join('') + '</div>';
    const what = sec('Qué es y qué modos tiene', '<div class="pa-two"><div><p>Fortnite es un juego gratis de Epic Games. El modo más conocido es Battle Royale: caés en una isla y gana el último que queda en pie. Además hay modos sin construir, de música, de LEGO y miles de juegos hechos por otros creadores.</p>' + quote(h, 'fn_free', 'es') + quote(h, 'fn_ranked', 'es') + '</div>' +
      '<div class="pa-c"><h3>Modos en la app para celulares</h3><ul class="pa-mapl">' + modes.map(m => '<li><b>' + h.esc(m) + '</b></li>').join('') + '</ul>' + quote(h, 'fn_modes', 'es') + '</div></div>');
    const where = sec('Dónde está, aparato por aparato', '<div class="pa-two"><div class="pa-tw"><table class="pa-tb"><thead><tr><th>Aparato</th><th>Desde Argentina</th></tr></thead><tbody>' +
      '<tr><td>Android</td><td>Google Play, ficha para Argentina con botón Instalar · ' + h.esc(P.downloads.replace(' M+', ' millones o más')) + ' de descargas</td></tr>' +
      '<tr><td>iPhone y iPad</td><td>En la nube (Safari, xbox.com/play)</td></tr>' +
      '<tr><td>Windows</td><td>Lanzador de Epic Games</td></tr><tr><td>Mac</td><td>En la nube: el cliente no se actualiza</td></tr>' +
      '<tr><td>Consolas</td><td>' + h.esc(plats.filter(p => /PlayStation|Xbox|Switch/.test(p)).join(', ')) + '</td></tr></tbody></table></div>' +
      '<div>' + quote(h, 'fn_ios_us') + quote(h, 'fn_ios_eu') + quote(h, 'fn_cloud') + quote(h, 'fn_mac') + quote(h, 'xbox_ar_fortnite') + '</div></div>' + srcLine(h, 'play-fortnite-ar') + srcLine(h, 'wp-fortnite'));
    const parents = sec('Para padres y para tu bolsillo', '<div class="pa-three"><div class="pa-c"><h3>Clasificación</h3><p>En Google Play figura para <b>Adolescentes</b>, con contenido diverso y usuarios que interactúan entre sí.</p>' + quote(h, 'fn_buy', 'es') + '</div>' +
      '<div class="pa-c"><h3>Gratis, con compras</h3><p>Jugar no cuesta nada. Lo que se vende son trajes, pases y monedas del juego: en pingalto no listamos la tienda ni precios.</p></div>' +
      '<div class="pa-c"><h3>«Pavos gratis»</h3><p>No existen generadores de monedas. Las páginas que los prometen quieren tu cuenta de Epic: no pongas tu contraseña fuera del juego o de la web de Epic.</p></div></div>');
    const no = sec('Lo que todavía no tenemos', '<div class="pa-three"><div class="pa-c"><h3>Tracker de estadísticas</h3><p>Ver K/D y victorias de un jugador pide un servicio con clave que todavía no tenemos. Si lo sumamos, va a estar acá.</p></div>' +
      '<div class="pa-c"><h3>Temporada y rangos</h3><p>El sitio de Fortnite no deja que lo lea un programa como el nuestro, y no copiamos fechas de otros sitios.</p></div>' +
      '<div class="pa-c"><h3>Tienda del día</h3><p>Son skins y precios: pingalto no muestra tiendas de skins ni cajas.</p></div></div>');
    const tools = sec('Herramientas para Fortnite', cards(h, [['/fortnite/nube', 'Fortnite en la nube', 'Cuántos GB del plan se lleva y qué velocidad pide Microsoft.'], ['/kit/ping', 'Test de ping', 'Tu ping desde tu provincia y el mínimo que permite la física.'], ['/tier-list', 'Tier list', 'Armá la tuya de armas, modos o lugares de caída y compartila.'], ['/kit/dpi', 'DPI real del mouse', 'Medilo con la tarjeta SUBE.']]));
    return hero(h, { ey: 'Fortnite · ' + fmt(millions(P.downloads), 0) + ' M+ descargas en Google Play', girl: true, sub: 'Fortnite es gratis. Lo que cambia es por dónde entrás: Google Play en Android, la tienda de tu consola, Epic en la compu y la nube de Xbox en iPhone. Elegí tu aparato.' }) +
      tool + what + where + tools + parents + no;
  },
};

// ---------- /ff/max ----------
export const ffMax = {
  path: '/ff/max',
  kind: 'tool',
  title: 'Free Fire MAX en Argentina: qué cambia y si podés bajarlo',
  description: 'Free Fire MAX o Free Fire: qué cambia según Garena, si aparece en Google Play y App Store de Argentina, cuánto ocupa y por qué tu cuenta sirve en los dos.',
  h1: 'Free Fire MAX o Free Fire: cuál bajar en Argentina',
  scripts: ['ffmax.js'],
  data: h => ffMaxData(h),
  ld: h => ldPage(h),
  render(h) {
    const D = ffMaxData(h);
    const seg = (name, list) => '<div class="pa-seg" role="group" aria-label="' + name + '">' + list.map(([k, t], i) => '<button type="button" data-' + name.toLowerCase().replace(/\s.*/, '') + '="' + k + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + t + '</button>').join('') + '</div>';
    const form = '<div class="pa-c pa-fm" id="pa-mx"><h2>Tu celular</h2>' + seg('Sistema', [['android', 'Android'], ['ios', 'iPhone'], ['pc', 'Compu']]) +
      field('mx-free', 'GB libres en el celu', '<input id="mx-free" type="text" inputmode="decimal" autocomplete="off" value="4">', 'Ajustes, Almacenamiento.') +
      '<label class="pa-ck"><input type="checkbox" id="mx-old"><span>Mi celu es viejo o se traba con otros juegos</span></label></div>';
    const res = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Para tu caso</p><p class="pa-big pa-nk" data-o="mx">' + h.esc(D.first.v) + '</p><p class="pa-say" data-o="mxsay">' + D.first.say + '</p></div>';
    const cmp = sec('Free Fire y Free Fire MAX, lado a lado', '<div class="pa-tw"><table class="pa-tb"><thead><tr><th></th><th>Free Fire</th><th>Free Fire MAX</th></tr></thead><tbody>' +
      '<tr><td>Qué dice Garena</td><td>Pensado para casi todos los celulares</td><td>Gráficos Ultra HD, «experiencia premium»</td></tr>' +
      '<tr><td>Google Play, Argentina</td><td>' + (D.ffInstall ? 'Botón Instalar' : 'Sin botón Instalar') + ' · ' + fmt(D.ffDl, 0) + ' M+ descargas</td><td>' + (D.maxInstall ? 'Botón Instalar' : 'Sin botón Instalar en nuestra copia') + ' · ' + fmt(D.maxDl, 0) + ' M+ descargas</td></tr>' +
      '<tr><td>App Store, Argentina</td><td>' + (D.ffIos.found ? 'Está · pide iOS ' + h.esc(D.ffIos.minOs.replace(/\.0$/, '')) + ' · ' + fmt(D.ffIos.gb, 2) + ' GB' : 'No aparece') + '</td><td>' + (D.maxIosAr ? 'Está' : 'No aparece') + (D.maxIosUs ? ' (en EE. UU. sí: iOS ' + h.esc(D.maxIosUs.minOs.replace(/\.0$/, '')) + ', ' + fmt(D.maxIosUs.gb, 2) + ' GB)' : '') + '</td></tr>' +
      '<tr><td>Compu</td><td>-</td><td>Google Play la lista también para Windows</td></tr>' +
      '<tr><td>Cuenta y partidas</td><td colspan="2">La misma: los dos juegan juntos (Firelink)</td></tr></tbody></table></div>' +
      '<p class="pa-src">Copias del ' + h.fmtDate(h.pa.doc('play-ffmax-ar').fetched) + ', vistas sin iniciar sesión. Garena no publica requisitos mínimos (RAM, versión de Android) de ninguno de los dos: por eso no te decimos «tu celu lo corre» con un número.</p>');
    const garena = sec('Qué dice Garena', '<div class="pa-two"><div>' + quote(h, 'ff_max_premium', 'es') + quote(h, 'ff_max_uhd', 'es') + quote(h, 'ff_max_firelink', 'es') + '</div><div>' + quote(h, 'ff_any_phone', 'es') + quote(h, 'ff_max_pc', 'es') + srcLine(h, 'garena-ff-es') + '</div></div>');
    const store = sec('Si no te aparece en la tienda', '<div class="pa-two"><div><p>En la ficha de Google Play para Argentina que guardamos, Free Fire MAX ' + (D.maxInstall ? 'muestra' : 'no muestra') + ' el botón Instalar' + (D.maxUsInstall && !D.maxInstall ? ', y la misma ficha para Estados Unidos sí lo muestra' : '') + '. En el App Store de Argentina ' + (D.maxIosAr ? 'aparece' : 'la búsqueda oficial de Apple no lo encuentra') + '.</p><p>Abrí la ficha desde tu celu: si te deja instalar, está disponible para vos. Si no, bajá Free Fire: es el mismo juego con gráficos más livianos, y tu cuenta, tus amigos y tus cosas siguen ahí.</p></div>' +
      '<div class="pa-c"><h3>No bajes APK</h3><p>Las «Free Fire MAX APK» de otras páginas no son de Garena. Garena suspende cuentas por programas de terceros, y un archivo raro puede traer algo peor.</p>' + quote(h, 'ff_ban', 'es') + '</div></div>' + srcLine(h, 'play-ffmax-ar') + srcLine(h, 'play-ffmax-us') + srcLine(h, 'itunes-ffmax-ar') + srcLine(h, 'itunes-ff-ar'));
    const next = sec('Después de instalar', cards(h, [['/ff/sensibilidad', 'Sensibilidad, calibrada', 'Encontrá tu número en pocos intentos, probando en el juego.'], ['/ff/nombres', 'Nombres con estilo', 'Letras y símbolos que el juego muestra.'], ['/ff/codigos', 'Códigos sin estafas', 'Cómo canjear en el sitio oficial de Garena.']]));
    return hero(h, { ey: 'Free Fire · MAX o normal', sub: 'Son el mismo juego con la misma cuenta: MAX tiene gráficos más pesados. Te decimos cuál bajar según tu celu y qué muestran hoy las tiendas de Argentina.' }) +
      '<div class="pa-tool">' + form + res + '</div>' + cmp + store + garena + next;
  },
};
function ffMaxData(h) {
  const ff = play(h, 'play-ff-ar'), mx = play(h, 'play-ffmax-ar'), us = play(h, 'play-ffmax-us');
  if (h.pa.fact('ff_dl') !== ff.downloads || h.pa.fact('ff_max_dl') !== mx.downloads) throw new Error('ff/max: download bands differ from the quoted facts');
  const gbOf = r => r.found ? { ...r, gb: r.bytes / 1e9 } : null;
  const ffIos = gbOf(itunes(h, 'itunes-ff-ar')) || { found: false };
  const maxIosAr = gbOf(itunes(h, 'itunes-ffmax-ar'));
  const maxIosUs = gbOf(itunes(h, 'itunes-ffmax-us'));
  const D = { ffInstall: ff.install, maxInstall: mx.install, maxUsInstall: us.install, ffDl: millions(ff.downloads), maxDl: millions(mx.downloads), ffIos, maxIosAr, maxIosUs, iosGb: ffIos.found ? +ffIos.gb.toFixed(2) : null };
  D.first = maxIosAr || mx.install ? { v: 'Probá MAX', say: 'Si tu celu no se traba, probá MAX; si anda lento, Free Fire.' } : { v: 'Free Fire', say: 'En nuestra copia de Google Play para Argentina, Free Fire MAX no muestra el botón Instalar. Abrí su ficha desde tu celu: si te deja, probalo; si no, Free Fire, con la misma cuenta.' };
  return D;
}

// ---------- /eafc: the current game on PC, from its Steam listing for Argentina ----------
export function fcPc(h) {
  const A = steamApp(h, 'steam-fc27', 4080220);
  if (A.free || !A.price || !A.rec || !A.diskGb) throw new Error('eafc: FC 27 Steam listing changed shape');
  const keys = Object.keys(A.min).filter(k => k !== 'Notas adicionales' && A.rec[k] !== undefined);
  const tbl = '<div class="pa-tw"><table class="pa-tb"><thead><tr><th></th><th>Mínimo</th><th>Recomendado</th></tr></thead><tbody>' + keys.map(k => '<tr><td>' + h.esc(k) + '</td><td lang="es"><samp>' + h.esc(A.min[k]) + '</samp></td><td lang="es"><samp>' + h.esc(A.rec[k]) + '</samp></td></tr>').join('') + '</tbody></table></div>';
  return sec('FC 27 en la compu', '<div class="pa-gd"><section class="pa-c pa-w2"><p class="pa-big pa-nk">' + usd(A.price) + '</p><p>precio en Steam para Argentina, el día de la copia. Salió el ' + h.esc(A.date.toLowerCase()) + '.</p></section>' +
    '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + fmt(A.diskGb, 0) + ' <small>GB</small></p><p>de espacio libre y ' + fmt(A.ramGb, 0) + ' GB de RAM como mínimo.</p></section>' +
    '<section class="pa-c pa-w2"><p class="pa-big pa-nk">' + (A.platforms.mac || A.platforms.linux ? 'Varios' : 'Windows') + '</p><p>' + (A.platforms.mac || A.platforms.linux ? '' : 'Solo Windows en Steam: no hay versión para Mac ni Linux.') + '</p></section></div>' + tbl +
    srcLine(h, 'steam-fc27', '<a href="' + steamLink(h, 'steam-fc27') + '" rel="noopener">ficha de Steam</a>') + '<p class="pa-src">Las versiones de consola y su precio están en el sitio de EA, que no permite que lo lean robots: no las copiamos de otros sitios.</p>', 'pc');
}
