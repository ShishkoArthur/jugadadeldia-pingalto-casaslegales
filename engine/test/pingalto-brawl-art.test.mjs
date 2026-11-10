// Brawl Stars art (owner 2026-11-10): the official API names no images, so the brawl feed copies portraits, map images and mode
// icons once from cdn.brawlify.com (fan mirror of the original art) by the official ids, lists them in brawl-art.json, and the
// page falls back to text where a picture is missing. No network: recorded answers in a temporary fixture folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import brawl from '../../tools/feeds/pingalto/brawl.mjs';
import brawlmeta from '../../tools/feeds/pingalto/brawlmeta.mjs';
import { runFeed } from '../../tools/feeds/run.mjs';
import { makeCtx } from '../../tools/feeds/lib.mjs';
import { syncBrawlArt, modeId, MODE_IDS, BRAWL_DIR, CDN } from '../../tools/feeds/pingalto/brawl-art.mjs';

const API = 'https://api.brawlstars.com/v1';
const png = n => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(600, n)]);
const brawlers = (n = 60) => Array.from({ length: n }, (_, i) => ({ id: 16000000 + i, name: 'BRAWLER ' + i, starPowers: [{ name: 'SP' }], gadgets: [{ name: 'GD' }] }));
const rotation = [
  { startTime: '20261110T080000.000Z', endTime: '20261111T080000.000Z', slotId: 1, event: { id: 15000026, mode: 'brawlBall', map: 'Sunny Soccer' } },
  { startTime: '20261110T080000.000Z', endTime: '20261111T080000.000Z', slotId: 2, event: { id: 15000300, mode: 'airHockey', map: 'Puck Rink' } },
  { startTime: '20261110T080000.000Z', endTime: '20261111T080000.000Z', slotId: 3, event: { id: 15000400, mode: 'newMode', modeId: 48000077, map: 'Brand New' } },
];

function fixtures(dir, o = {}) {
  const f = join(dir, 'brawl');
  mkdirSync(f, { recursive: true });
  const idx = { _fetched: '2026-11-10T12:00:00.000Z' };
  const put = (url, name, body) => { writeFileSync(join(f, name), body); idx[url] = name; };
  const list = o.brawlers || brawlers();
  put(API + '/brawlers', 'brawlers.json', JSON.stringify({ items: list }));
  put(API + '/events/rotation', 'rotation.json', JSON.stringify(rotation));
  put(API + '/rankings/AR/players?limit=200', 'rank.json', JSON.stringify({ items: [{ rank: 1, trophies: 90000 }, { rank: 2, trophies: 80000 }] }));
  idx[CDN + '/robots.txt'] = o.robots ? (writeFileSync(join(f, 'robots.txt'), o.robots), 'robots.txt') : 'robots.txt';
  if (!o.robots) writeFileSync(join(f, 'robots.txt'), 'User-agent: *\nDisallow:\n');
  const img = (url, n) => { const name = 'img-' + url.split('/').slice(-2).join('-'); writeFileSync(join(f, name), (o.bad || []).includes(n) ? Buffer.from('<html>') : png(n % 200)); idx[url] = { file: name, type: 'image/png' }; };
  if (o.images !== false) {
    for (const b of list) if (!(o.missing || []).includes(b.id)) img(CDN + '/brawlers/borderless/' + b.id + '.png', b.id);
    for (const e of rotation) img(CDN + '/maps/regular/' + e.event.id + '.png', e.event.id);
    for (const id of [48000005, 48000077]) img(CDN + '/game-modes/regular/' + id + '.png', id);
    for (const id of new Set(Object.values(MODE_IDS))) if (id !== 48000005) img(CDN + '/game-modes/regular/' + id + '.png', id);
    img(CDN + '/maps/regular/15000555.png', 15000555);
  }
  writeFileSync(join(f, 'index.json'), JSON.stringify(idx));
}
const env = { BS_API_KEY: 'test-key', PA_ART_PNG: '1' };
const read = f => JSON.parse(readFileSync(f, 'utf8'));

