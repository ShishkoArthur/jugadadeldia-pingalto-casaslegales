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

## Доступы (состояние 02.11)
| Что | Состояние | Кто |
|---|---|---|
| GitHub `git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git` | **push работает** (проверено 02.11, `main` отслеживает `origin/main`) | — |
| Cloudflare | DNS трёх доменов уже в Cloudflare (прокси на 187.7.26.95); **токен из `.env` видит только gambeteo.com** (перепроверено 02.11 вечером) — добавить jugadadeldia.com, pingalto.com, casaslegales.com в Zone Resources того же токена | владелец |
| Сервер | **работает (02.11, 21:57 UTC):** владелец запустил `bash tools/server-setup.sh all install` — блоки `# >>> jugadadeldia|pingalto|casaslegales`, бэкапы `Caddyfile.bak-<сайт>-20261102-*`, соседи 200; https трёх доменов — 200 (заглушка noindex), www → 301. Дальше правки блока — `update` | — |

Открытый ключ GitHub (не секрет): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPZ/k/crurewdEaZLh2EBMmmKXlN9ZWzBm/rdNlFv2a9 jugadadeldia-pingalto-casaslegales deploy key`

## Состояние и следующее (03.11)
- **Выбор владельца:** pingalto — дизайн r2 «02 Holo pastel»; casaslegales — r2 «02 Relieve». **Ждём:** jugadadeldia — дизайн из 20
  (`docs/design/jugadadeldia/r3/`) и девушка из 10 (`contact-jdd-girls-r3.jpg`); pingalto — девушка из 10 (`contact-pa-girls-r3.jpg`).
- Сводка владельцу (планы с title/H1/description/AR, макеты, девушки, вопросы): https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS —
  сборка `node docs/owner/build-overview.mjs`, вопросы `docs/owner/questions.json`, публиковать тем же путём `docs/owner/overview.html`.
- **Готово 03.11:** casaslegales волна 2 (29 страниц живые, раздел «casaslegales (03.11) — волна 2» ниже); pingalto каркас + P1-инструменты без ключей. **Готово:** движок лотерей (`engine/lottery`, 139 цитат, пробелы — `docs/ENGINE-LOTTERY.md`) и
  движок труко 1×1 + боты facil/normal/dificil (`engine/truco`, `engine/cards`, `docs/ENGINE-TRUCO.md`; 2×2 — позже).
- **Потом:** оформление jugadadeldia после выбора; сцены девушек; тексты через Claude API; автообновление (ленты на сервере, Telegram-бот —
  ждём токен); Santa Fe/Mendoza — файлы от владельца в `docs/reference/owner-saves/`; ключи PandaScore/Supercell — от владельца.
- Решения 03.11 (DECISIONS): индекс открыт весь, выкладка сразу, автор Denis Krazok только на jugadadeldia, игры против компьютера — да,
  pingalto без Roblox, будущая кнопка партнёрки — позже по слову владельца.

## Журнал
- 03.11 — pingalto волна 2 выложена: формат чисел es-AR во всех инструментах (+ гейт), /tier-list, /valorant/agentes, /cs2/mira,
  /ff/nombres, /ff/espacio-invisible, /fortnite/nube (раздел «pingalto» ниже).
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
- **Дальше:** девушка (выбор владельца) → сцены; хабы /valorant, /cs2, /ff, /fortnite, /esports; /esports/series (математика серий из
  RinkMath); ленты (OpenDota, VRS, PandaScore) — по слову владельца; Supercell-ключ → /brawl/brawlers, /clash/mazos.

## casaslegales (03.11) — волна 2 выложена (29 страниц + 404, индекс открыт)
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
- **Дальше:** Chrome владельца из AR — скриншоты bet365/BetWarrior/bplay/Codere/Betano (+ их JR/T&C → цитаты); P2: /operador/stake,
  super7, betfun, play-uzu; operator × provincia; /guia/mercado-pago (нужны оплаты ≥ 3 операторов); Mendoza/Santa Fe (файлы владельца).
