// Clash Royale card art (owner 2026-11-10): the clash feed copies the official images named by iconUrls once, unmodified, into
// <out>/clash-art/, lists them in clash-art.json, never fetches an unchanged one again, drops files the API no longer names,
// skips anything that is not a PNG from the official image host, obeys robots.txt and the switch in assets.json. No network:
// recorded answers in a temporary fixture folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import clash from '../../tools/feeds/pingalto/clash.mjs';
import { runFeed } from '../../tools/feeds/run.mjs';
import { makeCtx } from '../../tools/feeds/lib.mjs';
import { syncArt, artUrl, artFile, robotsAllow, isPng, ART_DIR } from '../../tools/feeds/pingalto/card-art.mjs';

const API = 'https://api.clashroyale.com/v1';
const IMG = 'https://api-assets.clashroyale.com/cards/300/';
const RAR = ['common', 'rare', 'epic', 'legendary', 'champion'];
const png = n => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(1500, n)]);

function cards(n = 85, change = {}) {
  return Array.from({ length: n }, (_, i) => {
    const id = 26000000 + i;
    const c = { id, name: 'Card ' + i, rarity: RAR[i % 5], elixirCost: 1 + (i % 7), maxLevel: 16, iconUrls: { medium: IMG + (change[id] || 'card' + i + 'abcdefgh') + '.png' } };
    if (i % 4 === 0) { c.maxEvolutionLevel = 1; c.iconUrls.evolutionMedium = IMG + 'evo' + i + 'abcdefgh.png'; }
    return c;
  });
}

function fixtures(dir, items, o = {}) {
  const f = join(dir, 'clash');
  mkdirSync(f, { recursive: true });
  const idx = { _fetched: '2026-11-10T12:00:00.000Z' };
  const put = (url, name, body) => { writeFileSync(join(f, name), body); idx[url] = name; };
  put(API + '/cards', 'cards.json', JSON.stringify({ items, supportItems: [{ id: 159000000, name: 'Tower Princess', rarity: 'common', maxLevel: 16, iconUrls: { medium: IMG + 'towerprincess01.png' } }] }));
  put(API + '/locations?limit=300', 'locs.json', JSON.stringify({ items: [{ id: 57000017, name: 'Argentina', countryCode: 'AR' }] }));
  put(API + '/locations/57000017/pathoflegend/players?limit=200', 'pol.json', JSON.stringify({ items: [{ rank: 1, eloRating: 3000 }, { rank: 2, eloRating: 2900 }] }));
  idx['https://api-assets.clashroyale.com/robots.txt'] = o.robots ? (writeFileSync(join(f, 'robots.txt'), o.robots), 'robots.txt') : { status: 404 };
  if (o.images !== false) for (const c of [...items, { id: 159000000, iconUrls: { medium: IMG + 'towerprincess01.png' } }]) for (const u of Object.values(c.iconUrls)) {
    const name = 'img-' + u.split('/').pop();
    writeFileSync(join(f, name), o.bad && o.bad.includes(c.id) ? Buffer.from('<html>not an image</html>') : png(c.id % 200));
    idx[u] = { file: name, type: 'image/png' };
  }
  writeFileSync(join(f, 'index.json'), JSON.stringify(idx));
}

const env = { CR_API_KEY: 'test-key' };
const read = f => JSON.parse(readFileSync(f, 'utf8'));