test('portraits, rotation maps and mode icons are copied once and named in the feed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pa-brawl-')), out = join(dir, 'out');
  try {
    fixtures(join(dir, 'fx'), { missing: [16000003] });
    const r = await runFeed(brawl, { out, fixtures: join(dir, 'fx'), env });
    assert.equal(r.ok, true, r.error);
    const d = read(join(out, 'brawl.json')).data;
    assert.equal(d.brawlers.find(b => b.id === 16000000).img, BRAWL_DIR + '/b16000000.png');
    assert.equal(d.brawlers.find(b => b.id === 16000003).img, undefined, 'missing portrait: text only');
    assert.ok(existsSync(join(out, BRAWL_DIR, 'b16000000.png')));
    const ev = Object.fromEntries(d.events.map(e => [e.mode, e]));
    assert.equal(ev.brawlBall.mi, BRAWL_DIR + '/m15000026.png');
    assert.equal(ev.brawlBall.gi, BRAWL_DIR + '/g48000005.png');
    assert.equal(ev.airHockey.gi, undefined, 'no known icon for this mode: text only');
    assert.equal(ev.newMode.gi, BRAWL_DIR + '/g48000077.png', 'the API mode id wins');
    assert.equal(d.art.maps['15000026'], BRAWL_DIR + '/m15000026.png');
    assert.equal(d.art.modes.brawlBall, BRAWL_DIR + '/g48000005.png');
    const list = read(join(out, 'brawl-art.json')).data;
    assert.ok(list.files.every(f => f.url.startsWith(CDN + '/') && existsSync(join(out, BRAWL_DIR, f.file))));
    assert.deepEqual(readFileSync(join(out, BRAWL_DIR, 'b16000001.png')), png(16000001 % 200), 'bytes as received');

    writeFileSync(join(out, 'brawlmeta.json'), JSON.stringify({ name: 'brawlmeta', updated: '2026-11-10T00:00:00Z', data: { maps: [{ map: 'Old Map', mode: 'gemGrab', id: 15000555 }], modes: [] } }));
    fixtures(join(dir, 'fx2'), { images: false });
    const fx2 = read(join(dir, 'fx2', 'brawl', 'index.json'));
    fx2[CDN + '/maps/regular/15000555.png'] = read(join(dir, 'fx', 'brawl', 'index.json'))[CDN + '/maps/regular/15000555.png'];
    writeFileSync(join(dir, 'fx2', 'brawl', 'index.json'), JSON.stringify(fx2));
    writeFileSync(join(dir, 'fx2', 'brawl', fx2[CDN + '/maps/regular/15000555.png'].file), png(5));
    const r2 = await runFeed(brawl, { out, fixtures: join(dir, 'fx2'), env });
    assert.equal(r2.ok, true, r2.error);
    assert.equal(r2.requests, 3 + 1 + 1 + 1, 'API, robots, the one new map of the Argentine battles, the still missing portrait try');
    assert.equal(read(join(out, 'brawl.json')).data.art.maps['15000555'], BRAWL_DIR + '/m15000555.png');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('switch off, robots against us, broken files: no picture, never a failed feed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pa-brawl-'));
  try {
    fixtures(join(dir, 'fx'), { bad: [16000002] });
    const ctx = makeCtx({ fixtures: join(dir, 'fx', 'brawl'), gapMs: 0 }); ctx.outDir = join(dir, 'o1'); ctx.env = { PA_ART_PNG: '1' };
    const ids = { brawlers: brawlers().map(b => b.id), maps: [15000026], modes: [48000005] };
    const on = await syncBrawlArt(ctx, ids, { switch: { on: true }, prune: true });
    assert.equal(on.b['16000002'], undefined);
    assert.ok(on.notes.some(n => /b16000002/.test(n)));
    const off = await syncBrawlArt(ctx, ids, { switch: { on: false, why: 'off' }, prune: true });
    assert.equal(off.on, false);
    assert.deepEqual(readdirSync(join(dir, 'o1', BRAWL_DIR)), [], 'everything removed when switched off');
    fixtures(join(dir, 'fx2'), { robots: 'User-agent: *\nDisallow: /brawlers/\n' });
    const c2 = makeCtx({ fixtures: join(dir, 'fx2', 'brawl'), gapMs: 0 }); c2.outDir = join(dir, 'o2'); c2.env = { PA_ART_PNG: '1' };
    const bl = await syncBrawlArt(c2, ids, { switch: { on: true } });
    assert.equal(bl.got, 2, 'maps and mode icons are allowed, portraits are not');
    assert.ok(bl.notes.some(n => /robots/.test(n)));
    assert.ok(!c2.requests.some(q => q.url.includes('/brawlers/borderless/')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('feed checks stay; map ids kept by brawlmeta; mode ids', () => {
  assert.throws(() => brawl.validate({ brawlers: { items: brawlers(10) }, rotation: [] }), /brawlers/);
  assert.throws(() => brawl.validate({ brawlers: { items: brawlers() }, rotation, art: null }), /art/);
  assert.throws(() => brawl.validate({ brawlers: { items: brawlers() }, rotation, art: { b: { 1: '../x.png' }, m: {}, g: {}, list: [] } }), /bad file name/);
  assert.equal(modeId('brawlBall'), 48000005);
  assert.equal(modeId('anything', 48000099), 48000099);
  assert.equal(modeId('unknownMode'), null);
  const log = { tag: '#A', items: [{ battleTime: '20261110T080000.000Z', event: { id: 15000026, mode: 'brawlBall', map: 'Sunny Soccer' }, battle: { type: 'ranked', result: 'victory', teams: [[{ tag: '#A', brawler: { id: 16000000, name: 'SHELLY' } }]] } }] };
  const logs = Array.from({ length: 16 }, () => log);
  const c = brawlmeta.compute({ logs, players: 60 });
  assert.equal(c.maps[0].id, 15000026);
});
