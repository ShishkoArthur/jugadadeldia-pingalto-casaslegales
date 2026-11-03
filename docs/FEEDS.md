# Ленты (автообновление) — jugadadeldia.com и pingalto.com

Владелец 03.11: «Делай автообновление, бот скину позже». Ленты работают **на нашем сервере** (cron + одноразовый Docker-контейнер),
без GitHub Actions и без агента. Страницы рисуют данные **в браузере** из `/data/feeds/<имя>.json` (сайт пересобирать не нужно);
статическая часть страницы — рамка, метод, источники и честный текст на случай задержки.

## Как устроено
- Код: `tools/feeds/run.mjs` (раннер, общий движок), `tools/feeds/lib.mjs` (вежливый HTTP-клиент: 1 запрос/с, 3 попытки,
  кэш, таймауты), ленты — `tools/feeds/<сайт>/<имя>.mjs` (`{ name, cadence: run|hourly|daily, maxAgeHours, timeoutSec, enabled(env),
  fetch, validate, compute }`). Файлы с дефисом/без fetch — помощники (`supercell.mjs`).
- Запись **только при успехе** (`fetch → validate → compute`): при любом сбое остаётся последний верный файл. `compute` может вернуть
  `__files` — дополнительные документы (архив кинелы). После каждого запуска — `_health.json` (stale, consecutiveFailures, lastError).
- **Сигнал о сбоях:** при переходе ленты в «stale» и обратно раннер шлёт сообщение в Telegram, если в `secrets.env` сайта есть
  `TG_BOT_TOKEN` и `TG_CHAT_ID`; пока их нет — пишет строку `alert (telegram not configured)` в лог. Когда владелец пришлёт бота:
  дописать оба ключа в `.env` → `bash tools/feeds-server.sh <сайт> secrets` (для каждого сайта).
- Сервер (у каждого сайта своё — сайты не выглядят сетью):

| | jugadadeldia | pingalto |
|---|---|---|
| папка | `/opt/web/jugadadeldia-feeds/` | `/opt/web/pingalto-feeds/` |
| cron | `/etc/cron.d/jugadadeldia-feeds`, `4,19,34,49 * * * *` UTC | `/etc/cron.d/pingalto-feeds`, `23 * * * *` UTC |
| образ | `jugadadeldia-feeds:node24` (node:24-alpine + poppler-utils) | `pingalto-feeds:node24` (node:24-alpine) |
| uid | 47210 | 47220 |
| User-Agent | `JugadaDelDia/1.0 (jugadadeldia.com)` | `Pingalto/1.0 (pingalto.com)` |
| ключи (`secrets.env`, root 600) | только TG_* (когда будут) | PANDASCORE_TOKEN, CR_API_KEY, BS_API_KEY, TG_* |
| выход | `/opt/web/sites/jugadadeldia.com/data/feeds/` | `/opt/web/sites/pingalto.com/data/feeds/` |

  Контейнер: код только на чтение, `--read-only`, без capabilities, 512 МБ, 0,5 CPU, таймаут 15 мин, `flock` (два запуска не пересекаются),
  лог `logs/runner.log` (ротация 1 МБ × 4), образ пересобирается раз в 30 дней (удаляется только наш старый образ).
  `deploy.sh` не трогает `data/feeds/` (фильтр rsync), раннер перед каждым запуском возвращает владельца папки (ловушка gambeteo EACCES).
- Команды (с машины разработки): `bash tools/feeds-server.sh <сайт> install | secrets | sync | run [имена] [--force] | status | logs | uninstall`.
  После правки кода лент: commit → `sync` (ленты выкладываются отдельно от сайта!) → `run --force` → `status`.
  Локально: `node tools/feeds/run.mjs --site <сайт> [имя] --out <папка>` (ключи pingalto — из окружения).

