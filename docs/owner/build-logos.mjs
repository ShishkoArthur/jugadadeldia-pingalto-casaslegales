// Builds the owner's logo comparison page (Russian, phone-first): 3 concepts x 3 sites, each as the header lockup on the site's
// light and dark background, favicon at 16/32/48 px, a browser tab, the 180 px app icon and the maskable icon.
// Also writes every concept as standalone SVG files to sites/<site>/static/logo-options/ (not shipped; switch = LOGO.pick).
// node docs/owner/build-logos.mjs  ->  docs/owner/logos-2026-11-03.html
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { logoSvg } from '../../tools/lib/icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uri = svg => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const png = async (svg, s) => 'data:image/png;base64,' + (await sharp(Buffer.from(svg), { density: Math.ceil(72 * s / 64) * 2 }).resize(s, s).png().toBuffer()).toString('base64');
const font = (fam, file, w) => '@font-face{font-family:"' + fam + '";font-weight:' + w + ';font-display:swap;src:url(data:font/woff2;base64,' + readFileSync(join(ROOT, file)).toString('base64') + ') format("woff2")}';

const SITES = [
  {
    id: 'jugadadeldia', domain: 'jugadadeldia.com', title: 'Jugada del Día', design: 'r3 «06 Menú principal»',
    font: ['LgKanit', 'sites/jugadadeldia/static/fonts/kanit-700.woff2', 800], size: 23, mark: 44,
    light: { bg: '#edf1f6', fg: '#0e1726', b: '#b53d12' }, dark: { bg: '#0a111c', fg: '#eef3fa', b: '#ff8a57' },
    word: b => 'jugada<b style="color:' + b + '">del</b>día',
    about: {
      'siete-de-oro': 'Бола кинелы, отлитая как монета «оро» испанской колоды: золотой шар, ободок с бусинами и семёрка. «Siete de oro» — одна из четырёх главных карт труко, так что знак сразу про оба раздела сайта: лотереи и местные игры.',
      'bolilla-7': 'Классическая бола лотереи: оранжевый глянец, белый круг и семёрка — то, что сейчас стоит в шапке, но нарисовано заново, с бликом и чистой семёркой. Самый «лотерейный» и самый простой вариант.',
      'j-bolilla': 'Монограмма: буква «j», у которой точка — бола кинелы. Тёмная плашка, как у приложений; в тёмной теме плашка светлая. Короче всех, но без отсылки к труко.',
    },
    why: 'Только этот знак рассказывает про весь сайт сразу — кинела (бола) и труко (siete de oro); золото есть в палитре дизайна, бусины и ободок не путаются ни с чем, на 16 px остаётся жёлтый шар с семёркой.',
  },
  {
    id: 'pingalto', domain: 'pingalto.com', title: 'pingalto', design: '«Holo pastel»',
    font: ['LgRounded', 'sites/pingalto/static/fonts/rounded-800-latin.woff2', 800], size: 24, mark: 38,
    light: { bg: '#f6f4fb', fg: '#1d1830', b: '#5a3fcf' }, dark: { bg: '#110e1d', fg: '#f4f0fb', b: '#b6a6ff' },
    word: b => 'ping<b style="color:' + b + '">alto</b>',
    about: {
      'pico-senal': 'Линия пинга поднимается в горную вершину («alto»), над вершиной — две дуги сигнала. Голографическая пастельная плашка из дизайна; в тёмной теме плашка тёмная, линия светлая.',
      'p-eco': 'Буква «p» на тёмной плашке, от неё расходятся голографические дуги — «p», который пингует. Самый контрастный на вкладке браузера, но про «alto» ничего не говорит.',
      'pico-pixel': 'Пиксельная гора-ступеньки и розовый пиксель-«пинг» над вершиной — отсылка к ретро-играм. Узнаётся на 16 px, но пиксель-арт уже у многих игровых сайтов.',
    },
    why: 'В знаке оба слова имени: пинг (линия и дуги сигнала) и «alto» (вершина); продолжает линию пинга, которая уже есть в шапке, и голо-пастель дизайна; в словесном знаке «alto» выделен фиолетовым.',
  },
  {
    id: 'casaslegales', domain: 'casaslegales.com', title: 'casaslegales', design: 'r3 «01 Relieve alto»',
    font: ['LgGabarito', 'sites/casaslegales/static/fonts/gabarito-var-latin.woff2', '400 900'], size: 21, mark: 38,
    light: { bg: '#e9efe6', fg: '#10241c', b: '#0d5a3a' }, dark: { bg: '#07120e', fg: '#e6efe9', b: '#c7ee5c' },
    word: b => 'casas<b style="color:' + b + '">legales</b>',
    about: {
      'casa-iso': 'Изометрический домик (casa) в цветах сайта — салатовая крыша, зелёная стена — и галочка на фасаде (legal). Та же изометрия, что карта провинций на главной.',
      'sello-relieve': 'Две плитки рельефа, как на карте провинций, и галочка сверху — «проверено», но не похоже на государственную печать. Абстрактнее, слово «casa» не читается.',
      'casa-check': 'Плоский силуэт дома с вырезанной галочкой. Самый чёткий на 16 px, но такие значки «дом + галочка» встречаются часто, и он не похож на изометрический дизайн.',
    },
    why: 'Дословно имя сайта — дом и галочка — и та же изометрия «Relieve alto», что у карты провинций; не похож на герб или печать регулятора; в цветах сайта (салатовый и зелёный).',
  },
];

