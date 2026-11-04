import { $, page, fmt, parseNum, pesos, share, params, setParams } from './kit.js';
import { helpLine } from './jg.js';
import { directBet } from '../../../engine/lottery/quiniela.mjs';
import { toNumber } from '../../../engine/lottery/exact.mjs';
import { yearExact, yearMonteCarlo } from '../../../engine/lottery/simulate.mjs';
import { xoshiro128ss } from '../../../engine/lottery/rng.mjs';

const D = page();
const form = $('[data-sim]');
const out = k => $('[data-o="' + k + '"]');
let seed = 1;
const sp = n => (n < 0 ? '−' : '') + pesos(Math.abs(n)).replace(',00', '');

function path(items, cum, plays, stake, rng) {
  const pts = [0];
  let bal = 0;
  for (let i = 0; i < plays; i++) {
    const x = rng.next();
    let j = 0; while (j < cum.length - 1 && x >= cum[j]) j++;
    bal += items[j] - stake;
    pts.push(bal);
  }
  return pts;
}
function curve(paths, plays) {
  const W = 640, H = 240, P = 30;
  const all = paths.flat(), lo = Math.min(0, ...all), hi = Math.max(0, ...all);
  const X = i => P + (W - P - 8) * i / plays, Y = v => 8 + (H - 30) * (hi - v) / ((hi - lo) || 1);
  const step = Math.max(1, Math.floor(plays / 160));
  const line = (pts, cls) => '<polyline class="' + cls + '" points="' + pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((v, i, a) => X(i === a.length - 1 ? plays : i * step).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '"/>';
  return '<svg class="jg-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Saldo a lo largo del año">' +
    '<line class="ax" x1="' + P + '" y1="' + (H - 22) + '" x2="' + W + '" y2="' + (H - 22) + '"/><line class="z" x1="' + P + '" y1="' + Y(0).toFixed(1) + '" x2="' + W + '" y2="' + Y(0).toFixed(1) + '"/>' +
    paths.slice(1).map(p => line(p, 'pg')).join('') + line(paths[0], 'pm') +
    '<text x="2" y="14">' + sp(hi) + '</text><text x="2" y="' + (H - 26) + '">' + sp(lo) + '</text><text x="' + P + '" y="' + (H - 6) + '">inicio</text><text x="' + (W - 4) + '" y="' + (H - 6) + '" text-anchor="end">fin del año</text></svg>';
}
function hist(nets) {
  const W = 640, H = 200, B = 30;
  const lo = nets[0], hi = nets[nets.length - 1];
  const w = (hi - lo) / B || 1, bins = Array(B).fill(0);
  for (const v of nets) bins[Math.min(B - 1, Math.floor((v - lo) / w))]++;
  const mx = Math.max(...bins), bw = (W - 10) / B;
  return '<svg class="jg-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cómo terminan los años simulados">' + bins.map((c, i) => {
    const h = (H - 30) * c / mx, x0 = lo + i * w;
    return '<rect class="hb' + (x0 + w / 2 > 0 ? ' up' : '') + '" x="' + (5 + i * bw).toFixed(1) + '" y="' + (H - 22 - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '"/>';
  }).join('') + '<text x="4" y="' + (H - 6) + '">' + sp(lo) + '</text><text x="' + (W - 4) + '" y="' + (H - 6) + '" text-anchor="end">' + sp(hi) + '</text></svg>';
}
function run(again) {
  const f = new FormData(form);
  const j = f.get('j'), d = +f.get('d'), u = +f.get('u'), a = parseNum(f.get('a')), plays = +f.get('f');
  const err = out('err'); err.hidden = true;
  helpLine(D.j[j].help);
  if (!(a > 0) || Math.round(a * 100) !== a * 100) { err.hidden = false; err.textContent = 'Escribí cuánto apostás por jugada, en pesos.'; for (const k of ['spent', 'mean', 'loss', 'ahead', 'median']) out(k).textContent = '-'; out('mc').textContent = ''; out('hist').textContent = ''; out('curve').textContent = ''; return; }
  if (again) seed++;
  const b = directBet({ rules: D.j[j].id, digits: d, places: u, stake: a });
  const outcomes = b.outcomes.map(o => ({ amount: o.payout, p: o.p }));
  const y = yearExact({ outcomes, stake: b.stake, plays, floor: 1e-13 });
  out('spent').textContent = pesos(y.spent);
  out('mean').textContent = pesos(y.spent + toNumber(y.meanNet));
  out('loss').textContent = pesos(-toNumber(y.meanNet));
  out('ahead').textContent = fmt(y.pAhead * 100, 1) + ' %';
  const zero = y.rows.length && y.rows[0].net === -y.spent ? y.rows[0].p : 0;
  out('median').innerHTML = y.median <= -y.spent ? 'En el <b>' + fmt(zero * 100, 1) + ' %</b> de los años no acertás ni una vez y perdés todo lo puesto.' : 'La mitad de los años termina en <b>' + sp(y.median) + '</b> o peor.';
  const mc = yearMonteCarlo({ outcomes, stake: b.stake, plays, years: 10000, seed });
  out('mc').textContent = 'En 10.000 años simulados terminaron en ganancia ' + fmt(mc.pAhead * 100, 1) + ' %; el promedio fue perder ' + pesos(-mc.meanNet) + '.';
  out('hist').innerHTML = hist(mc.nets);
  const items = outcomes.map(o => toNumber(o.amount)), cum = []; let c = 0;
  for (const o of outcomes) { c += toNumber(o.p); cum.push(c); }
  const rng = xoshiro128ss(seed * 7919);
  out('curve').innerHTML = curve(Array.from({ length: 21 }, () => path(items, cum, plays, a, rng)), plays);
  setParams({ j: j === 'lotba' ? null : j, d: d === 2 ? null : d, u: u === 1 ? null : u, a: a === 500 ? null : String(a).replace('.', ','), f: plays === 52 ? null : plays });
}
if (form) {
  const p = params();
  for (const k of ['d', 'u', 'f']) if (p.get(k) && form.querySelector('select[name=' + k + '] option[value="' + p.get(k) + '"]')) form.elements[k].value = p.get(k);
  if (p.get('j') && D.j[p.get('j')]) form.querySelector('input[name=j][value="' + p.get('j') + '"]').checked = true;
  if (p.get('a')) form.elements.a.value = p.get('a');
  let t = 0;
  form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(false), 250); });
  form.addEventListener('change', () => { clearTimeout(t); t = setTimeout(() => run(false), 50); });
  $('[data-run]', form).addEventListener('click', () => run(true));
  $('[data-share]', form).addEventListener('click', e => share(e.target, document.title));
  run(false);
}
