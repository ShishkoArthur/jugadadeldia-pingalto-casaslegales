import { $, store, json } from './kit.js';
import './precios.js';
const root = document.documentElement;

function theme() {
  const btns = [...document.querySelectorAll('[data-jg-tema]')];
  if (!btns.length) return;
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const sync = () => btns.forEach(b => b.setAttribute('aria-pressed', dark() ? 'true' : 'false'));
  sync();
  btns.forEach(b => b.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('jg-tema', next);
    sync();
  }));
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

function peek() {
  if (!('IntersectionObserver' in window)) return;
  const outs = [...document.querySelectorAll('main section.t2[aria-live]')].filter(s => s.querySelector('.jg-win') && s.previousElementSibling && s.previousElementSibling.matches('section'));
  for (const out of outs) {
    const win = out.querySelector('.jg-win'), src = out.previousElementSibling;
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'jg-peek';
    bar.hidden = true;
    const sync = () => { bar.textContent = [...win.childNodes].map(n => n.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' '); };
    sync();
    new MutationObserver(() => { sync(); upd(); }).observe(win, { subtree: true, childList: true, characterData: true });
    let inSrc = false, below = false, used = false;
    const typing = () => { const x = document.activeElement; return !!x && x.matches('input:not([type=radio]):not([type=checkbox]),textarea'); };
    const upd = () => { bar.hidden = !(used && inSrc && below) || typing() || /^[-\s]*$/.test((win.querySelector('b') || win).textContent); };
    const use = () => { used = true; setTimeout(upd, 0); };
    src.addEventListener('change', use);
    src.addEventListener('click', use);
    src.addEventListener('focusin', upd);
    src.addEventListener('focusout', () => setTimeout(upd, 0));
    new IntersectionObserver(([e]) => { below = !e.isIntersecting && e.boundingClientRect.top > 0; upd(); }).observe(out);
    new IntersectionObserver(([e]) => { inSrc = e.isIntersecting; upd(); }, { rootMargin: '0px 0px -30% 0px' }).observe(src);
    bar.addEventListener('click', () => out.scrollIntoView({ block: 'start' }));
    document.body.appendChild(bar);
  }
}

