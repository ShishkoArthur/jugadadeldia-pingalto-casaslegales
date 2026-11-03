import { dpiFromCounts, median, deviation } from '../../../engine/games/dpi.mjs';
import { $, data, out, num, fmt, fmtPct } from './kit.js';

const D = data();
const startBtn = $('[data-pa-start]');
if (D && startBtn) {
  const dist = $('#dp-dist'), mm = $('#dp-mm'), decl = $('#dp-decl'), sens = $('#dp-sens');
  const runs = [];
  let counting = false, counts = 0, raw = null;
  const distance = () => (dist.value === 'card' ? D.cardMm : num(mm));
  dist.addEventListener('change', () => { mm.disabled = dist.value === 'card'; if (dist.value === 'card') mm.value = String(D.cardMm); });
  const show = () => {
    out('runs', runs.map((r, i) => '<span>Medición ' + (i + 1) + ': ' + fmt(r, 0) + ' DPI</span>').join(''));
    if (!runs.length) { out('dpi', '-'); out('dev', 'Diferencia con fábrica: -'); out('edpi', 'eDPI: -'); return; }
    const m = median(runs);
    out('dpi', fmt(m, 0));
    const d = num(decl);
    out('dev', d > 0 ? 'Diferencia con fábrica: ' + (m >= d ? '+' : '') + fmtPct(deviation({ measured: m, declared: d }), 1) : 'Diferencia con fábrica: poné el DPI de la caja');
    const s = num(sens);
    out('edpi', s > 0 ? 'eDPI real: ' + fmt(m * s, 0) : 'eDPI: poné tu sensibilidad');
    out('say', runs.length < 3 ? 'Bien. Hacé ' + (3 - runs.length) + ' más para tener una mediana firme.' : 'Listo: mediana de ' + runs.length + ' mediciones.' + (Math.max(...runs) / Math.min(...runs) > 1.05 ? ' Tus mediciones varían bastante: probá ir más derecho y sin levantar el mouse.' : ''));
  };
  [decl, sens, $('#dp-game')].forEach(el => el && el.addEventListener('input', show));
  const onMove = e => { if (counting) counts += e.movementX; };
  const finish = () => {
    if (!counting) return;
    counting = false;
    document.removeEventListener('mousemove', onMove);
    if (document.pointerLockElement) document.exitPointerLock();
    startBtn.textContent = 'Empezar';
    const d = distance();
    if (Math.abs(counts) < 20 || !(d > 0)) { out('say', 'No registramos movimiento suficiente. Probá de nuevo deslizando a lo largo de toda la tarjeta.'); return; }
    runs.push(dpiFromCounts({ counts, mm: d }));
    out('raw', raw ? 'Lectura directa del mouse: sí (sin aceleración del sistema).' : 'Lectura directa del mouse: no disponible en este navegador. Apagá «Mejorar la precisión del puntero» en Windows para que el número sea fiel.');
    show();
  };
  startBtn.addEventListener('click', async () => {
    if (counting) { finish(); return; }
    counts = 0;
    raw = false;
    try { const pr = startBtn.requestPointerLock({ unadjustedMovement: true }); if (pr && typeof pr.then === 'function') { await pr; raw = true; } } catch (e) {
      try { await startBtn.requestPointerLock(); } catch (e2) { out('say', 'Tu navegador no deja capturar el mouse. Probá con Chrome, Edge o Firefox en una compu.'); return; }
    }
    counting = true;
    startBtn.textContent = 'Listo (clic)';
    out('say', 'Deslizá el mouse hasta el otro borde de la tarjeta y hacé clic.');
    document.addEventListener('mousemove', onMove);
  });
  document.addEventListener('keydown', e => { if (counting && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); finish(); } });
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && counting) finish(); });
  $('[data-pa-reset]').addEventListener('click', () => { runs.length = 0; out('say', 'Mediciones borradas.'); show(); });
  if (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) { startBtn.disabled = true; out('say', 'Esta medición necesita un mouse: abrila desde una compu.'); }
}
