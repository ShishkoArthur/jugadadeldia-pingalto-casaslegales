// Home of pingalto.com: holo hero with Alt's card, the physical ping floor from CABA, live examples of the tools (computed at
// build time by the same engine the tools use) and the tool grid.
import { cm360, convertSens, edpi } from '../../../engine/games/sens.mjs';
import { greatCircleKm, fibreRttMs } from '../../../engine/games/geo.mjs';
import { sensGames } from '../content/games.mjs';
import { fmt, girlCard, ldPage } from './parts.mjs';

const ICON = {
  ping: '<path d="M3 13h4l2-5 4 10 2-5h6"/>',
  sens: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  dpi: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v4"/>',
  ff: '<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z"/>',
  val: '<path d="M4 5l8 14 8-14M9 5l3 6 3-6"/>',
  lol: '<path d="M5 11l7-6 7 6M5 19l7-6 7 6"/>',
};
const TOOLS = [
  ['/kit/ping', 'ping', 'Ping desde tu provincia', 'Piso físico y medición real'],
  ['/kit/sensibilidad', 'sens', 'Sensibilidad entre juegos', 'CS2, Valorant, OW2 y Apex'],
  ['/kit/dpi', 'dpi', 'DPI real del mouse', 'Con la SUBE como regla'],
  ['/ff/sensibilidad', 'ff', 'Sensibilidad Free Fire', 'Calibrada paso a paso'],
  ['/valorant/rangos', 'val', 'Rangos de Valorant', 'Calculadora de RR'],
  ['/lol/rangos', 'lol', 'Rangos de LoL', 'De Hierro a Retador'],
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
      '<div class="pa-bt"><a class="pa-b1" href="' + h.href('/kit/ping') + '">Medí tu ping</a><a href="' + h.href('/kit/sensibilidad') + '">Pasá tu sensibilidad</a></div></div>' + girlCard() + '</section>';
    const apps = '<nav class="pa-ap" aria-labelledby="h-tools"><h2 id="h-tools">Herramientas</h2><ul>' + TOOLS.filter(([u]) => h.built(u)).map(([u, ic, t, s]) => '<li><a href="' + h.href(u) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[ic] + '</svg><b>' + t + '</b><span>' + s + '</span></a></li>').join('') + '</ul></nav>';
    return hero + strip + '<div class="pa-gd">' + sens + ladder + '</div>' + apps;
  },
};
