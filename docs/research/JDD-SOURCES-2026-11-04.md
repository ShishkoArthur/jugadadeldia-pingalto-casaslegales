# Официальные источники результатов для jugadadeldia.com (ресёрч 04.11.2026)

Задача: для самых больших незакрытых запросов сайта (кинела провинций, Quini 6, Telekino, Loto Plus, tómbolas) найти **официальный**
источник, доступный **с нашего сервера**, проверить формат, время обновления, robots.txt/условия, придумать проверку и оценить риск;
пригодные — сразу в ленты.

**Метод.** Все запросы — с сервера 187.7.26.95 (ipinfo 04.11: **Великобритания, Manchester, AS47583 Hostinger** — не Аргентина и не
Бразилия), `curl`, UA ленты `JugadaDelDia/1.0 (jugadadeldia.com)`, по 1 запросу с паузами. robots.txt читали первым. Правило TRAPS 03.11:
**если robots.txt запрещает ClaudeBot/ИИ-краулеров — не качаем** (кроме самого robots.txt); гео-блоки, Cloudflare-проверки и капчи не
обходим. Сторонние агрегаторы и пресса — не источники (поиск использовался только чтобы найти официальные адреса).

## Итог — что теперь в лентах (выложено на сервер 04.11, `docs/FEEDS.md`)

| Игра / юрисдикция | Источник | Лента | Сверка | Страница сайта |
|---|---|---|---|---|
| **Quiniela de Tucumán** (5 турно) | Caja Popular, JSON API | `provincias` | одна копия; строгий порядок мест как на оф. странице | `/quiniela/tucuman/` |
| **Quiniela de San Juan** (3 турно 03.11) | CAS, HTML по дате | `provincias` | одна копия | `/quiniela/san-juan/` |
| **Quiniela Chaqueña** (5 турно) | Lotería Chaqueña, HTML по дате и турно | `provincias` | колонки Ciudad/Provincia/Córdoba той же страницы = наш архив LOTBA/PBA | `/quiniela/chaco/` |
| **Quiniela Correntina** | копия на сайте Lotería Chaqueña | `provincias` | как Chaco (страница целиком проверена) | `/quiniela/corrientes/` |
| **Quiniela Misionera** (+ Misionera Plus, Matutina/Nocturna) | IPLyC Misiones, HTML (последний тираж турно) | `provincias` | колонки LOTBA/Provincia/Santa Fe = наш архив | `/quiniela/misiones/` |
| **Loto Plus** (4 модальности, Número Plus, pozo, выплаты) | LOTBA JSON | `loterias` | копия San Juan CAS — совпала («CL») | `/loto-plus/` |
| **Telekino / Rekino** | www.telekino.com.ar | `loterias` | копия CAS — совпала («CT») | `/telekino/` |
| **Quini 6** (4 модальности), **Brinco** (+ Junior) | только копия San Juan CAS | `loterias` | одна копия; поле `behind` (04.11: оба `behind 1` — тираж 01.11 у CAS не выложен) | `/quini-6/`, `/brinco/` |

Проверено на сервере 04.11 09:25 UTC: `provincias` — 29 запросов, 43 тиража (02–03.11), конфликтов 0; `loterias` — 13 запросов.
Публично: `https://jugadadeldia.com/data/feeds/provincias.json`, `…/provincias-archivo.json`, `…/loterias.json` (200).

**Не закрыто:** Catamarca, Formosa, Salta, Neuquén, Jujuy, Santiago del Estero (tómbolas) — причины ниже.

## 1. Tucumán — ловушка TLS разобрана

- **Диагноз (openssl s_client с сервера):** сертификат `CN=*.cajapopular.gov.ar` (SAN `*.cajapopular.gov.ar`, `cajapopular.gov.ar`),
  выдан **Sectigo Public Server Authentication CA DV R36**, действует **07.10.2026 – 23.04.2027** — не просрочен, имя совпадает.
  Ошибка `unable to get local issuer certificate (20)` / `unable to verify the first certificate (21)`: сервер отдаёт **только лист,
  без промежуточного** → **неполная цепочка**. Это не повод отключать проверку и не повод пропускать источник.
