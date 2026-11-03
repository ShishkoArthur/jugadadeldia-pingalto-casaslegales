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
- Ключи в `.env` проверены 03.11: PandaScore (200), Supercell CR и BS (200 с сервера по IPv4, IP 187.7.26.95). Telegram-бот — ждём.

| Что | Состояние | Кто |
|---|---|---|
| GitHub `git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git` | **push работает** (проверено 02.11, `main` отслеживает `origin/main`) | — |
| Cloudflare | DNS трёх доменов уже в Cloudflare (прокси на 187.7.26.95); **токен из `.env` видит только gambeteo.com** (перепроверено 02.11 вечером) — добавить jugadadeldia.com, pingalto.com, casaslegales.com в Zone Resources того же токена | владелец |
| Сервер | **работает (02.11, 21:57 UTC):** владелец запустил `bash tools/server-setup.sh all install` — блоки `# >>> jugadadeldia|pingalto|casaslegales`, бэкапы `Caddyfile.bak-<сайт>-20261102-*`, соседи 200; https трёх доменов — 200 (заглушка noindex), www → 301. Дальше правки блока — `update` | — |

Открытый ключ GitHub (не секрет): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPZ/k/crurewdEaZLh2EBMmmKXlN9ZWzBm/rdNlFv2a9 jugadadeldia-pingalto-casaslegales deploy key`

## Состояние и следующее (03.11)
- **Выбор владельца:** pingalto — дизайн r2 «02 Holo pastel»; casaslegales — r2 «02 Relieve». jugadadeldia — r3 «06 Menú principal» (живой, волна 1) и девушка jdd-girl-r3-10 (сцены — следующий шаг); pingalto — девушка pa-girl-r3-09.
- Сводка владельцу (планы с title/H1/description/AR, макеты, девушки, вопросы): https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS —
  сборка `node docs/owner/build-overview.mjs`, вопросы `docs/owner/questions.json`, публиковать тем же путём `docs/owner/overview.html`.
- **Готово 03.11:** casaslegales волна 2 (29 страниц живые, раздел «casaslegales (03.11) — волна 2» ниже); pingalto каркас + P1-инструменты без ключей. **Готово:** движок лотерей (`engine/lottery`, 139 цитат, пробелы — `docs/ENGINE-LOTTERY.md`) и
  движок труко 1×1 и 2×2 + боты, generala (оптимальный бот), chinchón, escoba de 15 (`engine/*`, `docs/ENGINE-TRUCO.md`,
  `docs/ENGINE-GAMES.md`; 160 тестов). Страницы игр jugadadeldia — живые (волна 1).
- **Потом:** сцены девушек (jugadadeldia — вставить в `figure.jg-girl`); тексты через Claude API; автообновление (ленты на сервере, Telegram-бот —
  ждём токен); копии страниц от владельца: 03.11 пришли 14 (раздел «casaslegales (03.11) — копии и скриншоты владельца»); ещё нужны
  Córdoba juegos/online, Santa Fe /casinos/ и /juego-responsable-3/, Mendoza ipjyc.gob.ar/wp/ и автоисключение — `docs/reference/owner-saves/README.md`; ключи PandaScore/Supercell — от владельца.
- Решения 03.11 (DECISIONS): индекс открыт весь, выкладка сразу, автор Denis Krazok только на jugadadeldia, игры против компьютера — да,
  pingalto без Roblox, будущая кнопка партнёрки — позже по слову владельца.

## Журнал
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
- **Дальше:** девушка jdd-girl-r3-10 → заменить заглушку `figure.jg-girl[data-girl=<сцена>]` (2:3, есть на страницах кроме помощи и автора)
  сценами из `data/art/base/jugadadeldia/`; сцены на señas; ленты результатов (по слову владельца) → /quiniela/, провинции, Quini 6 hoy;
  P2 из плана; перепроверка программ LOTBA (ежемесячно, `maxAgeDays` 183) и пакета помощи до 09.02.2027.

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
  в `npm test`. Девушка — заглушка-карточка «ALT · GUÍA» (`pages/parts.mjs` girlCard; владелец не выбрал), автора нет («redacción»).
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
- **Дальше:** девушка pa-girl-r3-09 → сцены; хаб /fortnite; копия lolwiki от владельца; ленты (VRS по месяцу, PandaScore) — по слову
  владельца; Supercell-ключ → /brawl/brawlers, /clash/mazos; /esports/sistema-suizo (симулятор с посевом и таблицей пар Valve).

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
