# HANDOFF — jugadadeldia.com · pingalto.com · casaslegales.com (один репозиторий, три сайта)

Читать первым, затем `CLAUDE.md`, `PLAYBOOK.md` (§1, §3, §7.4, §8, §17 — обязательно), `docs/DECISIONS.md`, `docs/TRAPS.md`.

## СОСТОЯНИЕ 02.11 — проект не начат, стартовый набор готов
- Три сайта es-AR («vos»), **все без монетизации и без ссылок на операторов** (PLAYBOOK §1):
  1. **jugadadeldia.com** — кинела, лотереи, труко и местные игры; своя девушка.
  2. **pingalto.com** — киберспорт и игры, современный дизайн, девушка «альт» ~20 лет (явно взрослая); без ставок, кейсов и скинов.
  3. **casaslegales.com** — обзоры букмекеров (только лицензии провинций, с цитатами регуляторов), **без девушек**, свои скриншоты публичных страниц.
- Есть: `.env` со всеми ключами — Claude API, Nano Banana, Ahrefs, Cloudflare (`CLOUDFLARE_API_TOKEN` — аккаунт gambeteo и трёх сайтов;
  `CLOUDFLARE_API_TOKEN_RINKMATH_ACCOUNT` — другой аккаунт, здесь не нужен), сервер (DEPLOY_*), PREVIEW_HOST, `BALLDONTLIE_API_KEY` (NBA, на
  всякий случай); `tools/env.mjs`, `ahrefs.mjs` (поддерживает `AH_SELECT=keyword,volume,difficulty` — ≈ 21 ед./строку), `gen-image.mjs`, `key-green.mjs`.
- Ключи: `data/keywords/*jpc*` (02.11: лотереи 200, игры 120, киберспорт 250, букмекеры 200, вопросы 150) + `*ar-ideas*` (01.11);
  **сводка по сайтам — `docs/research/KEYWORDS-2026-11-02.md`**. Ресёрч Аргентины — `docs/research/ARGENTINA-IDEAS-2026-11-01.md`.
  Ahrefs на 02.11: 246 107 из 800 000 (сброс 9-го), всё рабочее пространство общее с другими проектами.
- Пакет помощи AR из gambeteo (линии по провинциям, документы) — `docs/reference/rg-ar-gambeteo/` (перепроверить свежесть ≤ 100 дней,
  перенести в `data/sources/rg/` каждого сайта, где нужен: jugadadeldia — кинела/лотереи, casaslegales — везде; pingalto — не нужен).
- Код-образцы (только читать): **/home/dev/gambeteo** (Аргентина, es-AR, ленты и пересборка на сервере — `tools/feeds-server.sh`,
  `tools/site-server.sh`, гейты, QA, помощь AR), /home/dev/canadabetting (киберспорт: `tools/feeds/dota2.mjs`, `engine/series.mjs`;
  страницы «легален ли оператор»: brand-*, legal-check, реестры), /home/dev/kenomath (лотереи и кено: движок, симуляторы).

## Движок и выкладка (03.11) — общий для трёх сайтов; casaslegales.com живой
- **Команды:** `npm test` (код без кириллицы, `node --test engine/test`, verify-rg, verify-sources, selftest гейтов) ·
  `node tools/render.mjs <сайт>` → `dist/<сайт>/` · `node tools/check-dist.mjs <сайт> [--selftest]` · `bash tools/deploy.sh <сайт>`
  (тесты → сборка из `git archive HEAD` → гейты → tar|ssh → `rsync --delete` в `/opt/web/sites/<сайт>.com/`, `/_ref/` и `/data/` защищены →
  проверка Caddy-блока и https) · `node tools/serve.mjs <сайт>` (локально, как Caddy) · `node tools/verify-sources.mjs --recheck [--write]`.
  **Выкладывается только закоммиченное.**
- **Структура:** `sites/<id>/` (config.mjs — домен, схема адресов, папка ассетов, маркеры для гейтов; layout.mjs; css/; client/; pages/;
  content/; static/) — у каждого сайта своё; общие только `tools/` и `engine/` (чистые модули + тесты). casaslegales: адреса без слэша
  (`/provincia/cordoba` → `provincia/cordoba.html`), ассеты `/_r/<хеш>.<ext>`, классы `rl-*`, шрифты Gabarito + Ubuntu Sans Mono — свои.
- **Гейты** (`tools/check-dist.mjs`, ~55 порч в selftest): один H1, title ≤ 60, description 115–155, canonical, og, ссылки/якоря/схема адресов,
  src, alt, кириллица, комментарии HTML/CSS/JS, внешние скрипты/стили, undefined/NaN, `{{…}}`, приманки es-AR, обещания сроков, блок помощи +
  `tel:` + 18+, страницы помощи (метка, без меню и ссылок на реестр/провинции), индекс открыт (noindex только у 404, sitemap = все страницы,
  robots), ссылки на операторов/партнёрки, вес, имена ассетов, свежесть источников ≤ 100 дн. и побайтная сверка цитат.
- **Проверено (03.11):** реестры `data/sources/registries/` — PBA 7 (loteria.gba.gob.ar, + ley 15.079 и decreto 181/19 с normas.gba.gob.ar),
  CABA 11 (juegosegurolegal.gob.ar, комментарии HTML не считаются), Córdoba 4 (loteriadecordoba.com.ar, Res. 1889/23; одна загрузка,
  robots разрешает `*`, ai-train=no): копия + sha256, цитаты, HTML-доказательство каждой строки, полнота списка. Пакет помощи
  `data/sources/rg/` — из gambeteo (документы 01.11, свежи до 09.02.2027). Закон CABA и Córdoba Ley 10.793 — не нашли официальный текст, не цитируем.
- **Живое:** https://casaslegales.com/ · /licencias · /provincia/buenos-aires · /provincia/caba · /provincia/cordoba · /juego-responsable ·
  /metodologia · /redaccion · /registro-de-fuentes (+404). Индекс открыт. Автора нет — «redacción» (решение 03.11), schema Organization.
  Caddy-блок обновлён (`server-setup.sh casaslegales update`: `/_r/*` на год, страницы no-cache; соседи 200).
- **Перепроверка:** до 09.02.2027 — `node tools/verify-rg.mjs --recheck --write` и `node tools/verify-sources.mjs --recheck --write`,
  иначе гейт `fresh` остановит выкладку.

## Доступы (состояние 03.11)
- Ключи в `.env` проверены 03.11: PandaScore (200), Supercell CR и BS (200 с сервера по IPv4, IP 187.7.26.95). Telegram-бот @jpc_avisos_bot — подключён 03.11 (`TG_BOT_TOKEN`, `TG_CHAT_ID` в `.env` и в secrets лент обоих сайтов на сервере, тест дошёл).

| Что | Состояние | Кто |
|---|---|---|
| GitHub `git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git` | **push работает** (проверено 02.11, `main` отслеживает `origin/main`) | — |
| Cloudflare | DNS трёх доменов уже в Cloudflare (прокси на 187.7.26.95); **токен из `.env` видит только gambeteo.com** (перепроверено 02.11 вечером) — добавить jugadadeldia.com, pingalto.com, casaslegales.com в Zone Resources того же токена | владелец |
| Сервер | **работает (02.11, 21:57 UTC):** владелец запустил `bash tools/server-setup.sh all install` — блоки `# >>> jugadadeldia|pingalto|casaslegales`, бэкапы `Caddyfile.bak-<сайт>-20261102-*`, соседи 200; https трёх доменов — 200 (заглушка noindex), www → 301. Дальше правки блока — `update` | — |

