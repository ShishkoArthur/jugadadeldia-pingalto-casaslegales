// /valorant/rangos and /lol/rangos - rank ladders from the publisher's support pages (quoted) and a progress calculator
// (engine/games/ladder.mjs, exact Markov chain). Shares of players per rank are shown only where the publisher states one.
import { progress } from '../../../engine/games/ladder.mjs';
import { fmt, fmtPct, fmtInput, quote, hero, ldPage, sec } from './parts.mjs';

const field = (id, label, input, note = '') => '<div class="pa-f"><label for="' + id + '">' + label + '</label>' + input + (note ? '<small>' + note + '</small>' : '') + '</div>';
const num = (id, value) => '<input id="' + id + '" type="text" inputmode="numeric" autocomplete="off" value="' + fmtInput(value, 0) + '">';
const ROMAN = ['IV', 'III', 'II', 'I'];

function valorant(h) {
  const ranks = h.pa.fact('val_ranks'), per = h.pa.fact('val_levels');
  const steps = [];
  ranks.forEach((r, i) => { if (i === ranks.length - 1) steps.push(r); else for (let k = 1; k <= per; k++) steps.push(r + ' ' + k); });
  const lastModel = steps.indexOf(ranks[ranks.length - 2] + ' 1');
  return { ranks, per, steps, lastModel, top: h.pa.fact('val_rr_up'), minAfterUp: h.pa.fact('val_rr_after_up'), demote: { to: h.pa.fact('val_rr_after_down') }, tier: null, carry: true, unit: 'CR' };
}
function lol(h) {
  const low = h.pa.fact('lol_tiers_low'), apex = h.pa.fact('lol_tiers_apex'), div = h.pa.fact('lol_divs');
  if (div !== ROMAN.length) throw new Error('lol: divisions changed (' + div + '), update ROMAN');
  const steps = [];
  for (const t of low) for (const r of ROMAN) steps.push(t + ' ' + r);
  steps.push(...apex);
  if (low.length + apex.length !== h.pa.fact('lol_tiers_n')) throw new Error('lol: tier count does not match the quote');
  return { tiers: [...low, ...apex], low, apex, div, steps, lastModel: steps.indexOf(apex[0]), top: h.pa.fact('lol_lp_up'), minAfterUp: 0, demote: { carry: true }, tier: { every: div, to: Math.min(...h.pa.fact('lol_demote_tier')) }, carry: true, unit: 'PL' };
}

// Example: three levels up from the start of a level, 55 % wins, +22 / -15 points; shown before the visitor types.
const EX = { up: 3, pts: 50, p: 0.55, win: 22, loss: 15, n: 100 };

function calc(h, L, startIdx, game) {
  const r = progress({ from: startIdx, pts: EX.pts, to: startIdx + EX.up, top: L.top, win: EX.win, loss: EX.loss, p: EX.p, carry: L.carry, minAfterUp: L.minAfterUp, demote: L.demote, tier: L.tier, maxGames: 1500 });
  const opts = (sel, upto, from = 0) => L.steps.slice(from, upto + 1).map((s, i) => '<option value="' + (i + from) + '"' + (i + from === sel ? ' selected' : '') + '>' + h.esc(s) + '</option>').join('');
  const form = '<form class="pa-c pa-fm" id="pa-lf" autocomplete="off">' +
    '<div class="pa-row">' + field('lf-from', 'Tu rango', '<select id="lf-from">' + opts(startIdx, L.lastModel - 1) + '</select>') + field('lf-pts', 'Tus ' + L.unit + ' ahora', num('lf-pts', EX.pts)) + '</div>' +
    field('lf-to', 'Querés llegar a', '<select id="lf-to">' + opts(startIdx + EX.up, L.lastModel, 1) + '</select>') +
    '<div class="pa-row">' + field('lf-p', '% de partidas que ganás', num('lf-p', Math.round(EX.p * 100))) + field('lf-n', 'Partidas que pensás jugar', num('lf-n', EX.n)) + '</div>' +
    '<div class="pa-row">' + field('lf-w', L.unit + ' por victoria', num('lf-w', EX.win)) + field('lf-l', L.unit + ' por derrota', num('lf-l', EX.loss)) + '</div>' +
    '<p class="pa-x"><b>ejemplo</b> · poné tus promedios de las últimas partidas</p></form>';
  const bars = [];
  const len = Math.min(r.cdf.length, Math.max(EX.n, (r.p90 || EX.n)) + 10);
  for (let i = 0; i < 60; i++) { const g = Math.round(((i + 1) / 60) * len); bars.push('<i style="height:' + (r.cdf[g - 1] * 100).toFixed(1) + '%"' + (g <= EX.n ? ' class="pa-m"' : '') + '></i>'); }
  const out = '<div class="pa-c pa-out" aria-live="polite"><p class="pa-x">Partidas hasta <b data-o="target">' + h.esc(L.steps[startIdx + EX.up]) + '</b>, la mitad de las veces</p>' +
    '<p class="pa-big" data-o="p50">' + (r.p50 ? fmt(r.p50, 0) : '-') + '</p>' +
    '<p class="pa-say" data-o="say">Con ' + fmtPct(EX.p, 0) + ' de victorias llegás en <b>' + fmt(EX.n, 0) + '</b> partidas el <b>' + fmtPct(r.within(EX.n), 0) + '</b> de las veces. En 9 de cada 10 casos, antes de la partida ' + fmt(r.p90, 0) + '.</p>' +
    '<div class="pa-chart" data-o="chart" role="img" aria-label="Probabilidad acumulada de llegar según las partidas jugadas">' + bars.join('') + '</div><div class="pa-axis"><span>0</span><span data-o="axis">' + fmt(len, 0) + ' partidas</span></div>' +
    '<p class="pa-ch"><span data-o="drift">Promedio por partida: ' + (r.drift >= 0 ? '+' : '') + fmt(r.drift, 1) + ' ' + L.unit + '</span><span data-o="mean">Media: ' + (r.mean ? fmt(r.mean, 1) : '-') + ' partidas</span></p>' +
    '<div class="pa-share"><button type="button" data-pa-share>Copiar link con estos valores</button><output data-o="copied"></output></div>' +
    '<details class="pa-fx"><summary>Cómo lo calculamos</summary><p>Recorremos todas las secuencias posibles de victorias y derrotas con una cadena de Markov exacta (sin sorteo): cada partida sumás o restás tus ' + L.unit + ' promedio con la probabilidad que pusiste. Así sale la chance de llegar en cada cantidad de partidas.</p></details></div>';
  return '<div class="pa-tool" data-game="' + game + '">' + form + out + '</div>';
}
const ladderData = L => ({ steps: L.steps, lastModel: L.lastModel, top: L.top, carry: L.carry, minAfterUp: L.minAfterUp, demote: L.demote, tier: L.tier, unit: L.unit });

