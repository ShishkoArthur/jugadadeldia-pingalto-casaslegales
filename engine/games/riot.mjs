// League of Legends champions (Riot Data Dragon champion.json) and Valorant agents and maps (valorant-api.com, the files of the
// game client) for pingalto /lol, /valorant, /valorant/agentes and /tier-list. The build reads the saved copies and the daily
// feed tools/feeds/pingalto/riot.mjs reads the live files with the same functions, so both give the same list. Pure; every
// function throws on a file that does not look like the one it knows.
export const LOL_ROLES = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
export const LOL_INFO = ['attack', 'defense', 'magic', 'difficulty'];
export const LOL_STATS = ['hp', 'mp', 'armor', 'spellblock', 'attackdamage', 'attackspeed', 'attackrange', 'movespeed'];
const VER = /^\d+(\.\d+)+$/;

// -1, 0 or 1 for two dotted version numbers ("16.21.1" < "16.23.1", "13.09.00.5777412" < "13.10.00.5893614").
export function verCmp(a, b) {
  if (!VER.test(String(a)) || !VER.test(String(b))) throw new Error('riot: not a version ' + a + ' / ' + b);
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
}

// Champions of one champion.json: [{ id, name, title, tags, info: [attack, defense, magic, difficulty], res, s: [LOL_STATS] }] by id.
export function lolChamps(raw) {
  if (!raw || raw.type !== 'champion' || !VER.test(String(raw.version)) || !raw.data || typeof raw.data !== 'object') throw new Error('lol: not a Data Dragon champion file');
  const list = Object.values(raw.data).map(c => {
    if (!c || typeof c.id !== 'string' || !/^[A-Za-z0-9]+$/.test(c.id) || typeof c.name !== 'string' || !c.name) throw new Error('lol: champion without id or name');
    if (!Array.isArray(c.tags) || !c.tags.length) throw new Error('lol: ' + c.id + ' has no role');
    for (const t of c.tags) if (!LOL_ROLES.includes(t)) throw new Error('lol: unknown role ' + t + ' on ' + c.id);
    const info = LOL_INFO.map(k => c.info && c.info[k]);
    if (!info.every(Number.isInteger)) throw new Error('lol: ' + c.id + ' has no ' + LOL_INFO.join('/'));
    const s = LOL_STATS.map(k => c.stats && c.stats[k]);
    if (!s.every(Number.isFinite)) throw new Error('lol: ' + c.id + ' has no base stats');
    return { id: c.id, name: c.name, title: String(c.title || ''), tags: c.tags.slice(), info, res: String(c.partype || ''), s };
  }).sort((a, b) => (a.id < b.id ? -1 : 1));
  if (list.length < 150) throw new Error('lol: only ' + list.length + ' champions');
  return { version: raw.version, list };
}

export const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ORDER = { Grenade: 0, Ability1: 1, Ability2: 2, Ultimate: 3, Passive: 4 };
const color = c => '#' + String(c).slice(0, 6);

// Playable agents of one /v1/agents answer, newest first (agents without a real release date last, by name).
export function valAgents(raw, lang = 'es') {
  if (!raw || raw.status !== 200 || !Array.isArray(raw.data)) throw new Error('valorant agents: bad file');
  const list = raw.data.filter(a => a && a.isPlayableCharacter && a.role).map(a => ({
    id: slug(a.displayName), uuid: a.uuid, name: a.displayName, role: a.role.displayName, roleId: slug(a.role.displayName), roleUuid: a.role.uuid, roleDesc: a.role.description,
    desc: a.description, released: /^(19[7-9]|20[01])/.test(a.releaseDate || '') || !/^\d{4}-\d{2}-\d{2}/.test(a.releaseDate || '') ? null : a.releaseDate.slice(0, 10),
    colors: (a.backgroundGradientColors || []).slice(0, 3).map(color),
    abilities: (a.abilities || []).filter(x => x.displayName && x.description).sort((x, y) => (ORDER[x.slot] ?? 9) - (ORDER[y.slot] ?? 9)).map(x => ({ slot: x.slot, name: x.displayName, desc: x.description })),
  }));
  if (list.length < 20) throw new Error('valorant agents: only ' + list.length);
  for (const a of list) if (!/^[0-9a-f-]{36}$/.test(String(a.uuid)) || !a.name || !a.roleId) throw new Error('valorant agents: agent without uuid, name or role');
  if (new Set(list.map(a => a.id)).size !== list.length) throw new Error('valorant agents: duplicate ids');
  list.sort((a, b) => (b.released || '').localeCompare(a.released || '') || a.name.localeCompare(b.name, lang));
  return list;
}
// Roles of an agent list, by name.
export const valRoles = (list, lang = 'es') => [...new Map(list.map(a => [a.roleId, { id: a.roleId, uuid: a.roleUuid, name: a.role, desc: a.roleDesc }])).values()].sort((a, b) => a.name.localeCompare(b.name, lang));

// Maps of one /v1/maps answer whose tactical description names plant sites (Spanish client: "Sitios A/B"): [{ uuid, name, tac }].
export function valSiteMaps(raw, re = /^Sitios /) {
  if (!raw || raw.status !== 200 || !Array.isArray(raw.data)) throw new Error('valorant maps: bad file');
  const seen = new Set(), out = [];
  for (const m of raw.data) {
    if (!m || !re.test(m.tacticalDescription || '') || seen.has(m.displayName)) continue;
    seen.add(m.displayName);
    out.push({ uuid: m.uuid, name: m.displayName, tac: m.tacticalDescription });
  }
  if (out.length < 8) throw new Error('valorant maps: only ' + out.length + ' maps with sites');
  return out;
}
