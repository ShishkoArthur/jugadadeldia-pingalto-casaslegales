import { $, $$, page, store, esc } from './kit.js';

const D = page();
const tixBox = $('[data-q6c]'), drawBox = $('[data-q6d]');
const out = k => $('[data-o="' + k + '"]');
const two = x => String(x).padStart(2, '0');
const MAX_T = 10;

function load() { try { const v = JSON.parse(store.get(D.key) || '[]'); return Array.isArray(v) && v.length ? v.slice(0, MAX_T) : [['', '', '', '', '', '']]; } catch (e) { return [['', '', '', '', '', '']]; } }
let tix = load();
const six = (vals, i) => '<div><div class="jg-six">' + vals.map((v, k) => '<input type="text" inputmode="numeric" maxlength="2" autocomplete="off" data-t="' + i + '" data-k="' + k + '" value="' + esc(v) + '" aria-label="Boleta ' + (i + 1) + ', número ' + (k + 1) + '">').join('') + '</div><button class="jg-b s" type="button" data-del="' + i + '" aria-label="Quitar la boleta ' + (i + 1) + '">×</button></div>';
function drawTix() { out('tix').innerHTML = tix.map(six).join(''); $('[data-add]', tixBox).disabled = tix.length >= MAX_T; }
function nums(arr) {
  const v = arr.map(x => String(x).trim()).filter(Boolean);
  if (v.length !== D.pick || v.some(x => !/^\d{1,2}$/.test(x))) return null;
  const n = v.map(Number);
  if (n.some(x => x < D.min || x > D.max) || new Set(n).size !== n.length) return null;
  return n;
}
function drawn(id) { return nums($$('[data-six="' + id + '"] input', drawBox).map(i => i.value)); }
function calc() {
  store.set(D.key, JSON.stringify(tix));
  const sets = Object.fromEntries(D.sets.map(s => [s.id, drawn(s.id)]));
  const valid = tix.map(nums);
  const ready = D.sets.filter(s => sets[s.id]);
  if (!valid.some(Boolean) || !ready.length) { out('res').innerHTML = '<p class="jg-note">Cargá al menos una boleta completa (6 números distintos del ' + two(D.min) + ' al ' + two(D.max) + ') y una modalidad del extracto.</p>'; return; }
  const ex = ['tr', 'se', 're'].every(k => sets[k]) ? new Set([...sets.tr, ...sets.se, ...sets.re]) : null;
  const head = '<tr><th>Boleta</th>' + D.sets.map(s => '<th class="n">' + s.name + '</th>').join('') + '<th class="n">Premio Extra</th></tr>';
  let wins = 0;
  const rows = valid.map((t, i) => {
    if (!t) return '<tr><td>' + (i + 1) + '</td><td colspan="' + (D.sets.length + 1) + '" class="jg-mu">incompleta</td></tr>';
    const cells = D.sets.map(s => {
      if (!sets[s.id]) return '<td class="n jg-mu">—</td>';
      const k = t.filter(x => sets[s.id].includes(x)).length;
      const win = Array.isArray(s.win) && s.win.includes(k);
      if (win) wins++;
      return '<td class="n' + (win ? ' y' : '') + '">' + k + (win ? ' · premio' : '') + '</td>';
    }).join('');
    let e = '<td class="n jg-mu">—</td>';
    if (ex) {
      const six6 = ['tr', 'se', 're'].some(k => t.every(x => sets[k].includes(x)));
      const inside = t.filter(x => ex.has(x)).length;
      const yes = inside === 6 && !six6;
      if (yes) wins++;
      e = '<td class="n' + (yes ? ' y' : '') + '">' + inside + ' de 6' + (yes ? ' · entra' : '') + '</td>';
    }
    return '<tr><td>' + (i + 1) + ' <small class="jg-mu">' + t.slice().sort((a, b) => a - b).map(two).join(' ') + '</small></td>' + cells + e + '</tr>';
  }).join('');
  out('res').innerHTML = '<div class="jg-tw"><table class="jg-tbl jg-mat" data-nosnippet><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="jg-hon">' + (wins ? 'Hay <b>' + wins + '</b> ' + (wins === 1 ? 'casillero con premio' : 'casilleros con premio') + ' (en verde). El monto lo dice el extracto oficial.' : 'Ninguna boleta llega a premio en lo que cargaste.') + ' En Siempre Sale cobra quien más acierte en todo el país: mirá el extracto.</p>';
}
if (tixBox && drawBox) {
  drawTix();
  tixBox.addEventListener('input', e => { const el = e.target.closest('[data-t]'); if (!el) return; tix[+el.dataset.t][+el.dataset.k] = el.value.replace(/\D/g, '').slice(0, 2); calc(); });
  tixBox.addEventListener('click', e => {
    if (e.target.closest('[data-add]') && tix.length < MAX_T) { tix.push(['', '', '', '', '', '']); drawTix(); calc(); }
    const d = e.target.closest('[data-del]');
    if (d) { tix.splice(+d.dataset.del, 1); if (!tix.length) tix = [['', '', '', '', '', '']]; drawTix(); calc(); }
  });
  drawBox.addEventListener('input', e => {
    if (e.target.matches('[data-paste]')) {
      const n = (e.target.value.match(/\d+/g) || []).slice(0, D.sets.length * 6);
      D.sets.forEach((s, i) => $$('[data-six="' + s.id + '"] input', drawBox).forEach((inp, k) => { inp.value = n[i * 6 + k] !== undefined ? n[i * 6 + k] : inp.value; }));
    }
    calc();
  });
  calc();
}
