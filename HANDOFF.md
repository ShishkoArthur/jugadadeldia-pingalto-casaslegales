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
- **Telegram по-русски (05.11):** все уведомления (ленты трёх сайтов, Fortnite-трекер, его сторож) — русские шаблоны `data/alerts/ru.json`,
  первая строка `🔴/🟡/🟢 <домен> · лента/сервис «…»`, причина, что сделано, что делать, время ART и МСК; повтор не чаще 12 ч, сводка раз в сутки,
  🟢 при починке (`tools/feeds/alerts.mjs`, тесты `engine/test/alerts.test.mjs`). Подключить другой проект к боту — **`docs/TELEGRAM-BOT.md`**
  (без значений ключей). Тест: `bash tools/feeds-server.sh <сайт> run --test-alert`. Выложено 05.11 (ленты трёх сайтов и fnapi с новым сторожем —
  с коммита 2e53902), три тестовых `[тест]` дошли (200); `_health` всех трёх — ok.

| Что | Состояние | Кто |
|---|---|---|
| GitHub `git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git` | **push работает** (проверено 02.11, `main` отслеживает `origin/main`) | — |
| Cloudflare | DNS трёх доменов уже в Cloudflare (прокси на 187.7.26.95); **токен из `.env` видит только gambeteo.com** (перепроверено 02.11 вечером) — добавить jugadadeldia.com, pingalto.com, casaslegales.com в Zone Resources того же токена | владелец |
| Сервер | **работает (02.11, 21:57 UTC):** владелец запустил `bash tools/server-setup.sh all install` — блоки `# >>> jugadadeldia|pingalto|casaslegales`, бэкапы `Caddyfile.bak-<сайт>-20261102-*`, соседи 200; https трёх доменов — 200 (заглушка noindex), www → 301. Дальше правки блока — `update` | — |

