// Builds the owner's overview page (Russian, phone-first) from the page plans and research.
// node docs/owner/build-overview.mjs  ->  docs/owner/overview.html
// Design comparison pages and girl contact sheets are published next to it as separate files.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const q = JSON.parse(readFileSync(join(ROOT, 'docs/owner/questions.json'), 'utf8'));
const SITES = [
  { id: 'jugadadeldia', name: 'jugadadeldia.com', theme: 'Кинела, лотереи, труко и местные игры', girl: 'contact-jdd-girls.jpg' },
  { id: 'pingalto', name: 'pingalto.com', theme: 'Киберспорт и инструменты для игр', girl: 'contact-pa-girls.jpg' },
  { id: 'casaslegales', name: 'casaslegales.com', theme: 'Лицензии и обзоры букмекеров, без людей', girl: null },
];

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');

function concept(id) {
  const t = readFileSync(join(ROOT, `docs/PAGES-${id.toUpperCase()}.md`), 'utf8');
  const m = t.match(/## Концепция\n([\s\S]*?)\n## /);
  if (!m) return [];
  return m[1].split(/\n(?=- )/).map(x => x.trim()).filter(x => x.startsWith('- ')).map(x => x.slice(2).replace(/\s*\n\s*/g, ' '));
}

const files = {};
const data = {};
for (const s of SITES) {
  const plan = JSON.parse(readFileSync(join(ROOT, `data/plan/${s.id}.json`), 'utf8'));
  data[s.id] = plan.map(p => [p.section, p.url, p.h1, p.keys, p.tool, p.data, p.auto, p.wave, p.kind]);
  s.count = plan.length;
  s.waves = ['P1', 'P2', 'P3'].map(w => plan.filter(p => p.wave === w).length);
  s.concept = concept(s.id);
  const design = join(ROOT, `docs/design/${s.id}/ten-designs-2026-11-02.html`);
  s.design = existsSync(design) ? `designs/${s.id}.html` : null;
  s.ready = existsSync(join(ROOT, `docs/design/${s.id}/parts`)) ? readdirSync(join(ROOT, `docs/design/${s.id}/parts`)).filter(f => f.endsWith('.html')).length : 0;
  if (s.design) files[s.design] = design;
  if (s.girl && existsSync(join(ROOT, 'data/img-review', s.girl))) files[`girls/${s.girl}`] = join(ROOT, 'data/img-review', s.girl);
  else s.girl = null;
}

const siteCard = s => `
<section class="site" data-site="${s.id}">
  <header class="site-head"><h2>${esc(s.name)}</h2><p>${esc(s.theme)}</p></header>
  <ul class="concept">${s.concept.map(c => `<li>${md(c)}</li>`).join('')}</ul>
  <div class="picks">
    <a class="pick" ${s.design ? `href="${s.design}"` : 'aria-disabled="true"'}><span class="pick-k">Дизайн</span><span class="pick-v">${s.design ? (s.ready >= 10 ? '10 живых макетов главной →' : `Готово ${s.ready} из 10 →`) : 'макеты ещё делаются'}</span><span class="pick-n">${s.ready >= 10 ? 'Выберите номер 1–10' : 'остальные дорисовываются, ссылка та же'}</span></a>
    ${s.id === 'casaslegales'
      ? `<div class="pick"><span class="pick-k">Иллюстрации</span><span class="pick-v">Свои скриншоты публичных страниц</span><span class="pick-n">Девушки нет</span></div>`
      : `<a class="pick" ${s.girl ? `href="girls/${s.girl}"` : 'aria-disabled="true"'}><span class="pick-k">Девушка</span><span class="pick-v">${s.girl ? '10 вариантов →' : 'варианты ещё генерируются'}</span><span class="pick-n">Выберите номер 01–10</span></a>`}
  </div>
  <p class="counts"><b>${s.count}</b> страниц · <span class="w w1">P1 ${s.waves[0]}</span> <span class="w w2">P2 ${s.waves[1]}</span> <span class="w w3">P3 ${s.waves[2]}</span></p>
</section>`;

const qBlock = (title, list) => `<div class="qgroup"><h3>${esc(title)}</h3><ol>${list.map(x =>
  `<li><span class="qq">${md(x.q)}</span><span class="qd">По умолчанию: ${md(x.d)}</span></li>`).join('')}</ol></div>`;

const html = `<title>Три сайта: старт</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap">
<style>
/* Layout: one narrow reading column; site cards, then questions, then a filterable page list. */
:root{--bg:#f6f5f2;--card:#fff;--ink:#1d1f24;--mute:#5d6170;--line:#dddbd4;--acc:#2f5bd3;--jdd:#b8620b;--pa:#8a3fc4;--cl:#1f7a6c;--p1:#1f7a3c;--p2:#8a6d00;--p3:#6b6f7a;
--f:"Golos Text",system-ui,-apple-system,"Segoe UI",sans-serif;--m:"JetBrains Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15171c;--card:#1d2027;--ink:#e9e8e4;--mute:#a3a7b3;--line:#323642;--acc:#8fb0ff;--jdd:#f0a050;--pa:#c99af0;--cl:#5cc4b2;--p1:#6fd58f;--p2:#e5c24a;--p3:#a3a7b3;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15171c;--card:#1d2027;--ink:#e9e8e4;--mute:#a3a7b3;--line:#323642;--acc:#8fb0ff;--jdd:#f0a050;--pa:#c99af0;--cl:#5cc4b2;--p1:#6fd58f;--p2:#e5c24a;--p3:#a3a7b3;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:400 16px/1.5 var(--f)}
.wrap{max-width:860px;margin:0 auto;padding-inline:16px;padding-block:24px 64px;display:grid;gap:28px}
h1{font-size:clamp(26px,6vw,36px);line-height:1.15;margin:0;text-wrap:balance}
h2{font-size:22px;margin:0}h3{font-size:17px;margin:0 0 8px}
p{margin:0}code{font:500 .86em var(--m);background:color-mix(in srgb,var(--line) 55%,transparent);padding:1px 4px;border-radius:3px;overflow-wrap:anywhere}
.lead{color:var(--mute);max-width:62ch}
.status{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.status li{display:flex;gap:10px;align-items:baseline}
.dot{flex:none;width:9px;height:9px;border-radius:50%;background:var(--p1);transform:translateY(-1px)}.dot.warn{background:var(--p2)}
.sites{display:grid;gap:16px}
.site{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--c);border-radius:6px;padding:16px;display:grid;gap:12px;min-width:0}
.site[data-site=jugadadeldia]{--c:var(--jdd)}.site[data-site=pingalto]{--c:var(--pa)}.site[data-site=casaslegales]{--c:var(--cl)}
.site-head p{color:var(--mute)}
.concept{margin:0;padding-left:18px;display:grid;gap:6px;font-size:15px}
.picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.pick{display:grid;gap:2px;padding:12px 14px;border:1px solid var(--c);border-radius:6px;text-decoration:none;color:var(--ink);min-height:44px}
a.pick:not([aria-disabled]):hover{background:color-mix(in srgb,var(--c) 10%,transparent)}
.pick[aria-disabled]{border-style:dashed;color:var(--mute)}
.pick-k{font:500 12px var(--m);text-transform:uppercase;letter-spacing:.06em;color:var(--c)}
.pick-v{font-weight:700}.pick-n{font-size:13px;color:var(--mute)}
.counts{font-size:15px}
.w{font:500 12px var(--m);padding:2px 6px;border-radius:3px;border:1px solid currentColor}
.w1{color:var(--p1)}.w2{color:var(--p2)}.w3{color:var(--p3)}
.qs{display:grid;gap:18px}
.qgroup ol{margin:0;padding-left:22px;display:grid;gap:10px}
.qq{display:block}.qd{display:block;font-size:14px;color:var(--mute)}
.need{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:16px;display:grid;gap:10px}
.need ol{margin:0;padding-left:22px;display:grid;gap:8px}
.tabs{display:flex;flex-wrap:wrap;gap:8px}
.tabs button,.waves button{font:500 14px var(--f);min-height:40px;padding:6px 12px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.tabs button[aria-pressed=true]{border-color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc)}
.waves{display:flex;flex-wrap:wrap;gap:8px}
.waves button[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
#search{font:400 15px var(--f);min-height:40px;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink);width:100%;box-sizing:border-box}
.list{display:grid;gap:10px}
details.sec{background:var(--card);border:1px solid var(--line);border-radius:6px}
details.sec>summary{padding:12px 14px;cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;gap:10px}
details.sec>summary::-webkit-details-marker{display:none}
details.sec>summary .n{font:500 13px var(--m);color:var(--mute)}
.pg{border-top:1px solid var(--line);padding:12px 14px;display:grid;gap:4px;min-width:0}
.pg-top{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.pg-url{font:500 13px var(--m);overflow-wrap:anywhere}
.pg-h1{font-weight:700}
.pg-k{font-size:13px;color:var(--mute);overflow-wrap:anywhere}
.pg-t{font-size:14px}
.pg-d{font-size:13px;color:var(--mute)}
.pg-d b{font-weight:500;color:var(--ink)}
.empty{color:var(--mute)}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<main class="wrap">
  <header style="display:grid;gap:10px">
    <h1>Три сайта для Аргентины: план, дизайн, девушки</h1>
    <p class="lead">Сводка на 02.11.2026. Ваша задача на этой странице: выбрать дизайн каждого сайта и девушку для двух сайтов, ответить на вопросы ниже (или промолчать — тогда делаем по умолчанию). Ниже — полный список страниц с фильтром.</p>
    <ul class="status">
      <li><span class="dot"></span><span>Все три домена работают по https (пока заглушка, закрыта от индекса), www → основной адрес.</span></li>
      <li><span class="dot"></span><span>GitHub: код сохраняется в репозиторий.</span></li>
      <li><span class="dot warn"></span><span>Токен Cloudflare видит только gambeteo.com. Сайтам не мешает; нужен, только если DNS буду менять я.</span></li>
    </ul>
  </header>

  <div class="sites">${SITES.map(siteCard).join('')}</div>

  <section class="qs">
    <h2>Вопросы к вам</h2>
    <p class="lead">Можно ответить номерами, например: «jdd дизайн 4, девушка 07; pa дизайн 2, девушка 03; cl дизайн 9; остальное по умолчанию».</p>
    ${q.groups.map(g => qBlock(g.title, g.items)).join('')}
  </section>

  <section class="need">
    <h2>Что нужно сделать вам (для автообновления)</h2>
    <ol>${q.owner.map(x => `<li>${md(x)}</li>`).join('')}</ol>
    <p class="pg-d">Всё остальное обновляется без ключей: официальные выписки кинелы (LOTBA, PBA, Córdoba, Tucumán), OpenDota, рейтинг Valve, реестры лицензий PBA, CABA, Córdoba.</p>
  </section>

  <section style="display:grid;gap:12px">
    <h2>Все страницы</h2>
    <div class="tabs" role="group" aria-label="Сайт">${SITES.map((s, i) => `<button type="button" data-tab="${s.id}" aria-pressed="${i === 0}">${esc(s.name)}</button>`).join('')}</div>
    <div class="waves" role="group" aria-label="Волна"><button type="button" data-wave="" aria-pressed="true">Все</button><button type="button" data-wave="P1" aria-pressed="false">P1 — запуск</button><button type="button" data-wave="P2" aria-pressed="false">P2</button><button type="button" data-wave="P3" aria-pressed="false">P3</button></div>
    <label for="search" class="pg-d">Поиск по адресу, заголовку, ключу</label>
    <input id="search" type="search" placeholder="например: tucumán, valorant, betano">
    <div id="list" class="list"></div>
  </section>
</main>
<script>
const DATA=${JSON.stringify(data)};
const st={site:${JSON.stringify(SITES[0].id)},wave:'',q:''};
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(){
  const rows=DATA[st.site].filter(r=>(!st.wave||r[7]===st.wave)&&(!st.q||(r[1]+' '+r[2]+' '+r[3]).toLowerCase().includes(st.q)));
  const secs=[];const by={};
  for(const r of rows){if(!by[r[0]]){by[r[0]]=[];secs.push(r[0]);}by[r[0]].push(r);}
  const el=document.getElementById('list');
  if(!rows.length){el.innerHTML='<p class="empty">Ничего не найдено.</p>';return;}
  el.innerHTML=secs.map((s,i)=>'<details class="sec"'+(i===0||st.q?' open':'')+'><summary><span>'+E(s)+'</span><span class="n">'+by[s].length+'</span></summary>'+by[s].map(r=>
    '<div class="pg"><div class="pg-top"><span class="w w'+E(r[7]).slice(1)+'">'+E(r[7])+'</span><span class="pg-url">'+E(r[1])+'</span></div>'+
    '<div class="pg-h1">'+E(r[2])+'</div>'+(r[3]&&r[3]!=='—'?'<div class="pg-k">'+E(r[3])+'</div>':'')+
    '<div class="pg-t">'+E(r[4])+'</div><div class="pg-d"><b>Данные:</b> '+E(r[5])+' · <b>Обновление:</b> '+E(r[6])+'</div></div>').join('')+'</details>').join('');
}
function press(group,attr,val){document.querySelectorAll(group+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===val)));}
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st.site=b.dataset.tab;press('.tabs','tab',st.site);render();});
document.querySelector('.waves').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st.wave=b.dataset.wave;press('.waves','wave',st.wave);render();});
document.getElementById('search').addEventListener('input',e=>{st.q=e.target.value.trim().toLowerCase();render();});
render();
</script>
`;
writeFileSync(join(ROOT, 'docs/owner/overview.html'), html);
writeFileSync(join(ROOT, 'docs/owner/overview-files.json'), JSON.stringify(files, null, 1));
console.log(`overview.html ${html.length} bytes; files: ${Object.keys(files).join(', ') || 'none'}`);
