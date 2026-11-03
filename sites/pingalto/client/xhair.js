import { encode, decode, convars, previewSvg, DEFAULTS } from '../../../engine/games/xhair.mjs';
import { $, $$, data, out, params, setParams, fmt, esc } from './kit.js';

const D = data();
const f = $('#pa-xf');
if (D && f) {
  const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const rgb = s => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(s || ''); return m ? m.slice(1).map(x => parseInt(x, 16)) : [0, 0, 0]; };
  const read = () => {
    const x = { ...DEFAULTS };
    for (const el of $$('input[type=range]', f)) x[el.name] = Number(el.value);
    for (const el of $$('input[type=checkbox]', f)) x[el.name] = el.checked;
    for (const el of $$('select', f)) x[el.name] = Number(el.value);
    [x.red, x.green, x.blue] = rgb(f.elements.color.value);
    [x.outlineRed, x.outlineGreen, x.outlineBlue] = rgb(f.elements.ocolor.value);
    return x;
  };
  const write = x => {
    for (const el of $$('input[type=range]', f)) if (x[el.name] != null) { const v = Number(x[el.name]); if (v > Number(el.max)) el.max = String(v); if (v < Number(el.min)) el.min = String(v); el.value = String(v); }
    for (const el of $$('input[type=checkbox]', f)) el.checked = !!x[el.name];
    for (const el of $$('select', f)) if (x[el.name] != null) { if (![...el.options].some(o => Number(o.value) === x[el.name])) el.add(new Option(fmt(x[el.name], 0) + ' líneas', String(x[el.name]))); el.value = String(x[el.name]); }
    f.elements.color.value = hex(x.red, x.green, x.blue);
    f.elements.ocolor.value = hex(x.outlineRed, x.outlineGreen, x.outlineBlue);
  };
  const run = (push = true) => {
    const x = read();
    for (const el of $$('input[type=range]', f)) { const o = $('[data-v="' + el.name + '"]', f); if (o) o.textContent = fmt(Number(el.value), Number(el.dataset.d || 0)); }
    const code = encode(x);
    out('code', code);
    out('prev', previewSvg(x));
    out('cvars', esc(convars(x)));
    out('copied', '');
    if (push) setParams({ c: code });
  };
  const copy = async (text, msg) => { let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; } out('copied', ok ? msg : 'Seleccioná el texto y copialo a mano'); };
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copy($('[data-o="' + b.dataset.copy + '"]').textContent, b.dataset.copy === 'code' ? 'Código copiado' : 'Comandos copiados')));
  $('[data-pa-share]').addEventListener('click', () => copy(location.href, 'Link copiado'));
  const inp = $('#xh-in');
  inp.addEventListener('input', () => {
    const v = inp.value.trim();
    if (!v) { out('in', 'Solo códigos nuevos: empiezan con CS y tienen ' + fmt(D.len, 0) + ' caracteres.'); return; }
    if (/^CSGO-/i.test(v)) { out('in', 'Ese es un código viejo (CSGO-…): CS2 ya no lo importa. Armala de nuevo acá.'); return; }
    const x = decode(v);
    if (!x) { out('in', 'Ese código no es válido: revisá que esté completo.'); return; }
    write(x); run(); out('in', 'Listo: cargamos tu mira.');
  });
  f.addEventListener('input', () => run());
  f.addEventListener('change', () => run());
  f.addEventListener('submit', e => e.preventDefault());
  const start = decode(params().get('c') || '');
  if (start) write(start);
  run(!!start);
}