Открытый ключ GitHub (не секрет): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPZ/k/crurewdEaZLh2EBMmmKXlN9ZWzBm/rdNlFv2a9 jugadadeldia-pingalto-casaslegales deploy key`

## СОСТОЯНИЕ 04.11 (финальный QA дня, `docs/QA-2026-11-04.md`)
- **jugadadeldia.com — 85 страниц + 404** (кинела по провинциям, лото, труко 1×1 и 2×2, генерала, чинчон, эскоба, бурако, гайды, FAQ;
  автор Denis Krazok). **pingalto.com — 50 + 404** (хабы игр, академия, инструменты, esports). **casaslegales.com — 105 + 404** (27 марок,
  обзоры, cómo ingresar, хаб казино, гайды, официальные «Ir» nofollow). Индекс открыт, без монетизации, перекрёстных ссылок нет (проверено).
- **Само обновляется:** jdd — кинела каждые 15 мин, провинции и лото каждый час, программа и цены LOTBA, сроки источников; pingalto —
  PandaScore, Clash Royale, Brawl Stars, рейтинги (час/сутки); casaslegales — официальные списки раз в месяц (`listas`), сроки (`plazos`),
  одно Telegram-напоминание. `_health` всех трёх — ok (04.11).
- **Владелец раз в полгода** — `docs/MAINTENANCE.md` (копии сайтов, закрытых для ИИ, и гео-блок — Chrome в AR; обзоры через Chrome с VPN AR;
  Search Console; ключи). Ближайшее: Telegram 09.04.2027; руками владельца — HCDN и ley 8986 к 30.04.2027, Río Negro ×3 к 02.05.2027.
- **Копии владельца 05.11 — сняты в его Chrome** (VPN AR, видимая вкладка, robots.txt каждого сайта проверен): 16 страниц Córdoba, Neuquén,
  Salta, Santa Fe, Mendoza, Tucumán → `copiedBy: "owner-browser"`, до 04.05.2027; списки и цитаты не изменились (README owner-saves, раздел 05.11).
  Не открывали: Río Negro (robots: Claude-User), hcdn.gob.ar (Claude-Code), e-legis ley 8986 (robots 500).
- **QA 04.11:** 1 458 загрузок + `tools/qa/static.mjs` (title/description, JSON-LD/FAQ, robots, sitemap, ленты, «Ir» + проба 5 адресов) +
  ссылки — 0 битых. Исправлено и выложено: pingalto (0d4487f), casaslegales (27fe5ec). **jdd (10b41a0) в main, не выложен:** `npm test`
  падает на кириллице в `tools/translate.mjs` (параллельный коммит i18n eead0b3) → после правки `bash tools/deploy.sh jugadadeldia`.
- **Открыто:** ключ fortnite-api.com для трекера (регистрация через Discord — владелец; затем /fortnite/tracker); копии руками владельца
  (Río Negro ×3, HCDN, ley 8986 — `docs/reference/owner-saves/README.md`); вопрос о сцене до инструмента на телефоне на pingalto; P3 — в отчёте QA.
  После меню с подменю, поиска и английских версий — **повторить полный QA** (этот проход их не покрывает).

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
- **QA 03.11 (вечер) сделан — `docs/QA-2026-11-03.md`:** 1 326 загрузок (все страницы × 375/768/1280 × темы) + ревью скриншотов;
  найдено и исправлено P1/P2: pingalto 7, casaslegales 7 (в т. ч. P1 — прокрутка на планшете на всех страницах), jugadadeldia 4 (P1 — текст
  «Cómo armamos» по 3 буквы на 10 страницах кинелы); выложено, повторный проход чистый. Осталось P3 (список в отчёте) и **вопрос
  владельцу: на телефоне на страницах-инструментах сцена стоит до инструмента** (предложение — сцену после инструмента, как на столах jdd).
  Повторить: `node tools/qa/live-pass.cjs --site <сайт>` → `node tools/qa/summary.cjs …` (+ `tools/qa/links.cjs`).
- **Дальше:** тексты через Claude API; P2-страницы плана jugadadeldia. pingalto: всё, что можно честно, построено (волна 4) + трекер Fortnite (04.11, раздел ниже); оставшиеся страницы плана — с причинами в «pingalto волна 4».

## Меню и поиск (04.11) — на всех трёх сайтах, выложено (DECISIONS 04.11 «подменю разделов», «все страницы в меню», «поиск»)
- **Меню = все страницы сайта**, само: `tools/lib/navtree.mjs` раскладывает построенные страницы по правилам `sites/<сайт>/content/menu.mjs`
  (раздел → группа → страница; хаб первым, дальше волна и порядок плана; провинции и бренды-проверки — по алфавиту). Новая страница попадает в
  свой раздел сама; не подошла ни под одно правило — в «Más páginas» последнего раздела (тогда дописать правило/подпись в `LABEL`).
  pingalto: Juegos (игра → её страницы) · Esports · Kit · Nosotros; jugadadeldia: Quiniela (Hoy / Por turno / Por provincia / Para entenderla) ·
  Loterías · Truco · Juegos (игра → Jugar/Anotador…) · Ayuda · El sitio; casaslegales: Operadores (бренд → Casino · Cómo ingresar · провинции) ·
  Provincias · Licencias · Guías · Ayuda · Redacción. ПК: панель раздела по наведению (закрытие через 300 мс) и по клику, Tab/Enter/Esc,
  aria-expanded; телефон/планшет (pingalto < 861, jdd < 1001, casaslegales < 1080 px): бургер → панель на всю высоту, аккордеон, текущая открыта,
  блок прокрутки только на `html`, цели ≥ 44 px. Страницы помощи — только короткое меню помощи. Хлебные крошки JSON-LD — из того же дерева.
- **Поиск по содержимому:** после сборки `tools/lib/search.mjs` даёт id всем H2/H3 и пишет индекс на язык (`/indice.json` pingalto,
  `/busqueda.json` jdd, `/buscador.json` casaslegales; английский — `/en/…`): H1, title, description, ключи плана, вопросы FAQ, разделы с началом
  текста (без таблиц, цитат, «Cargando…»). Поиск — `engine/search.mjs` (без акцентов, префиксы, опечатки), UI — `client/find.js` / `busca.js` /
  `buscar.js`, грузятся при первом открытии; кнопка-лупа в шапке, «/» на ПК, поле в меню телефона, ↑↓ Enter Esc, переход к якорю раздела.
  На страницах помощи результаты только помощь и служебные (флаг `x`). gzip: pingalto 29 КБ, jdd 19 КБ, casaslegales 33 КБ.
- **Гейты** `check-dist`: `menu` (каждая страница sitemap своего языка в `<nav data-*-all>` ровно один раз; на помощи полного меню нет) и `search`
  (индекс языка = страницы sitemap); оба в selftest. Тест движка — `engine/test/search.test.mjs`.
- **Слот языка:** `langSlot(h, p)` в `layout.mjs` каждого сайта (между меню и лупой); в jdd его уже заполнил агент i18n. Новые строки меню/поиска
  на английском берутся из памяти перевода (`node tools/translate.mjs <сайт>`).
- **Вес:** pingalto `/cs2` 157 КБ из 160 (данные VRS 24 КБ в странице) — при росте облегчать страницу, не бюджет (TRAPS).
- Проверено Playwright 375/768/1280 × обе темы (локально и на живых): подменю, клавиатура, без переполнения и ошибок консоли; «tucuman»,
  «cuanto paga», «envido», «betsson ingresar», «sensibilidad», «major» находят нужные страницы.

## Английская версия `/en/` (04.11) — jugadadeldia (85 страниц), pingalto (50), casaslegales (105) выложены, инструкция `docs/I18N.md`
- **Движок (общий):** второй проход сборки (`h.lang='en'`, путь страницы остаётся испанским) → `htmlToEn()` (`tools/lib/i18n.mjs`): словарь
  `sites/<сайт>/i18n/en.mjs` (меню/шапка/подвал) → память `data/i18n/<сайт>-en.json` (числа/даты — слоты `{N}`, новые даты не требуют
  перевода); английские браузерные модули (литералы из памяти); `num.mjs` — английские разделители при `<html lang=en>`; hreflang es-AR/en/
  x-default + sitemap с alternates; переключатель `h.langs()` (у jdd — «EN/ES» в шапке, `hreflang` + `translate="no"`); цитаты остаются
  испанскими + «In English:» (`SITE.i18n.quoteNote`). Сборка API не зовёт: нет строки → падает со списком → `node tools/translate.mjs <сайт>`.
- **Гейты:** hreflang (взаимность, x-default, sitemap), langlink, langswitch, spanish (эвристика + `keep` глоссария + имена учреждений из
  пакета помощи + цепочки имён «Instituto … de …»), decimal (запятая на en), oglocale, langattr, urlscheme `/en`+схема; все в selftest.
- **jugadadeldia:** адреса `/en/…` (`/en/quiniela/payouts/`, `/en/truco/play/`, `/en/responsible-gambling/…`, `/en/author/`) — план
  `urlEn/titleEn/descriptionEn/h1En`; глоссарий `data/i18n/jugadadeldia-glossary.json`. Ревью Opus (6 стр., 8–9/10) —
  `docs/REVIEW-EN-jugadadeldia.md`, 21 правка внесена. Формат: «$ 1,234.50» (песо), «4 Nov 2026», время 24 ч, «Argentina time».
- **Потрачено:** ≈ $2,3 (план $0,25, строки ≈ $1,8, ревью $0,23) — `data/i18n/_spend.json`.
- **При правке испанского текста jdd:** сборка назовёт новые строки → `node tools/translate.mjs jugadadeldia` (центы) → коммит памяти.
- **Три сайта с `/en` (04.11):** jdd, pingalto и casaslegales (разделы ниже). Не сделано: английская 404 (одна, испанская);
  «A 30»-подобные склейки в инструментах проверять живьём.

## pingalto `/fortnite/tracker` (04.11) — трекер Fortnite выложен (+ `/en/fortnite/tracker`; DECISIONS 04.11 «ключ fortnite-api.com»)
- **Страница:** поиск по имени Epic (3–16 символов: буквы, цифры, пробел, `.`, `-`, `_`), «с чем играет» (всё / клавиатура и мышь / джойстик /
  тач), период (всё время / сезон), второй игрок для сравнения; ссылка `?n=&vs=&p=&w=` открывается сразу с результатом. Первый экран —
  6 больших чисел (победы, «из 100 матчей», K/D, убийства за матч, матчи, часы) с фразой под каждым, затем таблица по режимам с местами
  (solo 10/25, duo 5/12, squad 3/6 — как отдаёт API), уровень боевого пропуска, последний матч в hora argentina, калькулятор «сколько до K/D».
  Честные блоки: как сделать статистику публичной, имя Epic а не PSN/Xbox, «datos de fortnite-api.com, no afiliado a Epic Games», без скинов
  и магазина. Сцена — r4 Fortnite (файлы `/fortnite`). Код: `sites/pingalto/pages/fntracker.mjs`, `client/fntracker.js`,
  общие правила `engine/games/fnstats.mjs` (лимиты, проверка имени, белый список полей, K/D-план), тест `engine/test/pingalto-fntracker.test.mjs`.
  Гейт `bait` ловит «top 10» — на странице «entre los 10 primeros» / «first 10».
- **Прокси:** `tools/fnapi/server.mjs` + `core.mjs`, контейнер **`pingalto-fnapi`** (node:24-alpine, uid 47221, read-only, 128 МБ, 0,25 CPU,
  64 pids, restart unless-stopped, сеть `web_default` без портов, healthcheck), `/opt/web/pingalto-fnapi/` (app, secrets.env root 600 —
  `FORTNITE_API_KEY`, `TG_*`), watchdog `/etc/cron.d/pingalto-fnapi` каждые 5 мин (остановлен/unhealthy → пересоздать + Telegram).
  Caddy (наш блок): `handle /api/fn/* → reverse_proxy pingalto-fnapi:8787`. `GET /api/fn/stats?name=&platform=&window=` → только нужные поля;
  ошибки `bad_name` 400, `not_found`/`no_matches` 404, `private` 403, `rate_ip` 429 (+ Retry-After), `busy` 503, `upstream` 502; `/api/fn/health`.
  Лимиты: 10/мин на посетителя (IP из CF-Connecting-IP только если соединение пришло с адреса Cloudflare), 60/мин к API на весь сайт
  (ключ даёт 180/мин — заголовки `x-rate-limit-*`), кэш 10 мин на имя+период (все 4 платформы одним ответом; «private» — 2 мин),
  таймаут 8 с, одинаковые запросы ждут один вызов. Имена в логи не пишутся. Telegram (по-русски, шаблоны fn_*): 5 сбоев API подряд или сразу 401 (ключ) — не чаще раза в 12 ч,
  и 🟢 при починке; сторож шлёт fn_restarted через `tools/feeds/notify.mjs` (не чаще раза в 12 ч). Управление: `bash tools/fnapi-server.sh install|secrets|sync|restart|status|logs` (sync — только закоммиченное).
  `telegram()` теперь в `tools/feeds/lib.mjs` (им пользуются и ленты).
- **Проверено живьём 04.11:** `/fortnite/tracker?n=Ninja` → 11.458 побед, K/D 10,16, таблица режимов; `?n=Ninja&vs=SypherPK` — сравнение;
  несуществующее имя → «No hay ninguna cuenta de Epic…»; `a<b` → «El nombre … no sirve» (в браузере, без запроса); 11 быстрых поисков →
  «Hiciste muchas búsquedas seguidas: esperá N segundos» (429 с 11-го в минуту); сезон без матчей → «no jugó ninguna partida en este período»;
  `/en/fortnite/tracker` — английские фразы и формат чисел. 375 и 1280 без горизонтальной прокрутки; на ПК 6 чисел в первом экране, на
  телефоне по ссылке `?n=` результат сразу под шапкой, после «Buscar» — прокрутка к результату. Соседи после Caddy — 200.
- **Ловушка (исправлено):** класс `.pa-ft` — это подвал сайта; у трекера `.pa-ftr`. Колонка результатов — `minmax(0,1fr)`, иначе таблица
  режимов растягивает её шире телефона.

## pingalto `/en` (04.11) — выложен, 50 страниц
- **Адреса** без слэша, как испанские: главная `/en` (файл `en.html`; `/en/` → 301), `/en/kit/sensitivity`, `/en/valorant/ranks`,
  `/en/cs2/crosshair`, `/en/esports/schedule`, `/en/clash/cards`… Правило адресов — `urlRule` в `data/i18n/pingalto-glossary.json`
  (translate.mjs `--meta` берёт его из глоссария). Строка плана для `/esports/glosario` добавлена (её не было). Titles под английский
  поиск поправлены руками (6 шт.), «top N»/«guarantee» переписаны (гейт bait).
- **Глоссарий:** ранги Valorant/LoL официальными английскими именами, CR → RR, PL → LP, mira → crosshair, «hora argentina» → Argentina time,
  LAS, провинции, игры, турниры. Словарь `sites/pingalto/i18n/en.mjs`: меню (Games / Esports / Kit / About), поиск, подвал; `DATA` — строки,
  которые страницы отдают модулям в JSON (`#pa-d`: ступени рангов, единица RR/LP, ползунки Free Fire, роли и статы LoL, наборы tier list,
  подписи пинга) — layout переводит их через `h.tr`.
- **Цитаты:** английские (`lang="en"`, 84 шт.) — без «In English», испанские — с пересказом (`.pa-qen`); строка источника внутри цитаты
  (`<cite>`: «official … copy from 3 Nov 2026») переводится (`SITE.i18n.citeEn`, общий движок, на jdd выключено).
- **Valorant agents:** имена умений и ролей — из официального английского клиента (valorant-api.com en-US, по uuid/slot), строки агентов
  переведены заново с этим списком. Ленты (PandaScore, Supercell) на `/en` — английские подписи; «Nombre oculto»/«Otros» из лент — через
  `client/fdkit.js` WORDS. Таблица callouts: испанский столбец `translate="no"`.
- **Ревью Opus** (6 стр.: /en 9, kit/ping 7, valorant/agents 5 → исправлено, team 8, ff 9, kit/sensitivity 7) — `docs/REVIEW-EN-pingalto.md`,
  14 правок авто + ручные (раздел в конце файла).
- **Проверено живьём** 375/1280: `/en`, kit/sensitivity, esports/schedule, valorant/ranks (калькулятор), clash/cards, cs2/crosshair, lol,
  kit/ping — переключатель ES, hreflang es-AR/en/x-default, меню (бургер и мега-панель), поиск «sensitivity» → `/en/kit/sensitivity`,
  без переполнения и ошибок консоли; sitemap 100 адресов с alternates.
- **Потрачено:** $2,64 (план $0,14, строки $2,21, ревью $0,29). Испанский VRS с новыми командами → сборка назовёт строки → `node tools/translate.mjs pingalto`.

## casaslegales `/en` (04.11) — выложен, 105 страниц
- **Адреса** без слэша: `/en` (файл `en.html`; `/en/` → 404, как любой адрес со слэшем), `/en/operator/betsson`, `/en/operator/betsson/caba`,
  `/en/operator/betsson/log-in`, `/en/operator/bplay/casino`, `/en/province/cordoba`, `/en/check/zeus`, `/en/site-checker`, `/en/licenses`,
  `/en/guide/bet-ar`, `/en/calculator/parlay`, `/en/responsible-gambling/self-exclusion`, `/en/source-log`. `pathRe` в config принимает
  `operator` третьим уровнем. Правило — `urlRule` в `data/i18n/casaslegales-glossary.json`; title ≤ 60 («Betsson Argentina: review, licenses
  and official site»); на английских страницах операторов с данными обзора слово «review» обязательно (проверка в `pages/operador.mjs`).
- **План:** у 29 строк испанские title/H1/description отставали от кода — синхронизированы с собранными страницами, английские написаны заново.
- **Глоссарий/словарь:** регуляторы и правовые слова остаются по-испански (LOTBA, IPLyC, «Disposición», «Ley»), autoexclusión → self-exclusion,
  cuota → odds, combinada → parlay, .bet.ar; словарь `sites/casaslegales/i18n/en.mjs` — меню, поиск, подвал («Not legal advice: it depends on
  your province's law»), блок помощи, подписи схемы адресов. `SITE.i18n.allow` — имена e-mail/телефона операторов.
- **Цитаты регуляторов** — дословно по-испански (`lang="es-AR"`, со своей строкой «copia del…»), сразу после — `.rl-qen` «Translation (not
  official): “…”» со строкой источника по-английски. Кнопки «Go to the official site» ведут на те же адреса (гейт officialLinks тот же).
- **JSON для браузера** (верификатор, сравнение на страницах оператор×провинция, карта на главной) — через `content/lang.mjs`
  (`tr`/`trAll`/`date`/`loc`: строки, даты «4 Nov 2026», ссылки на `/en/…`). `client/ui.js`: на `<html lang=en>` — «2.50», «4.8%»,
  «$ 1,450», ставка с запятыми тысяч, даты «4 Nov 2026». Гейт brandlink (общий) на английских страницах ждёт английскую ссылку бренда.
- **Ревью Opus** (главная, верификатор, Betsson, Betsson log-in, Córdoba, гайд .bet.ar: 6–10/10) — `docs/REVIEW-EN-casaslegales.md`, 21 правка
  внесена автоматически, остальные руками («Figure:» → «Listed:» в таблице главной, схема адресов на страницах log-in была по-испански).
  Гейт bait запрещает «Jackpots»/«Top 10» и в пересказе цитат — там «Progressive Prizes»/«Top ten».
- **Проверено живьём** 375/1280: шапка с EN/ES влезает на 375, меню (аккордеон), поиск (`/en/buscador.json`, «betsson log in»), верификатор
  (pba.betsson.bet.ar / betsson.com / sportsbet.io — тексты и ссылки английские), обзор Betsson, провинция Córdoba, калькуляторы; без
  горизонтальной прокрутки; hreflang пары и sitemap (3 alternates).
- **Потрачено:** ≈ $3,0 (план $0,42, строки $2,21, ревью $0,35).
- **При правке испанского текста:** сборка назовёт новые строки → `node tools/translate.mjs casaslegales` → коммит памяти. Новая страница —
  строка плана → `--meta` (английские адреса по `urlRule`, проверить глазами) → `translate`. Можно включить `SITE.i18n.citeEn` (как у
  pingalto), чтобы «copia del…» внутри испанской цитаты тоже было по-английски.

## Ленты casaslegales и обслуживание раз в полгода (04.11) — работает, `docs/MAINTENANCE.md`
- **Сервер:** `feeds-server.sh casaslegales` — `/opt/web/casaslegales-feeds/`, cron `37 6 * * *` UTC, uid 47230, UA `Casaslegales/1.0
  (casaslegales.com)`, TG-ключи в secrets. Ленты `listas` (раз в месяц перекачивает официальные страницы, robots.txt — мы и любой
  ИИ-краулер; те же проверки, что сборка; без изменений → новая серверная копия и «revisada el …» на страницах через
  `/data/feeds/listas.json`; изменился список → не публикуется, Telegram с «Added/Removed») и `plazos` (сроки копий владельца, обзоров,
  операторов; **одно** напоминание за 21 день до первого срока — **09.04.2027**). Первый прогон 04.11: 38 ok, 16 копий владельца,
  4 не открылись (Tucumán TLS, mendoza.gob.ar 403, e-legis robots 500), hcdn.gob.ar закрыт для ИИ → стал копией владельца. status OK. Эти 4 — тоже копии владельца
  (`refresh: "manual"`, 04.11): cajapopular.gov.ar — таймаут подключения (не TLS), mendoza.gob.ar — 403, ley 8986 — robots 500 и другого
  официального текста нет; список — README owner-saves.
- **Сроки (решение владельца 04.11 «продлевай до 180 дней»):** одно правило `tools/lib/copyage.mjs` (`docMaxAge`): копии владельца
  (`copiedBy: "owner"`, `pendingOwnerCopy`, закрытые для ИИ хосты, `refresh: "manual"`) — 180 дней в любом наборе (реестры, провинции, помощь,
  лотереи jdd); скачанные нами — `maxAgeDays` своего JSON (реестры, провинции, помощь — 100, обновляет сервер раз в месяц); обзоры и операторы — 180.
  Его используют verify-*, гейт `fresh` (+ selftest 180/181 день), ленты `listas`/`plazos`/`fuentes` (jdd синхронизирует `copyage.mjs`),
  тексты casaslegales (`{{owner_max_age}}`, `{{next_check}}` = первый срок любой копии) и таблица источников jdd. Копии владельца истекают
  30.04.2027 (HCDN, ley 8986), 02.05.2027 (Río Negro ×3) и 04.05.2027 (16 копий из Chrome владельца 05.11, `copiedBy: "owner-browser"` —
  тоже копия владельца); напоминание о них — 09.04.2027, одним списком с обзорами и операторами.
- **Перед выкладкой после ~февраля 2027:** `bash tools/feeds-server.sh casaslegales pull --write` → `npm test` → commit → `sync` (casaslegales и
  jugadadeldia — общий пакет помощи) → deploy. `sync` теперь шлёт только `git archive HEAD` (TRAPS 04.11 исправлено); jdd и pingalto пересинхронизированы, health OK.

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
  только после 30.11, если не выйдет. Лента `precios`: цены месячных программ LOTBA (кинела, Poceada, Loto Plus, порог крупного приза) —
  раз в месяц с формуляра, копия PDF с sha256 на сервере, строгий разбор (цифры = слова), скачок > 50 % / пропажа → не публикуется,
  Telegram; остальные цитируемые значения сверяются дословно. Страницы берут цену в браузере с «vigente hasta …», после срока — скрывают.
  Лента `fuentes` (без сети) → `_health.json.expiries`: сроки копий LOTBA/PBA/CAS (+183 дн., ближайший 05.05.2027), пакета помощи
  (09.02.2027), правил игр; Telegram за 14 дней. `status` печатает таблицу. Подробно — docs/FEEDS.md.
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
- 04.11 — jugadadeldia (решения владельца 04.11 по аудиту): на телефоне (≤ 620 px) на 46 страницах результатов и инструментов сначала
  H1, потом результаты/инструмент, потом лид с кнопками, потом сцена (lazy); ПК без изменений. FAQ (+FAQPage) на /quini-6/, /loto-plus/,
  /telekino/, /quiniela/nocturna/, /quiniela/tucuman/. Новый гайд /quiniela/online/ («quiniela online» 97k). Сцены на /quiniela/chaco/,
  /corrientes/, /misiones/ из готовых. 85 стр., выложено (раздел «jugadadeldia (04.11) — телефон: инструмент первым…»).
- 04.11 — jugadadeldia: результаты из новых лент — 5 страниц кинелы провинций (/quiniela/tucuman/, /san-juan/, /chaco/, /corrientes/,
  /misiones/ + Misionera Plus), результаты на /quini-6/, /brinco/ (с «pendiente», когда CAS отстаёт), /loto-plus/ (выплаты), /telekino/;
  блоки провинций на /quiniela/ и турно-страницах; часы Tucumán с цитатой (раздел «jugadadeldia (04.11) — результаты провинций и лото»).
- 04.11 — jugadadeldia аудит (`docs/AUDIT-JUGADADELDIA-2026-11-04.md`): +5 страниц турно (/quiniela/nocturna/, /matutina/, /vespertina/,
  /la-primera/, /la-previa/), Quini 6 «50 %» исправлено (4.683.410 разных / 6.492.584 тиражей), 7 других правок чисел/UI, карточки «¿Ya salió?»,
  Quiniela Plus берёт последнюю Nocturna PBA из ленты, title по интенту; 79 стр. выложено. **Не синхронизировано на сервер:** кэш PBA «вчера» 3 ч
  в `tools/feeds/jugadadeldia/quiniela.mjs` — `feeds-server.sh jugadadeldia sync` после того, как чужой WIP `provincias*.mjs` будет закоммичен.
- 04.11 — casaslegales — «cómo ingresar»: /operador/betsson|bet365|betano/ingresar (ключи входа ≈ 73k), тонкие обзоры без пустых разделов
  («Lo que no pudimos ver» + визит из AR), данные Casinos del Río / La Neuquina исправлены (поля роняли сборку) — раздел «casaslegales (04.11) — cómo ingresar».
- 04.11 — casaslegales — гайды: /guia/apuestas-deportivas, /guia/glosario, paso a paso на cuotas/combinada, «Otras calculadoras», title по Ahrefs.
- 04.11 — casaslegales — обзорник: «Ir al sitio oficial» по провинциям (гейт-allowlist), обзоры Betsson и Betano, /operador/betsson/casino,
  title/H1 операторов по интенту (раздел «casaslegales (04.11) — обзорник» ниже).
- 03.11 — QA трёх сайтов: 18 находок P1/P2 исправлено и выложено, P3 и вопрос о сцене на телефоне — `docs/QA-2026-11-03.md`; скрипты `tools/qa/`.
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

## jugadadeldia (04.11) — телефон: инструмент первым, FAQ, гайд «quiniela online», сцены провинций (85 страниц, выложено)
- **Порядок на телефоне** (владелец 04.11, DECISIONS «ответы по аудиту»): список `LEAD` в `pages/parts.mjs` (результаты: /quiniela/, турно,
  провинции, лотереи; инструменты: калькуляторы, контроль, тренажёры, /truco/, /generala/, /chinchon/, /escoba-de-15/, /burako/…). На
  этих страницах `hero()` делит текст на `.jg-ht` (кикер + H1) и `.jg-hl` (лид + кнопки), `<main>` получает `jg-top`; при ≤ 620 px
  `css/jg.css` делает из main одну колонку (`display: contents` у героя и первого `.jg-mn`, `order`): H1 → первый блок страницы (+ живой
  вывод `[aria-live]` сразу за ним, + блоки с классом `jg-f1`) → лид с кнопками → сцена → остальное. ПК без изменений. Сцена на этих
  страницах `loading=lazy` (на телефоне она ниже сгиба). Страницы-столы (/truco/jugar/ и др.) и так начинаются со стола. Замер 375 px
  (живой сайт): результаты/инструмент с 188–217 px, сцена на 1350–1650 px; горизонтальной прокрутки нет.
- **FAQ** (аудит §5): `faq()`/`faqLd()` в `parts.mjs` — 4–5 вопросов, ответы только из уже процитированных фактов и чисел движка, цитаты
  под вопросами (`data-nosnippet` только у цитат), FAQPage в ld: /quini-6/, /loto-plus/, /telekino/, /quiniela/nocturna/ (час LOTBA,
  суббота, Quiniela Plus, Nocturno Tucumán), /quiniela/tucuman/ (часы Caja Popular). Дни тиражей Quini 6 не писали (нет цитаты).
- **/quiniela/online/** («quiniela online» 97k, план обновлён): title «Quiniela online: ¿se puede jugar? Lo legal en tu provincia».
  Что говорит каждый орган, с цитатой: LOTBA (регламент ст. 8, 8.2, 21.b — канал en línea с регистрацией; сайт «agencias … y online»),
  Río Negro (La Rionegrina Online с Quiniela Tradicional), PBA (7 лицензий, .bet.ar; регламент кинелы — ticket-recibo агентства, своей
  кинелы онлайн в документах нет), Córdoba, Santa Fe, Mendoza, La Rioja (списки), Neuquén (кинела — в агентствах; что такое ilegal).
  Как проверить сайт, денунсии (Córdoba форма, Río Negro, Neuquén), 18+, «la cuenta es la misma» (1 en 100, $ 70 из $ 100 — движок),
  помощь, FAQ. Без названий операторов и ссылок на них (только сайты лотерей/регуляторов). Источники — `data/sources/lottery/online.json`
  (копии страниц из `registries/_docs`, байт в байт, maxAgeDays 100 → перепроверить до 11.02.2027) + 5 фактов `lotba.json`, 1 `pba.json`.
  Новых страниц из сети не качали. Ссылок на casaslegales нет.
- **Сцены провинций** (без новых картинок): готовые принятые сцены недостроенных страниц перенесены — bolillero (/tombola/santiaguena/) →
  /quiniela/chaco/, тетрадь (/quiniela/significado-de-los-numeros/) → /quiniela/corrientes/, мешочек (/tombola/jujena/) → /quiniela/misiones/
  (в `data/art/jugadadeldia/scenes.json` у старых строк `status: moved`, alt — в `scenes.mjs`). **Когда эти три страницы будут строиться — им
  нужны новые сцены.** Без сцены: /quiniela/santa-fe/, /entre-rios/, турно-страницы (сцена Catamarca с орехами — региональная, не ставили).

## jugadadeldia (04.11) — труко 2 на 2 на /truco/jugar/ (аудит §6.7)
- Переключатель «De a 2 / De a 4» (запоминается, `jg-truco-modo`); у каждого режима своя сохранённая партия (`jg-truco-v1`, `jg-truco4-v1`).
  2 на 2: вы + компаньон-бот против двух ботов (движок `game4.mjs`/`bots4.mjs`, уровень общий), наборы `parejas-30-sin-flor` (отвечает pie)
  и `parejas-15-sin-flor` (отвечает следующий). Места: компаньон сверху, соперники по бокам (против часовой: после вас — правый),
  значки mano/pie/al mazo, подсветка хода, реплики над местами («Tengo 28» / «Son buenas» при querido), лента последних событий,
  крест текущей базы (завершённая база видна до первой карты следующей), итог руки с тантос всех и картами. Панель señas — только правдивые
  (`legalSignals`), видит только компаньон, бот-компаньон их учитывает. Клавиши 1–3, Q/N/T/E, Enter; звук выключен по умолчанию.
- Новый блок «Cómo se juega de a cuatro» (15 цитат `4p-*`), title «Truco online gratis contra la compu: de a 2 o de a 4», описание и
  плитки (/truco/, /juegos-de-cartas/, truco2) обновлены. 1 на 1: те же правила; исправлено — карты на столе больше не пропадают, пока
  думает компьютер (анимация только у новых карт), в итоге руки — карты соперника открыто, «te fuiste al mazo / no quisiste».
- Проверка Playwright (скрипты в scratchpad сессии): 2 на 2 — 30 рук на 375 px + 8 рук на 1280 (dificil), 1 на 1 — 12 + 8 рук, случайные
  ходы/канто/señas, переключение режимов и перезагрузка: 0 ошибок консоли, 0 незаконных состояний, без горизонтальной прокрутки.
- Не сделано: flor 2 на 2 (в движке нет — свои правила для четырёх рук); señas от ботов (движок: боты не сигналят).

## jugadadeldia (04.11) — результаты провинций и лото: 84 страницы
- **Новые страницы** (`pages/provincias.mjs`, клиент — режимы `pv`/`pvweek`/`pvarch`/`pvfreq` в `client/extractos.js`, лента `provincias`):
  /quiniela/tucuman/ (главный ключ 546k: «último sorteo y los cinco de hoy» — чипы турно дня, крупный экстракт, «¿salió mi número?», дни,
  архив по дате, частоты 00–99 с χ² от 30 тиражей, часы), /quiniela/san-juan/, /quiniela/chaco/, /quiniela/corrientes/ (копия Lotería
  Chaqueña), /quiniela/misiones/ (+ блок Misionera Plus). Свой порядок блоков и вступления у каждой; бейдж «1 fuente» (Tucumán, San Juan) или
  «verificada» (`c` > 0: страница Chaco/Misiones совпала с нашими LOTBA/PBA). «Sin datos al hh:mm» — при возрасте ленты > `maxAgeHours`.
  Сцены tucuman и san-juan поставлены (alt в `data/art/scenes.mjs`), у Chaco/Corrientes/Misiones сцен нет.
- **Часы Tucumán — с цитатой:** `data/sources/lottery/cajapopular.json` — копия `api/tipo-sorteo/` (JSON, sha256, 6 фактов: 11:30, 14:30,
  17:30, 19:30, 22:00 и второй Nocturno 20:00), скачана с закреплённым промежуточным Sectigo DV R36 (проверка TLS не отключалась).
  Часы других провинций не показываем (в ленте они — сетка LOTBA, не цитата). Тест `lottery-sources` — дата 04.11.
- **Лото** (`live()` в `pages/sorteos.mjs`, `lot()` в `client/sorteo.js`, `css/loterias.css`, лента `loterias`): последний тираж по
  модальностям, выбор из истории (до 30), бейдж «2 fuentes» (LOTBA/telekino.com.ar + CAS) или «1 fuente: copia de la CAS»; Loto Plus —
  ганадоры и премии как у LOTBA («vacante»), pozo estimado; `behind > 0` → «Pendiente de publicación oficial. La copia oficial de San Juan
  todavía no publicó el sorteo del …» + ссылка на экстракт Lotería de Santa Fe (`index.php/resultados/quini-6|brinco?view=resultados`).
  Контроль ниже заполняется числами показанного тиража (если посетитель сам не ввёл), выбор другого тиража — перезаполняет.
- **Хабы:** /quiniela/ — блок «Más provincias» (карточки с cabezas последнего дня), плитки провинций, меню «Quiniela» (+5), главная (+2 плитки),
  турно-страницы — «La Nocturna/Matutina… en otras provincias» (своя дата и час, если лотерея его публикует), /de-donde-salen-los-datos/ —
  таблица «De dónde copiamos los sorteos». Title/description по интенту: /quiniela/, 5 провинций, /quini-6/, /loto-plus/, /telekino/, /brinco/
  (план синхронизирован, у провинций `live` 04.11, у Tucumán `blocked` → `unblocked`).
- **Не сделано:** /quini-6/controlar/ и /telekino/controlar/ не берут тираж из ленты (только основные страницы); Tómbola tucumana — нет
  источника; xlsx Lotería Correntina как вторая копия — не разобран; /quiniela/extractos/ и /numeros-que-mas-salen/ — только LOTBA/PBA
  (у провинций свой архив и частоты на их страницах). Архив провинций сейчас 2–3 дня, растёт (лента догружает по 1 дню до 21 дня назад).

## jugadadeldia (04.11) — аудит: 79 страниц, турно, правки чисел
- Отчёт — `docs/AUDIT-JUGADADELDIA-2026-11-04.md` (ключи, интент/title топ-40, ошибки в числах, UX, blackjack.cab, что расширить).
- Новое: страницы турно (`pages/extractos.mjs` `turnPages`, режим `turno` в `client/extractos.js`; час — из программы LOTBA `program()`),
  карточки результатов на лотереях (`results()` в `pages/sorteos.mjs`), автоподстановка Nocturna PBA в /quiniela-plus/ (`D.fill` в `client/sorteo.js`).
- Деньги: `money()`/`pesos()` — целые без копеек, иначе 2 знака. Ключи турно в плане перенесены с /quiniela/horarios/ на турно-страницы.
- Открыто: синк ленты (выше в журнале); «2 fuentes» за 27–31.10 нет (архив только LOTBA). Сцена на телефоне — после инструмента (сделано 04.11, решение владельца).

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

## pingalto (04.11) — академия: «Cómo empezar» на 5 хабах и /esports/glosario
- /lol, /valorant, /rl, /clash, /brawl открываются блоком «Cómo empezar desde Argentina» (`pages/academy.mjs`): цена, платформы, сервер и
  пол пинга, требования из Riot support / Steam / Google Play AR / App Store AR с цитатами, 5 шагов со ссылками на инструменты.
- Новая `/esports/glosario` (41 термин, поиск и фильтр). Итог — в `docs/AUDIT-PINGALTO-2026-11-04.md` «Сделано 04.11 (академия)».
- Free Fire Advance не сделан: официальный сайт отдаёт 403 → нужна копия владельца. **git push не проходит** (GitHub: Permission denied
  (publickey) для `~/.ssh/jpc_ed25519`, 04.11 ~09:50 UTC) — коммиты локально, выкладка идёт из HEAD; проверить ключ на GitHub.

## pingalto (04.11) — /dota2 стала страницей игры; сцены r7 (на сайте 37 сцен)
- **/dota2** (`pages/dota2.mjs`, клиент `d2req.js`): «Dota 2 desde Argentina: requisitos, servidores y ranking» (56) — факты Steam AR
  (appdetails 570: gratis, Windows/Mac/Linux, 60 GB, español de Hispanoamérica), «¿Te corre Dota 2?» против минимума Valve + время
  загрузки, «qué es» и «cómo empezar» (цитаты Steam: более ста героев, все бесплатны, начинать с ботов), точки сети Valve для Dota 2
  (GetSDRConfig 570: Буэнос-Айрес → Сантьяго 20, Сан-Паулу 27, Лима 49 мс + физический пол из /kit/ping), наш Elo — раздел `#ranking`,
  агенда, TI, «para padres» (цитата Steam о содержании). OpenDota не используется. +2 копии источников, +5 цитат. План и PAGES обновлены.
  Ссылки «ranking de Dota 2» ведут на `/dota2#ranking`, плитка главной — «¿Te corre Dota 2?».
