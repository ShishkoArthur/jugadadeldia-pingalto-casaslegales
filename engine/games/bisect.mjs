// Step-by-step slider calibration (pingalto /ff/sensibilidad): the player tries a value in the game and answers "fast"
// (overshot the target), "slow" (fell short) or "ok". Each answer halves the interval that can still hold the right value,
// so any slider of 0..max is found in about log2(max) tries. Integers only (game sliders move in whole steps). Pure.
const int = (name, v) => { if (!Number.isInteger(v)) throw new Error('bisect: ' + name + ' must be an integer, got ' + v); return v; };

export function start({ value, lo, hi }) {
  int('value', value); int('lo', lo); int('hi', hi);
  if (!(lo <= value && value <= hi && lo < hi)) throw new Error('bisect: need lo <= value <= hi and lo < hi');
  return { lo, hi, value, done: false, tries: [] };
}
export function answer(s, a) {
  if (s.done) return s;
  const tries = [...s.tries, { value: s.value, a }];
  if (a === 'ok') return { ...s, tries, done: true };
  let { lo, hi } = s;
  if (a === 'fast') hi = s.value - 1;
  else if (a === 'slow') lo = s.value + 1;
  else throw new Error('bisect: answer must be fast, slow or ok');
  if (lo > hi) return { lo: s.value, hi: s.value, value: s.value, done: true, tries };
  const value = Math.round((lo + hi) / 2);
  return { lo, hi, value, done: lo === hi, tries };
}
// Upper bound of tries left: the interval is halved each time.
export function triesLeft(s) {
  return s.done ? 0 : Math.ceil(Math.log2(s.hi - s.lo + 1));
}
