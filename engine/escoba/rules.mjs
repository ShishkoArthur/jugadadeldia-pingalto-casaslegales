// Escoba de 15 rule sets, card values and the scoring of a hand. Every field is required: a missing or unknown value is
// an error, never a silent default (PLAYBOOK §5). Sources and quotes: data/sources/escoba/rules.json (Juegos Bonaerenses
// 2026 "Escoba de 15", Ludoteka).
//
//   scoring   'gba'       one point each: cartas (more cards; a tie scores nothing), oros (six or more of the ten),
//                         setenta (best card of each suit by the scale 7=21, 6=18, as=16, 5=15, 4=14, 3=13, 2=12,
//                         figures 10, only with all four suits; a tie scores nothing), siete de oros, every escoba;
//             'ludoteka'  one point each: escobas, siete de oros, most sevens, most cards, most oros; every side in a tie
//                         for the most scores the point.
//   muestra   'gba'       the four cards turned up at the deal add up to 15: the dealer takes them and scores an escoba;
//                         two fifteens (30) score nothing and the cards stay;
//             'ludoteka'  one or two fifteens: the dealer takes them and scores one or two escobas.
//   capture   'mandatory' a card that can make 15 must take (Juegos Bonaerenses 21.2 penalises leaving it: the engine
//                         does not allow it); 'optional' (Ludoteka without "recogida obligatoria").
// Cards left on the table after the last card go to the last side that took (Ludoteka). Match options (newMatch): players
// 2-4, pairs (4 players in two pairs, Juegos Bonaerenses) and target (Juegos Bonaerenses: 30).
import { DECK_40, parseCard } from '../cards/spanish.mjs';

const KEYS = ['scoring', 'muestra', 'capture'];
export function validateRules(r) {
  if (!r || typeof r !== 'object') throw new Error('escoba: a rule set object is required (see engine/escoba/rules.mjs)');
  for (const k of KEYS) if (!(k in r)) throw new Error('escoba rules: missing "' + k + '"');
  for (const k of Object.keys(r)) if (!KEYS.includes(k) && k !== 'name') throw new Error('escoba rules: unknown key "' + k + '"');
  if (!['gba', 'ludoteka'].includes(r.scoring)) throw new Error('escoba rules: scoring must be "gba" or "ludoteka"');
  if (!['gba', 'ludoteka'].includes(r.muestra)) throw new Error('escoba rules: muestra must be "gba" or "ludoteka"');
  if (!['mandatory', 'optional'].includes(r.capture)) throw new Error('escoba rules: capture must be "mandatory" or "optional"');
  if (r.name !== undefined && (typeof r.name !== 'string' || !/^[a-z0-9-]+$/.test(r.name))) throw new Error('escoba rules: bad name');
  return Object.freeze({ ...r });
}

export const RULESETS = Object.freeze({
  bonaerense: Object.freeze({ name: 'bonaerense', scoring: 'gba', muestra: 'gba', capture: 'mandatory' }),
  ludoteka: Object.freeze({ name: 'ludoteka', scoring: 'ludoteka', muestra: 'ludoteka', capture: 'optional' }),
  'ludoteka-obligatoria': Object.freeze({ name: 'ludoteka-obligatoria', scoring: 'ludoteka', muestra: 'ludoteka', capture: 'mandatory' }),
});

// Sota 8, caballo 9, rey 10, the rest their number.
export const VALUE = Object.freeze(Object.fromEntries(DECK_40.map(c => { const n = parseCard(c).n; return [c, n >= 10 ? n - 2 : n]; })));
// Setenta scale (Juegos Bonaerenses 11.3).
export const SETENTA = Object.freeze({ 7: 21, 6: 18, 1: 16, 5: 15, 4: 14, 3: 13, 2: 12, 10: 10, 11: 10, 12: 10 });

// Setenta of a pile: the best card of each suit by the scale, or null when a suit is missing.
export function setentaOf(cards) {
  const best = { e: 0, b: 0, o: 0, c: 0 };
  for (const c of cards) { const { n, s } = parseCard(c); best[s] = Math.max(best[s], SETENTA[n]); }
  return Object.values(best).every(v => v > 0) ? best.e + best.b + best.o + best.c : null;
}

// Every set of table cards that makes 15 with the played card (the "buscador de escobas").
export function captures(table, card) {
  const need = 15 - VALUE[card], out = [];
  const t = table.slice().sort((a, b) => VALUE[b] - VALUE[a]);
  const rec = (i, left, pick) => {
    if (left === 0) { out.push(pick.slice()); return; }
    for (let j = i; j < t.length; j++) if (VALUE[t[j]] <= left) { pick.push(t[j]); rec(j + 1, left - VALUE[t[j]], pick); pick.pop(); }
  };
  if (need > 0) rec(0, need, []);
  return out;
}

// Points of one hand for each side. piles[side] = cards taken, escobas[side] = count. Returns { points, detail }.
export function scoreHand(r, piles, escobas) {
  const n = piles.length, pts = Array(n).fill(0), detail = [];
  const give = (who, why) => { for (const i of who) { pts[i]++; detail.push({ side: i, why }); } };
  const most = f => { const v = piles.map(f), m = Math.max(...v); return v.map((x, i) => (x === m ? i : -1)).filter(i => i >= 0); };
  escobas.forEach((e, i) => { for (let k = 0; k < e; k++) detail.push({ side: i, why: 'escoba' }); pts[i] += e; });
  give(piles.map((p, i) => (p.includes('7o') ? i : -1)).filter(i => i >= 0), 'sieteDeOros');
  const oros = p => p.filter(c => c.endsWith('o')).length;
  if (r.scoring === 'gba') {
    const c = most(p => p.length);
    if (c.length === 1) give(c, 'cartas');
    give(piles.map((p, i) => (oros(p) >= 6 ? i : -1)).filter(i => i >= 0), 'oros');
    const st = piles.map(setentaOf), m = Math.max(...st.map(x => (x === null ? -1 : x)));
    const w = st.map((x, i) => (x !== null && x === m ? i : -1)).filter(i => i >= 0);
    if (w.length === 1) give(w, 'setenta');
  } else {
    give(most(p => p.filter(c => c.startsWith('7')).length), 'sietes');
    give(most(p => p.length), 'cartas');
    give(most(oros), 'oros');
  }
  return { points: pts, detail };
}
