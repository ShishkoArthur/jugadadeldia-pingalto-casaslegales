// Live QA pass (read-only Playwright from another project): every sitemap URL x 375/768/1280 x light/dark - overflow, escaping and overlapping
// elements, clipped text, images (broken / upscaled by srcset width), contrast, tap targets, sticky header, covered controls, burger menu,
// keyboard focus, junk text after driving each tool. Output: <out>/results.json and screenshots in <out>/shots.
// node tools/qa/live-pass.cjs --site pingalto [--workers 2] [--paths /a,/b] [--combos 375-light,...] [--out dir]
const { chromium } = require('/home/dev/manuallysites/casinovictoriaargentina/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SITE = arg('site');
const BASE = arg('base', 'https://' + SITE + '.com');
const OUT = path.resolve(arg('out', path.join(__dirname, '../../dist/qa', SITE)));
const WORKERS = +arg('workers', 2);
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const CFG = {
  jugadadeldia: { header: 'header.jg-h', burger: '[data-jg-menu]', panel: '#jg-panel', main: 'main' },
  pingalto: { header: 'header.pa-hd', burger: '[data-pa-menu]', panel: '#pa-nv', main: 'main' },
  casaslegales: { header: 'header.rl-top', burger: '[data-rl-menu]', panel: '#rl-nav', main: 'main' },
}[SITE];
const ALL = [
  { id: '375-light', w: 375, h: 812, scheme: 'light', dpr: 2 },
  { id: '375-dark', w: 375, h: 812, scheme: 'dark', dpr: 2 },
  { id: '768-light', w: 768, h: 1024, scheme: 'light', dpr: 1 },
  { id: '768-dark', w: 768, h: 1024, scheme: 'dark', dpr: 1 },
  { id: '1280-light', w: 1280, h: 900, scheme: 'light', dpr: 1 },
  { id: '1280-dark', w: 1280, h: 900, scheme: 'dark', dpr: 1 },
];
const COMBOS = arg('combos') ? ALL.filter(c => arg('combos').split(',').includes(c.id)) : ALL;
const slug = s => s.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '_') || 'home';

