#!/usr/bin/env node
// Own screenshots of PUBLIC pages of licensed operators (casaslegales.com): node tools/capture-shots.mjs [id ...]
// Targets: data/shots/targets.json. Headless Chrome (Playwright, read only; PLAYWRIGHT=<path to playwright/index.mjs>), es-AR,
// Buenos Aires time zone. Never logs in, never registers, never deposits; a cookie banner is declined when it offers a
// reject button and left alone otherwise; promotional pop-ups are closed with their own close button, fixed promotional bars
// are hidden; a target may set clip {x, y, width, height} to keep only part of the first screen (no promotional banner).
// Output: data/shots/<YYYY-MM-DD>/<id>.png (original, git-ignored), data/shots/shots.json (url, final url, HTTP status, date,
// page title), sites/casaslegales/static/shots/<id>.webp (what ships) and, for targets with save: true, the rendered DOM as
// a quotable document data/sources/operators/_docs/<id>.html (+ sha256 in shots.json): scripts, styles and inline SVG
// drawings are removed from that copy, the visible text stays as rendered.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './env.mjs';

const PW = process.env.PLAYWRIGHT || '/home/dev/manuallysites/casinovictoriaargentina/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const sharp = (await import('sharp')).default;
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/shots/targets.json'), 'utf8')).targets;
const MAN = path.join(ROOT, 'data/shots/shots.json');
const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : { about: 'Captures made by tools/capture-shots.mjs. ok=false: the page did not show its content to us (status and title say why).', shots: {} };
const only = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const REJECT = /^(rechazar( todo| todas)?|rechazar cookies|solo (las )?(cookies )?necesarias|denegar|no acepto|reject( all)?|decline)$/i;
const PROMO = /bono|dep[oó]sito|c[oó]digo|promo|premio|acreditamos|gratis/;
const CLOSE = '[aria-label="Close"],[aria-label="Cerrar"],[aria-label="close"],[aria-label="cerrar"],button.close,.modal .close,.popup-close,[class*="close-button"],[class*="modal__close"]';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' });

async function tidy(p) {
  const reject = p.getByRole('button', { name: REJECT }).first();
  if (await reject.isVisible({ timeout: 500 }).catch(() => false)) { await reject.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(800); }
  for (const c of (await p.locator(CLOSE).all()).slice(0, 5)) if (await c.isVisible({ timeout: 300 }).catch(() => false)) await c.click({ timeout: 1500, noWaitAfter: true }).catch(() => {});
  await p.keyboard.press('Escape').catch(() => {});
  await p.waitForTimeout(800);
  return p.evaluate(re => {
    const promo = new RegExp(re, 'i');
    let n = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 40 || !promo.test(el.innerText || '')) continue;
      el.style.setProperty('display', 'none', 'important');
      n++;
    }
    return n;
  }, PROMO.source).catch(() => 0);
}

for (const t of T) {
  if (only.length && !only.includes(t.id)) continue;
  const p = await ctx.newPage();
  let status = 0, err = '';
  try { const r = await p.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); status = r ? r.status() : 0; await p.waitForTimeout(7000); }
  catch (e) { err = e.message.split('\n')[0]; }
  const title = (await p.title().catch(() => '')).trim();
  const text = ((await p.evaluate(() => document.body ? document.body.innerText : '').catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  const blocked = status >= 400 || status === 0 || /attention required|access denied|you have been blocked|no tiene acceso|not available|isn.t available from your region|restricted due to|sitio restringido|acceso restringido/i.test(title + ' ' + text.slice(0, 400));
  const rec = { id: t.id, brand: t.brand, kind: t.kind, url: t.url, finalUrl: p.url(), status, date: today, title, ok: !blocked && !err, err: err || undefined, excerpt: text.slice(0, 200) };
  if (!err) {
    if (!blocked) rec.hiddenPromo = await tidy(p);
    const dir = path.join(ROOT, 'data/shots', today);
    fs.mkdirSync(dir, { recursive: true });
    const png = path.join(dir, t.id + '.png');
    if (t.kind === 'footer' && !blocked) {
      const all = p.locator('footer');
      let f = null, best = 0;
      for (const x of await all.all()) { const b = await x.boundingBox().catch(() => null); if (b && b.height > best) { best = b.height; f = x; } }
      if (f) {
        await f.scrollIntoViewIfNeeded().catch(() => {});
        await p.waitForTimeout(1500);
        rec.hiddenPromo = (rec.hiddenPromo || 0) + await tidy(p);
        const full = await f.screenshot({ timeout: 15000 });
        const m = await sharp(full).metadata();
        await sharp(full).extract({ left: 0, top: 0, width: m.width, height: Math.min(m.height, 900) }).png().toFile(png);
      } else await p.screenshot({ path: png });
    } else await p.screenshot({ path: png, clip: t.clip || undefined });
    rec.png = path.relative(ROOT, png);
    const buf = fs.readFileSync(png);
    rec.pngSha256 = sha(buf);
    const outDir = path.join(ROOT, 'sites/casaslegales/static/shots');
    fs.mkdirSync(outDir, { recursive: true });
    const meta = await sharp(buf).metadata();
    rec.width = Math.min(960, meta.width);
    const webp = await sharp(buf).resize({ width: rec.width }).webp({ quality: 62 }).toBuffer();
    rec.height = (await sharp(webp).metadata()).height;
    fs.writeFileSync(path.join(outDir, t.id + '.webp'), webp);
    rec.webp = 'sites/casaslegales/static/shots/' + t.id + '.webp';
    if (t.save) {
      const html = (await p.content()).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<svg\b[\s\S]*?<\/svg>/gi, '<svg></svg>');
      const dd = path.join(ROOT, 'data/sources/operators/_docs');
      fs.mkdirSync(dd, { recursive: true });
      fs.writeFileSync(path.join(dd, t.id + '.html'), html);
      rec.doc = { file: 'data/sources/operators/_docs/' + t.id + '.html', sha256: sha(Buffer.from(html, 'utf8')) };
    }
  }
  if (err && man.shots[t.id] && !man.shots[t.id].err) console.log('  kept the previous capture of ' + t.id);
  else man.shots[t.id] = rec;
  fs.writeFileSync(MAN, JSON.stringify(man, null, 1) + '\n');
  console.log((rec.ok ? 'ok   ' : 'BLOCK') + ' ' + t.id + ' ' + status + ' ' + rec.finalUrl + ' | ' + title.slice(0, 60) + (err ? ' | ' + err : ''));
  await p.close();
  await new Promise(r => setTimeout(r, 1500));
}
await browser.close();
fs.writeFileSync(MAN, JSON.stringify(man, null, 1) + '\n');