- **Сцены r7** (проверены мной в полном размере, `review` + `checked`, сводка `data/img-review/contact-pingalto-scenes-r7.jpg`):
  /ff/max (стоя, телефон горизонтально, игрушечная стенка из голубых блоков; 1-я попытка — присед с коленями врозь, отклонена),
  /clash/cartas (карта и зелье), /esports/agenda (табурет, бумажный планер; псевдотекст на планере закрашен цветом бумаги),
  /dota2/ti (r6, щит; вторая попытка удалась). **/fortnite** — та же принятая r4 (кирка-эмоут), что и на /fortnite/nube (опция `slug`).
  r6 отмечены accepted (владелец 04.11). **Отклонены** (`data/img-review/*-try1/2.png`): /fortnite/nube r7 и /brawl/brawlers (сидя
  по-турецки — вид под юбку), /valorant/mapas/split (куртка не на руках), /valorant/mapas/ascent (вид под юбку). Без сцены пока:
  /brawl/brawlers, /brawl/eventos, /clash/meta, /lol/msi, /esports/latam, /valorant/mapas/ascent и /split — следующим раундом брать
  только стоячие позы (сидя в мини модель часто ломает скромность).

## pingalto (04.11) — аудит: 49 страниц + 404, отчёт `docs/AUDIT-PINGALTO-2026-11-04.md`
- **Новое/переделано (выложено):** /cs2 — хаб игры (требования Steam AR + «¿Te corre CS2?», время загрузки, пинги Valve SDR, CS 1.6
  в Steam, рейтинг VRS — раздел `#ranking`); **/fortnite** (как играть из Аргентины на каждом устройстве) и **/ff/max** (FF или MAX:
  Garena, Play AR/US, App Store AR/US) — новые; /ff дополнен; /eafc — FC 27 в Steam. Title: /kit/dpi, /kit/sensibilidad,
  /brawl/brawlers, /cs2/mira. Ключи: покрыто title 58 → 66 ключей (370k → 561k показов). Ошибок в числах не найдено (сверка в отчёте).
