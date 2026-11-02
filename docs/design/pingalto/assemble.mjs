// Assemble parts/NN-*.html fragments into one comparison page for the owner (he reads it on a phone).
// node docs/design/pingalto/assemble.mjs -> docs/design/pingalto/ten-designs-2026-11-02.html
// Also runs the fragment checks from BRIEF.md and prints problems (exit code 1 if any).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = 'ten-designs-2026-11-02.html';
const MAX = 16896;

// Owner-facing labels (the owner reads Russian). Data only; this page is a design review, not a served site file.
const L = {
  title: 'Десять дизайнов pingalto',
  intro: 'Одна и та же главная pingalto.com в десяти обликах: шапка, первый экран с местом для девушки «альт», калькулятор ' +
    'чувствительности, ранги Valorant, «Esports hoy» с шансами, tier list, восемь инструментов и подвал. Числа в макетах — пример. ' +
    'У каждого макета — светлая и тёмная тема, компьютер и телефон (390 px). На телефоне вид «компьютер» уменьшен целиком. Выбор — по номеру.',
  fonts: 'Шрифты', theme: 'Тема', light: 'Светлая', dark: 'Тёмная', width: 'Ширина', desk: 'Компьютер', phone: 'Телефон',
  all: 'Все сразу', top: 'К списку',
};

const files = readdirSync(join(DIR, 'parts')).filter(f => /^\d\d-.*\.html$/.test(f)).sort();
const meta = (src, k) => (src.match(new RegExp(`<!--\\s*${k}:\\s*([\\s\\S]*?)-->`)) || [])[1]?.trim() || '';
const fams = new Map();
const problems = [];

