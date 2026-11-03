const SUIT = { e: 'espadas', b: 'bastos', o: 'oros', c: 'copas' };
const NUM = { 1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'sota', 11: 'caballo', 12: 'rey' };
export const cardName = c => (/^J/.test(c) ? 'comodín' : NUM[parseInt(c, 10)] + ' de ' + SUIT[c.slice(-1)]);
const FACE = { 10: 'S', 11: 'C', 12: 'R' };

export function cardHtml(c, { tag = 'span', attrs = '', cls = '' } = {}) {
  if (/^J/.test(c)) return '<' + tag + ' class="jg-cd jk ' + cls + '" ' + attrs + ' aria-label="comodín"><b>J</b><small>comodín</small></' + tag + '>';
  const n = parseInt(c, 10), s = c.slice(-1);
  return '<' + tag + ' class="jg-cd ' + cls + '" data-s="' + s + '" ' + attrs + ' aria-label="' + cardName(c) + '"><b>' + (FACE[n] || n) + '</b><svg aria-hidden="true"><use href="#p-' + s + '"/></svg><small>' + n + '</small></' + tag + '>';
}
export const backHtml = (cls = '') => '<span class="jg-cd back ' + cls + '" aria-hidden="true"></span>';

export function palitos(points, cap) {
  const full = Math.floor(points / 5), rest = points % 5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="jg-pz f5"></i>';
  if (rest) html += '<i class="jg-pz f' + rest + '"></i>';
  const empty = Math.max(0, Math.ceil(cap / 5) - full - (rest ? 1 : 0));
  for (let i = 0; i < empty; i++) html += '<i class="jg-pz f0"></i>';
  return html;
}
export function scoreBlock(points, target) {
  const half = target > 15 ? target / 2 : null;
  if (!half) return '<div class="jg-pzs"><div class="jg-pzr">' + palitos(Math.min(points, target), target) + '</div></div>';
  const malas = Math.min(points, half), buenas = Math.max(0, Math.min(points - half, half));
  return '<div class="jg-pzs"><small>malas</small><div class="jg-pzr">' + palitos(malas, half) + '</div><small>buenas</small><div class="jg-pzr">' + palitos(buenas, half) + '</div></div>';
}
