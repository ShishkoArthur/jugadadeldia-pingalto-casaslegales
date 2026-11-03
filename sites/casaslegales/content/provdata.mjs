// Status of each of the 24 jurisdictions for casaslegales pages: "list" when a verified registry exists (data/sources/registries),
// otherwise the entry of data/sources/provinces/provinces.json (platform | none | blocked). Verified here before any page uses it
// (tools/lib/provsources.mjs): a changed copy, a quote not found or a jurisdiction without status stops the build.
import { checkProvinces, loadProvinces } from '../../../tools/lib/provsources.mjs';
import { hostKey } from '../../../engine/registry.mjs';
import { TILES } from './map.mjs';

export const STATUS_LABEL = {
  list: 'lista oficial verificada',
  platform: 'plataforma provincial',
  none: 'sin dato verificado',
  blocked: 'no consultable',
};
export const STATUS_ORDER = ['list', 'platform', 'none', 'blocked'];

let cache = null;
export function provData(h) {
  if (cache && cache.today === h.today) return cache;
  const data = loadProvinces();
  const ids = TILES.map(t => t.id);
  const errs = checkProvinces({ today: h.today, data, registryIds: h.regs.map(r => r.id), jurisdictions: ids });
  if (errs.length) throw new Error('province facts are not verified:\n' + errs.join('\n') + '\n(node tools/verify-sources.mjs)');
  const doc = slug => {
    const d = data.docs[slug];
    if (!d) throw new Error('no province document ' + slug);
    const u = new URL(d.url);
    return { slug, ...d, host: hostKey(d.url), path: u.pathname.replace(/\/$/, '') };
  };
  const one = id => {
    const t = TILES.find(x => x.id === id);
    if (!t) throw new Error('no jurisdiction ' + id);
    const j = h.rg.prov(id);
    const reg = h.regs.find(r => r.id === id) || null;
    const e = reg ? null : data.jurisdictions[id];
    const st = reg ? 'list' : e.status;
    const docsOf = reg ? Object.values(reg.docs) : [...(e.platforms || []).map(p => data.docs[p.evidence.doc]), ...(e.seen || []).map(s => data.docs[s.doc])];
    const dates = docsOf.filter(Boolean).map(d => d.fetched).sort();
    return { id, code: t.code, name: j.name, st, label: STATUS_LABEL[st], reg, e, j, date: dates.length ? dates[dates.length - 1] : null,
      n: reg ? reg.licensees.length : e.platforms ? e.platforms.length : null };
  };
  const all = TILES.map(t => one(t.id));
  const count = Object.fromEntries(STATUS_ORDER.map(s => [s, all.filter(x => x.st === s).length]));
  cache = { today: h.today, data, doc, one, all, count };
  return cache;
}

export function pdQuote(h, P, q, label) {
  const d = P.doc(q.doc);
  return '<blockquote class="rl-q" cite="' + h.esc(d.url) + '">«' + h.esc(q.text) + '»<cite>' + h.esc(label) + ' · <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host) + '</a> · copia del ' + h.fmtDate(d.fetched) + '</cite></blockquote>';
}
export function pdSrc(h, P, slug, extra = '') {
  const d = P.doc(slug);
  return '<p class="rl-src">Fuente: <a href="' + h.esc(d.url) + '" rel="noopener">' + h.esc(d.host + (d.path && d.path !== '/' ? d.path : '')) + '</a> · copia guardada el ' + h.fmtDate(d.fetched) + (extra ? ' · ' + extra : '') + '</p>';
}

// saved copies of data/sources/provinces for the sources register (same columns as the registry documents)
export function provDocRows(h) {
  const P = provData(h);
  const rows = [];
  for (const [slug, d] of Object.entries(P.data.docs)) {
    const [id, e] = Object.entries(P.data.jurisdictions).find(([, j]) => JSON.stringify(j).includes('"' + slug + '"'));
    const quotes = (e.platforms || []).filter(p => p.evidence.doc === slug).length + (e.platforms || []).filter(p => p.quote && p.quote.doc === slug).length +
      Object.values(e.quotes || {}).filter(q => q.doc === slug).length + (e.report && e.report.doc === slug ? 1 : 0);
    const u = new URL(d.url);
    const ps = (u.pathname + u.search).replace(/\/$/, '');
    rows.push({ slug, ...d, jurName: h.rg.prov(id).name, host: u.hostname.replace(/^www\./, ''), pathShort: ps.length > 34 ? ps.slice(0, 33) + '…' : ps,
      use: e.status === 'platform' && (e.platforms || []).some(p => p.evidence.doc === slug) ? 'plataforma enlazada por el regulador' : (e.seen || []).some(s => s.doc === slug) ? 'revisada: sin lista de sitios online' : 'denuncias de juego ilegal',
      quotes: quotes + ((e.seen || []).some(s => s.doc === slug) ? 1 : 0) });
  }
  return rows;
}