function check(f, n, src, body) {
  const bad = m => problems.push(`${f}: ${m}`);
  const size = Buffer.byteLength(body);
  if (size > MAX) bad(`body size ${size} > ${MAX}`);
  if (/@media[^{]*width/.test(body)) bad('@media width query (use @container)');
  if (/<script|\son[a-z]+=/i.test(body)) bad('JavaScript in fragment');
  if (/<!--|\/\*/.test(body)) bad('comment left in fragment');
  if (/[Ѐ-ӿ]/.test(body)) bad('Cyrillic outside the desc comment');
  if (/<img|url\(/i.test(body)) bad('external or bitmap image');
  if (/position:\s*fixed|@import|@font-face|:root|\bbody\b|\bhtml\b/.test(body)) bad('global or forbidden CSS');
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) bad('emoji');
  const css = (body.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const prefix = new RegExp(`^\\.p${n}(?![0-9])`);
  for (const rule of css.replace(/@container[^{]*\{/g, '').split('}')) {
    const sel = rule.split('{')[0].trim();
    if (!sel || !rule.includes('{')) continue;
    for (const s of sel.split(',')) if (!prefix.test(s.trim())) bad(`selector without .p${n}: ${s.trim().slice(0, 60)}`);
  }
  const cls = [...body.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
  for (const c of cls) if (c !== 'mock' && !new RegExp(`^p${n}(-|$)`).test(c)) bad(`class without p${n}: ${c}`);
  if ((body.match(/<h1[\s>]/g) || []).length !== 1) bad('must have exactly one h1');
  if (!body.includes(`class="p${n}-girl" role="img" aria-label="Ilustración"`)) bad('character slot missing');
}

const parts = files.map(f => {
  const src = readFileSync(join(DIR, 'parts', f), 'utf8');
  const n = f.slice(0, 2);
  const fonts = meta(src, 'fonts').split('&').map(s => s.trim()).filter(s => s.startsWith('family='));
  fonts.forEach(s => fams.set(s.slice(7).split(':')[0], s));
  const body = src.replace(/<!--\s*(name|desc|fonts):[\s\S]*?-->/g, '').trim();
  check(f, n, src, body);
  const names = fonts.map(s => s.slice(7).split(':')[0].replace(/\+/g, ' '));
  return { n, name: meta(src, 'name'), desc: meta(src, 'desc'), fonts: names.join(', ') || 'системные', body };
});
const fontHref = 'https://fonts.googleapis.com/css2?' + [...fams.values()].join('&') + '&display=swap';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const toggles = (k1, k2) => `<span class="seg" role="group" aria-label="${L.theme}"><button type="button" ${k1}="light">${L.light}</button><button type="button" ${k1}="dark">${L.dark}</button></span>` +
  `<span class="seg" role="group" aria-label="${L.width}"><button type="button" ${k2}="desk">${L.desk}</button><button type="button" ${k2}="phone">${L.phone}</button></span>`;

const sections = parts.map(p => `
<section class="concept" id="d${p.n}">
 <div class="pass"><span class="num">${p.n}</span><div><h2>${esc(p.name)}</h2><p>${esc(p.desc)}</p><p class="ff">${L.fonts}: ${esc(p.fonts)}</p></div></div>
 <div class="ctrl">${toggles('data-mode', 'data-w')}<a class="up" href="#top">${L.top}</a></div>
 <div class="stage"><div class="frame">${p.body}</div></div>
</section>`).join('\n');
const index = parts.map(p => `<a href="#d${p.n}"><b>${p.n}</b> ${esc(p.name)}</a>`).join('');

// Review-page chrome: neutral graphite/violet so it does not compete with the ten concepts.
const css = `
:root{--bg:#f0eff3;--fg:#17161c;--muted:#55535f;--card:#fff;--line:#d3d1da;--accent:#5b3fc4;--ui:system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#111015;--fg:#e9e8ee;--muted:#a3a0ad;--card:#1a1920;--line:#2e2c36;--accent:#b4a2ff;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#111015;--fg:#e9e8ee;--muted:#a3a0ad;--card:#1a1920;--line:#2e2c36;--accent:#b4a2ff;color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--fg);font:15px/1.55 var(--ui);margin:0}
.wrap{max-width:1200px;margin:0 auto;padding:20px 16px 64px;display:grid;gap:40px;min-width:0}
.intro{display:grid;gap:12px;min-width:0}
.intro h1{font:800 clamp(1.6rem,6vw,2.6rem)/1.1 var(--ui);margin:0;text-wrap:balance}
.intro p{margin:0;max-width:72ch;color:var(--muted)}
.index{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.index a{color:var(--fg);text-decoration:none;border:1px solid var(--line);background:var(--card);border-radius:8px;padding:9px 10px;font-size:.88rem;min-height:40px;display:flex;gap:6px;align-items:center}
.index b{color:var(--accent);font-variant-numeric:tabular-nums}
.global,.ctrl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:.88rem;color:var(--muted)}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--card)}
.seg button{font:600 .86rem/1 var(--ui);border:0;background:transparent;color:var(--fg);padding:0 12px;min-height:40px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--fg);color:var(--bg)}
.up{margin-left:auto;color:var(--accent);font-size:.86rem;padding:10px 4px}
:is(.seg button,.index a,.up):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.concept{display:grid;gap:12px;scroll-margin-top:8px;min-width:0}
.pass{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start}
.num{font:800 2.4rem/1 var(--ui);color:var(--accent);font-variant-numeric:tabular-nums}
.pass h2{margin:0 0 4px;font:800 1.35rem/1.2 var(--ui)}
.pass p{margin:0;color:var(--muted);max-width:80ch}
.pass .ff{font-size:.82rem;margin-top:4px}
.stage{background:repeating-linear-gradient(45deg,transparent 0 10px,color-mix(in srgb,var(--line) 45%,transparent) 10px 11px);border-radius:10px;padding:10px;overflow-x:auto;min-width:0}
.frame{container-type:inline-size;margin-inline:auto;width:1120px;border-radius:6px;overflow:clip;box-shadow:0 0 0 1px var(--line)}
.frame.phone{width:min(390px,100%)}
@media (max-width:520px){.wrap{padding-inline:12px}.stage{padding:6px;border-radius:8px}.num{font-size:2rem}}
`;

const js = `
(function(){
  var dark=false,narrow=false;
  try{dark=window.matchMedia("(prefers-color-scheme: dark)").matches;narrow=window.matchMedia("(max-width: 760px)").matches}catch(e){}
  var all=[].slice.call(document.querySelectorAll(".concept"));
  function fit(s){
    var f=s.querySelector(".frame"),st=s.querySelector(".stage");
    if(f.classList.contains("phone")){f.style.zoom="";return}
    var cs=getComputedStyle(st),w=st.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    f.style.zoom=w<1120?String(Math.max(.2,w/1120)):"";
  }
  function set(s,k,v){
    if(k==="mode")s.querySelector(".mock").setAttribute("data-mode",v);
    else{s.querySelector(".frame").classList.toggle("phone",v==="phone");fit(s)}
    s.querySelectorAll("button[data-"+k+"]").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-"+k)===v))});
  }
  all.forEach(function(s){
    set(s,"mode",dark?"dark":"light");set(s,"w",narrow?"phone":"desk");
    s.querySelector(".ctrl").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;
      if(b.hasAttribute("data-mode"))set(s,"mode",b.getAttribute("data-mode"));else set(s,"w",b.getAttribute("data-w"))});
  });
  function sync(k,v){document.querySelectorAll(".global button[data-g"+k+"]").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-g"+k)===v))})}
  sync("mode",dark?"dark":"light");sync("w",narrow?"phone":"desk");
  document.querySelector(".global").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;
    var k=b.hasAttribute("data-gmode")?"mode":"w",v=b.getAttribute("data-g"+k);all.forEach(function(s){set(s,k,v)});sync(k,v)});
  var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){all.forEach(fit)},120)});
})();
`;

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${L.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontHref)}">
<style>${css}</style>
</head>
<body>
<div class="wrap">
<header class="intro" id="top">
<h1>${L.title}</h1>
<p>${L.intro}</p>
<nav class="index">${index}</nav>
<div class="global">${L.all}: ${toggles('data-gmode', 'data-gw')}</div>
</header>
${sections}
</div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync(join(DIR, OUT), html);
console.log(files.length, 'concepts,', Buffer.byteLength(html), 'bytes,', fams.size, 'font families');
for (const p of problems) console.log('CHECK', p);
if (problems.length) process.exitCode = 1;
