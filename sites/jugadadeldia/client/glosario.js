import { $, $$ } from './kit.js';
const box = $('[data-glosario]');
let g = '';
function filter() {
  const q = $('[data-q]', box).value.trim().toLowerCase();
  let n = 0;
  $$('.jg-gl li', box).forEach(li => { const ok = (!q || li.dataset.t.includes(q)) && (!g || $('small', li).textContent === g); li.hidden = !ok; if (ok) n++; });
  $('[data-o="none"]', box).hidden = n > 0;
}
if (box) {
  $('[data-q]', box).addEventListener('input', filter);
  box.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; g = b.dataset.g; $$('[data-g]', box).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); filter(); });
}
