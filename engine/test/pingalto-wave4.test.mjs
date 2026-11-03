// pingalto wave 4: Elo over series (dotaelo), the Swiss stage simulator with Valve's pairing rules, and the new feeds (big
// events, Argentine players, Clash Royale and Brawl Stars meta of the Argentine top): only counts and display fields are kept.
import test from 'node:test';
import assert from 'node:assert/strict';
import { eloRun, eloExpect, ELO } from '../games/elo.mjs';
import { simulate, playStage, rng, R1, TABLE6 } from '../games/swisssim.mjs';
import { swiss } from '../games/series.mjs';
import torneos, { EVENTS } from '../../tools/feeds/pingalto/torneos.mjs';
import argentinos from '../../tools/feeds/pingalto/argentinos.mjs';
import clashmeta from '../../tools/feeds/pingalto/clashmeta.mjs';
import brawlmeta from '../../tools/feeds/pingalto/brawlmeta.mjs';
import dotaelo from '../../tools/feeds/pingalto/dotaelo.mjs';

test('elo: expectation, zero-sum update, backtest only with enough history', () => {
  assert.equal(eloExpect(1500, 1500), 0.5);
  assert.ok(Math.abs(eloExpect(1600, 1400) - 1 / (1 + 10 ** (-200 / 400))) < 1e-12);
  const s = [];
  for (let i = 0; i < 20; i++) s.push({ t: '2026-10-' + String(i + 1).padStart(2, '0') + 'T00:00:00Z', a: 1, b: 2, w: 0 });
  const r = eloRun(s, { testFrom: '2026-10-10T00:00:00Z' });
  const A = r.teams.get(1), B = r.teams.get(2);
  assert.ok(Math.abs(A.r + B.r - 2 * ELO.start) < 1e-9, 'points move from one team to the other');
  assert.equal(A.w, 20); assert.equal(B.l, 20);
  assert.equal(r.test.n, 11); assert.equal(r.test.hit, 11);
  assert.throws(() => eloRun([{ t: 'x', a: 1, b: 1, w: 0 }]), /bad series/);
});

test('swiss simulator: Valve round 1, table of six, 8 advance, equal teams match the exact one-team count', () => {
  assert.deepEqual(R1.map(x => x[1] - x[0]), new Array(8).fill(8));
  assert.equal(TABLE6.length, 15);
  for (const row of TABLE6) assert.deepEqual(row.flat().sort(), [1, 2, 3, 4, 5, 6]);
  const rand = rng(7);
  for (let k = 0; k < 300; k++) {
    const T = playStage(() => 0.5, rand);
    assert.equal(T.filter(t => t.w === 3).length, 8);
    for (const t of T) assert.equal(new Set(t.opp).size, t.opp.length, 'no rematch in a 16-team stage');
  }
  const eq = simulate(new Array(16).fill(1500), () => 0.5, { runs: 4000 });
  const ex = swiss(0.5).records;
  for (const r of ex) { const avg = eq.reduce((t, x) => t + x.rec[r.w + '-' + r.l], 0) / 16; assert.ok(Math.abs(avg - r.probability) < 1e-12); }
  const strong = simulate(Array.from({ length: 16 }, (_, i) => 2000 - i * 50), (a, b) => eloExpect(a, b), { runs: 4000 });
  assert.ok(strong[0].advance > strong[15].advance + 0.5, 'seed 1 advances far more often than seed 16');
  assert.deepEqual(simulate(new Array(16).fill(1), () => 0.6, { runs: 50, seed: 3 }), simulate(new Array(16).fill(1), () => 0.6, { runs: 50, seed: 3 }), 'seeded: same input, same numbers');
});

const team = (id, name, loc) => ({ id, name, acronym: name.slice(0, 3), location: loc, image_url: 'x' });
const m = (id, a, b, o = {}) => ({ id, status: 'finished', name: 'Grand Final: X vs Y', begin_at: '2026-10-01T18:00:00Z', end_at: '2026-10-01T21:00:00Z', number_of_games: 5, match_type: 'best_of', tournament_id: 9, opponents: [{ opponent: a }, { opponent: b }], results: [{ team_id: a.id, score: 3 }, { team_id: b.id, score: 1 }], winner_id: a.id, streams_list: [], league: {}, serie: {}, tournament: {}, ...o });

test('torneos: winner from the last stage grand final, betting brands masked, no images', () => {
  const A = team(1, 'Leviatan', 'AR'), B = team(2, 'BetBoom Team', 'RU');
  const ed = { serie: { id: 5, full_name: 'Masters 2026', begin_at: '2026-09-20T00:00:00Z', end_at: '2026-10-01T23:00:00Z', winner_id: null }, matches: [m(1, A, B)], stages: [{ id: 8, name: 'Groups', begin_at: '2026-09-20T00:00:00Z' }, { id: 9, name: 'Playoffs', begin_at: '2026-09-28T00:00:00Z' }] };
  const raw = { fetched: '2026-11-03T00:00:00Z', events: EVENTS.map(e => ({ k: e.k, eds: [ed] })) };
  torneos.validate(raw);
  const out = torneos.compute(raw);
  const x = out.events[0].eds[0];
  assert.deepEqual(x.winner, { n: 'Leviatan', loc: 'AR' });
  assert.equal(x.st, 'finished');
  assert.equal(x.matches[0].rd, 'Grand Final');
  assert.equal(x.matches[0].ar, true);
  const s = JSON.stringify(out);
  assert.ok(!s.includes('BetBoom') && !s.includes('image_url'));
  assert.throws(() => torneos.validate({ ...raw, events: raw.events.map(e => ({ ...e, eds: [{ ...ed, matches: [m(2, A, B, { status: 'delayed' })] }] })) }), /status/);
});

