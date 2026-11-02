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

## Доступы (состояние 02.11)
| Что | Состояние | Кто |
|---|---|---|
| GitHub `git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git` | **push работает** (проверено 02.11, `main` отслеживает `origin/main`) | — |
| Cloudflare | DNS трёх доменов уже в Cloudflare (прокси на 187.7.26.95); **токен из `.env` видит только gambeteo.com** (перепроверено 02.11 вечером) — добавить jugadadeldia.com, pingalto.com, casaslegales.com в Zone Resources того же токена | владелец |
| Сервер | **работает (02.11, 21:57 UTC):** владелец запустил `bash tools/server-setup.sh all install` — блоки `# >>> jugadadeldia|pingalto|casaslegales`, бэкапы `Caddyfile.bak-<сайт>-20261102-*`, соседи 200; https трёх доменов — 200 (заглушка noindex), www → 301. Дальше правки блока — `update` | — |

Открытый ключ GitHub (не секрет): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPZ/k/crurewdEaZLh2EBMmmKXlN9ZWzBm/rdNlFv2a9 jugadadeldia-pingalto-casaslegales deploy key`

## Следующее — первая задача нового чата (владелец 02.11: «сразу начал подготавливать список страниц под все три сайта, шаблон,
## девушки (2 штуки кроме третьего сайта), апи который необходимы для автообновления чтобы перепроверять сайты только раз в пол года»)
1. `git push -u origin main` (как только ключ добавлен); проверить токен Cloudflare (`GET /zones`, только имена).
2. **Список страниц для трёх сайтов** (по `docs/research/KEYWORDS-2026-11-02.md`, «как можно больше страниц, даже 0–10 частотки», но у каждой —
   свой инструмент/визуал) → одной страницей-артефактом владельцу (с телефона). Агентами параллельно, по сайту на агента. Учесть:
   - **jugadadeldia:** топ — кинела по провинциям (Tucumán 546k/0, Catamarca, San Juan, Jujuy — KD 0), quini 6, telekino, loto plus,
     «controlar quini 6» 65k/2, tómbolas (santiagueña 151k, jujeña 61k/0); труко (valores, señas, anotador, reglas — KD 0), burako, chinchón,
     generala, escoba, «tirador de dados» 5,4k/0. **Ловушка:** «quiniela enzo / confiable / online», «lotería mundial(es)», «notitimba»,
     «ruta 1000» — бренды сторонних сайтов и, вероятно, нелегальной онлайн-кинелы: не продвигать; на casaslegales возможны страницы
     «¿Es legal …?» с цитатами регуляторов.
   - **pingalto:** спрос на соревновательный киберспорт в AR мал («dota 2» 2,3k, «esports» 1,3k; «dota» — ещё и автобусная компания DOTA);
     основной спрос — **игровые утилиты**: fortnite tracker 53k/5, valorant tracker 12k, тир-листы, ранги (rangos valorant/lol — KD 0),
     прицелы/«miras», чувствительность (Free Fire 6,3k/0), коды, карты (ascent, split), Free Fire (free fire max 58k/9), Brawl Stars 44k,
     Clash Royale 27k, Rocket League 17k/11, counter strike 1.6. Строить «математика и инструменты игр» + киберспорт (сетки, шансы серий).
     **Не брать**: взрослый мусор (rule 34, xxx), покупку/пополнение (diamantes, recarga — коммерция), кейсы и скины.
   - **casaslegales:** бренды огромные и навигационные (betsson 1,9 млн, betano 1,33 млн, bet365 1 млн, bplay 109k/**0**, «betsson pba»
     149k, «betano pba» 24k/18, «bet365 argentina» 13k/25); страницы: обзор оператора + «¿Es legal en mi provincia?», реестр лицензий по
     провинциям, «casinos online legales», методика; навигационный интент (iniciar sesión) — не цель.
3. **Шаблоны:** по 10 живых HTML-макетов на каждый сайт (три разных мира, не похожие на RinkMath и gambeteo) → выбор владельца.
4. **Девушки (2):** jugadadeldia — образ по теме (кинела/карты; внешность — спросить), pingalto — «альт» ~20 лет (цветные волосы,
   пирсинг, тёмная одежда, явно взрослая, не откровенно); по 10 вариантов → выбор → база → сцены. casaslegales — без людей.
5. **API для автообновления «раз в полгода»** — список источников с условиями использования (как ресёрч NBA в RinkMath): выписки кинелы по
   провинциям (PBA — JSON без ключа, проверено), Quini 6/Brinco (Santa Fe — гео-блок, нужен Chrome владельца), Loto Plus, Telekino, тómbolas;
   киберспорт и игры (OpenDota — бесплатно; HLTV запрещает сбор; Liquipedia API, PandaScore, Riot API, Fortnite/Valorant трекеры — условия);
   реестры лицензий провинций для casaslegales (LOTBA, IPLyC и др.). Ленты — на сервере по образцу gambeteo (без минут GitHub Actions).
6. Затем по PLAYBOOK §17.1: каркас (техника gambeteo/RinkMath, облик — новый у каждого), движки с тестами, источники с цитатами,
   инструменты, тексты (Claude API, es-AR), сцены, QA, выкладка (+ `.claude/settings.json` с правилом деплоя, как в canadabetting).

## Вопросы владельцу (одним сообщением, с вариантом по умолчанию) — PLAYBOOK §2
Авторы (по одному на сайт?), индекс (сразу целиком?), внешность девушки jugadadeldia, приоритетные операторы для casaslegales.

## Журнал
- 02.11 ночь — готово: планы трёх сайтов (`data/plan/*.json`, `docs/PAGES-*.md`: 111 / 86 / 102 стр.), ресёрч API
  (`docs/research/APIS-2026-11-02.md`), девушки 2×10 (`data/img-review/contact-*-girls.jpg`, png под игнором — только локально), 10 макетов
  jugadadeldia; pingalto 5/10, casaslegales 4/10 — агенты дорисовывают. Сводка владельцу: https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS
  (сборка `node docs/owner/build-overview.mjs`, вопросы — `docs/owner/questions.json`). Ждём выбор дизайнов/девушек и ответы.
- 02.11 вечер — новый чат начал работу: push проверен; волна 1 (6 агентов): планы страниц ×3 (`data/plan/<сайт>.json`,
  `docs/PAGES-<САЙТ>.md`), ресёрч API (`docs/research/APIS-2026-11-02.md`), девушки 2×10 (`data/art/<сайт>/girl-jobs.json`,
  `data/img-review/`), 10 макетов jugadadeldia (`docs/design/jugadadeldia/`). Дальше — макеты pingalto и casaslegales.
- 02.11 — стартовый набор от сессии RinkMath: правила (CLAUDE.md, PLAYBOOK §1 — три продукта), решения с цитатами, ловушки (gambeteo +
  RinkMath), все ключи API, SSH-ключ GitHub, ключи Ahrefs AR (5 запросов, ≈ 19 300 ед.) и их сводка, пакет помощи AR.
