import { $, $$, out, fmt } from './kit.js';

const box = $('#pa-gs');
if (box) {
  const q = $('#gl-q');
  let cat = '';
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const run = () => {
    const t = norm(q.value.trim());
    let n = 0;
    $$('[data-gs]').forEach(sec => {
      let k = 0;
      $$('[data-c]', sec).forEach(li => {
        const on = (!cat || li.dataset.c === cat) && (!t || li.dataset.q.includes(t));
        li.hidden = !on;
        if (on) k++;
      });
      sec.hidden = k === 0;
      n += k;
    });
    out('gn', fmt(n, 0) + (n === 1 ? ' palabra' : ' palabras'));
    const empty = $('[data-o="g0"]');
    if (empty) empty.hidden = n > 0;
  };
  $$('[data-gc]', box).forEach(b => b.addEventListener('click', () => {
    cat = b.dataset.gc;
    $$('[data-gc]', box).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    run();
  }));
  q.addEventListener('input', run);
  const m = /^#g-/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null;
  if (m) m.classList.add('pa-glh');
}
