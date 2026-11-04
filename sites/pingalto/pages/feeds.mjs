// Pages and blocks of pingalto that read the server feeds (tools/feeds/pingalto/*.mjs -> /data/feeds/<name>.json): the esports
// agenda (PandaScore), Clash Royale cards and Brawl Stars brawlers and events (official Supercell APIs). The browser draws the data
// (client/agenda.js, client/supercell.js); the static page carries the frame, the attribution and what happens when data is late.
// Own styles in css/feeds.css, linked from the block itself (the shared layout links only pa.css).
import { hero, ldPage, sec } from './parts.mjs';
import { GAMES } from '../../../tools/feeds/pingalto/agenda.mjs';
import { ATTRIBUTION } from '../../../tools/feeds/pingalto/supercell.mjs';

export const FEED = '/data/feeds/';
export const css = h => '<link rel="stylesheet" href="' + h.asset('feeds.css') + '">';
export const wait = '<p class="pa-fdw" data-fdw>Cargando…</p><noscript><p class="pa-note">Esta lista se arma con JavaScript desde nuestra copia de los datos.</p></noscript>';
export const PS = '<p class="pa-src pa-fds">Datos: <a href="https://pandascore.co/" rel="noopener">PandaScore</a> · horarios en hora argentina · se revisa cada hora</p>';
export const SC = '<p class="pa-src pa-fds" lang="en">' + ATTRIBUTION + '</p>';

// Next matches of one game, for its hub page (/cs2, /valorant, /lol): a slot the client fills from the agenda feed.
export function agendaBlock(h, game, title = 'Próximos partidos') {
  if (game && !GAMES.some(x => x.k === game)) throw new Error('agendaBlock: unknown game ' + game);
  return css(h) + sec(title, '<div class="pa-fd" data-fd="agenda"' + (game ? ' data-fd-g="' + game + '"' : '') + ' data-fd-n="6" data-fd-src="' + FEED + '">' + wait + '</div>' +
    (h.built('/esports/agenda') ? '<p><a href="' + h.href('/esports/agenda') + '">La agenda completa de esports</a></p>' : '') + PS, 'partidos');
}

export const esportsAgenda = {
  path: '/esports/agenda',
  kind: 'tool',
  title: 'Partidos de esports hoy en hora argentina',
  h1: 'Agenda de esports de hoy',
  description: 'Los partidos de esports de hoy y de la semana en hora argentina, juego por juego, con los equipos argentinos arriba y dónde verlos por canales oficiales.',
  scripts: ['agenda.js'],
  riot: true,
  ld: h => ldPage(h),
  render(h) {
    const tabs = '<div class="pa-seg pa-fdt" role="group" aria-label="Juego"><button type="button" data-fd-tab="" aria-pressed="true">Todos</button>' + GAMES.map(g => '<button type="button" data-fd-tab="' + g.k + '" aria-pressed="false">' + h.esc(g.name) + '</button>').join('') + '</div>';
    return css(h) + hero(h, { ey: 'Esports · agenda', sub: 'Los partidos de CS2, Valorant, LoL, Dota 2, Rocket League y EA Sports FC en hora argentina: en vivo, hoy y los próximos días, con los equipos argentinos primero y el canal oficial para verlos.' }) +
      sec('Partidos', tabs + '<div class="pa-fd" data-fd="agenda" data-fd-src="' + FEED + '">' + wait + '</div>' + PS, 'agenda') +
      sec('Cómo leer la agenda', '<ul class="pa-dot"><li>Las horas son de Argentina. Si un partido cambia de horario, lo marcamos como reprogramado; si se suspende, sale de la lista.</li><li>Mostramos los torneos de primera línea de cada juego y todos los partidos con equipos de Argentina y Latinoamérica, según el país que PandaScore le asigna a cada equipo.</li><li>Los canales son los oficiales que publica cada torneo. Sin apuestas, sin cuotas y sin pronósticos.</li><li>Si la copia tiene más de cuatro horas, la página lo avisa y no muestra los partidos como si fueran de ahora.</li></ul>') +
      (h.built('/esports/series') ? sec('¿Y quién gana?', '<p>No pronosticamos, pero sí podés calcular qué chance tiene un equipo de ganar un Bo3 o un Bo5 si sabés su chance por mapa: <a href="' + h.href('/esports/series') + '">probabilidad de una serie</a>.</p>') : '');
  },
};

