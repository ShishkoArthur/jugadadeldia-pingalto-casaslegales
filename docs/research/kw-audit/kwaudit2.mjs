// Keyword -> plan page -> built? -> title contains the key? Per site. Usage: node kwaudit2.mjs <site> <regex for keyword files> <out.json>
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
const R = new URL('../../../', import.meta.url).pathname;
const [site, re, outFile] = process.argv.slice(2);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const files = readdirSync(R + 'data/keywords').filter(f => new RegExp(re).test(f));
const kw = new Map();
for (const f of files) for (const r of JSON.parse(readFileSync(R + 'data/keywords/' + f)).rows) { const k = norm(r.keyword); if (!kw.has(k)) kw.set(k, { k: r.keyword, v: r.volume || 0, d: r.difficulty }); }
const plan = JSON.parse(readFileSync(R + 'data/plan/' + site + '.json'));
const dist = R + 'dist/' + site;
const fileOf = u => [dist + (u === '/' ? '/index.html' : u.replace(/\/$/, '') + '.html'), dist + u.replace(/\/?$/, '/') + 'index.html'].find(existsSync);
const keyIdx = new Map();
for (const p of plan) for (const raw of (p.keys || '').split('·')) {
  const k = norm(raw.replace(/\s[\d.,]+\s*(k|млн)?\s*\/\s*[\d-]+.*$/i, '').replace(/\(.*?\)/g, ''));
  if (k && !keyIdx.has(k)) keyIdx.set(k, p);
}
const titleOf = f => { const h = readFileSync(f, 'utf8'); return [(h.match(/<title>([^<]*)/) || [])[1] || '', (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '') || '']; };
const out = [];
for (const r of kw.values()) {
  const p = keyIdx.get(norm(r.k));
  const f = p && fileOf(p.url);
  let tIn = null, title = null, h1 = null;
  if (f) { [title, h1] = titleOf(f); const toks = norm(r.k).split(' ').filter(t => t.length > 2 && !['de', 'del', 'la', 'el', 'los', 'las', 'que', 'hoy', 'para'].includes(t)); const nt = norm(title + ' ' + h1); tIn = toks.length ? toks.filter(t => nt.includes(t)).length / toks.length : 1; }
  out.push({ ...r, url: p?.url || null, wave: p?.wave || null, built: !!f, title, h1, tIn });
}
out.sort((a, b) => b.v - a.v);
const tot = out.reduce((s, r) => s + r.v, 0);
const sum = (f) => { const x = out.filter(f); return [x.length, x.reduce((s, r) => s + r.v, 0)]; };
console.log(site, 'files', files.length, 'kw', out.length, 'vol', tot);
console.log('mapped to plan', sum(r => r.url), 'built', sum(r => r.built), 'built & title covers ≥80%', sum(r => r.built && r.tIn >= 0.8), 'built but title weak', sum(r => r.built && r.tIn < 0.8), 'planned not built', sum(r => r.url && !r.built), 'not in plan', sum(r => !r.url));
console.log('\nTOP not in plan:'); for (const r of out.filter(r => !r.url).slice(0, 30)) console.log(' ', r.v, r.d ?? '-', r.k);
console.log('\nTOP planned not built:'); for (const r of out.filter(r => r.url && !r.built).slice(0, 20)) console.log(' ', r.v, r.d ?? '-', r.k, '→', r.url, r.wave);
console.log('\nTOP built, title weak:'); for (const r of out.filter(r => r.built && r.tIn < 0.8).slice(0, 20)) console.log(' ', r.v, r.d ?? '-', r.k, '→', r.url, '|', r.title);
console.log('\nTOP built ok:'); for (const r of out.filter(r => r.built && r.tIn >= 0.8).slice(0, 15)) console.log(' ', r.v, r.d ?? '-', r.k, '→', r.url, '|', r.title);
writeFileSync(outFile, JSON.stringify(out));
