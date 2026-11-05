# Страницы, которые сохраняет владелец из своего браузера (casaslegales.com)

Зачем. Сайты регуляторов Córdoba, Neuquén, Río Negro и Salta в `robots.txt` запрещают ClaudeBot и другие ИИ-краулеры
(для `*` разрешено). Агенты 01–03.11 скачали их по разу — так больше не делаем (`docs/TRAPS.md`, 03.11). Факты на сайте
остаются (цитаты сверены с этими копиями), но каждая такая копия помечена `pendingOwnerCopy: true` и **больше не перекачивается**
(`verify-sources --recheck` и `verify-rg --recheck` её пропускают). Santa Fe и Mendoza закрыты гео-блоком (из Польши 403/timeout),
обходить не стали — нужен браузер из Аргентины.

Сборка casaslegales печатает актуальный список «owner copies pending» с числом оставшихся дней. Копия владельца годится **180 дней**
(решение владельца 04.11; правило в одном месте — `tools/lib/copyage.mjs`): HCDN и ley 8986 (копии 01.11) истекают **30.04.2027**,
Рío Negro ×3 (03.11) — **02.05.2027**, 16 копий из Chrome владельца (05.11) — **04.05.2027**. Telegram-напоминание придёт **09.04.2027** (за 21 день до первого срока) одним списком
вместе с обзорами и операторами; дальше — раз в полгода. Страницы, которые сервер качает сам, живут 100 дней и обновляются им каждый месяц.

## 05.11.2026 — снято в Chrome владельца (папка `2026-11-05/`)

По решению 04.11 агент открыл страницы **в Chrome владельца** (VPN с выходом в Аргентине, видимая вкладка, владелец смотрел),
перед каждым сайтом прочитав robots.txt: Córdoba, Neuquén, Salta запрещают только боты обучения (ClaudeBot, anthropic-ai, Claude-Web),
`*` — Allow; у loteriadecordoba.com.ar без www robots — 404; loteriasantafe.gov.ar, cajapopular.gov.ar — без запретов для `*`;
santafe.gob.ar, ipjyc.gob.ar, mendoza.gob.ar — robots 404 (= можно). Входа, форм, CAPTCHA не было.

Сохранено **16 страниц** (`copiedBy: "owner-browser"`, `fetched` 2026-11-05, годны до **04.05.2027**): `cba-juegos-online`,
`ar-x-loteria-juego-responsable`, `neu-juego-legal`, `neu-casinos`, `ar-q-ijan-juego-responsable`, `sal-enreja-juego-autorizado`,
`ar-a-enreja-jr`, `santa-fe-plataformas`, `santa-fe-inicio`, `santa-fe-juego-responsable`, `santa-fe-juego-compulsivo`,
`santa-fe-historia`, `mendoza-plataformas`, `ar-m-ipjyc-juego-responsable`, `tuc-caja-popular-inicio`,
`ar-t-caja-popular-juego-responsable`. Копия — не вся страница, а DOM после отрисовки: блоки с цитатами и списком (у блока списка
атрибуты как на странице, у остальных оставлен только `href`; ссылки абсолютные, как их разрешает Chrome), без скриптов, стилей и
картинок; в `<head>` — `<title>`, canonical, `source-url`, время копии (`copied`) и `copied-by`. Для `noBetAr` (Salta, главная Caja
Popular) — весь `body` (и проверено, что во всём DOM нет `.bet.ar`). sha256 каждой копии сверен в браузере и на диске.
Все цитаты на месте; **списки не изменились**: Córdoba 4, Neuquén 5 + La Neuquina, Santa Fe 4 адреса, Mendoza 7.

**Остаются только за владельцем (руками, Ctrl+U → Ctrl+S):** Río Negro ×3 (`rne-inicio`, `rne-rionegrina-online`,
`ar-r-loteria-autoexclusion` — robots явно запрещает Claude-User; копии 03.11, до 02.05.2027), HCDN `ar-hcdn-media-sancion-2024-11-27`
(robots запрещает Claude-Code; копия 01.11 ждёт копию владельца, до 30.04.2027) и `ar-t-ley-8986` (PDF; robots.txt e-legis 05.11 и из
Аргентины отвечает 500 — по правилу «5xx = нельзя», не открывали; до 30.04.2027).

