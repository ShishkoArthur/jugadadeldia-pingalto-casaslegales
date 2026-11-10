import { esc, load, stale, stamp, fail, arDay, arTime, dayName, today } from './fdkit.js';
import { fmt, fmtPct } from '../../../engine/games/num.mjs';
import { wilson, below } from '../../../engine/games/stats.mjs';
import { artBase, face, label, chip, noArt, pic } from './crcard.js';

const TYPE = { 26: 'Tropa', 27: 'Estructura', 28: 'Hechizo' };
const typeOf = id => TYPE[String(id).slice(0, 2)] || 'Otra';
const tc = s => String(s).toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const mode = s => String(s).replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
const pct = (a, b) => fmtPct(b ? a / b : 0, 0);
const bar = (v, max) => '<i style="--v:' + Math.round((v / (max || 1)) * 100) + '"></i>';
const thumb = (c, base) => base && c.img ? '<img class="pa-blim" src="' + esc(base + c.img) + '" alt="" width="285" height="420" loading="lazy" decoding="async">' : '';

async function clashMeta(el) {
  const [doc, cd] = await Promise.all([load(el.dataset.fdSrc, 'clashmeta'), load(el.dataset.fdSrc, 'clash')]);
  const d = doc.data, byId = new Map(cd.data.cards.map(c => [c.id, c])), base = artBase(el);
  noArt(el);
  const card = id => byId.get(id) || { id, n: 'Carta ' + id, e: null, r: 'common' };
  const n = Number(el.dataset.n) || 20;
  const avg = ids => ids.reduce((t, id) => t + (card(id).e || 0), 0) / ids.length;
  const top = d.cards.slice(0, n);
  let h = stamp(doc, 72) + '<div class="pa-evk"><div><small>Mazos mirados</small><b>' + d.n + '</b></div><div><small>Clanes del top argentino</small><b>' + d.clans + '</b></div><div><small>Elixir promedio de esos mazos</small><b>' + fmt(d.all.reduce((t, x) => t + avg(x), 0) / d.all.length, 2) + '</b></div></div>';
  h += '<h3 class="pa-fdh3">Las cartas más usadas</h3><ul class="pa-bl">' + top.map(c => '<li><span>' + thumb(card(c.id), base) + esc(card(c.id).n) + '</span>' + bar(c.n, d.n) + '<b>' + pct(c.n, d.n) + '</b></li>').join('') + '</ul><p class="pa-src">Porcentaje de los ' + d.n + ' mazos que llevan la carta.</p>';
  if (el.dataset.decks !== 'no') h += '<h3 class="pa-fdh3">Mazos repetidos</h3>' + (d.decks.length ? d.decks.map(k => '<div class="pa-c pa-dk"><p class="pa-x">' + k.n + ' jugadores · elixir ' + fmt(avg(k.ids), 1) + '</p><div class="pa-crs pa-crdk">' + k.ids.map(id => chip(card(id), base, typeOf(id))).join('') + '</div></div>').join('') : '<p>Hoy ningún mazo se repite exacto entre estos jugadores: cada uno juega el suyo.</p>');
  el.innerHTML = h;
}

