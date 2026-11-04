# Ленты (автообновление) — jugadadeldia.com, pingalto.com, casaslegales.com

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

| | jugadadeldia | pingalto | casaslegales |
|---|---|---|---|
| папка | `/opt/web/jugadadeldia-feeds/` | `/opt/web/pingalto-feeds/` | `/opt/web/casaslegales-feeds/` |
| cron | `/etc/cron.d/jugadadeldia-feeds`, `4,19,34,49 * * * *` UTC | `/etc/cron.d/pingalto-feeds`, `23 * * * *` UTC | `/etc/cron.d/casaslegales-feeds`, `37 6 * * *` UTC (раз в сутки) |
| образ | `jugadadeldia-feeds:node24` (node:24-alpine + poppler-utils) | `pingalto-feeds:node24` (node:24-alpine) | `casaslegales-feeds:node24` (node:24-alpine + poppler-utils) |
| uid | 47210 | 47220 | 47230 |
| User-Agent | `JugadaDelDia/1.0 (jugadadeldia.com)` | `Pingalto/1.0 (pingalto.com)` | `Casaslegales/1.0 (casaslegales.com)` |
| ключи (`secrets.env`, root 600) | TG_* | PANDASCORE_TOKEN, CR_API_KEY, BS_API_KEY, TG_* | TG_* |
| выход | `/opt/web/sites/jugadadeldia.com/data/feeds/` | `/opt/web/sites/pingalto.com/data/feeds/` | `/opt/web/sites/casaslegales.com/data/feeds/` |

  Контейнер: код только на чтение, `--read-only`, без capabilities, 512 МБ, 0,5 CPU, таймаут 15 мин, `flock` (два запуска не пересекаются),
  лог `logs/runner.log` (ротация 1 МБ × 4), образ пересобирается раз в 30 дней (удаляется только наш старый образ).
  `deploy.sh` не трогает `data/feeds/` (фильтр rsync), раннер перед каждым запуском возвращает владельца папки (ловушка gambeteo EACCES).
- Команды (с машины разработки): `bash tools/feeds-server.sh <сайт> install | secrets | sync | run [имена] [--force] | status | logs | uninstall`.
  После правки кода лент: commit → `sync` (ленты выкладываются отдельно от сайта!) → `run --force` → `status`.
  **`sync` берёт только последний коммит** (`git archive HEAD`, как deploy; с 04.11): незакоммиченные файлы — свои и чужих агентов —
  на сервер не уезжают, `sync` об этом пишет строкой `note: uncommitted changes … were NOT synced`. `stage <папка>` — тот же набор
  файлов локально (тест `engine/test/feeds-casaslegales.test.mjs` сверяет его с HEAD побайтно).
  Локально: `node tools/feeds/run.mjs --site <сайт> [имя] --out <папка>` (ключи pingalto — из окружения).

## jugadadeldia — кинела (`quiniela`, каждые 15 мин)
- **Источники** (официальные, без ключа, robots разрешает): LOTBA `quiniela.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=N`
  (номер последнего тиража — со страницы `quiniela.loteriadelaciudad.gob.ar/`; в одном ответе Ciudad 51, Provincia 53, Córdoba 55,
  Entre Ríos 59, Mendoza 64, Santa Fe 72) и IPLyC PBA `loteria.gba.gob.ar/api-loteria/extractos/YYYY-MM-DD` (JSON ≈ 5,4 МБ с base64-PDF;
  берём `Quiniela<Turno>.pdf` — 5 колонок PROVINCIA, CIUDAD, CORDOBA, SANTA FE, ENTRE RIOS; текст `pdftotext -layout`). PBA качается
  только за сегодня и вчера и только пока есть непроверенные тиражи (кэш 80 мин / 20 ч).
