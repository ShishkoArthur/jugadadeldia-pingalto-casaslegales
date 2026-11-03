import { $, $$, page, fmt, oneIn, esc } from './kit.js';

const D = page();
const box = $('[data-volante]');
const out = k => $('[data-o="' + k + '"]');
const two = x => String(x).padStart(2, '0');
let picked = [];

function mods() { return new Set($$('input[name=m]:checked', box).map(i => i.value)); }
function render() {
  $$('[data-n]', box).forEach(b => b.setAttribute('aria-pressed', picked.includes(+b.dataset.n) ? 'true' : 'false'));
  const m = mods();
  const draws = (m.has('tr') ? 2 : 0) + (m.has('re') ? 1 : 0) + (m.has('ss') ? 1 : 0);
  out('draws').textContent = draws;
  $$('[data-m]', out('mods')).forEach(el => el.classList.toggle('on', el.dataset.m === 'ex' ? m.has('tr') && m.has('re') : m.has(el.dataset.m)));
  const parts = [];
  if (m.has('tr')) { const p = D.mods.tr.reduce((s, r) => s + 1 / r[1], 0); parts.push('Tradicional: algún premio ' + oneIn(1 / (1 - (1 - p) ** 2)) + ' (los dos sorteos)'); }
  if (m.has('re')) parts.push('Revancha: los 6, ' + oneIn(D.mods.re[0][1]));
  if (m.has('tr') && m.has('re')) parts.push('Premio Extra: ' + oneIn(D.extra));
  const nums = picked.slice().sort((a, b) => a - b).map(two).join(' · ');
  out('sum').innerHTML = (picked.length === 6 ? 'Tu boleta: <b>' + nums + '</b>. ' : 'Marcados ' + picked.length + ' de 6. ') + esc(parts.join(' · ')) + (parts.length ? '.' : 'Elegí al menos una modalidad.');
}
if (box) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-n]');
    if (b) { const n = +b.dataset.n; picked = picked.includes(n) ? picked.filter(x => x !== n) : picked.length < 6 ? [...picked, n] : picked; render(); return; }
    if (e.target.closest('[data-clear]')) { picked = []; render(); }
    if (e.target.closest('[data-rand]')) {
      const all = $$('[data-n]', box).map(x => +x.dataset.n), buf = new Uint32Array(1), res = [];
      while (res.length < 6) { crypto.getRandomValues(buf); const n = all[buf[0] % all.length]; if (!res.includes(n)) res.push(n); }
      picked = res; render();
    }
  });
  box.addEventListener('change', e => {
    if (e.target.name !== 'm') return;
    const m = mods();
    if (e.target.value === 'ss' && e.target.checked) $$('input[name=m]', box).forEach(i => { if (i.value !== 'ss') i.checked = true; });
    if ((e.target.value === 'tr' || e.target.value === 're') && !e.target.checked && m.has('ss')) $('input[name=m][value=ss]', box).checked = false;
    render();
  });
  render();
}