async function mazos(el) {
  const [cd, mt] = await Promise.all([load(el.dataset.fdSrc, 'clash'), load(el.dataset.fdSrc, 'clashmeta').catch(() => null)]);
  const cards = cd.data.cards, byId = new Map(cards.map(c => [c.id, c])), base = artBase(el);
  noArt(el);
  const deck = [];
  const q0 = new URLSearchParams(location.search).get('m');
  if (q0) for (const id of q0.split('-').map(Number)) if (byId.has(id) && !deck.includes(id) && deck.length < 8) deck.push(id);
  let q = '';
  const pick = el.querySelector('[data-pick]'), out = el.querySelector('[data-deck]');
  const drawPick = () => {
    const list = cards.filter(c => !q || c.n.toLowerCase().includes(q));
    if (!pick.querySelector('[data-list]')) pick.innerHTML = '<div class="pa-fdf"><label class="pa-f"><span>Buscar carta</span><input type="search" data-q value="' + esc(q) + '" placeholder="Hog Rider" autocomplete="off"></label></div><div data-list></div>';
    pick.querySelector('[data-list]').innerHTML = '<ul class="pa-crs pa-crpk pa-scr">' + list.map(c => { const i = deck.indexOf(c.id); return '<li><button type="button" class="pa-crd pa-cr-' + c.r + '" data-id="' + c.id + '" aria-pressed="' + (i >= 0) + '" aria-label="' + esc(label(c)) + '">' + face(c, base) + '<span class="pa-crn">' + esc(c.n) + '</span><small>' + typeOf(c.id) + '</small><s class="pa-crk" aria-hidden="true">' + (i >= 0 ? i + 1 : '') + '</s></button></li>'; }).join('') + '</ul>';
  };
  const drawDeck = () => {
    const cs = deck.map(id => byId.get(id));
    try { const u = new URL(location.href); if (cs.length) u.searchParams.set('m', deck.join('-')); else u.searchParams.delete('m'); history.replaceState(null, '', u); } catch (e) { }
    if (!cs.length) { out.innerHTML = '<p class="pa-note">Tocá ocho cartas de la lista y te armamos el análisis. También podés pegar el link de un mazo que armaste acá.</p>'; return; }
    const ex = cs.map(c => c.e).filter(x => x !== null);
    const avg = ex.reduce((a, b) => a + b, 0) / (ex.length || 1);
    const cyc = [...ex].sort((a, b) => a - b).slice(0, 4).reduce((a, b) => a + b, 0);
    const curve = [1, 2, 3, 4, 5, 6, 7].map(e => cs.filter(c => (e === 7 ? c.e >= 7 : c.e === e)).length);
    const types = ['Tropa', 'Estructura', 'Hechizo'].map(t => [t, cs.filter(c => typeOf(c.id) === t).length]);
    let h = '<div class="pa-evk"><div><small>Cartas</small><b>' + cs.length + ' de 8</b></div><div><small>Elixir promedio</small><b>' + fmt(avg, 2) + '</b></div>' + (cs.length === 8 ? '<div><small>Ciclo (4 más baratas)</small><b>' + cyc + '</b></div>' : '') + types.map(([t, k]) => '<div><small>' + t + (k === 1 ? '' : t === 'Estructura' ? 's' : 's') + '</small><b>' + k + '</b></div>').join('') + '</div>';
    h += '<div class="pa-two"><div><h3 class="pa-fdh3">Curva de elixir</h3><div class="pa-cv7">' + curve.map((k, i) => '<div><i style="--v:' + Math.round((k / 8) * 100) + '"></i><b>' + k + '</b><small>' + (i === 6 ? '7+' : i + 1) + '</small></div>').join('') + '</div></div>';
    if (mt && cs.length === 8) {
      const d = mt.data, avgs = d.all.map(x => { const e = x.map(id => (byId.get(id) || {}).e).filter(v => v != null); return e.reduce((a, b) => a + b, 0) / (e.length || 1); });
      const share = id => (d.cards.find(c => c.id === id) || { n: 0 }).n / d.n;
      const best = d.all.map(x => ({ x, k: x.filter(id => deck.includes(id)).length })).sort((a, b) => b.k - a.k)[0];
      const b = below(avgs, avg);
      h += '<div><h3 class="pa-fdh3">Contra el top argentino</h3><p>Tu elixir promedio es más alto que el de ' + fmtPct(b, 0) + ' de los ' + d.n + ' mazos del top argentino' + (b > 0.8 ? ': es un mazo pesado para ese nivel.' : b < 0.2 ? ': es un mazo de ciclo rápido para ese nivel.' : '.') + '</p><ul class="pa-bl">' + cs.slice().sort((x, y) => share(y.id) - share(x.id)).map(c => '<li><span>' + esc(c.n) + '</span>' + bar(share(c.id), 1) + '<b>' + fmtPct(share(c.id), 0) + '</b></li>').join('') + '</ul><p class="pa-src">Cuántos mazos del top argentino llevan cada carta tuya. El más parecido comparte ' + best.k + ' de 8 cartas con el tuyo.</p></div>';
    } else h += '<div><h3 class="pa-fdh3">Contra el top argentino</h3><p>Completá las ocho cartas para compararlo con los mazos de los mejores jugadores de Argentina.</p></div>';
    h = '<ul class="pa-crs pa-crdk">' + cs.map(c => '<li><button type="button" class="pa-crd pa-crm pa-cr-' + c.r + '" data-id="' + c.id + '" aria-label="' + esc('Sacar ' + c.n) + '">' + face(c, base) + '<span class="pa-crn">' + esc(c.n) + '</span><small>sacar</small></button></li>').join('') + '</ul>' + h + '</div>';
    out.innerHTML = h;
  };
  const toggle = id => { const i = deck.indexOf(id); if (i >= 0) deck.splice(i, 1); else if (deck.length < 8) deck.push(id); drawPick(); drawDeck(); };
  const click = ev => { const b = ev.target.closest('[data-id]'); if (b) toggle(Number(b.dataset.id)); };
  pick.addEventListener('click', click); out.addEventListener('click', click);
  pick.addEventListener('input', ev => { if (ev.target.matches('[data-q]')) { q = ev.target.value.trim().toLowerCase(); drawPick(); } });
  el.querySelector('[data-clear]').addEventListener('click', () => { deck.length = 0; drawPick(); drawDeck(); });
  el.querySelector('[data-top]').addEventListener('click', () => {
    if (!mt) return;
    const d = mt.data, k = d.decks[0] ? d.decks[0].ids : d.cards.slice(0, 8).map(c => c.id);
    deck.length = 0; for (const id of k) if (byId.has(id)) deck.push(id); drawPick(); drawDeck();
  });
  drawPick(); drawDeck();
}

