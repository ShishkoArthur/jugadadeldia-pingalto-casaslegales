import { $, esc } from './kit.js';

export const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const dmy = d => +d.slice(8, 10) + '/' + +d.slice(5, 7);
export const dayName = d => DAYS[new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + dmy(d);
export const SRCS = { CL: '2 fuentes: Lotería de la Ciudad y CAS San Juan', CT: '2 fuentes: telekino.com.ar y CAS San Juan', CM: '2 fuentes: CAS San Juan e IPJyC Mendoza', C: '1 fuente: copia de la CAS San Juan', M: '1 fuente: copia del IPJyC Mendoza', L: '1 fuente: Lotería de la Ciudad', T: '1 fuente: telekino.com.ar' };

export function lotPicker(box, L, pick) {
  const sel = $('[data-lotp-sel]', box), note = $('[data-lotp-note]');
  let g = null, stale = false;
  const tell = e => {
    const late = g.behind > 0 && g.expected && e === g.draws[0] ? ' <b>Pendiente de publicación oficial:</b> todavía no salió la copia del sorteo del ' + esc(dayName(g.expected)) + '.' : '';
    note.hidden = false;
    note.innerHTML = 'Cargamos el sorteo N° ' + e.s + ' del ' + esc(dayName(e.d)) + ' · ' + esc(SRCS[e.src] || '') + '.' + late + (stale ? ' Ojo: hace más de ' + L.stale + ' horas que no pudimos revisar las fuentes.' : '') + ' Para cobrar, manda el extracto oficial.';
  };
  const choose = s => {
    const e = g && g.draws.find(x => String(x.s) === String(s));
    if (!e) { note.textContent = ''; note.hidden = true; pick(null); return; }
    tell(e); pick(e);
  };
  sel.addEventListener('change', () => choose(sel.value));
  return {
    async load(prefill) {
      const r = await fetch(L.feed, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      const doc = await r.json();
      g = doc.data && doc.data.games && doc.data.games[L.game];
      if (!g || !g.draws || !g.draws.length) return;
      stale = Date.now() - Date.parse(doc.updated) > L.stale * 3600e3;
      for (const [i, e] of g.draws.entries()) {
        const o = document.createElement('option');
        o.value = String(e.s);
        o.textContent = 'N° ' + e.s + ' · ' + dayName(e.d) + (i === 0 ? ' (el último publicado)' : '');
        sel.append(o);
      }
      box.hidden = false;
      if (prefill) { sel.value = String(g.draws[0].s); choose(sel.value); }
    },
    manual() { if (sel.value) { sel.value = ''; note.textContent = ''; note.hidden = true; } },
    current: () => (g && g.draws.find(x => String(x.s) === sel.value)) || null,
  };
}