function ladderVisual(h, names, label) {
  const n = names.length;
  return '<ol class="pa-st" style="--n:' + n + '" aria-label="' + h.esc(label) + '">' + names.map((x, i) => '<li' + (i === Math.floor(n / 2) - 1 ? ' class="pa-me"' : '') + '><i style="height:' + Math.round(((i + 1) / n) * 100) + '%"></i><b>' + h.esc(x) + '</b></li>').join('') + '</ol>';
}

export const valorantRangos = {
  path: '/valorant/rangos',
  kind: 'tool',
  riot: true,
  title: 'Rangos de Valorant en orden y calculadora de RR',
  description: 'Los rangos de Valorant de Hierro a Radiante, cómo se sube con la CR (el RR) según Riot y cuántas partidas te faltan para tu objetivo con tus números.',
  h1: 'Rangos de Valorant y calculadora de RR',
  scripts: ['ladder.js'],
  data: h => ladderData(valorant(h)),
  ld: h => ldPage(h),
  render(h) {
    const L = valorant(h);
    const ladder = '<div class="pa-gd"><section class="pa-c pa-w4"><h2>La escalera completa</h2><p class="pa-x">' + fmt(L.ranks.length, 0) + ' rangos · ' + fmt(L.per, 0) + ' niveles cada uno, menos ' + h.esc(L.ranks[L.ranks.length - 1]) + ' · ' + fmt(L.steps.length, 0) + ' escalones</p>' + ladderVisual(h, L.ranks, 'Rangos de Valorant de menor a mayor') + '</section>' +
      '<section class="pa-c pa-w2"><h2>Lo que dice Riot</h2>' + quote(h, 'val_ranks', 'es') + quote(h, 'val_levels', 'es') + '</section></div>';
    const rules = sec('Cómo se sube y se baja', '<div class="pa-three"><div class="pa-c"><h3>Subís a los ' + fmt(L.top, 0) + '</h3>' + quote(h, 'val_rr_up', 'es') + '</div>' +
      '<div class="pa-c"><h3>Arrancás con algo</h3>' + quote(h, 'val_rr_after_up', 'es') + '</div><div class="pa-c"><h3>Si bajás</h3>' + quote(h, 'val_rr_down_rule', 'es') + quote(h, 'val_rr_after_down', 'es') + quote(h, 'val_protect', 'es') + '</div></div>' +
      '<p class="pa-note" style="margin-top:14px">La calculadora sigue estas reglas: al subir arrancás con lo que te sobró (y nunca menos de ' + fmt(L.minAfterUp, 0) + '), y si perdés con 0 bajás al nivel anterior con ' + fmt(L.demote.to, 0) + ', lo más bajo que permite Riot. No baja del rango donde empezás ni cuenta las protecciones de rango, y llega hasta ' + h.esc(L.steps[L.lastModel]) + ': de ahí para arriba la CR funciona distinto.</p>');
    const dist = sec('¿Cuántos jugadores hay en cada rango?', '<p>Riot no publica en sus páginas oficiales qué porcentaje de jugadores hay en cada rango, así que no mostramos uno inventado ni sacado de sitios que no explican cómo lo miden.</p>');
    const latam = sec('Desde Argentina', '<div class="pa-two"><div>' + quote(h, 'val_scl', 'es') + quote(h, 'val_scl_ar', 'es') + '</div><div><p>Tu ping hasta Santiago, y el mínimo que permite la física desde tu provincia, está en el <a href="' + h.href('/kit/ping') + '">test de ping desde Argentina</a>.</p></div></div>');
    return hero(h, { ey: 'Valorant · competitivo', sub: 'Los ' + fmt(L.ranks.length, 0) + ' rangos en orden, las reglas de la CR (clasificación de rango, el RR en inglés) tal como las escribe Riot y una calculadora que te dice cuántas partidas te faltan con tus propios números.' }) +
      calc(h, L, L.steps.indexOf(L.ranks[3] + ' 1'), 'valorant') + ladder + rules + dist + latam;
  },
};