- **Не используем:** API Lotería de Córdoba — robots.txt запрещает ClaudeBot/GPTBot (правило владельца 03.11), Córdoba берём из копий
  LOTBA и PBA; Tucumán и другие провинции — отдельная лента `provincias` (ниже); Santa Fe и Mendoza — гео-блок/таймаут, их кинела — из LOTBA (и PBA для Santa Fe); Quini 6/Brinco через San Juan
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

## jugadadeldia — программа тиражей LOTBA (`programa`, раз в сутки; к источнику — по необходимости)
- **Зачем:** `/quiniela/horarios/` («¿Hay quiniela hoy?», обратный отсчёт, турно и юрисдикции) знает тиражи только из программы LOTBA.
  Сохранённая при сборке копия (`data/sources/lottery`, версия «completa» за 11.2026) текстом покрывает лишь 02.11–12.11. Лента держит
  свежую программу; страница в браузере берёт `programa.json`, если он доходит дальше сохранённой копии (иначе — копия, а за её пределами —
  ответ по архиву тиражей, как раньше).
- **Источник** (официальный, тот же публичный формуляр сайта, без личных данных; `robots.txt` хоста отвечает 404 = правил нет; UA ленты):
  `POST quiniela.loteriadelaciudad.gob.ar/includes/descargaPrograma.php` `ano=YYYY&mes=MM&version=1|0&juego=QUI` — за текущий и следующий
  месяц, обе версии. `version=1` «completa» (утверждённый документ; в 11.2026 второй лист диаграммы — картинка), `version=0` «simple»
  (только диаграмма, весь месяц текстом). Ответ-PDF начинается с `<style>`-блока — PDF берём с `%PDF-`. Не загружен — HTML
  «El documento … no fue cargado aún o no existe» (это не сбой).
- **Когда спрашивает:** нет программы; новый месяц; 31 день без проверки; **последний день программы ближе 5 дней (или прошёл)** — тогда
  каждый день. В остальные дни файл переписывается без запроса (`checked` = дата последнего запроса).
- **Разбор и проверки** (`engine/lottery/programa.mjs`, общий со сборкой): в тексте есть «DIAGRAMA DE SORTEOS» и «<МЕСЯЦ> <ГОД>»; строка
  тиража — номер, дата, время, коды юрисдикций 1–7 (1 Ciudad … 5 Uruguay … 7 Entre Ríos), тип (пробелы внутри слова «MAT UT INA»
  игнорируются); незнакомая строка или тип — стоп. Даты внутри месяца, номера подряд, время и порядок турно внутри дня, Ciudad в каждом
  тираже, перерыв без тиражей ≤ 4 дней; соседние месяцы продолжают нумерацию. Версии: «completa» главнее, «simple» дополняет только
  когда совпадает с ней во всех общих тиражах (иначе — только completa и заметка). **Сверка с фактом:** номер тиража ↔ дата ↔ турно —
  с архивом ленты `quiniela` (расхождение — стоп). Любой сбой — остаётся последний верный файл.
- **Файл `programa.json`:** `from`, `to`, `checked`, `months` (версии, sha256 и размер PDF), `notes` («2026-12: not published yet»),
  `rows` `[номер, дата, время, тип, [коды]]` (месяцы с прошлого по следующий), `expiries` — последний день программы.
- **Сигнал:** если следующий месяц не вышел — молчим, пока программа не кончилась; на следующий день после `to` — одно сообщение
  в Telegram (`EXPIRED since …: lotba-programa`) и строка в `problems`; страница сама переходит на ответ по архиву.

## jugadadeldia — цены месячных программ LOTBA (`precios`, раз в сутки; к источнику — как `programa`)
- **Зачем:** цены меняются каждый месяц, владелец хочет вмешательства не чаще раза в полгода. Цены на страницах (минимальная ставка
  кинелы, Poceada, Loto Plus, порог «премии в sede») браузер берёт из `precios.json` с датой и ссылкой; статическая копия
  (`data/sources/lottery`, 11.2026) — только запасной вариант и для страницы без JS.
