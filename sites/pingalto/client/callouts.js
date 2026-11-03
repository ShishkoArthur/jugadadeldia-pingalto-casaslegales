import { $, $$, data, out, esc } from './kit.js';

const D = data();
const svg = $('.pa-cmap');
if (svg && D) {
  const C = D.c;
  let lang = 'es', quiz = null, ok = 0, tries = 0;
  const label = (c, l = lang) => l === 'es' ? c[0] : c[1];
  const setLang = l => { lang = l; $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l))); $$('.pa-cp text', svg).forEach(t => { t.textContent = t.dataset[l]; }); if (quiz !== null) ask(); };
  const ask = () => { out('q', 'Tocá en el mapa: <b>' + esc(label(C[quiz])) + '</b>'); };
  const next = () => { let k; do { k = Math.floor(Math.random() * C.length); } while (C.length > 1 && k === quiz); quiz = k; svg.classList.add('pa-quiz'); ask(); };
  const pick = i => {
    $$('.pa-cp', svg).forEach(g => g.classList.toggle('pa-on', g.dataset.i === String(i)));
    const c = C[i];
    out('sel', 'Español: ' + esc(label(c, 'es')) + ' · Inglés: ' + esc(label(c, 'en')));
    if (quiz === null) { out('q', '<b>' + esc(label(c)) + '</b>'); return; }
    tries++;
    if (i === quiz) { ok++; out('q', '¡Bien! Era <b>' + esc(label(c)) + '</b>.'); out('sc', ok + ' de ' + tries); setTimeout(next, 900); }
    else { out('q', 'Ese es <b>' + esc(label(c)) + '</b>. Buscá <b>' + esc(label(C[quiz])) + '</b>.'); out('sc', ok + ' de ' + tries); }
  };
  svg.addEventListener('click', e => { const g = e.target.closest('.pa-cp'); if (g) pick(Number(g.dataset.i)); });
  svg.addEventListener('keydown', e => { const g = e.target.closest('.pa-cp'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(Number(g.dataset.i)); } });
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const qb = $('[data-quiz]');
  if (qb) qb.addEventListener('click', () => { ok = 0; tries = 0; out('sc', ''); qb.textContent = 'Empezar de nuevo'; next(); });
}