Открытый ключ GitHub (не секрет): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPZ/k/crurewdEaZLh2EBMmmKXlN9ZWzBm/rdNlFv2a9 jugadadeldia-pingalto-casaslegales deploy key`

## Состояние и следующее (03.11, вечер)
- **Все три сайта живые, индекс открыт:** casaslegales.com (97 стр. из 117 плана, все 27 марок со страницей, дизайн r3 «01 Relieve alto», 8 официальных списков; остаток — раздел «97 страниц» ниже), pingalto.com
  (47 стр. из 86 плана — волна 4 ниже, дизайн «Holo pastel», девушка pa-girl-r3-09), jugadadeldia.com (45 стр., дизайн r3 «06 Menú principal», девушка jdd-girl-r3-10,
  автор Denis Krazok). Сцены девушек приняты (стандарт — DECISIONS 03.11 «сцены приняты»), стоят на страницах, размер — правило в «Сцены девушек».
- Сводка владельцу: https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS (сборка `node docs/owner/build-overview.mjs`, тот же путь публикации).
- **Ключи:** PandaScore, Supercell CR/BS — в `.env`, проверены. **Ждём от владельца:** Search Console (позже,
  «в гск добавлю потом»), автоисключение Mendoza и PDF к копиям (по желанию).
- **Лимит:** не больше 2 агентов одновременно (владелец 03.11).
- **Автообновление работает (03.11, раздел «Ленты» ниже, инструкция `docs/FEEDS.md`):** кинела jugadadeldia каждые 15 мин, киберспорт
  и Supercell pingalto каждый час/сутки — на сервере, без агента. Telegram-хук готов, ждёт `TG_BOT_TOKEN`/`TG_CHAT_ID` от владельца.
- **Дальше:** тексты через Claude API; P2-страницы плана jugadadeldia; QA-проход всех
  трёх сайтов. pingalto: всё, что можно честно, построено (волна 4); оставшиеся 39 страниц плана — с причинами в «pingalto волна 4».

## Ленты (03.11) — автообновление на сервере; jugadadeldia 55 стр., pingalto 30 стр.
- **Как устроено:** `tools/feeds/run.mjs` + `lib.mjs` (общий движок), ленты `tools/feeds/<сайт>/*.mjs`, сервер — `bash tools/feeds-server.sh
  <сайт> install|secrets|sync|run|status|logs`. У сайтов свои папки `/opt/web/<сайт>-feeds/`, cron-файлы (jdd `4,19,34,49 * * * *`, pa `23 * * * *`),
  uid (47210/47220), образы и UA (`JugadaDelDia/1.0 (jugadadeldia.com)`, `Pingalto/1.0 (pingalto.com)`). Ключи — `secrets.env` (root 600,
  `secrets` копирует из `.env` без вывода). Выход — `/opt/web/sites/<сайт>.com/data/feeds/` (защищён от deploy), страницы рисуют из JSON
  в браузере. **Код лент выкладывается отдельно:** commit → `feeds-server.sh <сайт> sync`.
- **jugadadeldia:** лента `quiniela` — LOTBA JSON (6 юрисдикций) + PDF IPLyC (pdftotext, 5 юрисдикций), сверка цифра в цифру («2 fuentes»),
  расхождение — не публикуется; архив 120 дней (догружается по 60 тиражей за запуск), частоты 00–99 с chi². Устарело > 3 ч → «Sin datos al hh:mm».
  **Новые страницы:** /quiniela/ (сетка дня), /quiniela/nacional/, /provincia/, /cordoba/, /santa-fe/, /entre-rios/, /mendoza/,
  /quiniela/nacional-y-provincia/, /quiniela/extractos/, /quiniela/numeros-que-mas-salen/ (6 сцен из 20 готовых поставлены; блок помощи провинции).
  Меню «Quiniela» ведёт на /quiniela/. **Не сделано:** Córdoba API (robots закрыт для ИИ — берём копии LOTBA/PBA), Tucumán (TLS-сертификат
  не проверяется — не отключаем), Quini 6/Brinco (San Juan CAS отстаёт на 6 дней), /quiniela/horarios/ (нет источника праздников), San Juan,
  Catamarca и др. провинции (своих лент нет). Оставшиеся 14 сцен ждут своих страниц (/quiniela/horarios/, /tombola/*, /burako/ …).
- **pingalto:** `agenda` (PandaScore: CS2, Valorant, LoL, Dota 2, RL, EA FC; беттинг-бренды в названиях маскируются, «Datos: PandaScore»),
  `clash` (123 карты), `brawl` (111 бойцов, ротация, пороги копов топа AR без имён). **Новые страницы:** /esports/agenda (по плану; это и есть
  «calendario»), /clash/cartas, /brawl/brawlers, /brawl/eventos; блоки «Próximos partidos» на /esports, /cs2, /valorant, /lol. Стили лент —
  `css/feeds.css` (ссылка из самого блока, общий layout не трогали). Рейтинг Path of Legend AR пуст (сезонный) — не показываем.
- **03.11 вечер — программа LOTBA и сроки источников (jugadadeldia):** лента `programa` (раз в сутки; к LOTBA — раз в месяц и ежедневно за
  5 дней до конца программы): формуляр `descargaPrograma.php`, обе версии, строгие проверки + сверка с архивом тиражей → `programa.json`;
  `/quiniela/horarios/` в браузере берёт его (сейчас 02.11–30.11 вместо 02.11–12.11). Декабрь 03.11 ещё не загружен — ждём, сигнал
  только после 30.11, если не выйдет. Лента `fuentes` (без сети) → `_health.json.expiries`: сроки копий LOTBA/PBA/CAS (+183 дн., ближайший
  05.05.2027), месячных программ с ценами (30.11.2026 — обновлять копии каждый месяц), пакета помощи (09.02.2027), правил игр; Telegram
  за 14 дней. `status` печатает таблицу. Подробно — docs/FEEDS.md.
- **Проверено 03.11:** `run` на сервере — все 4 ленты `updated`, health OK; живые страницы 200, данные видны; телефон 375 — без
  горизонтальной прокрутки (/quiniela/provincia/, /esports/agenda).

## Сцены девушек (03.11) — на сайтах: pingalto 21 страница, jugadadeldia 22 страницы
- **Живое:** у каждой контентной страницы своя сцена (те же девушка и одежда, сидя/в движении, действие по теме страницы). Без фигуры —
  служебные (pingalto /equipo… /legal, jugadadeldia /quienes-somos/, /de-donde-salen-los-datos/), автор (/quien-escribe/) и помощь
  (/juego-responsable/*). На pingalto /equipo — сцена главной в карточке «Alt» (текст: персонаж, созданный ИИ).
- **Раунд r3 (03.11):** pingalto /kit/sensibilidad переделана (мышь на чёрном коврике на коленях; 3 попытки — в первых двух вторая мышь,
  логотип на коврике, обрезанный стол, куртка не на руках); новые pingalto /ff, /ff/codigos, /valorant, /cs2, /cs2/major, /lol, /esports,
  /esports/series; jugadadeldia /quiniela/redoblona/, /brinco/, /poceada/, /truco/jugar/, /truco/envido/, /juegos-de-cartas/,
  /generala/jugar/, /generala/probabilidades/, /chinchon/jugar/, /escoba-de-15/jugar/. Проверено самим в полном размере; переделаны
  /lol и /esports (куртка не на руках), /generala/jugar/ (нескромная посадка), /ff (нога). Сводки `data/img-review/contact-<сайт>-scenes-r3.jpg`.
  Все r2 — accepted (владелец 03.11). 20 сцен jugadadeldia ждут своих страниц (/quiniela/, провинции, /tombola/*, /burako/ и др. — в манифесте).
- **«Белый блик на ноге»** был от вырезки, не от картинки: голень в зелёном рефлексе пола становилась полупрозрачной. `cut.mjs`: метрика
  `split` у pingalto (среднее R/B для розовых волос сверху, max ниже), тёплые пиксели ниже середины не вырезаются, зелёный оттенок кожи и белой
  мебели снимается (и у jugadadeldia). Все сцены обоих сайтов перерезаны.
- **Размер фигуры (04.11, правило):** `publish-scenes.mjs` обрезает каждую вырезку по фигуре (альфа > 40) + поля (сверху и с боков 3 %,
  снизу 1 % высоты) — пустого холста вокруг сидящих поз больше нет. **Пиксели (03.11, «девушка маленькая и в плохом качестве»):** файлы
  берутся из полноразмерной вырезки `cut/raw/<id>.webp` (~1100–1800 × 2200–2500, один проход сжатия), ширины 320/480/720/960/1280
  (не шире исходника, без увеличения), WebP q88, альфа 95, `smartSubsample`. `g` считается на общей шкале по голове
  (высота фигуры в raw × `scale` из `scenes-measure.json`) — числа те же, что раньше.
  В `content/scenes.json` у страницы `ar` (ширина/высота файла) и `g = (высота фигуры / 1700) ^ 0.7` на общей шкале по голове.
  Одна фигура заполняет свою рамку: высота рамки = K × ширина × g, но рамка не шире, чем нужно фигуре (`min(K·g, 0.94/ar)`);
  стоящая берёт всю рамку, сидящая — рамку пониже и масштаб чуть крупнее (голова на экране ≤ ~1,25 стоящей), т. е. головы сравнимы.
  Рамка задаётся `aspect-ratio` через `--r1`/`--r2` или высотой `--g × --ph` (телефон) в style — без сдвига вёрстки; картинка — absolute по низу.
  Если когда-то понадобятся фигуры рядом — брать вырезки `data/art/<сайт>/cut/` (одна шкала по голове) без `g`.
- **Вёрстка и `sizes` (03.11, правило):** `sizes` = реальная ширина рамки из CSS × доля картинки в ней (`parts.mjs` `sizes()`); меняешь
  ширину в CSS — меняй её и в `FRAME`/`sizes()` (иначе телефон DPR 3 получит мало пикселей). Герой — `eager` + `fetchpriority=high`,
  в тексте — `lazy`. **jugadadeldia** (`girl`, K1 1,4 / K2 1,5): герой — колонка 360 px (300 px при ≤ 900); главная — 340 px рядом со
  стопкой «Ejemplo», при ≤ 1100 стопка и фигура (≤ 300 px) пополам под текстом; на страницах-столах (/truco/jugar/, /truco/anotador/,
  /generala/jugar/, /chinchon/jugar/, /escoba-de-15/jugar/, /dados/) — справа от первых двух разделов (`mnOpen`/`mnArt`, ≤ 340 px, 280 px
  при ≤ 900; телефон `min(280px, 76%)`). **pingalto** (`girlCard`, K1 1,3 / K2 1,55): колонка `clamp(300px, 30vw, 380px)` (рамка = колонка
  − 20), 260 px при ≤ 860; у страниц-инструментов (`pa-tl`) отступ снизу 24 px, чтобы панель `-40px` не наезжала; /equipo — малая
  карточка 180 px (`small: true`). **Телефон (оба сайта, ≤ 620 / ≤ 680):** заголовок, лид и кнопки на всю ширину, ниже карточка по центру:
  высота рамки `g × clamp(320px, 100vw, 420px)` (~330 px при 375), ширина `min(100%, max(64%, высота × ar × 1,3))`; на главной jdd
  стопка «Ejemplo» на телефоне скрыта. Замер 03.11 (живой сайт): 375 DPR 3 берёт файл 720w (jdd 61–97 КБ, pingalto 100–105 КБ;
  узкая стоящая /quiniela/ — 320w, 42 КБ), 1280 DPR 1 — 320w (21–33 КБ); фигура на ПК 380–465 px высотой (было 245–360), на
  телефоне 305–375 px (было 195–270). Вес картинок в бюджет гейта страницы не входит (бюджет 160 КБ — HTML+CSS+JS); ~11 МБ файлов сцен
  на сайт (5 ширин), страница грузит один файл.
- **Как добавить сцену для новой страницы:** (1) строка в `data/art/scenes.mjs` → `SITES.<сайт>.scenes` (поза, действие, лицо, `{ round: 'r3' }`
  или новый раунд) и alt в `ALT.<сайт>`; (2) `node data/art/scenes.mjs` → `data/art/<сайт>/scene-<раунд>-jobs.json`; (3) `node tools/gen-image.mjs
  data/art/<сайт>/scene-r3-jobs.json <id>`; (4) посмотреть PNG в полном размере (одежда целиком, куртка на обеих руках, скромная посадка, нет
  надписей/логотипов, весь реквизит в кадре); (5) `node data/art/build-scenes.mjs <сайт> --round r3` → разметить верх волос и подбородок на
  `data/img-review/heads-<сайт>-r3-1.jpg` в `data/art/<сайт>/heads.json` → повторить (сводка `contact-<сайт>-scenes-r3.jpg`); (6) поставить
  `status: accepted` в `data/art/<сайт>/scenes.json`; (7) `node data/art/publish-scenes.mjs <сайт>` (кладёт файлы в `sites/<сайт>/static/scenes/`
  и `content/scenes.json`, только для построенных страниц); (8) render → check-dist → commit → deploy. Страница сама покажет сцену, если она есть.
- PNG (`data/img-review/*.png`) и вырезки `data/art/<сайт>/cut/` — только локально (не в git); на сайт идут `sites/<сайт>/static/scenes/`.

## Логотипы и фавиконы (03.11) — свои у каждого сайта, стоят и выложены
- Владелец 03.11: «На всех сайтах сгенерируй и поставь интересные логотипы и фавиконы». По 3 варианта на сайт, нарисованы вручную
  (SVG-векторы, без растра ИИ); сравнение для владельца — `docs/owner/logos-2026-11-03.html` (сборка `node docs/owner/build-logos.mjs`,
  она же пишет `sites/<сайт>/static/logo-options/<вариант>-{light,dark,favicon,app,maskable}.svg` — в выкладку не идут).
- **Стоят (рекомендованные):** jugadadeldia — «Siete de oro» (золотая бола-монета «оро» с семёркой: кинела + труко), pingalto —
  «Pico de señal» (линия пинга → вершина «alto», дуги сигнала, голо-пастель; словесный знак ping**alto**), casaslegales — «Casa en relieve»
  (изометрический дом с галочкой, как карта «Relieve alto»; словесный знак casas**legales**). Запасные: jdd «Bolilla 7», «j con bolilla»;
  pa «p con eco», «Pico pixel»; cl «Sello en relieve», «Casa-check plana».
- **Как устроено:** варианты — `sites/<сайт>/logo.mjs` (`LOGO.pick` — какой стоит; сменить вариант = одна строка + render + deploy),
  рисует `tools/lib/icons.mjs`: цвета через классы, поэтому один рисунок даёт шапку (inline SVG, следует переключателю темы), `favicon.svg`
  (prefers-color-scheme), `favicon.ico` (16/32/48, мелкие — упрощённый рисунок), `apple-touch-icon.png` 180, `icon-192/512.png`,
  `icon-maskable-512.png`, `site.webmanifest` (имя, theme/background) — всё собирает `tools/render.mjs`. `static/mark.svg` больше нет.
  og:image на сайтах нет (twitter:card summary) — делать отдельно, если владелец захочет превью ссылок.

## Журнал
- 03.11 — jugadadeldia волна 2: +19 страниц (74 из 111), бурако по регламенту Juegos Bonaerenses, часы кинелы из программы LOTBA (раздел «jugadadeldia — волна 2»).
- 03.11 — логотипы и фавиконы трёх сайтов (раздел «Логотипы и фавиконы» выше), сравнение `docs/owner/logos-2026-11-03.html`.
- 03.11 — девушки на jugadadeldia и pingalto крупнее и чётче: файлы из полноразмерных вырезок (320–1280w, q88), рамки 340–380 px
  на ПК, на телефоне карточка под текстом ~330 px, `sizes` по реальным рамкам (раздел «Сцены девушек»).
- 03.11 — автообновление: ленты кинелы (jugadadeldia, 10 новых страниц) и киберспорта/Supercell (pingalto, 4 страницы + блоки) на сервере,
  `docs/FEEDS.md` (раздел «Ленты» выше).
- 03.11 — pingalto: меню «Juegos» и ряд игр на главной, свои фоны шапки по играм, сцены r4 «в игре» (CS2, Valorant, LoL, Fortnite + 5 для
  будущих страниц), официальных логотипов нет — разбор политик издателей (раздел «pingalto (03.11) — игры» ниже).
- 03.11 — casaslegales: +14 страниц (97 из 117): 8 оператор × провинция, /casinos-online-legales, /verificar/mystake и jugabet, /aviso-legal, /contacto, /privacidad.
- 03.11 — casaslegales: страницы всех 27 марок из 8 списков (+17), каждое имя марки в таблицах/списках — ссылка на её страницу (гейт brandlink).
- 03.11 — casaslegales: дизайн «01 Relieve alto» на живом сайте (изометрия, высота = число сайтов); третья выгрузка владельца → реестры
  Santa Fe (4) и Mendoza (7), 8 списков; +3 страницы оператор × провинция (раздел ниже).
- 03.11 — casaslegales: копии и скриншоты владельца встали на место (14 страниц регуляторов, 12 скриншотов 5 операторов из AR),
  Mendoza и Santa Fe «no consultable» → «sin dato verificado» (раздел ниже).
- 03.11 — jugadadeldia волна 1 выложена: дизайн «06 Menú principal», 45 страниц + 404 (кинела, 6 лотерей, труко и игры против
  компьютера, служебные, помощь по провинциям), индекс открыт (раздел «jugadadeldia» ниже).
- 03.11 — pingalto волна 3 выложена: /cs2 (Valve VRS), /cs2/major, /esports/series, /esports, /lol, /valorant, /ff, /ff/codigos
  (раздел «pingalto (03.11) — волна 3» ниже).
- 03.11 — casaslegales волна 4 выложена: копии сайтов с закрытым для ИИ robots → `pendingOwnerCopy`, 5 страниц оператор × провинция,
  /calculadora/cuotas, /calculadora/combinada, /guia/ley-federal (раздел ниже).
- 03.11 — pingalto волна 2 выложена: формат чисел es-AR во всех инструментах (+ гейт), /tier-list, /valorant/agentes, /cs2/mira,
  /ff/nombres, /ff/espacio-invisible, /fortnite/nube (раздел «pingalto» ниже).
- 03.11 — casaslegales волна 3 выложена: 24 страницы провинций, /provincias, реестры La Rioja/Neuquén/Río Negro, 4 гайда (раздел ниже).
- 03.11 — casaslegales волна 2 выложена: 10 операторов со своими скриншотами, /verificador, 5 проверок брендов, 3 гайда, автоисключение.
- 03.11 — движок трёх сайтов (render, гейты + selftest, deploy, источники с цитатами) и каркас casaslegales.com выложен
  (9 страниц + 404, индекс открыт). Раздел «Движок и выкладка» выше. /quienes-escriben → /redaccion (автор только на jugadadeldia).
- 02.11 ночь, круг 2 (решение в DECISIONS): варианты выбранных дизайнов — `docs/design/<сайт>/r2/` (jdd 5 «Bolillero», pa 5 «Cromo»,
  cl 6 новых концепций), девушки r2 (`data/img-review/contact-*-girls-r2.jpg`: jdd 6, pa 10), планы с `description` и `ar` у каждой страницы.
  Сводка обновлена (версия 2, та же ссылка). Ждём выбор: дизайн r2 и девушка r2 по каждому сайту + ответы на вопросы.
- 02.11 ночь — готово: планы трёх сайтов (`data/plan/*.json`, `docs/PAGES-*.md`: 111 / 86 / 102 стр.), ресёрч API
  (`docs/research/APIS-2026-11-02.md`), девушки 2×10 (`data/img-review/contact-*-girls.jpg`, png под игнором — только локально), 10 макетов
  jugadadeldia; pingalto 5/10, casaslegales 4/10 — агенты дорисовывают. Сводка владельцу: https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS
  (сборка `node docs/owner/build-overview.mjs`, вопросы — `docs/owner/questions.json`). Ждём выбор дизайнов/девушек и ответы.
- 02.11 вечер — новый чат начал работу: push проверен; волна 1 (6 агентов): планы страниц ×3 (`data/plan/<сайт>.json`,
  `docs/PAGES-<САЙТ>.md`), ресёрч API (`docs/research/APIS-2026-11-02.md`), девушки 2×10 (`data/art/<сайт>/girl-jobs.json`,
  `data/img-review/`), 10 макетов jugadadeldia (`docs/design/jugadadeldia/`). Дальше — макеты pingalto и casaslegales.
- 02.11 — стартовый набор от сессии RinkMath: правила (CLAUDE.md, PLAYBOOK §1 — три продукта), решения с цитатами, ловушки (gambeteo +
  RinkMath), все ключи API, SSH-ключ GitHub, ключи Ahrefs AR (5 запросов, ≈ 19 300 ед.) и их сводка, пакет помощи AR.

## jugadadeldia (03.11) — волна 2 выложена: 74 страницы из 111 плана + 404, индекс открыт
- **Новые 19 (все 200, гейты и `npm test` зелёные):** /quiniela/como-se-juega/ (интерактивная boleta на примерном экстракте из
  xoshiro-сида + квиз 5 вопросов), /quiniela/simulador/ (yearExact + 10 000 лет МК с сидом, кривая и гистограмма), /quiniela/horarios/
  (программа LOTBA ноябрь, разбор PDF при сборке `program()` в `pages/guias.mjs`; «hoy/mañana», обратный отсчёт; дни без тиражей — из
  архива ленты), /cuanto-devuelve-cada-juego/, /quini-6/como-se-juega/ (volante), /quini-6/controlar/ (до 10 билетов × модальности + Premio
  Extra, только localStorage), /telekino/controlar/ (сетка 5×5), /truco/reglas/ («¿quién ganó la mano?» на `handWinner`), /truco/puntos/
  (цепочки envido/truco, falta по счёту), /truco/quiero-o-no-quiero/ (тренажёр: envidoVsRandom / bazasVsRandom, честная оговорка «рука
  соперника — любая»), /truco/flor/, /chinchon/ («¿puedo cortar?» на canCut/bestSplit), /chinchon/anotador/, /escoba-de-15/ (buscador
  `captures` + подсчёт руки `scoreHand`), /burako/ + /burako/anotador/ (калькулятор руки), /bolillero/ (crypto, голос, печатные cartones
  3×9), /glosario/, /politica-de-privacidad/. Сцены поставлены у 8 (horarios, quini-6 ×2, telekino/controlar, truco/reglas, burako,
  chinchon, escoba-de-15); новых картинок не делали.
- **Источники:** `data/sources/burako/` — регламент Juegos Bonaerenses 2026 Burako (robots `*` разрешает, 27 цитат, тест
  games-sources); значения BURAKO в `pages/cartas.mjs` при сборке сверяются с текстом цитат. В `lotba.json` +8 фактов (часы 5 турно,
  суббота, 10 jugadas на ticket, отмена 15 мин, где получать, премии > $ 2.100.000 в LOTBA, участники 1–7).
- **Честно:** /quini-6/como-se-juega/ — без цены и часов (программа Santa Fe не доступна), заголовок/описание переименованы, план обновлён.
  Бурако: регламент не говорит прямо, что выложенные фишки идут в плюс, — калькулятор их суммирует, с выключателем и пометкой.
- **Не построено (37) и почему:** кинела Tucumán (TLS-сертификат), Catamarca, San Juan, Corrientes, Chaco, Formosa, Misiones, Salta,
  Santiago, Neuquén, Río Negro, Chubut, Jujuy, San Luis, La Rioja, La Pampa, Santa Cruz, TDF — нет ленты (LOTBA/PBA их не публикуют);
  /tombola/ и 5 tómbolas, /poceada/chaquena/, /loto-5/, /raspaditas/ — нет официального регламента (`gaps.json`); /quiniela/significado-de-
  los-numeros/ — только пресса, официального источника таблицы нет; /calendario-de-sorteos/ — программы LOTBA покрывают 2–12.11, Quini 6/
  Telekino дней нет в цитатах; /premios-e-impuestos/ — нет сохранённого закона ARCA; /quini-6/probabilidades/, /quini-6/pozo-extra/ — то же,
  что уже на /quini-6/ (дубль); /burako/jugar/ — нет движка; /loba/, /tute/, /dados/juegos-con-dados/ — нет источника правил.
  Сцены ждут: /quiniela/significado…, tucuman, catamarca, san-juan, /tombola/santiaguena/, /tombola/jujena/ (+ ещё 6 из 20).
- **Дальше:** программа LOTBA на вторую половину ноября (после 12.11 /quiniela/horarios/ отвечает по архиву, не по программе) —
  скачать, обновить `quiniela-programa` (sha256), `node tools/verify-sources.mjs`; найти официальный источник «significado» и закон о
  налоге на премии; ленты других провинций — если появятся официальные источники.

## jugadadeldia (03.11) — волна 1 выложена: 45 страниц + 404, индекс открыт
- **Живое:** https://jugadadeldia.com/ · /quiniela/cuanto-paga/ · /quiniela/redoblona/ · /quini-6/ · /loto-plus/ · /brinco/ · /telekino/ ·
  /poceada/ · /quiniela-plus/ · /truco/ · /truco/jugar/ · /truco/anotador/ · /truco/valores-de-las-cartas/ · /truco/senas/ · /truco/envido/ ·
  /juegos-de-cartas/ · /generala/ · /generala/jugar/ · /generala/probabilidades/ · /chinchon/jugar/ · /escoba-de-15/jugar/ · /dados/ ·
  /quienes-somos/ · /quien-escribe/ · /de-donde-salen-los-datos/ · /juego-responsable/ (+ /autoexclusion/ и 18 провинций, где в пакете
  помощи есть линия или автоисключение) · 404 «Esta bolilla no salió». `/путь` без слэша → 301 на `/путь/` (Caddy `server-setup.sh jugadadeldia update`).
- **Устройство:** `sites/jugadadeldia/` — дизайн r3 «06 Menú principal» (шары-HUD, карточки, тёмный подвал), классы `jg-*`, адреса-папки со
  слэшем (`/truco/jugar/` → `truco/jugar/index.html`), ассеты `/v/<8 hex>-<имя>` (год кэша), шрифт Kanit 400/700 (свои woff2, моно — системный).
  `kind`: `lottery`/`hub`/`service` — блок помощи + 18+ (линия провинции: на калькуляторах следует за выбранной лотереей, иначе сохранённая
  провинция или PBA; кризисная линия отдельной строкой); `game` (труко и игры) — без блока (гейт `noRgKinds`, наоборот блок на игре — ошибка);
  `help` — `data-jg-ayuda`, без игрового меню и ссылок на лотереи/игры. Автор Denis Krazok (Person на /quien-escribe/, author в WebPage).
  Честно о текстах: «redactan con ayuda de IA (Claude)», числа — код + тесты; вычитку человеком не заявляем (владелец не подтвердил).
- **Числа:** всё из `engine/lottery`, `engine/truco`, `engine/generala` и др. при сборке (`content/facts.mjs`, страницы) и в браузере тем же
  модулем; цены/часы — `value` фактов `data/sources/lottery` (`h.src.value`), цитаты `cite()` с копией и датой (`content/sources.mjs` при
  сборке гоняет `verifyLottery` и sha256/возраст копий игр ≤ 183 дн.). Señas: +7 цитат juegosdesalon в `data/sources/truco/rules.json`.
- **Игры против компьютера:** труко 1×1 (3 уровня, 4 набора правил, flor, сохранение в localStorage, разбор каждой мано), generala (боты,
  подсказка «¿qué me conviene?» и разбор ошибок через solver), chinchón (3 колоды), escoba (подсказка «se te pasó una escoba»), кости
  (crypto, гистограмма против теории). Звук Web Audio выключен по умолчанию, клавиатура и тач, анимации CSS + запасные таймеры. 2×2 в UI — нет.
- **Лотереи без лент:** результатов нет нигде (не выдумываем); «controlá tu boleta» — ручной ввод чисел тиража, сверка в браузере, номера
  билета — только localStorage. Заголовки results-страниц плана переименованы под «шансы и контроль» (план обновлён, поле `live`).
- **Общие правки tools/:** `render.mjs` — модули клиента по пути (одинаковые имена в engine/*), имя ассета `<папка>-<файл>` при совпадении;
  `check-dist.mjs` — `gate.noRgKinds`, образцы selftest из config (`helpAttr`, `navSample`, `deadLink`, `offScheme`, `rgSample`), Person-порча
  только при `noPerson !== false`; `server-setup.sh` — блок jugadadeldia; `package.json` — selftest jugadadeldia в `npm test`.
- **Честные пропуски волны 1:** /quiniela/significado-de-los-numeros/ (нет сохранённого источника таблицы фольклора), /quiniela/<провинция>/,
  /quiniela/ и прочие страницы результатов (ждём ленты), Quini 6 цена (Santa Fe гео-блок), 2×2 в /truco/jugar/, /burako/*, /chinchon/ и
  /escoba-de-15/ (инструменты «¿puedo cortar?» и «buscador de escobas»), /truco/reglas/, /truco/puntos/, /truco/flor/, /truco/quiero-o-no-quiero/.
- **Дальше:** (сцены — сделаны 03.11, см. «Сцены девушек»); ленты результатов (по слову владельца) → /quiniela/, провинции, Quini 6 hoy;
  P2 из плана; перепроверка программ LOTBA (ежемесячно, `maxAgeDays` 183) и пакета помощи до 09.02.2027.

## pingalto (03.11) — волна 4 выложена: 47 страниц из 86 плана + 404 (было 30)
- **Новое (живое, 17):** хабы со сценами «в игре» **/dota2** (наш Elo по сериям PandaScore за 180 дней, Sudamérica, cara a cara, бэктест
  ~68 % за 60 дней), **/clash**, **/brawl**, **/rl**, **/eafc**; **/dota2/ti**, **/lol/worlds** (идёт сейчас, четвертьфиналы в hora
  argentina), **/lol/msi**, **/valorant/champions** (Champions, 2 Masters — Masters London выиграл Leviatán AR, лига Américas),
  **/clash/mazos** (конструктор: элексир, цикл, кривая, типы по коду карты, сравнение с топом AR, мазо в ссылке ?m=), **/clash/meta**,
  **/brawl/meta** (выбор и винрейт с интервалом Уилсона, по режиму и по картам текущей ротации), **/esports/argentinos** (277 игроков AR с
  командой, «afuera», ближайшие матчи по id команд), **/esports/latam**, **/esports/sistema-suizo** (16 команд VRS, 10 000 прогонов,
  правила пар Valve: 1v9, «высший против низшего без реванша» с перебором, таблица 6, Бухгольц — 5 новых цитат), **/valorant/mapas/ascent**
  и **/split** (callouts es-MX + en-US из valorant-api.com по координатам, своя SVG-схема, не миникарта Riot; викторина).