- **Источник:** тот же формуляр, версия `1` («completa», с правилами): `quiniela.loteriadelaciudad.gob.ar` `juego=QUI` и
  `loto.loteriadelaciudad.gob.ar` `juego=LTO` (robots.txt обоих — 404), этот и следующий месяц. Когда спрашивает: нет цен; новый месяц;
  31 день без проверки; ближайшее «vigente hasta» ближе 5 дней (тогда каждый день). HTTP-кэш общий с `programa` (20 ч).
- **Копии:** каждый PDF — на сервере в `state/docs/lotba-<QUI|LTO>-<месяц>-<sha256[:12]>.pdf` (не в публичной папке), sha256, размер и дата —
  в `precios.json.docs`; хранятся 8 последних месяцев.
- **Разбор** (`engine/lottery/precios.mjs`): документ называет игру и месяц; цена — строгий шаблон, цифры = слова (`esWords`: «PESOS CIENTO
  CINCUENTA ($150)»); все вхождения — одна сумма; слова-опечатка рядом с верным вхождением допускаются (в 11.2026 «DOS MILLONES CIE MIL»).
  Loto Plus — первая таблица тиражей: номера подряд, даты в месяце, обычные тиражи — одна цена (тираж со `*` — extraordinario, не цена).
- **Проверки и сигнал:** диапазон; скачок против последнего верного (или против копии сборки) > 50 % (`MAX_JUMP`) или поле пропало →
  **не публикуется**, остаётся последнее верное, `alerts` → одно сообщение в Telegram и строка в `problems`. Остальные значения, которые
  сайт цитирует из этих программ (выплаты, доли фондов, правила, часы), проверяются по цитате дословно (часы — по строкам тиражей); все
  на месте → `confirmed[doc]` продлевается до конца месяца; что-то пропало → сигнал «cited values not found any more» (сайт держит копию;
  человек сверяет и обновляет `data/sources/lottery` — это редкое событие: выплаты стоят годами).
- **Страница:** `<b data-price>` + `<small data-price-note>` (`sites/jugadadeldia/pages/precios.mjs`, `client/precios.js` через `jg.js`):
  «(programa oficial de noviembre de 2026, vigente hasta el 30/11/2026; revisado el 3/11/2026)» со ссылкой на раздел programación;
  после `until` без новой программы — «sin precio vigente» и «(el programa … venció el …)».
- **Сроки в health:** `lotba-precios` (ближайшее `until` цен), `lotba-quiniela-programa`, `lotba-loto-programa` (до какого месяца
  подтверждены остальные значения); все — сигнал только при истечении.

## jugadadeldia — сроки источников (`fuentes`, раз в сутки, без сети)
- Читает описания сохранённых источников (`data/sources/{lottery,rg,truco,generala,chinchon,escoba,burako}/*.json`; `sync` копирует только
  JSON, без `_docs`) и кладёт в `fuentes.json` → `_health.json.expiries` последний день каждого: копии правил и страниц LOTBA/PBA/CAS —
  `fetched + maxAgeDays` (183; после — сборка стоит); месячные программы (`quiniela-programa`, `loto-programa`) здесь не считаются —
  их каждый месяц проверяет `precios`; пакет помощи (rg) — самая старая копия + 100 дней (после — строки скрываются, гейт сборки
  падает); правила игр — самая старая копия + 183.
- **Сигнал:** за 14 дней до срока (`soon`) и в день истечения (`expired`) — по одному сообщению на смену состояния. Истёкшее — в `problems`. `_health.json` публичный: там только источники этого сайта.
- `status` печатает таблицу `== expiries`: дата, дней осталось, состояние, порог.
- После обновления источников в репозитории: commit → `feeds-server.sh jugadadeldia sync` (иначе на сервере старые даты — ложная тревога).

## jugadadeldia — кинела провинций (`provincias`, каждые 15 мин)
- **Зачем:** самые большие запросы сайта — результаты провинций (Tucumán, San Juan, Chaco, Corrientes, Misiones). Ресёрч источников —
  `docs/research/JDD-SOURCES-2026-11-04.md` (там же, почему нет Catamarca, Formosa, Salta, Neuquén, Jujuy, Santiago).
