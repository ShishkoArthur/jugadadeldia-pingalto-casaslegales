// /valorant/agentes - every playable agent with role and abilities, read whole from the saved valorant-api.com copy (data of the
// game client, es-MX). Nothing typed by hand: names, roles, texts, colors and release dates come from that file.
import { fmt, quote, hero, ldPage, sec, srcLine } from './parts.mjs';

const SLOT = { Ultimate: 'Definitiva', Passive: 'Pasiva' };
const ORDER = { Grenade: 0, Ability1: 1, Ability2: 2, Ultimate: 3, Passive: 4 };
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const color = c => '#' + String(c).slice(0, 6);

export function agents(h) {
  const raw = h.pa.json('valapi-agents');
  if (raw.status !== 200 || !Array.isArray(raw.data)) throw new Error('valorant agents: bad file');
  const list = raw.data.filter(a => a.isPlayableCharacter && a.role).map(a => ({
    id: slug(a.displayName), name: a.displayName, role: a.role.displayName, roleId: slug(a.role.displayName), roleDesc: a.role.description,
    desc: a.description, released: /^(19[7-9]|20[01])/.test(a.releaseDate) ? null : a.releaseDate.slice(0, 10),
    colors: (a.backgroundGradientColors || []).slice(0, 3).map(color),
    abilities: a.abilities.filter(x => x.displayName && x.description).sort((x, y) => (ORDER[x.slot] ?? 9) - (ORDER[y.slot] ?? 9)).map(x => ({ slot: x.slot, name: x.displayName, desc: x.description })),
  }));
  if (list.length < 20) throw new Error('valorant agents: only ' + list.length);
  const ids = new Set(list.map(a => a.id));
  if (ids.size !== list.length) throw new Error('valorant agents: duplicate ids');
  list.sort((a, b) => (b.released || '').localeCompare(a.released || '') || a.name.localeCompare(b.name, 'es'));
  const roles = [...new Map(list.map(a => [a.roleId, { id: a.roleId, name: a.role, desc: a.roleDesc }])).values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const v = h.pa.json('valapi-version');
  return { list, roles, version: v.data.version, build: v.data.buildDate.slice(0, 10) };
}

function card(h, a, newest) {
  const bg = a.colors.length ? 'background:linear-gradient(135deg,' + a.colors.join(',') + ')' : '';
  return '<article class="pa-c pa-ag" id="' + a.id + '" data-role="' + a.roleId + '" data-name="' + h.esc(a.name.toLowerCase()) + '">' +
    '<header><i style="' + bg + '" aria-hidden="true">' + h.esc([...a.name][0]) + '</i><div><h3>' + h.esc(a.name) + (a.id === newest ? ' <span class="pa-tag pa-cm">el más nuevo</span>' : '') + '</h3><p class="pa-x">' + h.esc(a.role) + (a.released ? ' · llegó el ' + h.fmtDate(a.released) : '') + '</p></div></header>' +
    '<p>' + h.esc(a.desc) + '</p><ul class="pa-ab">' + a.abilities.map(x => '<li><b>' + h.esc(x.name) + (SLOT[x.slot] ? ' <span class="pa-tag">' + SLOT[x.slot] + '</span>' : '') + '</b><span>' + h.esc(x.desc) + '</span></li>').join('') + '</ul></article>';
}

export const valorantAgentes = {
  path: '/valorant/agentes',
  kind: 'live',
  riot: true,
  title: 'Agentes de Valorant: habilidades y roles en español',
  description: 'Todos los agentes de Valorant con sus habilidades en español, filtro por rol, comparador de a dos y el más nuevo arriba, con datos del cliente del juego.',
  h1: 'Agentes de Valorant y sus habilidades',
  scripts: ['agents.js'],
  ld: h => ldPage(h),
  render(h) {
    const A = agents(h);
    const newest = A.list[0].released ? A.list[0].id : null;
    const count = r => A.list.filter(a => a.roleId === r.id).length;
    const filters = '<div class="pa-seg" role="group" aria-label="Filtrar por rol"><button type="button" data-role="" aria-pressed="true">Todos · ' + fmt(A.list.length, 0) + '</button>' +
      A.roles.map(r => '<button type="button" data-role="' + r.id + '" aria-pressed="false">' + h.esc(r.name) + ' · ' + fmt(count(r), 0) + '</button>').join('') + '</div>';
    const opts = sel => A.list.map(a => '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + h.esc(a.name) + '</option>').join('');
    const tools = '<div class="pa-tool"><div class="pa-c pa-fm"><h2>Buscá y filtrá</h2>' + filters +
      '<div class="pa-f"><label for="ag-q">Nombre</label><input id="ag-q" type="search" autocomplete="off" placeholder="por ejemplo Jett"></div><p class="pa-x" data-o="n">' + fmt(A.list.length, 0) + ' agentes</p></div>' +
      '<div class="pa-c pa-fm"><h2>Compará dos</h2><div class="pa-row"><div class="pa-f"><label for="ag-a">Agente 1</label><select id="ag-a">' + opts(A.list[0].id) + '</select></div><div class="pa-f"><label for="ag-b">Agente 2</label><select id="ag-b">' + opts(A.list[1].id) + '</select></div></div>' +
      '<div class="pa-cmp" data-o="cmp"><p class="pa-src">Elegí dos agentes y los ves uno al lado del otro.</p></div></div></div>';
    const roles = sec('Los ' + fmt(A.roles.length, 0) + ' roles', '<div class="pa-two">' + A.roles.map(r => '<div class="pa-c"><h3>' + h.esc(r.name) + ' · ' + fmt(count(r), 0) + '</h3><p>' + h.esc(r.desc) + '</p></div>').join('') + '</div>');
    const grid = sec('Todos los agentes', '<div class="pa-ags" id="ag-list">' + A.list.map(a => card(h, a, newest)).join('') + '</div>');
    const src = sec('De dónde salen los datos', '<div class="pa-two"><div><p>Nombres, roles, textos de habilidades y colores salen de los archivos del cliente de Valorant que publica valorant-api.com, un proyecto de la comunidad sin relación con Riot. Leemos el archivo entero, tal como lo guardamos, en español de México. Los textos son los del juego.</p>' +
      srcLine(h, 'valapi-agents') + srcLine(h, 'valapi-version', 'cliente <code>' + h.esc(A.version) + '</code> del ' + h.fmtDate(A.build)) + '</div><div><p>La fecha de llegada solo aparece cuando el archivo la trae; para los agentes más viejos viene vacía y no la inventamos. Qué agentes eligen los equipos argentinos en torneos todavía no lo mostramos: falta una fuente pública que podamos citar partido por partido.</p></div></div>');
    const ar = sec('Desde Argentina', '<div class="pa-two"><div>' + quote(h, 'val_scl', 'es') + '</div><div><p>Tu ping hasta Santiago desde tu provincia está en el <a href="' + h.href('/kit/ping') + '">test de ping</a>, y cuántas partidas te faltan para subir, en los <a href="' + h.href('/valorant/rangos') + '">rangos de Valorant</a>.</p></div></div>');
    return hero(h, { ey: 'Valorant · agentes · ' + fmt(A.list.length, 0), sub: 'Cada agente con su rol y sus habilidades en español, para elegir con quién jugar o entender qué te hizo el rival. Filtrá por rol y compará de a dos.' }) +
      tools + grid + roles + src + ar;
  },
};
