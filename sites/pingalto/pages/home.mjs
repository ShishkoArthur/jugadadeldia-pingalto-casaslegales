// Home of pingalto.com: holo hero with Alt's card, the physical ping floor from CABA, live examples of the tools (computed at
// build time by the same engine the tools use) and the tool grid.
import { cm360, convertSens, edpi } from '../../../engine/games/sens.mjs';
import { greatCircleKm, fibreRttMs } from '../../../engine/games/geo.mjs';
import { sensGames } from '../content/games.mjs';
import { fmt, girlCard, ldPage } from './parts.mjs';
import { GAMES, BG_W, bgName, hasBg } from '../content/visual.mjs';

const ICON = {
  ping: '<path d="M3 13h4l2-5 4 10 2-5h6"/>',
  sens: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  dpi: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v4"/>',
  ff: '<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z"/>',
  val: '<path d="M4 5l8 14 8-14M9 5l3 6 3-6"/>',
  lol: '<path d="M5 11l7-6 7 6M5 19l7-6 7 6"/>',
  tier: '<path d="M4 6h4M4 12h4M4 18h4M11 6h9M11 12h6M11 18h3"/>',
  name: '<path d="M4 19l5-14 5 14M6 14h6M16 12c0-2 4-2 4 0v7M20 15c-4 0-4 4 0 4"/>',
  inv: '<rect x="4" y="7" width="16" height="10" rx="2" stroke-dasharray="3 3"/>',
  agent: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
  mira: '<circle cx="12" cy="12" r="2"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  nube: '<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18z"/>',
  rank: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
  swiss: '<path d="M4 6h5l3 6h8M12 12l-3 6H4"/>',
  bo: '<path d="M4 17c4 0 5-10 8-10s4 10 8 10"/>',
  champ: '<path d="M12 3l3 6 6 1-4.5 4 1 6L12 17l-5.5 3 1-6L3 10l6-1z"/>',
  code: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h2M11 12h2M15 12h2"/>',
  deck: '<rect x="4" y="5" width="10" height="14" rx="2"/><path d="M14 7l5 1.5-3 11-4-1"/>',
  map: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
};
const TOOLS = [
  ['/kit/ping', 'ping', 'Ping desde tu provincia', 'Piso físico y medición real'],
  ['/kit/sensibilidad', 'sens', 'Sensibilidad entre juegos', 'CS2, Valorant, OW2 y Apex'],
  ['/kit/dpi', 'dpi', 'DPI real del mouse', 'Con la SUBE como regla'],
  ['/ff/sensibilidad', 'ff', 'Sensibilidad Free Fire', 'Calibrada paso a paso'],
  ['/valorant/rangos', 'val', 'Rangos de Valorant', 'Calculadora de RR'],
  ['/lol/rangos', 'lol', 'Rangos de LoL', 'De Hierro a Retador'],
  ['/tier-list', 'tier', 'Tier list', 'Armá la tuya y compartila'],
  ['/valorant/agentes', 'agent', 'Agentes de Valorant', 'Habilidades y roles en español'],
  ['/cs2/mira', 'mira', 'Mira de CS2', 'Con el código nuevo'],
  ['/ff/nombres', 'name', 'Nombres para Free Fire', 'Letras y símbolos'],
  ['/ff/espacio-invisible', 'inv', 'Espacio invisible', 'Copiar y pegar'],
  ['/fortnite/nube', 'nube', 'Fortnite en la nube', 'Cuántos GB del plan'],
  ['/cs2', 'rank', '¿Te corre CS2?', 'Requisitos de Valve y ranking'],
  ['/ff/max', 'ff', 'Free Fire o MAX', 'Cuál bajar en Argentina'],
  ['/cs2/major', 'swiss', 'El Major de CS2', 'Fase suiza y chance de pasar'],
  ['/esports/series', 'bo', 'Bo1, Bo3, Bo5', 'De un mapa a la serie'],
  ['/lol', 'champ', 'Campeones de LoL', 'Por rol, con datos de Riot'],
  ['/ff/codigos', 'code', 'Códigos de Free Fire', 'Canjealos sin estafas'],
  ['/esports/sistema-suizo', 'swiss', 'Simulador de fase suiza', '16 equipos, reglas de Valve'],
  ['/clash/mazos', 'deck', 'Mazos de Clash Royale', 'Contra el top argentino'],
  ['/valorant/mapas/ascent', 'map', 'Callouts de Ascent', 'En español y en inglés'],
  ['/dota2', 'rank', '¿Te corre Dota 2?', 'Requisitos de Valve, ping y ranking'],
  ['/esports/argentinos', 'flag', 'Argentinos en esports', 'Por juego y por equipo'],
];