## jugadadeldia — кинела (`quiniela`, каждые 15 мин)
- **Источники** (официальные, без ключа, robots разрешает): LOTBA `quiniela.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=N`
  (номер последнего тиража — со страницы `quiniela.loteriadelaciudad.gob.ar/`; в одном ответе Ciudad 51, Provincia 53, Córdoba 55,
  Entre Ríos 59, Mendoza 64, Santa Fe 72) и IPLyC PBA `loteria.gba.gob.ar/api-loteria/extractos/YYYY-MM-DD` (JSON ≈ 5,4 МБ с base64-PDF;
  берём `Quiniela<Turno>.pdf` — 5 колонок PROVINCIA, CIUDAD, CORDOBA, SANTA FE, ENTRE RIOS; текст `pdftotext -layout`). PBA качается
  только за сегодня и вчера и только пока есть непроверенные тиражи (кэш 80 мин / 20 ч).
- **Не используем:** API Lotería de Córdoba — robots.txt запрещает ClaudeBot/GPTBot (правило владельца 03.11), Córdoba берём из копий
  LOTBA и PBA; Tucumán (`resultadosquiniela.cajapopular.gov.ar`) — TLS-сертификат не проходит проверку (с сервера и с машины разработки),
  проверку не отключаем; Santa Fe и Mendoza — гео-блок/таймаут, их кинела — из LOTBA (и PBA для Santa Fe); Quini 6/Brinco через San Juan
  CAS — 03.11 там всё ещё тираж 3421 от 28.10 (воскресный 01.11 не появился): свежесть неприемлема, не делали.
- **Проверки:** 20 номеров по 4 цифры на местах 01–20 (неполная юрисдикция не публикуется и перечитывается), номер тиража = запрошенный,
  дата/турно известны, тиражи LOTBA по порядку (номер ↔ дата ↔ турно), не из будущего; PDF — строгий разбор (дата, турно, «Realizado a las»,
  заголовок юрисдикций, 10 строк × позиции 1–10/11–20, «Premio» = 1-е место), неизвестный макет — стоп для этого PDF.
  **Сверка:** совпали LOTBA и PBA цифра в цифру → метка `LP` («2 fuentes»); одна копия → `L`/`P` («1 fuente»); расхождение → юрисдикция
  тиража **не публикуется** и запоминается в `x` (больше не возвращается из одной LOTBA), запись в `conflicts`.
- **Файлы:** `quiniela.json` (последние 7 дней с тиражами, ~22 КБ), `quiniela-archivo.json` (120 дней; это и состояние ленты:
  `floor`/`gaps` для догрузки истории — 60 старых тиражей за запуск), `quiniela-frecuencia.json` (00–99 «a la cabeza» и во всех 20 местах,
  chi² и p по 99 степеням свободы).
- **Устаревание:** `maxAgeHours` = 3 (`STALE_HOURS` в `engine/lottery/extract.mjs`, тот же порог в страницах): если лента не отработала
  3 ч, страницы пишут «Sin datos al HH:MM…» и сетку дня не показывают; архив и частоты остаются с датами.
- **Страницы:** `/quiniela/` (сетка юрисдикция × турно), `/quiniela/nacional/`, `/provincia/`, `/cordoba/`, `/santa-fe/`, `/entre-rios/`,
  `/mendoza/` (последний тираж, неделя, «¿Salió mi número?» — для Nacional/Provincia выплата считается `settleDirect` по реальному экстракту),
  `/quiniela/nacional-y-provincia/`, `/quiniela/extractos/` (архив, `?d=&j=&t=`), `/quiniela/numeros-que-mas-salen/` (тепловая карта против
  случайного розыгрыша xoshiro, chi²). Клиент — `sites/jugadadeldia/client/extractos.js`, стили — `css/extractos.css`.

## pingalto — киберспорт и Supercell
- **`agenda` (раз в час, PandaScore free):** `/matches/{running,upcoming,past}?filter[videogame]=…` для cs-go (CS2), valorant,
  league-of-legends, dota-2, rl, fifa (EA FC) — ≈ 19 запросов из 1000/ч. Оставляем только поля для показа (команды, страна, счёт, время,
  лига/турнир, tier, официальный стрим twitch/youtube/kick); tier s/a/b/c + любые матчи с командами LATAM или регионом SA.
  Статусы явно: not_started, running, finished, postponed (помечаем), canceled (выпадает), другое — стоп. Счёт ≤ ceil(Bo/2). Поля ставок в
  ответе → стоп. Названия команд/лиг/каналов с беттинг-брендами маскируются (`isBrandName` из `engine/games/vrs.mjs`). Подпись
  «Datos: PandaScore» на каждой странице с данными; токен только на сервере. `maxAgeHours` 4.
  Страницы: `/esports/agenda` (план: так называется страница «calendario»), блоки «Próximos partidos» на `/esports`, `/cs2`, `/valorant`, `/lol`.
