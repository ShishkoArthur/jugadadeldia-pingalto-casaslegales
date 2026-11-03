import { STYLES, style, frame, lengths, HANGUL_FILLER, BRAILLE_BLANK, showInvisible } from '../../../engine/games/fancy.mjs';
import { $, $$, out, fmt, esc, params, setParams } from './kit.js';

const copyText = async (text, k, msg) => { let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; } out(k, ok ? msg : 'Mantené apretado el texto para copiarlo'); };
const nf = $('#pa-nf');
if (nf) {
  const t = $('#nf-t'), fr = $('#nf-fr'), ul = $('#nf-out');
  const q = params();
  if (q.get('n')) t.value = q.get('n').slice(0, 40);
  if (q.get('f')) fr.value = q.get('f');
  const run = (push = true) => {
    const base = t.value || 'nombre';
    for (const li of $$('li', ul)) {
      const id = li.dataset.st, s = frame(id === 'normal' ? base : style(base, id), Number(fr.value));
      const n = lengths(s);
      $('[data-t]', li).textContent = s;
      $('[data-l]', li).textContent = fmt(n.chars, 0) + ' caracteres · ' + fmt(n.units, 0) + ' unidades';
    }
    out('copied', '');
    if (push) setParams({ n: t.value, f: fr.value === '0' ? '' : fr.value });
  };
  t.addEventListener('input', () => run());
  fr.addEventListener('change', () => run());
  $$('[data-idea]').forEach(b => b.addEventListener('click', () => { t.value = (t.value + b.dataset.idea).slice(0, 40); run(); }));
  ul.addEventListener('click', e => { const b = e.target.closest('[data-cp]'); if (b) copyText($('[data-t]', b.parentElement).textContent, 'copied', 'Copiado: pegalo en el juego'); });
  void STYLES;
  run(false);
}
const inf = $('#pa-if');
if (inf) {
  const CH = { 'U+3164': HANGUL_FILLER, 'U+2800': BRAILLE_BLANK };
  $$('[data-inv]').forEach(b => b.addEventListener('click', () => copyText(CH[b.dataset.inv], 'c' + b.dataset.inv.slice(2), 'Copiado. No se ve, pero está.')));
  const a = $('#if-a'), b = $('#if-b'), c = $('#if-c'), test = $('#if-t');
  const nick = () => a.value + CH[c.value] + b.value;
  const run = () => { const s = nick(); out('nick', esc(s)); out('show', esc(showInvisible(s)) + ' · ' + fmt(lengths(s).chars, 0) + ' caracteres'); out('copied', ''); };
  [a, b, c].forEach(el => el.addEventListener('input', run));
  $('[data-cpnick]').addEventListener('click', () => copyText(nick(), 'copied', 'Nombre copiado'));
  const ctx = document.createElement('canvas').getContext('2d');
  test.addEventListener('input', () => {
    const s = test.value;
    const inv = [...s].filter(x => x === HANGUL_FILLER || x === BRAILLE_BLANK);
    if (!s) { out('test', 'Te mostramos qué caracteres invisibles tiene y cuánto ocupan en este navegador.'); return; }
    let w = '';
    if (ctx && inv.length) { ctx.font = getComputedStyle(test).font; const sp = ctx.measureText(' ').width || 1; w = ' Cada uno ocupa ' + fmt((ctx.measureText(inv[0]).width / sp) * 100, 0) + ' % del ancho de un espacio común en este navegador.'; }
    out('test', inv.length ? 'Tiene ' + fmt(inv.length, 0) + ' invisible' + (inv.length === 1 ? '' : 's') + ': ' + esc(showInvisible(s)) + '.' + w : 'No encontramos ningún invisible de esta página: ' + esc(s));
  });
  run();
}