- **Источники** (официальные, без ключа; robots.txt — нет правил против нас/ИИ; UA ленты):
  - **Tucumán** — Caja Popular: `resultadosquiniela.cajapopular.gov.ar/api/extracto/?fecha_sorteo=D` (список турно дня) →
    `/api/extracto-registro/?id=N` (20 строк `posicion` 0–19). **TLS:** сертификат сайта верный (Sectigo DV, `*.cajapopular.gov.ar`,
    до 23.04.2027), но сервер не отдаёт промежуточный CA. Лента добавляет публичный промежуточный «Sectigo Public Server Authentication
    CA DV R36» (взят по адресу AIA из сертификата, закреплён по SHA-256 в `provincias-parse.mjs`) к стандартному хранилищу —
    проверка цепочки до корня, дат и имени хоста остаётся (проверено: просроченный сертификат по-прежнему отвергается).
    Турно: Matutino 11:30, Vespertino 14:30, De la Siesta 17:30, De la Tarde 19:30, Nocturno 22:00 (тип 11 — Nocturno 20:00).
  - **San Juan** — CAS: `cas.gob.ar/?fecha=D` (серверный HTML; блоки «SORTEO VESPERTINO N° 7413 03/11/2026», 1°–20°).
  - **Chaco + Corrientes** — Lotería Chaqueña: `loteria.chaco.gov.ar/ver_extracto/DD-MM-YYYY/<PRE|PRI|MAT|Ves|NOC>` (колонки Prov. Bs As,
    Ciudad Bs As, Chaqueña, Correntina, Cordoba). Correntina — пока только эта копия (у самой Lotería Correntina — только xlsx
    «para medios» с последней Nocturna, перезаписывается; кандидат во вторую копию, см. ресёрч).
  - **Misiones** (+ Misionera Plus) — IPLyC: `loteriademisiones.com.ar/portal/juegos/quiniela-<турно>/` — только последний тираж турно
    (robots запрещает `?`, другие даты не спрашиваем); у каждой ячейки aria-label «Lotería <колонка>, premio número NN: VVVV».
- **Проверки:** 20 номеров по 4 цифры; дата страницы = запрошенная; Tucumán — список строк строго по убыванию `posicion` (так его читает
  официальная страница), тип турно известен; San Juan/Chaco/Misiones — известные названия турно и колонок, иначе стоп для этой страницы.
  **Сверка:** страница Chaco/Misiones используется, только если её колонки Ciudad/Provincia/Córdoba/Santa Fe **совпали цифра в цифру**
  с нашим архивом LOTBA/PBA (`quiniela-archivo.json`) хотя бы в одной колонке и ни одна не разошлась (`c` = число совпавших колонок);
  нет эталона — ждём следующего запуска; расхождение — `conflicts`. Своя колонка, равная эталонной, — стоп. Если источник изменил уже
  опубликованные номера — запись снимается и запоминается в `x` архива.
- **Когда спрашивает:** сегодня — только после времени турно (+20 мин), вчера — пока день не закрыт, затем 1 старый день за запуск
  (до 21 дня назад; закрытые дни — `checked` в архиве). Обычно 0–10 запросов за запуск, 1 с между ними.
- **Файлы:** `provincias.json` (7 последних дней с тиражами: `jurs` с турно и операторами, `latest`, `draws` `{j, d, t, s, n (80 цифр),
  c?, h?}`, `sources.ok/failed`, `conflicts`, `notes`), `provincias-archivo.json` (120 дней + состояние). `maxAgeHours` 3; лента падает,
  только если не ответил ни один источник (сбой одного — строка в `notes`, `sources.failed`).