export const lolRangos = {
  path: '/lol/rangos',
  kind: 'tool',
  riot: true,
  title: 'Rangos de LoL en LAS: divisiones, PL y calculadora',
  description: 'Rangos de League of Legends en LAS, de Hierro a Retador: divisiones, cuántos PL pide cada una según Riot y una calculadora de partidas.',
  h1: 'Rangos de League of Legends en LAS',
  scripts: ['ladder.js'],
  data: h => ladderData(lol(h)),
  ld: h => ldPage(h),
  render(h) {
    const L = lol(h);
    const ladder = '<div class="pa-gd"><section class="pa-c pa-w4"><h2>Los ' + fmt(L.tiers.length, 0) + ' niveles</h2><p class="pa-x">De ' + h.esc(L.low[0]) + ' a ' + h.esc(L.low[L.low.length - 1]) + ' con ' + fmt(L.div, 0) + ' divisiones · ' + h.esc(L.apex.join(', ')) + ' sin divisiones</p>' + ladderVisual(h, L.tiers, 'Niveles de League of Legends de menor a mayor') + '</section>' +
      '<section class="pa-c pa-w2"><h2>Lo que dice Riot</h2>' + quote(h, 'lol_tiers_n', 'es') + quote(h, 'lol_divs', 'es') + '</section></div>';
    const top = h.pa.fact('lol_master_top');
    const rules = sec('PL, divisiones y la cima', '<div class="pa-three"><div class="pa-c"><h3>' + fmt(L.top, 0) + ' PL por división</h3>' + quote(h, 'lol_lp_up', 'es') + '</div>' +
      '<div class="pa-c"><h3>Llegar a ' + h.esc(L.apex[0]) + ': el ' + fmt(top, 1) + ' %</h3>' + quote(h, 'lol_master_top', 'es') + '<p class="pa-src">Es el único porcentaje que Riot da en esa página; el resto de la distribución no lo publica.</p></div>' +
      '<div class="pa-c"><h3>El orden</h3>' + quote(h, 'lol_tiers_low', 'es') + quote(h, 'lol_tiers_apex', 'es') + '</div></div>' +
      '<div class="pa-two" style="margin-top:14px"><div class="pa-c"><h3>Si bajás</h3>' + quote(h, 'lol_demote_div', 'es') + quote(h, 'lol_demote_tier', 'es') + '</div>' +
      '<p class="pa-note">La calculadora sigue estas reglas: al subir conservás los PL que sobran, al bajar de división arrastrás lo que te faltó y al bajar de nivel caés a ' + fmt(L.tier.to, 0) + ' PL, el caso más bajo de los que nombra Riot. No baja del rango donde empezás, no cuenta la protección de nivel y llega hasta ' + h.esc(L.apex[0]) + ': arriba de eso las reglas son otras.</p></div>');
    const las = sec('LAS: el servidor de Argentina', '<div class="pa-two"><div>' + quote(h, 'lol_las_scl') + quote(h, 'lol_lan_mia', 'es') + '</div><div><p>Medí tu ruta y mirá el ping mínimo desde tu provincia hasta Santiago y Miami en el <a href="' + h.href('/kit/ping') + '">test de ping</a>.</p></div></div>');
    return hero(h, { ey: 'League of Legends · clasificatorias', sub: 'Los niveles en orden, cuántos PL pide cada división según Riot y una calculadora que te muestra la chance de llegar a tu objetivo en las partidas que te quedan.' }) +
      calc(h, L, L.steps.indexOf(L.low[3] + ' ' + ROMAN[0]), 'lol') + ladder + rules + las;
  },
};
