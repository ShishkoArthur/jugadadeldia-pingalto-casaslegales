// Internal links of a live site: node tools/qa/links.cjs <site>
// node links.cjs <site> : every internal href / src on every sitemap page answers 200 (301 -> 200), #fragments exist; external hosts listed
const SITE = process.argv[2]; const BASE = 'https://' + SITE + '.com';
const get = async u => { for (let a = 0; a < 3; a++) { try { const r = await fetch(u, { redirect: 'manual' }); const t = /html/.test(r.headers.get('content-type') || '') ? await r.text() : ''; return { s: r.status, loc: r.headers.get('location'), t }; } catch (e) { if (a === 2) return { s: 0, t: '' }; } } };
(async () => {
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  const pages = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const html = {}; const ext = {}; const targets = new Map();
  for (const u of pages) { const r = await get(u); html[u] = r; if (r.s !== 200) console.log('PAGE', r.s, u); }
  for (const [u, r] of Object.entries(html)) {
    for (const m of r.t.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const h = m[1].replace(/&amp;/g, '&'); if (/^(mailto|tel|data|javascript):/.test(h)) continue;
      const x = new URL(h, u); if (x.origin !== BASE) { ext[x.hostname] = (ext[x.hostname] || 0) + 1; continue; }
      const k = x.pathname + x.search; if (!targets.has(k)) targets.set(k, { from: u, frags: new Set() }); if (x.hash) targets.get(k).frags.add(x.hash.slice(1));
    }
  }
  let bad = 0;
  for (const [k, o] of targets) {
    let r = html[BASE + k] || html[BASE + k.replace(/\/$/, '')] || await get(BASE + k);
    if (r.s === 301 || r.s === 308) { const f = await get(new URL(r.loc, BASE + k).href); if (f.s !== 200) { bad++; console.log('REDIR', k, r.s, r.loc, f.s, 'from', o.from); } r = f; }
    else if (r.s !== 200) { bad++; console.log('BROKEN', r.s, k, 'from', o.from); }
    for (const fr of o.frags) if (r.t && !r.t.includes('id="' + decodeURIComponent(fr) + '"')) { bad++; console.log('FRAG', k + '#' + fr, 'from', o.from); }
  }
  console.log(SITE, 'pages', pages.length, 'targets', targets.size, 'bad', bad, 'external', JSON.stringify(ext));
})();
