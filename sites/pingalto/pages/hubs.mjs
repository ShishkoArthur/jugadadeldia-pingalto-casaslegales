// Game hubs of pingalto: /lol (every champion from Riot's Data Dragon in es_AR with role filter, Riot's own 1-10 ratings and
// base stats, compare two), /valorant (agents, roles and maps with sites from the saved client data), /ff (Free Fire tools and
// what the site will not do), /ff/codigos (how to redeem a code on Garena's site, a format check from Garena's own notice, scam
// signs and where to report it in Argentina, quoted from argentina.gob.ar). Every number comes from a saved file.
import { agents } from './valorant.mjs';
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const cards = (h, list) => '<div class="pa-hub">' + list.filter(([u]) => h.built(u)).map(([u, t, s]) => '<a class="pa-c" href="' + h.href(u) + '"><h3>' + t + '</h3><p>' + s + '</p></a>').join('') + '</div>';

const ROLES = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
const INFO = [['attack', 'Ataque'], ['defense', 'Defensa'], ['magic', 'Magia'], ['difficulty', 'Dificultad']];
export function champions(h) {
  const raw = h.pa.json('ddragon-champs'), lang = h.pa.json('ddragon-lang').data;
  if (raw.version !== h.pa.json('ddragon-lang').version) throw new Error('lol: champion and language files are from different versions');
  const role = Object.fromEntries(ROLES.map(r => { if (!lang[r]) throw new Error('lol: no es_AR name for ' + r); return [r, lang[r]]; }));
  const list = Object.values(raw.data).map(c => {
    for (const t of c.tags) if (!role[t]) throw new Error('lol: unknown role ' + t + ' on ' + c.id);
    for (const [k] of INFO) if (!Number.isInteger(c.info[k])) throw new Error('lol: ' + c.id + ' has no ' + k);
    return { id: c.id, name: c.name, title: c.title, tags: c.tags, info: c.info, res: c.partype || '', s: c.stats };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (list.length < 150) throw new Error('lol: only ' + list.length + ' champions');
  const STATS = [['hp', 'Vida'], ['mp', 'Recurso'], ['armor', lang.Armor], ['spellblock', lang.SpellBlock], ['attackdamage', 'Daño de ataque'], ['attackspeed', lang.AttackSpeed], ['attackrange', lang.Range], ['movespeed', 'Velocidad de movimiento']];
  return { list, role, version: raw.version, STATS };
}

export const lolHub = {
  path: '/lol',
  kind: 'hub',
  riot: true,
  title: 'LoL en Argentina: campeones por rol y rangos de LAS',
  description: 'League of Legends desde Argentina: todos los campeones por rol con los datos de Riot en español, comparador de a dos y los rangos de LAS con calculadora.',
  h1: 'League of Legends desde Argentina',
  scripts: ['champs.js'],
  data: h => { const C = champions(h); return { c: C.list.map(c => [c.id, c.name, c.tags.map(t => C.role[t]).join(', '), INFO.map(([k]) => c.info[k]), c.res, C.STATS.map(([k]) => c.s[k])]), stats: C.STATS.map(([, l]) => l), info: INFO.map(([, l]) => l) }; },
  ld: h => ldPage(h),
  render(h) {
    const C = champions(h);
    const count = r => C.list.filter(c => c.tags.includes(r)).length;
    const max = Math.max(...ROLES.map(count));
    const bars = '<div class="pa-c"><h3>Campeones por rol</h3><p class="pa-x">un campeón puede tener dos roles</p><ul class="pa-hb">' + ROLES.map(r => '<li><span>' + h.esc(C.role[r]) + '</span><i style="--v:' + Math.round((count(r) / max) * 100) + '"></i><b>' + fmt(count(r), 0) + '</b></li>').join('') + '</ul></div>';
    const seg = '<div class="pa-seg" role="group" aria-label="Filtrar por rol"><button type="button" data-role="" aria-pressed="true">Todos · ' + fmt(C.list.length, 0) + '</button>' + ROLES.map(r => '<button type="button" data-role="' + h.esc(C.role[r]) + '" aria-pressed="false">' + h.esc(C.role[r]) + '</button>').join('') + '</div>';
    const sortSel = '<select id="ch-s"><option value="name">Nombre</option><option value="3">Dificultad (de Riot)</option><option value="0">Ataque (de Riot)</option><option value="1">Defensa (de Riot)</option><option value="2">Magia (de Riot)</option><option value="r6">' + h.esc(C.STATS[6][1]) + ' de ataque</option><option value="r0">Vida base</option></select>';
    const grid = '<div class="pa-chs" id="ch-list">' + C.list.map(c => '<article class="pa-chc" data-id="' + h.esc(c.id) + '" data-roles="' + h.esc(c.tags.map(t => C.role[t]).join('|')) + '"><h3>' + h.esc(c.name) + '</h3><p class="pa-x">' + h.esc(c.title) + '</p><p><b>' + h.esc(c.tags.map(t => C.role[t]).join(' · ')) + '</b></p><p class="pa-chi">' + INFO.map(([k, l]) => l + ' ' + c.info[k]).join(' · ') + '</p></article>').join('') + '</div>';
    const opts = sel => C.list.map(c => '<option value="' + h.esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + h.esc(c.name) + '</option>').join('');
    const A = C.list.find(c => c.id === 'Ahri') || C.list[0], B = C.list.find(c => c.id === 'Garen') || C.list[1];
    const tools = '<div class="pa-tool"><div class="pa-c pa-fm"><h2>Buscá y filtrá</h2>' + seg + '<div class="pa-row">' + field('ch-q', 'Nombre', '<input id="ch-q" type="search" autocomplete="off" placeholder="por ejemplo Jinx">') + field('ch-s', 'Ordenar por', sortSel) + '</div><p class="pa-x" data-o="n">' + fmt(C.list.length, 0) + ' campeones</p></div>' +
      '<div class="pa-c pa-fm"><h2>Compará dos</h2><div class="pa-row">' + field('ch-a', 'Campeón 1', '<select id="ch-a">' + opts(A.id) + '</select>') + field('ch-b', 'Campeón 2', '<select id="ch-b">' + opts(B.id) + '</select>') + '</div><div class="pa-tw" data-o="cmp">' + cmpTable(h, C, A, B) + '</div></div></div>';
    const about = sec('Qué significa cada dato', '<div class="pa-two"><div class="pa-c"><h3>Ataque, defensa, magia y dificultad</h3><p>Son las notas de 1 a 10 que Riot publica para cada campeón en sus datos del juego. No son estadísticas de partidas: dicen hacia dónde apunta el diseño del campeón y qué tan difícil es de jugar según Riot.</p></div>' +
      '<div class="pa-c"><h3>Estadísticas base</h3><p>Vida, armadura, alcance y el resto son los valores en el nivel 1, sin objetos ni runas. Suben con cada nivel; la subida por nivel también está en el archivo de Riot, pero acá mostramos el punto de partida.</p></div></div>' +
      srcLine(h, 'ddragon-champs', 'versión ' + h.esc(C.version)) + srcLine(h, 'ddragon-lang', 'nombres de roles en es_AR'));
    const ar = sec('Desde Argentina', '<div class="pa-two"><div><p>Los nombres, títulos y roles están en el español de Argentina que Riot publica en sus datos del juego (es_AR). Los rangos de LAS, con cuántos PL pide cada división y una calculadora de partidas, en <a href="' + h.href('/lol/rangos') + '">rangos de LoL</a>.</p>' + quote(h, 'lol_lan_mia', 'es') + '</div>' +
      '<div><p>Armá tu tier list de campeones y compartila en el <a href="' + h.href('/tier-list') + '">creador de tier list</a>, y medí tu ping desde tu provincia en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p><p class="pa-src">Lo que no mostramos: qué campeones se eligen o ganan más en el competitivo o en la cola clasificatoria. Esos datos necesitan una clave de Riot para productos aprobados o fuentes que no podemos copiar.</p></div></div>');
    return hero(h, { ey: 'LoL · ' + fmt(C.list.length, 0) + ' campeones · versión ' + C.version, girl: true, sub: 'Todos los campeones con sus roles y las notas de Riot en español, un comparador de a dos y la calculadora de rangos de LAS. Datos del juego, sin win rates inventados.' }) +
      tools + '<div class="pa-gd"><div class="pa-w2">' + bars + '</div><div class="pa-w4 pa-c"><h3>Notas de Riot, en promedio</h3>' + avgInfo(C) + '</div></div>' + sec('Todos los campeones', grid) + about + ar;
  },
};
function avgInfo(C) {
  return '<ul class="pa-hb">' + INFO.map(([k, l]) => { const v = C.list.reduce((t, c) => t + c.info[k], 0) / C.list.length; return '<li><span>' + l + '</span><i style="--v:' + Math.round(v * 10) + '"></i><b>' + fmt(v, 1) + '</b></li>'; }).join('') + '</ul><p class="pa-src">Promedio de los ' + fmt(C.list.length, 0) + ' campeones, en la escala de 1 a 10 de Riot.</p>';
}
export function cmpTable(h, C, A, B) {
  const row = (l, a, b) => '<tr><td>' + l + '</td><td class="pa-n">' + a + '</td><td class="pa-n">' + b + '</td></tr>';
  return '<table class="pa-tb"><thead><tr><th></th><th class="pa-n">' + h.esc(A.name) + '</th><th class="pa-n">' + h.esc(B.name) + '</th></tr></thead><tbody>' +
    INFO.map(([k, l]) => row(l + ' (1 a 10)', fmt(A.info[k], 0), fmt(B.info[k], 0))).join('') +
    row('Tipo de recurso', h.esc(A.res || '-'), h.esc(B.res || '-')) + C.STATS.map(([k, l]) => row(h.esc(l), fmt(A.s[k], 3), fmt(B.s[k], 3))).join('') + '</tbody></table>';
}

const VAL = [
  ['/valorant/rangos', 'Rangos de Valorant', 'De Hierro a Radiante y cuántas partidas te faltan para subir según tu RR.'],
  ['/valorant/agentes', 'Agentes y habilidades', 'Todos los agentes con sus habilidades en español, filtro por rol y comparador.'],
  ['/kit/sensibilidad', 'Sensibilidad desde otro juego', 'Pasá tu sensibilidad de CS2 u Overwatch 2 a Valorant con el mismo giro.'],
  ['/kit/ping', 'Ping a Santiago', 'Tu ping desde la provincia hasta el servidor de Valorant de la región.'],
  ['/tier-list', 'Tier list de agentes o mapas', 'Armá la tuya y compartila con un link.'],
];
export const valorantHub = {
  path: '/valorant',
  kind: 'hub',
  riot: true,
  title: 'Valorant en Argentina: rangos, agentes, mapas y servidor',
  description: 'Valorant desde Argentina: rangos y calculadora de RR, todos los agentes y roles, los mapas con sitios del juego y el servidor de Santiago que te toca.',
  h1: 'Valorant desde Argentina',
  ld: h => ldPage(h),
  render(h) {
    const A = agents(h);
    const maps = [...new Map(h.pa.json('valapi-maps').data.filter(m => /^Sitios /.test(m.tacticalDescription || '')).map(m => [m.displayName, m.tacticalDescription])).entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
    if (maps.length < 8) throw new Error('valorant hub: only ' + maps.length + ' maps');
    const three = maps.filter(([, d]) => /A\/B\/C/.test(d)).length;
    const newest = A.list[0];
    const facts = '<div class="pa-gd"><section class="pa-c pa-w2"><p class="pa-big">' + fmt(A.list.length, 0) + '</p><p>agentes en ' + fmt(A.roles.length, 0) + ' roles: ' + A.roles.map(r => h.esc(r.name) + ' ' + A.list.filter(a => a.roleId === r.id).length).join(', ') + '.</p></section>' +
      '<section class="pa-c pa-w2"><p class="pa-big">' + fmt(maps.length, 0) + '</p><p>mapas con sitios para plantar en los datos del cliente; ' + fmt(three, 0) + ' tienen tres sitios (A, B y C).</p></section>' +
      '<section class="pa-c pa-w2"><h3>El agente más nuevo</h3><p><b>' + h.esc(newest.name) + '</b>, ' + h.esc(newest.role) + (newest.released ? ', llegó el ' + h.fmtDate(newest.released) : '') + '. <a href="' + h.href('/valorant/agentes') + '#' + newest.id + '">Sus habilidades</a></p></section></div>';
    const mapList = sec('Mapas con sitios', '<ul class="pa-mapl">' + maps.map(([n, d]) => '<li><b>' + h.esc(n) + '</b><span>' + h.esc(d) + '</span></li>').join('') + '</ul><p class="pa-src">Son los mapas con sitios de plantado que trae el cliente ' + h.esc(A.version) + '. Riot rota cuáles entran en competitivo cada tanto, y esa rotación no está en estos datos: no la mostramos como si lo estuviera.</p>' + srcLine(h, 'valapi-maps'));
    const ar = sec('El servidor que te toca', '<div class="pa-two"><div>' + quote(h, 'val_scl', 'es') + quote(h, 'val_scl_ar', 'es') + '</div><div><p>Cuánto ping le sacás a Santiago desde tu provincia, y el mínimo que permite la física, en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p></div></div>');
    return hero(h, { ey: 'Valorant · desde Argentina', girl: true, sub: 'Rangos, agentes, mapas y el servidor de Santiago, con los datos del juego y de Riot. Elegí por dónde empezar.' }) +
      sec('Herramientas', cards(h, VAL)) + facts + mapList + ar;
  },
};

const FF = [
  ['/ff/sensibilidad', 'Sensibilidad, calibrada', 'Encontrá tu número en pocos intentos, probando en el juego.'],
  ['/ff/nombres', 'Nombres con estilo', 'Letras raras y símbolos que el juego muestra, con el conteo de caracteres.'],
  ['/ff/espacio-invisible', 'Espacio invisible', 'Copiá el carácter invisible para tu nick con un toque.'],
  ['/ff/codigos', 'Códigos: cómo canjearlos', 'El sitio oficial, el formato que pide Garena y cómo darte cuenta de una estafa.'],
];
export const ffHub = {
  path: '/ff',
  kind: 'hub',
  title: 'Free Fire en Argentina: sensibilidad, nombres y códigos',
  description: 'Herramientas de Free Fire que sí sirven, pensadas para Argentina: sensibilidad calibrada en tu celu, nombres con estilo y cómo canjear códigos sin estafas.',
  h1: 'Free Fire: herramientas que sí sirven',
  ld: h => ldPage(h),
  render(h) {
    const no = sec('Lo que no vas a encontrar acá', '<div class="pa-three"><div class="pa-c"><h3>Diamantes gratis</h3><p>No existen generadores de diamantes. Las páginas que los prometen buscan tu cuenta o tus datos.</p></div><div class="pa-c"><h3>Hacks, archivos y APK</h3><p>Nada que modifique el juego ni descargas por fuera de la tienda: te pueden bloquear la cuenta.</p></div><div class="pa-c"><h3>Listas de códigos</h3><p>No hay una lista oficial que podamos citar con fecha, así que no publicamos códigos: te explicamos cómo canjear los que te lleguen por vías oficiales.</p></div></div>');
    return hero(h, { ey: 'Free Fire · desde Argentina', girl: true, sub: 'Herramientas que funcionan en el navegador, sin descargas, sin pedirte la cuenta y sin vender nada.' }) +
      sec('Herramientas', cards(h, FF)) + no;
  },
};

export const ffCodigos = {
  path: '/ff/codigos',
  kind: 'tool',
  title: 'Códigos de Free Fire: cómo canjearlos sin caer en estafas',
  description: 'Cómo canjear códigos de Free Fire en el sitio oficial, qué formato pide Garena, cómo reconocer una estafa que te pide la clave o plata y dónde denunciarla.',
  h1: 'Cómo canjear códigos de Free Fire',
  scripts: ['codes.js'],
  data: h => ({ len: h.pa.fact('ff_code_len') }),
  ld: h => ldPage(h),
  render(h) {
    const L = h.pa.fact('ff_code_len');
    const page = h.pa.doc('garena-reward').page;
    const tool = '<div class="pa-tool"><form class="pa-c pa-fm" id="pa-cf" autocomplete="off"><h2>¿Tiene el formato correcto?</h2>' +
      field('cf-in', 'Pegá el código', '<input id="cf-in" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="por ejemplo ABCD1234EFGH">', 'No lo mandamos a ningún lado: se revisa en tu navegador.') +
      '<p class="pa-src">Revisamos solo lo que publica Garena: largo de ' + L.join(' o ') + ' caracteres, letras mayúsculas y números. Si el formato está bien, eso no dice si el código es válido, si venció o si es de tu región: eso lo sabe solo el sitio oficial.</p></form>' +
      '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Resultado</p><p class="pa-big pa-nk" data-o="st">-</p><p class="pa-say" data-o="say">Pegá un código y te decimos si cumple el formato que pide Garena.</p><p class="pa-code" hidden><code data-o="clean"></code></p>' +
      '<div class="pa-share"><button type="button" data-copy="clean" hidden>Copiar el código limpio</button><output data-o="copied"></output></div></div></div>';
    const how = sec('Cómo canjearlo en el sitio oficial', '<div class="pa-two"><div><ol class="pa-steps"><li><span>Entrá a <a href="' + h.esc(page) + '" rel="noopener">reward.ff.garena.com</a>, el sitio de canje de Garena. Escribí la dirección vos: no entres desde links que te mandan por mensaje.</span></li><li><span>Iniciá sesión con la misma cuenta vinculada que usás en el juego.</span></li><li><span>Pegá el código y confirmá. Si sale bien, la recompensa llega al juego.</span></li></ol>' + quote(h, 'ff_code_guest', 'es') + '</div>' +
      '<div>' + quote(h, 'ff_code_len', 'es') + quote(h, 'ff_code_exp', 'es') + quote(h, 'ff_code_vault', 'es') + '</div></div>');
    const errs = [['ff_code_used', 'Alguien ya lo usó. Los códigos que circulan en grupos suelen llegar gastados.'], ['ff_code_expired', 'Pasó la fecha. No hay forma de revivirlo.'], ['ff_code_region', 'El código es de otra región del juego.'], ['ff_code_char', 'La cuenta todavía no tiene personaje creado: entrá al juego primero.']];
    const err = sec('Qué quiere decir cada error', '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Mensaje del sitio de Garena</th><th>Qué significa</th></tr></thead><tbody>' + errs.map(([k, t]) => '<tr><td lang="es">«' + h.esc(h.pa.src.facts[k].quote) + '»</td><td>' + t + '</td></tr>').join('') + '</tbody></table></div>' + srcLine(h, 'garena-reward', 'textos en español del sitio de canje'));
    const scam = sec('Señales de estafa', '<div class="pa-two"><div class="pa-c pa-fm" id="pa-sc"><h3>Marcá lo que te pasó</h3><div class="pa-cks pa-col">' +
      [['pw', 'Me pidieron la contraseña o un código que me llegó por SMS o mail'], ['pay', 'Me pidieron plata, una recarga o datos de una tarjeta para darme el código'], ['url', 'El link no es reward.ff.garena.com'], ['rush', 'Me apuran: «solo por hoy», «quedan pocos»'], ['app', 'Me piden bajar una app o un archivo']].map(([k, t]) => '<label class="pa-ck"><input type="checkbox" name="' + k + '"><span>' + t + '</span></label>').join('') +
      '</div><p class="pa-say" data-o="scam">Si marcás una sola, ya es para desconfiar.</p></div><div><p>Un código de canje no necesita tu contraseña, ni plata, ni ninguna app: se pega en el sitio de Garena y listo. Cualquier otra cosa es alguien queriendo quedarse con tu cuenta.</p><p>Si ya pasaste la contraseña, cambiala desde la red social o el correo con el que vinculaste la cuenta y cerrá las sesiones abiertas.</p></div></div>');
    const ar = sec('Si te estafaron, en Argentina', '<div class="pa-two"><div>' + quote(h, 'ar_denuncia', 'es') + quote(h, 'ar_ufeci', 'es') + quote(h, 'ar_caba', 'es') + '</div><div>' + quote(h, 'ar_102', 'es') + '<p>Si sos menor, contale a un adulto de confianza antes de seguir hablando con quien te escribió. Guardá capturas de los mensajes: sirven para la denuncia.</p>' + srcLine(h, 'ar-denuncia', h.esc(h.pa.fact('ar_upd'))) + '</div></div>');
    return hero(h, { ey: 'Free Fire · códigos de canje', sub: 'Dónde se canjean, qué formato tienen según Garena y cómo darte cuenta de que te quieren robar la cuenta. No publicamos listas de códigos.' }) +
      tool + how + err + scam + ar;
  },
};
