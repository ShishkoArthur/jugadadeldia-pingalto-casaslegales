# Аудит pingalto.com — 04.11.2026

Задание владельца 04.11 («полный аудит трёх сайтов», DECISIONS): интент страниц, ответы на «cómo», корректность чисел,
уровень blackjack.cab, новичок/эксперт, ключи, title, UX. Проверено: 47 живых страниц (тексты сборки + инструменты в браузере),
ключи `node docs/research/kw-audit/kwaudit2.mjs pingalto 'dota_cs2|matching-pa-' out.json` до и после правок.
Итог выложен 04.11 (было 47 страниц, стало 49 + 404).

## 1. Ключи

Дано: **499 ключей, 1 241 450 показов/мес.** (Ahrefs AR, три выгрузки). Из них в план страниц попали 133 ключа (713 750).

| | До аудита | После |
|---|---|---|
| Ключ на построенной странице | 80 · 422 000 | **83 · 598 000** |
| …и title/H1 его покрывает (≥ 80 % слов) | 58 · 370 200 | **66 · 561 400** |
| …но title не покрывает | 22 · 51 800 | 17 · 36 600 |
| В плане, страница не построена | 53 · 291 750 | 50 · 115 750 |
| Вне плана | 366 · 527 700 | 366 · 527 700 |

**Раскрыты целиком (крупные):** fortnite 104k (новый хаб /fortnite), free fire 69k (/ff дополнен), free fire max 58k (новая /ff/max),
brawl stars 44k, lol + league of legends 38k, nombres para free fire 31k (кластер), tier list 29k, clash royale 27k, valorant 21k,
xbox cloud gaming fortnite и кластер 19k, rocket league 17k, counter strike 9,2k + counter strike 2 2,6k + cs2 2,4k (/cs2 стал хабом
игры), ascent 9,1k, split 6,4k, sensibilidad para free fire 6,3k, códigos free fire 7k, personajes de brawl stars 2,8k (title исправлен),
rangos lol/valorant, major cs2, miras cs2 + crosshair cs2 (title исправлен), dpi analyzer (title исправлен).

**Частично и почему:**
- **valorant tracker 12k** (/valorant) — людям нужна статистика игрока; у Riot это только по production-ключу (заявка на продукт).
  Title не обещает трекер — честно. Без ключа не сделать.
- **fifa 26 / fc 26 / ea sports fc 26 ≈ 21k** (/eafc) — интент «сама игра». Уже вышла FC 27 (Steam: 24 сен 2026), поэтому
  страница теперь «EA Sports FC 27 desde Argentina»: цена и требования из Steam AR + esports. Консоли и цены EA — нет (robots EA
  запрещает ботов).
- **fortnite gg 14k** — навигационный (сайт fortnite.gg); хаб /fortnite отвечает на «как играть», но не заменяет их трекер/карту.
- **counter strike 1.6 7,9k + descargar 4,7k** — отдельной /cs16 нет; на /cs2 блок «¿Y Counter-Strike 1.6?»: официальная копия
  только в Steam, US$ 5,69 (ficha AR), требования. «Скачать бесплатно» не даём (неофициальные файлы).
- **dota 2 4,6k** (/dota2) — title «Ranking de equipos de Dota 2»: интент «игра». Нужно то же, что с CS2 (Steam appdetails 570) — см. §6.

**Не обработаны и почему:**
- **fortnite tracker 53k** — fortnite-api.com отдаёт статистику только с ключом (проверено: 401 «invalid or missing api key»);
  ключ выдаётся в dash.fortnite-api.com после входа через Discord — **регистрацию делает владелец**, ключ — в `.env`. Сервис
  неофициальный («not endorsed by Epic Games»). Нужен серверный прокси с кэшем (ключ не в браузер).
- **tienda/shop de Fortnite ≈ 13k, fortnite skins, pavos** — витрина скинов и цен: правило сайта «sin skins, sin cajas» (PLAYBOOK §1.2).
- **fortnite temporada 2,7k, rangos** — fortnite.com и epicgames.com отвечают 403; даты с чужих сайтов не копируем.
- **miras valorant 1,9k + valorant crosshair 1,5k** — формат кода прицела Valorant Riot не публикует; сообщество описывает частично,
  проверить в клиенте не можем.
