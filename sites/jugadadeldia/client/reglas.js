import { $, $$ } from './kit.js';
import { handWinner } from '../../../engine/truco/rules.mjs';

const box = $('[data-quien]');
const out = k => $('[data-o="' + k + '"]', box);
const W = { 0: 'vos', 1: 'el rival' };
function read() {
  const R = [];
  for (const g of $$('[data-baza]', box)) { const v = $('[aria-pressed=true]', g).dataset.v; if (v === '') break; R.push(+v); }
  return R;
}
function explain(R, mano) {
  const [a, b, c] = R;
  if (a === -1 && b === -1 && c === -1) return 'Las tres bazas fueron pardas: gana la mano.';
  if (a === -1) return b !== -1 ? 'La primera fue parda: gana el que gana la segunda.' : 'Primera y segunda pardas: decide la tercera.';
  if (b === a) return 'Ganó las dos primeras bazas: no hace falta jugar la tercera.';
  if (b === -1) return 'Ganó la primera y la segunda fue parda: gana el que ganó la primera.';
  if (c === -1) return 'Una baza cada uno y la tercera parda: gana el que ganó primero.';
  return 'Una baza cada uno: decide la tercera.';
}
function calc() {
  const mano = $('[data-mano]', box).checked ? 0 : 1;
  const R = read();
  const w = handWinner(R, mano);
  if (w === null) { out('who').textContent = 'Falta jugar'; out('why').textContent = R.length < 2 ? 'Con una sola baza todavía no se sabe.' : explain(R, mano); return; }
  out('who').textContent = w === 0 ? 'Ganaste vos' : 'Ganó el rival';
  out('why').textContent = explain(R, mano) + (R.length === 3 && R.every(x => x === -1) ? ' Mano: ' + W[mano] + '.' : '');
}
if (box) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-baza] button');
    if (!b) return;
    $$('button', b.parentNode).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    calc();
  });
  box.addEventListener('change', calc);
  calc();
}