- **Ленты (новые, на сервере, `sync` сделан):** `torneos` (час; Worlds 297, MSI 300, VCT 4531 — Champions/Masters/Americas, TI 4106,
  RLCS 4834/4694, FC Pro 5271; чемпион — winner_id или гранд-финал последней стадии), `argentinos` (сутки; ники, команда, страна команды —
  без имён и дат рождения), `dotaelo` (сутки, `engine/games/elo.mjs`), `clashmeta` (сутки: рейтинги игроков AR в CR пусты, берём топ-10
  кланов AR → 100 участников с наибольшими кубками → текущая колода; только счётчики), `brawlmeta` (сутки: топ-100 AR → battlelog по 25
  боёв; только счётчики). У agenda в командах появился `i` (id) — для связи с argentinos. «PARI»/PARIVISION — в маске беттинг-брендов.
- **Движки и тесты:** `engine/games/swisssim.mjs` (точные правила пар Valve, сид; тест: равные команды = точный расчёт одной команды),
  `elo.mjs`, `stats.mjs` (Wilson), `engine/test/pingalto-wave4.test.mjs` (приватность лент: нет имён/тегов/картинок/брендов).
- **Фоны:** свои 21:9 для dota2, clash, brawl, rl, eafc (`backgrounds.mjs`). **Меню «Juegos» и главная:** +5 игр (10 плиток), +5 инструментов.
- **Сцены:** /rl и /eafc — это r4 `/rocket-league` и `/fc` (в `scenes.mjs` опция `slug`, id файлов прежние); r5 (8 шт.) отмечены accepted по
  слову владельца; новые r6 (проверены мной, `checked`, ждут владельца): /clash/mazos, /lol/worlds, /valorant/champions, /brawl/meta,
  /esports/sistema-suizo, /esports/argentinos (сводка `data/img-review/contact-pingalto-scenes-r6.jpg`). Не сгенерировались (API 03.11
  вечером отвечал 524 на ~20 попыток): /valorant/mapas/ascent, /dota2/ti (первая попытка — щит как тарелка и зелёный цвет, отклонена:
  `pa-sc-dota2-ti-r6-try1.png`, промпт исправлен). Без сцены пока и /dota2/ti, /clash/meta, /lol/msi, /esports/latam, /valorant/mapas/*. Повтор: `node tools/gen-image.mjs data/art/pingalto/scene-r6-jobs.json --missing`, затем
  шаги 4–8 «Как добавить сцену». **Ловушка:** `build-scenes.mjs` переписывает `scenes.json` и снимает `checked`/`accepted` — после него
  вернуть статусы (сравнить с HEAD).
- **Заголовки, изменённые против плана (данные не держат обещание):** /rl, /eafc, /clash/mazos («comparalo» вместо «calificá» — оценку не
  выдумываем), /esports/argentinos («partidos» вместо «logros»), /valorant/mapas/split (без «rotaciones»), описания /clash/meta,
  /brawl/meta, /lol/worlds, /lol/msi, /dota2/ti, /esports/latam. План синхронизирован (`data/plan/pingalto.json`: status и notes).
- **Не сделано и почему (39, причины в notes плана):** P3 «кандидаты на удаление» без AR-угла (/kit/reaccion, /lol/horas, /ff/personajes,
  /ff/armas, /ff/historia, /brawl/mejoras, /rl/rangos|hitbox|requisitos|sideswipe, /eafc/ps4, /eafc/sobres, /mlbb); закрытые/нет источника —
  /dota2/rangos|heroes (OpenDota закрыт для ИИ), /lol/meta (платный план/ключ Riot), /lol/latam (структура лиги 2026 неясна), /cs2/rangos,
  /cs2/mapas, /cs2/economia, /cs2/autoexec, /cs2/cajas, /cs16, /valorant/mira, /valorant/mapas (ротации нет в данных), /valorant/peso,
  /valorant/mobile, /ff/max, /ff/liga, /ff/rangos, /ff/servidor-avanzado, /fortnite (+temporada, rangos: fortnite.com 403), /fortnite/tracker
  (нужен прокси с ключом — вопрос владельцу), /fortnite/tienda (вопрос), /eafc/quimica и /eafc/argentinos (EA запрещает роботов),
  /mlbb/torneos (игра без хаба и сцены; PandaScore MLBB есть — можно позже).

## pingalto (03.11) — игры: логотипы, фоны, девушка «в игре» (DECISIONS 03.11 «логотипы игр, фоны»)
- **Логотипы — лицензии** (`data/sources/pingalto/brand-policies.json`, копии в `_docs/`, цитаты дословно — тест `pingalto-brands`; robots
  каждого хоста прочитан до скачивания; хосты с 403 не трогали): **Riot** (Valorant, LoL) — логотипы и марки запрещены без письменной
  лицензии, арт — только некоммерчески с текстом LJJ; **Valve** (CS2, Dota 2) — фан-лицензии нет (политика только для видео), марки
  зарегистрированы → нет; **Epic** (Fortnite; Rocket League у Psyonix своей политики нет) — логотип разрешён фан-сайту без коммерции,
  без изменений цвета и с дисклеймером Epic, **но официального файла нам взять негде** (fortnite.com и epicgames.com/help — 403);
  **Supercell** (Brawl Stars, Clash Royale) — логотипы из фан-кита без изменений + уведомление, фан-кит отвечает 403, страниц ещё нет;
  **Garena** (Free Fire) и **EA** (FC) — фан-политики нет (у EA ещё запрет скрейпинга в robots) → нет. **Итог: ни одного официального
  логотипа**, игры — монограмма и название нашим шрифтом (FF, VAL, LoL, CS2, FN). Если владелец сам скачает логотип Fortnite с
  официальной страницы Epic или Supercell из фан-кита — кладём без изменений в `sites/pingalto/static/logos/<игра>-*.svg`, ставим
  `used: true` в политике (тест иначе падает) и дисклеймер издателя на страницу.
  **Если появится партнёрская кнопка:** Epic — снять все логотипы/арт Epic (любая коммерческая цель); Supercell — рядом с азартом нельзя
  никакие их материалы; Riot — арт только по письменной лицензии; Valve/Garena/EA — снимать нечего (их материалов нет).
- **Фоны шапки** (`data/art/backgrounds.mjs`, свои генерации 21:9 без людей, логотипов, интерфейса и копий карт): CS2 — пустынный городок
  сверху, Valorant — неоновая плаза, LoL — долина с рекой и двумя башнями, Free Fire — тропический остров с парашютами, Fortnite —
  мультяшный остров с фиолетовой бурей, Esports — пустая арена. 480/960/1600 px webp, каждый ≤ 80 КБ (CS2 1600 — 78 КБ). Герой страниц
  раздела (`content/visual.mjs` `sectionOf`, `parts.mjs` `heroBg`) — фон через `--hb1` (телефон, 960) / `--hb2` (1600) под вуалью цвета
  темы (`.pa-hb::after`), грузится один файл. Сводка `data/img-review/contact-pingalto-bg.jpg`.
- **Меню «Juegos»** (`layout.mjs` `games`, `client/pa.js` `games`): кнопка с выпадающим списком (наведение с задержкой 400 мс или клик,
  Esc, на телефоне — открытый список в бургере в 2 колонки); Free Fire, Valorant, LoL, CS2, Fortnite ушли из верхнего меню в «Juegos».
  На главной — ряд «Juegos» (5 плиток: фон 480/960 lazy + монограмма + название). Подвал и /legal: «логотипов и арта издателей нет, фоны и
  Alt — свои иллюстрации ИИ, реквизит — косплей/игрушки».
- **Сцены r4** (`scenes.mjs` `{ round: 'r4', cosplay: true }` — вместо «No weapons» текст про безопасный косплей-реквизит): на сайте
  `/cs2` (реплика снайперки в духе AWP чёрно-бело-оранжевая, ствол вверх на плече, подмигивает), `/valorant` (агент бросает розовый шар
  света), `/lol` (маг на табурете со сферой), `/fortnite/nube` (танец-эмоция с поролоновой киркой); готовы для будущих страниц `/dota2`
  (посох с янтарным кристаллом), `/rocket-league` (RC-машинка и мяч), `/fc` (нога на мяче, телефон), `/brawl` (прыжок, телефон,
  светящийся кубик), `/clash` (игрушечная корона, телефон, плюшевая капля). Статус `review` + `checked` (проверены мной в полном размере);
  `publish-scenes.mjs` теперь выкладывает и `review` с `checked`. **Free Fire r4 не удалась дважды** (1 — ноги скрестно по-турецки,
  2 — вид под подол и куртка не на руках) — на `/ff` осталась r3; попытки `data/img-review/pa-sc-ff-r4-try1/2.png`. Светящиеся шары
  оставляли серое кольцо после ключа → `data/art/glow-fix.mjs` по сырой вырезке (valorant 0.884 0.086 0.125 #ffc8e6; brawl 0.884 0.155
  0.105 #c9a8ff) — **повторять после каждой перерезки** (`--recut`). Сводка `data/img-review/contact-pingalto-scenes-r4.jpg`.
- **Ждёт владельца:** принять сцены r4 (или замечания); FF — новая идея позы; логотипы Fortnite/Supercell — только если он сам скачает.

## pingalto (03.11) — волна 3 выложена: 26 страниц + 404, индекс открыт
- **Новое (живое):** **/cs2** (Valve VRS 02.11.2026: мир 376 и Америки 87, Америки подсвечены в мировой таблице, поиск по команде/игроку,
  «cara a cara» — шанс по формуле модели Valve) · **/cs2/major** (регламент Major с GitHub Valve: фазы, Bo1/Bo3, пик-бан, точный
  калькулятор швейцарки с сеткой рекордов) · **/esports/series** (Bo1/3/5/7, шанс по каждому мапу, счёт по ходу, обратная задача,
  кривые) · **/esports** (хаб) · **/lol** (173 чемпиона Data Dragon 16.21.1 es_AR: роли из language.json, оценки Riot 1–10, сравнение) ·
  **/valorant** и **/ff** (хабы) · **/ff/codigos** (формат 12/16 из текста сайта обмена Garena, сообщения об ошибках, чек-лист мошенничества,
  куда заявлять в Аргентине — argentina.gob.ar «Con Vos en la Web»: UFECI, 0800-33-FISCAL, 102). Меню: Ping, Tier list, Free Fire, Valorant,
  LoL, CS2, Esports (раздел подсвечен и на подстраницах); на главной +5 плиток.
