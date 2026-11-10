import { esc, load, stale, stamp, fail, arTime, arDay, dayName, today } from './fdkit.js';
import { fmt, parseNum } from '../../../engine/games/num.mjs';
import { RAR, RORD, artBase, face, label, noArt, pic } from './crcard.js';

const PL = { common: 'comunes', rare: 'especiales', epic: 'épicas', legendary: 'legendarias', champion: 'campeones' };

async function clash(el) {
  const doc = await load(el.dataset.fdSrc, 'clash'), d = doc.data;
  const base = artBase(el);
  const deckEl = document.querySelector('[data-fd-deck]');
  const deck = [];
  const mzEl = deckEl && deckEl.querySelector('[data-mz]'), mz = mzEl && mzEl.getAttribute('href');
  let r = '', e = '', q = '', evo = false, last = null, msg = '';
  const added = new Set(d.added || []);
  const byId = new Map(d.cards.map(c => [c.id, c]));
  const tot = {}; for (const c of d.cards) tot[c.r] = (tot[c.r] || 0) + 1;
  el.innerHTML = stamp(doc, 72) +
    '<p class="pa-x">' + d.cards.length + ' cartas: ' + RORD.filter(k => tot[k]).map(k => tot[k] + ' ' + (tot[k] === 1 ? RAR[k].toLowerCase() : PL[k])).join(', ') + ' · ' + d.cards.filter(c => c.evo).length + ' con evolución</p>' +
    '<div class="pa-fdf pa-czf"><label class="pa-f pa-czq"><span>Buscar</span><input type="search" data-q placeholder="Knight" autocomplete="off"></label>' +
    '<label class="pa-f"><span>Rareza</span><select data-r><option value="">Todas</option>' + RORD.map(k => '<option value="' + k + '">' + RAR[k] + '</option>').join('') + '</select></label>' +
    '<label class="pa-f"><span>Elixir</span><select data-e><option value="">Todos</option>' + [1, 2, 3, 4, 5, 6, 7].map(x => '<option value="' + x + '">' + (x === 7 ? '7 o más' : x) + '</option>').join('') + '</select></label>' +
    '<label class="pa-czv"><input type="checkbox" data-v><span>Solo con evolución</span></label></div><p class="pa-x pa-czn" data-n aria-live="polite"></p><div data-list></div>';
  const box = el.querySelector('[data-list]'), count = el.querySelector('[data-n]');
  const draw = () => {
    const cards = d.cards.filter(c => (!r || c.r === r) && (e === '' || String(c.e) === e || (e === '7' && c.e >= 7)) && (!q || c.n.toLowerCase().includes(q)) && (!evo || c.evo));
    count.textContent = cards.length === d.cards.length ? '' : cards.length + (cards.length === 1 ? ' carta' : ' cartas') + ' con esos filtros';
    box.innerHTML = '<ul class="pa-crs">' + cards.map(c => '<li><button type="button" class="pa-crd pa-cr-' + c.r + '" data-id="' + c.id + '" aria-pressed="false" aria-label="' + esc(label(c)) + '">' + face(c, base, evo) +
        '<span class="pa-crn">' + esc(c.n) + '</span><small>' + RAR[c.r] + ' · máx. ' + c.max + (added.has(c.id) ? ' · <b>nueva</b>' : '') + '</small><s class="pa-crk" aria-hidden="true"></s></button></li>').join('') + '</ul>' + (cards.length ? '' : '<p>Ninguna carta con esos filtros.</p>');
    mark();
  };
  const mark = () => {
    for (const b of box.querySelectorAll('.pa-crd')) {
      const id = Number(b.dataset.id), i = deck.indexOf(id);
      b.setAttribute('aria-pressed', String(i >= 0));
      b.lastElementChild.textContent = i >= 0 ? String(i + 1) : '';
      b.classList.toggle('pa-crhit', id === last);
    }
  };
  const drawDeck = () => {
    if (!deckEl) return;
    const cs = deck.map(id => byId.get(id)).filter(Boolean);
    const ev = cs.map(c => c.e).filter(x => x !== null);
    const avg = ev.reduce((a, b) => a + b, 0) / (ev.length || 1);
    const cyc = [...ev].sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0);
    const slots = Array.from({ length: 8 }, (_, i) => {
      const c = cs[i];
      if (!c) return '<li><span class="pa-czs0">' + (i + 1) + '</span></li>';
      return '<li><button type="button" class="pa-crd pa-crm pa-cr-' + c.r + (c.id === last ? ' pa-crhit' : '') + '" data-id="' + c.id + '" aria-label="' + esc('Sacar ' + c.n) + '">' + face(c, base) + '</button></li>';
    }).join('');
    deckEl.innerHTML = '<div class="pa-czh"><h2>Tu mazo</h2><span>' + cs.length + ' de 8</span></div><ol class="pa-czs">' + slots + '</ol>' +
      '<p class="pa-czm"><span>Elixir promedio <b>' + (cs.length ? fmt(avg, 1) : '-') + '</b></span><span>Ciclo <b>' + (cs.length === 8 && ev.length >= 4 ? cyc : '-') + '</b></span></p>' +
      '<p class="pa-czt" role="status">' + (msg || (cs.length ? (cs.length < 8 ? 'Te faltan ' + (8 - cs.length) + '. Tocá una del mazo para sacarla.' : 'Mazo completo. Tocá una del mazo para cambiarla.') : 'Tocá una carta de la lista y entra acá.')) + '</p>' +
      (cs.length ? '<p class="pa-czb"><button type="button" data-clear>Vaciar</button>' + (mz ? '<a href="' + esc(mz) + '?m=' + deck.join('-') + '">Analizar este mazo</a>' : '') + '</p>' : '');
  };
  const toggle = (id, from) => {
    const c = byId.get(id), i = deck.indexOf(id);
    if (i >= 0) { deck.splice(i, 1); last = null; msg = 'Sacaste ' + c.n + '.'; }
    else if (deck.length < 8) { deck.push(id); last = id; msg = c.n + ' entró en el lugar ' + deck.length + '.'; }
    else { last = null; msg = 'El mazo ya tiene 8: tocá una del mazo para sacarla.'; if (from) { from.classList.remove('pa-crfull'); void from.offsetWidth; from.classList.add('pa-crfull'); } drawDeck(); return; }
    mark(); drawDeck();
  };
  el.addEventListener('input', ev => { if (ev.target.matches('[data-q]')) { q = ev.target.value.trim().toLowerCase(); draw(); } });
  el.addEventListener('change', ev => {
    if (ev.target.matches('[data-r]')) r = ev.target.value;
    else if (ev.target.matches('[data-e]')) e = ev.target.value;
    else if (ev.target.matches('[data-v]')) evo = ev.target.checked;
    else return;
    draw();
  });
  el.addEventListener('click', ev => { const b = ev.target.closest('[data-list] .pa-crd'); if (b) toggle(Number(b.dataset.id), b); });
  if (deckEl) deckEl.addEventListener('click', ev => {
    if (ev.target.closest('[data-clear]')) { deck.length = 0; last = null; msg = 'Mazo vacío.'; mark(); drawDeck(); return; }
    const b = ev.target.closest('.pa-crd'); if (b) toggle(Number(b.dataset.id), b);
  });
  noArt(el); if (deckEl) noArt(deckEl);
  draw(); drawDeck();
}

