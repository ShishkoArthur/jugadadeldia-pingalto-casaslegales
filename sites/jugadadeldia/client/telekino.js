import { $, $$, page, store, oneIn } from './kit.js';

const D = page();
const box = $('[data-tk]');
const out = k => $('[data-o="' + k + '"]');
let mode = 'm';
const st = { m: new Set(), d: new Set() };
function saved() { try { const v = JSON.parse(store.get(D.key) || '[]'); return Array.isArray(v) ? v.slice(0, 5) : []; } catch (e) { return []; } }
function render() {
  $$('[data-n]', box).forEach(b => {
    const n = +b.dataset.n;
    b.classList.toggle('m', st.m.has(n)); b.classList.toggle('d', st.d.has(n));
    b.setAttribute('aria-pressed', st[mode].has(n) ? 'true' : 'false');
  });
  out('count').textContent = (mode === 'm' ? 'Tu cartón: ' + st.m.size : 'Salieron: ' + st.d.size) + ' de ' + (mode === 'm' ? D.pick : D.drawn) + '.';
  const hits = [...st.m].filter(n => st.d.has(n)).length;
  const sorteo = $('select[name=s]', box).value;
  $$('tr[data-h]').forEach(tr => tr.classList.toggle('on', sorteo === 'tk' && +tr.dataset.h === hits && st.m.size === D.pick && st.d.size === D.drawn));
  if (st.m.size !== D.pick || st.d.size !== D.drawn) { out('hits').textContent = '-'; out('cat').textContent = 'Marcá los ' + D.pick + ' números de tu cartón y los ' + D.drawn + ' que salieron (botón «Los que salieron»).'; return; }
  out('hits').textContent = hits;
  if (sorteo === 'rk') out('cat').textContent = 'En el Rekino gana el que más acierte: con ' + hits + ' aciertos dependés de los demás cartones. Un cartón cualquiera hace exactamente ' + hits + ' aciertos ' + oneIn(D.odds[hits]) + ' veces.';
  else out('cat').textContent = D.win.includes(hits) ? 'Con ' + hits + ' aciertos tu cartón tiene premio en el Telekino. El monto sale del extracto oficial.' : 'Con ' + hits + ' aciertos no hay premio en el Telekino: hace falta ' + Math.min(...D.win) + ' o más.';
}
function chips() {
  const list = saved();
  out('saved').innerHTML = list.map((c, i) => '<li><button class="jg-b s" type="button" data-load="' + i + '">Cartón ' + (i + 1) + '</button></li>').join('');
}
if (box) {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-n]');
    if (b) { const n = +b.dataset.n, s = st[mode], cap = mode === 'm' ? D.pick : D.drawn; if (s.has(n)) s.delete(n); else if (s.size < cap) s.add(n); render(); return; }
    const m = e.target.closest('[data-mode]');
    if (m) { mode = m.dataset.mode; $$('[data-mode]', box).forEach(x => x.setAttribute('aria-pressed', x === m ? 'true' : 'false')); render(); }
    if (e.target.closest('[data-clear]')) { st[mode].clear(); render(); }
    if (e.target.closest('[data-save]') && st.m.size === D.pick) { const l = saved(); l.unshift([...st.m].sort((a, c) => a - c)); store.set(D.key, JSON.stringify(l.slice(0, 5))); chips(); }
    const l = e.target.closest('[data-load]');
    if (l) { st.m = new Set(saved()[+l.dataset.load]); render(); }
  });
  box.addEventListener('change', render);
  $('[data-paste]', box).addEventListener('input', e => {
    const v = [...new Set((e.target.value.match(/\d+/g) || []).map(Number).filter(n => n >= 1 && n <= D.pool))].slice(0, D.drawn);
    st.d = new Set(v); render();
  });
  const l = saved(); if (l.length) st.m = new Set(l[0]);
  chips(); render();
}