- **Код:** `sites/pingalto/content/stores.mjs` (Steam appdetails, iTunes lookup, Google Play — проверка формы), `pages/games2.mjs`,
  клиенты `req.js`, `fnhub.js`, `ffmax.js`. +13 копий источников (fetched 04.11, срок 180 дн.).
- **Ждёт владельца:** ключ fortnite-api.com (трекер 53k; вход через Discord — сам), сцены для /fortnite и /ff/max.
- **Дальше (отчёт §6):** хаб Dota 2 как у CS2, FF Advance, «cómo empezar» + глоссарий по образцу blackjack.cab, /cs16.

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

## casaslegales (04.11) — cómo ingresar и тонкие обзоры (решение владельца 04.11 «можешь делать»), выложено
- **`/operador/<бренд>/ingresar`** для Betsson, bet365, Betano (`pages/opingresar.mjs`, `kind: login` в плане, ключи входа перенесены): кнопки
  «Ir al sitio oficial (<провинция>)» по каждому списку; SVG «адрес по частям» (строки — адреса реестров); карточки провинций (у Betsson CABA:
  список LOTBA называет betsson.com.ar → страница выбора провинции → caba.betsson.bet.ar, подвал цитирует ту же Disp. 1166/2021 — сверяет код);
  «почему у каждой провинции свой сайт» — гео-условия из копий обзора + страницы выбора провинции + цитаты регуляторов (у bet365 гео-условия
  в копиях нет — так и написано, цитируются две лицензии подвала); как не попасть на копию; приложение (магазин — только ссылка со страницы
  оператора); забытый пароль = восстановление на официальном сайте; FAQPage. Фразы вне фактов (`copyText`) ищутся в копии — нет фразы → сборка падает.
  Раздел `#ingresar` обзора у этих трёх — короткий со ссылкой сюда; ссылка и со страниц оператор × провинция. Новый бренд — добавить в `ING`.
