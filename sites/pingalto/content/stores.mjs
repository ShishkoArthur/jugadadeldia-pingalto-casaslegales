// Store listings saved as sources (data/sources/pingalto/sources.json): Steam appdetails (JSON, Argentina, Spanish), Apple's
// iTunes lookup (JSON per country) and Google Play listings (HTML per country). Each reader checks the shape it expects and stops
// the build when a field is missing, so a page never prints a number the saved listing does not have.
import { visibleText } from '../../../engine/text.mjs';

const strip = s => String(s).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function reqList(html, where) {
  if (!html) return null;
  const rows = {};
  for (const li of String(html).split('<li>').slice(1)) {
    const m = /^<strong>([^<]+):<\/strong>\s*([\s\S]*?)(?:<br>)?<\/li>/.exec(li) || /^<strong>([^<]+):<\/strong>\s*([\s\S]*)$/.exec(li.replace(/<\/ul>[\s\S]*$/, ''));
    if (m) rows[m[1].trim()] = strip(m[2]).replace(/\.$/, '');
  }
  if (!Object.keys(rows).length) for (const m of String(html).matchAll(/<strong>([^<]+):<\/strong>([\s\S]*?)(?=<strong>|$)/g)) rows[m[1].trim()] = strip(m[2]).replace(/\.$/, '');
  if (!Object.keys(rows).length) throw new Error(where + ': requirements list not readable');
  return rows;
}
const gb = s => { const m = /(\d+)\s*GB/.exec(String(s || '')); return m ? +m[1] : null; };

export function steamApp(h, slug, appid) {
  const raw = h.pa.json(slug)[String(appid)];
  if (!raw || !raw.success || !raw.data) throw new Error(slug + ': Steam appdetails without data');
  const d = raw.data, where = slug;
  const min = reqList(d.pc_requirements && d.pc_requirements.minimum, where + ' pc minimum');
  if (!min) throw new Error(where + ': no PC minimum requirements');
  const soft = x => { try { return reqList(x, where); } catch (e) { return null; } };
  const rec = soft(d.pc_requirements && d.pc_requirements.recommended);
  const linux = soft(d.linux_requirements && d.linux_requirements.minimum);
  const price = d.price_overview ? { cur: d.price_overview.currency, cents: d.price_overview.final } : null;
  if (!d.is_free && !price) throw new Error(where + ': paid app without a price');
  const langs = strip(String(d.supported_languages || '').replace(/<strong>\*<\/strong>/g, '')).split(/,\s*/).map(s => s.replace(/\s*idiomas con localizaci.*$/, '').trim()).filter(Boolean);
  return { appid, name: d.name, free: !!d.is_free, price, date: d.release_date && d.release_date.date, platforms: d.platforms, min, rec, linux, langs, ramGb: gb(min.Memoria), diskGb: gb(min.Almacenamiento) };
}

export function itunes(h, slug) {
  const j = h.pa.json(slug);
  if (typeof j.resultCount !== 'number') throw new Error(slug + ': not an iTunes lookup answer');
  const r = j.results[0];
  if (!r) return { found: false };
  if (!r.minimumOsVersion || !(r.fileSizeBytes > 0)) throw new Error(slug + ': lookup without minimumOsVersion or fileSizeBytes');
  return { found: true, name: r.trackName, minOs: r.minimumOsVersion, bytes: +r.fileSizeBytes, rating: r.trackContentRating, free: r.price === 0, seller: r.sellerName };
}

// A Google Play listing as an anonymous visitor sees it (no sign-in): the download band and whether the Install button shows.
export function play(h, slug) {
  const t = visibleText(h.pa.raw(slug));
  const m = /info ([\d.,]+ M\+) Descargas( Selecci\S+ de los editores)? (Instalar )?Compartir/.exec(t);
  if (!m) throw new Error(slug + ': download band not found in the saved listing');
  return { downloads: m[1], install: !!m[3] };
}
export const millions = s => { const m = /^([\d.,]+) M\+$/.exec(s); if (!m) throw new Error('not a download band ' + s); return +m[1].replace(/,/g, ''); };
