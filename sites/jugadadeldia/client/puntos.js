import { $, $$, page } from './kit.js';
import { envidoCanRaise, envidoQuieroValue, envidoNoQuieroValue, faltaValue } from '../../../engine/truco/rules.mjs';

const D = page();
const box = $('[data-puntos]'), tbox = $('[data-tpuntos]');
const NAME = { envido: 'Envido', realEnvido: 'Real envido', faltaEnvido: 'Falta envido' };
let chain = [];
const out = (k, el = box) => $('[data-o="' + k + '"]', el);
function calc() {
  $$('[data-call]', box).forEach(b => { b.disabled = !envidoCanRaise(chain, b.dataset.call); });
  out('chain').innerHTML = chain.length ? chain.map(k => '<span>' + NAME[k] + '</span>').join('') : '<em>Tocá los cantos en orden</em>';
  if (!chain.length) { out('q').textContent = '-'; out('nq').textContent = '-'; out('why').textContent = 'Tocá un canto para empezar.'; return; }
  const R = D.rules[$('select[name=r]', box).value];
  const sc = [+$('input[name=us]', box).value || 0, +$('input[name=them]', box).value || 0].map(v => Math.max(0, Math.min(R.target - 1, v)));
  const nq = envidoNoQuieroValue(chain);
  out('nq').textContent = nq;
  if (chain.includes('faltaEnvido')) {
    const a = envidoQuieroValue(R, chain, sc, 0), b = envidoQuieroValue(R, chain, sc, 1);
    out('q').textContent = a === b ? a : a + ' / ' + b;
    out('why').textContent = 'Con ' + sc[0] + ' a ' + sc[1] + ' en un partido a ' + R.target + ': si ganan ustedes, ' + a + '; si ganan ellos, ' + b + '. ' + (chain.length > 1 ? 'No querido: los ' + nq + ' puntos ya queridos antes de la falta.' : 'No querido: 1 punto al que la cantó.');
  } else {
    out('q').textContent = envidoQuieroValue(R, chain, sc, 0);
    out('why').textContent = chain.length > 1 ? 'Querido: se suman todos los cantos. No querido: el que cantó último cobra lo que ya estaba querido.' : 'Primer canto sin querer: 1 punto al que cantó.';
  }
}
if (box) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-call]');
    if (b && envidoCanRaise(chain, b.dataset.call)) { chain = [...chain, b.dataset.call]; calc(); }
    if (e.target.closest('[data-clear]')) { chain = []; calc(); }
  });
  box.addEventListener('input', calc); box.addEventListener('change', calc);
  calc();
}
if (tbox) {
  tbox.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    $$('[data-t]', tbox).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const v = +b.dataset.t;
    out('tq', tbox).textContent = v;
    out('tnq', tbox).textContent = v === 1 ? '-' : v - 1;
    out('twhy', tbox).textContent = v === 1 ? 'Si nadie canta truco, la mano vale 1 punto para el que la gana.' : 'Si al último canto le dicen «no quiero», el que cantó cobra ' + (v - 1) + ': lo que ya valía la mano.';
  });
}