function helpers() {
  if (window.__qa) return;
  const vis = el => { if (!el || !el.getClientRects().length) return false; if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
  const sel = el => { if (!el || el === document.body) return 'body'; let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const c = (typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '')).trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += '.' + c.join('.'); return s; };
  const chain = el => { const a = []; for (let e = el; e && e !== document.body && a.length < 4; e = e.parentElement) a.unshift(sel(e)); return a.join(' > '); };
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const rgba = c => { if (cache.has(c)) return cache.get(c); cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = [...cx.getImageData(0, 0, 1, 1).data]; d[3] /= 255; cache.set(c, d); return d; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (t, u) => { const a = t[3]; return [t[0] * a + u[0] * (1 - a), t[1] * a + u[1] * (1 - a), t[2] * a + u[2] * (1 - a), 1]; };
  const bgOf = el => {
    const layers = [];
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = rgba(s.backgroundColor); if (c[3] > 0) layers.push(c); if (c[3] > 0.99) break; }
    let base = rgba(getComputedStyle(document.documentElement).backgroundColor);
    if (base[3] < 0.99) base = rgba(getComputedStyle(document.body).backgroundColor);
    if (base[3] < 0.99) base = [255, 255, 255, 1];
    let c = layers.length && layers[layers.length - 1][3] > 0.99 ? layers.pop() : base;
    while (layers.length) c = over(layers.pop(), c);
    return c;
  };
  const ratio = (fg, bg) => { const f = fg[3] < 1 ? over(fg, bg) : fg; const a = lum(f), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  window.__qa = { vis, sel, chain, rgba, bgOf, ratio, ownText };
}

function probe(o) {
  const { vis, sel, chain, rgba, bgOf, ratio, ownText } = window.__qa;
  const out = {};
  const de = document.documentElement;
  out.h1 = document.querySelectorAll('h1').length;
  out.sw = de.scrollWidth; out.cw = de.clientWidth;
  if (out.sw > out.cw + 1) {
    const cul = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right <= out.cw + 1 && r.left >= -1) continue;
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox !== 'visible') { clipped = true; break; } }
      if (clipped) continue;
      const par = el.parentElement; const pr = par && par.getBoundingClientRect();
      if (par && par !== document.body && pr && (pr.right > out.cw + 1 || pr.left < -1)) continue;
      cul.push(chain(el) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      if (cul.length >= 5) break;
    }
    out.overflowCulprits = cul;
  }
  const main = document.querySelector('main') || document.body;
  const boxed = s => (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && rgba(s.backgroundColor)[3] > 0.05) || parseFloat(s.borderLeftWidth) > 0 || parseFloat(s.borderRightWidth) > 0 || s.backgroundImage !== 'none';
  // element sticking out of its nearest boxed ancestor (tags leaving cards)
  const esc = [];
  for (const el of main.querySelectorAll('*')) {
    if (esc.length >= 8) break;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    let anc = null, clipped = false;
    for (let p = el.parentElement; p && p !== main.parentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { clipped = true; break; }
      if (boxed(ps) && p.tagName !== 'BODY' && p.tagName !== 'MAIN' && p.tagName !== 'HTML') { anc = p; break; }
    }
    if (clipped || !anc) continue;
    const ar = anc.getBoundingClientRect();
    const dx = Math.max(r.right - ar.right, ar.left - r.left), dy = Math.max(r.bottom - ar.bottom, ar.top - r.top);
    if (dx > 2 || dy > 2) {
      // report outermost escaping element only
      const p = el.parentElement; if (p && p !== anc) { const pr = p.getBoundingClientRect(); if (pr.right - ar.right > 2 || ar.left - pr.left > 2 || pr.bottom - ar.bottom > 2 || ar.top - pr.top > 2) continue; }
      esc.push(chain(el) + ' out of ' + sel(anc) + ' by ' + Math.round(Math.max(dx, dy)) + 'px "' + (el.textContent || '').trim().slice(0, 30) + '"');
    }
  }
  out.escape = esc;
  // overlapping in-flow siblings
  const ovl = [];
  for (const par of main.querySelectorAll('*')) {
    if (ovl.length >= 6) break;
    const kids = [...par.children].filter(k => { if (!vis(k) || k.getAttribute('aria-hidden') === 'true') return false; const s = getComputedStyle(k); return (s.position === 'static' || s.position === 'relative' || s.position === 'sticky') && !/^inline$/.test(s.display) && s.float === 'none'; });
    if (kids.length < 2 || kids.length > 60) continue;
    const rs = kids.map(k => k.getBoundingClientRect());
    for (let i = 0; i < kids.length && ovl.length < 6; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = rs[i], b = rs[j];
      if (a.width < 2 || a.height < 2 || b.width < 2 || b.height < 2) continue;
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 4 && iy > 4) {
        const ms = [getComputedStyle(kids[i]).marginTop, getComputedStyle(kids[j]).marginTop, getComputedStyle(kids[i]).marginLeft, getComputedStyle(kids[j]).marginLeft];
        ovl.push(chain(kids[i]) + ' x ' + sel(kids[j]) + ' ' + Math.round(ix) + 'x' + Math.round(iy) + ' m' + ms.join('/'));
        break;
      }
    }
  }
  out.overlap = ovl;
  // clipped text: overflow hidden/clip with content larger than box
  const clip = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (clip.length >= 6) break;
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    const hx = s.overflowX === 'hidden' || s.overflowX === 'clip', hy = s.overflowY === 'hidden' || s.overflowY === 'clip';
    if (!hx && !hy && s.textOverflow !== 'ellipsis') continue;
    if (!el.innerText || !el.innerText.trim()) continue;
    if (el.closest('.sr-only,.sr,.jg-skip,.pa-skip,.rl-skip')) continue;
    if ((hx || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2) clip.push(chain(el) + ' x ' + el.scrollWidth + '>' + el.clientWidth + ' "' + el.innerText.trim().slice(0, 30) + '"');
    else if (hy && el.scrollHeight > el.clientHeight + 3 && el.clientHeight > 0 && s.webkitLineClamp === 'none') clip.push(chain(el) + ' y ' + el.scrollHeight + '>' + el.clientHeight + ' "' + el.innerText.trim().slice(0, 30) + '"');
  }
  out.clip = clip;
  // words sticking out of their block
  const ow = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? 1 : 2 });
  const rng = document.createRange();
  for (let n = tw.nextNode(); n && ow.length < 6; n = tw.nextNode()) {
    const p = n.parentElement; if (!p || p.closest('svg, script, style, noscript') || !vis(p)) continue;
    let blk = p; while (blk && /^inline/.test(getComputedStyle(blk).display)) blk = blk.parentElement;
    if (!blk) continue;
    const bs = getComputedStyle(blk);
    if (bs.overflowX !== 'visible' || bs.textOverflow === 'ellipsis') continue;
    rng.selectNodeContents(n);
    const br = blk.getBoundingClientRect(); const right = br.right - parseFloat(bs.borderRightWidth); const left = br.left + parseFloat(bs.borderLeftWidth);
    for (const r of rng.getClientRects()) { if (r.width < 1) continue; if (r.right > right + 2 || r.left < left - 2) { ow.push(chain(blk) + ' +' + Math.round(Math.max(r.right - right, left - r.left)) + 'px "' + n.textContent.trim().slice(0, 40) + '"'); break; } }
  }
  out.wordOverflow = ow;
  // junk text
  const txt = document.body.innerText; const junk = []; const re = /\bundefined\b|\bNaN\b|\bnull\b|\[object Object\]|\{\{|\}\}|Infinity/g; let m;
  while ((m = re.exec(txt)) && junk.length < 5) junk.push(txt.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' '));
  out.junk = junk;
  // images
  out.img = [];
  for (const i of document.images) {
    const src = (i.currentSrc || i.src || '').replace(location.origin, '');
    if (!src) continue;
    if (!i.complete) { if (i.loading !== 'lazy') out.img.push('not loaded ' + src); continue; }
    if (!i.naturalWidth) { out.img.push('broken ' + src); continue; }
    if (/\.svg(\?|$)/.test(src)) continue;
    if (!vis(i)) continue;
    const r = i.getBoundingClientRect(); const s = getComputedStyle(i);
    let rw = r.width, rh = r.height;
    if (s.objectFit === 'contain' || s.objectFit === 'scale-down') { const k = Math.min(r.width / i.naturalWidth, r.height / i.naturalHeight); rw = i.naturalWidth * k; rh = i.naturalHeight * k; }
    if (s.objectFit === 'cover') { const k = Math.max(r.width / i.naturalWidth, r.height / i.naturalHeight); rw = i.naturalWidth * k; }
    let fw = i.naturalWidth;
    const ss = i.getAttribute('srcset');
    if (ss) { for (const part of ss.split(',')) { const [u, d] = part.trim().split(/\s+/); if (d && /w$/.test(d) && new URL(u, location.href).href === i.currentSrc) fw = parseInt(d); } }
    if (fw < rw * devicePixelRatio * 0.9 && rw > 40) out.img.push('upscaled ' + src + ' file ' + fw + 'w < ' + Math.round(rw) + 'x' + devicePixelRatio);
    if (!i.hasAttribute('alt')) out.img.push('no alt ' + src);
  }
  out.scene = [...document.querySelectorAll('.jg-girl img, .pa-girl img')].filter(vis).map(i => { const r = i.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY), nw: i.naturalWidth, src: (i.currentSrc || '').split('/').pop() }; });
  // contrast samples
  const lc = []; let lcn = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg, [aria-hidden="true"]') || !vis(el)) continue;
    const t = ownText(el); if (!t || !/[\p{L}\p{N}]/u.test(t)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (el.disabled || el.closest('[disabled]')) continue;
    const cs = getComputedStyle(el); const bg = bgOf(el); if (!bg) continue;
    const fg = rgba(cs.color); if (fg[3] < 0.3) continue;
    const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight || 400;
    const need = (fs >= 24 || (fs >= 18.66 && fw >= 700)) ? 3 : 4.5;
    const k = ratio(fg, bg);
    if (k < need - 0.005) { lcn++; if (lc.length < 6) lc.push(chain(el) + ' ' + k.toFixed(2) + '<' + need + ' ' + fs + 'px "' + t.slice(0, 24) + '"'); }
  }
  out.lowContrastN = lcn; out.lowContrast = lc;
  // tap targets on phones
  if (o.phone) {
    const small = []; let n = 0;
    for (const el of document.querySelectorAll('a[href], button, select, input:not([type=hidden]), summary, textarea, [role="tab"], label')) {
      if (!vis(el) || el.closest('.sr-only')) continue;
      if (el.tagName === 'LABEL' && !el.querySelector('input[type=radio], input[type=checkbox]')) continue;
      if (el.tagName === 'INPUT' && /^(radio|checkbox)$/.test(el.type) && el.closest('label')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) continue;
      if (el.tagName === 'A') {
        const cs = getComputedStyle(el);
        if (/^inline/.test(cs.display) && cs.display !== 'inline-block' && cs.display !== 'inline-flex') {
          const par = el.parentElement; const own = par ? ownText(par) : '';
          if (own.replace(/[\s·|,.;:()\-–—→]/g, '').length > 0) continue;
          if (par && /^(P|LI|TD|DD|SMALL|SPAN|B|STRONG|EM)$/.test(par.tagName) && (par.innerText || '').length > (el.innerText || '').length + 8) continue;
        }
      }
      if (r.height < 39.5 || r.width < 24) { n++; if (small.length < 8) small.push(chain(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24) + '"'); }
    }
    out.tapN = n; out.tapSmall = small;
  }
  // tables small text on phone
  if (o.phone) { let n = 0; const s = []; for (const c of document.querySelectorAll('table td, table th')) { if (!vis(c)) continue; const fs = parseFloat(getComputedStyle(c).fontSize); if (fs < 13) { n++; if (s.length < 2) s.push(chain(c) + ' ' + fs + 'px'); } } out.smallTable = n ? n + ' ' + s.join('; ') : ''; }
  out.textLen = (main.innerText || '').length;
  return out;
}

