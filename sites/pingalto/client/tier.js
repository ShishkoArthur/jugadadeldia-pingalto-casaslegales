import { empty, move, serialize, parse } from '../../../engine/games/tier.mjs';
import { $, $$, data, out, fmt, esc, params, setParams } from './kit.js';

const D = data();
const board = $('#tl-board');
if (D && board) {
  const setSel = $('#tl-set'), title = $('#tl-title'), own = $('#tl-own'), ownTa = $('#tl-items'), pool = $('#tl-pool');
  const zones = i => (i === -1 ? pool : $('[data-zone="' + i + '"]', board));
  const COLORS = ['#ff8fb8', '#ffb98a', '#ffe08a', '#a8e6a1', '#9cd3ff', '#c3b2ff'];
  let set = D.sets[0], items = set.items, st = empty(items.length), picked = null;
  const ownItems = () => [...new Set(ownTa.value.split('\n').map(s => s.trim().slice(0, 24)).filter(Boolean))].slice(0, 40);
  const save = () => setParams({ l: serialize(set.id, st), t: title.value === 'Mi tier list' ? '' : title.value, n: set.id === 'libre' ? items.join('|') : '' });
  const tile = i => '<button type="button" class="pa-ti" data-i="' + i + '"' + (picked === i ? ' aria-pressed="true"' : '') + '>' + esc(items[i]) + '</button>';
  const draw = () => {
    st.rows.forEach((r, k) => { zones(k).innerHTML = r.map(tile).join(''); });
    pool.innerHTML = st.pool.map(tile).join('') || '<p class="pa-src">' + (items.length ? 'Ubicaste todo.' : 'Escribí tus nombres arriba.') + '</p>';
    out('left', fmt(st.pool.length, 0));
    out('copied', '');
  };
  const choose = (id, keep) => {
    set = D.sets.find(s => s.id === id) || D.sets[0];
    setSel.value = set.id;
    own.classList.toggle('pa-hide', set.id !== 'libre');
    items = set.id === 'libre' ? ownItems() : set.items;
    st = keep || empty(items.length);
    picked = null;
    draw();
  };
  const rowOf = i => st.rows.findIndex(r => r.includes(i));
  const place = (i, row, at) => { st = move(st, i, row, at); picked = null; draw(); save(); };
  const indexAt = (zone, x, y) => {
    const ts = $$('.pa-ti', zone);
    for (let k = 0; k < ts.length; k++) { const b = ts[k].getBoundingClientRect(); if (y < b.top) return k; if (y <= b.bottom && x < b.left + b.width / 2) return k; }
    return ts.length;
  };
  const tap = i => {
    if (picked === i) { picked = null; if (rowOf(i) !== -1) { place(i, -1); return; } draw(); return; }
    picked = i; draw();
  };
  let drag = null, skipUntil = 0;
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest('.pa-ti');
    if (!t || e.pointerType === 'touch' || e.button !== 0) return;
    drag = { i: Number(t.dataset.i), x: e.clientX, y: e.clientY, on: false, el: t };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.on) { drag.on = true; drag.ghost = drag.el.cloneNode(true); drag.ghost.className = 'pa-ti pa-gh'; document.body.append(drag.ghost); drag.el.classList.add('pa-dg'); }
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
  });
  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.on) return;
    d.ghost.remove(); d.el.classList.remove('pa-dg');
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const row = under && under.closest('[data-row],[data-zone]');
    if (!row) return;
    const k = Number(row.dataset.row ?? row.dataset.zone);
    place(d.i, k, k === -1 ? null : indexAt(zones(k), e.clientX, e.clientY));
    skipUntil = performance.now() + 120;
  });
  document.addEventListener('click', e => {
    if (performance.now() < skipUntil) return;
    const t = e.target.closest('.pa-ti');
    if (t && (board.contains(t) || pool.contains(t))) { tap(Number(t.dataset.i)); return; }
    const p = e.target.closest('[data-place],[data-zone]');
    if (p && picked != null) { const k = Number(p.dataset.place ?? p.dataset.zone); place(picked, k); }
  });
  setSel.addEventListener('change', () => { choose(setSel.value); save(); });
  ownTa.addEventListener('input', () => { if (set.id !== 'libre') return; const old = items; items = ownItems(); const keep = empty(items.length); st.rows.forEach((r, k) => r.forEach(i => { const j = items.indexOf(old[i]); if (j >= 0) keep.rows[k].push(j); })); keep.pool = keep.pool.filter(j => !keep.rows.some(r => r.includes(j))); st = keep; draw(); save(); });
  title.addEventListener('input', save);
  const copy = async (text, msg) => { let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; } out('copied', ok ? msg : 'Copiá la dirección de la barra del navegador'); };
  const png = () => {
    const W = 1080, P = 24, L = 96, TH = 46, G = 10, c = document.createElement('canvas'), x = c.getContext('2d');
    const font = '600 22px "Be Vietnam Pro", system-ui, sans-serif';
    x.font = font;
    const layout = st.rows.map(r => { const lines = [[]]; let w = 0; for (const i of r) { const tw = Math.min(W - L - P * 3, x.measureText(items[i]).width + 28); if (w + tw > W - L - P * 3 && lines.at(-1).length) { lines.push([]); w = 0; } lines.at(-1).push([i, tw]); w += tw + G; } return lines; });
    const heights = layout.map(ls => Math.max(L, ls.length * (TH + G) + G));
    c.width = W; c.height = P * 2 + 64 + heights.reduce((a, b) => a + b + G, 0) + 30;
    x.fillStyle = '#f6f4fb'; x.fillRect(0, 0, W, c.height);
    x.fillStyle = '#1d1830'; x.font = '800 36px "M PLUS Rounded 1c", system-ui, sans-serif'; x.fillText(title.value || 'Mi tier list', P, P + 38);
    let y = P + 64;
    layout.forEach((ls, k) => {
      const hgt = heights[k];
      x.fillStyle = COLORS[k]; x.fillRect(P, y, L, hgt);
      x.fillStyle = '#1d1830'; x.font = '800 40px "M PLUS Rounded 1c", system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(D.rows[k], P + L / 2, y + hgt / 2 + 14); x.textAlign = 'left';
      x.fillStyle = '#ffffff'; x.fillRect(P + L, y, W - P * 2 - L, hgt);
      x.font = font;
      ls.forEach((line, li) => { let xx = P + L + G; const yy = y + G + li * (TH + G); for (const [i, tw] of line) { x.fillStyle = '#f1eef8'; x.fillRect(xx, yy, tw, TH); x.fillStyle = '#1d1830'; x.fillText(items[i], xx + 14, yy + 31, tw - 28); xx += tw + G; } });
      y += hgt + G;
    });
    x.fillStyle = '#554d6b'; x.font = '400 18px "Be Vietnam Pro", system-ui, sans-serif'; x.fillText('pingalto.com/tier-list', P, c.height - P + 4);
    const a = document.createElement('a'); a.download = 'tier-list.png'; a.href = c.toDataURL('image/png'); document.body.append(a); a.click(); a.remove();
    out('copied', 'Imagen lista');
  };
  $$('[data-tl]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.tl === 'png') png();
    if (b.dataset.tl === 'link') { save(); copy(location.href, 'Link copiado'); }
    if (b.dataset.tl === 'reset') { st = empty(items.length); picked = null; draw(); save(); }
  }));
  const q = params();
  if (q.get('t')) title.value = q.get('t').slice(0, 40);
  if (q.get('n')) ownTa.value = q.get('n').split('|').join('\n');
  const parsed = parse(q.get('l') || '', 0);
  const sid = parsed.set && D.sets.some(s => s.id === parsed.set) ? parsed.set : D.sets[0].id;
  const n = sid === 'libre' ? ownItems().length : D.sets.find(s => s.id === sid).items.length;
  choose(sid, q.get('l') ? parse(q.get('l'), n).state : null);
}