Как повторить: robots.txt сайта (Claude-User и Claude-Code для пути; запрет → стоп) → страница в видимой вкладке → блоки по цитатам и
шаблону списка из `data/sources` → файл `2026-11-05/<имя>.html` → `node tools/owner-copy.mjs <имя> <файл> --date <дата> --by owner-browser`
(сначала без `--write`) → `npm test`. Копии jugadadeldia (`data/sources/lottery/online.json`) `owner-copy.mjs` обновляет сам.

## Что сохранить

Имя файла = метка в скобках (slug). Córdoba, Neuquén, Río Negro, Salta открываются из любой страны; Santa Fe и Mendoza — только из Аргентины.

| Провинция | Адрес | Имя файла | Что на странице |
|---|---|---|---|
| Córdoba | https://loteriadecordoba.com.ar/juegos/online | `cba-juegos-online` | список «Sitios oficiales de juego online» (4 сайта) |
| Córdoba | https://www.loteriadecordoba.com.ar/juego-responsable | `ar-x-loteria-juego-responsable` | линия 0800-777-2983, 18+ |
| Neuquén | https://ijan-neuquen.com/juego_legal.php | `neu-juego-legal` | «Juego legal», La Neuquina Online |
| Neuquén | https://ijan-neuquen.com/casinos.php | `neu-casinos` | таблица «CASINOS ONLINE PERMITIDOS» |
| Neuquén | https://ijan-neuquen.com/juego_responsable.php | `ar-q-ijan-juego-responsable` | помощь, автоисключение |
| Río Negro | https://www.loteriaderionegro.gob.ar/ | `rne-inicio` | главная: блок «Jugá online en los sitios autorizados» |
| Río Negro | https://www.loteriaderionegro.gob.ar/la-rionegrina-online | `rne-rionegrina-online` | La Rionegrina Online |
| Río Negro | https://www.loteriaderionegro.gob.ar/juego-responsable/autoexclusion | `ar-r-loteria-autoexclusion` | автоисключение |
| Salta | https://www.enrejasalta.com.ar/ja.php | `sal-enreja-juego-autorizado` | «Juego autorizado», ley 7020 |
| Salta | https://www.enrejasalta.com.ar/jr.php | `ar-a-enreja-jr` | juego responsable |
| Santa Fe | https://www.loteriasantafe.gov.ar/ | `santa-fe-inicio` | главная Lotería de Santa Fe |
| Santa Fe | https://www.loteriasantafe.gov.ar/casinos/ | `santa-fe-plataformas` | список «CASINOS ONLINE» + «APUESTAS DEPORTIVAS» (4 адреса .bet.ar) |
| Santa Fe | https://www.loteriasantafe.gov.ar/juego-responsable-3/ | `santa-fe-juego-responsable` | линия APRECOD, автоисключение |
| Santa Fe | https://www.santafe.gob.ar/ms/juegocompulsivo/ | `santa-fe-juego-compulsivo` | линия APRECOD |
| Mendoza | https://www.ipjyc.gob.ar/JEL/ (сайт «Juego En Línea Mendoza» IPJyC) | `mendoza-plataformas` | блок «PLATAFORMAS DE JUEGO EN LÍNEA» (7 адресов .bet.ar) |
| Mendoza | страница автоисключения IPJyC (меню «Juego responsable» → «Autoexclusión») | `mendoza-autoexclusion` | срок, как подать |
| Nación | https://www.hcdn.gob.ar/prensa/noticia/OBTUVO-MEDIA-SANCION-UN-PROYECTO-DE-PREVENCION-DE-LUDOPATIA-Y-REGULACION-DE-LAS-CIBERAPUESTAS/ | `ar-hcdn-media-sancion-2024-11-27` | новость Diputados о media sanción (27.11.2024); robots.txt закрыт для ИИ (найдено сервером 04.11) |
| Mendoza | https://www.mendoza.gob.ar/juegosycasinos/juego-responsable/ | `ar-m-ipjyc-juego-responsable` | линия (0261) 424-7536, WhatsApp, RUAM (автоисключение 3 месяца – 5 лет); серверу отвечает 403 — из Аргентины |
| Tucumán | https://www.cajapopular.gov.ar/ | `tuc-caja-popular-inicio` | главная Caja Popular (жалобы на нелегальную игру); сервер не может подключиться (таймаут) — из Аргентины |
| Tucumán | https://www.cajapopular.gov.ar/index.php/1249-2/ | `ar-t-caja-popular-juego-responsable` | juego responsable Caja Popular; тот же таймаут — из Аргентины |
| Tucumán | https://e-legis-ar.msal.gov.ar/htdocs/legisalud/migration/pdf/28536.pdf | `ar-t-ley-8986` | **сам PDF** закона 8986 («Сохранить как», файл `ar-t-ley-8986.pdf`): автоисключение «seis (6) meses»; robots.txt отвечает 500 (по правилам robots — нельзя), другой официальной копии текста не нашли |

