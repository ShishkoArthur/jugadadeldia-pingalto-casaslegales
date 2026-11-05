import test from 'node:test';
import assert from 'node:assert/strict';
import { FN, cleanName, shapeStats, kdPlan, everyN } from '../games/fnstats.mjs';
import { parseQuery, Limiter, TtlCache, cacheKey, clientIp, isCloudflare, upstreamError, Alarm } from '../../tools/fnapi/core.mjs';

const sp = s => new URLSearchParams(s);

test('fn tracker: Epic names', () => {
  assert.equal(cleanName('Ninja'), 'Ninja');
  assert.equal(cleanName('  Tfue  '), 'Tfue');
  assert.equal(cleanName('El  Pibe_09'), 'El Pibe_09');
  assert.equal(cleanName('Ñandú.ar-1'), 'Ñandú.ar-1');
  assert.equal(cleanName('ab'), null);
  assert.equal(cleanName('a'.repeat(16)), 'a'.repeat(16));
  assert.equal(cleanName('a'.repeat(17)), null);
  for (const bad of ['Ni<ja', 'a/b/c', '../etc', 'x&name=y', 'na%20me', 'abc?', 'ab\u0000c', 'emoji😀x', '', null, 42]) assert.equal(cleanName(bad), null, String(bad));
});

test('fn tracker: query checks', () => {
  assert.deepEqual(parseQuery(sp('name=Ninja')), { name: 'Ninja', platform: 'all', window: 'lifetime' });
  assert.deepEqual(parseQuery(sp('name=Ninja&platform=touch&window=season')), { name: 'Ninja', platform: 'touch', window: 'season' });
  assert.equal(parseQuery(sp('name=Ni')).error, 'bad_name');
  assert.equal(parseQuery(sp('')).error, 'bad_name');
  assert.equal(parseQuery(sp('name=Ninja&platform=psn')).error, 'bad_param');
  assert.equal(parseQuery(sp('name=Ninja&window=week')).error, 'bad_param');
  assert.equal(cacheKey('NinJa', 'season'), 'ninja|season');
});

test('fn tracker: per-visitor limit is a sliding minute', () => {
  let t = 1000;
  const l = new Limiter(FN.perIpPerMin, 60e3, () => t);
  for (let i = 0; i < FN.perIpPerMin; i++) assert.ok(l.take('a').ok);
  const no = l.take('a');
  assert.equal(no.ok, false);
  assert.ok(no.retryAfter >= 1 && no.retryAfter <= 60);
  assert.ok(l.take('b').ok, 'another visitor is not limited');
  t += 60e3 + 1;
  assert.ok(l.take('a').ok, 'a minute later it works again');
  l.prune(t);
  assert.ok(l.size <= 2);
});

test('fn tracker: cache expires and stays bounded', () => {
  let t = 0;
  const c = new TtlCache(3, () => t);
  c.set('a', 1, 1000);
  assert.equal(c.get('a').value, 1);
  t = 1000;
  assert.equal(c.get('a'), null);
  for (const k of ['b', 'c', 'd', 'e']) c.set(k, k, 5000);
  assert.equal(c.size, 3);
  assert.equal(c.get('b'), null);
});

test('fn tracker: visitor address behind Cloudflare', () => {
  assert.ok(isCloudflare('172.70.1.2'));
  assert.ok(isCloudflare('2a06:98c7::1'));
  assert.ok(!isCloudflare('2a06:98d0::1'));
  assert.ok(!isCloudflare('200.45.1.1'));
  assert.equal(clientIp({ 'x-forwarded-for': '172.70.1.2', 'cf-connecting-ip': '181.1.2.3' }, '172.18.0.2'), '181.1.2.3');
  assert.equal(clientIp({ 'x-forwarded-for': '200.45.1.1', 'cf-connecting-ip': '1.1.1.1' }, '172.18.0.2'), '200.45.1.1', 'a direct request cannot pick its address');
  assert.equal(clientIp({}, '::ffff:10.0.0.5'), '10.0.0.5');
});

test('fn tracker: upstream answers', () => {
  assert.equal(upstreamError(404, { error: 'the requested account does not exist' }).error, 'not_found');
  assert.equal(upstreamError(404, { error: 'the requested profile didnt play any match yet' }).error, 'no_matches');
  assert.equal(upstreamError(403, { error: 'private' }).error, 'private');
  assert.equal(upstreamError(429, null).error, 'busy');
  assert.ok(upstreamError(401, null).key);
  assert.equal(upstreamError(500, null).ttl, 0);
});

test('fn tracker: only the shown fields leave the proxy', () => {
  const m = { score: 9, scorePerMin: 1, matches: 10, wins: 2, winRate: 20, kills: 30, deaths: 8, kd: 3.75, killsPerMatch: 3, minutesPlayed: 200, top10: 4, top25: 6, playersOutlived: 99, lastModified: '2026-10-23T03:12:26Z' };
  const d = shapeStats({ account: { id: 'secret-id', name: 'Ninja' }, battlePass: { level: 40, progress: 12 }, image: 'x', stats: { all: { overall: m, solo: m, duo: null, squad: null, ltm: m }, keyboardMouse: null, gamepad: null, touch: null } });
  assert.deepEqual(Object.keys(d), ['name', 'bp', 'platforms']);
  assert.deepEqual(d.bp, { level: 40, progress: 12 });
  assert.equal(d.platforms.gamepad, null);
  assert.deepEqual(Object.keys(d.platforms.all), ['overall', 'solo', 'duo', 'squad']);
  assert.equal(d.platforms.all.duo, null);
  assert.ok(!('score' in d.platforms.all.overall) && !('playersOutlived' in d.platforms.all.overall));
  assert.equal(d.platforms.all.overall.last, '2026-10-23T03:12:26Z');
  assert.ok(!JSON.stringify(d).includes('secret-id'));
  assert.equal(shapeStats(null), null);
});

test('fn tracker: K/D plan and win rate words', () => {
  assert.deepEqual(kdPlan({ kills: 30, deaths: 10, killsPerMatch: 3, target: 3 }), { need: 0, matches: 0 });
  assert.deepEqual(kdPlan({ kills: 20, deaths: 10, killsPerMatch: 4, target: 3 }), { need: 10, matches: 10 });
  assert.equal(kdPlan({ kills: 20, deaths: 10, killsPerMatch: 2, target: 3 }).matches, Infinity);
  assert.equal(kdPlan({ kills: 1, deaths: 1, killsPerMatch: 1, target: 0 }), null);
  assert.equal(everyN(25, 100), 4);
  assert.equal(everyN(0, 100), Infinity);
});

test('fn tracker: alarm after failures in a row, at once for a bad key, once per period', () => {
  let t = 0;
  const sent = [];
  const a = new Alarm({ after: 3, everyMs: 1000, send: id => sent.push(id), now: () => t });
  a.fail('x'); a.fail('x');
  assert.equal(sent.length, 0);
  a.fail('x');
  assert.equal(sent.length, 1);
  a.fail('x');
  assert.equal(sent.length, 1, 'not again within the period');
  a.ok();
  assert.equal(sent.length, 2, 'recovered note');
  t = 5000;
  a.fail('401', { key: true });
  assert.equal(sent.length, 3);
  assert.equal(sent[2], 'fn_key', 'Russian template: renew the key (data/alerts/ru.json)');
});