- **`clash` (раз в сутки, api.clashroyale.com, ключ на IPv4 сервера):** `/cards` (123 карты: элексир, редкость, max level, эволюция),
  `/locations` → Argentina (57000017) → `pathoflegend/players` (03.11 пусто — сезонный рейтинг; страница рейтинг не показывает).
  Новые карты помечаются «nueva». Страница `/clash/cartas` (фильтры, мазо из 8: средний элексир и цикл). `maxAgeHours` 72.
- **`brawl` (раз в час; бойцы и рейтинг кэш 20 ч):** `/brawlers` (111: star powers, gadgets; редкости/класса в официальном API нет),
  `/events/rotation`, `/rankings/AR/players` → только пороги копов на местах 1/10/25/50/100/200 (имена и теги не храним).
  Страницы `/brawl/brawlers`, `/brawl/eventos` (обратный отсчёт). `maxAgeHours` 6.
- Supercell Fan Content Policy: на каждой странице текст «This material is unofficial and is not endorsed by Supercell…», без логотипов и
  арта карт, ничего не продаём. JSON pingalto — обработанные данные (не зеркало ответов API).

## Что ломается и как
| Симптом | Где видно | Что делать |
|---|---|---|
| `stale` у ленты, `consecutiveFailures` растёт | `status`, `_health.json`, Telegram | `logs 200`: HTTP 403/429/5xx, `not JSON`, ошибка разбора — смотреть, что поменял источник |
| LOTBA сменил формат `RESULTADOS_DATA` | `LOTBA …: no RESULTADOS_DATA` | поправить `parseLotba` + фикстуру `engine/test/fixtures/quiniela` |
| PBA сменил PDF | заметки `PBA … turn line / rows` в `quiniela.json.notes`; метка «2 fuentes» пропала | `parsePbaText`; лента живёт на одной LOTBA |
| PBA сменил адрес (301) | `PBA <дата>: HTTP …` | новый адрес в `PBA_DAY` |
| расхождение копий | `quiniela.json.conflicts`, `x` в архиве | сверить вручную с оригиналами; ничего не публикуется до решения |
| PandaScore 401/403 | `agenda` stale | токен/план: dashboard PandaScore; `secrets` |
| Supercell 403 `accessDenied.invalidIp` | `clash`/`brawl` stale | IP сервера в developer.*.com должен быть 187.7.26.95 |
| `scheduler stopped?` (health старше 2 ч) | `status` | cron-файл на месте? `docker` жив? `last-exit` 124 — таймаут |

## Раз в полгода (агент)
1. `bash tools/feeds-server.sh jugadadeldia status` и `… pingalto status`: health OK, нет stale, fails 0; `logs 300` — нет повторяющихся ошибок.
2. `quiniela.json`: доля «2 fuentes» за неделю (норма — все, кроме Mendoza); `conflicts` пуст; `notes` без PBA-ошибок.
3. Ключи: PandaScore токен жив, план бесплатный не сменился (условия: показ на своём сайте, подпись, без коэффициентов);
   Supercell ключи живы и привязаны к 187.7.26.95; robots.txt LOTBA/PBA не закрыли нас и ИИ; Córdoba/Tucumán — не изменилось ли (TLS).
4. Условия: PandaScore ToS, Supercell Fan Content Policy — перечитать, если поменялись.
5. Диск: `du -sh /opt/web/*-feeds`, образы `docker images | grep -feeds`; соседние сайты не тронуты (свой cron, свои папки).
6. Новое: появились ли Quini 6/Brinco на официальном источнике со свежестью ≤ 1 дня (San Juan CAS отставал на 6 дней 03.11).