- **tier list lol / meta lol ≈ 7k** — нужен ключ Riot или источники, закрытые для ИИ.
- **free fire advance / servidor avanzado 5,4k** — есть официальный сайт ff-advance.ff.garena.com; не разобран в этот раз (§6).
- **mobile legends 2,2k, rocket league sideswipe 2,5k, free fire india 1,7k** — P3 без аргентинского угла.
- **Вне плана 527k:** в основном чужой интент или запрет: «que salio en la quiniela» (это jugadadeldia, не наш сайт), diamantes/
  recarga/centro de recarga FF ≈ 50k (донат — запрет), rule 34/porno ≈ 15k (нет), логотипы (valorant logo png — марки), APK.

## 2. Соответствие интенту и title (по спросу, страницы с ключами)

| Страница | Спрос | Главные ключи | Title (длина) | Вердикт |
|---|---|---|---|---|
| /fortnite | 118 000 | fortnite 104k · fortnite gg 14k | Fortnite en Argentina: cómo jugarlo gratis en cada aparato (58) | **новая**: интент «как играть/скачать» — выбор устройства, магазины, облако |
| /ff | 69 000 | free fire 69k | Free Fire en Argentina: descarga, MAX, sensibilidad y más (57) | было 166 слов ссылок → факты партии, официальная загрузка, хакеры |
| /ff/max | 58 000 | free fire max 58k | Free Fire MAX en Argentina: qué cambia y si podés bajarlo (57) | **новая**: что такое MAX, есть ли в магазинах AR, что выбрать |
| /brawl | 44 000 | brawl stars | Brawl Stars en Argentina: brawlers, meta y eventos (50) | ок |
| /lol | 38 000 | lol · league of legends | LoL en Argentina: campeones por rol y rangos de LAS (51) | ок; нет «cómo empezar» (§6) |
| /valorant | 33 000 | valorant · valorant tracker ⚠ | Valorant en Argentina: rangos, agentes, mapas y servidor (56) | ок для «valorant»; tracker — без ключа Riot нет |
| /ff/nombres | 31 100 | nombres para free fire | Nombres para Free Fire: generador con letras y símbolos (55) | ок |
| /tier-list | 29 000 | tier list · tier list maker | Tier list maker: armá tu tier list de cualquier juego (53) | ок |
| /clash | 27 000 | clash royale | Clash Royale en Argentina: mazos, cartas y meta (47) | ок |
| /eafc | 22 700 | fc 26 · fifa 26 ⚠ | EA Sports FC 27 desde Argentina: requisitos en PC y esports (59) | было «esports»; добавлены цена и требования FC 27 из Steam |
| /fortnite/nube | 19 300 | xbox cloud gaming fortnite | Fortnite en Xbox Cloud desde Argentina: datos e internet (56) | ок |
| /rl | 17 000 | rocket league | Rocket League en Argentina: RLCS, campeones y argentinos (56) | интент «игра», страница — esports; источника требований нет (Epic 403) |
| /cs2 | 14 200 | counter strike · counter strike 2 · cs2 | Counter-Strike 2 (CS2) desde Argentina: requisitos y ranking (60) | было «Ranking de CS2 de Valve» → **хаб игры**: «¿te corre?», загрузка, серверы, 1.6; рейтинг — раздел |
| /valorant/mapas/ascent | 9 100 | ascent valorant | Ascent en Valorant: callouts en español y mapa interactivo (58) | ок |
| /ff/sensibilidad | 8 000 | sensibilidad para free fire | Sensibilidad para Free Fire: calibrá la tuya paso a paso (56) | ок («generador» — честно: калибратор, не генератор) |
| /valorant/agentes | 7 000 | valorant new agent abilities (англ.) | Agentes de Valorant: habilidades y roles en español (51) | ок по сути |
| /ff/codigos | 7 000 | códigos free fire (hoy) | Códigos de Free Fire: cómo canjearlos sin caer en estafas (57) | «hoy» не даём (нет официального списка) — честно |
| /valorant/mapas/split | 6 400 | split valorant | Split en Valorant: callouts en español y en inglés (50) | ок |
| /kit/dpi | 6 400 | dpi · dpi analyzer | DPI analyzer: medí el DPI real de tu mouse con la SUBE (54) | title исправлен под «dpi analyzer» |
| /dota2 | 4 600 | dota 2 · dota | Ranking de equipos de Dota 2: el mundo y Sudamérica (51) | ⚠ интент «игра» — как CS2 (§6) |
| /ff/espacio-invisible | 4 500 | espacio para free fire | Espacio invisible para Free Fire: copiar y pegar (48) | ок |
| /brawl/brawlers | 4 150 | brawl stars personajes · personajes de brawl stars | Personajes de Brawl Stars: todos los brawlers y habilidades (58) | title исправлен |
| /kit/sensibilidad | 3 700 | sensibilidad · convertidor de sensibilidad | Convertidor de sensibilidad: CS2, Valorant, OW2 y Apex (54) | title: игры в заголовке |
| /lol/rangos | 3 100 | rangos lol | Rangos de LoL en LAS: divisiones, PL y calculadora (50) | ок |
| /clash/mazos | 2 650 | mazos clash royale | Mazos de Clash Royale: armá el tuyo y comparalo (47) | ок; «mejores mazos» отвечает /clash/meta |
| /valorant/rangos | 2 300 | rangos valorant | Rangos de Valorant en orden y calculadora de RR (47) | ок |
| /cs2/mira | 2 300 | miras cs2 · crosshair cs2 | Miras de CS2: creador de crosshair con código y comandos (55) | title исправлен |
| /cs2/major | 1 500 | major cs2 | Major de CS2: formato, fase suiza y chance de pasar (51) | ок |
| / | 1 300 | esports | pingalto: herramientas para tus juegos, desde Argentina (55) | ок (бренд) |
| /lol/worlds | 1 200 | lol esports | Worlds de LoL en hora argentina: formato, cuadro y campeones (60) | ок |
| /clash/cartas | 1 000 | cartas de clash royale | Cartas de Clash Royale: elixir y rareza de cada una (51) | ок |
| /brawl/meta, /lol/msi, /esports/*, /valorant/champions, /dota2/ti, /clash/meta | < 1 000 | — | все ≤ 60 | ок; ленты, текста мало, но данные в браузере |

Все title ≤ 60, все description 115–155 (гейт сборки).

## 3. Ошибки в числах

Проверено независимо (свой код, не движок сайта) и в браузере:
- **Сенса:** CS2 1,25 @ 800 DPI → Valorant 1,25 × 0,022 / 0,07 = **0,393** ✓; см/360 = 360 / (800/2,54 × 1,25 × 0,022) = **41,6** ✓;
  eDPI 1 000 / 314 ✓; яу 0,022 (исходник Valve SDK) / 0,07 / 0,0066 ✓, Apex = 0,022 ✓.
- **DPI:** счётчики / (мм / 25,4); SUBE 85,6 мм (ISO 7810 ID-1) ✓.
- **Пинг-пол:** 2 × d / (c / 1,4475): CABA→Сантьяго ≈ 11 мс, São Paulo ≈ 16, Майами ≈ 69 ✓ (гаверсинус, R = 6371,0088).
- **Серии Bo1–Bo7:** ДП движка против закрытой формулы Σ C(w−1+j, j) pʷ qʲ — расхождение 0; Bo5 при 1–2 и p = 0,6 → 0,36 ✓;
  обратная задача (75 % за Bo3 → 67,4 % за карту) ✓.
- **Швейцарка (Bo3 в матчах на выход/вылет):** точный расчёт против 400 000 прогонов Монте-Карло: p = 0,5 → проход 0,4986 / 0,5;
  p = 0,6 → 0,7199 / 0,7208 ✓; распределение 3-0…0-3 совпадает до 0,002.
- **VRS:** E = 1/(1+10^(−g·Δ/400)), g(RD 75) = 0,9728; 100 очков → 63,65 % ✓; 60 % ↔ 72 очка ✓; живой пример Aurora–9z (370 очков)
  88,8 % и 79,2 % за карту Bo3 ✓.
- **Облако:** 10 Мбит/с → 4,5 ГБ/ч ✓. **Уилсон** 50/100 → 40,4–59,6 % ✓. **Прицел CS2:** кодирование ↔ декодирование без потерь ✓.
- **Новое:** загрузка CS2 85 ГБ × 8000 / Мбит/с: 50 → 3,8 ч, 300 → 38 мин ✓.

**Ошибок в расчётах не найдено.** Найдено и исправлено в тексте: плитка главной звала /cs2 «Ranking» (теперь «¿Te corre CS2?»),
ссылки «ranking de CS2» ведут на `/cs2#ranking`, «1 GB libres» → «libre».

## 4. UX: новичок и эксперт

- **Новичок терялся** на крупнейших ключах: /ff (69k) был списком ссылок без ответа «что это и где скачать», /cs2 (counter strike)
  открывался таблицей 376 команд, Fortnite (104k) не имел хаба вовсе (меню вело на «облако»). Исправлено: первый экран хабов —
  ответ «что это / как начать / какой магазин», крупные факты (50 игроков, 10 минут; Gratis · Windows y Linux · 85 GB), инструмент
  «¿Te corre CS2?» и выбор устройства для Fortnite (определяется по телефону сам).
- **Эксперт** получает: формулы по клику, точную ДП/цепи Маркова, сравнение с кодом Valve, источники с датами и копиями.
- **Тонко:** страницы лент (/eafc, /rl, /esports/latam, /lol/worlds) — 95–160 слов статики, остальное рисует браузер; без JS пусто.
  На телефоне сцена стоит до инструмента (вопрос владельцу из QA 03.11 остаётся).
- Лишнего «визуала ради визуала» нет; блоки «Lo que no mostramos» оставлены — они отвечают на запрос (почему нет кодов/диамантов).

## 5. Сравнение с blackjack.cab (/es/)

У blackjack.cab: одно ключевое число на первом экране, единый метод для всех инструментов, **академия коротких уроков** («¿Cómo se
juega?», правила, глоссарий, уроки с практикой и вопросами) и чёткая навигация «Aprende a jugar». У pingalto инструменты сильнее и
разнообразнее (ленты, симуляторы, источники с цитатами), но **не хватало ответов «cómo»** на уровне игры — теперь есть у CS2,
Fortnite, Free Fire; нет у LoL, Valorant, Dota 2, Clash, Brawl, RL. Глоссария esports нет.

## 6. Что расширить (по спросу и честности)

1. **Fortnite tracker (53k)** — как только владелец даст ключ fortnite-api.com: серверный прокси с кэшем, страница /fortnite/tracker.
2. **Dota 2 (4,6k + «dota»)** — хаб игры как у CS2: Steam appdetails 570 (требования, бесплатно), рейтинг — раздел.
3. **Free Fire Advance / servidor avanzado (5,4k)** — разобрать ff-advance.ff.garena.com (официальный): что это, когда открыт.
4. **«Cómo empezar» для LoL, Valorant, RL, Clash, Brawl** + глоссарий esports (Bo3, VRS, Bo1, swiss, LAS…) — по образцу академии blackjack.cab.
5. **/cs16 как страница** (7,9k + 4,7k) — история и Steam-версия; сейчас блок на /cs2.
6. **Сцены Alt** для /fortnite и /ff/max (сейчас без девушки), по правилу «в игре».
7. VRS — обновлять руками раз в месяц (Valve, GitHub); новые копии магазинов (Steam, Play, App Store) — до 03.05.2027 (180 дней).

