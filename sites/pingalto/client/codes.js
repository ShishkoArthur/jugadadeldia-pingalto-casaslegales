import { $, $$, data, out } from './kit.js';

const ZW = String.fromCharCode(0x200b) + '-' + String.fromCharCode(0x200d) + String.fromCharCode(0x2060) + String.fromCharCode(0xfeff);
const INV = new RegExp('[\\s' + ZW + '-]', 'g');
const D = data();
const f = $('#pa-cf');
if (D && f) {
  const inp = $('#cf-in'), copy = $('[data-copy="clean"]');
  const run = () => {
    const raw = inp.value;
    const clean = raw.replace(INV, '').toUpperCase();
    copy.hidden = true;
    out('clean', '');
    if (!raw.trim()) { out('st', '-'); out('say', 'Pegá un código y te decimos si cumple el formato que pide Garena.'); return; }
    const bad = [...clean].filter(c => !/[A-Z0-9]/.test(c));
    const okLen = D.len.includes(clean.length);
    const notes = [];
    if (raw.replace(/\s/g, '') !== raw.replace(/\s/g, '').toUpperCase()) notes.push('tenía minúsculas y lo pasamos a mayúsculas');
    if (new RegExp(INV.source).test(raw)) notes.push('le sacamos espacios, guiones o caracteres invisibles');
    if (!bad.length && okLen) {
      out('st', 'Formato correcto');
      out('say', clean.length + ' caracteres, solo mayúsculas y números' + (notes.length ? ' (' + notes.join('; ') + ')' : '') + '. Ahora probalo en el sitio oficial: solo ahí sabés si es válido, si venció o si es de tu región.');
      out('clean', clean); copy.hidden = false;
    } else {
      out('st', 'No cumple el formato');
      const why = [];
      if (bad.length) why.push('tiene caracteres que no son letras ni números: ' + [...new Set(bad)].join(' '));
      if (!okLen) why.push('tiene ' + clean.length + ' caracteres y Garena dice ' + D.len.join(' o '));
      out('say', 'El código ' + why.join(' y ') + '. Si te lo pasaron así, desconfiá.');
    }
  };
  inp.addEventListener('input', run);
  f.addEventListener('submit', e => e.preventDefault());
  copy.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText($('[data-o="clean"]').textContent); ok = true; } catch (e) { ok = false; }
    out('copied', ok ? 'Copiado' : 'Seleccionalo y copialo a mano');
  });
  const box = $('#pa-sc');
  if (box) box.addEventListener('change', () => {
    const n = $$('input:checked', box).length;
    out('scam', n === 0 ? 'Si marcás una sola, ya es para desconfiar.' : n === 1 ? 'Una señal de estafa. No sigas: cortá la conversación.' : n + ' señales de estafa. Es una estafa: no pases nada más y, si ya pasaste algo, mirá abajo dónde denunciarlo.');
  });
}