- **Движки:** `engine/games/series.mjs` (точная ДП серии, закрытая формула, `mapChanceFor`, `swiss` по правилу Valve — Bo3 при 2 победах
  или 2 поражениях, `swissCounts`), `vrs.mjs` (разбор таблиц VRS, `expected` = priorWinExpectation Valve с RD 75 — тест сверяет с портом их
  кода; маскировка названий с брендами ставок: BETBOOM, 1win, Betclic, SportsBetExpert…), `seriesviz.mjs` (SVG кривых и сетки, таблицы —
  одни и те же в сборке и браузере). Тесты `engine/test/pingalto-series.test.mjs` (МК, перебор, порт Valve).
- **Источники (+11, 44 цитаты):** VRS americas/global 2026_11_02, readme, glicko.js, ranking.js, fit.js, region.js (коммит f8c55f2),
  Major Supplemental Rulebook (коммит 621b7d9), Data Dragon language es_AR, бандл сайта обмена Garena (испанские строки NOTICE__LIST,
  тип html — теги внутри строк снимаются), argentina.gob.ar/justicia/convosenlaweb/denuncia. Content/vrs.mjs падает, если дата файла,
  RD или константа 400 разошлись с цитатой. **VRS обновлять руками** (Valve выкладывает новую таблицу примерно раз в месяц):
  скачать оба .md с raw.githubusercontent.com по новому коммиту, поменять url/sha256/даты и цитаты `vrs_am_date`, `vrs_gl_date`.