## 7. Что сделано 04.11

- `/cs2` → хаб «Counter-Strike 2 (CS2) desde Argentina»: факты Steam AR (gratis, Windows y Linux, 85 GB, español de Hispanoamérica),
  инструмент «¿Te corre CS2?» против минимума Valve + время загрузки по Мбит/с, шаги «cómo empezar», карточки инструментов, пинги
  Valve SDR (Buenos Aires → Santiago 20, São Paulo 28, Lima 49 мс), рейтинг VRS как раздел `#ranking`, блок CS 1.6 (Steam, US$ 5,69).
- **Новые:** `/fortnite` (выбор устройства: Google Play AR с кнопкой Instalar, iPhone → облако Xbox, Windows → Epic, Mac → облако,
  консоли; режимы; для родителей; «pavos gratis»; честно — чего нет), `/ff/max` (Garena: Firelink, Ultra HD; Play AR: у MAX нет кнопки
  Instalar в нашей копии, у FF есть; App Store AR: MAX не находится, FF — iOS 12, 1,51 ГБ; инструмент «cuál bajar»).
- `/ff` дополнен (50 игроков, 10 минут, escuadras de 4, официальная загрузка, хакеры/репорт), `/eafc` — FC 27 в Steam (цена, мин./рек.).
- Title: /kit/dpi, /kit/sensibilidad, /brawl/brawlers, /cs2/mira, /ff, /eafc, /cs2. Меню «Juegos» → Fortnite ведёт на хаб.
- Источники: +13 копий (Steam ×3, Google Play ×4, iTunes lookup ×3, Garena ×2, Wikipedia), +22 цитаты; `content/stores.mjs`
  проверяет форму каждой копии — изменилась форма → сборка падает.