export const home = {
  path: '/',
  kind: 'hub',
  riot: true,
  title: 'pingalto: herramientas para tus juegos, desde Argentina',
  description: 'Herramientas para gamers de Argentina: ping desde tu provincia, sensibilidad entre juegos, DPI del mouse y rangos de Valorant y LoL. Sin apuestas.',
  h1: '¿Ping alto? Jugá con los números a favor',
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'pingalto', url: 'https://' + h.site.domain + '/', inLanguage: 'es-AR' }]),
  render(h) {
    const P = h.pa, c = P.fact('c_ms'), n = P.fact('fiber_n'), R = P.fact('earth_r_km');
    const caba = P.city('Q1486');
    const T = [['Q2887', 'Santiago', 'Chile'], ['Q174', 'São Paulo', 'Brasil'], ['Q8652', 'Miami', 'EE. UU.']].map(([q, name, country]) => {
      const km = greatCircleKm(caba, P.city(q), R);
      return { name, country, km, ms: fibreRttMs({ km, c, n }) };
    });
    const max = Math.max(...T.map(t => t.ms));
    const g = T.map((t, i) => '<div class="pa-gg' + (i === T.length - 1 ? ' pa-hi' : '') + '"><i style="--v:' + Math.round((t.ms / max) * 85) + '"><span>' + fmt(t.ms, 0) + '</span></i><p><b>' + t.name + '</b><small>ms mínimos · ' + t.country + '</small></p></div>').join('');
    const strip = '<section class="pa-pg" aria-labelledby="h-ping"><div><h2 id="h-ping">Tu ping no puede bajar de esto</h2><p>Desde la Ciudad de Buenos Aires, ida y vuelta por fibra recta. <a href="' + h.href('/kit/ping') + '">Elegí tu provincia</a></p></div>' + g + '</section>';
    const G = sensGames(h), cs = G.find(x => x.id === 'cs2'), va = G.find(x => x.id === 'valorant');
    const ex = { s: 1.25, dpi: 800 };
    const vs = convertSens({ sens: ex.s, dpi: ex.dpi, yaw: cs.yaw, toDpi: ex.dpi, toYaw: va.yaw });
    const cm = cm360({ dpi: ex.dpi, sens: ex.s, yaw: cs.yaw });
    const sens = '<section class="pa-c pa-w3"><h2>Sensibilidad entre juegos</h2><p class="pa-x"><b>ejemplo</b> · mismo giro de 360°</p><div class="pa-sv"><div><small>CS2 · ' + fmt(ex.dpi, 0) + ' DPI</small><b>' + fmt(ex.s, 2) + '</b></div><div><small>Valorant</small><b>' + fmt(vs, 3) + '</b></div></div>' +
      '<p class="pa-ch"><span>eDPI CS2 ' + fmt(edpi({ dpi: ex.dpi, sens: ex.s }), 0) + '</span><span>' + fmt(cm, 1) + ' cm por vuelta</span></p><p style="margin-top:12px"><a href="' + h.href('/kit/sensibilidad') + '">Pasá la tuya</a></p></section>';
    const ranks = P.fact('val_ranks');
    const ladder = '<section class="pa-c pa-w3"><h2>Rangos de Valorant</h2><p class="pa-x">' + fmt(ranks.length, 0) + ' rangos, según Riot</p><ol class="pa-st" style="--n:' + ranks.length + '">' + ranks.map((r, i) => '<li' + (i === 3 ? ' class="pa-me"' : '') + '><i style="height:' + Math.round(((i + 1) / ranks.length) * 100) + '%"></i><b>' + h.esc(r) + '</b></li>').join('') + '</ol>' +
      '<p style="margin-top:12px"><a href="' + h.href('/valorant/rangos') + '">Cuántas partidas te faltan</a></p></section>';
    const hero = '<section class="pa-he"><div><p class="pa-ey">Hecho en Argentina · para jugar desde acá</p><h1>¿Ping alto? <em>Jugá con los números</em> a favor</h1>' +
      '<p class="pa-sb">Ping desde tu provincia, sensibilidad entre juegos, DPI real del mouse y rangos de Valorant y LoL. Cada número con su fuente, sin humo y sin vender nada.</p>' +
      '<div class="pa-bt"><a class="pa-b1" href="' + h.href('/kit/ping') + '">Medí tu ping</a><a href="' + h.href('/kit/sensibilidad') + '">Pasá tu sensibilidad</a></div></div>' + girlCard(h) + '</section>';
    const apps = '<nav class="pa-ap" aria-labelledby="h-tools"><h2 id="h-tools">Herramientas</h2><ul>' + TOOLS.filter(([u]) => h.built(u)).map(([u, ic, t, s]) => '<li><a href="' + h.href(u) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[ic] + '</svg><b>' + t + '</b><span>' + s + '</span></a></li>').join('') + '</ul></nav>';
    const gl = GAMES.filter(g => h.built(g.path));
    const img = g => hasBg(g.id) ? '<img src="' + h.asset(bgName(g.id, BG_W[0])) + '" srcset="' + BG_W.slice(0, 2).map(w => h.asset(bgName(g.id, w)) + ' ' + w + 'w').join(', ') + '" sizes="(max-width:680px) 92vw, 240px" width="480" height="206" alt="' + h.esc(g.alt) + '" aria-hidden="true" loading="lazy" decoding="async">' : '';
    const games = gl.length ? '<nav class="pa-gms" aria-labelledby="h-games"><h2 id="h-games">Juegos</h2><ul>' + gl.map(g => '<li><a class="pa-gm pa-g-' + g.id + '" href="' + h.href(g.path) + '">' + img(g) + '<i aria-hidden="true">' + h.esc(g.mono) + '</i><b>' + h.esc(g.name) + '</b><span>' + h.esc(g.tag) + '</span></a></li>').join('') + '</ul></nav>' : '';
    return hero + strip + games + '<div class="pa-gd">' + sens + ladder + '</div>' + apps;
  },
};