**Четыре последние строки (04.11):** раньше их качал сервер, 04.11 он их не открыл: `cajapopular.gov.ar` — таймаут подключения
из Великобритании (это не TLS: у www-сайта цепочка Let's Encrypt, она проверяется; закреплённый промежуточный Sectigo DV R36 из ленты
`provincias` относится к `resultadosquiniela.cajapopular.gov.ar` и здесь не помогает), mendoza.gob.ar — 403, e-legis — robots 500.
Обходить не стали; теперь это копии владельца (`refresh: "manual"`, 180 дней, сервер их не качает).

Если адрес из таблицы открывается не на ту страницу — сохранить ту, где есть нужное, и записать её адрес в `urls.txt`
(строка: `имя-файла адрес`). Для Santa Fe и Mendoza `urls.txt` нужен всегда.

## Что уже пришло (03.11.2026, папка `2026-11-03/`)

Встали на место (`copiedBy: "owner"`, следующее сохранение — до 02.05.2027): `rne-inicio`, `rne-rionegrina-online`,
`ar-r-loteria-autoexclusion`, `sal-enreja-juego-autorizado`, `ar-a-enreja-jr`, `neu-casinos`, `neu-juego-legal`,
`ar-q-ijan-juego-responsable`, `ar-x-loteria-juego-responsable` (файл назывался «Loteria _ Juegos», внутри — страница juego-responsable),
`mendoza-ipjyc-inicio`. Списки Río Negro (3) и Neuquén (6) не изменились. Mendoza: на главной списка .bet.ar нет — статус
«sin dato verificado»; там есть плитка-ссылка на **https://ipjyc.gob.ar/wp/** — её сохранить следующей (`mendoza-plataformas`, вероятно там список).

Santa Fe (вторая выгрузка): `santa-fe-inicio`, `santa-fe-juego-compulsivo`, `santa-fe-historia`, `santa-fe-resena-de-juegos`. На главной
Лотереи .bet.ar нет — статус «sin dato verificado»; линия APRECOD 0800-268-5640 и регулятор теперь из живых копий (не Wayback).
Сайт Лотереи переделан: старый адрес `index.php/juego-responsable` теперь, судя по меню, `/juego-responsable-3/`.

Третья выгрузка (03.11, папка `3333/`, разобрана и удалена; файлы — в `2026-11-03/`, адреса — `urls.txt`):
- `cba-juegos-online` — теперь та самая страница со списком Córdoba (4 сайта, не изменился); шаблон списка допускает `/` на конце (Chrome).
- `santa-fe-plataformas` (/casinos/) — **официальный список**: CASINOS ONLINE 2 + APUESTAS DEPORTIVAS 4 = 4 адреса; Santa Fe →
  `data/sources/registries/santa-fe.json`, «lista oficial verificada». Копия главной (`santa-fe-inicio`) переехала туда же (цитата о несовершеннолетних).
