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
