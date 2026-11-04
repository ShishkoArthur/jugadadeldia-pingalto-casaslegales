// Search of jugadadeldia.com (loaded by jg.js on the first use): the index of the page language (data-jg-idx on the search button,
// written by tools/lib/search.mjs), results as you type with engine/search.mjs, in a dialog or in the phone menu. On help pages
// (body[data-jg-ayuda]) only help and site pages are shown, never a game or a draw.
import { prepare, query, marks } from '../../../engine/search.mjs';

let idx = null, loading = null;
const helpPage = () => document.body.hasAttribute('data-jg-ayuda');
function load() {
  if (idx) return Promise.resolve(idx);
  const b = document.querySelector('[data-jg-find]');
  if (!loading) loading = fetch(b ? b.dataset.jgIdx : '').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => (idx = prepare(j))).catch(() => { loading = null; return null; });
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
  const say = t => { box.replaceChildren(el('p', 'jg-bn', t)); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); };
  async function run() {
    const q = input.value.trim(), my = ++seq;
    if (!q) { box.replaceChildren(); items = []; act = -1; input.setAttribute('aria-expanded', 'false'); return; }
    if (!idx) { say('Cargando el buscador…'); await load(); if (my !== seq) return; }
    if (!idx) { say('No se pudo cargar el buscador. Probá de nuevo en un rato.'); return; }
    const res = query(idx, q, { limit: 12, allow: helpPage() ? e => e.x : null });
    if (!res.length) { say('No encontramos «' + q + '». Probá con otra palabra.'); return; }
    const ul = el('ul', 'jg-bl');
    ul.id = id;
    ul.setAttribute('role', 'listbox');
    items = res.map((r, i) => {
      const li = el('li');
      li.id = id + '-' + i;
      li.setAttribute('role', 'option');
      const a = el('a');
      a.href = r.u + (r.sec ? '#' + r.sec.a : '');
      a.tabIndex = -1;
      if (r.sec) a.append(hl('small', r.sec.h, r.hits));
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
    ov = el('div', 'jg-bo');
    ov.hidden = true;
    ov.innerHTML = '<div class="jg-bk" role="dialog" aria-modal="true" aria-label="Buscar en Jugada del Día"><div class="jg-bq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg><input type="search" placeholder="' + (helpPage() ? 'Buscá ayuda en tu provincia' : 'Quiniela de tu provincia, truco, Quini 6…') + '" aria-label="Buscar en Jugada del Día" autocomplete="off" enterkeyhint="go"><button type="button" class="jg-bx">Cerrar</button></div><div class="jg-br"></div><p class="jg-bh"><kbd>↑</kbd> <kbd>↓</kbd> elegís, <kbd>Enter</kbd> abrís, <kbd>Esc</kbd> cerrás</p></div>';
    document.body.append(ov);
    input = ov.querySelector('input');
    searchBox(input, ov.querySelector('.jg-br'), 'jg-sq', close);
    ov.querySelector('.jg-bx').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') { const f = [input, ov.querySelector('.jg-bx')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
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