- **Страницы (строит сайт):** `/quiniela/tucuman/`, `/quiniela/san-juan/`, `/quiniela/chaco/`, `/quiniela/corrientes/`, `/quiniela/misiones/`
  (+ блок Plus). Подпись источника — `jurs[].operator` / `via` («copia publicada por Lotería Chaqueña» для Corrientes).

## jugadadeldia — лото (`loterias`, раз в час)
- **Источники:** **Loto Plus** — LOTBA `loto.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=N` (номер — с главной; JSON
  `RESULTADOS_DATA` + `PREMIOS_DATA`: модальности, Número Plus, pozo, выигравшие и выплаты); **Telekino** — `www.telekino.com.ar/`
  (последний тираж, Telekino + Rekino); **копия для сверки и истории** — San Juan CAS `cas.gob.ar/juegos/sorteos/resultados?juego=
  loto|telekino|quini6|brinco[&fecha=D]`. **Quini 6 и Brinco** — только CAS: Lotería de Santa Fe отвечает нашему серверу 403 (гео-блок,
  не обходим), другие официальные сайты (Chaco, Misiones) только ссылаются на Santa Fe.
- **Проверки:** количество и диапазон (Loto 6 из 00–45, Telekino 15 из 01–25, Quini 6 6 из 00–45, Brinco 6 из 00–39), без повторов,
  все модальности одного номера тиража; номера тиражей и даты идут вместе. Две копии одного тиража (LOTBA/CAS, сайт Telekino/CAS)
  сравниваются как множества по каждой модальности: совпали — `src` «CL»/«CT»; разошлись — тираж **не публикуется**, `conflicts`.
- **Свежесть:** `behind` = сколько тиражей по расписанию (Loto ср/сб, Telekino вс, Quini 6 ср/вс, Brinco вс; после 23:00–23:30) нет
  после `latest`; `expected` — дата последнего пропущенного. Страница при `behind > 0` пишет «pendiente de publicación oficial» и не
  выдаёт старый тираж за последний. 04.11: Quini 6 и Brinco — `behind 1` (CAS не выложил 01.11).
- **История:** до 30 тиражей на игру (`draws`, новые первыми); каждый час — один более старый тираж из CAS (ссылка «Sorteo anterior»).
- **Страницы:** `/loto-plus/`, `/telekino/`, `/quini-6/`, `/brinco/` (и «controlar» — по `draws`).

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
- **`torneos` (раз в час, PandaScore):** большие турниры (`EVENTS` в файле: Worlds, MSI, VCT Champions/Masters/Americas, TI, RLCS, FC Pro) —
  последняя редакция, стадии, все матчи; завершённые кэш 20 ч. Страницы /lol/worlds, /lol/msi, /valorant/champions, /dota2/ti, /rl, /eafc.
  Новая лига — строка в `EVENTS` (id лиги: `/leagues?search[name]=…`). `maxAgeHours` 6.
- **`argentinos` (сутки, PandaScore):** игроки с nationality AR и командой (ник, команда, страна команды), команды AR. /esports/argentinos, /rl, /eafc.
- **`dotaelo` (сутки, PandaScore):** серии Dota 2 за 180 дней → Elo (`engine/games/elo.mjs`), бэктест 60 дней. /dota2.
- **`clashmeta` / `brawlmeta` (сутки, Supercell):** топ-10 кланов AR → 100 игроков → текущие колоды; топ-100 AR Brawl Stars → battlelog.
  Только счётчики (без имён и тегов). /clash, /clash/mazos, /clash/meta, /brawl, /brawl/meta. ≈ 110 и 100 запросов (по 1 с).
- Supercell Fan Content Policy: на каждой странице текст «This material is unofficial and is not endorsed by Supercell…», без логотипов и
  арта карт, ничего не продаём. JSON pingalto — обработанные данные (не зеркало ответов API).

