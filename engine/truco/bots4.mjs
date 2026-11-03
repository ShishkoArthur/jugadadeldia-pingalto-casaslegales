// Computer players for truco 2 vs 2 (teammates and opponents of the human). Same levels and entry point as 1 vs 1:
// createBot(level, seed).choose(obs) in bots.mjs sends 4-player observations here. A bot sees only observation4(): its
// cards, the table, what was sung and shown, and the senas of its partner (bots never signal themselves).
//   facil    legal moves at random with rules of thumb (envido with good points, accepts by coin and hand).
//   normal   samples the hidden cards (respecting played cards, shown envido points and the partner's senas) and plays the
//            bazas of each sample with open cards by exact minimax for both teams; envido and truco by those chances.
//   dificil  like normal with more samples, weighted by what each opponent did (sang envido, called or accepted truco),
//            score-aware answers and a set bluff frequency.
import { DECK_40 } from '../cards/spanish.mjs';
import { POWER, envidoPoints } from './cards.mjs';
import { envidoNoQuieroValue, faltaValue, TRUCO_CALLS, handWinner } from './rules.mjs';
import { bazaResult, singEnvido, senaHolds } from './game4.mjs';

const N = 4;
const team = s => s % 2;
const CFG = Object.freeze({
  facil: {},
  normal: { samples: 48, weights: false, bluff: 0 },
  dificil: { samples: 120, weights: true, bluff: 0.1 },
});
const has = (L, t) => L.find(a => a.type === t);
const TRUCO_TYPES = new Set(['truco', 'retruco', 'valeCuatro']);

export function choose4(obs, rng, level) {
  if (level === 'facil') return easy(obs, rng);
  return smart(obs, rng, CFG[level]);
}

// ---------- sampling the hidden cards ----------

function playedBy(h) {
  const out = [[], [], [], []];
  for (const b of h.bazas) for (let s = 0; s < N; s++) if (b.cards[s]) out[s].push(b.cards[s]);
  return out;
}

export function sampleDeals(obs, k, rng, weighted) {
  const h = obs.hand, me = obs.seat, played = playedBy(h);
  const known = new Set([...h.hands[me], ...played.flat()]);
  const pool = DECK_40.filter(c => !known.has(c));
  const er = h.envido.result;
  const senas = h.senas.filter(x => x.seat !== me);
  const ok = full => {
    for (let s = 0; s < N; s++) {
      if (s === me) continue;
      if (er && er.accepted && er.points && !h.folded[s]) {
        const e = envidoPoints(full[s]);
        if (er.points[s] !== null && er.points[s] !== undefined) { if (e !== er.points[s]) return false; }
        else if (team(s) !== team(er.winner) && e > er.points[er.winner]) return false;
      }
    }
    for (const x of senas) if (!senaHolds(full[x.seat], x.sign)) return false;
    return true;
  };
  const deals = [], weights = [];
  const buf = pool.slice();
  for (let i = 0; i < k; i++) {
    let full = null;
    for (let t = 0; t < 80; t++) {
      for (let j = buf.length - 1; j > 0; j--) { const r = rng.int(j + 1); const x = buf[j]; buf[j] = buf[r]; buf[r] = x; }
      let p = 0;
      const f = [];
      for (let s = 0; s < N; s++) {
        if (s === me) { f[s] = h.hands[me].slice(); continue; }
        f[s] = played[s].slice();
        while (f[s].length < 3) f[s].push(buf[p++]);
      }
      full = f;
      if (ok(f)) break;
    }
    deals.push(full);
    weights.push(weighted ? weightOf(obs, full) : 1);
  }
  return { deals, weights };
}

