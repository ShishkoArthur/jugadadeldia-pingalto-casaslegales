// pingalto feeds added on 2026-11-19 (audit of stale copies): riot (Data Dragon + valorant-api.com), vrs (Valve Regional Standings
// on GitHub), steam (appdetails), the near-identical decks of clashmeta and the CS2 Major of torneos. No network: the runs read
// fixture folders built here from the saved copies in data/sources/pingalto/_docs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runFeed } from '../../tools/feeds/run.mjs';
import riot from '../../tools/feeds/pingalto/riot.mjs';
import vrs, { newestPair } from '../../tools/feeds/pingalto/vrs.mjs';
import steam from '../../tools/feeds/pingalto/steam.mjs';
import { nearGroups } from '../../tools/feeds/pingalto/clashmeta.mjs';
import { pickMajors, majorName, EVENTS } from '../../tools/feeds/pingalto/torneos.mjs';
import { saTeam } from '../../tools/feeds/pingalto/dotaelo.mjs';
import { lolChamps, valAgents, valSiteMaps, verCmp } from '../games/riot.mjs';
import { gameName, shortName } from '../games/steamname.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DOCS = join(ROOT, 'data/sources/pingalto/_docs');
const doc = f => readFileSync(join(DOCS, f), 'utf8');
const json = f => JSON.parse(doc(f));
const tmp = p => mkdtempSync(join(tmpdir(), 'pa-' + p + '-'));
// fixture folder <dir>/<feed>/index.json: url -> file (robots.txt of every host -> 404 = no rules)
function fixtures(feed, map, hosts) {
  const dir = tmp('fx'), fx = join(dir, feed), index = {};
  mkdirSync(fx, { recursive: true });
  for (const h of hosts) index[h + '/robots.txt'] = { status: 404 };
  let n = 0;
  for (const [url, body] of Object.entries(map)) {
    if (body && body.http) { index[url] = { status: body.http }; continue; }
    const name = 'f' + (n++) + '.txt';
    writeFileSync(join(fx, name), typeof body === 'string' ? body : JSON.stringify(body));
    index[url] = name;
  }
  writeFileSync(join(fx, 'index.json'), JSON.stringify(index));
  return dir;
}
const out = d => JSON.parse(readFileSync(d, 'utf8'));

test('riot engine: versions, champions, agents and maps of the saved copies', () => {
  assert.equal(verCmp('16.21.1', '16.23.1'), -1);
  assert.equal(verCmp('13.10.00.5893614', '13.09.00.5777412'), 1);
  assert.equal(verCmp('16.21.1', '16.21.1'), 0);
  assert.throws(() => verCmp('x', '1.0'), /not a version/);
  const L = lolChamps(json('ddragon-champion-es-ar.json'));
  assert.ok(L.list.length >= 150 && L.list.every(c => c.info.length === 4 && c.s.length === 8));
  const bad = json('ddragon-champion-es-ar.json');
  bad.data.Ahri.tags = ['Wizard'];
  assert.throws(() => lolChamps(bad), /unknown role Wizard/);
  const A = valAgents(json('valorant-api-agents-es-mx.json'));
  assert.ok(A.length >= 20 && A[0].released, 'newest agent first');
  assert.ok(valSiteMaps(json('valorant-api-maps-es-mx.json')).every(m => /^Sitios /.test(m.tac)));
});

function riotFixtures(v, extraChamp) {
  const es = json('ddragon-champion-es-ar.json'), lang = json('ddragon-language-es-ar.json');
  es.version = v; lang.version = v;
  if (extraChamp) es.data[extraChamp] = { ...es.data.Ahri, id: extraChamp, key: '9999', name: extraChamp, title: 'la Nueva' };
  const en = JSON.parse(JSON.stringify(es));
  for (const c of Object.values(en.data)) c.title = 'the ' + c.id;
  const DD = 'https://ddragon.leagueoflegends.com', VA = 'https://valorant-api.com', cdn = DD + '/cdn/' + v + '/data/';
  const agents = json('valorant-api-agents-es-mx.json');
  return fixtures('riot', {
    [DD + '/api/versions.json']: [v, '16.21.1'], [cdn + 'es_AR/champion.json']: es, [cdn + 'en_US/champion.json']: en, [cdn + 'es_AR/language.json']: lang,
    [VA + '/v1/version']: json('valorant-api-version.json'), [VA + '/v1/agents?isPlayableCharacter=true&language=es-MX']: agents, [VA + '/v1/agents?isPlayableCharacter=true&language=en-US']: agents,
    [VA + '/v1/maps?language=es-MX']: json('valorant-api-maps-es-mx.json'), [VA + '/v1/maps?language=en-US']: json('valorant-api-maps-en-us.json'),
  }, [DD, VA]);
}

