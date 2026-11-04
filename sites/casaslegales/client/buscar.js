// Search of casaslegales.com (loaded by ui.js on the first use): the index of the page language (data-rl-idx on the search button,
// written by tools/lib/search.mjs), results as you type with engine/search.mjs, in a dialog or in the menu panel. On help pages
// (body[data-calma]) only help and site pages are shown, never an operator, a province or a betting guide.
import { prepare, query, marks } from '../../../engine/search.mjs';

let idx = null, loading = null;
const helpPage = () => document.body.hasAttribute('data-calma');
function load() {
  if (idx) return Promise.resolve(idx);
  const b = document.querySelector('[data-rl-find]');
  if (!loading) loading = fetch(b ? b.dataset.rlIdx : '').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => (idx = prepare(j))).catch(() => { loading = null; return null; });
  return loading;
}
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const hl = (tag, text, hits) => { const x = el(tag); for (const [s, m] of marks(text, hits)) x.append(m ? el('mark', '', s) : document.createTextNode(s)); return x; };

export function searchBox(input, box, id, onGo) {
  let items = [], act = -1, seq = 0;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', id);
  input.setAttribute('aria-expanded', 'false');
  const pick = i => {
    act = i;
    items.forEach((li, j) => li.setAttribute('aria-selected', j === i ? 'true' : 'false'));
    if (i >= 0) { input.setAttribute('aria-activedescendant', items[i].id); items[i].scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  };
  const say = t => { box.replaceChildren(el('p', 'rl-xn', t)); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); };
  async function run() {
    const q = input.value.trim(), my = ++seq;
    if (!q) { box.replaceChildren(); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); return; }
    if (!idx) { say('Cargando el buscador…'); await load(); if (my !== seq) return; }
    if (!idx) { say('El buscador no cargó. Probá de nuevo en un rato.'); return; }
    const res = query(idx, q, { limit: 12, allow: helpPage() ? e => e.x : null });
    if (!res.length) { say('Sin resultados para «' + q + '». Probá con el nombre del operador o de la provincia.'); return; }
    const ul = el('ul', 'rl-xl');
    ul.id = id;
    ul.setAttribute('role', 'listbox');
    items = res.map((r, i) => {
      const li = el('li');
      li.id = id + '-' + i;
      li.setAttribute('role', 'option');
      const a = el('a');
      a.href = r.u + (r.sec ? '#' + r.sec.a : '');
      a.tabIndex = -1;
      a.append(hl('small', decodeURI(r.u) + (r.sec ? ' · ' + r.sec.h : ''), r.hits));
      a.append(hl('b', r.t, r.hits));
      const snip = r.sec && r.sec.x ? r.sec.x : r.d;
      if (snip) a.append(hl('span', snip, r.hits));
      a.addEventListener('click', () => { if (a.pathname === location.pathname && onGo) onGo(); });
      li.append(a);
      return li;
    });
    ul.append(...items);
    box.replaceChildren(ul);
    input.setAttribute('aria-expanded', 'true');
    pick(0);
  }
  input.addEventListener('input', run);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); pick((act + 1) % items.length); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); pick((act - 1 + items.length) % items.length); }
    else if (e.key === 'Enter' && items.length) { e.preventDefault(); items[Math.max(0, act)].querySelector('a').click(); }
  });
  return { run };
}

let ov = null, input = null, back = null, unlock = null;
function close() { if (!ov || ov.hidden) return; ov.hidden = true; unlock(false); if (back) back.focus(); }
export function open(btn, lock) {
  back = btn; unlock = lock;
  if (!ov) {
    ov = el('div', 'rl-xo');
    ov.hidden = true;
    ov.innerHTML = '<div class="rl-xk" role="dialog" aria-modal="true" aria-label="Buscar en casaslegales"><div class="rl-xq"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><input type="search" placeholder="' + (helpPage() ? 'Buscá ayuda en tu provincia' : 'Operador, provincia, licencia o cálculo') + '" aria-label="Buscar en casaslegales" autocomplete="off" enterkeyhint="go"><button type="button" class="rl-xx">Cerrar</button></div><div class="rl-xr"></div><p class="rl-xh">↑ ↓ para elegir · Enter para abrir · Esc para cerrar</p></div>';
    document.body.append(ov);
    input = ov.querySelector('input');
    searchBox(input, ov.querySelector('.rl-xr'), 'rl-sq', close);
    ov.querySelector('.rl-xx').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') { const f = [input, ov.querySelector('.rl-xx')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
    });
    window.addEventListener('pagehide', () => { if (!ov.hidden) { ov.hidden = true; unlock(false); } });
  }
  if (!ov.hidden) { input.focus(); return; }
  ov.hidden = false;
  lock(true);
  input.focus();
  input.select();
  load();
}