- **Честно не делали:** аргентинские команды не помечены (в таблицах Valve нет национальности; Wikidata SPARQL закрыт robots, Liquipedia
  закрыта для ИИ); /dota2* (api.opendota.com в robots запрещает ClaudeBot), /lol/meta, Worlds (Leaguepedia/Liquipedia закрыты для ИИ,
  Riot — ключ), /cs2/mapas (Valve не называет мапы Active Duty в регламенте; Steam API закрыт robots для всех), /valorant/mapas
  (ротации нет в данных клиента), расписание Major/календарь в hora argentina (нет цитируемой даты), списки кодов FF.
- **Внимание:** документ `lolwiki` (wiki.leagueoflegends.com, факт `lol_las_scl` на /lol/rangos и /kit/ping) скачан до правила 03.11 —
  их robots запрещает ClaudeBot. Нужна копия владельца или замена источника (на /lol его уже не используем).

## pingalto (03.11) — волна 2 выложена: 18 страниц + 404, индекс открыт
- **Живое:** https://pingalto.com/ · /kit/ping · /kit/sensibilidad · /kit/dpi · **/tier-list** · /ff/sensibilidad · **/ff/nombres** ·
  **/ff/espacio-invisible** · /valorant/rangos · **/valorant/agentes** · **/cs2/mira** · /lol/rangos · **/fortnite/nube** · /equipo · /metodo ·
  /datos · /contacto · /legal (+404 «Ping perdido»; `/путь/` → 301 без слэша — Caddy `server-setup.sh pingalto update`).
