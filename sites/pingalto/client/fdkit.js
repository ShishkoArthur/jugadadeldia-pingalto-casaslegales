export const TZ = 'America/Argentina/Buenos_Aires';
const WORDS = { 'Nombre oculto': 'Nombre oculto', Otros: 'Otros' };
export const esc = s => String(s == null ? '' : Object.hasOwn(WORDS, s) ? WORDS[s] : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const arDay = iso => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
export const arTime = iso => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
export const dayName = d => DAYS[new Date(d + 'T12:00:00Z').getUTCDay()] + ' ' + +d.slice(8, 10) + '/' + +d.slice(5, 7);
export const today = () => arDay(new Date().toISOString());
const cache = {};
export function load(src, name) {
  if (!cache[name]) cache[name] = fetch(src + name + '.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  return cache[name];
}
export const stale = (doc, hours) => Date.now() - Date.parse(doc.updated) > hours * 3600e3;
export function stamp(doc, hours) {
  const d = arDay(doc.updated), when = (d === today() ? 'hoy' : 'el ' + dayName(d)) + ' a las ' + arTime(doc.updated);
  if (stale(doc, hours)) return '<p class="pa-fdst pa-fdno" role="status"><b>Sin datos al ' + arTime(new Date().toISOString()) + '.</b> La última copia buena es de ' + esc(when) + ' (hora argentina): no la mostramos como si fuera de ahora.</p>';
  return '<p class="pa-fdst" role="status">Actualizado ' + esc(when) + ' · hora argentina</p>';
}
export const fail = el => { el.innerHTML = '<p class="pa-fdst pa-fdno">No pudimos cargar los datos. Probá de nuevo en un rato.</p>'; };
