// Generala rule sets. Every field is required: a missing or unknown value is an error, never a silent default (PLAYBOOK §5).
// Sources and quotes: data/sources/generala/rules.json. The hands (generala, poker, full, escalera) come from
// engine/lottery/dice.mjs handOf(), so the straights are one of its house rules.
//
//   straights       'escalera-12345-23456' (Ruibal: 1-2-3-4-5 or 2-3-4-5-6) or 'escalera-con-as-arriba' (also 3-4-5-6-1,
//                   Wikipedia).
//   escalera, full, poker, generala   points of each major hand made in two or three throws (Ruibal 20/30/40/60;
//                   Wikipedia 20/30/40 and 60 "o 50 puntos, segun la variante").
//   servidaBonus    points added to escalera, full and poker made on the first throw (5 in both sources).
//   generalaServida what five equal dice on the first throw do: 'wins-game' (both sources: the player wins at once, even
//                   when his generala box is already used).
//   doble           null (ten boxes, Ruibal) or the points of a second generala box ("doble generala", eleven boxes in
//                   Wikipedia, which gives no value for it: the players choose the number). It needs a generala already
//                   scored with points.
export const STRAIGHTS = Object.freeze(['escalera-12345-23456', 'escalera-con-as-arriba']);
const KEYS = ['straights', 'escalera', 'full', 'poker', 'generala', 'servidaBonus', 'generalaServida', 'doble'];
const posInt = v => Number.isInteger(v) && v > 0 && v <= 1000;

export function validateRules(r) {
  if (!r || typeof r !== 'object') throw new Error('generala: a rule set object is required (see engine/generala/rules.mjs)');
  for (const k of KEYS) if (!(k in r)) throw new Error('generala rules: missing "' + k + '"');
  for (const k of Object.keys(r)) if (!KEYS.includes(k) && k !== 'name') throw new Error('generala rules: unknown key "' + k + '"');
  if (!STRAIGHTS.includes(r.straights)) throw new Error('generala rules: straights must be one of ' + STRAIGHTS.join(', '));
  for (const k of ['escalera', 'full', 'poker', 'generala']) if (!posInt(r[k])) throw new Error('generala rules: ' + k + ' must be a positive whole number');
  if (!Number.isInteger(r.servidaBonus) || r.servidaBonus < 0 || r.servidaBonus > 100) throw new Error('generala rules: servidaBonus must be a whole number 0-100');
  if (r.generalaServida !== 'wins-game') throw new Error('generala rules: generalaServida must be "wins-game"');
  if (r.doble !== null && !posInt(r.doble)) throw new Error('generala rules: doble must be null or a positive whole number');
  if (r.name !== undefined && (typeof r.name !== 'string' || !/^[a-z0-9-]+$/.test(r.name))) throw new Error('generala rules: bad name');
  return Object.freeze({ ...r });
}

export const RULESETS = Object.freeze({
  ruibal: Object.freeze({ name: 'ruibal', straights: 'escalera-12345-23456', escalera: 20, full: 30, poker: 40, generala: 60, servidaBonus: 5, generalaServida: 'wins-game', doble: null }),
  'wikipedia-60': Object.freeze({ name: 'wikipedia-60', straights: 'escalera-con-as-arriba', escalera: 20, full: 30, poker: 40, generala: 60, servidaBonus: 5, generalaServida: 'wins-game', doble: null }),
  'wikipedia-50': Object.freeze({ name: 'wikipedia-50', straights: 'escalera-con-as-arriba', escalera: 20, full: 30, poker: 40, generala: 50, servidaBonus: 5, generalaServida: 'wins-game', doble: null }),
});

export const NUMBER_BOXES = Object.freeze(['1', '2', '3', '4', '5', '6']);
export const MAJOR_BOXES = Object.freeze(['escalera', 'full', 'poker', 'generala']);
export const boxesOf = r => (r.doble === null ? [...NUMBER_BOXES, ...MAJOR_BOXES] : [...NUMBER_BOXES, ...MAJOR_BOXES, 'doble']);
