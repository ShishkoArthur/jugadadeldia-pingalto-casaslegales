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
- **В работе (агенты 03.11):** casaslegales волна 2 (операторы со своими скриншотами, `/verificador`, проверки нелицензированных, гайды);
  pingalto каркас + P1-инструменты без ключей. **Готово:** движок лотерей (`engine/lottery`, 139 цитат, пробелы — `docs/ENGINE-LOTTERY.md`) и
  движок труко 1×1 + боты facil/normal/dificil (`engine/truco`, `engine/cards`, `docs/ENGINE-TRUCO.md`; 2×2 — позже).
- **Потом:** оформление jugadadeldia после выбора; сцены девушек; тексты через Claude API; автообновление (ленты на сервере, Telegram-бот —
  ждём токен); Santa Fe/Mendoza — файлы от владельца в `docs/reference/owner-saves/`; ключи PandaScore/Supercell — от владельца.
- Решения 03.11 (DECISIONS): индекс открыт весь, выкладка сразу, автор Denis Krazok только на jugadadeldia, игры против компьютера — да,
  pingalto без Roblox, будущая кнопка партнёрки — позже по слову владельца.

## Журнал
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
