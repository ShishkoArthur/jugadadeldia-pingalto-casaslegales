import { $, $$, out, fmt, params, setParams, data, esc } from './kit.js';
import { feed, newer, isEn, fdate, dayOf, swap, swapAll, num } from './live.js';

const list = $('#ag-list');
if (list) {
  let cards = $$('.pa-ag', list);
  const q = $('#ag-q'), btns = $$('[data-role]').filter(b => b.tagName === 'BUTTON');
  let role = '';
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const apply = () => {
    const t = norm(q.value);
    let n = 0;
    for (const c of cards) { const ok = (!role || c.dataset.role === role) && (!t || norm(c.dataset.name).includes(t)); c.classList.toggle('pa-hide', !ok); if (ok) n++; }
    if (t && n <= 3) for (const c of cards) { const d = c.querySelector('details'); if (d && !c.classList.contains('pa-hide')) d.open = true; }
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
  const sel = () => { for (const [el, k] of [[a, 'a'], [b, 'b']]) if (p.get(k) && [...el.options].some(o => o.value === p.get(k))) el.value = p.get(k); };
  sel();
  a.addEventListener('change', () => cmp());
  b.addEventListener('change', () => cmp());
  cmp(false);
  apply();

  const D = data();
  const SLOT = { Ultimate: 'Definitiva', Passive: 'Pasiva' };
  const rich = t => esc(t).replace(/&lt;(whitebold|teal|debuffred)&gt;([\s\S]*?)&lt;\/&gt;/g, (m, k, x) => '<b class="pa-k' + k[0] + '">' + x + '</b>').replace(/&lt;\/?[a-z]*&gt;/g, '');
  const NEW = ' <span class="pa-tag pa-cm">el más nuevo</span>';
  feed(list, 'riot-val').then(doc => {
    if (!D || !doc || !Array.isArray(doc.data.agents) || !newer(doc.data.v, D.v)) return;
    const V = doc.data, L = isEn() ? 'en' : 'es';
    const roles = new Map(V.roles.map(r => [r.id, r[L]]));
    const fresh = V.agents.filter(x => !cards.some(c => c.id === x.id));
    const newest = V.agents[0] && V.agents[0].released ? V.agents[0].id : null;
    if (fresh.length) {
      const html = fresh.map(x => {
        const s = x[L], bg = x.colors.length ? 'background:linear-gradient(135deg,' + x.colors.join(',') + ')' : '';
        return '<article class="pa-c pa-ag" id="' + esc(x.id) + '" data-role="' + esc(x.roleId) + '" data-name="' + esc(s.name.toLowerCase()) + '"><header><i style="' + bg + '" aria-hidden="true">' + esc([...s.name][0]) + '</i><div><h3>' + esc(s.name) + '</h3><p class="pa-x">' + esc((roles.get(x.roleId) || [''])[0]) + (x.released ? ' · llegó el ' + fdate(x.released) : '') + '</p></div></header>' +
          '<p>' + rich(s.desc) + '</p><details class="pa-abd"><summary><b>' + s.ab.length + ' habilidades</b> <span>' + s.ab.map(y => esc(y[1])).join(' · ') + '</span></summary><ul class="pa-ab">' + s.ab.map(y => '<li><b>' + esc(y[1]) + (SLOT[y[0]] ? ' <span class="pa-tag">' + SLOT[y[0]] + '</span>' : '') + '</b><span>' + rich(y[2]) + '</span></li>').join('') + '</ul></details></article>';
      }).join('');
      list.insertAdjacentHTML('afterbegin', html);
      for (const x of fresh.slice().reverse()) for (const s of [a, b]) { const o = document.createElement('option'); o.value = x.id; o.textContent = x[L].name; s.insertBefore(o, s.firstChild); }
      cards = $$('.pa-ag', list);
    }
    if (newest && fresh.some(x => x.id === newest)) {
      for (const t of $$('h3 .pa-tag', list)) t.remove();
      const h = $('#' + CSS.escape(newest) + ' h3');
      if (h) h.insertAdjacentHTML('beforeend', NEW);
    }
    const count = id => V.agents.filter(x => x.roleId === id).length;
    for (const el of [...btns.filter(x => x.dataset.role), ...$$('[data-rr]')]) {
      const id = el.dataset.role || el.dataset.rr;
      if (roles.has(id)) el.textContent = el.textContent.replace(/\d+$/, num(count(id)));
    }
    const pairs = [[D.v, V.v], [fdate(D.b), fdate(V.build)], [fdate(D.d), fdate(dayOf(doc))], [fdate(D.vd), fdate(dayOf(doc))], [num(D.n), num(V.agents.length)]];
    swapAll('[data-rl]', pairs);
    swap($('.pa-ey'), pairs);
    swap(btns.find(x => !x.dataset.role), pairs);
    sel();
    apply();
    cmp(false);
  });
}
