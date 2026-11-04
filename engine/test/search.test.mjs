import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, dist, tokenMatch, prepare, query, marks } from '../search.mjs';
import { planTerms, addAnchors, entryOf } from '../../tools/lib/search.mjs';

const INDEX = {
  v: 1,
  p: [
    { u: '/quiniela/', t: 'Quiniela de hoy en vivo', d: 'Las cabezas de cada turno.', s: [['horarios', 'Horarios de cada sorteo', 'La Previa, La Primera, Matutina, Vespertina y Nocturna.']] },
    { u: '/quiniela/tucuman/', t: 'Quiniela de Tucumán de hoy', d: 'Los cinco sorteos de la Caja Popular.' },
    { u: '/quiniela/cuanto-paga/', t: '¿Cuánto paga la quiniela?', d: 'Premio por cifras y ubicaciones.', s: [['redoblona', 'La redoblona', 'Dos números a la vez.']] },
    { u: '/truco/envido/', t: 'Envido: contá tus tantos', d: 'Calculadora de tantos del envido.' },
    { u: '/juego-responsable/', t: 'Ayuda cuando el juego deja de ser un juego', d: 'Líneas gratuitas por provincia.', x: 1 },
  ],
};
const P = prepare(INDEX);
const top = q => (query(P, q)[0] || {}).u;

test('fold ignores case and accents', () => {
  assert.equal(fold('Tucumán ¿Cuánto?'), 'tucuman cuanto');
  assert.equal(fold('  Ñandú-Plus '), 'nandu plus');
});

test('typo distance with transpositions, stopped early', () => {
  assert.equal(dist('envido', 'envidio', 2), 1);
  assert.equal(dist('tucmuan', 'tucuman', 2), 1);
  assert.equal(dist('abc', 'xyzw', 1), 2);
  assert.equal(tokenMatch('pag', 'paga'), 0.85);
  assert.equal(tokenMatch('sensibilidat', 'sensibilidad'), 0.6);
  assert.equal(tokenMatch('ab', 'ac'), 0);
});

test('queries find the page by title, accent-free, with typos and word starts', () => {
  assert.equal(top('tucuman'), '/quiniela/tucuman/');
  assert.equal(top('cuanto paga'), '/quiniela/cuanto-paga/');
  assert.equal(top('envido'), '/truco/envido/');
  assert.equal(top('envidp'), '/truco/envido/');
  assert.equal(top('quiniela tucu'), '/quiniela/tucuman/');
  assert.deepEqual(query(P, 'zzzz'), []);
});

test('a section heading match points to its anchor', () => {
  const r = query(P, 'redoblona')[0];
  assert.equal(r.u, '/quiniela/cuanto-paga/');
  assert.equal(r.sec.a, 'redoblona');
});

test('help pages can restrict results', () => {
  const r = query(P, 'juego quiniela', { allow: e => e.x });
  assert.ok(r.every(x => x.u === '/juego-responsable/'));
});

test('marks split the matched words', () => {
  assert.deepEqual(marks('Quiniela de Tucumán', ['tucuman']), [['Quiniela de ', 0], ['Tucumán', 1]]);
});

test('build: plan terms without volumes or notes, anchors and the entry', () => {
  const ru = String.fromCharCode(0x43d, 0x435, 0x442);
  assert.equal(planTerms('quiniela matutina 40k/37 · quiniela la primera (' + ru + ') · ' + String.fromCharCode(0x2014)), 'quiniela matutina la primera');
  assert.equal(planTerms('quiniela ' + ru + ' 5k/3'), '');
  const html = '<html lang="es-AR"><head><title>T</title><meta name="description" content="Desc"></head><body><main><h1>Uno</h1><h2>Cómo se juega</h2><p>Texto <b>uno</b>.</p><table><tr><td>99</td></tr></table><h2 id="x">Otra</h2><p>Dos</p><h2>Cómo se juega</h2></main></body></html>';
  const a = addAnchors(html);
  assert.match(a, /<h2 id="como-se-juega">/);
  assert.match(a, /<h2 id="como-se-juega-2">/);
  const e = entryOf(a, { path: '/x/', kind: 'service' }, 'k1');
  assert.equal(e.t, 'Uno');
  assert.equal(e.n, 'T');
  assert.equal(e.x, 1);
  assert.deepEqual(e.s[0], ['como-se-juega', 'Cómo se juega', 'Texto uno.']);
  assert.equal(e.s[1][0], 'x');
});