test('riot feed: newest Data Dragon version, a new champion shows up, a version going back is refused', async () => {
  const o = tmp('out');
  const r = await runFeed(riot, { out: o, fixtures: riotFixtures('16.23.1', 'Zzneu'), ua: 'test' });
  assert.equal(r.ok, true, r.error);
  const sum = out(join(o, 'riot.json')).data, lol = out(join(o, 'riot-lol.json')).data, val = out(join(o, 'riot-val.json')).data;
  assert.equal(sum.lol.v, '16.23.1');
  assert.equal(sum.lol.n, lolChamps(json('ddragon-champion-es-ar.json')).list.length + 1);
  const z = lol.c.find(c => c[0] === 'Zzneu');
  assert.deepEqual([z[1], z[2], z[8]], ['Zzneu', 'la Nueva', 'the Zzneu']);
  assert.equal(lol.roles.Mage, 'Mago');
  assert.ok(val.agents.length >= 20 && val.roles.every(x => x.es[0] && x.en[0]) && val.maps.every(m => m.es[0] && m.en[0]));
  assert.ok(!JSON.stringify(val).includes('displayIcon'), 'no image addresses or raw fields kept');
  const back = await runFeed(riot, { out: o, fixtures: riotFixtures('16.20.1'), ua: 'test' });
  assert.equal(back.ok, false);
  assert.match(back.error, /older than the last one/);
  assert.equal(out(join(o, 'riot.json')).data.lol.v, '16.23.1', 'last good data kept');
});

