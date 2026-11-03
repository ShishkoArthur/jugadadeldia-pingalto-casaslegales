import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleText, normalize, decodeEntities, stripComments, hasQuote } from '../text.mjs';

test('visibleText drops tags, scripts and comments', () => {
  assert.equal(visibleText('<p>Hola <b>che</b></p><script>x</script><!-- y --><div>fin</div>'), 'Hola che fin');
  assert.equal(visibleText('<a href="#">cba.ejemplo.bet.ar</a>Visit'), 'cba.ejemplo.bet.arVisit');
});
test('entities and quotes', () => {
  assert.equal(decodeEntities('Resoluci&oacute;n &amp; m&aacute;s'), 'Resolución & más');
  assert.equal(normalize('«a»  “b”'), '«a» "b"');
  assert.equal(hasQuote('uno dos tres', false, 'dos  tres'), true);
  assert.equal(hasQuote('uno dos tres', false, 'dos cuatro'), false);
});
test('stripComments removes withdrawn entries', () => {
  assert.equal(stripComments('<li>a</li><!--<li>b</li>--><li>c</li>'), '<li>a</li><li>c</li>');
});