// scroll the page in steps; check sticky header stays at top and controls in view are not covered
async function scrollProbe(page, cfg) {
  return page.evaluate(async cfg => {
    const { vis, chain, sel } = window.__qa;
    const hd = document.querySelector(cfg.header);
    const res = { header: null, covered: [], headerCovered: [] };
    if (!hd) { res.header = 'no header'; return res; }
    const pos = getComputedStyle(hd).position;
    res.headerPos = pos;
    const H = document.documentElement.scrollHeight; const vh = innerHeight;
    const steps = Math.min(14, Math.ceil(H / (vh * 0.8)));
    const seen = new Set();
    for (let s = 0; s <= steps; s++) {
      window.scrollTo(0, Math.min(H - vh, s * vh * 0.8)); await new Promise(f => setTimeout(f, 60));
      const hr = hd.getBoundingClientRect();
      if (s > 0 && scrollY > 200 && (pos === 'sticky' || pos === 'fixed') && Math.abs(hr.top) > 1 && hr.bottom > 0) res.header = 'header top ' + Math.round(hr.top) + ' at y ' + Math.round(scrollY);
      if (s > 0 && scrollY > 200 && pos !== 'sticky' && pos !== 'fixed' && !res.header) res.header = 'header not sticky (' + pos + ')';
      // things painted over the header
      if (hr.bottom > 0) for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) { const el = document.elementFromPoint(innerWidth * x, Math.max(1, hr.top + hr.height / 2)); if (el && !hd.contains(el) && !el.closest(cfg.panel)) res.headerCovered.push(chain(el)); }
      const hb = hr.bottom > 0 ? hr.bottom : 0;
      for (const el of document.querySelectorAll('main button, main input:not([type=hidden]), main select, main a[href], main [role=tab], main summary')) {
        if (seen.has(el) || !vis(el)) continue;
        const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cy < hb + 2 || cy > innerHeight - 2 || cx < 0 || cx > innerWidth) continue;
        seen.add(el);
        let clippedOut = false;
        for (let q = el.parentElement; q && q !== document.body; q = q.parentElement) { const qs = getComputedStyle(q); if (qs.overflowX !== 'visible' || qs.overflowY !== 'visible') { const qr = q.getBoundingClientRect(); if (cx < qr.left || cx > qr.right || cy < qr.top || cy > qr.bottom) { clippedOut = true; break; } } }
        if (clippedOut) continue;
        const top = document.elementFromPoint(cx, cy);
        if (!top || el.contains(top) || top.contains(el)) continue;
        if (top.tagName === 'LABEL' && (top.control === el || top.contains(el))) continue;
        if (el.labels && [...el.labels].some(l => l.contains(top))) continue;
        if (/^(radio|checkbox)$/.test(el.type)) continue;
        res.covered.push(chain(el) + ' "' + (el.textContent || el.value || '').trim().slice(0, 20) + '" under ' + chain(top));
        if (res.covered.length > 6) break;
      }
    }
    window.scrollTo(0, 0);
    res.headerCovered = [...new Set(res.headerCovered)].slice(0, 4);
    return res;
  }, cfg);
}