async function brawlMeta(el) {
  const [doc, br] = await Promise.all([load(el.dataset.fdSrc, 'brawlmeta'), load(el.dataset.fdSrc, 'brawl').catch(() => null)]);
  const d = doc.data, n = Number(el.dataset.n) || 0, base = artBase(el);
  noArt(el);
  const imgs = new Map(br ? br.data.brawlers.map(b => [b.id, b.img]) : []), art = (br && br.data.art) || { maps: {}, modes: {} };
  const name = id => tc((d.brawlers.find(b => b.id === id) || { n: '#' + id }).n);
  const who = id => '<span class="pa-bsw">' + (base ? pic(base, imgs.get(id), 'pa-bsp') || '<i class="pa-bsp" aria-hidden="true"></i>' : '') + '<b>' + esc(name(id)) + '</b></span>';
  const gi = k => pic(base, art.modes && art.modes[k], 'pa-bsg', 161, 137);
  const wr = x => { if (x.d < 10) return '<span class="pa-x">pocas partidas</span>'; const [lo, hi] = wilson(x.w, x.d); return fmtPct(x.w / x.d, 0) + ' <small>(' + fmtPct(lo, 0) + ' a ' + fmtPct(hi, 0) + ')</small>'; };
  const table = (list, total) => '<div class="pa-tw"><table class="pa-tb"><thead><tr><th>Brawler</th><th class="pa-n">Elegido</th><th class="pa-n">Gana</th></tr></thead><tbody>' + list.map(x => '<tr><td>' + who(x.id) + '</td><td class="pa-n">' + pct(x.u, total) + '</td><td class="pa-n">' + wr(x) + '</td></tr>').join('') + '</tbody></table></div>';
  let h = stamp(doc, 72) + '<div class="pa-evk"><div><small>Jugadores del top argentino</small><b>' + d.players + '</b></div><div><small>Partidas contadas</small><b>' + fmt(d.battles, 0) + '</b></div><div><small>Desde</small><b>' + esc(dayName(arDay(d.from)) + ' ' + arTime(d.from)) + '</b></div></div>';
  if (n) { el.innerHTML = h + '<ul class="pa-bl">' + d.brawlers.slice(0, n).map(b => '<li><span>' + (base ? pic(base, imgs.get(b.id), 'pa-blim', 170, 170) || '<i class="pa-blim" aria-hidden="true"></i>' : '') + esc(tc(b.n)) + '</span>' + bar(b.u, d.brawlers[0].u) + '<b>' + pct(b.u, d.battles) + '</b></li>').join('') + '</ul>'; return; }
  const now = Date.now();
  const rot = br && !stale(br, 6) ? br.data.events.filter(e => Date.parse(e.end) > now && e.map) : [];
  const onNow = rot.map(e => ({ e, m: d.maps.find(m => m.map === e.map && m.mode === e.mode) })).filter(x => x.m);
  if (onNow.length) h += '<h3 class="pa-fdh3">En los mapas de la rotación de ahora</h3><div class="pa-two">' + onNow.map(({ e, m }) => '<div class="pa-c pa-bsmc">' + (base && e.mi ? '<span class="pa-bsm">' + pic(base, e.mi, '', 690, 1050) + '</span>' : '') + '<p class="pa-x">' + gi(e.mode) + esc(mode(e.mode)) + ' · cambia ' + esc(arDay(e.end) === today() ? 'hoy' : dayName(arDay(e.end))) + ' ' + arTime(e.end) + '</p><h4>' + esc(e.map) + '</h4>' + table(m.top.slice(0, 5), m.n) + '<p class="pa-src">' + m.n + ' partidas en este mapa.</p></div>').join('') + '</div>';
  h += '<h3 class="pa-fdh3">Por modo</h3><div class="pa-seg" role="group" aria-label="Modo">' + d.modes.map((m, i) => '<button type="button" data-m="' + i + '" aria-pressed="' + (i === 0) + '">' + gi(m.k) + esc(mode(m.k)) + ' · ' + m.n + '</button>').join('') + '</div><div data-mode></div>';
  h += '<h3 class="pa-fdh3">Todos los brawlers que eligieron</h3>' + table(d.brawlers.slice(0, 30), d.battles);
  el.innerHTML = h;
  const box = el.querySelector('[data-mode]');
  const show = i => { el.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === String(i)))); const m = d.modes[i]; box.innerHTML = table(m.top, m.n) + '<p class="pa-src">' + m.n + ' partidas de ' + esc(mode(m.k)) + '. «Elegido»: de esas partidas, en cuántas el jugador del top llevó ese brawler.</p>'; };
  el.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) show(Number(b.dataset.m)); });
  if (d.modes.length) show(0);
}

const MODES = { clashmeta: clashMeta, mazos, brawlmeta: brawlMeta };
for (const el of document.querySelectorAll('[data-fd]')) { const f = MODES[el.dataset.fd]; if (f) f(el).catch(() => fail(el)); }
