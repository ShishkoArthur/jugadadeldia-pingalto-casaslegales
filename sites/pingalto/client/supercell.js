import { esc, load, stale, stamp, fail, arTime, arDay, dayName, today } from './fdkit.js';
import { fmt, parseNum } from '../../../engine/games/num.mjs';

const RAR = { common: 'Común', rare: 'Especial', epic: 'Épica', legendary: 'Legendaria', champion: 'Campeón' };
const RORD = ['common', 'rare', 'epic', 'legendary', 'champion'];
const PL = { common: 'comunes', rare: 'especiales', epic: 'épicas', legendary: 'legendarias', champion: 'campeones' };

async function clash(el) {
  const doc = await load(el.dataset.fdSrc, 'clash'), d = doc.data;
  const deckEl = document.querySelector('[data-fd-deck]');
  const deck = [];
  let r = '', e = '', q = '';
  const added = new Set(d.added || []);
  const draw = () => {
    const cards = d.cards.filter(c => (!r || c.r === r) && (e === '' || String(c.e) === e || (e === '7' && c.e >= 7)) && (!q || c.n.toLowerCase().includes(q)));
    const tot = {}; for (const c of d.cards) tot[c.r] = (tot[c.r] || 0) + 1;
    el.innerHTML = stamp(doc, 72) +
      '<p class="pa-x">' + d.cards.length + ' cartas: ' + RORD.filter(k => tot[k]).map(k => tot[k] + ' ' + (tot[k] === 1 ? RAR[k].toLowerCase() : PL[k])).join(', ') + ' · ' + d.cards.filter(c => c.evo).length + ' con evolución</p>' +
      '<div class="pa-fdf"><label class="pa-f"><span>Buscar</span><input type="search" data-q value="' + esc(q) + '" placeholder="Knight" autocomplete="off"></label>' +
      '<label class="pa-f"><span>Rareza</span><select data-r><option value="">Todas</option>' + RORD.map(k => '<option value="' + k + '"' + (k === r ? ' selected' : '') + '>' + RAR[k] + '</option>').join('') + '</select></label>' +
      '<label class="pa-f"><span>Elixir</span><select data-e><option value="">Todos</option>' + [1, 2, 3, 4, 5, 6, 7].map(x => '<option value="' + x + '"' + (String(x) === e ? ' selected' : '') + '>' + (x === 7 ? '7 o más' : x) + '</option>').join('') + '</select></label></div>' +
      '<ul class="pa-fdcs">' + cards.map(c => '<li><button type="button" class="pa-fdcd pa-fdr-' + c.r + '" data-id="' + c.id + '" aria-pressed="' + deck.includes(c.id) + '"><b>' + (c.e === null ? '?' : c.e) + '</b><span>' + esc(c.n) + '</span><small>' + RAR[c.r] + (c.evo ? ' · evo' : '') + (added.has(c.id) ? ' · nueva' : '') + '</small></button></li>').join('') + '</ul>' +
      (cards.length ? '' : '<p>Ninguna carta con esos filtros.</p>');
  };
  const drawDeck = () => {
    if (!deckEl) return;
    const cs = deck.map(id => d.cards.find(c => c.id === id)).filter(Boolean);
    if (!cs.length) { deckEl.innerHTML = '<p class="pa-note">Tocá hasta ocho cartas de la lista para armar un mazo.</p>'; return; }
    const ex = cs.map(c => c.e).filter(x => x !== null);
    const avg = ex.reduce((a, b) => a + b, 0) / (ex.length || 1);
    const cyc = [...ex].sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0);
    deckEl.innerHTML = '<p class="pa-fdbig"><span>Elixir promedio</span><b>' + fmt(avg, 1) + '</b>' + (cs.length === 8 && ex.length >= 4 ? '<span>Ciclo</span><b>' + cyc + '</b>' : '') + '</p><p class="pa-x">' + cs.length + ' de 8 cartas' + (cs.length < 8 ? ': el promedio es de las que elegiste' : '') + '</p>' +
      '<ul class="pa-fdcs">' + cs.map(c => '<li><button type="button" class="pa-fdcd pa-fdr-' + c.r + '" data-id="' + c.id + '" aria-pressed="true"><b>' + (c.e === null ? '?' : c.e) + '</b><span>' + esc(c.n) + '</span><small>sacar</small></button></li>').join('') + '</ul>';
  };
  const toggle = id => { const i = deck.indexOf(id); if (i >= 0) deck.splice(i, 1); else if (deck.length < 8) deck.push(id); draw(); drawDeck(); };
  el.addEventListener('input', ev => { if (ev.target.matches('[data-q]')) { q = ev.target.value.trim().toLowerCase(); const pos = ev.target.selectionStart; draw(); const i = el.querySelector('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); } });
  el.addEventListener('change', ev => { if (ev.target.matches('[data-r]')) { r = ev.target.value; draw(); } if (ev.target.matches('[data-e]')) { e = ev.target.value; draw(); } });
  const click = ev => { const b = ev.target.closest('.pa-fdcd'); if (b) toggle(Number(b.dataset.id)); };
  el.addEventListener('click', click);
  if (deckEl) deckEl.addEventListener('click', click);
  draw(); drawDeck();
}

const tc = s => String(s).toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
async function brawl(el) {
  const doc = await load(el.dataset.fdSrc, 'brawl'), d = doc.data;
  let q = '';
  const draw = () => {
    const list = d.brawlers.filter(b => !q || b.n.toLowerCase().includes(q)).sort((a, b) => a.n < b.n ? -1 : 1);
    const newest = d.brawlers.find(b => b.id === d.newest);
    el.innerHTML = stamp(doc, 30) + '<p class="pa-x">' + d.brawlers.length + ' brawlers · el más nuevo en la API: <b>' + esc(tc(newest.n)) + '</b></p>' +
      '<div class="pa-fdf"><label class="pa-f"><span>Buscar</span><input type="search" data-q value="' + esc(q) + '" placeholder="Shelly" autocomplete="off"></label></div>' +
      '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Brawler</th><th>Habilidades estelares</th><th>Gadgets</th></tr></thead><tbody>' +
      list.map(b => '<tr><td><b>' + esc(tc(b.n)) + '</b>' + (b.id === d.newest ? ' <span class="pa-tag">nuevo</span>' : '') + '</td><td>' + b.sp.map(x => esc(tc(x))).join('<br>') + '</td><td>' + b.gd.map(x => esc(tc(x))).join('<br>') + '</td></tr>').join('') + '</tbody></table></div>';
  };
  el.addEventListener('input', ev => { if (ev.target.matches('[data-q]')) { q = ev.target.value.trim().toLowerCase(); const pos = ev.target.selectionStart; draw(); const i = el.querySelector('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); } });
  draw();
}

async function brawlTop(el) {
  const doc = await load(el.dataset.fdSrc, 'brawl'), d = doc.data;
  if (!d.ar || !d.ar.at.length) { el.innerHTML = '<p>El ranking de Argentina no está disponible en este momento.</p>'; return; }
  const rows = d.ar.at;
  el.innerHTML = stamp(doc, 30) + '<div class="pa-tw"><table class="pa-tb"><thead><tr><th class="pa-n">Puesto en Argentina</th><th class="pa-n">Copas</th></tr></thead><tbody>' + rows.map(r => '<tr><td class="pa-n">' + r.rank + '</td><td class="pa-n">' + fmt(r.v, 0) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<div class="pa-fdf"><label class="pa-f"><span>Tus copas</span><input type="text" inputmode="numeric" data-t placeholder="' + fmt(rows[rows.length - 1].v, 0) + '" autocomplete="off"></label></div><p data-t-out class="pa-fdbig"></p>';
  const out = el.querySelector('[data-t-out]');
  el.addEventListener('input', ev => {
    if (!ev.target.matches('[data-t]')) return;
    const v = parseNum(ev.target.value, { whole: true });
    if (!(v >= 0)) { out.textContent = ''; return; }
    const above = rows.filter(r => r.v <= v);
    const last = rows[rows.length - 1];
    out.innerHTML = above.length ? '<span>Con ' + fmt(v, 0) + ' copas estarías</span><b>' + (above[0].rank === 1 ? 'primero' : 'entre los ' + above[0].rank + ' primeros') + '</b>' : '<span>Te faltan para el puesto ' + last.rank + '</span><b>' + fmt(last.v - v, 0) + ' copas</b>';
  });
}

const left = ms => { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h >= 24 ? Math.floor(h / 24) + ' d ' + (h % 24) + ' h' : h + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const mode = s => String(s).replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
async function brawlEvents(el) {
  const doc = await load(el.dataset.fdSrc, 'brawl'), d = doc.data;
  const draw = () => {
    if (stale(doc, 6)) { el.innerHTML = stamp(doc, 6); return; }
    const now = Date.now(), t = today();
    const ev = d.events.filter(e => Date.parse(e.end) > now);
    const when = iso => (arDay(iso) === t ? 'hoy' : dayName(arDay(iso))) + ' a las ' + arTime(iso);
    el.innerHTML = stamp(doc, 6) + '<ul class="pa-fdev">' + ev.map(e => '<li><small>' + esc(mode(e.mode)) + '</small><b>' + esc(e.map || 'Mapa a confirmar') + '</b><span>Cambia ' + esc(when(e.end)) + ' · faltan ' + left(Date.parse(e.end) - now) + '</span>' + (e.mod && e.mod.length ? '<span>' + e.mod.map(mode).map(esc).join(', ') + '</span>' : '') + '</li>').join('') + '</ul>' + (ev.length ? '' : '<p>La rotación que tenemos ya terminó: esperamos la próxima copia.</p>');
  };
  draw();
  setInterval(draw, 60000);
}

const MODES = { clash, brawl, 'brawl-top': brawlTop, 'brawl-events': brawlEvents };
for (const el of document.querySelectorAll('[data-fd]')) { const f = MODES[el.dataset.fd]; if (f) f(el).catch(() => fail(el)); }
