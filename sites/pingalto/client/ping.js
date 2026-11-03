import { summarize, overFloor } from '../../../engine/games/ping.mjs';
import { $, $$, data, out, fmt } from './kit.js';

const D = data();
if (D) {
  const sel = $('#pg-prov');
  const max = Math.max(...D.rows.flatMap(r => r.ms));
  const paint = () => {
    const r = D.rows.find(x => x.id === sel.value) || D.rows[0];
    r.ms.forEach((ms, i) => {
      const g = $('[data-g="' + i + '"]'); if (g) { g.textContent = fmt(ms, 0); g.parentElement.style.setProperty('--v', String(Math.round((ms / max) * 100))); }
      const k = $('[data-k="' + i + '"]'); if (k) k.textContent = fmt(r.km[i], 0);
    });
  };
  if (sel) { sel.addEventListener('change', paint); paint(); }
  const btn = $('[data-pa-run]');
  const once = async host => {
    const t0 = performance.now();
    const r = await fetch('https://' + host + '/ping?pa=' + Math.random().toString(36).slice(2), { cache: 'no-store', mode: 'cors', credentials: 'omit' });
    await r.text();
    return performance.now() - t0;
  };
  const measure = async (e, i) => {
    const cell = $('[data-l="' + i + '"]'), note = $('[data-lj="' + i + '"]');
    cell.textContent = '…';
    try {
      await once(e.host);
      const xs = [];
      for (let k = 0; k < 8; k++) { xs.push(await once(e.host)); cell.textContent = fmt(summarize(xs).median, 0); }
      const s = summarize(xs);
      note.textContent = 'mediana de ' + s.n + ' · mínimo ' + fmt(s.min, 0) + ' ms · variación ' + fmt(s.jitter, 0) + ' ms · ' + e.host;
      return s;
    } catch (err) {
      cell.textContent = '-';
      note.textContent = 'No pudimos medir (bloqueador, red o servidor sin respuesta).';
      return null;
    }
  };
  if (btn) btn.addEventListener('click', async () => {
    btn.disabled = true;
    out('cmp', '');
    const res = [];
    for (let i = 0; i < D.live.length; i++) res.push(await measure(D.live[i], i));
    const sp = res[0], floor = (D.sp.find(x => x.id === sel.value) || D.sp[0]).floor;
    if (sp) out('cmp', 'Tu mediana a São Paulo es ' + fmt(overFloor({ measured: sp.median, floor }), 1) + ' veces el piso físico desde ' + sel.options[sel.selectedIndex].text + ' (' + fmt(floor, 0) + ' ms). Incluye el tiempo que tarda el servidor en responder.');
    btn.disabled = false;
    btn.textContent = 'Medir otra vez';
  });
  void $$;
}