## casaslegales — перепроверка официальных страниц (`listas`, cron раз в сутки, cadence `run`; в сеть — раз в месяц)
- **Зачем:** у сайта 8 официальных списков, страницы провинций и пакет помощи; копии старше 100 дней останавливают выкладку,
  а список регулятора может поменяться. Лента раз в месяц (28 дней; сразу — после `sync` с изменёнными данными; при сбое — повтор через
  3 дня только упавших страниц, 14 дней, дальше — снова раз в месяц) скачивает каждую страницу, которую серверу **можно** качать, и
  прогоняет те же проверки, что сборка: `checkRegistry` (цитаты дословно, HTML-доказательство каждой строки побайтно, список полон),
  `checkProvinces` (с `copies`: проверяется только свежая страница), цитаты пакета помощи (PDF — `pdftotext`).
- **Не качает никогда:** копии владельца (`copiedBy: "owner"`, `pendingOwnerCopy`, хосты `AI_BLOCKED_HOSTS`, `refresh: "manual"`) и любую
  страницу, чей `robots.txt` закрывает нас или **любого** ИИ-краулера (ClaudeBot, GPTBot, Google-Extended, CCBot … — `robots-txt.mjs`);
  такая страница → состояние `robots` + одно сообщение «сохраняет владелец».
- **Итог по каждой копии** (`listas.json → data.docs[<ключ>]`, ключ — slug реестра, `pv:<slug>` провинций, `rg:<slug>` помощи):
  `ok` — всё сошлось: серверная копия заменена (`state/docs/listas/<ключ>.<ext>`), `revisado` = сегодня, sha256, размер;
  `changed` — список или цитата изменились: **ничего не публикуется**, `revisado` остаётся прежним, свежая копия — в
  `state/docs/listas-pending/`, в Telegram — одно сообщение с разницей («Added: … Removed: …», id по хешу разницы — повтор не шлётся);
  `unreachable` — не открылась (`since`, `reason`); `robots`; `owner`. Сроки (`expiries`): `revisado + maxAgeDays` каждой страницы.
- **Сайт:** даты на страницах — из сборки («copia guardada el …»); рядом с каждой копией, которую сервер перепроверил позже,
  браузер дописывает «· revisada el dd/mm/aaaa, sin cambios» (`client/ui.js` → `revisado()`, атрибуты `data-rv`/`data-rvd` у
  `src()`/`quote()` в `pages/parts.mjs`, `pdSrc`/`pdQuote` в `content/provdata.mjs`, колонка «Copia» в `/registro-de-fuentes` + строка
  «Revisión automática mensual …»). Пересборка на сервере не нужна (выбрано вместо схемы gambeteo `site-server.sh`: ни одной
  серверной сборки, сайт = коммит).
- **В репозиторий** (чтобы гейт свежести пропустил следующую выкладку): `bash tools/feeds-server.sh casaslegales pull` (сухой прогон) →
  `pull --write` — берёт только `ok`-копии новее наших и только если байты совпадают с записанным sha256; меняет файл, `sha256`,
  `fetched` (= день проверки сервером) во всех наборах с тем же slug и адресом (реестр, провинции, помощь, операторы) → `npm test` → commit
  → `sync` → deploy. Делает агент при любой выкладке после ~февраля 2027 и в полугодовой проверке (`docs/MAINTENANCE.md`).

## casaslegales — сроки того, что сервер обновить не может (`plazos`, раз в сутки, без сети)
- Из синхронизированных JSON: копии владельца (реестры Córdoba, Neuquén, Río Negro, Santa Fe, Mendoza; провинция Salta; копии владельца в пакете
  помощи) — `fetched + maxAgeDays` набора (100); данные обзоров (`data/sources/reviews/<марка>.json`) — самая старая копия/скриншот/статус
  + **180 дней** (`REVIEW_MAX_AGE`, владелец пересобирает обзоры раз в полгода); копии страниц операторов и скриншоты (`operators.json`,
  `maxAgeDays` 180).