test('first run copies every official image once and the cards point at them', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pa-art-')), out = join(dir, 'out');
  try {
    const items = cards();
    fixtures(join(dir, 'fx'), items);
    const r = await runFeed(clash, { out, fixtures: join(dir, 'fx'), env });
    assert.equal(r.ok, true, r.error);
    const evo = items.filter(c => c.iconUrls.evolutionMedium).length;
    assert.equal(r.requests, 3 + 1 + items.length + evo + 1, 'API + robots + every image once');
    const doc = read(join(out, 'clash.json')).data;
    assert.equal(doc.cards.length, 85);
    assert.equal(doc.art.on, true);
    for (const c of doc.cards) {
      assert.match(c.img, /^clash-art\/\d+-[0-9a-f]{10}\.png$/);
      assert.ok(existsSync(join(out, c.img)), c.img);
      assert.equal(!!c.ei, !!c.evo, 'evolution art only for cards with an evolution');
    }
    const src = items[3];
    assert.deepEqual(readFileSync(join(out, doc.cards.find(c => c.id === src.id).img)), png(src.id % 200), 'bytes unmodified');
    const list = read(join(out, 'clash-art.json')).data;
    assert.equal(list.publisher, 'Supercell');
    assert.equal(list.files.length, items.length + evo + 1);
    for (const f of list.files) { assert.ok(f.url.startsWith(IMG)); assert.ok(f.fetched); assert.ok(existsSync(join(out, ART_DIR, f.file))); }

    fixtures(join(dir, 'fx2'), items, { images: false });
    const r2 = await runFeed(clash, { out, fixtures: join(dir, 'fx2'), env });
    assert.equal(r2.ok, true, r2.error);
    assert.equal(r2.requests, 3, 'unchanged images are never fetched again (no robots, no image request)');
    assert.deepEqual(read(join(out, 'clash-art.json')).data.files.map(f => f.fetched), list.files.map(f => f.fetched), 'copy dates kept');

    const changed = cards(85, { 26000005: 'card5newartwork' });
    fixtures(join(dir, 'fx3'), changed);
    const r3 = await runFeed(clash, { out, fixtures: join(dir, 'fx3'), env });
    assert.equal(r3.ok, true, r3.error);
    assert.equal(r3.requests, 3 + 1 + 1, 'only the changed image is fetched');
    const c5 = read(join(out, 'clash.json')).data.cards.find(c => c.id === 26000005);
    assert.equal(c5.img, ART_DIR + '/' + artFile(26000005, '', IMG + 'card5newartwork.png'));
    assert.equal(readdirSync(join(out, ART_DIR)).filter(f => f.startsWith('26000005-')).length, 1, 'the old file of a changed card is removed');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a broken image or a foreign host never breaks the feed: that card keeps the text tile', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pa-art-')), out = join(dir, 'out');
  try {
    const items = cards();
    items[7].iconUrls.medium = 'https://example.com/cards/300/card7abcdefgh.png';
    fixtures(join(dir, 'fx'), items, { bad: [26000002] });
    const r = await runFeed(clash, { out, fixtures: join(dir, 'fx'), env });
    assert.equal(r.ok, true, r.error);
    const doc = read(join(out, 'clash.json')).data;
    assert.equal(doc.cards.find(c => c.id === 26000002).img, undefined);
    assert.equal(doc.cards.find(c => c.id === 26000007).img, undefined);
    assert.ok(doc.notes.some(n => /26000002/.test(n)) && doc.notes.some(n => /26000007/.test(n)));
    assert.ok(!readdirSync(join(out, ART_DIR)).some(f => f.startsWith('26000002-') || f.startsWith('26000007-')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the feed keeps its sanity checks', () => {
  assert.throws(() => clash.validate({ cards: { items: cards(10) }, art: { files: {}, list: [] } }), /items/);
  assert.throws(() => clash.validate({ cards: { items: cards() } }), /art/);
  assert.throws(() => clash.validate({ cards: { items: cards() }, art: { files: { 1: { img: '../x.png' } }, list: [] } }), /bad file name/);
  const bad = cards(); bad[0].rarity = 'mythic';
  assert.throws(() => clash.validate({ cards: { items: bad }, art: { files: {}, list: [] } }), /rarity/);
});

test('switch off in assets.json or robots.txt against us: no download, folder emptied when off', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pa-art-')), out = join(dir, 'out');
  try {
    const items = cards();
    fixtures(join(dir, 'fx'), items);
    const ctx = makeCtx({ fixtures: join(dir, 'fx', 'clash'), gapMs: 0 });
    ctx.outDir = out;
    const on = await syncArt(ctx, items, { switch: { on: true } });
    assert.ok(on.got > 80);
    const off = await syncArt(ctx, items, { switch: { on: false, why: 'off' } });
    assert.equal(off.on, false);
    assert.deepEqual(off.files, {});
    assert.equal(readdirSync(join(out, ART_DIR)).length, 0, 'all copied art removed');

    fixtures(join(dir, 'fx2'), items, { robots: 'User-agent: ClaudeBot\nDisallow: /cards/\n' });
    const ctx2 = makeCtx({ fixtures: join(dir, 'fx2', 'clash'), gapMs: 0 });
    ctx2.outDir = join(dir, 'out2');
    const blocked = await syncArt(ctx2, items, { switch: { on: true } });
    assert.equal(blocked.got, 0);
    assert.ok(blocked.notes.some(n => /robots/.test(n)));
    assert.ok(!ctx2.requests.some(q => q.url.startsWith(IMG)), 'no image requested');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('helpers: official host only, PNG check, robots rules', () => {
  assert.equal(artUrl(IMG + 'abcdefgh123.png'), IMG + 'abcdefgh123.png');
  for (const u of ['http://api-assets.clashroyale.com/cards/300/abcdefgh123.png', 'https://api-assets.clashroyale.com/cards/300/abcdefgh123.png?x=1', 'https://cdn.example/cards/300/abcdefgh123.png', 'https://api-assets.clashroyale.com/other/abcdefgh123.png', 'nonsense']) assert.equal(artUrl(u), null, u);
  assert.equal(isPng(png(1)), true);
  assert.equal(isPng(Buffer.from('GIF89a' + 'x'.repeat(2000))), false);
  assert.equal(robotsAllow('', '/cards/300/x.png'), true);
  assert.equal(robotsAllow('User-agent: *\nDisallow: /cards/\n', '/cards/300/x.png'), false);
  assert.equal(robotsAllow('User-agent: *\nDisallow: /\nAllow: /cards/\n', '/cards/300/x.png'), true);
  assert.equal(robotsAllow('User-agent: anthropic-ai\nDisallow: /\n', '/cards/300/x.png'), false);
  assert.equal(robotsAllow('User-agent: Googlebot\nDisallow: /\n', '/cards/300/x.png'), true);
});
