// Computer players for generala and the review of a finished game.
//   facil    keeps the dice of its most frequent face and scores the box with the most points now.
//   normal   exact chances for this turn, each open box valued at what it is worth alone (solver 'additive').
//   dificil  best play for the whole sheet: the highest expected final total (solver 'game', exact dynamic programming).
// review(state, player): every decision of that player compared with the dificil choice, with the expected points lost.
import { createRng } from '../cards/rng.mjs';
import { solver, boxScore } from './solver.mjs';
import { legalActions, step } from './game.mjs';
import { boxesOf } from './rules.mjs';

export const LEVELS = Object.freeze(['facil', 'normal', 'dificil']);

const toAction = o => (o.type === 'score' ? { type: 'score', box: o.box } : { type: 'roll', keep: o.keep });

export function createBot(level, seed) {
  if (!LEVELS.includes(level)) throw new Error('generala createBot: level is one of ' + LEVELS.join(', '));
  if (seed === undefined || seed === null) throw new Error('generala createBot: a seed is required');
  const rng = createRng(seed);
  const choose = state => {
    const L = legalActions(state);
    if (!L.length) throw new Error('generala bot: nothing to do');
    if (state.throws === 0) return L[0];
    const sheet = state.sheets[state.turn];
    if (level === 'facil') return easy(state, sheet, rng);
    const best = solver(state.rules, level === 'dificil' ? 'game' : 'additive').options(sheet, state.dice, state.throws)[0];
    return toAction(best);
  };
  return { level, choose };
}

function easy(state, sheet, rng) {
  const d = state.dice, r = state.rules, g = sheet.generala !== null && sheet.generala > 0;
  const open = Object.keys(sheet).filter(b => sheet[b] === null);
  const now = open.map(b => [b, boxScore(r, b, d, state.throws, g)]).sort((a, b) => b[1] - a[1]);
  const major = now.find(([b, p]) => p > 0 && !/^[1-6]$/.test(b));
  if (state.throws === 3 || major) {
    if (now[0][1] > 0) return { type: 'score', box: now[0][0] };
    const order = ['1', '2', '3', 'doble', 'generala', '4', 'poker', 'full', 'escalera', '5', '6'];
    return { type: 'score', box: order.find(b => open.includes(b)) || open[0] };
  }
  const c = [0, 0, 0, 0, 0, 0, 0];
  d.forEach(v => c[v]++);
  let face = 6;
  for (let f = 6; f >= 1; f--) if (c[f] > c[face] || (c[f] === c[face] && rng.float() < 0.3)) face = f;
  return { type: 'roll', keep: d.filter(v => v === face) };
}

// Play a whole game between bots (tests, "ver una partida"). Returns the final state.
export function playGame(state, bots, { maxActions }) {
  if (!Number.isInteger(maxActions)) throw new Error('playGame: maxActions is required');
  let n = 0;
  while (!state.over) {
    step(state, bots[state.turn].choose(state));
    if (++n > maxActions) throw new Error('playGame: too many actions');
  }
  return state;
}

export function review(state, player) {
  const S = solver(state.rules, 'game');
  const sheet = Object.fromEntries(boxesOf(state.rules).map(b => [b, null]));
  const out = [];
  let dice = null, throws = 0;
  for (const e of state.log) {
    if (e.player !== player) continue;
    if (e.type === 'roll') {
      if (throws > 0) note(S.options(sheet, dice, throws), o => o.type === 'roll' && o.keep.join() === e.keep.join(), e, dice, throws);
      dice = e.dice; throws++;
    } else {
      note(S.options(sheet, dice, throws), o => o.type === 'score' && o.box === e.box, e, dice, throws);
      sheet[e.box] = e.points; dice = null; throws = 0;
    }
  }
  return out;
  function note(opts, isChosen, e, d, t) {
    const chosen = opts.find(isChosen), best = opts[0];
    if (chosen && best.ev - chosen.ev > 1e-9) out.push({ round: e.round, throwsDone: t, dice: d.slice(), chose: chosen, best, lost: best.ev - chosen.ev });
  }
}