- **Устройство:** `sites/pingalto/` — дизайн r2 «02 Holo pastel», классы `pa-*`, ассеты `/s/<имя>.<10 hex>.<ext>` (год кэша), шрифты
  M PLUS Rounded 1c 800 + Be Vietnam Pro 400/600 (свои woff2). Не азарт: `gate.gambling = false` (без блока помощи/18+), selftest pingalto
  в `npm test`. Девушка — сцены в карточке «ALT · GUÍA» (с 03.11, см. «Сцены девушек»), автора нет («redacción»).
  Riot-текст в подвале страниц Valorant/LoL/tier-list и главной (`riot: true`).
- **Числа es-AR (волна 2):** `engine/games/num.mjs` — свой форматтер (запятая, точка тысяч «1.234» одинаково во всех браузерах),
  `parseNum` читает «1,25» и «1.25» (в целых полях «1.600» = 1600), `fmtInput` для значений полей. Поля — `type="text"` + `inputmode`,
  без `type="number"`. Гейт `decimal` в check-dist (включается `gate.decimalComma` в config; исключения `decimalOk`: CS 1.6, CC BY-SA 4.0;
  `<code>`/цитаты не проверяются) + тест `engine/test/pingalto-numbers.test.mjs`.
- **Движки** `engine/games/*` (тесты `games`, `xhair`, `pingalto-tools2`, `pingalto-numbers`): sens, dpi, geo, ping, bisect, ladder;
  **xhair** (код прицела CS2 формата 30.09.2026 «CS»+44 знака — порт MIT akiver/csgo-sharecode, сверен с его тест-кодами, 2 из них
  экспортированы игрой 1.41.8.8; консольные команды; превью SVG), **fancy** (13 стилей Unicode, каждый проверен через NFKC), **tier**
  (состояние тир-листа в адресе), **stream** (ГБ/час из Мбит/с).
- **Источники** `data/sources/pingalto/sources.json` + `_docs/` (30 документов, 63 цитаты; sha256, свежесть ≤ 180 дн. при сборке).
  Новое: патч-ноты CS2 (Steam News API, офиц.), csgo-sharecode (3 файла, MIT), valorant-api.com agents/maps/version (es-MX, читаются
  целиком), Data Dragon champion es_AR 16.21.1 (офиц.), xbox.com/es-AR/cloud-gaming и Xbox Wire 09.06.2022 (Аргентина, Fortnite без
  подписки, 10/20 Мбит/с, 5 ГГц), Unicode Blocks 18.0.0, Wikipedia (U+3164). Перепроверка вручную до 02.05.2027 (скрипта `--recheck` нет).
  Обновить снимки valorant-api/Data Dragon — перекачать файл, пересчитать sha256 (новый агент появится сам).
