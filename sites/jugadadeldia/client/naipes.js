import { pips } from './cards.js';

for (const c of document.querySelectorAll('.jg-cd[data-s]')) {
  const one = c.querySelector('svg:not(.pn)'), n = parseInt((c.querySelector('small') || {}).textContent, 10);
  if (!one || c.querySelector('.pn') || !(n >= 1 && n <= 12)) continue;
  one.classList.add('p1');
  const w = document.createElement('i');
  w.innerHTML = pips(n, c.dataset.s);
  one.before(w.firstChild);
}