export const clashCartas = {
  path: '/clash/cartas',
  kind: 'tool',
  title: 'Cartas de Clash Royale: elixir y rareza de cada una',
  h1: 'Todas las cartas de Clash Royale',
  description: 'Todas las cartas de Clash Royale con su elixir, su rareza y si tienen evolución, con filtros y el elixir promedio de un mazo de ocho armado por vos.',
  scripts: ['supercell.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Clash Royale · cartas', sub: 'La lista completa de la API oficial de Supercell: elixir, rareza, nivel máximo y evolución. Tocá ocho cartas y te calculamos el elixir promedio y el ciclo del mazo.' }) +
      sec('Las cartas', '<div class="pa-fd" data-fd="clash" data-fd-src="' + FEED + '">' + wait + '</div>' + SC, 'cartas') +
      sec('Tu mazo', '<div class="pa-fd pa-fdk" data-fd-deck><p class="pa-note">Tocá hasta ocho cartas de la lista para armar un mazo.</p></div>', 'mazo') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Los nombres salen en inglés, como los publica la API oficial.</li><li>Elixir promedio: la suma del elixir de las ocho cartas dividida por ocho. Ciclo: lo que cuestan las cuatro más baratas, lo que gastás para volver a tener la primera en la mano.</li><li>La lista se actualiza sola una vez por día: cuando Supercell agrega una carta, aparece marcada como nueva.</li></ul>');
  },
};

export const brawlBrawlers = {
  path: '/brawl/brawlers',
  kind: 'tool',
  title: 'Personajes de Brawl Stars: todos los brawlers y habilidades',
  h1: 'Todos los brawlers de Brawl Stars',
  description: 'Todos los brawlers de Brawl Stars con sus habilidades estelares y gadgets, el más nuevo y las copas que piden los 200 mejores puestos de Argentina.',
  scripts: ['supercell.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Brawl Stars · brawlers', sub: 'La lista de la API oficial de Supercell, con cada habilidad estelar y cada gadget. Y una cuenta rápida: cuántas copas tiene el puesto 1, el 50 o el 200 de Argentina.' }) +
      sec('¿Entrás entre los mejores de Argentina?', '<div class="pa-fd" data-fd="brawl-top" data-fd-src="' + FEED + '">' + wait + '</div>', 'top') +
      sec('Los brawlers', '<div class="pa-fd" data-fd="brawl" data-fd-src="' + FEED + '">' + wait + '</div>' + SC, 'brawlers') +
      sec('Lo que no mostramos', '<ul class="pa-dot"><li>Rareza y clase: la API oficial no las publica y no copiamos sitios no oficiales.</li><li>Nombres de jugadores del ranking: solo usamos las copas de cada puesto, no quién es.</li></ul>');
  },
};

export const brawlEventos = {
  path: '/brawl/eventos',
  kind: 'tool',
  title: 'Eventos de Brawl Stars hoy: mapas y modos en hora argentina',
  h1: 'Eventos de Brawl Stars de hoy',
  description: 'Los eventos de Brawl Stars de hoy con su mapa, su modo y cuánto falta para que cambien, en hora argentina, de la rotación oficial que revisamos cada hora.',
  scripts: ['supercell.js'],
  ld: h => ldPage(h),
  render(h) {
    return css(h) + hero(h, { ey: 'Brawl Stars · eventos', sub: 'Qué mapa y qué modo hay en cada lugar de la rotación ahora mismo, a qué hora de Argentina cambia y cuánto falta.' }) +
      sec('Ahora en la rotación', '<div class="pa-fd" data-fd="brawl-events" data-fd-src="' + FEED + '">' + wait + '</div>' + SC, 'eventos') +
      sec('Cómo se lee', '<ul class="pa-dot"><li>Los modos y mapas salen con el nombre que usa la API oficial, en inglés.</li><li>La cuenta regresiva corre en tu navegador con la hora de fin que publica Supercell.</li><li>La rotación se revisa cada hora: si la copia es vieja, la página lo avisa.</li></ul>');
  },
};

export const FEED_PAGES = [esportsAgenda, clashCartas, brawlBrawlers, brawlEventos];
