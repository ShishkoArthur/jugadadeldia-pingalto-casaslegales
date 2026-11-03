const root = document.documentElement;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { return null; } return v; },
};
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
function menu() {
  const btn = document.querySelector('[data-pa-menu]');
  const nav = document.getElementById('pa-nv');
  if (!btn || !nav) return;
  const set = open => { nav.classList.toggle('pa-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  btn.addEventListener('click', () => set(!nav.classList.contains('pa-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  document.addEventListener('click', e => { if (!e.target.closest('#pa-nv,[data-pa-menu]')) set(false); });
}
theme();
menu();
