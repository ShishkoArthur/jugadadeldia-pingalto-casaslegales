import { $, $$, data, out, params, setParams, fmt, esc } from './kit.js';

const D = data();
const list = $('#ch-list');
if (D && list) {
  const byId = new Map(D.c.map(c => [c[0], c]));
  const cards = $$('.pa-chc', list);
  const q = $('#ch-q'), sort = $('#ch-s');
  const btns = $$('[data-role]').filter(b => b.tagName === 'BUTTON');
  let role = '';
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const key = (c, k) => k === 'name' ? 0 : k[0] === 'r' ? -c[5][Number(k.slice(1))] : -c[3][Number(k)];
  const apply = () => {
    const t = norm(q.value), k = sort.value;
    let n = 0;
    for (const el of cards) { const ok = (!role || el.dataset.roles.split('|').includes(role)) && (!t || norm(el.querySelector('h3').textContent).includes(t)); el.classList.toggle('pa-hide', !ok); if (ok) n++; }
    const sorted = [...cards].sort((a, b) => { const A = byId.get(a.dataset.id), B = byId.get(b.dataset.id); return key(A, k) - key(B, k) || A[1].localeCompare(B[1], 'es'); });
    sorted.forEach(el => list.appendChild(el));
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    out('n', fmt(n, 0) + (n === 1 ? ' campeón' : ' campeones'));
  };
  btns.forEach(b => b.addEventListener('click', () => { role = b.dataset.role; apply(); }));
  q.addEventListener('input', apply);
  sort.addEventListener('change', apply);
  const A = $('#ch-a'), B = $('#ch-b');
  const cmp = (push = true) => {
    const a = byId.get(A.value), b = byId.get(B.value);
    if (!a || !b) return;
    const row = (l, x, y) => '<tr><td>' + l + '</td><td class="pa-n">' + x + '</td><td class="pa-n">' + y + '</td></tr>';
    const im = c => { const el = cards.find(e => e.dataset.id === c[0]), i = el && el.querySelector('img'); return i ? '<img src="' + esc(i.getAttribute('src')) + '" alt="' + esc(c[1]) + '">' : ''; };
    out('cmp', '<table class="pa-tb"><thead><tr><th></th><th class="pa-n">' + im(a) + esc(a[1]) + '</th><th class="pa-n">' + im(b) + esc(b[1]) + '</th></tr></thead><tbody>' +
      D.info.map((l, i) => row(l + ' (de 1 a 10)', fmt(a[3][i], 0), fmt(b[3][i], 0))).join('') + row('Tipo de recurso', esc(a[4] || '-'), esc(b[4] || '-')) +
      D.stats.map((l, i) => row(esc(l), fmt(a[5][i], 3), fmt(b[5][i], 3))).join('') + '</tbody></table>');
    if (push) setParams({ a: A.value, b: B.value });
  };
  const p = params();
  for (const [el, k] of [[A, 'a'], [B, 'b']]) if (p.get(k) && byId.has(p.get(k))) el.value = p.get(k);
  A.addEventListener('change', () => cmp());
  B.addEventListener('change', () => cmp());
  cmp(false);
}
