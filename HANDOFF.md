# HANDOFF — jugadadeldia.com · pingalto.com · casaslegales.com (один репозиторий, три сайта)

Читать первым, затем `CLAUDE.md`, `PLAYBOOK.md`, `docs/DECISIONS.md` (решения владельца сверху — самые новые), `docs/TRAPS.md`.
Полная история работы (все разделы по дням, 02–05.11) — `docs/archive/HANDOFF-full-2026-11-05.md`. Переписка — `chat.md` (последние 100 сообщений).
Переезд на другое устройство — `docs/MIGRATION.md`. Обслуживание раз в полгода — `docs/MAINTENANCE.md`.

## 08.11.2026 — работаем на Windows (`C:\dev\jugadadeldia-pingalto-casaslegales`, Git Bash)
Переезд со старого сервера выполнен и проверен (`docs/MIGRATION.md` §6): ключи из `C:\dev\.ssh` подключены (GitHub и сервер отвечают),
`npm test` 273/273, гейты трёх сайтов зелёные, сборка здесь совпала с выложенной байт в байт. Перед `npm test` вручную — `set -a; . ./.env; set +a`
(нужен `PDFTOTEXT` = poppler). Ленты на сервере работают (08.11 13:49 UTC — health ok). Сайты не менялись, выкладки не было. Ленты трёх сайтов синхронизированы новым способом (без локального rsync) с `a100636`,
прогоны на сервере 08.11 14:30 UTC — exit=0 (в т.ч. PDF-ленты quiniela, precios, programa).

## Состояние на 05.11.2026 — всё готово и выложено, индекс открыт
| Сайт | Страниц (es + en) | Дизайн · персонаж · автор | Что обновляется само (сервер, cron в Docker) |
|---|---|---|---|
| **jugadadeldia.com** | 85 + 85 | r3 «06 Menú principal» · девушка jdd-girl-r3-10 · автор Denis Krazok | кинела каждые 15 мин (LOTBA+PBA сверка; Tucumán, San Juan, Chaco, Corrientes, Misiones), Loto Plus/Telekino (сверка с CAS), Quini 6/Brinco (CAS, с пометкой задержки), программа тиражей и цены LOTBA (раз в месяц + за 5 дней до конца) |
| **pingalto.com** | 51 + 51 | r2 «02 Holo pastel» · девушка pa-girl-r3-09 «в игре» · «редакция» без имени | матчи PandaScore, Clash Royale/Brawl Stars (Supercell, IPv4 187.7.26.95), рейтинг CS2 VRS; трекер Fortnite через прокси `pingalto-fnapi` (ключ fortnite-api.com) |
| **casaslegales.com** | 105 + 105 | r3 «01 Relieve alto» · без людей · «редакция» | раз в месяц перепроверка официальных списков лицензий (`listas`), сроки копий (`plazos`); изменение списка → Telegram, без автопубликации |

- **casaslegales — обзорник** (решение 04.11): обзоры 27 брендов (данные с публичных страниц через Chrome владельца с VPN, 04.11), казино брендов,
  хаб «casino online», страницы «cómo ingresar» (Betsson, bet365, Betano), кнопки «Ir al sitio oficial» только на домены из 8 проверенных
  списков (nofollow, гейт allowlist), реестр 24 юрисдикций, верификатор, гайды и калькуляторы.
- **jugadadeldia**: результаты по провинциям и турно, калькуляторы и симуляторы (движок `engine/lottery`), игры против компьютера (труко 1×1 и
  2×2, генерала, чинчон, эскоба), учебники правил для новичка (05.11), FAQ, гайд «quiniela online».
- **pingalto**: страницы игр (CS2, Dota 2, Fortnite, Valorant, LoL, Free Fire, RL, Clash, Brawl, EA FC), «Cómo empezar desde Argentina»,
  инструменты (чувствительность, DPI, пинг, прицел CS2, серии Bo1–Bo7, швейцарка), агенды и рейтинги, глоссарий, трекер Fortnite.
- **На всех трёх**: меню со всеми страницами (гейт `menu`), мгновенный поиск по содержимому (гейт `search`), английская версия `/en/`
  (hreflang, перевод через Claude API, `docs/I18N.md`), свои логотипы и фавиконы (`sites/<сайт>/logo.mjs`, `LOGO.pick`).
- `npm test` — 273/273 зелёный (05.11), гейты и selftest всех трёх сайтов зелёные.

## Команды
- `npm test` · `node tools/render.mjs <сайт>` · `node tools/check-dist.mjs <сайт> [--selftest]` · `bash tools/deploy.sh <сайт>` (выкладывает
  только закоммиченный HEAD; **один сайт — одна выкладка за раз**, TRAPS 05.11) · `node tools/serve.mjs <сайт>` (локально).
