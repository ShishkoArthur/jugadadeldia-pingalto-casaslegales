// Keyword coverage audit for casaslegales: keyword -> intent class -> planned/built page, with volumes.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
const R = new URL('../../../', import.meta.url).pathname;
const files = readdirSync(R + 'data/keywords').filter(f => /casas_de_apuestas|matching-cl-/.test(f));
const kw = new Map();
for (const f of files) for (const r of JSON.parse(readFileSync(R + 'data/keywords/' + f)).rows) if (!kw.has(r.keyword)) kw.set(r.keyword, r);
const rows = [...kw.values()].map(r => ({ k: r.keyword, v: r.volume || 0, d: r.difficulty }));
const plan = JSON.parse(readFileSync(R + 'data/plan/casaslegales.json'));
const built = p => existsSync(R + 'dist/casaslegales' + (p.url === '/' ? '/index.html' : p.url + '.html')) || existsSync(R + 'dist/casaslegales' + p.url + '/index.html');
const brands = ['betsson', 'betano', 'bet365', 'bplay', 'codere', 'betwarrior', 'jugadon', 'jugadón', 'playcet', 'sportsbet', 'stake', 'betway', 'casino club', 'casinoclub', 'super7', 'betfun', 'playuzu', 'play uzu', 'easybet', 'mitesoro', 'arbet', 'maverick', 'aladdin', 'casino magic', 'city center', 'betonwin', 'zeus', '1win', 'tucan', 'betbox', 'mystake', 'jugabet', 'casino buenos aires', 'rushbet', 'bodog'];
const cls = k => {
  const b = brands.find(x => k.includes(x));
  if (/iniciar|login|ingresar|registr|mi cuenta/.test(k)) return b ? 'brand-login' : 'login';
  if (/\bapp\b|apk|descargar|android|iphone|celular|mobile/.test(k)) return b ? 'brand-app' : 'app';
  if (/codigo|código|promo|bono|bonus|gratis|free/.test(k)) return 'promo/free';
  if (/legal|habilitad|licencia|autorizad|oficial|seguro|confiable|es real|estafa/.test(k)) return b ? 'brand-legal' : 'legal';
  if (/pba|caba|cba|cordoba|córdoba|mendoza|santa fe|provincia|buenos aires|jujuy|neuquen|neuquén|rio negro|río negro|la rioja|salta|tucuman|tucumán|chaco|misiones|corrientes|entre rios/.test(k) && b) return 'brand-province';
  if (/casino/.test(k)) return b ? 'brand-casino' : 'casino';
  if (b) return 'brand';
  if (/apuesta|casa de|casas de|cuota|momio|handicap|hándicap|pronostic/.test(k)) return 'betting-generic';
  return 'other';
};
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const pageFor = k => {
  const nk = norm(k);
  return plan.find(p => (p.keys || '').split('·').map(x => norm(x.replace(/\s[\d.,]+k?\/[\d-]+.*$/, '').trim())).includes(nk));
};
const out = rows.map(r => { const p = pageFor(r.k); return { ...r, c: cls(norm(r.k)), url: p?.url || null, built: p ? built(p) : false, wave: p?.wave || null, title: p?.title || null }; });
const by = {};
for (const r of out) { const g = by[r.c] ||= { n: 0, v: 0, planned: 0, vPlanned: 0, built: 0, vBuilt: 0 }; g.n++; g.v += r.v; if (r.url) { g.planned++; g.vPlanned += r.v; } if (r.built) { g.built++; g.vBuilt += r.v; } }
const tot = out.reduce((s, r) => s + r.v, 0);
console.log('keywords', out.length, 'volume', tot);
for (const [c, g] of Object.entries(by).sort((a, b) => b[1].v - a[1].v)) console.log(c.padEnd(16), String(g.n).padStart(4), String(g.v).padStart(8), 'planned', g.planned, g.vPlanned, 'built', g.built, g.vBuilt);
console.log('\nTOP 45 by volume:');
for (const r of out.sort((a, b) => b.v - a.v).slice(0, 45)) console.log(r.v, r.d ?? '-', r.k, '|', r.c, '|', r.url || '—', r.built ? 'BUILT' : r.url ? 'planned ' + r.wave : '');
writeFileSync(process.argv[2], JSON.stringify(out));