// Soft opponent model: a sung envido makes high envido likelier, a truco call or acceptance makes strong cards likelier.
const ENV_RANK = (() => {
  const t = new Array(34).fill(0);
  let total = 0;
  for (let a = 0; a < 40; a++) for (let b = a + 1; b < 40; b++) for (let c = b + 1; c < 40; c++) { t[envidoPoints([DECK_40[a], DECK_40[b], DECK_40[c]])]++; total++; }
  const out = []; let acc = 0;
  for (let e = 0; e <= 33; e++) { out[e] = (acc + t[e] / 2) / total; acc += t[e]; }
  return out;
})();
const WIN_RATE = Object.fromEntries(DECK_40.map(c => [c, DECK_40.filter(x => x !== c && POWER[x] < POWER[c]).length / 39]));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function weightOf(obs, full) {
  const myTeam = team(obs.seat);
  let w = 1;
  const acts = obs.actions;
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i], prev = acts[i - 1];
    if (team(a.seat) === myTeam) continue;
    const hand = full[a.seat];
    if (a.type === 'envido' || a.type === 'realEnvido' || a.type === 'faltaEnvido') w *= clamp(2.5 * (ENV_RANK[envidoPoints(hand)] - 0.35), 0.1, 1);
    else if (TRUCO_TYPES.has(a.type) || (a.type === 'quiero' && prev && TRUCO_TYPES.has(prev.type))) {
      const r = hand.map(c => WIN_RATE[c]).sort((x, y) => y - x);
      w *= clamp(1.5 * (r[0] * 0.6 + r[1] * 0.4) - 0.3, 0.1, 1);
    }
  }
  return w;
}

// ---------- open-card minimax over the bazas ----------

// 1 if myTeam wins the bazas from this position with best play by all four (each team for itself), else 0.
function rec(left, R, table, lead, folded, mano, myTeam) {
  let s = -1;
  for (let k = 0; k < N; k++) { const x = (lead + k) % N; if (!folded[x] && table[x] === null) { s = x; break; } }
  if (s === -1) {
    const r = bazaResult(table, lead), R2 = R.concat([r.winner]);
    const hw = handWinner(R2, team(mano));
    if (hw !== null) return hw === myTeam ? 1 : 0;
    let nl = r.winner === -1 ? mano : r.by;
    while (folded[nl]) nl = (nl + 1) % N;
    return rec(left, R2, [null, null, null, null], nl, folded, mano, myTeam);
  }
  const mine = team(s) === myTeam, cards = left[s], seen = new Set();
  let best = mine ? 0 : 1;
  for (let i = 0; i < cards.length; i++) {
    const p = POWER[cards[i]];
    if (seen.has(p)) continue;
    seen.add(p);
    left[s] = cards.slice(0, i).concat(cards.slice(i + 1));
    table[s] = cards[i];
    const v = rec(left, R, table, lead, folded, mano, myTeam);
    left[s] = cards; table[s] = null;
    if (mine && v === 1) return 1;
    if (!mine && v === 0) return 0;
    best = v;
  }
  return best;
}

function pBazas(obs, S, myCard) {
  const h = obs.hand, me = obs.seat, played = playedBy(h);
  const R = h.bazas.filter(b => b.winner !== null).map(b => b.winner);
  const cur = h.bazas[h.bazas.length - 1];
  let w = 0, n = 0;
  for (let i = 0; i < S.deals.length; i++) {
    const full = S.deals[i];
    const left = full.map((x, s) => (h.folded[s] ? [] : x.filter(c => !played[s].includes(c))));
    const table = cur.cards.slice();
    if (myCard) { left[me] = left[me].filter(c => c !== myCard); table[me] = myCard; }
    w += S.weights[i] * rec(left, R, table, cur.lead, h.folded, h.mano, team(me));
    n += S.weights[i];
  }
  return n ? w / n : 0;
}

function pEnvido(obs, S) {
  const h = obs.hand, me = obs.seat;
  let w = 0, n = 0;
  for (let i = 0; i < S.deals.length; i++) {
    const r = singEnvido({ hands: S.deals[i], folded: h.folded, mano: h.mano });
    if (team(r.winner) === team(me)) w += S.weights[i];
    n += S.weights[i];
  }
  return n ? w / n : 0;
}