- **Тонкие обзоры** (`pages/operador.mjs`, `pages/review.mjs`): показываются только разделы с данными; остальные — блок `#sin-ver` «Lo que no
  pudimos ver» (чего не нашли + что посетили из AR: копии, статусы хостов из `status`, всплывающие окна); Resumen — только плитки с данными и
  строка «Sin dato: …»; описание 115–155 подбирается; цитаты-аннотации сборщика («[...]», URL) не показываются как цитаты; ссылка «Retiros» на
  внешний формуляр (PlayBet → script.google.com) — фактом. Новые поля `site.about`, `site.games` (раздел «Qué es el sitio»). У марок без фактов
  (Stake, Arbet, Mitesoro, La Rionegrina) — блок «Lo que vimos desde Argentina». Подписи статусов — `VISIT` в `pages/operador.mjs`.
- **Данные:** `casinosdelrio.json` (поле `note` → `site.about` с цитатой), `laneuquina.json` (`product` → `site.games`) — старые имена полей роняли
  `verify-reviews` и сборку на HEAD.
- **Дальше:** страницы оператор × провинция (например `/operador/betsson/cordoba`) ещё пишут «No pudimos ver su sitio» по визиту 03.11 из-за
  границы, хотя 04.11 из AR копия есть — добавить строку из обзора; brand-login остальных марок (bplay 4.5k, playcet, casino magic, sportsbet) — на `#ingresar` обзоров.

