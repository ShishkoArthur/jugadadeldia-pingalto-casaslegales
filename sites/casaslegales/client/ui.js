import { checkHost, anatomy } from '../../../engine/hostcheck.mjs';
const root = document.documentElement;
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

function menu() {
  const btn = document.querySelector('[data-rl-menu]');
  const nav = document.getElementById('rl-nav');
  if (!btn || !nav) return;
  const set = open => { nav.classList.toggle('rl-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  btn.addEventListener('click', () => set(!nav.classList.contains('rl-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
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
  const s = data.s;
  const show = id => {
    const j = data.j[id];
    if (!j) return;
    tiles.forEach(t => t.setAttribute('aria-pressed', t.dataset.j === id ? 'true' : 'false'));
    if (pick && pick.value !== id) pick.value = id;
    panel.querySelector('h2').textContent = j.n;
    const num = panel.querySelector('.rl-num');
    num.firstChild.textContent = j.c === null ? s.dash : String(j.c);
    num.querySelector('small').textContent = j.c === null ? s.noList : (j.c === 1 ? s.one : s.many);
    panel.querySelector('[data-rl-meta]').textContent = j.c === null ? s.noListMeta : s.meta.replace('{r}', j.r).replace('{d}', j.d);
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
  const entries = V.e.map(e => ({ host: e.h, jur: e.j, brand: e.b, ref: e.r, page: e.u }));
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

const data = json('rl-data');
theme();
menu();
map(data);
filter();
helpPick(data);
footerLine(data);
verifier();