**Вопросы владельцу:** (1) ключ fortnite-api.com для трекера (регистрация через Discord на dash.fortnite-api.com — сделать самому,
ключ положить в `.env`); (2) сцены для /fortnite и /ff/max.

## Сделано 04.11 (академия)

- **«Cómo empezar desde Argentina»** — первый раздел после hero на /lol, /valorant, /rl, /clash, /brawl (`pages/academy.mjs`, `#empezar`):
  карточки (цена, где идёт, сервер + физический пол пинга от CABA до Santiago и типичный пинг Valve Буэнос-Айрес → Сантьяго, диск/RAM),
  5 шагов карточками со ссылками на наши инструменты и рангами (/lol/rangos, /valorant/rangos), таблица требований и «Lo que dice la
  fuente, tal cual» (цитаты под катом). Источники: Riot support es-mx (LoL, Valorant), главные leagueoflegends.com / playvalorant.com
  («Juega gratis»), Steam appdetails 252950 (RL: в Steam больше не продаётся, требования Psyonix остались; Epic и rocketleague.com —
  Cloudflare-челлендж, не берём), Wikipedia (F2P с 2020, Epic, без PS Plus, Mac/Linux без онлайна), Google Play AR и iTunes lookup AR
  (Clash Royale, Brawl Stars: бесплатно, +10, iOS-минимум, размер). +10 копий, +38 цитат; `steamReq()` в `content/stores.mjs`.
  Сервер RL и Supercell — честно «не публикуют, пинг не выдумываем».
- **/esports/glosario** — 41 термин (Bo1/Bo3/Bo5, sistema suizo, Major, VRS, Elo, MMR, RR, PL, eDPI, cm/360, LAS/LAN, meta, tier list…),
  по строке + ссылка на страницу/инструмент; поиск и фильтр по темам (`client/gloss.js`), DefinedTermSet в JSON-LD; карточка на /esports.
- **Free Fire Advance** — не построено: ff-advance.ff.garena.com отвечает 403 Forbidden и на robots.txt, и на любую страницу с нашего
  сервера (простой текст, без CDN), в браузере тоже не открылся; на сохранённых страницах Garena (ff.garena.com/es, FAQ) о нём ни слова.
  Нужна копия владельца из браузера (`docs/reference/owner-saves/`) — тогда страница `/ff/servidor-avanzado` (план, P3).
- Выложено, живьём проверены 5 хабов и глоссарий, 375/1280 без горизонтальной прокрутки.