## casaslegales (04.11) — гайды «как»: `/guia/apuestas-deportivas`, `/guia/glosario`, paso a paso калькуляторов, выложено
- `pages/guias5.mjs`: гайд по ставкам (boleto, шаги, рынки, en vivo, cash out, маржа, где легально с кнопками «Ir» 8 списков и 4
  платформ, перед ставкой) и глоссарий (32 термина); `otherCalcs()` — блок «Otras calculadoras» на 4 калькуляторах. Движок:
  `single`, `cashOut` в `engine/odds.mjs` + `engine/test/odds-guide.test.mjs`. Title по Ahrefs (1 260 ед.): hándicap → «asiático»,
  cuotas → «Calculadora de cuotas», combinada → «qué son». Ключи плана перенесены (/operadores и главная → гайд). Отчёт — §«Сделано
  04.11 (гайды)» в `docs/AUDIT-CASASLEGALES-2026-11-04.md`.

## casaslegales (04.11) — аудит страниц вне `/operador/*`: отчёт `docs/AUDIT-CASASLEGALES-2026-11-04.md`, выложено
- Калькуляторы: 76 чисел сверены независимым пересчётом — арифметика верна; исправлен смысл: «маржа» ≠ «сколько оставляет казино»
  (маржа 6,65 % / казино 6,23 %), комбинированная выровнена с калькулятором маржи; «paso a paso» на марже; калькулятор гандикапа
  (−3…+3, шаг 0,25) + отличие от европейского. 12 провинций без списка: «¿Es legal…?» в title и H1; блоки «¿<марка> es legal en
  <провинция>?» (`ask` в `provcopy.mjs`, вхождения считает код по копиям), на PBA — «¿Buscás Casino Buenos Aires Online?».
  `/licencias` — title «Casinos y apuestas online legales…», кнопка «Ir» у 47 адресов; главная — «Ir» в блоке «misma marca».
