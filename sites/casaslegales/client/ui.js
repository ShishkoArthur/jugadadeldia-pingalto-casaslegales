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
  });
  const saved = store.get('rl-prov');
  if (saved && [...pick.options].some(o => o.value === saved)) pick.value = saved;
}

const data = json('rl-data');
theme();
menu();
map(data);
filter();
helpPick(data);
footerLine(data);
