import { checkHost, anatomy } from '../../../engine/hostcheck.mjs';
import { margin, parseOdd, parseAny, convertOdd, toFractional, toAmerican, parlay, settleHandicap, handicapLabel, handicapReturn } from '../../../engine/odds.mjs';
const root = document.documentElement;
const EN = /^en/.test(root.lang || '');
const PCT = EN ? '%' : ' %';
const num = (x, d) => (EN ? x.toFixed(d) : x.toFixed(d).replace('.', ','));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { return null; } return v; },
};
const json = id => { const el = document.getElementById(id); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { return null; } };

function theme() {
  const btn = document.querySelector('[data-rl-theme]');
  if (!btn) return;
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const sync = () => btn.setAttribute('aria-pressed', dark() ? 'true' : 'false');
  sync();
  btn.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('rl-theme', next);
    sync();
  });
}

const WIDE = '(min-width: 1080px)';
const wide = () => matchMedia(WIDE).matches;
const hoverable = () => wide() && matchMedia('(hover: hover)').matches;
let locked = 0;
const lock = on => { locked = Math.max(0, locked + (on ? 1 : -1)); root.classList.toggle('rl-lock', locked > 0); };

// the whole menu: a panel per section on wide screens (hover with a 300 ms close delay, or click; Esc closes), an accordion in the
// burger panel below 1080 px (scroll inside the panel, the page locked on html only)
function menu() {
  const nav = document.getElementById('rl-nav');
  if (!nav) return;
  const btn = document.querySelector('[data-rl-menu]');
  const top = nav.closest('header');
  const dds = [...nav.querySelectorAll('[data-rl-dd]')];
  let t = 0, panel = false;
  const isOpen = d => d.classList.contains('rl-ddo');
  const set = (d, open) => { d.classList.toggle('rl-ddo', open); d.firstElementChild.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  const closeAll = keep => dds.forEach(d => { if (d !== keep) set(d, false); });
  for (const d of dds) {
    d.firstElementChild.addEventListener('click', () => {
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
    if (open) nav.style.setProperty('--rl-hh', Math.round(top.getBoundingClientRect().bottom) + 'px');
    nav.classList.toggle('rl-open', open);
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
  const q = nav.querySelector('[data-rl-q]'), qr = nav.querySelector('[data-rl-qr]');
  if (q && qr) {
    let box = null;
    const run = () => { const on = !!q.value.trim(); nav.classList.toggle('rl-nqon', on); qr.hidden = !on; if (box) box.run(); };
    q.addEventListener('focus', () => buscar().then(m => { if (!box) { box = m.searchBox(q, qr, 'rl-nq', () => setPanel(false)); run(); } }));
    q.addEventListener('input', run);
  }
}

// search: code and index load on the first use (client/buscar.js)
let searchMod = null;
const buscar = () => (searchMod = searchMod || import('./buscar.js'));
function search() {
  const b = document.querySelector('[data-rl-find]');
  if (!b) return;
  const open = () => buscar().then(m => m.open(b, lock));
  b.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const x = e.target;
    if (x && (x.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(x.tagName))) return;
    e.preventDefault();
    open();
  });
}

function telLink(line) {
  const a = document.createElement('a');
  a.href = 'tel:' + line.t;
  a.textContent = line.p;
  return a;
}

function footerLine(data) {
  const box = document.querySelector('[data-rl-line]');
  if (!box || !data || box.dataset.rlFixed) return;
  const id = store.get('rl-prov');
  const j = id && data.j[id];
  if (!j || !j.l) return;
  const name = box.querySelector('[data-rl-name]');
  const tel = box.querySelector('a[href^="tel:"]');
  if (name) name.textContent = j.n;
  if (tel) tel.replaceWith(telLink(j.l));
}

function map(data) {
  const board = document.querySelector('[data-rl-map]');
  if (!board || !data) return;
  const panel = document.querySelector('[data-rl-panel]');
  const pick = document.querySelector('[data-rl-pick]');
  const tiles = [...board.querySelectorAll('button[data-j]')];
  const tag = board.querySelector('u');
  const s = data.s;
  const show = id => {
    const j = data.j[id];
    if (!j) return;
    tiles.forEach(t => { const on = t.dataset.j === id; t.setAttribute('aria-pressed', on ? 'true' : 'false'); t.classList.toggle('rl-on', on); });
    const tile = tiles.find(t => t.dataset.j === id);
    if (tag && tile) { tag.textContent = j.co + (j.c === null ? '' : ' · ' + j.c); tile.append(tag); }
    if (pick && pick.value !== id) pick.value = id;
    panel.querySelector('h2').textContent = j.n;
    const num = panel.querySelector('.rl-num');
    num.firstChild.textContent = j.c === null ? s.dash : String(j.c);
    num.querySelector('small').textContent = j.k;
    num.dataset.s = j.s;
    panel.querySelector('[data-rl-meta]').textContent = j.m;
    const line = panel.querySelector('[data-rl-help]');
    line.textContent = '';
    if (j.l) { line.append(s.help + ' '); line.append(telLink(j.l)); } else { line.append(s.helpNone + ' '); line.append(telLink(data.crisis)); }
    const go = panel.querySelector('[data-rl-go]');
    if (j.u) { go.hidden = false; go.href = j.u; go.textContent = s.go.replace('{n}', j.n); } else go.hidden = true;
    store.set('rl-prov', id);
    footerLine(data);
verifier();
  };
  tiles.forEach(t => t.addEventListener('click', () => show(t.dataset.j)));
  if (pick) pick.addEventListener('change', () => show(pick.value));
  const saved = store.get('rl-prov');
  if (saved && data.j[saved]) show(saved);
}

function filter() {
  const bar = document.querySelector('[data-rl-filter]');
  if (!bar) return;
  const rows = [...document.querySelectorAll('[data-rl-rows] tr[data-j]')];
  const count = document.querySelector('[data-rl-count]');
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    let n = 0;
    rows.forEach(r => { const on = b.dataset.f === 'all' || r.dataset.j === b.dataset.f; r.hidden = !on; if (on) n++; });
    if (count) count.textContent = String(n);
  });
}