async function focusProbe(page) {
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  const keys = []; const bad = []; let stuck = 0, prev = null;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return { end: true };
      const { chain } = window.__qa;
      const st = e => { const s = getComputedStyle(e); return [s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? 'o' + s.outlineWidth + s.outlineColor : '', s.boxShadow, s.backgroundColor, s.borderColor, s.color, s.textDecorationLine].join('|'); };
      const f = st(el); el.blur(); const b = st(el); el.focus({ preventScroll: true });
      let via = false; if (f === b) { const p = el.closest('label') || el.parentElement; if (p) { const a = st(p); el.blur(); const c = st(p); el.focus({ preventScroll: true }); via = a !== c; } }
      const rr = el.getBoundingClientRect();
      return { key: chain(el) + '|' + (el.getAttribute('href') || el.id || (el.textContent || '').trim().slice(0, 20)), noRing: f === b && !via, off: rr.width < 1 || rr.height < 1 };
    });
    if (r.end) break;
    if (r.key === prev) { stuck++; if (stuck > 2) { bad.push('focus stuck on ' + r.key); break; } } else stuck = 0;
    prev = r.key;
    if (keys.includes(r.key) && keys.length > 3) break;
    keys.push(r.key);
    if (r.noRing && !r.off) bad.push('no visible focus: ' + r.key);
  }
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  return { n: keys.length, bad: [...new Set(bad)].slice(0, 5) };
}

