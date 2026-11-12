const root = document.documentElement;
root.classList.add('pa-js');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { return null; } return v; },
};
const WIDE = '(min-width: 861px)';
const wide = () => matchMedia(WIDE).matches;
const hoverable = () => wide() && matchMedia('(hover: hover)').matches;
function theme() {
  const btn = document.querySelector('[data-pa-theme]');
  if (!btn) return;
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const sync = () => btn.setAttribute('aria-pressed', dark() ? 'true' : 'false');
  sync();
  btn.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('pa-theme', next);
    sync();
  });
}

let lockers = 0;
const lock = on => { lockers = Math.max(0, lockers + (on ? 1 : -1)); root.classList.toggle('pa-lock', lockers > 0); };

function menu() {
  const nav = document.getElementById('pa-nv');
  if (!nav) return;
  const burger = document.querySelector('[data-pa-menu]');
  const hd = nav.closest('header');
  const dds = [...nav.querySelectorAll('[data-pa-dd]')];
  let t = 0, panel = false;
  const isOpen = d => d.classList.contains('pa-ddo');
  const set = (d, open) => { d.classList.toggle('pa-ddo', open); d.querySelector('button').setAttribute('aria-expanded', open ? 'true' : 'false'); };
  const closeAll = except => dds.forEach(d => { if (d !== except) set(d, false); });
  for (const dd of dds) {
    const btn = dd.querySelector('button');
    btn.addEventListener('click', () => {
      clearTimeout(t);
      const recent = hoverable() && Date.now() - (+dd.dataset.hov || 0) < 700;
      const open = recent ? true : !isOpen(dd);
      if (wide()) closeAll(dd);
      set(dd, open);
    });
    dd.addEventListener('mouseenter', () => { if (!hoverable()) return; clearTimeout(t); if (!isOpen(dd)) dd.dataset.hov = Date.now(); closeAll(dd); set(dd, true); });
    dd.addEventListener('mouseleave', () => { if (!hoverable()) return; clearTimeout(t); t = setTimeout(() => set(dd, false), 300); });
    dd.addEventListener('focusout', e => { if (wide() && !dd.contains(e.relatedTarget)) set(dd, false); });
  }
  const setPanel = open => {
    if (open === panel || !burger) return;
    panel = open;
    if (open) nav.style.setProperty('--pa-hh', Math.round(hd.getBoundingClientRect().bottom) + 'px');
    nav.classList.toggle('pa-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    lock(open);
    if (open) {
      dds.forEach(d => set(d, d.querySelector('button').hasAttribute('data-on')));
      const cur = nav.querySelector('[aria-current="page"]');
      if (cur) cur.scrollIntoView({ block: 'center' });
    }
  };
  if (burger) burger.addEventListener('click', () => setPanel(!panel));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const d = dds.find(isOpen);
    if (wide() && d) { set(d, false); d.querySelector('button').focus(); } else if (panel) { setPanel(false); burger.focus(); }
  });
  document.addEventListener('click', e => { if (wide() && !nav.contains(e.target)) closeAll(); });
  matchMedia(WIDE).addEventListener('change', () => { setPanel(false); closeAll(); });
  const q = nav.querySelector('[data-pa-q]'), qr = nav.querySelector('[data-pa-qr]');
  if (q && qr) {
    let box = null;
    const run = () => { const on = !!q.value.trim(); nav.classList.toggle('pa-qon', on); qr.hidden = !on; if (box) box.run(); };
    q.addEventListener('focus', () => find().then(m => { if (!box) { box = m.searchBox(q, qr, 'pa-nq', () => setPanel(false)); run(); } }));
    q.addEventListener('input', run);
  }
}

// search: the code and the index load on the first use (client/find.js)
let finder = null;
const find = () => (finder = finder || import('./find.js'));
function search() {
  const btn = document.querySelector('[data-pa-find]');
  if (!btn) return;
  const open = () => find().then(m => m.open(btn, lock));
  btn.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    open();
  });
}
theme();
menu();
search();
if (document.querySelector('.pa-tool:not(.pa-oo) > .pa-out .pa-big')) import('./peek.js');

// two columns of different height side by side (a form and its result, a text next to a table): the shorter one rides along while
// the page scrolls, so no tall empty column is left next to the long one (owner 2026-11-11: no empty areas). Only in the last row of
// a grid: a sticky grid item is held by the whole grid, not by its row, and would slide over the rows below
function pin() {
  const boxes = [...document.querySelectorAll('.pa-tool,.pa-two,.pa-gd')];
  if (!boxes.length || !('ResizeObserver' in window)) return;
  const natural = k => { const s = k.style.alignSelf; k.style.alignSelf = 'start'; const v = k.offsetHeight; k.style.alignSelf = s; return v; };
  const fit = () => {
    for (const b of boxes) {
      const rows = new Map();
      for (const k of b.children) if (k.offsetHeight) rows.set(k.offsetTop, [...(rows.get(k.offsetTop) || []), k]);
      const want = new Set();
      const last = Math.max(...rows.keys());
      for (const [top, row] of rows) {
        if (row.length !== 2 || top !== last) continue;
        const [x, y] = row.map(natural), [lo, hi] = x < y ? [row[0], y] : [row[1], x];
        if (hi - Math.min(x, y) > 120 && Math.min(x, y) < innerHeight - 110) want.add(lo);
      }
      for (const k of b.children) if (k.hasAttribute('data-pin') !== want.has(k)) k.toggleAttribute('data-pin', want.has(k));
    }
  };
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 60); };
  const ro = new ResizeObserver(later);
  for (const b of boxes) { ro.observe(b); for (const k of b.children) ro.observe(k); }
  addEventListener('resize', later);
  addEventListener('load', later);
  fit();
}
pin();