const tc = s => String(s).toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
async function brawl(el) {
  const doc = await load(el.dataset.fdSrc, 'brawl'), d = doc.data, base = artBase(el);
  let q = '';
  noArt(el);
  const draw = () => {
    const list = d.brawlers.filter(b => !q || b.n.toLowerCase().includes(q)).sort((a, b) => a.n < b.n ? -1 : 1);
    const newest = d.brawlers.find(b => b.id === d.newest);
    const box = el.querySelector('[data-list]');
    if (!box) {
      el.innerHTML = stamp(doc, 30) + '<p class="pa-x">' + d.brawlers.length + ' brawlers · el más nuevo en la API: <b>' + esc(tc(newest.n)) + '</b></p>' +
      '<div class="pa-fdf"><label class="pa-f"><span>Buscar</span><input type="search" data-q value="' + esc(q) + '" placeholder="Shelly" autocomplete="off"></label></div><div data-list></div>';
      return draw();
    }
    box.innerHTML = '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Brawler</th><th>Habilidades estelares</th><th>Gadgets</th></tr></thead><tbody>' +
      list.map(b => '<tr><td><span class="pa-bsw">' + (base ? pic(base, b.img, 'pa-bsp') || '<i class="pa-bsp" aria-hidden="true"></i>' : '') + '<span><b>' + esc(tc(b.n)) + '</b>' + (b.id === d.newest ? ' <span class="pa-tag">nuevo</span>' : '') + '</span></span></td><td>' + b.sp.map(x => esc(tc(x))).join('<br>') + '</td><td>' + b.gd.map(x => esc(tc(x))).join('<br>') + '</td></tr>').join('') + '</tbody></table></div>';
  };
  el.addEventListener('input', ev => { if (ev.target.matches('[data-q]')) { q = ev.target.value.trim().toLowerCase(); draw(); } });
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
  const doc = await load(el.dataset.fdSrc, 'brawl'), d = doc.data, base = artBase(el);
  noArt(el);
  const draw = () => {
    if (stale(doc, 6)) { el.innerHTML = stamp(doc, 6); return; }
    const now = Date.now(), t = today();
    const ev = d.events.filter(e => Date.parse(e.end) > now);
    const when = iso => (arDay(iso) === t ? 'hoy' : dayName(arDay(iso))) + ' a las ' + arTime(iso);
    el.innerHTML = stamp(doc, 6) + '<ul class="pa-fdev">' + ev.map(e => '<li class="pa-bse">' + (base && e.mi ? '<span class="pa-bsm">' + pic(base, e.mi, '', 690, 1050) + '</span>' : '') + '<small>' + pic(base, e.gi, 'pa-bsg', 161, 137) + esc(mode(e.mode)) + '</small><b>' + esc(e.map || 'Mapa a confirmar') + '</b><span>Cambia ' + esc(when(e.end)) + ' · faltan ' + left(Date.parse(e.end) - now) + '</span>' + (e.mod && e.mod.length ? '<span>' + e.mod.map(mode).map(esc).join(', ') + '</span>' : '') + '</li>').join('') + '</ul>' + (ev.length ? '' : '<p>La rotación que tenemos ya terminó: esperamos la próxima copia.</p>');
  };
  draw();
  setInterval(draw, 60000);
}

const MODES = { clash, brawl, 'brawl-top': brawlTop, 'brawl-events': brawlEvents };
for (const el of document.querySelectorAll('[data-fd]')) { const f = MODES[el.dataset.fd]; if (f) f(el).catch(() => fail(el)); }