- Дальше (§6 отчёта): хаб casino online (214k) на `/casinos-online-legales`, `/guia/apuestas-deportivas`, разделы ingresar/app в
  обзорах, ссылки на платформы провинций (расширить гейт), перенос ключей в плане (betsson caba, casino magic, головы брендов).

## casaslegales (04.11) — обзорник: официальные ссылки, обзоры операторов, страницы казино (решение владельца 04.11)
- **Живое:** /operador/betsson и /operador/betano — обзоры; /operador/betsson/casino — первая страница казино; кнопки «Ir al sitio oficial
  (<провинция>)» на страницах операторов, оператор × провинция, списках /provincia/* и в результате /verificador (JS, при совпадении).
- **Ссылки** (`content/official.mjs`, `officialLink(s)` в `pages/parts.mjs`): адрес берётся из `evidence.html` записи реестра (хост как в
  списке регулятора, https, путь «/», без query); www.arbet.bet.ar не резолвится (DNS 04.11) → вместо кнопки строка (`DEAD`).
  **Гейт** (`tools/check-dist.mjs`, `SITE.gate.officialLinks`): ссылка на хост оператора — только точный хост из проверенных списков
  (`operator`), только `rel="nofollow noopener"`, только голый адрес (`oplink`), ни одной на странице помощи (`helplink`); selftest — 4 порчи.
  На jugadadeldia/pingalto allowlist пуст — любая ссылка на оператора по-прежнему ошибка.
- **Данные обзоров:** `data/sources/reviews/<brand>.json` (+ `_docs/*.txt`) собирает другой агент через Chrome владельца (формат —
  `docs/REVIEWS-DATA.md`). Проверка `node tools/verify-reviews.mjs [--selftest]` (в `npm test` и в сборке): sha256 копии, цитата дословно
  (не через «[...]»), URL/дата факта = копии, хост факта = хост копии или его родитель, свежесть ≤ 100 дн.; факт отсутствия (`quote: null`,
  `published:false`) допустим. В сборке дополнительно: элементы списков (оплаты, спорт, провайдеры, категории), команды и коэффициенты
  ищутся в той же копии — если значение пересказано, показывается только цитата (без чипов и без числа в Resumen).
- **Шаблон обзора** (`pages/review.mjs`, `pages/operador.mjs`): Resumen (списки N из 8, спорт, live, казино, app, способы депозита,
  кратчайший срок вывода, RG-инструменты, **маржа 1X2 = engine/odds.mjs** по 5 матчам Liga Profesional с датой) · Deportes y mercados ·
  Casino · App · Pagos y retiros · Cuenta y verificación · Atención al cliente · Juego responsable · Licencias (+ «La licencia según el
  pie de cada sitio») · Capturas (свои скриншоты из AR). Нет данных — «Sin dato: …». Подписи полей — таблица `F` в `pages/review.mjs`:
  **поле без подписи не показывается** (сборка пишет «field X has no label»), добавить подпись при новых полях.
- **Title/H1/description** операторов — `opCopy` (`pages/operador.mjs`) по интенту: с данными обзора «<Марка> Argentina: reseña, licencias
  y sitio oficial», без — «<Марка> Argentina: licencias y sitio oficial por provincia» / «<Марка>: licencia en <провинция> y sitio oficial».
  «reseña» без данных обзора роняет сборку. План (`data/plan`) и `docs/PAGES-CASASLEGALES.md` синхронизированы (раздел «Обзорник»).
- **Казино** `/operador/<slug>/casino` (`pages/opcasino.mjs`): строится, когда у бренда ≥ 2 разных casino-факта; где лицензия называет казино
  (Neuquén, Santa Fe — из `casinoLists`) или «juego online» без разделения (цитата списка); RG; официальные ссылки. Betano — лобби казино
  пустое при сборе (1 факт) → страницы нет.
- **Дополнено 04.11 (по аудиту):** «Ir» у провинциальных платформ, которые регулятор сам ссылает (Entre Ríos, Misiones, Chaco, Corrientes —
  allowlist гейта расширен хостами из `data/sources/provinces`), колонка «Sitio oficial» в таблице /verificador; в обзорах разделы
  `#ingresar` (адрес по каждому списку, кнопки, как не попасть на копию; страниц входа не ссылаем) и `#app` (ссылки на App Store/Google Play
  только из проверенной цитаты страницы оператора; Android-APK с сайта оператора — текстом). `/casinos-online-legales` — хаб «casino online»
  (title «Casino online en Argentina: sitios legales por provincia»; рулетка 1/37 и 2/38 и RTP считает код; live vs слоты; «Ir» во всех
  списках; казино брендов). Ключи в плане перенесены (betsson caba → /operador/betsson/caba, casino magic online → /operador/casino-magic-online,
  «<бренд> casino» → /operador/<бренд>/casino, casino online argentina → хаб). Живые обзоры: Betsson, Betano, bet365, bplay, Codere,
  BetWarrior (только портал), Jugadón, Sportsbet, Casino BA Online, Super7, Casino Club, Playcet; казино: Betsson, bet365, bplay.
  Stake — проверка Cloudflare, данных нет (страница без «reseña»).
- **Параллельные агенты в одном дереве:** коммитить только `git commit -- <пути>` (не `git add` заранее — чужой коммит заберёт индекс);
  проверять сборку на HEAD + своих файлах (как deploy: `git archive HEAD` во временную папку), т.к. незакоммиченные данные сборщика
  могут ронять локальную сборку.
- **Новый бренд, когда его данные закоммичены:** `node tools/review-shots.mjs <brand>` (PNG из `data/shots/<brand>/` → webp в
  `sites/casaslegales/static/shots/review-<brand>-<view>.webp`, коммитить) → `node tools/render.mjs casaslegales` (посмотреть «no label»)
  → проверить страницу на 375/1280 → коммит → `bash tools/deploy.sh casaslegales`. Title/H1 переключатся на «reseña» сами.

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