// wide screens: a card grid (.jg-mn) where one column is much shorter than its neighbour puts the cards of that column into one box
// that follows the reader down, and a card with empty columns to its right in its row grows over them (in a grid with Alt, the cards
// under her picture take the whole row); two blocks side by side (.jg-lx, .jg-two, .jg-table) do the same with the shorter one (owner
// 2026-11-11: no empty areas). The grid places cards by their classes (w2, w3, t2), so the plan is worked out from the classes and
// the heights of the cards, never from where the browser put them after an earlier plan.
function stacks() {
  const grids = [...document.querySelectorAll('.jg-mn:not(.art)')].map(g => ({ g, all: [...g.children], key: '' }));
  const pairs = [...document.querySelectorAll('.jg-lx,.jg-two,.jg-table')];
  const arts = [...document.querySelectorAll('.jg-mn.art')];
  if (!grids.length && !pairs.length && !arts.length) return;
  const area = (r, c, h, w) => [r + 1, c + 1, r + 1 + h, c + 1 + w].join(' / ');
  const GAP = 22;
  const has = (k, c) => k.classList.contains(c);
  const own = k => { if (has(k.parentElement, 'jg-stk-i')) return k.offsetHeight; k.style.alignSelf = 'start'; const v = k.offsetHeight; k.style.alignSelf = ''; return v; };
  const room = () => innerHeight - 120;
  const undo = G => {
    for (const w of G.g.querySelectorAll(':scope>.jg-stk')) { w.before(...w.firstChild.children); w.remove(); }
    for (const k of G.all) k.style.gridArea = '';
  };
  const plan = G => {
    const cards = G.all.filter(k => !k.hidden && getComputedStyle(k).display !== 'none');
    const used = [], place = [];
    const free = (r, c, w, h) => { if (c + w > 3) return false; for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) if (used[i] && used[i][j]) return false; return true; };
    let cr = 0, cc = 0;
    for (const k of cards) {
      const w = has(k, 'w3') || has(k, 'jg-cu') ? 3 : has(k, 'w2') ? 2 : 1, h = has(k, 't2') ? 2 : 1;
      let r = cr, c = cc;
      while (!free(r, c, w, h)) if (++c + w > 3) { c = 0; r++; }
      for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) (used[i] = used[i] || [])[j] = 1;
      place.push({ k, r, c, w, h, n: own(k) });
      cr = r; cc = c + w;
    }
    for (const p of place) if (p.h === 1) while (p.c + p.w < 3 && !(used[p.r] || [])[p.c + p.w]) used[p.r][p.c + p.w++] = 1;
    const band = [];
    for (const p of place) { const b = band.find(x => p.r <= x.r1 && p.r + p.h - 1 >= x.r0); if (b) { b.r0 = Math.min(b.r0, p.r); b.r1 = Math.max(b.r1, p.r + p.h - 1); b.ps.push(p); } else band.push({ r0: p.r, r1: p.r + p.h - 1, ps: [p] }); }
    const wraps = [];
    for (const b of band) {
      const cols = new Map();
      for (const p of b.ps) cols.set(p.c + '/' + p.w, [...(cols.get(p.c + '/' + p.w) || []), p]);
      if (cols.size < 2 || !b.ps.some(p => p.w > 1 || p.h > 1)) continue;
      const hs = [...cols.values()].map(ps => ps.reduce((a, p) => a + p.n, 0) + GAP * (ps.length - 1)), top = Math.max(...hs);
      [...cols.values()].forEach((ps, i) => { if (top - hs[i] > 120) wraps.push({ ps, r: b.r0, rows: b.r1 - b.r0 + 1, fix: hs[i] < room() }); });
    }
    return { place, wraps };
  };
  const fit = () => {
    for (const G of grids) {
      const P = innerWidth > 900 ? plan(G) : null;
      const key = P ? P.place.map(p => [p.r, p.c, p.w, p.h].join()).join(' ') + '|' + P.wraps.map(x => x.ps.map(p => G.all.indexOf(p.k)).join('.') + (x.fix ? '!' : '')).join(' ') : '';
      if (key === G.key) continue;
      undo(G);
      G.key = key;
      if (!P) continue;
      for (const p of P.place) p.k.style.gridArea = area(p.r, p.c, p.h, p.w);
      for (const x of P.wraps) {
        const box = document.createElement('div'), inner = document.createElement('div');
        box.className = 'jg-stk'; inner.className = 'jg-stk-i';
        box.style.gridArea = area(x.r, x.ps[0].c, x.rows, x.ps[0].w);
        x.ps[0].k.before(box);
        box.append(inner);
        for (const p of x.ps) { p.k.style.gridArea = ''; inner.append(p.k); }
        inner.toggleAttribute('data-fija', x.fix);
      }
    }
    for (const a of arts) {
      const girl = a.querySelector(':scope>.jg-girl'), cards = [...a.children].filter(k => k !== girl);
      cards.forEach(k => { k.style.gridColumn = ''; });
      if (girl && innerWidth > 620) { const end = girl.offsetTop + girl.offsetHeight; cards.forEach(k => { if (k.offsetTop >= end) k.style.gridColumn = '1 / -1'; }); }
    }
    for (const p of pairs) {
      const two = [...p.children].filter(k => k.offsetHeight);
      if (two.length !== 2) { for (const k of p.children) k.removeAttribute('data-fija'); continue; }
      const [a, b] = two, ha = own(a), hb = own(b);
      const go = a.offsetTop === b.offsetTop && Math.abs(ha - hb) > 120 && Math.min(ha, hb) < room() ? (ha < hb ? a : b) : 0;
      for (const el of [a, b]) el.toggleAttribute('data-fija', el === go);
    }
  };
  let t = 0;
  const soon = () => { clearTimeout(t); t = setTimeout(fit, 80); };
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(soon); for (const G of grids) for (const k of G.all) ro.observe(k); for (const p of pairs) for (const k of p.children) ro.observe(k); }
  addEventListener('resize', soon);
  addEventListener('load', soon);
  fit();
}

theme();
menu();
search();
peek();
stacks();
const saved = store.get('jg-prov');
if (saved) helpLine(saved);