let css = '', html = '';
for (const S of SITES) {
  const { LOGO } = await import(pathToFileURL(join(ROOT, 'sites', S.id, 'logo.mjs')).href);
  css += font(...S.font);
  const dir = join(ROOT, 'sites', S.id, 'static/logo-options');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const cards = [];
  const order = [LOGO.pick, ...LOGO.concepts.map(c => c.id).filter(i => i !== LOGO.pick)];
  for (const cid of order) {
    const c = LOGO.concepts.find(x => x.id === cid);
    const files = {
      light: logoSvg(LOGO, cid, { mode: 'light' }), dark: logoSvg(LOGO, cid, { mode: 'dark' }),
      favicon: logoSvg(LOGO, cid, { mode: 'auto', small: true }), app: logoSvg(LOGO, cid, { kind: 'app' }), maskable: logoSvg(LOGO, cid, { kind: 'mask' }),
    };
    for (const [k, v] of Object.entries(files)) writeFileSync(join(dir, cid + '-' + k + '.svg'), v + '\n');
    const lock = m => '<div class="lock" style="background:' + S[m].bg + ';color:' + S[m].fg + ';font-family:' + S.font[0] + ';font-size:' + S.size + 'px">' +
      '<img src="' + uri(files[m]) + '" width="' + S.mark + '" height="' + S.mark + '" alt=""><span>' + S.word(S[m].b) + '</span></div>';
    const fav = m => '<div class="fav" style="background:' + S[m].bg + '">' + [16, 32, 48].map(s => '<img src="' + uri(logoSvg(LOGO, cid, { mode: m, small: s < 48 })) + '" width="' + s + '" height="' + s + '" alt="">').join('') + '</div>';
    const tab = m => '<div class="tab ' + m + '"><img src="' + uri(logoSvg(LOGO, cid, { mode: m, small: true })) + '" width="16" height="16" alt=""><span>' + esc(S.title) + '</span></div>';
    const pick = cid === LOGO.pick;
    cards.push('<article class="card' + (pick ? ' pick' : '') + '"><h3>' + esc(c.name) + (pick ? ' <em>рекомендую, уже на сайте</em>' : '') + '</h3>' +
      '<p>' + esc(S.about[cid]) + '</p>' + (pick ? '<p class="why"><b>Почему:</b> ' + esc(S.why) + '</p>' : '') +
      '<div class="row">' + lock('light') + lock('dark') + '</div>' +
      '<div class="row sm"><div><small>Фавикон 16 · 32 · 48</small>' + fav('light') + fav('dark') + '</div><div><small>Вкладка браузера</small>' + tab('light') + tab('dark') + '</div></div>' +
      '<div class="row sm"><div><small>Иконка 180 (iPhone)</small><img class="app" src="' + await png(files.app, 180) + '" width="120" height="120" alt=""></div>' +
      '<div><small>Android (круглая маска)</small><img class="app mask" src="' + await png(files.maskable, 180) + '" width="120" height="120" alt=""></div></div>' +
      '<p class="file">Файлы: <code>sites/' + S.id + '/static/logo-options/' + cid + '-*.svg</code></p></article>');
  }
  html += '<section><h2>' + esc(S.domain) + '</h2><p class="mu">Дизайн ' + esc(S.design) + ', шрифт словесного знака — шрифт сайта. Первый вариант уже стоит на сайте; другой ставится одной строкой (<code>pick</code> в <code>sites/' + S.id + '/logo.mjs</code>).</p>' + cards.join('') + '</section>';
}