function statusFilter() {
  const bar = document.querySelector('[data-rl-sfilter]');
  if (!bar) return;
  const rows = [...document.querySelectorAll('[data-rl-srows] tr[data-s]')];
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    rows.forEach(r => { r.hidden = !(b.dataset.f === 'all' || r.dataset.s === b.dataset.f); });
  });
}

function marginCalc() {
  const form = document.querySelector('[data-rl-margin]');
  if (!form) return;
  const dec = num;
  const pct = x => dec(x * 100, 2) + PCT;
  const err = form.querySelector('[data-rl-merr]');
  const rowsEl = form.querySelector('[data-rl-mrows]');
  const third = form.querySelector('[data-third]');
  const names3 = ['Local', 'Empate', 'Visitante'], names2 = ['Opción 1', 'Opción 2'];
  const run = () => {
    const k = form.querySelector('input[name=k]:checked').value === '2' ? 2 : 3;
    third.closest('label').hidden = k === 2;
    const vals = [0, 1, 2].slice(0, k).map(i => form.querySelector('input[name=o' + i + ']').value);
    const odds = vals.map(parseOdd);
    if (odds.some(o => o === null)) { err.hidden = false; return; }
    err.hidden = true;
    const m = margin(odds);
    form.querySelector('[data-k=margin]').textContent = pct(m.margin);
    form.querySelector('[data-k=payout]').textContent = pct(m.payout);
    form.querySelector('[data-k=keep]').textContent = pct(1 - m.payout);
    form.querySelector('[data-k=sum]').textContent = pct(m.sum);
    const names = k === 2 ? names2 : names3;
    rowsEl.textContent = '';
    m.odds.forEach((o, i) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = names[i];
      tr.append(th);
      [dec(o, 2), pct(m.implied[i]), dec(m.fairOdds[i], 2)].forEach(t => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
      rowsEl.append(tr);
    });
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  run();
}

function helpPick(data) {
  const pick = document.querySelector('[data-rl-jump]');
  if (!pick) return;
  pick.addEventListener('change', () => {
    const el = document.getElementById('j-' + pick.value);
    if (el) { location.hash = 'j-' + pick.value; el.focus({ preventScroll: true }); }
    store.set('rl-prov', pick.value);
    footerLine(data);
verifier();
  });
  const saved = store.get('rl-prov');
  if (saved && [...pick.options].some(o => o.value === saved)) pick.value = saved;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));

