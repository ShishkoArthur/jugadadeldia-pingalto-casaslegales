// League of Legends and Valorant game data for pingalto.com (docs/FEEDS.md), daily, no key. LoL: Riot's Data Dragon (the
// public developer files of the game: versions.json, then champion.json of the newest version in es_AR and en_US and the
// es_AR language file for role names). Valorant: valorant-api.com (a community project that publishes the files of the game
// client; robots.txt allows everything): /v1/version, /v1/agents (playable only) and /v1/maps in es-MX and en-US. The pages
// /lol, /valorant, /valorant/agentes and /tier-list are built from saved copies and the browser draws the newer version from
// these files, so a new patch, champion, agent or map shows without a redeploy. Read with engine/games/riot.mjs, the same
// functions the build uses. Kept: only what the pages show (names, titles, roles, Riot's 1-10 ratings, base stats, ability
// texts, colours, release dates, map sites); no images (the site keeps its own copies). Three documents: riot.json (versions
// and counts), riot-lol.json, riot-val.json.
import { lolChamps, valAgents, valRoles, valSiteMaps, LOL_ROLES, verCmp } from '../../../engine/games/riot.mjs';
import { robotsGate } from './art-copy.mjs';

const DD = 'https://ddragon.leagueoflegends.com', VA = 'https://valorant-api.com';
const VER = /^\d+\.\d+\.\d+$/;
const AG = l => VA + '/v1/agents?isPlayableCharacter=true&language=' + l;
const MP = l => VA + '/v1/maps?language=' + l;

export default {
  name: 'riot',
  cadence: 'daily',
  maxAgeHours: 72,
  timeoutSec: 240,
  async fetch(ctx) {
    await robotsGate(ctx, [DD + '/api/versions.json', DD + '/cdn/', VA + '/v1/version']);
    const get = async (url, ttlHours) => (await ctx.getJson(url, { ttlHours, timeoutMs: 45000 })).json;
    const versions = await get(DD + '/api/versions.json', 0);
    const v = Array.isArray(versions) ? versions[0] : null;
    if (!VER.test(String(v))) throw new Error('Data Dragon: versions.json does not start with a version');
    const cdn = DD + '/cdn/' + v + '/data/';
    return {
      v, champEs: await get(cdn + 'es_AR/champion.json', 20), champEn: await get(cdn + 'en_US/champion.json', 20), langEs: await get(cdn + 'es_AR/language.json', 20),
      valVer: await get(VA + '/v1/version', 6), agentsEs: await get(AG('es-MX'), 6), agentsEn: await get(AG('en-US'), 6), mapsEs: await get(MP('es-MX'), 6), mapsEn: await get(MP('en-US'), 6),
      fetched: new Date().toISOString(), source: { url: DD + '/api/versions.json', also: [VA + '/v1/version'] },
    };
  },
  validate(raw) {
    const es = lolChamps(raw.champEs), en = lolChamps(raw.champEn);
    if (es.version !== raw.v || en.version !== raw.v) throw new Error('Data Dragon: champion.json is not of version ' + raw.v);
    if (es.list.map(c => c.id).join() !== en.list.map(c => c.id).join()) throw new Error('Data Dragon: es_AR and en_US list different champions');
    if (!raw.langEs || raw.langEs.version !== raw.v || !raw.langEs.data) throw new Error('Data Dragon: language.json is not of version ' + raw.v);
    for (const r of LOL_ROLES) if (!raw.langEs.data[r]) throw new Error('Data Dragon: no es_AR name for role ' + r);
    const vv = raw.valVer && raw.valVer.data;
    if (!raw.valVer || raw.valVer.status !== 200 || !vv || !/^\d+\.\d+\.\d+\.\d+$/.test(vv.version || '') || !/^\d{4}-\d{2}-\d{2}T/.test(vv.buildDate || '')) throw new Error('valorant-api: bad /v1/version');
    const aes = valAgents(raw.agentsEs), aen = valAgents(raw.agentsEn, 'en');
    const ue = new Set(aen.map(a => a.uuid));
    if (aes.length !== aen.length || !aes.every(a => ue.has(a.uuid))) throw new Error('valorant-api: es-MX and en-US list different agents');
    const mes = valSiteMaps(raw.mapsEs), en2 = new Map((raw.mapsEn && raw.mapsEn.data || []).map(m => [m.uuid, m]));
    for (const m of mes) if (!en2.get(m.uuid) || !en2.get(m.uuid).displayName) throw new Error('valorant-api: map ' + m.name + ' missing in en-US');
  },
  compute(raw, prev) {
    const es = lolChamps(raw.champEs).list, en = new Map(lolChamps(raw.champEn).list.map(c => [c.id, c]));
    const roles = Object.fromEntries(LOL_ROLES.map(r => [r, raw.langEs.data[r]]));
    const lol = { v: raw.v, roles, c: es.map(c => { const e = en.get(c.id); return [c.id, c.name, c.title, c.tags, c.info, c.res, c.s, e.name, e.title, e.res]; }) };
    const vv = raw.valVer.data;
    const aes = valAgents(raw.agentsEs), aen = new Map(valAgents(raw.agentsEn, 'en').map(a => [a.uuid, a]));
    const side = a => ({ name: a.name, desc: a.desc, ab: a.abilities.map(x => [x.slot, x.name, x.desc]) });
    const agents = aes.map(a => ({ id: a.id, uuid: a.uuid, roleId: a.roleId, released: a.released, colors: a.colors, es: side(a), en: side(aen.get(a.uuid)) }));
    const roleEn = new Map(valRoles([...aen.values()], 'en').map(r => [r.uuid, r]));
    const vroles = valRoles(aes).map(r => ({ id: r.id, es: [r.name, r.desc], en: [(roleEn.get(r.uuid) || r).name, (roleEn.get(r.uuid) || r).desc] }));
    const enMap = new Map(raw.mapsEn.data.map(m => [m.uuid, m]));
    const maps = valSiteMaps(raw.mapsEs).map(m => ({ uuid: m.uuid, es: [m.name, m.tac], en: [enMap.get(m.uuid).displayName, enMap.get(m.uuid).tacticalDescription || ''] }));
    const val = { v: vv.version, build: vv.buildDate.slice(0, 10), roles: vroles, agents, maps };
    const was = prev && prev.lol && prev.lol.v;
    if (was && VER.test(was) && verCmp(raw.v, was) < 0) throw new Error('Data Dragon: newest version ' + raw.v + ' is older than the last one we had (' + was + ')');
    return {
      lol: { v: lol.v, n: lol.c.length }, val: { v: val.v, build: val.build, agents: agents.length, roles: vroles.length, maps: maps.length },
      source: 'Riot Games Data Dragon; valorant-api.com',
      __files: { 'riot-lol': lol, 'riot-val': val },
    };
  },
};