async function menuProbe(page, cfg, combo) {
  const bad = [];
  const b = await page.$(cfg.burger);
  if (!b) return { bad: ['no burger'] };
  if (!(await b.isVisible())) return { bad: combo.w < 900 ? ['burger hidden at ' + combo.w] : [], hidden: true };
  await b.click(); await page.waitForTimeout(300);
  const o = await page.evaluate(cfg => { const l = document.querySelector(cfg.panel); if (!l) return { none: true }; const r = l.getBoundingClientRect(); const links = [...l.querySelectorAll('a')].filter(a => window.__qa.vis(a)); const out = links.filter(a => { const q = a.getBoundingClientRect(); return q.right > innerWidth + 1 || q.left < -1; }).map(a => a.textContent.trim()); const small = combo => links.filter(a => a.getBoundingClientRect().height < 39.5).length; const last = links[links.length - 1]; let reach = true; if (last) { last.scrollIntoView({ block: 'nearest' }); const q = last.getBoundingClientRect(); reach = q.bottom <= innerHeight + 1 && q.top >= 0; } return { vis: window.__qa.vis(l), n: links.length, out, small: small(), reach, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, exp: document.querySelector(cfg.burger).getAttribute('aria-expanded') }; }, cfg);
  if (o.none) bad.push('menu panel ' + cfg.panel + ' missing');
  else {
    if (!o.vis) bad.push('burger did not open the menu');
    if (o.out.length) bad.push('menu items outside viewport: ' + o.out.slice(0, 3).join(', '));
    if (combo.w < 600 && o.small) bad.push(o.small + ' menu items < 40px tall');
    if (!o.reach) bad.push('last menu item not reachable');
    if (o.sw > o.cw + 1) bad.push('menu open: h-scroll ' + o.sw);
    if (o.exp !== 'true') bad.push('aria-expanded not true after open');
  }
  const shot = bad.length ? null : null;
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const closed = await page.evaluate(cfg => { const l = document.querySelector(cfg.panel); return !l || !window.__qa.vis(l) || document.querySelector(cfg.burger).getAttribute('aria-expanded') !== 'true'; }, cfg);
  if (!closed) { bad.push('Escape did not close the menu'); await page.click(cfg.burger).catch(() => {}); }
  return { bad, n: o.n };
}