const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Логотипы трёх сайтов</title>
<style>${css}
:root{--bg:#f4f4f1;--pa:#fff;--fg:#1b1b1f;--mu:#5b5b66;--ln:#e2e2dc;--ac:#2f6b4f;--pk:#fff6dc;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141416;--pa:#1d1d21;--fg:#ededf0;--mu:#a5a5b0;--ln:#2e2e34;--ac:#8fd3ae;--pk:#2c2716;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141416;--pa:#1d1d21;--fg:#ededf0;--mu:#a5a5b0;--ln:#2e2e34;--ac:#8fd3ae;--pk:#2c2716;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1060px;margin:0 auto;padding:24px 16px 60px}h1{font-size:28px;margin:0 0 6px}h2{font-size:22px;margin:40px 0 4px}h3{font-size:18px;margin:0 0 6px}
p{margin:0 0 10px}.mu,small{color:var(--mu)}small{display:block;font-size:13px;margin-bottom:6px}code{font-size:13px;overflow-wrap:anywhere}
.card{background:var(--pa);border:1px solid var(--ln);border-radius:16px;padding:18px;margin-top:14px}.card.pick{border:2px solid var(--ac)}
h3 em{font-style:normal;font-size:13px;font-weight:600;color:var(--ac);margin-left:6px;white-space:nowrap}
.why{background:var(--pk);border-radius:10px;padding:10px 12px}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px}.row.sm{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.lock{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:12px;font-weight:800;letter-spacing:-.01em;line-height:1;min-height:72px}.lock b{font-weight:inherit}
.fav{display:flex;align-items:flex-end;gap:14px;padding:12px 14px;border-radius:10px;margin-bottom:6px}
.tab{display:flex;align-items:center;gap:8px;max-width:220px;padding:9px 14px;border-radius:10px 10px 0 0;font-size:13px;margin-bottom:6px}
.tab.light{background:#fff;color:#1f1f1f;box-shadow:0 0 0 1px #dadce0}.tab.dark{background:#35363a;color:#e8eaed}
.app{border-radius:27px;display:block}.app.mask{border-radius:50%}.file{margin:12px 0 0;font-size:13px;color:var(--mu)}
</style></head><body><main>
<h1>Логотипы и фавиконы</h1>
<p class="mu">По 3 варианта на каждый сайт, у каждого сайта свой знак, шрифт и цвета — сетью не выглядят. Все знаки нарисованы вручную векторами (SVG), без картинок ИИ: чёткие на любом размере. Рекомендованный вариант уже стоит на сайте: в шапке, во вкладке браузера (фавикон 16/32/48 и SVG, который сам меняется в тёмной теме), на экране «Домой» iPhone и Android (180, 192, 512 и круглая маска). Чтобы поставить другой — напишите «jugadadeldia: вариант 2» и т. п.</p>
${html}
</main></body></html>
`;
writeFileSync(join(ROOT, 'docs/owner/logos-2026-11-03.html'), page);
console.log('docs/owner/logos-2026-11-03.html ' + Math.round(page.length / 1024) + ' KB');
