// Generala for 1-8 players (people and computer) as a pure state machine with plain JSON state.
// newGame(rules, { players, seed }); legalActions(state); apply(state, action) never mutates its input.
// Actions: { type: 'roll', keep: [dice values kept] } (the first throw of a turn keeps nothing) and { type: 'score', box }.
// Five equal dice on the first throw of a turn is a generala servida: the player wins at once (rules.generalaServida).
// After the last box of the last player the game ends; the highest total wins (state.winners lists ties).
import { createRng, fromState } from '../cards/rng.mjs';
import { validateRules, boxesOf } from './rules.mjs';
import { boxScore } from './solver.mjs';

export const VERSION = 1;

export function newGame(rules, { players, seed } = {}) {
  const r = validateRules(rules);
  if (!Number.isInteger(players) || players < 1 || players > 8) throw new Error('generala: players is 1-8');
  if (seed === undefined || seed === null) throw new Error('generala: a seed is required');
  const rng = createRng(seed);
  const sheet = Object.fromEntries(boxesOf(r).map(b => [b, null]));
  return { v: VERSION, rules: { ...r }, seed: String(seed), rng: rng.state(), players, sheets: Array.from({ length: players }, () => ({ ...sheet })), turn: 0, round: 1, throws: 0, dice: null, over: false, winners: null, how: null, log: [] };
}

const sortNum = a => a.slice().sort((x, y) => x - y);
export const total = sheet => Object.values(sheet).reduce((t, v) => t + (v || 0), 0);
const isSub = (keep, dice) => { const d = dice.slice(); for (const v of keep) { const i = d.indexOf(v); if (i < 0) return false; d.splice(i, 1); } return true; };

function keepsOf(dice) {
  const out = new Map();
  for (let m = 0; m < 32; m++) { const k = sortNum(dice.filter((_, i) => m & (1 << i))); out.set(k.join(','), k); }
  return [...out.values()].sort((a, b) => a.length - b.length || a.join().localeCompare(b.join()));
}

export function legalActions(state) {
  if (state.over) return [];
  const out = [];
  if (state.throws === 0) return [{ type: 'roll', keep: [] }];
  if (state.throws < 3) for (const keep of keepsOf(state.dice)) out.push({ type: 'roll', keep });
  for (const [box, v] of Object.entries(state.sheets[state.turn])) if (v === null) out.push({ type: 'score', box });
  return out;
}

export function apply(state, action) {
  const s = JSON.parse(JSON.stringify(state));
  step(s, action);
  return s;
}

export function step(s, action) {
  if (s.over) throw new Error('generala: the game is over');
  if (!action || (action.type !== 'roll' && action.type !== 'score')) throw new Error('generala: unknown action');
  if (action.type === 'roll') {
    if (s.throws >= 3) throw new Error('generala: three throws already');
    const keep = action.keep;
    if (!Array.isArray(keep) || (s.throws === 0 ? keep.length !== 0 : !isSub(keep, s.dice)) || keep.length > 5) throw new Error('generala: keep must be some of the dice on the table');
    const rng = fromState(s.rng);
    const dice = sortNum([...keep, ...Array.from({ length: 5 - keep.length }, () => rng.int(6) + 1)]);
    s.rng = rng.state(); s.dice = dice; s.throws++;
    s.log.push({ player: s.turn, round: s.round, type: 'roll', keep: sortNum(keep), dice });
    if (s.throws === 1 && dice.every(v => v === dice[0])) { s.over = true; s.winners = [s.turn]; s.how = 'servida'; }
    return;
  }
  const sheet = s.sheets[s.turn];
  if (s.throws === 0) throw new Error('generala: throw first');
  if (!(action.box in sheet) || sheet[action.box] !== null) throw new Error('generala: box ' + action.box + ' is not open');
  const pts = boxScore(s.rules, action.box, s.dice, s.throws, sheet.generala !== null && sheet.generala > 0);
  sheet[action.box] = pts;
  s.log.push({ player: s.turn, round: s.round, type: 'score', box: action.box, points: pts, throws: s.throws, dice: s.dice.slice() });
  s.throws = 0; s.dice = null;
  s.turn = (s.turn + 1) % s.players;
  if (s.turn === 0) s.round++;
  if (Object.values(s.sheets[s.sheets.length - 1]).every(v => v !== null)) {
    const t = s.sheets.map(total), best = Math.max(...t);
    s.over = true; s.how = 'sheet'; s.winners = t.map((x, i) => (x === best ? i : -1)).filter(i => i >= 0);
  }
}

export function serialize(state) { return JSON.stringify(state); }
export function deserialize(json) {
  const s = JSON.parse(json);
  if (!s || s.v !== VERSION) throw new Error('generala: unknown state version');
  validateRules(s.rules);
  fromState(s.rng);
  return s;
}
