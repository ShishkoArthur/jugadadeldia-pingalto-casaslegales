// /tier-list - a personal tier list maker: the visitor ranks names (Valorant agents and maps from the saved valorant-api.com copy,
// LoL champions from Riot's Data Dragon in es_AR, or their own list) and shares it by link or image. It is the visitor's opinion,
// never presented as "the meta": no usage or win data is shown here. State lives in the address (engine/games/tier.mjs).
import { ROWS } from '../../../engine/games/tier.mjs';
import { agents } from './valorant.mjs';
import { fmt, hero, ldPage, sec, srcLine } from './parts.mjs';
import { lolArt } from '../content/art.mjs';
import { riotArtNote } from './hubs.mjs';

export function tierSets(h) {
  const byName = (a, b) => a.localeCompare(b, 'es');
  const val = agents(h).list.map(a => a.name).sort(byName);
  const maps = h.pa.json('valapi-maps').data.filter(m => /^Sitios /.test(m.tacticalDescription || '')).map(m => m.displayName);
  const mapNames = [...new Set(maps)].sort(byName);
  const champList = Object.values(h.pa.json('ddragon-champs').data).sort((a, b) => byName(a.name, b.name));
  const champs = champList.map(c => c.name), icons = champList.map(c => lolArt(c.id));
  if (mapNames.length < 8 || champs.length < 150) throw new Error('tier-list: sets too small');
  return [
    { id: 'val-agentes', name: 'Valorant · agentes', items: val, src: 'valapi-agents' },
    { id: 'val-mapas', name: 'Valorant · mapas con sitios', items: mapNames, src: 'valapi-maps' },
    { id: 'lol', name: 'League of Legends · campeones', items: champs, src: 'ddragon-champs', icons: icons.some(Boolean) ? icons : null },
    { id: 'libre', name: 'Tu propia lista', items: [], src: null },
  ];
}

export const tierList = {
  path: '/tier-list',
  kind: 'tool',
  riot: true,
  title: 'Tier list maker: armá tu tier list de cualquier juego',
  description: 'Armá tu tier list de Valorant, LoL o de lo que quieras arrastrando nombres, también desde el celular, y compartila con un link o como imagen.',
  h1: 'Creador de tier list: armá la tuya y compartila',
  scripts: ['tier.js'],
  data: h => ({ rows: ROWS, sets: tierSets(h).map(s => ({ id: s.id, name: s.name, items: s.items, ...(s.icons ? { icons: s.icons.map(f => f ? h.asset(f) : '') } : {}) })) }),
  ld: h => ldPage(h, [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: h.page.h1, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'es-AR', isAccessibleForFree: true, url: 'https://' + h.site.domain + h.page.path }]),
  render(h) {
    const S = tierSets(h), first = S[0];
    const controls = '<div class="pa-c pa-fm pa-tc"><div class="pa-row"><div class="pa-f"><label for="tl-set">Qué vas a ordenar</label><select id="tl-set">' + S.map(s => '<option value="' + s.id + '">' + h.esc(s.name) + (s.items.length ? ' · ' + fmt(s.items.length, 0) : '') + '</option>').join('') + '</select></div>' +
      '<div class="pa-f"><label for="tl-title">Título (va en la imagen)</label><input id="tl-title" type="text" maxlength="40" autocomplete="off" value="Mi tier list"></div></div>' +
      '<div class="pa-f pa-hide" id="tl-own"><label for="tl-items">Tus nombres, uno por línea (hasta 40)</label><textarea id="tl-items" rows="4" maxlength="1200" placeholder="Juego 1&#10;Juego 2"></textarea></div>' +
      '<p class="pa-x"><b>cómo se usa</b> · arrastrá un nombre a una fila, o tocalo y después tocá la fila. Tocá de nuevo para devolverlo abajo.</p>' +
      '<div class="pa-share"><button type="button" data-tl="png">Guardar imagen</button><button type="button" data-tl="link">Copiar link</button><button type="button" data-tl="reset">Empezar de cero</button><output data-o="copied"></output></div></div>';
    const board = '<div class="pa-tl" id="tl-board" aria-label="Tu tier list">' + ROWS.map((r, i) => '<div class="pa-tr" data-row="' + i + '"><button type="button" class="pa-tk pa-t' + i + '" data-place="' + i + '" aria-label="Poner en ' + r + '">' + r + '</button><div class="pa-tz" data-zone="' + i + '"></div></div>').join('') + '</div>' +
      '<div class="pa-c pa-pool"><p class="pa-x">Sin ubicar · <span data-o="left">' + fmt(first.items.length, 0) + '</span></p><div class="pa-tz" data-zone="-1" id="tl-pool">' + first.items.map((n, i) => '<button type="button" class="pa-ti" data-i="' + i + '">' + h.esc(n) + '</button>').join('') + '</div></div>';
    const honest = sec('Es tu opinión, no la meta', '<div class="pa-two"><div><p>Esta herramienta no sabe quién gana más ni a quién eligen los profesionales: ordena lo que vos digas. Por eso no te mostramos una tier list «oficial» al lado. Cuando tengamos datos públicos de partidas que podamos citar, los vamos a mostrar aparte y con su fuente.</p><p>Tu lista vive en el link: nada se guarda en pingalto ni se manda a ningún lado.</p></div>' +
      '<div><p>Los nombres salen de archivos guardados con fecha. Los de LoL vienen en el idioma del cliente de Riot para Argentina (es_AR).</p>' + S.filter(s => s.src).map(s => srcLine(h, s.src)).join('') + riotArtNote(h) + '</div></div>');
    const more = sec('Para elegir mejor', '<p>Las habilidades de cada agente, con filtro por rol, en <a href="' + h.href('/valorant/agentes') + '">agentes de Valorant</a>. Cuántas partidas te faltan para subir, en los <a href="' + h.href('/valorant/rangos') + '">rangos de Valorant</a> y los de <a href="' + h.href('/lol/rangos') + '">LoL</a>.</p>');
    return '<link rel="stylesheet" href="' + h.asset('lists.css') + '">' + hero(h, { ey: 'Kit · tier list · S a F', sub: 'Elegí qué ordenar, arrastrá cada nombre a su fila y compartí el resultado con un link o como imagen. Funciona en el celular.' }) +
      '<div class="pa-sec">' + controls + board + '</div>' + honest + more;
  },
};
