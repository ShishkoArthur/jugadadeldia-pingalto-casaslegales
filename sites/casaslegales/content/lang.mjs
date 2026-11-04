// Language of the build pass for data the pages and the layout put into JSON for the browser (docs/I18N.md: the English pass
// translates the HTML, not these JSON blocks): Spanish strings through h.tr, dates in the English form, page paths to /en.
import { numEn, planEn } from '../../../tools/lib/i18n.mjs';

let enMap = null;
export const tr = (h, s) => (h.tr ? h.tr(s) : s);
export const trAll = (h, o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? tr(h, v) : v]));
export const date = (h, iso) => (h.lang === 'en' ? numEn(h.fmtDate(iso)) : h.fmtDate(iso));
export const loc = (h, u) => (h.lang === 'en' && u ? ((enMap ||= planEn(h.site.id)).get(u) || {}).path || u : u);
export const and = h => (h.lang === 'en' ? ' and ' : ' y ');