test('vrs feed: newest pair of the GitHub listing, the saved tables, refused when the titles do not match', async () => {
  const API = 'https://api.github.com/repos/ValveSoftware/counter-strike_regional_standings/contents/live/';
  const RAW = 'https://raw.githubusercontent.com/ValveSoftware/counter-strike_regional_standings/main/live/2026/';
  const BLOB = 'https://github.com/ValveSoftware/counter-strike_regional_standings/blob/main/live/2026/';
  const f = (name, extra = {}) => ({ name, type: 'file', download_url: RAW + name, html_url: BLOB + name, ...extra });
  const list = [f('standings_global_2026_10_05.md'), f('standings_americas_2026_10_05.md'), f('standings_global_2026_11_02.md'), f('standings_americas_2026_11_02.md'), f('standings_europe_2026_11_30.md'), { name: 'details', type: 'dir' }];
  assert.equal(newestPair(list).date, '2026-11-02', 'a date needs both global and americas');
  assert.equal(newestPair([f('standings_global_2026_11_02.md')]), null);
  const map = { [API + '2026']: list, [RAW + 'standings_global_2026_11_02.md']: doc('valve-vrs-global-2026-11-02.md'), [RAW + 'standings_americas_2026_11_02.md']: doc('valve-vrs-americas-2026-11-02.md') };
  const hosts = ['https://api.github.com', 'https://raw.githubusercontent.com'];
  const o = tmp('out');
  const r = await runFeed(vrs, { out: o, fixtures: fixtures('vrs', map, hosts), now: new Date('2026-11-19T12:00:00Z'), ua: 'test' });
  assert.equal(r.ok, true, r.error);
  const d = out(join(o, 'vrs.json')).data;
  assert.equal(d.date, '2026-11-02');
  assert.ok(d.gl.length > 300 && d.am.length > 50 && d.am.every(g => d.gl[g - 1][3] === 1), 'every Americas row points to an Americas row of the world list');
  assert.ok(d.gl.some(x => x[1] === ''), 'betting brand names are masked');
  assert.match(d.links.global, /^https:\/\/github\.com\/ValveSoftware\//);
  const y = await runFeed(vrs, { out: tmp('out'), fixtures: fixtures('vrs', { ...map, [API + '2027']: { http: 404 }, [API + '2026']: list }, hosts), now: new Date('2027-01-03T12:00:00Z'), ua: 'test' });
  assert.equal(y.ok, true, 'January before the first table of the year: the folder of last year');
  const wrong = { ...map, [RAW + 'standings_americas_2026_11_02.md']: doc('valve-vrs-americas-2026-11-02.md').replace('2026_11_02', '2026_10_05') };
  const w = await runFeed(vrs, { out: tmp('out'), fixtures: fixtures('vrs', wrong, hosts), now: new Date('2026-11-19T12:00:00Z'), ua: 'test' });
  assert.equal(w.ok, false);
});

test('steam feed and names: price in cents with currency, the short name the page uses', async () => {
  assert.equal(gameName('EA SPORTS FC™ 27'), 'EA Sports FC 27');
  assert.equal(shortName(gameName('EA SPORTS FC™ 28')), 'FC 28');
  assert.equal(gameName('Counter-Strike 2'), 'Counter-Strike 2');
  assert.throws(() => gameName(''), /bad game name/);
  const url = 'https://store.steampowered.com/api/appdetails?appids=4080220&cc=ar&l=spanish';
  const saved = json('steam-appdetails-4080220-ar.json');
  const o = tmp('out');
  const r = await runFeed(steam, { out: o, fixtures: fixtures('steam', { [url]: saved }, ['https://store.steampowered.com']), ua: 'test' });
  assert.equal(r.ok, true, r.error);
  const a = out(join(o, 'steam.json')).data.apps.fc;
  assert.equal(a.short, 'EA Sports FC 27');
  assert.deepEqual(a.price, { cur: saved['4080220'].data.price_overview.currency, cents: saved['4080220'].data.price_overview.final, initial: saved['4080220'].data.price_overview.initial, off: 0 });
  const odd = JSON.parse(JSON.stringify(saved));
  odd['4080220'].data.price_overview.currency = 'EUR';
  assert.throws(() => steam.validate({ apps: [{ id: 4080220, k: 'fc', body: odd }] }), /USD\/ARS/);
});

test('clashmeta: near-identical decks share 7 cards, every player counts once', () => {
  const base = [26000000, 26000001, 26000002, 26000003, 26000004, 26000005, 28000000];
  const decks = [[...base, 27000000], [...base, 27000001], [...base, 27000000].reverse(), [26000010, 26000011, 26000012, 26000013, 26000014, 26000015, 26000016, 26000017], [...base.slice(0, 6), 28000005, 28000006]];
  const g = nearGroups(decks);
  assert.equal(g.length, 1);
  assert.deepEqual(g[0].core, base);
  assert.equal(g[0].n, 3);
  assert.deepEqual(g[0].flex, [{ id: 27000000, n: 2 }, { id: 27000001, n: 1 }]);
  assert.deepEqual(nearGroups([decks[3], decks[4]]), [], 'no group of one');
});

test('torneos: the CS2 Major on now or next and the last finished one, qualifiers left out', () => {
  assert.ok(EVENTS.some(e => e.k === 'cs2-major' && e.g === 'cs2'));
  const s = (id, name, lg, begin, end) => ({ id, full_name: name, _league: lg, begin_at: begin, end_at: end });
  const list = [
    s(1, 'Cologne Major 2026', 'IEM', '2026-06-02T10:00:00Z', '2026-06-21T21:00:00Z'),
    s(2, 'Singapore 2026', 'PGL Major', '2026-11-23T23:00:00Z', '2026-12-13T15:00:00Z'),
    s(3, 'Singapore: South American Qualifier 2026', 'PGL Major', '2026-10-01T10:00:00Z', '2026-10-04T10:00:00Z'),
    s(4, 'Budapest 2025', 'StarLadder Major', '2025-11-24T09:00:00Z', '2025-12-14T21:00:00Z'),
    s(5, 'Spring 2026', 'Tribo To Major', '2026-11-10T10:00:00Z', '2026-11-30T10:00:00Z'),
  ];
  const now = new Date('2026-11-19T12:00:00Z');
  assert.deepEqual(pickMajors(list, now).map(x => x.id), [2, 1]);
  assert.deepEqual(pickMajors(list, new Date('2026-12-20T12:00:00Z')).map(x => x.id), [2], 'after the last Major: only that one');
  assert.deepEqual([majorName(list[0]), majorName(list[1])], ['IEM Cologne Major 2026', 'PGL Major Singapore 2026']);
});

test('dotaelo: South America by country, or without a country by most series in SA tournaments', () => {
  assert.equal(saTeam('PE', null), true);
  assert.equal(saTeam('RU', [10, 10]), false, 'a country outside South America wins over the tournaments');
  assert.equal(saTeam(undefined, [10, 6]), true);
  assert.equal(saTeam(undefined, [10, 5]), false, 'half is not most');
  assert.equal(saTeam(undefined, [3, 2]), false, 'too few series in the region');
});
