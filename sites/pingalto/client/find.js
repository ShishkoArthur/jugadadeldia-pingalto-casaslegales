// Site search of pingalto (loaded by pa.js on the first use): the index of the page language (data-pa-idx on the search button,
// written by tools/lib/search.mjs), results as you type with engine/search.mjs, a dialog on wide screens and in the phone menu.
import { prepare, query, marks } from '../../../engine/search.mjs';

let idx = null, loading = null;
const idxUrl = () => { const b = document.querySelector('[data-pa-find]'); return b ? b.dataset.paIdx : null; };
function load() {
  if (idx) return Promise.resolve(idx);
  if (!loading) loading = fetch(idxUrl()).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => (idx = prepare(j))).catch(() => { loading = null; return null; });
  return loading;
}
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const marked = (tag, text, hits) => { const x = el(tag); for (const [s, m] of marks(text, hits)) x.append(m ? el('mark', '', s) : document.createTextNode(s)); return x; };

// one search field and its result list: results as you type, arrows to move, Enter to open, a click on a link of this page closes
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
  const say = t => { box.replaceChildren(el('p', 'pa-zn', t)); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); };
  async function run() {
    const q = input.value.trim(), my = ++seq;
    if (!q) { box.replaceChildren(); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); return; }
    if (!idx) { say('Cargando el buscador…'); await load(); if (my !== seq) return; }
    if (!idx) { say('No pudimos cargar el buscador. Probá de nuevo en un rato.'); return; }
    const res = query(idx, q, { limit: 12 });
    if (!res.length) { say('Nada con «' + q + '». Probá con otra palabra o abrí el menú.'); return; }
    const ul = el('ul', 'pa-zl');
    ul.id = id;
    ul.setAttribute('role', 'listbox');
    items = res.map((r, i) => {
      const li = el('li');
      li.id = id + '-' + i;
      li.setAttribute('role', 'option');
      const a = el('a');
      a.href = r.u + (r.sec ? '#' + r.sec.a : '');
      a.tabIndex = -1;
      a.append(marked('b', r.t, r.hits));
      if (r.sec) a.append(marked('small', r.sec.h, r.hits));
      const snip = r.sec && r.sec.x ? r.sec.x : r.d;
      if (snip) a.append(marked('span', snip, r.hits));
      a.addEventListener('click', () => { if (a.pathname === location.pathname && onGo) onGo(); });
      li.append(a);
      return li;
    });
    ul.append(...items);
    box.replaceChildren(ul);
    input.setAttribute('aria-expanded', 'true');
    pick(0);
  }
  input.addEventListener('focus', () => { load(); });
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
    ov = el('div', 'pa-zo');
    ov.hidden = true;
    ov.innerHTML = '<div class="pa-zk" role="dialog" aria-modal="true" aria-label="Buscar en pingalto"><div class="pa-zq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg><input type="search" placeholder="Buscá un juego, una herramienta o un tema" aria-label="Buscar en pingalto" autocomplete="off" enterkeyhint="go"><button type="button" class="pa-zx">Cerrar</button></div><div class="pa-zr"></div><p class="pa-zh"><kbd>↑</kbd> <kbd>↓</kbd> para moverte, <kbd>Enter</kbd> para abrir, <kbd>Esc</kbd> para cerrar</p></div>';
    document.body.append(ov);
    input = ov.querySelector('input');
    searchBox(input, ov.querySelector('.pa-zr'), 'pa-zq', close);
    ov.querySelector('.pa-zx').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') { const f = [input, ov.querySelector('.pa-zx')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
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