- **Одно напоминание:** за 21 день до первого срока (из `plazos` и `listas`) — одно сообщение в Telegram со всем, что истекает в
  ближайшие 60 дней, по группам: 1) сохранить из Chrome (адреса, до какого числа), 2) что сервер не смог обновить, 3) обзоры через
  Chrome + VPN AR, 4) копии и скриншоты операторов. id `reminder-<первый срок>` — раз на цикл; пока висит — `health` PROBLEMS.
  Отдельные сроки — `warnDays 0` (сообщение только в день истечения).

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
| `EXPIRED …: lotba-programa` | Telegram, `status` | программа следующего месяца не вышла: `run programa --force` позже; формуляр сменился — `programa.mjs` |
| `program: unknown row layout` / `does not name` | `programa` fails | LOTBA сменил вёрстку PDF: `parseProgramText` + фикстуры `engine/test/fixtures/programa` |
| `price … held back (jump/not found/…)` | Telegram, `problems` | сверить PDF в `state/docs/` с сайтом LOTBA; верная цена — поправить шаблон/порог в `engine/lottery/precios.mjs` |
| `cited values not found any more: …` | Telegram, `problems` | LOTBA изменил выплаты/правила: новая копия в `data/sources/lottery`, `verify-sources`, deploy |
| `expires …` / `EXPIRED …` (не программа) | Telegram, `status` | обновить копию источника (половинная проверка ниже), commit → `sync` |
| `… changed on the official page` (casaslegales) | Telegram, `listas.json → changes`, `status` | `pull` не возьмёт эту копию; скачать страницу, прочитать, поправить `data/sources/...` руками (новые/ушедшие адреса — с HTML-доказательством), `npm test`, commit → `sync` → deploy |
| `… now keeps AI crawlers or us out` (casaslegales) | Telegram | больше не качаем: пометить документ `pendingOwnerCopy: true`, адрес — в `owner-saves/README.md`, commit → `sync` |
| `casaslegales reminder: …` | Telegram (за 21 день) | `docs/MAINTENANCE.md`: владелец сохраняет страницы / собирает обзоры, агент раскладывает (`owner-copy.mjs`, `pull --write`) |

## Раз в полгода (агент)
Полный чек-лист трёх сайтов с датами — **`docs/MAINTENANCE.md`**. Здесь — только ленты.
1. `bash tools/feeds-server.sh jugadadeldia status` и `… pingalto status`: health OK, нет stale, fails 0; `logs 300` — нет повторяющихся ошибок.
   У jugadadeldia — таблица `== expiries`: всё, что истекает до следующей проверки, обновить сейчас (скачать копию, перепроверить цитаты,
   `node tools/verify-sources.mjs` / `verify-rg.mjs`, commit, `sync`, deploy). Месячные программы ведут ленты `programa` и `precios` сами;
   смотреть только их `alerts` (если были) и что `lotba-precios` / `lotba-*-programa` впереди сегодняшней даты.
2. `quiniela.json`: доля «2 fuentes» за неделю (норма — все, кроме Mendoza); `conflicts` пуст; `notes` без PBA-ошибок.
3. Ключи: PandaScore токен жив, план бесплатный не сменился (условия: показ на своём сайте, подпись, без коэффициентов);
   Supercell ключи живы и привязаны к 187.7.26.95; robots.txt LOTBA/PBA не закрыли нас и ИИ; Córdoba/Tucumán — не изменилось ли (TLS).
4. Условия: PandaScore ToS, Supercell Fan Content Policy — перечитать, если поменялись.
5. Диск: `du -sh /opt/web/*-feeds`, образы `docker images | grep -feeds`; соседние сайты не тронуты (свой cron, свои папки).
6. Новое: появились ли Quini 6/Brinco на официальном источнике со свежестью ≤ 1 дня (San Juan CAS отставал на 6 дней 03.11; лента
   `loterias` пишет `behind`). Tucumán: промежуточный сертификат Sectigo DV R36 действует до 21.03.2036; если сервер Caja Popular
   начнёт отдавать полную цепочку — ничего не делать; если сменит CA — лента скажет `Tucumán intermediate`/TLS-ошибку в `notes`.
