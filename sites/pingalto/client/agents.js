import { $, $$, out, fmt, params, setParams } from './kit.js';

const list = $('#ag-list');
if (list) {
  const cards = $$('.pa-ag', list);
  const q = $('#ag-q'), btns = $$('[data-role]').filter(b => b.tagName === 'BUTTON');
  let role = '';
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const apply = () => {
    const t = norm(q.value);
    let n = 0;
    for (const c of cards) { const ok = (!role || c.dataset.role === role) && (!t || norm(c.dataset.name).includes(t)); c.classList.toggle('pa-hide', !ok); if (ok) n++; }
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    out('n', fmt(n, 0) + (n === 1 ? ' agente' : ' agentes'));
  };
  btns.forEach(b => b.addEventListener('click', () => { role = b.dataset.role; apply(); }));
  q.addEventListener('input', apply);
  const a = $('#ag-a'), b = $('#ag-b');
  const cmp = (push = true) => {
    const pick = id => { const c = $('#' + CSS.escape(id)); return c ? '<div class="pa-ag">' + c.innerHTML + '</div>' : ''; };
    out('cmp', pick(a.value) + pick(b.value));
    if (push) setParams({ a: a.value, b: b.value });
  };
  const p = params();
  for (const [el, k] of [[a, 'a'], [b, 'b']]) if (p.get(k) && [...el.options].some(o => o.value === p.get(k))) el.value = p.get(k);
  a.addEventListener('change', () => cmp());
  b.addEventListener('change', () => cmp());
  cmp(false);
  apply();
}
