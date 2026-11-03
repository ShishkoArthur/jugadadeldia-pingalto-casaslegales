import { $, page, parseNum, pesos } from './kit.js';
const D = page();
const box = $('[data-dev]');
function calc() {
  const f = new FormData($('form', box));
  const g = D.g[+f.get('g')], a = parseNum(f.get('a'));
  const out = $('[data-o="loss"]', box);
  out.textContent = a > 0 ? pesos(a * 52 * (100 - g.v) / 100) : '-';
}
if (box) { box.addEventListener('input', calc); box.addEventListener('change', calc); calc(); }