function verifier() {
  const form = document.querySelector('[data-rl-ver]');
  const V = json('rl-ver');
  if (!form || !V) return;
  const input = form.querySelector('input');
  const out = form.querySelector('[data-rl-vout]');
  const s = V.s;
  const entries = V.e.map(e => ({ host: e.h, jur: e.j, brand: e.b, ref: e.r, page: e.u, off: e.o }));
  const anat = a => {
    const box = el('div', 'rl-anat');
    const part = (cls, txt, lab) => { if (!txt) return; const sp = el('span', cls); sp.append(el('b', null, txt), el('small', null, lab)); box.append(sp); };
    part('rl-a-sub', a.sub ? a.sub + '.' : '', 'subdominio');
    part('rl-a-name', a.name, 'nombre');
    part('rl-a-end' + (a.betAr ? ' rl-a-bet' : ''), '.' + a.ending, a.betAr ? 'terminación .bet.ar' : 'otra terminación');
    return box;
  };
  const jur = id => V.j[id];
  const run = (raw, push) => {
    const r = checkHost(raw, entries);
    out.textContent = '';
    out.className = 'rl-vout rl-v-' + r.state;
    if (r.state === 'empty') { out.append(el('p', 'rl-vwait', s.empty)); return; }
    const head = el('div', 'rl-vhead');
    head.append(el('i', r.state === 'listed' ? 'rl-y' : r.state === 'similar' ? 'rl-w' : 'rl-n'));
    head.append(el('h2', null, r.state === 'listed' ? (r.how === 'subdomain' ? s.sub : s.listed) : r.state === 'similar' ? s.similar : s.none));
    out.append(head, anat(r.anatomy), el('p', 'rl-vbet', r.anatomy.betAr ? s.bet : s.notBet));
    const ul = el('ul', 'rl-vlist');
    for (const m of r.matches) {
      const j = jur(m.jur);
      const o = { n: j.n, r: j.r, d: j.d, h: r.host, p: m.host, a: m.ref, b: m.brand };
      const li = el('li');
      li.append(el('span', 'rl-tag', j.c));
      const txt = r.state === 'listed' ? (r.how === 'subdomain' ? fill(s.subOf, o) : fill(s.inList, o)) : fill(s[m.why] || s.name, o);
      li.append(el('p', null, txt));
      if (r.state === 'listed' && m.ref) li.append(el('p', 'rl-src', fill(s.act, o)));
      const links = el('p', 'rl-vlinks');
      if (m.page) { const a = el('a', null, fill(s.ficha, o)); a.href = m.page; links.append(a); }
      if (j.u) { const a = el('a', null, fill(s.prov, o)); a.href = j.u; links.append(a); }
      if (links.childNodes.length) li.append(links);
      if (r.state === 'listed' && m.off) { const a = el('a', 'rl-off rl-off-s'); a.href = m.off; a.rel = 'nofollow noopener'; a.target = '_blank'; a.append(el('span', null, fill(s.off, o)), el('small', null, new URL(m.off).hostname)); li.append(a, el('p', 'rl-offn', s.offNote)); }
      ul.append(li);
    }
    if (r.matches.length) out.append(ul);
    if (r.state === 'none' || r.state === 'similar') out.append(el('p', 'rl-note', fill(s.noneLong, { lists: V.lists })));
    if (push) { try { history.replaceState(null, '', location.pathname + '?d=' + encodeURIComponent(r.host)); } catch (e) { return; } }
  };
  form.addEventListener('submit', e => { e.preventDefault(); run(input.value, true); });
  input.addEventListener('input', () => { if (anatomy(input.value)) run(input.value, false); });
  form.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.ex; run(b.dataset.ex, true); }));
  const q = new URLSearchParams(location.search).get('d');
  if (q) { input.value = q; run(q, false); }
}

const cdec = num;
const cpct = (x, d) => cdec(x * 100, d) + PCT;
const camer = v => (v > 0 ? '+' : String.fromCharCode(0x2212)) + cdec(Math.abs(v), Number.isInteger(Math.round(Math.abs(v) * 100) / 100) ? 0 : 2);
const cfrac = f => (f.exact ? '' : String.fromCharCode(0x2248) + ' ') + f.text;
const fmtMoney = n => '$ ' + Math.round(n).toLocaleString(EN ? 'en-US' : 'es-AR');
const fmtOf = form => { const r = form.querySelector('input[name=f]:checked'); return r ? r.value : 'decimal'; };

