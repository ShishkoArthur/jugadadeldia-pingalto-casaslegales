# Страницы, которые сохраняет владелец из своего браузера (casaslegales.com)

Зачем. Сайты регуляторов Córdoba, Neuquén, Río Negro и Salta в `robots.txt` запрещают ClaudeBot и другие ИИ-краулеры
(для `*` разрешено). Агенты 01–03.11 скачали их по разу — так больше не делаем (`docs/TRAPS.md`, 03.11). Факты на сайте
остаются (цитаты сверены с этими копиями), но каждая такая копия помечена `pendingOwnerCopy: true` и **больше не перекачивается**
(`verify-sources --recheck` и `verify-rg --recheck` её пропускают). Santa Fe и Mendoza закрыты гео-блоком (из Польши 403/timeout),
обходить не стали — нужен браузер из Аргентины.

Сборка casaslegales печатает актуальный список «owner copies pending» с числом оставшихся дней: копия годится 100 дней
(первые истекают **09.02.2027**, остальные **11.02.2027**). Сохранить лучше до **конца января 2027**; дальше — раз в 3 месяца.

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
| Santa Fe | страница со списком разрешённых онлайн-платформ — найти в меню («Juego online», «Plataformas autorizadas», «Juego legal») | `santa-fe-plataformas` | список сайтов .bet.ar |
| Santa Fe | https://www.loteriasantafe.gov.ar/index.php/juego-responsable | `santa-fe-juego-responsable` | сейчас у нас только копия из Wayback 2025 |
| Santa Fe | https://www.santafe.gob.ar/ms/juegocompulsivo/ | `santa-fe-juego-compulsivo` | сейчас только Wayback 2026 |
| Mendoza | https://www.mendoza.gob.ar/juegosycasinos/ | `mendoza-ipjyc-inicio` | главная IPJyC |
| Mendoza | страница со списком разрешённых онлайн-платформ — найти в меню IPJyC («Juego online», «Plataformas autorizadas», «Juego legal») | `mendoza-plataformas` | список сайтов .bet.ar |
| Mendoza | страница автоисключения IPJyC (меню «Juego responsable» → «Autoexclusión») | `mendoza-autoexclusion` | срок, как подать |

Если адрес из таблицы открывается не на ту страницу — сохранить ту, где есть нужное, и записать её адрес в `urls.txt`
(строка: `имя-файла адрес`). Для Santa Fe и Mendoza `urls.txt` нужен всегда.

## Что уже пришло (03.11.2026, папка `2026-11-03/`)

Встали на место (`copiedBy: "owner"`, следующее сохранение — до ~09.02.2027): `rne-inicio`, `rne-rionegrina-online`,
`ar-r-loteria-autoexclusion`, `sal-enreja-juego-autorizado`, `ar-a-enreja-jr`, `neu-casinos`, `neu-juego-legal`,
`ar-q-ijan-juego-responsable`, `ar-x-loteria-juego-responsable` (файл назывался «Loteria _ Juegos», внутри — страница juego-responsable),
`mendoza-ipjyc-inicio`. Списки Río Negro (3) и Neuquén (6) не изменились. Mendoza: на главной списка .bet.ar нет — статус
«sin dato verificado»; там есть плитка-ссылка на **https://ipjyc.gob.ar/wp/** — её сохранить следующей (`mendoza-plataformas`, вероятно там список).

Santa Fe (вторая выгрузка): `santa-fe-inicio`, `santa-fe-juego-compulsivo`, `santa-fe-historia`, `santa-fe-resena-de-juegos`. На главной
Лотереи .bet.ar нет — статус «sin dato verificado»; линия APRECOD 0800-268-5640 и регулятор теперь из живых копий (не Wayback).
Сайт Лотереи переделан: старый адрес `index.php/juego-responsable` теперь, судя по меню, `/juego-responsable-3/`.

**Ещё нужно:** `cba-juegos-online` (https://loteriadecordoba.com.ar/juegos/online — прислана была другая страница);
Santa Fe — `santa-fe-plataformas` (вероятно https://www.loteriasantafe.gov.ar/casinos/), `santa-fe-juego-responsable`
(https://www.loteriasantafe.gov.ar/juego-responsable-3/ — там автоисключение; сейчас оно из Wayback 2025);
Mendoza — `mendoza-plataformas` (ipjyc.gob.ar/wp/), `mendoza-autoexclusion`. PDF не пришли — желательно.

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
