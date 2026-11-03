// pingalto feeds: PandaScore agenda (statuses, scores, masking of betting brands, no raw fields kept) and the Supercell helpers.
import test from 'node:test';
import assert from 'node:assert/strict';
import agenda, { GAMES } from '../../tools/feeds/pingalto/agenda.mjs';
import brawl from '../../tools/feeds/pingalto/brawl.mjs';
import clash from '../../tools/feeds/pingalto/clash.mjs';
import { scTime, cutoffs } from '../../tools/feeds/pingalto/supercell.mjs';

const match = (o = {}) => ({
  id: 1, status: 'not_started', begin_at: '2026-11-04T13:00:00Z', number_of_games: 3, match_type: 'best_of', rescheduled: false, forfeit: false,
  opponents: [{ opponent: { id: 10, name: '9z Team', acronym: '9z', location: 'AR', image_url: 'x' } }, { opponent: { id: 11, name: 'BetBoom Team', acronym: 'BB', location: 'RU' } }],
  results: [{ team_id: 10, score: 0 }, { team_id: 11, score: 0 }],
  league: { name: 'IEM' }, serie: { full_name: 'Beijing 2026' }, tournament: { name: 'Playoffs', tier: 'b', region: 'ASIA' },
  streams_list: [{ official: true, main: true, language: 'en', raw_url: 'https://www.twitch.tv/esl_csgo' }], ...o,
});
const raw = list => ({ games: Object.fromEntries(GAMES.map(g => [g.k, { running: [], up: g.k === 'cs2' ? list : [], past: [] }])) });

test('agenda: keeps display fields only, masks betting brands, marks Argentine teams', () => {
  const out = agenda.compute(raw([match(), match({ id: 2, tournament: { name: 'Open', tier: 'd', region: 'EEU' }, opponents: [] })]));
  assert.equal(out.matches.length, 1, 'tier d without Latin American teams is left out');
  const m = out.matches[0];
  assert.deepEqual(m.teams.map(t => t.n), ['9z Team', 'Nombre oculto']);
  assert.equal(m.teams[1].a, undefined);
  assert.equal(m.ar, true);
  assert.equal(m.tv.url, 'https://www.twitch.tv/esl_csgo');
  assert.ok(!JSON.stringify(out).includes('image_url') && !JSON.stringify(out).includes('BetBoom'));
});

test('agenda: unknown status, impossible score, betting fields stop the run', () => {
  agenda.validate(raw([match()]));
  assert.throws(() => agenda.validate(raw([match({ status: 'delayed' })])), /unknown status/);
  assert.throws(() => agenda.validate(raw([match({ results: [{ team_id: 10, score: 3 }] })])), /score/);
  assert.throws(() => agenda.validate(raw([match({ odds: [] })])), /betting/);
  assert.throws(() => agenda.validate(raw([])), /no match/);
  const c = agenda.compute(raw([match({ status: 'canceled' })]));
  assert.equal(c.matches.length, 0, 'canceled matches are dropped');
});

test('supercell helpers and feeds', () => {
  assert.equal(scTime('20261103T100000.000Z'), '2026-11-03T10:00:00Z');
  assert.throws(() => scTime('2026-11-03'), /bad Supercell time/);
  const items = Array.from({ length: 200 }, (_, i) => ({ rank: i + 1, trophies: 100000 - i * 10, name: 'player' + i, tag: '#X' }));
  const c = cutoffs(items, 'trophies');
  assert.deepEqual(c.at.map(x => x.rank), [1, 10, 25, 50, 100, 200]);
  assert.ok(!JSON.stringify(c).includes('player'));
  assert.throws(() => cutoffs([{ rank: 1, trophies: 1 }, { rank: 2, trophies: 5 }], 'trophies'), /not sorted/);
  const brawlers = { items: Array.from({ length: 60 }, (_, i) => ({ id: 16000000 + i, name: 'B' + i, starPowers: [{ name: 'S' }], gadgets: [{ name: 'G' }] })) };
  const rot = [{ startTime: '20261103T080000.000Z', endTime: '20261104T080000.000Z', slotId: 1, event: { mode: 'brawlBall', map: 'Human Nature' } }];
  brawl.validate({ brawlers, rotation: rot });
  assert.equal(brawl.compute({ brawlers, rotation: rot, notes: [] }, null).newest, 16000059);
  assert.throws(() => clash.validate({ cards: { items: [{ id: 1, name: 'x', rarity: 'common' }] } }), /items/);
});