- **Честные пропуски волны 2:** /ff/max (официальных требований Garena/Play Store в HTML нет — только сторонние статьи 2021),
  /valorant/mira (формат кода Valorant официально не описан; сообщество — частично; без проверки в клиенте не делаем),
  /esports/calendario (без ленты не делаем), лимит длины ника FF и список допустимых символов (Garena не публикует — страница считает
  и предупреждает), тир-лист «vs топ Аргентины» (нужен ключ Supercell), прицелы аргентинских про (только из их публикаций — не нашли),
  клавиши C/Q/E/X агентов (нет источника). Волна 1: /cs2/premier, /cs2/rangos, /valorant/mapas/*, Fortnite в конвертере, FF между телефонами.
- **Дальше:** хаб /fortnite; копия lolwiki от владельца; ленты (VRS по месяцу, PandaScore) — по слову
  владельца; Supercell-ключ → /brawl/brawlers, /clash/mazos; /esports/sistema-suizo (симулятор с посевом и таблицей пар Valve).

## casaslegales (03.11) — 97 страниц из 117 плана (+404): что сделано и что осталось
- **Новое (14):** оператор × провинция — betano/caba, bplay/buenos-aires, bplay/caba, betwarrior/buenos-aires, jugadon/caba, jugadon/cordoba,
  jugadon/la-rioja, super7/mendoza (`content/opprov.mjs`; 4 последних вне плана добавлены в план по спросу из `data/keywords`);
  /casinos-online-legales (`pages/casinos.mjs`: 2 списка из 8 называют казино отдельно — таблица IJAN «CASINOS ONLINE PERMITIDOS» и блок
  CASINOS ONLINE Санта-Фе, код считает 7 адресов; остальные 6 — цитата «juego online» без разделения; изо-карта: высота = казино-адреса,
  «стопки» сайтов по спискам); /verificar/mystake, /verificar/jugabet (0 вхождений в сыром HTML 8 списков); /aviso-legal, /contacto
  (почты нет — неработающий адрес не публикуем), /privacidad (без cookies/аналитики; localStorage `rl-theme`, `rl-prov`; Cloudflare) — `pages/legal.mjs`, ссылки в подвале.
- **Исправлено:** «Lo que vimos en <адрес>» на странице оператор × провинция подхватывал скриншоты поддоменов других провинций
  (jugadon.bet.ar ← caba.jugadon…, bplay.bet.ar ← pba/caba/cordoba.bplay…); теперь исключаются более точные адреса той же марки.
- **Не сделано и почему (20, причины — в `notes` плана):** /operador/betway — нет в 8 списках, но в коде страницы LOTBA есть закомментированная
  запись Betway (Disp. 464/2021), а у IPLyC — «Betway Bingo King» в Registro de Aspirantes: формулировку /verificar/betway — по слову владельца;
  /verificar/casino-magic — марка есть в списке Neuquén (/operador/casino-magic-online); /verificar/casino-del-litoral — у провинций Litoral нет
  проверенного списка, нужна юр. проверка; /verificar/quiniela-online — вопрос владельцу (пересечение с jugadadeldia); /cambios — нет журнала
  хеш-монитора; /guia/mercado-pago, /margen-medido, /comparar — оплаты/линии/функции операторов за гео-блоком (нужен Chrome владельца из AR);
  /guia/apps-oficiales — нет копий страниц магазинов; /guia/que-casino-paga-mas — нет опубликованного RTP; /guia/como-funciona-una-cuenta —
  нет регламентов провинций; /guia/impuestos — нужны цитаты ARCA и юр. проверка; /juego-responsable/autoevaluacion — нужна копия и разрешение
  LOTBA; guazubet, interbet, la-correntina-online — платформы без списка (покрыты /provincia/*); betponcho, bplay/entre-rios, bplay/jujuy,
  betwarrior/salta — у провинции нет проверенного списка.

## casaslegales (03.11) — все 27 марок со своей страницей (83 страницы + 404)
- **Владелец 03.11:** «не всегда можно кликнуть на бренд». Было 10 из 27 страниц `/operador/*`; добавлены 17 (`content/operators.mjs`, план синхронизирован):
  casino-club, mac-group, super7, stake, betfun, play-uzu, playbet, arbet, mitesoro, easybet, la-neuquina-online, casino-magic-online,
  maverick-online, aladdin-online, la-rionegrina-online, casinos-del-rio (в плане было casino-del-rio), city-center-online. Слаги — `slugOf`/`opPath`.
- **Новые блоки страницы оператора** (`pages/operador.mjs`): таблица «<марка> en cada lista» для марок в ≥ 2 списках (адрес, как называет список, акт,
  регулятор, сайтов в списке, дата); «платформа провинции» (La Neuquina — IJAN называет её отдельно от таблицы казино, вычисляется по
  `evidence.doc`; La Rionegrina — цитата Лотереи) + помощь провинции; категории списка Santa Fe (casinos online / apuestas deportivas — из копии);
  цитаты регулятора о марке (Santa Fe о City Center Rosario, новые скрытые цитаты в `santa-fe.json`); `labels` — проверка названия в списке;
  `related` (у Betfun в подвале «CASINO CLUB S.A.» — с оговоркой, что не проверяли); `access` — честная причина, почему нет своей капчи.
- **Капчи** (robots.txt прочитан до съёмки, `targets.json` → `robotsChecked`): сняты подвалы Betfun, PlayBet, easybet La Rioja, Casinos del Río
  (подвал, а не главная — на главных баннеры бонусов; `capture-shots` теперь прячет и фиксированные промо-полосы ≥ 40 px, есть `clip`);
  страницы блокировки Maverick, Aladdin (только Neuquén), La Rionegrina, Play Uzu (регион), mitesoro (Wix: домен не подключён).
  **Не снимали:** MAC Group (robots запрещает ClaudeBot), Casino Club, Stake, Casino Magic, City Center (robots за проверкой Cloudflare),
  Super7 (TLS), ARBET (DNS), La Neuquina (robots.txt отвечает «Acceso restringido» — гео, не обходили; первая съёмка удалена). 14 новых цитат
  (лицензия/зона/помощь Betfun и easybet, «о себе» Casinos del Río, сообщения блокировки) — `operators.json`, сверены.
- **Ссылки везде:** главная (матрица, «misma marca»), /licencias, /provincia/* (список и «otras listas»), /operadores (все карточки — ссылки,
  «ficha todavía no publicada» убрано), /verificador (таблица и «Ver la ficha» в результате), оператор × провинция, /guia/como-verificar,
  /guia/menores, /registro-de-fuentes. Хелпер `brandLink` (`pages/parts.mjs`, ссылка на несобранную страницу роняет сборку).
- **Гейт `brandlink`** (`tools/check-dist.mjs`, настройка `SITE.gate.brandLinks` в `config.mjs`): внутри `rl-tbl/rl-reg/rl-sites/rl-dom/rl-opcs/rl-law`
  элемент с текстом = имя марки обязан быть внутри `<a href="/operador/<slug>">`; selftest — 3 порчи (снятая ссылка в /licencias и /provincia/cordoba,
  чужой адрес в /operadores). Проверено вживую: 27/27 → 200, /provincia/cordoba и /operadores на 375 и 1280 без горизонтальной прокрутки.
- **Дальше:** капчи и цитаты JR/T&C для марок без капчи — только из Chrome владельца в AR (список выше); /operador/betway в плане — марки нет в списках.

## casaslegales (03.11) — дизайн «01 Relieve alto» и третья выгрузка владельца (66 страниц + 404)
- **Дизайн** (`docs/design/casaslegales/r3/parts/01-relieve-alto.html`) применён: токены светлой/тёмной темы варианта (шалфей / ночная хвоя,
  у плиток верх + две грани, «no consultable» — коралловая штриховка), логотип-кубик (и favicon), шапка без рамки, h1 36/50, диагональные тени
  у ячеек матрицы/тегов/чипов. Общий модуль `sites/casaslegales/pages/iso.mjs`: изометрическая карта 24 юрисдикций, высота плитки
  `isoHeight` = 10 + 6 × сайтов в официальном списке (код считает), платформа 12, без данных 4; мягкая тень, ярлык «КОД · N» над выбранной,
  «лесенка высот» (`isoLadder`, списки по убыванию). Одна разметка для главной (кнопки, JS переносит ярлык), /provincias (ссылки),
  /provincia/* , /guia/menores, оператор × провинция и карты операторов (бывший SVG `licenceMap` → та же изометрия). Телефон 375:
  без горизонтальной прокрутки (проверено на 9 страницах; исправлена утечка `.rl-vh` из `.rl-scroll`), карта крупнее на телефоне; обе темы.
- **Выгрузка `3333/`** (разобрана и удалена; файлы в `docs/reference/owner-saves/2026-11-03/`, `urls.txt`):
  Córdoba `cba-juegos-online` — нужная страница, список 4 не изменился (доказательства заново дословно, шаблон допускает `/`);
  Santa Fe /casinos/ — **официальный список** → `data/sources/registries/santa-fe.json` (4 адреса: bplay, City Center Online, BetWarrior,
  Jugadón; `declaredCount` 4 по цитате «2 plataformas de juego online y 4 de apuestas deportivas», закон 14235/23);
  Santa Fe /juego-responsable-3/ → автоисключение из живой копии (Wayback 2025 удалён);
  «Juego en Línea» = **ipjyc.gob.ar/JEL/** (IPJyC Mendoza) → `registries/mendoza.json` (7 платформ, ley 9267). Обе провинции убраны из
  `provinces.json`, добавлены в `SITE.registries`; тексты provcopy, `sfe_n`/`mza_n`, бренд `citycenteronline`. Верификатор не ослабляли.
- **Операторы:** строки `check` теперь обязаны покрывать **все** реестры (сборка падает, если новый список не проверен); тексты bplay,
  BetWarrior, Betano, Codere, Jugadón, Sportsbet обновлены. Новые: /operador/bplay/santa-fe, /operador/betano/mendoza,
  /operador/betwarrior/mendoza. План синхронизирован.
- **Ещё нужно от владельца:** Mendoza автоисключение (`mendoza-autoexclusion`), PDF; копии Santa Fe/Mendoza/Córdoba/… истекают 09–11.02.2027.

## casaslegales (03.11) — копии и скриншоты владельца (из браузера в Аргентине)
- **Пришло** (папка `11111111111/`, разобрана и удалена): Chrome «полностью» 10 страниц → `docs/reference/owner-saves/2026-11-03/<slug>.html`
  (байт в байт, папки `_files` не брали; `urls.txt`). `tools/owner-copy.mjs --write` подменил 9 наших копий (реестры Río Negro, Neuquén;
  Salta в `provinces.json`; пакет помощи: ar-r, ar-a, ar-q, ar-x) → `copiedBy: "owner"`, `pendingOwnerCopy` снят. Цитаты совпали
  (сверка по видимому тексту); HTML-доказательства строк Río Negro/Neuquén взяты заново дословно из копий владельца (Chrome делает ссылки
  абсолютными и пишет `=""`), шаблон `list.more` Neuquén допускает `/` на конце. Верификатор не ослабляли. **Списки не изменились:**
  Río Negro 3, Neuquén 6. /registro-de-fuentes помечает такие копии «copia guardada a mano desde un navegador en Argentina».
- **Mendoza:** главная IPJyC (`mendoza-ipjyc-inicio`, в `data/sources/provinces/`) — ни одного .bet.ar, списка нет; ссылки «оферты»: casinomendoza,
  quinielaoficialmendoza, hipódromo и плитка **ipjyc.gob.ar/wp/** (не сохранена — кандидат на список). Статус blocked/geo → none/no-list
  с двумя цитатами («Accedé a toda la oferta…», «Formulario de Asesoramiento de Autoexclusión»), тексты `provcopy.mjs` и план обновлены.
  `registries/mendoza.json` не заводили — не из чего.
- **Скриншоты операторов** (12, адресной строки нет → хост не утверждаем): bet365 (главная, JR — по имени файла 365.png, логотипа нет),
  BetWarrior (главная, deportes), bplay (вход; deportes и JR с логотипом «bplay CABA»), Codere (главная, deportes, JR), Casino BA Online
  (вход, JR). PNG → `data/shots/<brand>/owner-2026-11-03-*.png` (под игнором), webp 960 → `static/shots/*-owner-*.webp`, в `shots.json`
  `source: "owner"`, `addressVisible: false`. Подпись «Captura de la página pública (Argentina) · 03/11/2026»; личных данных нет (никто не
  вошёл). Блок «No pudimos ver su sitio» на этих фичах → «Desde fuera de Argentina» (наши 403 остаются списком). Цитат из картинок не берём:
  инструменты JR/оплаты этих марок по-прежнему без текста. Не взяли: `Fondo-Banner-Slider.png` (талисман лотереи, не оператор),
  афиша Santa Fe сохранена только как справка.
- **Santa Fe** (вторая выгрузка `2222/`, разобрана и удалена): главная Лотереи, /historia/, /resena-de-juegos/, santafe.gob.ar/ms/juegocompulsivo/
  → owner-saves. Главная (`provinces.json` `santa-fe-inicio`): .bet.ar нет → blocked/geo → none/no-list, цитата о запрете для несовершеннолетних;
  в меню /casinos/, /juego-responsable-3/, /denuncia-juego-ilegal/ (не сохранены). Пакет помощи: линия APRECOD 0800-268-5640 — из живой копии
  (`santa-fe-juego-compulsivo`, Wayback-копия 2026-07-14 удалена), регулятор — цитата «Ley N° 2.608» со страницы /historia/;
  автоисключение — пока Wayback 2025. `registries/santa-fe.json` не заводили — списка нет. jugadadeldia тоже читает пакет помощи:
  собирается, но не выкладывался (в рабочем дереве чужие несохранённые картинки) — подхватит при своей выкладке.
- **Recheck:** `verify-rg --recheck` и `verify-sources --recheck` теперь пропускают и `copiedBy: "owner"` (раньше качали бы снова).
- **Ещё нужно от владельца:** Córdoba https://loteriadecordoba.com.ar/juegos/online (вместо неё пришла juego-responsable; `cba-juegos-online`
  pending до 11.02.2027), Santa Fe /casinos/ (вероятный список) и /juego-responsable-3/, Mendoza ipjyc.gob.ar/wp/ + автоисключение, PDF к копиям; тексты (view-source) JR/оплат bet365,
  BetWarrior, bplay, Codere — для цитат и /guia/mercado-pago.

## casaslegales (03.11) — волна 4 выложена (63 страницы + 404)
- **Robots (TRAPS 03.11):** документы с loteriadecordoba.com.ar, ijan-neuquen.com, loteriaderionegro.gob.ar, enrejasalta.com.ar (10 страниц,
  в реестрах, `provinces.json`, пакете помощи, операторах) помечены `pendingOwnerCopy: true` — факты на сайте остались, но **агенты их больше
  не качают**: `verify-sources --recheck` пропускает такие реестры, `verify-rg --recheck` — такие документы; `verify-sources` падает, если
  документ с такого хоста без пометки и без `copiedBy: "owner"` (`tools/lib/ownercopy.mjs`, список хостов `AI_BLOCKED_HOSTS`). Сборка
  печатает список «owner copies pending» с остатком дней (истекают 09–11.02.2027). Владелец сохраняет из Chrome (Ctrl+U → Ctrl+S + PDF) по
  `docs/reference/owner-saves/README.md` (там же Santa Fe и Mendoza); подмена — `node tools/owner-copy.mjs <slug> <file> --date … --write`
  → `npm test`. /registro-de-fuentes помечает такие копии.
- **Новые страницы:** /operador/{betsson/buenos-aires, betsson/caba, betsson/cordoba, betano/buenos-aires, bplay/cordoba} (`content/opprov.mjs`,
  `pages/opprov.mjs`; только где марка в проверенном списке, сборка падает при другом адресе): таблица-diff версий марки по всем спискам
  (отличия подсвечены, код считает), «¿Estás en el sitio de …?» (engine/hostcheck в браузере), что видели на этом адресе, помощь провинции.
  Схема адресов: третий уровень разрешён только `/operador/<марка>/<провинция>`. Ссылки на них — из карты лицензий страницы оператора.
- /calculadora/cuotas — decimal/fraccional/americana, вероятность, снятие маржи 2–3 исходов в любом формате; /calculadora/combinada —
  кэф комбинированной, «1 из N», маржа = 1 − Π devoluciones, «лестница» на 6 матчах-примерах (`engine/odds.mjs`: parseFractional,
  parseAmerican, toFractional, toAmerican, convertOdd, parlay; тесты `engine/test/odds-formats.test.mjs`). В плане добавлена /calculadora/cuotas.
- /guia/ley-federal (по плану; это и есть «publicidad»): таймлайн Diputados 27.11.2024 → комиссии Сената 26.03.2025 → пленарий 15.10.2025 →
  проект Ejecutivo 26.05.2026 → moción de preferencia 29.10.2026; цитаты о рекламе обоих проектов (новые `law[].also` в пакете помощи,
  сверены побайтно); 10 из 28 проектов Сената о рекламе — считает код по копии страницы Сената.
- **Не сделано и почему:** /guia/mercado-pago — Mercado Pago текстом есть только у Jugadón CABA (нужны ≥ 3 оператора; bet365, BetWarrior,
  bplay, Codere отдают 403 из Польши — нужен Chrome владельца из AR); /guia/impuestos — нужны цитаты ARCA и юр. проверка (P3);
  bplay/santa-fe, betano/mendoza, betwarrior/mendoza — нет проверенного списка. **Дальше:** jugadon/la-rioja (данные есть), /operador/stake,
  super7, betfun, play-uzu; копии владельца → Santa Fe/Mendoza в реестры.

## casaslegales (03.11) — волна 3 выложена (55 страниц + 404, индекс открыт)
- **Волна 3 (живое):** /provincias (таблица 24 юрисдикций, фильтр по статусу, на телефоне — карточки) · /provincia/<все 24> ·
  /guia/como-verificar · /guia/menores · /calculadora/margen · /guia/handicap. Меню: Verificador, Licencias, Provincias, Cómo verificar,
  Operadores, Ayuda; провинции PBA/CABA/Córdoba ушли из меню (есть хаб); калькулятор и hándicap в подвале скрыты на страницах помощи (гейт helplink).
- **Статусы (код считает, не руками):** «lista oficial verificada» = реестр в `data/sources/registries/` — PBA 7, CABA 11, Córdoba 4,
  **La Rioja 6** (AJALAR, пост 26.02.2025), **Neuquén 6** (IJAN: La Neuquina Online со страницы «Juego legal» + таблица «CASINOS ONLINE
  PERMITIDOS»; две страницы — новое поле `list.more` в `tools/lib/sources.mjs`), **Río Negro 3** (блок «Jugá online en los sitios autorizados»
  на главной Лотереи). Остальные 18 — `data/sources/provinces/provinces.json` (проверка `tools/lib/provsources.mjs`, вызывается из
  `verify-sources.mjs` и при сборке): «plataforma provincial» — Entre Ríos (IAFAS Play), Misiones (GuazuBet, QuinApp), Chaco (Interbet),
  Corrientes (La Correntina Online): byte-доказательство ссылки + проверка, что других .bet.ar-ссылок в копии нет; «sin dato verificado» —
  Salta, Tucumán, San Juan, TdF, Santa Cruz (копия главной/страницы, проверено «нет .bet.ar»), Jujuy (только JS-оболочка), San Luis,
  Catamarca, La Pampa, Formosa, Santiago del Estero (не нашли/таймаут); «no consultable» — Chubut (исключён), Santa Fe, Mendoza (гео-блок,
  не обходили; ждём копии владельца). Без гео-обхода и без обхода защиты. robots у Neuquén/Río Negro/Salta закрыт для ClaudeBot (Cloudflare),
  `*` разрешён с `use=reference` — по прецеденту Córdoba: одна загрузка с прозрачным UA `casaslegales-check/1.0`, только справка.
- **Страница провинции:** свой рельеф-мини-карта (плитка провинции подсвечена) + чипы статуса/линии/автоисключения/18+/даты; тело по
  статусу (список · платформа · «что проверили» · почему не цитируем); помощь и автоисключение из пакета RG. Текст — `content/provcopy.mjs`,
  сборка падает, если статус в тексте ≠ статус в данных. Новые реестры подтянулись в /licencias, /verificador, карту главной, операторов:
  BetWarrior теперь и в Neuquén, Jugadón — и в La Rioja (jugadon.bet.ar), `check`-строки обновлены.
- **Гайды:** `engine/odds.mjs` (+ `engine/test/odds.test.mjs`): маржа/честные кофы из десятичных кэфов, расчёт азиатского hándicap
  (целые/половины/четверти); калькулятор работает в браузере тем же модулем. /guia/menores — 18+ из цитат регуляторов (8 юрисдикций) и
  операторов + проект закона (media sanción). /registro-de-fuentes включает копии из `data/sources/provinces`.
- **Перепроверка:** все новые копии от 03.11 — свежи до 11.02.2027 (`verify-sources.mjs --recheck` перекачивает реестры; копии
  `data/sources/provinces/` пока перекачивать руками тем же UA).

## casaslegales (03.11) — волна 2 (29 страниц + 404)
- **Живое (новое):** /verificador · /operadores · /operador/{betsson, betano, bet365, bplay, betwarrior, codere, jugadon, playcet, sportsbet,
  casino-buenos-aires-online} · /verificar/{zeus, tucan-win, betbox, 1win, betonwin} · /guia/bet-ar · /guia/sitios-ilegales ·
  /juego-responsable/autoexclusion (страница помощи). Меню: Verificador, Licencias, Operadores, 3 провинции, Ayuda; гайды — в подвале.
- **Оператор:** своя SVG-карта лицензий (только PBA/CABA/Córdoba из реестров, прочие — «sin dato verificado»), разбор адреса
  (поддомен · имя · окончание), цитаты своего сайта о лицензии/возрасте/линии помощи, сравнение номера акта «подвал сайта vs список
  регулятора» (Jugadón CABA DI-2021-468 vs 1132/23; Jugadón CBA и Playcet 1689/23 vs 1889/23 — «не совпадают, решает список»),
  свои скриншоты, RG-инструменты и оплаты — только цитаты. Строки `check` в `content/operators.mjs` — сборка падает, если реестр изменился.
- **Скриншоты:** `node tools/capture-shots.mjs [id…]` (Playwright из manuallysites, headless, es-AR; без входа/регистрации/депозита;
  отклоняет cookies, если есть кнопка; прячет промо-оверлеи) → `data/shots/<дата>/*.png` (под игнором), `data/shots/shots.json`,
  `sites/casaslegales/static/shots/*.webp` (отдаются как `/_r/<хеш>.webp`, `SITE.images`), DOM без скриптов → `data/sources/operators/_docs/`.
  Цели — `data/shots/targets.json`. Сняты с этой машины (Польша): Jugadón CABA/CBA, Playcet, Casino BA Online — открылись;
  betsson.com.ar → www.betsson.bet.ar (выбор провинции); pba./cba.betsson, Betano, pba.sports — страницы блокировки (сняты как есть).
  **Не открылись (403, Cloudflare/Akamai):** bet365, BetWarrior, bplay (все 3), Codere; Casino BA Online JR/T&C → region_not_supported —
  на страницах честно «no pudimos ver su sitio». Для них нужен Chrome владельца из Аргентины.
- **Источники операторов:** `data/sources/operators/operators.json` — 51 цитата в 17 копиях (14 страниц операторов + 3 офиц.: LOTBA
  juegosegurolegal, Lotería de Córdoba, проект закона argentina.gob.ar); проверка `node tools/verify-operators.mjs` (в `npm test` и при
  сборке): sha256, дословность, свежесть ≤ 100 дн. (переснять до 09.02.2027). Ссылок на операторов нет нигде (адреса — текст).
- **Verificador:** `engine/hostcheck.mjs` (+ тесты): точное/поддомен → «figura», имя/родитель/1–2 буквы/содержит → «parecida»,
  иначе «no figura en las listas que revisamos» (≠ нелегально). Данные встроены, сеть не нужна; `?d=` для ссылки.
- **Проверки брендов** `/verificar/*`: сборка ищет имя в сыром HTML трёх копий списков и падает, если нашла; Stake не брали (есть в PBA).
- **План** `data/plan/casaslegales.json` синхронизирован (title/H1/description построенных, поле `live`).
- **Дальше:** Chrome владельца из AR — скриншоты bet365/BetWarrior/bplay/Codere/Betano (+ их JR/T&C → цитаты) и копии списков Mendoza/Santa Fe
  (`docs/reference/owner-saves/`) → перевести их в «lista oficial»; P2: /operador/stake, super7, betfun, play-uzu, casino-club (Río Negro);
  operator × provincia; /guia/mercado-pago (нужны оплаты ≥ 3 операторов); `--recheck` для `data/sources/provinces`; verificador может
  отдельно показывать «plataforma provincial» (сейчас такие адреса — «no figura en las listas»).