function convCalc() {
  const form = document.querySelector('[data-rl-conv]');
  if (!form) return;
  const err = form.querySelector('[data-rl-cerr]');
  const set = (k, t) => { const e = form.querySelector('[data-k=' + k + ']'); if (e) e.textContent = t; };
  const run = () => {
    const c = convertOdd(form.querySelector('input[name=q]').value, fmtOf(form));
    if (!c) { err.hidden = false; return; }
    err.hidden = true;
    set('dec', cdec(c.decimal, 2));
    set('frac', cfrac(c.fractional));
    set('am', camer(c.american));
    set('imp', cpct(c.implied, 1));
    const bar = form.querySelector('[data-k=bar]');
    if (bar) bar.style.setProperty('--w', (100 * c.implied).toFixed(2) + '%');
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
}

function novigCalc() {
  const form = document.querySelector('[data-rl-novig]');
  if (!form) return;
  const err = form.querySelector('[data-rl-nerr]');
  const rows = form.querySelector('[data-rl-nrows]');
  const sum = form.querySelector('[data-rl-nsum]');
  const run = () => {
    const f = fmtOf(form);
    const vals = [0, 1, 2].map(i => form.querySelector('input[name=o' + i + ']').value.trim());
    const odds = vals.map((v, i) => (i === 2 && !v ? 'skip' : parseAny(v, f))).filter(v => v !== 'skip');
    if (odds.length < 2 || odds.some(o => o === null)) { err.hidden = false; return; }
    err.hidden = true;
    const m = margin(odds);
    sum.textContent = '';
    sum.append('Suma de probabilidades ', el('b', null, cpct(m.sum, 2)), ' ' + String.fromCharCode(0xb7) + ' margen ', el('b', null, cpct(m.margin, 2)));
    rows.textContent = '';
    m.odds.forEach((o, i) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = 'Resultado ' + (i + 1);
      tr.append(th);
      const fo = m.fairOdds[i];
      [cdec(o, 2), cpct(m.implied[i], 1), cpct(m.fairProb[i], 1), cdec(fo, 2) + ' ' + String.fromCharCode(0xb7) + ' ' + cfrac(toFractional(fo)) + ' ' + String.fromCharCode(0xb7) + ' ' + camer(toAmerican(fo))].forEach(t => { const td = document.createElement('td'); td.textContent = t; tr.append(td); });
      rows.append(tr);
    });
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
}

function parlayCalc() {
  const form = document.querySelector('[data-rl-parlay]');
  if (!form) return;
  const box = form.querySelector('[data-rl-legs]');
  const tpl = form.querySelector('[data-rl-legt]');
  const err = form.querySelector('[data-rl-perr]');
  const set = (k, t) => { const e = form.querySelector('[data-k=' + k + ']'); if (e) e.textContent = t; };
  const legsEl = () => [...box.querySelectorAll('[data-leg]')];
  const run = () => {
    const legs = legsEl().map(fs => {
      const odds = [...fs.querySelectorAll('input:not([type=radio])')].map(i => parseOdd(i.value));
      const r = fs.querySelector('input[type=radio]:checked');
      return { odds, pick: r ? Number(r.value) : 0 };
    });
    if (!legs.length || legs.some(l => l.odds.some(o => o === null))) { err.hidden = false; return; }
    err.hidden = true;
    const p = parlay(legs);
    set('odd', cdec(p.odd, 2));
    set('one', '1 en ' + cdec(p.oneIn, 1));
    set('edge', cpct(p.edge, 1));
    set('ret', fmtMoney(1000 * p.payout));
  };
  const add = () => {
    const n = legsEl().length;
    if (n >= 8) return;
    const frag = tpl.content.cloneNode(true);
    frag.querySelector('legend').textContent = 'Selección ' + (n + 1);
    frag.querySelectorAll('input').forEach(i => {
      i.name = i.name.replace('l99', 'l' + n);
      if (i.getAttribute('aria-label')) i.setAttribute('aria-label', i.getAttribute('aria-label').replace(/\d+/, String(n + 1)));
      if (i.type !== 'radio') i.value = '';
    });
    box.append(frag);
    const first = box.lastElementChild && box.lastElementChild.querySelector('input');
    if (first) first.focus();
    run();
  };
  form.querySelector('[data-rl-add]').addEventListener('click', add);
  form.querySelector('[data-rl-del]').addEventListener('click', () => { const l = legsEl(); if (l.length > 1) { l[l.length - 1].remove(); run(); } });
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
}

const HCP_WORD = { win: 'gana', 'half-win': 'mitad gana, mitad vuelve', push: 'se devuelve', 'half-lose': 'mitad pierde, mitad vuelve', lose: 'pierde' };
function hcpCalc() {
  const form = document.querySelector('[data-rl-hcp]');
  if (!form) return;
  const err = form.querySelector('[data-rl-herr]');
  const set = (k, t) => { const e = form.querySelector('[data-k=' + k + ']'); if (e) e.textContent = t; };
  const goals = v => (/^\d{1,2}$/.test(String(v).trim()) && Number(v) <= 20 ? Number(v) : null);
  const run = () => {
    const line = Number(form.querySelector('[name=l]').value);
    const a = goals(form.querySelector('[name=a]').value), b = goals(form.querySelector('[name=b]').value);
    const o = parseOdd(form.querySelector('[name=o]').value);
    const sv = String(form.querySelector('[name=s]').value);
    const st = Number(EN ? sv.replace(/,/g, '') : sv.replace(/\./g, '').replace(',', '.'));
    if (a === null || b === null || o === null || !(st > 0) || !Number.isFinite(line)) { err.hidden = false; return; }
    err.hidden = true;
    const k = handicapLabel(settleHandicap(line, a - b));
    const r = handicapReturn(line, a - b, o, st);
    set('res', HCP_WORD[k]);
    set('adj', cdec(a + line, 2).replace(/0+$/, '').replace(/[.,]$/, '').replace(/^-/, String.fromCharCode(0x2212)) + ' a ' + b);
    set('ret', fmtMoney(r));
    const net = Math.round(r - st);
    set('net', (net > 0 ? '+' : net < 0 ? String.fromCharCode(0x2212) : '') + fmtMoney(Math.abs(net)));
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
}

function provCheck() {
  const form = document.querySelector('[data-rl-pchk]');
  const D = json('rl-pchk');
  if (!form || !D) return;
  const out = form.querySelector('[data-rl-pchk-out]');
  const input = form.querySelector('input');
  const entries = D.e.map(e => ({ host: e.h, jur: e.j }));
  const run = () => {
    const r = checkHost(input.value, entries);
    out.className = 'rl-pchk-out';
    if (r.state === 'empty') { out.textContent = ''; return; }
    const here = r.matches.filter(m => m.jur === D.jur);
    const o = { h: r.host, b: D.b, p: D.j[D.jur], x: D.host, n: D.s.n, m: [...new Set(r.matches.map(m => m.host))].join(', '), o: [...new Set(r.matches.map(m => D.j[m.jur]))].join(', ') };
    let k = 'none';
    if (r.state === 'listed') k = here.length ? (r.how === 'subdomain' ? 'under' : 'yes') : 'other';
    else if (r.state === 'similar') k = 'similar';
    out.classList.add(k === 'yes' || k === 'under' ? 'rl-pk-y' : k === 'other' ? 'rl-pk-w' : 'rl-pk-n');
    out.textContent = fill(D.s[k], o);
  };
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  input.addEventListener('input', run);
}

function revisado() {
  const els = [...document.querySelectorAll('[data-rv]')];
  const sum = document.querySelector('[data-rv-sum]');
  if (!els.length) return;
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const fmt = d => (EN ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00:00Z')) : d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4));
  fetch('/data/feeds/listas.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
    const docs = j && j.data && j.data.docs;
    if (!docs) return;
    let n = 0, last = '';
    for (const node of els) {
      const d = docs[node.dataset.rv];
      if (!d || d.state !== 'ok' || !day.test(d.revisado || '')) continue;
      if (node.tagName === 'TD') n++;
      if (d.revisado > last) last = d.revisado;
      if (d.revisado <= (node.dataset.rvd || '')) continue;
      node.appendChild(el('span', 'rl-rv', ' · revisada el ' + fmt(d.revisado) + ', sin cambios'));
    }
    if (sum && n && last) {
      sum.textContent = 'Revisión automática mensual: el ' + fmt(last) + ', ' + n + ' de ' + els.filter(x => x.tagName === 'TD').length + ' documentos de esta tabla seguían iguales en la página oficial (citas y listas). Los demás los guarda una persona desde un navegador.';
      sum.hidden = false;
    }
  }).catch(() => {});
}

const data = json('rl-data');
theme();
menu();
search();
map(data);
filter();
statusFilter();
marginCalc();
helpPick(data);
footerLine(data);
verifier();
convCalc();
novigCalc();
parlayCalc();
hcpCalc();
provCheck();
revisado();