- Ленты: `bash tools/feeds-server.sh <сайт> install|secrets|sync|run|status` (sync — только HEAD). Прокси Fortnite: `bash tools/fnapi-server.sh
  status|logs|sync|restart|install|secrets`. Caddy: только наш блок `bash tools/server-setup.sh <сайт> update`.
- Перевод: `node tools/translate.mjs <сайт>` (Sonnet 5.5 переводит, Opus 5.5 проверяет выборку; бюджет — см. `data/i18n/*spend*`).
- Копия страницы владельца: `node tools/owner-copy.mjs <slug> <файл> --date <дата> [--by owner|owner-browser] [--write]`.
- Картинки: `node tools/gen-image.mjs <jobs.json>`; сцены — `data/art/scenes.mjs`, `data/art/publish-scenes.mjs` (правило размера — по голове,
  вырезка `data/art/cut.mjs`); стандарт девушек и сцен — DECISIONS 03.11 «сцены приняты», `docs/memory/girl-scenes-style.md`.

## Доступы (05.11)
- Ключи — только в `.env` (под игнором; значения нигде не повторять): Claude API, Nano Banana, Ahrefs, Cloudflare (видит только gambeteo.com),
  сервер `DEPLOY_*` (ключ `~/.ssh/blackjackcab_ed25519`), `PANDASCORE_TOKEN`, `CR_API_KEY`/`BS_API_KEY` (Supercell, IP 187.7.26.95, IPv4),
  `TG_BOT_TOKEN`/`TG_CHAT_ID` (бот @jpc_avisos_bot), `FORTNITE_API_KEY`. GitHub — `~/.ssh/jpc_ed25519` (`core.sshCommand`).
- Сервер 187.7.26.95: сайты `/opt/web/sites/<домен>`, ленты `/opt/web/<сайт>-feeds/`, прокси `pingalto-fnapi`, резервная копия картинок
  `/opt/web/jpc-backup/` (только наши папки; чужие сайты и блоки Caddy не трогать).
- Telegram: уведомления по-русски с меткой проекта (шаблоны `data/alerts/ru.json`), инструкция для других проектов — `docs/TELEGRAM-BOT.md`.
- Chrome владельца с расширением Claude и VPN Argentina — для сбора данных операторов и гео-закрытых страниц (только публичные страницы,
  без входа/кассы/форм, капчи не проходить; сайты с `Disallow` для Claude-User/Claude-Code не открывать — DECISIONS 04.11).

## Что от владельца
1. **Search Console** — когда владелец добавит доступ (решение 04.11: «когда мне будет надо я добавлю тебя туда»).
2. **Раз в полгода (бот напомнит; первый срок — копии до 30.04–04.05.2027):** вручную сохранить Río Negro ×3, HCDN, ley 8986
  (`docs/reference/owner-saves/README.md`); держать Chrome с VPN, чтобы агент переснял остальные копии и данные операторов.
3. По желанию: страница Free Fire Advance (сервер и браузер получают 403).

## Открытое / идеи (не начато)
- Тóмболы (santiagueña, salteña, jujeña), Catamarca, Formosa — нет официального источника результатов.
- «Значения номеров» кинелы — нет цитируемой таблицы. Valorant tracker и мета LoL — нужен production-ключ Riot.
- Будущая кнопка партнёрки — только по слову владельца и после юридической проверки (на pingalto — нет, аудитория молодая).

## Журнал (кратко; подробно — архив)
- 02.11 — стартовый набор, планы страниц, ресёрч API, первые дизайны и девушки; сервер (Caddy-блоки) поднят.
- 03.11 — движок трёх сайтов, все три сайта онлайн, ленты, сцены девушек, логотипы, QA.
- 04.11 — аудит трёх сайтов, casaslegales → обзорник (сбор через Chrome+VPN), результаты провинций, труко 2×2, меню и поиск, `/en/` на трёх
  сайтах, трекер Fortnite, обслуживание раз в полгода, копии владельца 180 дней.
- 05.11 — починка ленты провинций (изоляция источников), учебники правил игр и лотерей, бот по-русски, копии через Chrome владельца
  (16 страниц), `chat.md`, переезд: `docs/MIGRATION.md`, резервная копия картинок на сервере.
- 08.11 — переезд на Windows: ключи из `C:\dev\.ssh`, poppler через `PDFTOTEXT`, синхронизация лент без локального rsync, исправлены
  пути Windows (гейты `check-dist` молча не запускались), `.gitattributes`; тесты, гейты и побайтная сверка сборки со сервером.