// tools: drive controls inside main (outside header/footer), check junk/errors/overflow after each
async function exerciseTools(page, errs, combo) {
  const ctls = await page.evaluate(() => {
    const { vis } = window.__qa;
    const main = document.querySelector('main'); if (!main) return [];
    const passive = e => /share|copy|compart|copiar|descarg|download|imprim|print/i.test((e.className || '') + ' ' + (e.textContent || '').slice(0, 30) + ' ' + (e.getAttribute('aria-label') || '') + ' ' + [...e.attributes].map(a => a.name).join(' '));
    const all = [...main.querySelectorAll('button, select, input, [role="tab"], summary')].filter(e => e.type !== 'hidden' && !e.disabled && !passive(e) && e.getAttribute('aria-pressed') !== 'true' && e.getAttribute('aria-selected') !== 'true' && (vis(e) || (/^(radio|checkbox)$/.test(e.type) && e.closest('label') && vis(e.closest('label')))));
    const kind = e => e.tagName === 'SELECT' ? 'select' : e.tagName === 'INPUT' ? e.type || 'text' : e.tagName === 'SUMMARY' ? 'summary' : 'button';
    const pick = []; const seenK = new Set(); const seenName = new Set();
    for (const e of all) { const k = kind(e); if (!seenK.has(k)) { seenK.add(k); pick.push(e); if (e.name) seenName.add(e.name); } }
    for (const e of all) { if (pick.length >= 10) break; if (pick.includes(e)) continue; if (e.name && seenName.has(e.name)) continue; if (e.name) seenName.add(e.name); pick.push(e); }
    return pick.map((e, i) => { e.setAttribute('data-qa-c', i); return { i, kind: kind(e), label: (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.name ? '[' + e.name + ']' : '') + ' "' + (e.getAttribute('aria-label') || e.textContent || (e.labels && e.labels[0] && e.labels[0].textContent) || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"'), min: e.min, max: e.max, value: e.value, nopt: e.options ? e.options.length : 0 }; });
  });
  const url0 = page.url();
  const acts = []; let changed = 0;
  const mainText = () => page.evaluate(() => (document.querySelector('main') || document.body).innerText);
  for (const c of ctls) {
    const loc = page.locator('[data-qa-c="' + c.i + '"]');
    if (!(await loc.count())) { acts.push({ c: c.label, gone: true }); continue; }
    const vs = [];
    if (c.kind === 'select' && c.nopt > 1) { vs.push(['opt next', async () => { const [n, cur] = await loc.evaluate(e => [e.options.length, e.selectedIndex]); await loc.selectOption({ index: (cur + 1) % n }, { timeout: 2000 }); }]); vs.push(['opt last', async () => { const n = await loc.evaluate(e => e.options.length); await loc.selectOption({ index: n - 1 }, { timeout: 2000 }); }]); }
    else if (c.kind === 'range') { const setR = v => loc.evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v)); vs.push(['max', () => setR(c.max || 100)]); vs.push(['min', () => setR(c.min || 0)]); }
    else if (/^(number|text|search|tel)$/.test(c.kind)) {
      const n = parseFloat(String(c.value).replace(/\./g, '').replace(',', '.'));
      const a = isFinite(n) ? String(Math.round((n * 1.5 + 1) * 100) / 100).replace('.', ',') : '25';
      const fill = v => async () => { await loc.fill(v, { timeout: 2000 }); await loc.press('Tab').catch(() => {}); };
      vs.push(['fill ' + a, fill(a)]); vs.push(['fill empty', fill('')]); vs.push(['fill 0', fill('0')]); if (c.kind === 'number' && c.max) vs.push(['fill max+1', fill(String(+c.max + 1))]); vs.push(['restore', fill(String(c.value))]);
    } else if (/^(radio|checkbox)$/.test(c.kind)) vs.push(['toggle', async () => { try { await loc.click({ timeout: 1500 }); } catch (e) { const lab = page.locator('label:has([data-qa-c="' + c.i + '"])'); if (await lab.count()) await lab.first().click({ timeout: 1500 }); else await loc.evaluate(e => e.click()); } }]);
    else vs.push(['click', async () => { try { await loc.click({ timeout: 2000 }); } catch (e) { await loc.evaluate(e => e.click()); } }]);
    for (const [vn, fn] of vs) {
      const e0 = errs.length; const before = await mainText().catch(() => '');
      try { await fn(); } catch (e) { acts.push({ c: c.label, v: vn, err: e.message.split('\n')[0].slice(0, 100) }); continue; }
      await page.waitForTimeout(450);
      if (new URL(page.url()).pathname !== new URL(url0).pathname) { acts.push({ c: c.label, v: vn, nav: page.url() }); await page.goto(url0, { waitUntil: 'load' }); await page.evaluate(helpers); break; }
      const o = await page.evaluate(() => { const t = document.body.innerText; const m = t.match(/\bundefined\b|\bNaN\b|\bnull\b|\[object Object\]|\{\{|Infinity/); const de = document.documentElement; return { junk: m ? t.slice(Math.max(0, m.index - 50), m.index + 40).replace(/\s+/g, ' ') : null, ov: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0, mt: (document.querySelector('main') || document.body).innerText }; });
      if (o.mt !== before) changed++;
      const a = { c: c.label, v: vn };
      if (o.junk) a.junk = o.junk; if (o.ov) a.ov = o.ov; if (errs.length > e0) a.errs = errs.slice(e0);
      if (a.junk || a.ov || a.errs) acts.push(a);
    }
  }
  return { n: ctls.length, changed, bad: acts };
}

async function runOne(browser, p, combo, res) {
  const ctx = await browser.newContext({ viewport: { width: combo.w, height: combo.h }, deviceScaleFactor: combo.dpr, colorScheme: combo.scheme, isMobile: combo.w < 600, hasTouch: combo.w < 600, userAgent: combo.w < 600 ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 QA' : undefined });
  const page = await ctx.newPage();
  const errs = []; const failed = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('requestfailed', r => { const u = r.url(); if (!/google|cloudflareinsights|beacon/.test(u)) failed.push('failed ' + u.replace(BASE, '') + ' ' + (r.failure() || {}).errorText); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('cdn-cgi')) failed.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  const r = { path: p, combo: combo.id }; const t00 = Date.now();
  try {
    const resp = await page.goto(BASE + p, { waitUntil: 'load', timeout: 45000 });
    r.status = resp ? resp.status() : 0;
    await page.waitForTimeout(700);
    await page.evaluate(helpers);
    // trigger lazy images
    await page.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += innerHeight) { window.scrollTo(0, y); await new Promise(f => setTimeout(f, 40)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(500);
    if (combo.id === '375-light' || combo.id === '1280-light') {
      await page.screenshot({ path: path.join(SHOTS, slug(p) + '__' + combo.id + '__top.jpg'), type: 'jpeg', quality: 60, scale: 'css' });
      if (combo.id === '375-light') await page.screenshot({ path: path.join(SHOTS, slug(p) + '__' + combo.id + '__full.jpg'), type: 'jpeg', quality: 50, fullPage: true, scale: 'css' });
    }
    const T = r.t = {}; let t = Date.now(); const lap = k => { T[k] = Date.now() - t; t = Date.now(); };
    lap('load');
    Object.assign(r, await page.evaluate(probe, { phone: combo.w < 600 })); lap('probe');
    r.scroll = await scrollProbe(page, CFG); lap('scroll');
    if (combo.w < 900 && combo.scheme === 'light') { r.menu = await menuProbe(page, CFG, combo); lap('menu'); }
    if (combo.id === '1280-light') { r.focus = await focusProbe(page); lap('focus'); }
    if (combo.id === '375-light' || combo.id === '1280-light') {
      r.tools = await exerciseTools(page, errs, combo);
      lap('tools');
      if (r.tools.bad.length) await page.screenshot({ path: path.join(SHOTS, slug(p) + '__' + combo.id + '__tools.jpg'), type: 'jpeg', quality: 55, fullPage: true, scale: 'css' }).catch(() => {});
    }
  } catch (e) { r.fatal = e.message.split('\n')[0].slice(0, 200); }
  r.ms = Date.now() - t00;
  r.errs = [...new Set(errs)].slice(0, 6); r.failed = [...new Set(failed)].slice(0, 6);
  const issue = r.fatal || r.status !== 200 || (r.overflowCulprits && r.overflowCulprits.length) || (r.sw > r.cw + 1) || (r.escape && r.escape.length) || (r.junk && r.junk.length) || r.errs.length || r.failed.length || (r.img && r.img.length) || (r.scroll && (r.scroll.covered.length || r.scroll.header)) || (r.menu && r.menu.bad.length);
  if (issue && !(combo.id === '375-light')) await page.screenshot({ path: path.join(SHOTS, slug(p) + '__' + combo.id + '__issue.jpg'), type: 'jpeg', quality: 50, scale: 'css' }).catch(() => {});
  await ctx.close().catch(() => {});
  res.push(r);
}

(async () => {
  const sm = await (await fetch(BASE + '/sitemap.xml?qa=' + Date.now())).text();
  let paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(BASE, '') || '/');
  if (arg('paths')) paths = arg('paths').split(',');
  if (!arg('paths')) paths.push('/no-existe-qa-404');
  const jobs = []; for (const p of paths) for (const c of COMBOS) jobs.push([p, c]);
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const res = []; let k = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async () => { while (k < jobs.length) { const [p, c] = jobs[k++]; await runOne(browser, p, c, res); if (res.length % 25 === 0) console.log(res.length + '/' + jobs.length, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } }));
  await browser.close();
  res.sort((a, b) => a.path.localeCompare(b.path) || a.combo.localeCompare(b.combo));
  const file = path.join(OUT, arg('paths') ? 'recheck.json' : 'results.json');
  fs.writeFileSync(file, JSON.stringify(res, null, 1));
  console.log('done', res.length, ((Date.now() - t0) / 1000).toFixed(0) + 's ->', file);
})();
