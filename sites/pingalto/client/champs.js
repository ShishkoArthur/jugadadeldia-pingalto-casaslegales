import { $, $$, data, out, params, setParams, fmt, esc } from './kit.js';
import { feed, newer, isEn, fdate, dayOf, swap, swapAll, num } from './live.js';
import { LOL_ROLES } from '../../../engine/games/riot.mjs';

const D = data();
const list = $('#ch-list');
if (D && list) {
  let byId = new Map(D.c.map(c => [c[0], c]));
  const cards = $$('.pa-chc', list);
  const q = $('#ch-q'), sort = $('#ch-s');
  const btns = $$('[data-role]').filter(b => b.tagName === 'BUTTON');
  let role = '';
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const key = (c, k) => k === 'name' ? 0 : k[0] === 'r' ? -c[4][Number(k.slice(1))] : -c[2][Number(k)];
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
      D.info.map((l, i) => row(l + ' (de 1 a 10)', fmt(a[2][i], 0), fmt(b[2][i], 0))).join('') + row('Tipo de recurso', esc(a[3] || '-'), esc(b[3] || '-')) +
      D.stats.map((l, i) => row(esc(l), fmt(a[4][i], 3), fmt(b[4][i], 3))).join('') + '</tbody></table>');
    if (push) setParams({ a: A.value, b: B.value });
  };
  const p = params();
  const pick = () => { for (const [el, k] of [[A, 'a'], [B, 'b']]) if (p.get(k) && byId.has(p.get(k))) el.value = p.get(k); };
  pick();
  A.addEventListener('change', () => cmp());
  B.addEventListener('change', () => cmp());
  cmp(false);

  const bar = (l, v, max, txt) => '<li><span>' + esc(l) + '</span><i style="--v:' + Math.round((v / max) * 100) + '"></i><b>' + txt + '</b></li>';
  feed(list, 'riot-lol').then(doc => {
    if (!doc || !Array.isArray(doc.data.c) || !newer(doc.data.v, D.v)) return;
    const L = doc.data, en = isEn(), oldN = D.c.length;
    const rows = L.c.map(c => ({ id: c[0], name: en ? c[7] : c[1], title: en ? c[8] : c[2], tags: c[3], info: c[4], res: en ? c[9] : c[5], s: c[6] }));
    const label = t => D.roles[LOL_ROLES.indexOf(t)] || t;
    for (const r of rows) {
      let el = cards.find(e => e.dataset.id === r.id);
      if (!el) {
        el = document.createElement('article');
        el.className = 'pa-chc';
        el.dataset.id = r.id;
        el.dataset.roles = r.tags.map(t => L.roles[t] || t).join('|');
        el.innerHTML = '<h3>' + esc(r.name) + '</h3><p class="pa-x">' + esc(r.title) + '</p><p><b>' + esc(r.tags.map(label).join(' · ')) + '</b></p><p class="pa-chi"></p>';
        list.appendChild(el);
        cards.push(el);
        for (const s of [A, B]) { const o = document.createElement('option'); o.value = r.id; o.textContent = r.name; s.appendChild(o); }
      }
      el.querySelector('.pa-chi').textContent = D.info.map((l, i) => l + ' ' + r.info[i]).join(' · ');
    }
    D.c = rows.map(r => [r.id, r.name, r.info, r.res, r.s]);
    byId = new Map(D.c.map(c => [c[0], c]));
    for (const s of [A, B]) [...s.options].sort((x, y) => x.textContent.localeCompare(y.textContent, 'es')).forEach(o => s.appendChild(o));
    const tags = LOL_ROLES;
    const count = tags.map(t => rows.filter(r => r.tags.includes(t)).length), max = Math.max(...count, 1);
    out('bars', tags.map((t, i) => bar(label(t), count[i], max, fmt(count[i], 0))).join(''));
    out('avg', D.info.map((l, i) => { const v = rows.reduce((t, r) => t + r.info[i], 0) / rows.length; return bar(l, v, 10, fmt(v, 1)); }).join(''));
    const pairs = [[D.v, L.v], [num(oldN), num(rows.length)], [fdate(D.d), fdate(dayOf(doc))]];
    swapAll('[data-rl]', pairs);
    swap($('.pa-ey'), pairs);
    swap(btns.find(b => !b.dataset.role), pairs);
    D.v = L.v;
    pick();
    apply();
    cmp(false);
  });
}