test('argentinos: nick, team and game only; masked brands', () => {
  const players = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, name: 'nick' + i, first_name: 'Real', last_name: 'Name', birthday: '2000-01-01', nationality: 'AR', active: true, current_videogame: { slug: 'cs-go' }, current_team: i ? { id: 100 + i, name: i === 1 ? '1win Team' : 'Team ' + i, location: i % 2 ? 'BR' : 'AR' } : null }));
  const raw = { players, teams: [{ id: 7, name: 'Isurus', location: 'AR', current_videogame: { slug: 'cs-go' }, players: [{ nationality: 'AR', active: true }, { nationality: 'UY', active: true }] }] };
  argentinos.validate(raw);
  const out = argentinos.compute(raw);
  assert.equal(out.players.length, 59);
  const s = JSON.stringify(out);
  assert.ok(!s.includes('Real') && !s.includes('2000-01-01') && !s.includes('1win'));
  assert.deepEqual(out.teams[0], { n: 'Isurus', i: 7, g: 'cs-go', ar: 1, all: 2 });
});

test('clash and brawl meta: counts only, no names or tags', () => {
  const decks = Array.from({ length: 50 }, (_, i) => ({ cards: [1, 2, 3, 4, 5, 6, 7, i % 2 ? 8 : 9].map(id => ({ id, evo: id === 1 })), trophies: 9000 + i }));
  const c = clashmeta.compute({ clans: 10, decks });
  clashmeta.validate({ clans: 10, decks, errors: [] });
  assert.equal(c.n, 50);
  assert.deepEqual(c.cards[0], { id: 1, n: 50, evo: 50 });
  assert.equal(c.decks.length, 2);
  const tag = '#ABC';
  const item = (mode, result, id) => ({ battleTime: '20261103T100000.000Z', event: { mode, map: 'Hard Rock Mine' }, battle: { type: 'ranked', mode, result, teams: [[{ tag, name: 'Secret Name', brawler: { id, name: 'SHELLY' } }], [{ tag: '#Z', name: 'Other', brawler: { id: 2, name: 'COLT' } }]] } });
  const raw = { players: 60, logs: Array.from({ length: 40 }, () => ({ tag, items: [item('gemGrab', 'victory', 1), item('gemGrab', 'defeat', 1), { ...item('gemGrab', 'victory', 1), battle: { ...item('gemGrab', 'victory', 1).battle, type: 'friendly' } }] })), errors: [] };
  brawlmeta.validate(raw);
  const b = brawlmeta.compute(raw);
  assert.equal(b.battles, 80);
  assert.deepEqual(b.brawlers[0], { id: 1, n: 'SHELLY', u: 80, w: 40, d: 80 });
  const s = JSON.stringify(b);
  assert.ok(!s.includes('Secret') && !s.includes('#ABC') && !s.includes('COLT'));
});

test('dotaelo: forfeits and series without a winner are left out, brands masked', () => {
  const A = team(1, 'Alpha', 'PE'), B = team(2, 'Parimatch Five', 'UA'), C = team(3, 'Gamma', 'AR');
  const list = [];
  for (let i = 0; i < 300; i++) list.push(m(i + 1, i % 3 ? A : C, i % 2 ? B : C, { end_at: '2026-10-' + String((i % 28) + 1).padStart(2, '0') + 'T12:00:00Z', winner_id: i % 5 ? (i % 3 ? A.id : C.id) : (i % 2 ? B.id : C.id), forfeit: i === 7 }));
  const raw = { matches: list.filter(x => x.opponents[0].opponent.id !== x.opponents[1].opponent.id), from: '2026-05-06T00:00:00Z', to: '2026-11-03T00:00:00Z' };
  dotaelo.validate(raw);
  const out = dotaelo.compute(raw);
  assert.ok(out.rows.length >= 2);
  assert.ok(!JSON.stringify(out).includes('Parimatch'));
  assert.ok(out.rows.some(r => r.sa));
});

test('wilson interval', async () => {
  const { wilson, below } = await import('../games/stats.mjs');
  const [lo, hi] = wilson(3, 4);
  assert.ok(Math.abs(lo - 0.3006) < 1e-3 && Math.abs(hi - 0.9544) < 1e-3);
  assert.deepEqual(wilson(0, 0), [0, 1]);
  const [a, b] = wilson(500, 1000);
  assert.ok(Math.abs(a - 0.469) < 1e-3 && Math.abs(b - 0.531) < 1e-3);
  assert.throws(() => wilson(5, 4), /bad counts/);
  assert.equal(below([1, 2, 3, 4], 3), 0.5);
});