// ---------- decisions ----------

const envGain = (obs, chain, winnerTeam) => (chain.includes('faltaEnvido') ? faltaValue(obs.rules, obs.score, winnerTeam) : chain.reduce((t, k) => t + (k === 'envido' ? 2 : 3), 0));

function smart(obs, rng, cfg) {
  const L = obs.legal, h = obs.hand, me = obs.seat, my = team(me), opp = 1 - my, target = obs.rules.target;
  const S = sampleDeals(obs, cfg.samples, rng, cfg.weights);
  if (h.envido.pending === me) {
    const p = pEnvido(obs, S), chain = h.envido.chain;
    const rejV = envidoNoQuieroValue(chain), gain = envGain(obs, chain, my), loss = envGain(obs, chain, opp);
    if (p >= 0.93 && has(L, 'faltaEnvido') && obs.score[opp] >= obs.score[my]) return has(L, 'faltaEnvido');
    if (p >= 0.8 && has(L, 'realEnvido')) return has(L, 'realEnvido');
    if (p >= 0.88 && has(L, 'envido')) return has(L, 'envido');
    if (cfg.weights && obs.score[opp] + rejV >= target) return has(L, 'quiero');
    return p * gain - (1 - p) * loss >= -rejV ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  if (has(L, 'envido')) {
    const p = pEnvido(obs, S), behind = obs.score[opp] - obs.score[my];
    if (p >= 0.9 && behind >= target / 3 && has(L, 'faltaEnvido')) return has(L, 'faltaEnvido');
    if (p >= 0.8) return has(L, 'realEnvido');
    if (p >= 0.62) return has(L, 'envido');
    if (cfg.bluff && rng.float() < cfg.bluff / 2) return has(L, 'envido');
  }
  const q = pBazas(obs, S, null);
  if (h.truco.pending) {
    const to = h.truco.pending.to, cur = h.truco.level, raise = to < 4 && has(L, TRUCO_CALLS[to + 1]);
    if (raise && (q >= 0.8 || (cfg.bluff && q >= 0.4 && q < 0.6 && rng.float() < cfg.bluff))) return raise;
    if (cfg.weights && obs.score[opp] + cur >= target) return has(L, 'quiero');
    return q * to - (1 - q) * to >= -cur ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  const call = L.find(a => TRUCO_TYPES.has(a.type));
  if (call && (q >= 0.72 || (cfg.bluff && q >= 0.3 && q < 0.6 && rng.float() < cfg.bluff))) return call;
  let best = null, bp = -1;
  const mine = h.left[me].slice().sort((a, b) => POWER[a] - POWER[b]);
  for (const c of mine) { const p = pBazas(obs, S, c); if (p > bp + 1e-9) { bp = p; best = c; } }
  return { type: 'play', card: best };
}

function easy(obs, rng) {
  const L = obs.legal, h = obs.hand, me = obs.seat, my = h.hands[me];
  const pick = arr => arr[rng.int(arr.length)];
  const e = envidoPoints(my);
  if (h.envido.pending === me) return e >= 27 || rng.float() < 0.25 ? has(L, 'quiero') : has(L, 'noQuiero');
  const top = Math.max(...my.map(c => POWER[c]));
  if (h.truco.pending) {
    if (has(L, 'envido') && e >= 28 && rng.float() < 0.5) return has(L, 'envido');
    return rng.float() < 0.45 + (top >= 11 ? 0.3 : 0) ? has(L, 'quiero') : has(L, 'noQuiero');
  }
  if (has(L, 'envido') && e >= 28 && rng.float() < 0.6) return has(L, 'envido');
  const call = L.find(a => TRUCO_TYPES.has(a.type));
  if (call && rng.float() < 0.06) return call;
  return pick(L.filter(a => a.type === 'play'));
}