- `santa-fe-juego-responsable` (/juego-responsable-3/) — автоисключение и вторая цитата линии APRECOD теперь из живой копии (Wayback 2025 удалён).
- «Juego en Línea _ Sitio de Juego en Línea» — это **ipjyc.gob.ar/JEL/**, сайт игры в линии IPJyC Mendoza: `mendoza-plataformas`,
  **официальный список 7 платформ** → `data/sources/registries/mendoza.json`, «lista oficial verificada». Копия главной IPJyC больше не нужна (удалена из данных).

**Ещё нужно:** Mendoza — `mendoza-autoexclusion` (меню IPJyC «Juego responsable» → «Autoexclusión»; сейчас автоисключение из
`ar-m-ipjyc-juego-responsable`); PDF к копиям — желательно. Дальше все копии владельца — пересохранять раз в полгода (180 дней, до 02.05.2027).

Сохранено было «Веб-страница полностью» (DOM после браузера: ссылки стали абсолютными, у пустых атрибутов `=""`). Это тоже годится:
цитаты сверяются по видимому тексту, а HTML-доказательства строк списка агент берёт дословно из присланной копии. Но `view-source`
(Ctrl+U → Ctrl+S) по-прежнему лучше — без папок `_files`.

## Как сохранить (Chrome на компьютере)

Для каждой страницы — **два файла**:
1. **Исходный код (.html) — главное.** Открыть страницу, дождаться загрузки, нажать **Ctrl+U** (откроется `view-source:`),
   затем **Ctrl+S** → тип «Веб-страница, только HTML» → имя `<имя-файла>.html`. Именно этот файл сверяется побайтно с цитатами;
   «Сохранить как → полностью» и MHTML не годятся (браузер переписывает код).
2. **PDF — доказательство, как страница выглядела.** На обычной вкладке **Ctrl+P** → «Сохранить как PDF» → `<имя-файла>.pdf`
   (в настройках печати оставить «Колонтитулы» — там дата и адрес).

Ничего не нажимать на странице (вход, регистрация, «Jugar»), cookie-баннер можно закрыть или не трогать.
Положить всё в папку `docs/reference/owner-saves/<дата сохранения ГГГГ-ММ-ДД>/` (или прислать файлы в чат — агент разложит).

## Как копия встаёт на место (делает агент)

1. `node tools/owner-copy.mjs <имя-файла> docs/reference/owner-saves/<дата>/<имя-файла>.html --date <дата>` — показывает, что
   поменяется; с `--write` кладёт файл на место нашей копии (во всех наборах, где он есть: реестр, провинции, пакет помощи,
   операторы), пересчитывает sha256, ставит `fetched` = дата сохранения, `copiedBy: "owner"` и снимает `pendingOwnerCopy`.
2. `npm test` и сборка. Если регулятор за это время что-то поменял (цитата или список сайтов), проверки покажут что именно —
   агент правит данные по сохранённой странице, не подгоняя цитату. Страница из списка напоминаний исчезает.
3. Santa Fe и Mendoza: по сохранённому списку агент заводит `data/sources/registries/santa-fe.json` / `mendoza.json` (цитаты,
   HTML-доказательство каждой строки, полнота списка), убирает провинцию из `data/sources/provinces/provinces.json` («no consultable»)
   и добавляет её в `SITE.registries` — статус на сайте меняется на «lista oficial verificada» сам. Копии из Wayback для Santa Fe
   заменяются живыми.
4. Коммит файлов из `owner-saves/` и данных, выкладка `bash tools/deploy.sh casaslegales`.

Новые копии с сайтов из этого списка агенты не качают никогда — ни скриптом, ни WebFetch. Проверка `verify-sources` падает,
если в данных появится документ с такого сайта без пометки `pendingOwnerCopy` или `copiedBy: "owner"`.
