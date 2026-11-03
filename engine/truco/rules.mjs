// Truco rule sets. Every field is required: a missing or unknown value is an error, never a silent default (PLAYBOOK §5).
// Sources and quotes for every option: data/sources/truco/rules.json.
//
//   players          2 (1 vs 1) or 4 (2 vs 2, partners sit facing, seat % 2 is the team; engine/truco/game4.mjs).
//                    2 vs 2 is played sin flor only for now (flor between four hands has its own rules, not built yet).
//   target           15, 30 or 40 points. With 30 and 40 the first half are "malas", the second half "buenas".
//   flor             true = con flor (flor 3, con flor me achico 4, contraflor 6, contraflor al resto wins the chico),
//                    false = sin flor (three of a suit count as envido: 20 + the two highest).
//   falta            how much a won falta envido is worth:
//                    'leader-to-win'    points the leading side needs to win the chico (juegosdesalon reglamento);
//                    'leader-to-stage'  points the leader needs to reach the buenas while in malas, else to win (Catamarca);
//                    'malas-wins-match' while the leader is in malas the winner takes the chico, else what the leader
//                                       needs to win (Juegos Bonaerenses 9.2).
//   mazoNoCardPoints points the other side scores when a side goes to the mazo before playing any card and before anything
//                    was sung in the hand: 2 (Juegos Bonaerenses 6.1) or 1.
//   responder        2 vs 2 only (required there, unknown with 2 players): who answers a call for the other team.
//                    'pie'   the pie of that team, the last of its two players in the hand ("Pie: ultimo jugador de cada
//                            bando; suele actuar como capitan", juegosdesalon);
//                    'next'  the next player of that team after the caller ("cualquier jugador del bando contrario puede
//                            contestar y su respuesta obliga a todo su equipo", juegosdesalon).
export const FALTA = Object.freeze(['leader-to-win', 'leader-to-stage', 'malas-wins-match']);
const KEYS = ['players', 'target', 'flor', 'falta', 'mazoNoCardPoints'];
export const RESPONDERS = Object.freeze(['pie', 'next']);

export function validateRules(r) {
  if (!r || typeof r !== 'object') throw new Error('truco: a rule set object is required (see engine/truco/rules.mjs)');
  for (const k of KEYS) if (!(k in r)) throw new Error('truco rules: missing "' + k + '"');
  for (const k of Object.keys(r)) if (!KEYS.includes(k) && k !== 'name' && !(k === 'responder' && r.players === 4)) throw new Error('truco rules: unknown key "' + k + '"');
  if (r.players !== 2 && r.players !== 4) throw new Error('truco rules: players must be 2 or 4');
  if (r.players === 4) {
    if (!('responder' in r)) throw new Error('truco rules: missing "responder" (2 vs 2)');
    if (!RESPONDERS.includes(r.responder)) throw new Error('truco rules: responder must be one of ' + RESPONDERS.join(', '));
    if (r.flor !== false) throw new Error('truco rules: 2 vs 2 con flor is not implemented yet (flor: false)');
  }
  if (![15, 30, 40].includes(r.target)) throw new Error('truco rules: target must be 15, 30 or 40');
  if (typeof r.flor !== 'boolean') throw new Error('truco rules: flor must be true or false');
  if (!FALTA.includes(r.falta)) throw new Error('truco rules: falta must be one of ' + FALTA.join(', '));
  if (![1, 2].includes(r.mazoNoCardPoints)) throw new Error('truco rules: mazoNoCardPoints must be 1 or 2');
  if (r.name !== undefined && (typeof r.name !== 'string' || !/^[a-z0-9-]+$/.test(r.name))) throw new Error('truco rules: bad name');
  return Object.freeze({ ...r });
}

// Where the malas end (null when the chico has no buenas, i.e. a game to 15).
export const buenasAt = r => (r.target > 15 ? r.target / 2 : null);