- **Решение:** промежуточный CA взят по адресу AIA из самого сертификата (`http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt`),
  SHA-256 `8C:54:C3:34:…:A5:A4:EF:22:E0`, выдан корнем **Sectigo Public Server Authentication Root R46** (есть в стандартном хранилище),
  действует до 21.03.2036. `openssl verify -untrusted int.pem leaf.pem` → OK. В ленте он **закреплён по отпечатку** и добавляется
  к стандартному хранилищу Node (`tls.setDefaultCACertificates`), проверка цепочки до корня, дат и имени остаётся — тест на сервере:
  без промежуточного `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, с ним 200, `expired.badssl.com` по-прежнему `CERT_HAS_EXPIRED`.
- **API:** `https://resultadosquiniela.cajapopular.gov.ar/api/extracto/?fecha_sorteo=YYYY-MM-DD` → `[{id, sorteo, tipo, tipo_detalle,
  fecha_sorteo, estado, fecha_creacion, caducidad_*}]`; `…/api/extracto-registro/?id=N` → 20 строк `{posicion 0–19, numero}`;
  `…/api/tipo-sorteo/` → MATUTINO 11:30, VESPERTINO 14:30, DE LA SIESTA 17:30, DE LA TARDE 19:30, NOCTURNO 22:00 (и тип 11 NOCTURNO 20:00).
  Других игр в API нет (в бандле только extracto, registro, tipo, imagen, publicación, autoridades, escribano, incidente, parámetros).
- **Порядок мест:** официальная страница выводит «k° Premio» = элемент массива по порядку (массив приходит по убыванию `posicion`), т. е.
  место k = `posicion` k−1. Лента требует строго убывающий порядок, иначе стоп. Число < 1000 дополняется нулями (189 → 0189).
- **Время:** Nocturno 03.11 загружен в 22:24 (через ~24 мин). **robots.txt:** поддомен отдаёт SPA (HTML вместо robots) — правил нет;
  главный `cajapopular.gov.ar` с сервера — таймаут. **Риск:** средний — одна копия (никто из официальных не перепубликует Tucumán),
  смена CA у сайта (лента напишет ошибку). Проверка: 20 мест, известный тип, дата = запрошенная, номера тиража растут по турно.

## 2. Quini 6 и Brinco (Lotería de Santa Fe)

- `loteriasantafe.gov.ar` и `www.` — **403** с сервера (Великобритания) на всё, включая robots.txt → **гео-блок, не обходим**.
- `www.quini6.com.ar` — **526** (Cloudflare: сертификат источника недействителен) — не используем.
- Перепубликация: **San Juan CAS** `cas.gob.ar/juegos/sorteos/resultados?juego=quini6|brinco[&fecha=D]` — серверный HTML, карточки
  модальностей (Tradicional, Segunda Vuelta, Revancha, Siempre Sale; Brinco — Tradicional, Junior), robots 404. **Отстаёт:** 04.11 последний
  Quini 6 — 3421 от 28.10 (01.11 нет), Brinco — 1377 от 25.10 (01.11 нет); в истории CAS есть пропуски дат. Поэтому в ленте `behind`/
  `expected`, страница обязана писать «pendiente de publicación oficial».
- Проверены как возможные копии: **Chaco** и **Misiones** — только ссылки на сайт Santa Fe; **Caja Social Santiago** — только pozo;
  **Entre Ríos IAFAS** — API с JWT в публичном JS (не используем, как и раньше); Córdoba, Río Negro — robots запрещает ИИ.
- **Риск:** высокий по свежести, низкий по точности (официальная копия). Идея на будущее: владелец сохраняет страницу Santa Fe из браузера
  (`docs/reference/owner-saves/`) — для регламента и цены, не для ленты.

## 3. Telekino и Loto Plus

- **Telekino:** `www.telekino.com.ar/` (Blazor, первая отдача — серверный HTML): номер и дата тиража (`fontSize1`), 15 номеров Telekino
  (`tamNumTelekino*`) и 15 Rekino (`fontSizeRekino*`), следующий тираж и цена. robots 404. Оператор на сайте не назван («Telekino y Rekino
  son marcas registradas»). **В выписках PBA (IPLyC) Telekino нет:** `api-loteria/extractos/YYYY-MM-DD` за 03.11 — только Quiniela по
  турно, QuinielaPlus и `extOfQuiniela2T_*`; за воскресенье 01.11 — «No hay extractos para los días domingos». Копия — CAS `?juego=telekino`
  (совпала, тираж 2452 от 01.11). Риск: низкий.
- **Loto Plus:** оператор — LOTBA; `loto.loteriadelaciudad.gob.ar/includes/resultados-data.php?sorteo=N` — `RESULTADOS_DATA` (Tradicional,
  Match, Desquite, Sale o Sale, Número Plus) + `PREMIOS_DATA` (pozo, ganadores, premio_unid, ссылки на PDF/XML/SHA экстракта). Номер — со
  страницы игры (`resultados-data.php?sorteo=3931`). В JSON кинелы LOTBA Loto Plus нет (это отдельный поддомен). Копия CAS `?juego=loto`
  совпала (3931 от 31.10, 3930 от 28.10). robots 404. Риск: низкий.

## 4. Кинела по провинциям

| Юрисдикция (запрос) | Официальный источник | Доступ с сервера / robots | Решение |
|---|---|---|---|
| **Tucumán** (546k) | Caja Popular API (выше) | 200 с промежуточным CA; robots — нет правил | **лента** |
| **San Juan** (113k) | CAS `cas.gob.ar/?fecha=D` — блоки «SORTEO VESPERTINO N° 7413 03/11/2026», 1°–20° | 200; robots 404 | **лента** (03.11: Vespertino, Tarde, Nocturno) |
| **Chaco** (100k) | `loteria.chaco.gov.ar/ver_extracto/DD-MM-YYYY/PRE\|PRI\|MAT\|Ves\|NOC` — таблица Prov. Bs As, Ciudad Bs As, Chaqueña, Correntina, Cordoba; ссылка на «extracto oficial» (jpg) | 200; robots 404 | **лента** |
| **Corrientes** (106k) | 1) копия в таблице Chaco; 2) свой сайт `loteriacorrentina.gob.ar` (Wix): кнопка «consultar extractos» ведёт на `cnq.lotemovil.com.ar` (с сервера — таймаут), и xlsx «Descargar últimos extractos para medios» (`/_files/ugd/…EXTRACTO NOCTURNO.xlsx`, файл перезаписывается: внутри Nocturna 03.11 — Correntina 4783, Ciudad 6760, Provincia 3407, Córdoba 6537, Chaqueña 8823 …) | Chaco — 200; Wix robots разрешает | **лента через Chaco**; xlsx — кандидат во **вторую копию Nocturna** (нужен разбор xlsx, не сделано) |
| **Misiones** (66k) | `loteriademisiones.com.ar/portal/juegos/quiniela-<la-previa\|primera-matutina\|matutina\|vespertina\|nocturna>/` — последний тираж; колонки Misionera (+ Plus), LOTBA, Provincia, Santa Fe; дата — форма POST | 200 (Cloudflare-проверки 04.11 не было); robots: `*` Allow, `ClaudeBot` — группа без запретов, `ai-input=yes`, запрет `/*?`; llms.txt прямо предлагает ИИ брать результаты с этих страниц | **лента** (только GET без `?`) |
| Catamarca (115k) | официальный сайт с выписками не найден (capresca.gob.ar — NXDOMAIN; catamarca.gob.ar — 403) | — | нет |
| Formosa (120k) | IAS `www.ias.gob.ar` — http 301 на https, https — таймаут с сервера | недоступен | нет |
| Salta | `enrejasalta.com.ar` — robots запрещает ClaudeBot/GPTBot; `loteriadesalta.com` — 403 | запрет/блок | нет (правило TRAPS) |
| Neuquén | `ijan-neuquen.com` — robots запрещает ClaudeBot/GPTBot | запрет | нет (правило TRAPS) |
| Río Negro, Córdoba | robots запрещает ИИ (как 03.11) | запрет | нет |
| Santa Fe, Mendoza | гео-блок / таймаут | — | кинела — из LOTBA/PBA (лента `quiniela`) |
| Entre Ríos | IAFAS API с JWT из публичного JS | — | из LOTBA/PBA (как было) |

## 5. Tómbolas

- **Santiagueña** (151k): Caja Social `cajasocialsde.gob.ar` — **только http** (https — таймаут), robots 404. На главной — блок последнего
  тиража Tómbola (дата, номер 16690, турно-буква `N`, 20 номеров в таблице 4×5) и Lotería Santiagueña; полная консультация —
  `sde.lotemovil.com.ar` (с сервера таймаут). **Не сделано:** только последний тираж, порядок мест в таблице 4×5 (по строкам или по
  столбцам) не подтверждён официальным текстом, без https и без второй копии. Если владелец захочет — сначала подтвердить порядок мест
  (регламент Tómbola: `cajasocialsde.gob.ar` → «Descargar Reglamento») и только потом лента «последний тираж» с честной пометкой.
  На странице tómbola — выплаты (7/70/500–600/3000 veces, тоpe 1000 veces) и часы (Previa 10:15, Matutina 12:00, Vespertina 15:00,
  Tardecita 19:45, Nocturna 22:15; воскресенье 11:30 и 14:00) — годятся для `/tombola/santiaguena/` с цитатой.
- **Jujeña** (61k): оператор по прессе — Banco de Acción Social (адрес сайта не найден); регулятор INPROJUY `inprojuy.gob.ar` (SPA,
  robots `Disallow:` пусто) — выписок нет, зато есть `download/reglamento-tombola.pdf` и «Procedimiento-Sorteos-Tombola-Inprojuy.pdf»
  (для правил/страницы без результатов). **Нет ленты.**

## 6. Кто кого перепубликует (для сверки)

- **Chaco:** Provincia, Ciudad, Córdoba, Correntina (+ своя). → Córdoba получила **третью** официальную копию (вместе с LOTBA и PBA; в ленте
  `provincias` используется как проверка).
- **Misiones:** LOTBA, Provincia, Santa Fe (в Previa/Primera/Vespertina) (+ своя и Plus).
- **Corrientes xlsx:** Nocturna Correntina, Ciudad, Provincia, Córdoba, Chaqueña, Entre Ríos и др.
- **San Juan CAS:** Loto Plus, Telekino, Quini 6, Brinco; разделы «Lotería de Córdoba / de la Ciudad / de la Provincia» (не смотрели).
- **Caja Social Santiago:** продаёт Quini 6, Telekino, Loto Plus, Loto 5 — результатов не показывает (только pozo).

## 7. Найдено попутно (для других страниц)

- Misiones: «Los Sueños y los Números» `loteriademisiones.com.ar/portal/juegos/los-suenos-y-los-numeros/` и Chaco `/suenios` — **официальные**
  таблицы значений чисел (HANDOFF: для `/quiniela/significado-de-los-numeros/` «официального источника нет» — теперь есть, robots разрешает).
- Misiones: «Días y horarios de sorteos», «Escala de apuestas», «Reglamentos e instructivos»; Chaco `/horarios` (часы турно = сетка LOTBA).
- Tucumán: в `extracto` есть сроки годности билетов (`caducidad_quiniela` 10 дней, `caducidad_triplona` 2 дня, `caducidad_cuatriplona`).
- Corrientes: «Programa de Sorteos Quiniela / Poceada / Al Toque» и регламенты — кнопки на `/juegos/quiniela`.

## 8. Какие страницы можно строить сейчас

`/quiniela/tucuman/`, `/quiniela/san-juan/`, `/quiniela/chaco/`, `/quiniela/corrientes/`, `/quiniela/misiones/` — из `provincias.json`
(архив — `provincias-archivo.json`); `/loto-plus/`, `/telekino/` (и `controlar`) — из `loterias.json` с пометкой «2 fuentes»;
`/quini-6/`, `/brinco/` — из `loterias.json` **только с честным `behind`** («el último sorteo publicado oficialmente es el N° … del …;
el del … está pendiente»). Catamarca, Formosa, Salta, Neuquén, Jujuy, Santiago — без результатов (или правила/часы с цитатой).
