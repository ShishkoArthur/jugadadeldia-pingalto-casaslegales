import { $, store, json } from './kit.js';
import './precios.js';
const root = document.documentElement;

function theme() {
  const btn = $('[data-jg-tema]');
  if (!btn) return;
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const sync = () => btn.setAttribute('aria-pressed', dark() ? 'true' : 'false');
  sync();
  btn.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('jg-tema', next);
    sync();
  });
}

const WIDE = '(min-width: 1001px)';
const wide = () => matchMedia(WIDE).matches;
const hoverable = () => wide() && matchMedia('(hover: hover)').matches;
let locks = 0;
const lock = on => { locks = Math.max(0, locks + (on ? 1 : -1)); root.classList.toggle('jg-lock', locks > 0); };

// the whole menu: a panel per section on wide screens (hover with a 300 ms close delay, or click; Esc closes), an accordion in
// the burger panel on phones (scroll inside the panel, the page locked on html only)
function menu() {
  const nav = $('#jg-nav');
  if (!nav) return;
  const btn = $('[data-jg-menu]');
  const head = nav.closest('header');
  const dds = [...nav.querySelectorAll('[data-jg-dd]')];
  let t = 0, panel = false;
  const isOpen = d => d.classList.contains('jg-ddo');
  const set = (d, open) => { d.classList.toggle('jg-ddo', open); d.firstElementChild.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  const closeAll = keep => dds.forEach(d => { if (d !== keep) set(d, false); });
  for (const d of dds) {
    const b = d.firstElementChild;
    b.addEventListener('click', () => {
      clearTimeout(t);
      const open = hoverable() && Date.now() - (+d.dataset.hov || 0) < 700 ? true : !isOpen(d);
      if (wide()) closeAll(d);
      set(d, open);
    });
    d.addEventListener('mouseenter', () => { if (!hoverable()) return; clearTimeout(t); if (!isOpen(d)) d.dataset.hov = Date.now(); closeAll(d); set(d, true); });
    d.addEventListener('mouseleave', () => { if (!hoverable()) return; clearTimeout(t); t = setTimeout(() => set(d, false), 300); });
    d.addEventListener('focusout', e => { if (wide() && !d.contains(e.relatedTarget)) set(d, false); });
  }
  const setPanel = open => {
    if (open === panel || !btn) return;
    panel = open;
    if (open) nav.style.setProperty('--jg-hh', Math.round(head.getBoundingClientRect().bottom) + 'px');
    nav.classList.toggle('jg-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    lock(open);
    if (open) {
      dds.forEach(d => set(d, d.firstElementChild.hasAttribute('data-on')));
      const cur = nav.querySelector('[aria-current="page"]');
      if (cur) cur.scrollIntoView({ block: 'center' });
    }
  };
  if (btn) btn.addEventListener('click', () => setPanel(!panel));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const d = dds.find(isOpen);
    if (wide() && d) { set(d, false); d.firstElementChild.focus(); } else if (panel) { setPanel(false); btn.focus(); }
  });
  document.addEventListener('click', e => { if (wide() && !nav.contains(e.target)) closeAll(); });
  matchMedia(WIDE).addEventListener('change', () => { setPanel(false); closeAll(); });
  const q = $('[data-jg-q]', nav), qr = $('[data-jg-qr]', nav);
  if (q && qr) {
    let box = null;
    const run = () => { const on = !!q.value.trim(); nav.classList.toggle('jg-nqon', on); qr.hidden = !on; if (box) box.run(); };
    q.addEventListener('focus', () => busca().then(m => { if (!box) { box = m.searchBox(q, qr, 'jg-nq', () => setPanel(false)); run(); } }));
    q.addEventListener('input', run);
  }
}

// search: code and index load on the first use (client/busca.js)
let mod = null;
const busca = () => (mod = mod || import('./busca.js'));
function search() {
  const b = $('[data-jg-find]');
  if (!b) return;
  const open = () => busca().then(m => m.open(b, lock));
  b.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const x = e.target;
    if (x && (x.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName))) return;
    e.preventDefault();
    open();
  });
}

export function helpLine(id) {
  const data = json('jg-data');
  const box = $('[data-jg-line]');
  if (!box || !data || box.dataset.fijo) return;
  const l = data.lines[id];
  if (!l) return;
  box.textContent = '';
  box.append('¿El juego dejó de ser un juego? Línea ' + (l.f ? data.w.free : '') + 'de ' + l.n + ': ');
  const a = document.createElement('a');
  a.href = 'tel:' + l.t; a.textContent = l.p;
  box.append(a);
}

theme();
menu();
search();
const saved = store.get('jg-prov');
if (saved) helpLine(saved);