// Named rule sets for the pages. They are explicit objects the caller passes; nothing is picked for the caller.
export const RULESETS = Object.freeze({
  'bonaerense-40-con-flor': Object.freeze({ name: 'bonaerense-40-con-flor', players: 2, target: 40, flor: true, falta: 'malas-wins-match', mazoNoCardPoints: 2 }),
  'clasico-30-sin-flor': Object.freeze({ name: 'clasico-30-sin-flor', players: 2, target: 30, flor: false, falta: 'malas-wins-match', mazoNoCardPoints: 2 }),
  'clasico-30-con-flor': Object.freeze({ name: 'clasico-30-con-flor', players: 2, target: 30, flor: true, falta: 'malas-wins-match', mazoNoCardPoints: 2 }),
  'corto-15-sin-flor': Object.freeze({ name: 'corto-15-sin-flor', players: 2, target: 15, flor: false, falta: 'leader-to-win', mazoNoCardPoints: 2 }),
  'parejas-30-sin-flor': Object.freeze({ name: 'parejas-30-sin-flor', players: 4, target: 30, flor: false, falta: 'malas-wins-match', mazoNoCardPoints: 2, responder: 'pie' }),
  'parejas-15-sin-flor': Object.freeze({ name: 'parejas-15-sin-flor', players: 4, target: 15, flor: false, falta: 'leader-to-win', mazoNoCardPoints: 1, responder: 'next' }),
});

// Winner of the bazas, or null if not decided yet. Results are team numbers or -1 (parda).
// Parda rules: first parda -> the next baza decides; all three parda -> the mano; one each and a parda -> the side that won first.
export function handWinner(R, manoTeam) {
  if (R.length < 2) return null;
  const [a, b, c] = R;
  if (a === -1) {
    if (b !== -1) return b;
    if (R.length < 3) return null;
    return c !== -1 ? c : manoTeam;
  }
  if (b === a || b === -1) return a;
  if (R.length < 3) return null;
  return c === -1 ? a : c;
}

// Falta envido value for the side that wins it.
export function faltaValue(rules, score, winnerTeam) {
  const lead = Math.max(...score), half = buenasAt(rules);
  switch (rules.falta) {
    case 'leader-to-win': return rules.target - lead;
    case 'leader-to-stage': return half !== null && lead < half ? half - lead : rules.target - lead;
    case 'malas-wins-match': return half !== null && lead < half ? rules.target - score[winnerTeam] : rules.target - lead;
    default: throw new Error('truco rules: unknown falta ' + rules.falta);
  }
}

// Envido chain values. A chain is a subsequence of envido, envido, real envido, falta envido (Juegos Bonaerenses table 10).
export const ENVIDO_CALLS = Object.freeze(['envido', 'realEnvido', 'faltaEnvido']);
export function envidoCanRaise(chain, kind) {
  const e = chain.filter(x => x === 'envido').length, r = chain.includes('realEnvido'), f = chain.includes('faltaEnvido');
  if (kind === 'envido') return e < 2 && !r && !f;
  if (kind === 'realEnvido') return !r && !f;
  if (kind === 'faltaEnvido') return !f;
  throw new Error('unknown envido call ' + kind);
}
// Points for "quiero" (falta replaces the sum) and for "no quiero" (the accepted part before the last call, at least 1).
export function envidoQuieroValue(rules, chain, score, winnerTeam) {
  if (chain.includes('faltaEnvido')) return faltaValue(rules, score, winnerTeam);
  return chain.reduce((t, k) => t + (k === 'envido' ? 2 : 3), 0);
}
export function envidoNoQuieroValue(chain) {
  if (chain.length === 1) return 1;
  return chain.slice(0, -1).reduce((t, k) => t + (k === 'envido' ? 2 : 3), 0);
}

export const TRUCO_CALLS = Object.freeze({ 2: 'truco', 3: 'retruco', 4: 'valeCuatro' });
export const FLOR_POINTS = Object.freeze({ alone: 3, achico: 4, contraflor: 6, rejected: 4 });
