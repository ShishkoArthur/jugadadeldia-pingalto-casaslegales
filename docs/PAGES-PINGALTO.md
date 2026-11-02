# pingalto.com — план страниц (02.11.2026)

Машинный вариант: `data/plan/pingalto.json` (86 страниц; title ≤ 60 проверено скриптом). Ключи — `data/keywords/*jpc*`, `*pa*`, сводка `docs/research/KEYWORDS-2026-11-02.md`.

## Концепция
- **pingalto — «инструменты для твоих игр + киберспорт в часах Аргентины».** Спрос в AR — на утилиты (tier list 27k/2, Free Fire MAX 58k/9, ники и чувствительность FF, карты и прицелы Valorant, облачный Fortnite), а не на соревновательный киберспорт (dota 2 — 2,3k, esports — 1,3k).
- Каждая страница — свой инструмент: конструктор, калькулятор, интерактивная карта, живая таблица. Без шаблонных «страниц на персонажа».
- Киберспорт — математика без ставок: рейтинги команд (OpenDota, Valve VRS), вероятность серий Bo1/Bo3/Bo5, симулятор швейцарки, календарь в часах AR, аргентинцы в киберспорте.
- Аудитория молодая (тон 13+): **нет** ставок, операторов, кейсов/скинов/торговли, пополнений (diamantes, pavos, VP), хаков/макросов, раздачи аккаунтов, APK/скачиваний, взрослого мусора. Честная математика лутбоксов — только страница «Cajas de CS2: la cuenta real» (P2).
- Alt (~20 лет, явно взрослая) — гид по разделам и своя сцена на странице; автор — отдельный человек (спросить).
- Живые данные — ленты на сервере (как gambeteo), без ручных правок; где надёжной ленты нет — честно помечено «риск».

## Адреса — своя схема
**Игра первой, короткие коды (`/ff`, `/rl`, `/eafc`, `/mlbb`), без завершающего слэша:** `/valorant/rangos`, `/ff/sensibilidad`, `/kit/dpi` — у jugadadeldia и casaslegales испанские папки с «/» на конце, у нас «игра → инструмент» как в игровых приложениях.
Техника: файлы `valorant/rangos.html`, Caddy `try_files {path}.html`, 301 со слэша на без слэша, canonical без слэша (гейт). Межигровые инструменты — `/kit/…` и `/tier-list`; киберспорт — `/esports/…` + турниры внутри игры (`/cs2/major`, `/lol/worlds`, `/dota2/ti`).
Служебные: `/equipo`, `/metodo`, `/datos`, `/contacto`, `/legal` (у сестёр — `/sobre/`, `/fuentes/`, `/autor/`, `/ayuda/`). Страниц помощи нет (не азарт).

## Итоги
| Раздел | P1 | P2 | P3 | Всего |
|---|---|---|---|---|
| Inicio | 1 | 0 | 0 | 1 |
| Servicio | 5 | 0 | 0 | 5 |
| Kit | 3 | 0 | 2 | 5 |
| Valorant | 6 | 3 | 1 | 10 |
| CS2 | 3 | 4 | 2 | 9 |
| League of Legends | 2 | 2 | 3 | 7 |
| Dota 2 | 2 | 2 | 0 | 4 |
| Esports | 2 | 3 | 1 | 6 |
| Free Fire | 5 | 4 | 3 | 12 |
| Fortnite | 3 | 2 | 1 | 6 |
| Brawl Stars | 1 | 4 | 0 | 5 |
| Clash Royale | 1 | 3 | 0 | 4 |
| Rocket League | 0 | 2 | 3 | 5 |
| EA FC | 0 | 3 | 2 | 5 |
| Mobile Legends | 0 | 0 | 2 | 2 |
| **Итого** | **34** | **32** | **20** | **86** |

Типы: hub 10 · service 5 · tool 37 · live 27 · guide 7.

## P1 — запуск (34 страниц): спрос × выполнимость
Топ-10 по спросу и простоте данных:
1. `/tier-list` — tier list 27k/2 + maker 1,7k/2; ядро работает без API.
2. `/ff/max` — free fire max 58k/9; статика с цитатами требований.
3. `/ff/nombres` — кластер «nombres para free fire» ≈ 37k (KD 2–45); Unicode, без данных.
4. `/fortnite/nube` — кластер xbox cloud fortnite ≈ 19k (KD 0–13); калькулятор ГБ, статика.
5. `/valorant/mapas/ascent` — 9,1k/0; valorant-api.com без ключа.
6. `/valorant/agentes` — 7k/0; valorant-api.com.
7. `/ff/sensibilidad` — 6,3k/0 + генератор 800/0; своя формула, статика.
8. `/valorant/mapas/split` — 6,4k/0.
9. `/kit/dpi` + `/kit/sensibilidad` — ≈ 6k (KD 0–9) и ≈ 3,7k; только браузер и константы.
10. `/valorant/mira` + `/cs2/mira` — ≈ 5k/0 и ≈ 2,5k/0; формат кода прицела, статика.

Остальные P1: главная и 5 служебных, хабы Valorant/CS2/LoL/FF/Fortnite/esports, `/valorant/rangos`, `/lol/rangos`, `/cs2/rangos`, `/dota2` и `/dota2/rangos` (OpenDota, код готов в RinkMath), `/cs2` (Valve VRS на GitHub), `/esports/series`, `/fortnite/temporada`, `/ff/espacio-invisible`, `/brawl/brawlers`, `/clash/mazos`.

## Зависимости от API (подробно — ресёрч другого агента)
| Источник | Что даёт | Условия (грубо) | Страницы | Блокирует P1? |
|---|---|---|---|---|
| valorant-api.com | агенты, карты + callouts, ранги, иконки | неофициальный, бесплатно, без ключа; фан-политика Riot | 6 страниц Valorant, tier-list | нет (снимок на сервере как запасной) |
| Data Dragon / CommunityDragon (Riot) | чемпионы, патч, иконки рангов | официальный CDN без ключа; условия CDragon — проверить | /lol, /lol/rangos, tier-list | нет |
| OpenDota | рейтинги команд, распределение медалей, герои | бесплатно, 3000 запросов/день | /dota2, /dota2/rangos, /dota2/heroes | нет |
| Valve VRS (GitHub) | рейтинг команд CS2 | открытые данные | /cs2, /cs2/major | нет |
| Supercell API (Brawl Stars, Clash Royale) | бравлеры, карты, ротация, рейтинги, battlelog | бесплатный ключ **с привязкой к IP сервера** (187.7.26.95); фан-политика Supercell | /brawl/*, /clash/* | **да для 2 страниц P1** — нужен аккаунт разработчика (владелец); запасной вариант — разовый снимок |
| Liquipedia API (LPDB) / Leaguepedia Cargo | сетки, расписания, игроки, про-пики | CC-BY-SA (атрибуция), лимиты; ключ LPDB — по заявке | /esports/agenda, турниры, /lol/meta, /esports/argentinos | нет (всё на P2); P1-календарь — статика с цитатами |
| PandaScore | расписание матчей | free-план, условия — проверить | /esports/agenda (альтернатива) | нет |
| fortnite-api.com | статистика игроков (ключ), магазин (без ключа) | неофициальный; ключ бесплатный | /fortnite/tracker, /fortnite/tienda | нет (P2/P3); трекеру нужен серверный прокси |
| Epic (дата конца сезона) | обратный отсчёт | надёжного эндпоинта не знаем | /fortnite/temporada | **риск**: иначе ручная правка раз в сезон (~3 мес) |
| Riot API (продуктовый ключ) | трекеры по нику, соло-очередь | одобрение продукта | — | не планируем |
| HLTV | — | сбор запрещён | — | не используем |
| Garena, Moonton, Psyonix | — | открытых API нет | FF персонажи/оружие, MLBB, RL | нет (P2/P3, ручные данные — риск для «раз в полгода») |
| EA (рейтинги FC) | рейтинги игроков | публичная страница, условия сбора — проверить | /eafc/argentinos | нет (P2) |

Права на иконки и арт игр — фан-политики издателей (некоммерческое использование, отказ от аффилиации на `/legal`) — подтвердить в ресёрче.

## Вопросы владельцу (вариант по умолчанию — в скобках)
1. Гача-игры (Genshin, Honkai Star Rail, ZZZ, Wuthering Waves: tier list 300–1,3k, KD 0–6) и математика «гаранта» — брать? (нет: механика лутбоксов для молодой аудитории).
2. «Fortnite tracker» 53k/5 требует маленького серверного прокси с ключом fortnite-api.com (сайт перестаёт быть чистой статикой) — делаем в P2? (да, после лент).
3. Магазин Fortnite на сегодня (1,4k/0) — витрина покупок за V-Bucks (нет).
4. Коды Free Fire: списка «кодов на сегодня» нет — только инструкция и проверка формата (да, так).
5. Математика паков FC 26 по образцу кейсов CS2 (только кейсы CS2, паки — позже).
6. Minecraft и Roblox — огромный молодой спрос, в выгрузки не попадали — проверить ключи в следующем месяце? (да, после запуска P1).
7. Ключ Supercell: создать аккаунт разработчика и ключ на IP сервера (нужно для /brawl/brawlers и /clash/mazos).
8. Автор pingalto (отдельное имя, не Denis Krazok) и имя персонажа (по умолчанию «Alt»).

## Ловушки ключей
«dota colectivos / paro / empresa» — автобусная компания; «lol surprise / muñecas / para colorear», «1v1 lol», «lol superman» — не LoL; «fifa 26» — частично Mundial 2026; «sensibilidad dental», «rangos militares», «mazo de cartas españolas» — чужие интенты; «xenkzone», «fortnite gg», «valorant tracker», «keydrop» — бренды/навигация; «radiotimes / eurogamer clash royale codes» — чужие сайты.

## Ahrefs
Один запрос 02.11 (`AH_TAG=pa`, matching AR, 14 фраз: tier list, rangos, sensibilidad, mazo(s), brawlers, crosshair, miras, dpi, mobile legends, fc 26, rocket league…), 150 строк × ≈ 21 ед. ≈ **3 150 единиц**. Файл: `data/keywords/matching-pa-ar-tier_list_rangos_sensibilidad_mazo_mazos_brawlers_crosshair_.json`. Новое: tier list 27k/2, fc 26 12k/2, dpi-кластер, rangos по играм (KD 0), mazos CR (KD 0–1).

## Страницы по разделам

### Inicio
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/` | Herramientas para tus juegos y esports en hora argentina | бренд · esports 1.3k/18 (косвенно) | Карточки: ближайшие турниры (часы AR), топ Dota 2 и CS2 из лент, быстрый вход в инструменты по играм, Alt как гид по разделам | все ленты сайта · собирается из лент при каждой пересборке |

### Servicio
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/equipo` | El equipo detrás de pingalto | — | Автор (имя — спросить владельца, не Denis Krazok, чтобы не связывать сайты), Alt — персонаж-гид (не автор), чем сайт не является (не ставки, не магазин) | — · статика |
| P1 | `/metodo` | Método: de dónde salen los números | — | Схема «источник → расчёт → тест-замок», честно про тексты с ИИ и ревью, что значит «вероятность серии» без ставок | — · статика |
| P1 | `/datos` | Fuentes de datos y licencias | — | Живая таблица источников: API, лицензия (CC-BY-SA Liquipedia/Leaguepedia, фан-политики Riot, Valve, Epic, Supercell, Garena), частота обновления, время последней удачной загрузки _(CC-BY-SA требует атрибуции на страницах с данными Liquipedia)_ | метаданные всех лент · отметки свежести — из лент автоматически |
| P1 | `/contacto` | Escribinos | — | Шаблон сообщения об ошибке в инструменте (страница, что ввёл, что ожидал); без формы _(почта — только рабочая (как на blackjack.cab: неработающий адрес не публикуем))_ | — · статика |
| P1 | `/legal` | Aviso legal y privacidad | — | Не аффилированы с Riot, Valve, Epic, Garena, Supercell, EA, Moonton, Psyonix; нет ставок, покупок и аккаунтов; что хранится в браузере | — · статика |

### Kit
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/tier-list` | Creador de tier list | tier list 27k/2 · tier list maker 1.7k/2 · top tier list 300/64 | Drag & drop S–F (удобно на телефоне), наборы иконок по играм (агенты Valorant, чемпионы LoL, герои Dota 2, бравлеры, карты CR) + свои картинки локально, экспорт PNG, «поделиться» (состояние в адресе) _(права на иконки — фан-политики издателей (некоммерческое); гача-игры (genshin/hsr/zzz/wuwa tier list 300–1.3k, KD 0–6) — вопрос владельцу)_ | valorant-api.com, Data Dragon (Riot), OpenDota/Steam CDN, Supercell API — только имена и иконки · наборы иконок обновляются вместе с лентами игр (раз в сутки) |
| P1 | `/kit/sensibilidad` | Convertidor de sensibilidad entre juegos | sensibilidad 2.2k/9 · convertidor de sensibilidad 600/26 · generador de sensibilidad 600/0 · conversor de sensibilidad 300/37 | CS2 ↔ Valorant ↔ Fortnite ↔ Apex ↔ Overwatch 2 ↔ R6 по константам поворота; eDPI, cm/360, визуал «сколько коврика на разворот» _(«sensibilidad dental / en los dientes» — чужой интент, не цель)_ | константы поворота (yaw) из конфигов игр — проверить каждую, считает движок · статика, перепроверка раз в полгода |
| P1 | `/kit/dpi` | Analizador de DPI del mouse | what is a dpi setting 3.1k/1 · dpi 2k/9 · dpi analyzer 600/34 · dpi mouse 400/0 · que es dpi 300/0 | Провести мышью известное расстояние (по линейке или по карте 85,6 мм на экране) → реальный DPI, отклонение от заявленного, eDPI для своей игры | только браузер (pointer events), данных не нужно · статика |
| P3 | `/kit/fps` | Calculadora de FPS, Hz y frametime | — (не замеряли, 0–10) | мс на кадр, совпадение с частотой монитора, визуал плавности и разрывов кадра | чистая математика · статика |
| P3 | `/kit/reaccion` | Test de tiempo de reacción | — (не замеряли, 0–10) | 5 попыток, медиана, распределение попыток, поправка на задержку экрана, сравнение с опубликованными исследованиями (с цитатой) | только браузер · статика |

### Valorant
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/valorant` | Valorant: todo lo que necesitás para jugar mejor | valorant 21k/64 (не цель) · valorant tracker 12k/45 (навигационный, не цель) | Текущий соревновательный пул карт и акт, новый агент, вход в инструменты | valorant-api.com (неофициальный, без ключа): maps, agents, seasons · лента на сервере раз в сутки |
| P1 | `/valorant/rangos` | Rangos de Valorant y calculadora de RR | rangos valorant 1.4k/0 · rangos de valorant 700/0 · valorant rangos 200/0 | Лестница 9×3 + Radiant с иконками; калькулятор: винрейт и средний RR за победу/поражение → ожидаемое число игр до следующего ранга и распределение (цепь Маркова — движок) _(долю игроков по рангам Riot не публикует — чужие проценты без источника не печатать)_ | valorant-api.com competitivetiers (иконки, названия); правила RR — патч-ноты Riot (цитата) · иконки — лента раз в сутки; правила — статика, перепроверка раз в полгода |
| P1 | `/valorant/mira` | Creador de miras para Valorant | miras valorant 1.9k/0 · valorant crosshair 1.5k/41 · crosshair valorant 1k/0 · miras de valorant 450/0 · miras para valorant 250/0 · valorant miras 200/0 | Конструктор с превью на фоне карты, импорт/экспорт кода прицела (формат 0;P;…), готовые стили (точка, крест, круг) _(прицелы про-игроков — только со ссылкой на их публикацию и датой)_ | формат кода прицела (публичный; проверить тестами в клиенте), фон — изображения карт valorant-api.com · статика, перепроверка раз в полгода |
| P1 | `/valorant/agentes` | Agentes de Valorant y sus habilidades | valorant new agent abilities 7k/0 | Фильтр по роли, карточки умений (C/Q/E/X), «новый агент» сверху, сравнение двух агентов рядом | valorant-api.com /agents (есть локализация es-MX — проверить) · лента раз в сутки; новый агент появляется сам |
| P1 | `/valorant/mapas/ascent` | Ascent: mapa interactivo con callouts | ascent valorant 9.1k/0 | Интерактивная карта с callout-ами по координатам, атака/защита, своя механика: схема контроля мида и время пробега до сайтов (длина пути × скорость — код) | valorant-api.com /maps (callouts + координаты) · лента раз в сутки (правки карты приходят сами) |
| P1 | `/valorant/mapas/split` | Split: mapa interactivo con callouts y rotaciones | split valorant 6.4k/0 | То же ядро карты + своя механика: ротации между A и B через мид и время на каждую (сравнение маршрутов) _(чтобы не шаблон: у каждой карты своя дополнительная механика и свой текст)_ | valorant-api.com /maps · лента раз в сутки |
| P2 | `/valorant/mapas` | Mapas de Valorant: cuáles están en rotación | — (хаб; ascent/split — отдельно) | Какие карты в ротации сейчас, таймлайн ротаций по актам, размеры карт (площадь — код) _(ротация меняется каждый акт (~2 мес) — риск для правила «раз в полгода»)_ | valorant-api.com maps + seasons; ротация — патч-ноты Riot · лента раз в сутки; ротация — полуавтомат |
| P2 | `/valorant/peso` | Cuánto pesa Valorant | cuanto pesa el valorant 450/18 | Таблица размера, калькулятор времени загрузки по скорости интернета, сравнение с LoL, CS2, Fortnite | официальные требования (цитата), загрузка — расчёт · статика, перепроверка раз в полгода |
| P2 | `/valorant/champions` | VCT: Champions, Masters y la liga de Américas | — (0–10) | Сетка, расписание в часах AR, шансы серий из рейтинга (движок серий), команды LATAM | Liquipedia API (CC-BY-SA, лимиты; ключ LPDB — проверить) · лента раз в 6 ч в дни турниров, иначе раз в сутки |
| P3 | `/valorant/mobile` | Valorant Mobile y Argentina | valorant mobile 1k/5 | Таймлайн официальных анонсов по регионам, что известно о требованиях _(без APK и «бета-ссылок»)_ | анонсы Riot (цитаты) · статика, перепроверка раз в полгода |

### CS2
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/cs2` | Counter-Strike 2: ranking de equipos y herramientas | counter strike 2 2.6k/8 · cs2 2.4k/16 · counter strike 9.2k/17 | Valve Regional Standings: топ-30 мира и Америк, движение за неделю, аргентинские команды подсвечены; калькулятор серии между двумя командами _(команды с брендами букмекеров в названии скрыты (как в RinkMath))_ | ValveSoftware/counter-strike_regional_standings (GitHub, открыто) · лента на сервере раз в сутки (частоту публикации VRS — проверить) |
| P1 | `/cs2/mira` | Creador de miras para CS2 | miras cs2 1k/0 · crosshair 600/5 · crosshair cs2 500/2 · donk crosshair 250/– · miras para cs2 200/0 | Конструктор с превью, код CSGO-xxxxx (открытый формат share code), консольные команды cl_crosshair*, прицелы про-игроков с источником _(прицелы про — со ссылкой и датой)_ | формат share code (открытые реализации — проверить тестами) · статика, перепроверка раз в полгода |
| P1 | `/cs2/rangos` | Rangos de CS2 explicados | rangos cs2 500/0 · rangos de csgo 450/0 · rangos cs 250/0 | Цветные полосы Premier CS Rating, 18 званий Competitive, таблица «звание CS:GO ↔ CS2», модель изменения рейтинга (Valve формулу не публикует — пометка «модель») | Valve (блог, патч-ноты — цитаты) · статика, перепроверка раз в полгода |
| P2 | `/cs2/major` | Major de CS2 en hora argentina | major cs2 1.5k/0 | Сетка швейцарки (3-0/0-3) и плей-офф, шансы выйти из стадии (Монте-Карло по VRS, проверка точным расчётом), расписание AR | Liquipedia API + VRS · лента раз в 6 ч в дни Major, иначе раз в сутки |
| P2 | `/cs2/economia` | Calculadora de economía de CS2 | — (0–10) | Раунды, поражения подряд, бомба → деньги в следующем раунде у команды, «eco / force / full buy» по порогам закупа | правила экономики Valve (патч-ноты, цитата) · статика, перепроверка раз в полгода |
| P2 | `/cs2/cajas` | Cajas de CS2: la cuenta real | — (skins cs2 1.5k/60 и keydrop — не цель, не упоминать) | Опубликованные вероятности → ожидаемое число ключей до ножа, распределение, симулятор «100 открытий» с итогом _(разрешено владельцем как «почему кейсы в минусе»: без цен скинов, без маркетов и сайтов кейсов, тон — предупреждение)_ | вероятности — официальная публикация Valve/Perfect World (цитата) · статика, перепроверка раз в полгода |
| P2 | `/cs16` | Counter-Strike 1.6 hoy: qué cambió hasta CS2 | counter strike 1.6 7.9k/3 · counter-strike: global offensive 800/0 · counter strike global offensive 1.2k/35 | Таймлайн серии 1999 → CS2, таблица оружия 1.6 vs CS2 (цена, урон), карты, которые пережили все версии, где играть легально (Steam) _(без скачиваний (descargar counter strike 1.6 4.7k — не цель), без пиратских серверов)_ | Valve/Steam (цитаты); характеристики — публичные игровые файлы/вики CC-BY-SA · статика, перепроверка раз в полгода |
| P3 | `/cs2/autoexec` | Generador de autoexec para CS2 | — (не замеряли) | Галочки → готовый autoexec.cfg для копирования, объяснение каждой команды | команды Valve (developer wiki — проверить) · статика, перепроверка раз в полгода |
| P3 | `/cs2/mapas` | Mapas de CS2: el pool competitivo | — (0–10) | Текущий пул Active Duty, таймлайн изменений пула, схема callout-ов основных карт | патч-ноты Valve (цитаты) · статика, перепроверка раз в полгода |

### League of Legends
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/lol` | League of Legends: rangos, meta y torneos | lol 20k/27 · league of legends 18k/66 (не цель) | Текущий патч, топ-5 пиков в про-матчах (с P2), вход в инструменты _(«1v1 lol», «lol superman», «lol surprise», «muñecas lol» — чужие интенты, не цель)_ | Data Dragon (Riot, без ключа); Leaguepedia — с P2 · лента раз в сутки |
| P1 | `/lol/rangos` | Rangos de League of Legends | rangos lol 1.8k/0 · rangos de lol 700/0 · rangos del lol 400/0 · rangos en lol 200/0 | Лестница Iron → Challenger; калькулятор LP: винрейт + LP за победу/поражение → вероятность дойти до цели за N игр (случайное блуждание, визуал «дорожка») _(отличие от /valorant/rangos — другой вопрос («успею ли за N игр») и другой визуал)_ | иконки — Data Dragon/CommunityDragon (условия — проверить); правила — Riot Support (цитата) · статика, перепроверка раз в полгода |
| P2 | `/lol/meta` | Meta pro de League of Legends | meta lol 1.8k/5 · lol meta 700/6 · top tier lol 700/0 · tier list lol 3k/53 · lol tier list 2.1k/59 | Пики/баны/винрейт чемпионов в про-матчах текущего патча, интервал Уилсона (код), «тир» по нижней границе интервала _(статистики соло-очереди нет (Riot API — продуктовый ключ) — честно написано на странице)_ | Leaguepedia Cargo API (CC-BY-SA, лимиты) + Data Dragon · лента раз в сутки |
| P2 | `/lol/worlds` | Worlds de League of Legends | lol esports 1.2k/33 | Швейцарка + плей-офф, шансы серий Bo5, история чемпионов по регионам (диаграмма) | Liquipedia/Leaguepedia · лента в дни турнира; история — статика |
| P3 | `/lol/msi` | MSI de League of Legends | msi lol 700/2 | Сетка MSI, шансы Bo5, победы регионов на MSI по годам (таблица) | Liquipedia/Leaguepedia · лента в дни турнира |
| P3 | `/lol/horas` | Cuántas horas le dedicaste al LoL | wasted on lol 1.2k/1 · yearin lol 1.2k/0 | Без входа в аккаунт: партии × средняя длительность по режимам → часы и дни, визуал-календарь _(подсчёт по нику требует продуктового ключа Riot — не делаем)_ | средняя длительность — опубликованные данные (цитата) · статика, перепроверка раз в полгода |
| P3 | `/lol/latam` | League of Legends en Latinoamérica | — (0–10) | Таблица текущей лиги региона, аргентинские игроки и команды _(формат лиги LATAM в 2026 — проверить (после LTA))_ | Liquipedia/Leaguepedia · лента раз в неделю |

### Dota 2
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/dota2` | Dota 2: ranking de equipos en vivo | dota 2 2.3k/73 · dota 2.3k/3 (смешано с автобусной компанией DOTA) | Рейтинг OpenDota (Elo по картам), форма за 30 дней, калькулятор серии между двумя командами (Bo1/Bo3/Bo5), бэктест точности _(«dota colectivos / paro / empresa» — чужой интент)_ | OpenDota API (бесплатно, 3000 запросов в день) · лента на сервере раз в сутки (код готов в RinkMath: tools/feeds/dota2.mjs) |
| P1 | `/dota2/rangos` | Rangos de Dota 2: la distribución real | — (0–10) | Распределение игроков по медалям Herald → Immortal (гистограмма), «ты выше X % игроков» по своей медали | OpenDota /distributions (бесплатно) · лента раз в сутки |
| P2 | `/dota2/heroes` | Meta de héroes de Dota 2 | — (0–10) | Кривая винрейта героя по медалям, про-пики/баны, интервал Уилсона | OpenDota /heroStats · лента раз в сутки |
| P2 | `/dota2/ti` | The International de Dota 2 | — (0–10) | Сетка, расписание в часах AR, шансы серий, история победителей и призовых (график) | OpenDota leagues + Liquipedia · лента в дни TI; история — статика |

### Esports
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/esports` | Calendario de esports | esports 1.3k/18 | Годовая шкала больших турниров (TI, Worlds, MSI, Majors CS2, Champions, FFWS, M-Series) с датами в часах AR, фильтр по игре | официальные анонсы организаторов (цитаты); с P2 — Liquipedia · статика, перепроверка раз в полгода; с P2 — лента раз в сутки |
| P1 | `/esports/series` | Probabilidad de ganar una serie Bo1, Bo3 o Bo5 | — (0–10) | Вероятность карты → вероятность серии, распределение счётов (2-0, 2-1…), насколько Bo5 «защищает» сильнейшего, дерево исходов _(без коэффициентов, только вероятность)_ | чистая математика (engine/series.mjs из RinkMath) · статика |
| P2 | `/esports/agenda` | Agenda de esports de hoy | — (0–10) | Матчи на сегодня и неделю по играм, время AR, официальные трансляции, шанс серии по рейтингу (Dota 2, CS2) _(блокер — условия API (ресёрч другого агента))_ | Liquipedia LPDB API (ключ, условия) или PandaScore free (условия) · лента раз в 1–6 ч |
| P2 | `/esports/argentinos` | Argentinos en los esports | — (0–10) | Игроки из Аргентины по играм: текущая команда, крупные результаты, фильтр по игре | Liquipedia (CC-BY-SA) · лента раз в неделю |
| P2 | `/esports/sistema-suizo` | Simulador de fase suiza | — (0–10) | 16 команд, рейтинги вручную или из VRS → вероятности 3-0, выхода, 0-3 (Монте-Карло + точная проверка), правило Бухгольца | математика; рейтинги — по желанию из VRS · статика |
| P3 | `/esports/latam` | Ligas de esports de Latinoamérica | — (0–10) | Таблица лиг LATAM по играм (CS2, Valorant, LoL, Free Fire, MLBB) + текущие лидеры | Liquipedia · лента раз в неделю |

### Free Fire
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/ff` | Free Fire: herramientas que sí sirven | free fire 69k/47 (не цель) | Вход в инструменты, блок лиги LATAM (с P2), честный блок «чего здесь нет» (алмазы, хаки, аккаунты) _(не берём: diamantes/recarga/pagostore, hacks, macro, «archivos para dar tiros», cuentas gratis, xxx)_ | — · из лент |
| P1 | `/ff/sensibilidad` | Generador de sensibilidad para Free Fire | sensibilidad para free fire 6.3k/0 · generador de sensibilidad para free fire 800/0 · sensibilidad de free fire 500/0 · la mejor sensibilidad para free fire 400/0 · calibrador de sensibilidad 250/– · xenkzone sensibilidad 3.8k/0 (бренд, не цель) | Ввод: размер экрана, DPI, стиль (2–4 пальца) → стартовые ползунки; перенос пресета на другой телефон (масштаб по физическому размеру); тренажёр «тап по цели» в браузере для подстройки _(честно: «идеальной чувствительности нет»; без «тиров в голову», файлов и макросов)_ | диапазоны ползунков текущей версии (проверить), формула переноса — своя, объяснена · статика, перепроверка раз в полгода |
| P1 | `/ff/nombres` | Generador de nombres para Free Fire | nombres para free fire 23k/30 · nombre para free fire 6.4k/31 · nombres de free fire 1.7k/29 · creador de nombres 1.5k/36 · generador de nombres 1.2k/45 · nombres insanos 1.2k/2 · simbolos 1k/33 · letras 900/15 | Ник → варианты стилизованных Unicode-шрифтов и символов, счётчик длины по правилам игры, пометка «может не отобразиться», фильтр мата | Unicode (стандарт); лимит длины ника — проверить в игре · статика |
| P1 | `/ff/espacio-invisible` | Espacio invisible para Free Fire | espacio para free fire 1.9k/0 · espacio invisible para free fire 1.7k/1 · espacio para nombre de free fire 900/0 | Кнопки «копировать» для разных невидимых символов (U+3164 и др.), проверка «виден ли» прямо на странице, ник с пробелом в середине | Unicode; какие символы принимает игра — проверить · статика, перепроверка раз в полгода |
| P1 | `/ff/max` | Free Fire MAX: requisitos y diferencias con Free Fire | free fire max 58k/9 | Ввод: RAM, версия Android/iOS, свободное место → «пойдёт / впритык / нет» по официальным требованиям; таблица отличий FF и MAX _(без ссылок на APK)_ | Google Play / App Store / Garena (цитаты) · статика, перепроверка раз в полгода |
| P2 | `/ff/personajes` | Personajes y combos de Free Fire | free fire personajes 800/0 · personajes de free fire 700/0 | Фильтр персонажей (активное/пассивное умение), конструктор комбо 1 + 3 с суммой эффектов _(РИСК: конфликт с «раз в полгода» — без открытого источника)_ | патч-ноты Garena (OB) — вручную, API нет · перепроверка по обновлениям OB (~раз в 2 мес) |
| P2 | `/ff/armas` | Comparador de armas de Free Fire | armas de free fire 800/0 | Сравнение 2–3 оружий: урон, скорострельность → урон в секунду и время до нокаута (код) _(РИСК: источник данных)_ | статы — в игре/вики (лицензию проверить) · перепроверка по OB |
| P2 | `/ff/codigos` | Cómo canjear códigos de Free Fire | codigos de free fire 3.2k/16 · códigos free fire hoy 2.4k/7 · codigos free fire 1.4k/2 · canjear códigos 1.3k/24 · códigos free fire 800/0 · canjear código 700/9 | Проверка формата кода (длина, символы), чек-лист мошенничества (просят пароль/оплату), официальный сайт обмена _(РИСК: списка «кодов на сегодня» нет — надёжного легального источника нет; бесплатных алмазов не обещаем)_ | правила — официальная страница Garena (цитата) · статика, перепроверка раз в полгода |
| P2 | `/ff/liga` | Free Fire competitivo: Latinoamérica y FFWS | — (0–10) | Таблица лиги LATAM, расписание в часах AR, мировой турнир FFWS | Liquipedia Free Fire · лента раз в сутки в сезон |
| P3 | `/ff/rangos` | Rangos de Free Fire | rangos free fire 200/0 · rangos de free fire 200/0 | Лестница BR и Duelo de Escuadras, калькулятор «сколько матчей до Heroico» по своим средним очкам | Garena (вручную) · статика, перепроверка раз в полгода |
| P3 | `/ff/historia` | Historia de Free Fire | cuando se creo free fire 450/0 · free fire india 1.7k/30 | Таймлайн 2017 → сейчас: запуск, FF MAX, запрет в Индии, рекорды | публичные источники (цитаты) · статика |
| P3 | `/ff/servidor-avanzado` | Servidor Avanzado de Free Fire | servidor avanzado free fire 1.8k/11 · free fire advance 3.6k/11 | Календарь прошлых открытий (закономерность по OB), как попасть официально _(без APK)_ | Garena (цитаты) · статика, перепроверка раз в полгода |

### Fortnite
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P1 | `/fortnite` | Fortnite: temporada, rangos y más | fortnite 104k/49 (не цель) · fortnite gg 14k/0 (навигационный) | Мини-отсчёт до конца сезона, вход в инструменты _(не берём: pavos, crew, tienda/skins (вопрос), xxx/rule 34, apk)_ | см. /fortnite/temporada · из ленты сезона |
| P1 | `/fortnite/temporada` | Cuándo termina la temporada de Fortnite | cuando termina la temporada de fortnite 800/0 · fortnite current season battle pass 2.7k/9 | Обратный отсчёт в часах AR + калькулятор боевого пропуска: текущий уровень и дни до конца → XP в день, визуал «успеваешь / нет» _(РИСК: без эндпоинта — ручная правка раз в сезон (~3 мес))_ | дата конца — публичный контент Epic (эндпоинт проверить) или официальный анонс; XP за уровень — Epic (цитата) · лента раз в сутки, если эндпоинт есть |
| P1 | `/fortnite/nube` | Fortnite en Xbox Cloud Gaming: datos e internet | xbox cloud gaming fortnite 6.5k/4 · xbox fortnite 4.3k/3 · xbox cloud fortnite 2.5k/9 · fortnite xbox 2.2k/4 · fortnite cloud gaming 1.5k/0 · cloud gaming fortnite 1.3k/13 · fortnite xbox cloud 1k/6 | Калькулятор: часы × качество → ГБ мобильных данных в месяц; проверка скорости и задержки до нашего сервера как ориентир против минимальных требований _(бесплатно ли без подписки — проверить; Game Pass не продвигать)_ | требования Microsoft (цитата) · статика, перепроверка раз в полгода |
| P2 | `/fortnite/rangos` | Rangos de Fortnite y progreso en Ranked | rangos fortnite 350/0 · rangos de fortnite 300/0 | Лестница Bronce → Unreal, калькулятор прогресса по местам и устранениям _(РИСК: правила меняются по сезонам)_ | правила Epic (цитата) · статика, перепроверка раз в полгода |
| P2 | `/fortnite/tracker` | Estadísticas de Fortnite por jugador | fortnite tracker 53k/5 | Поиск по нику Epic → K/D, винрейт, топ-10 по режимам; калькулятор «что нужно для K/D = X» _(БЛОКЕР: нужен маленький серверный прокси, не только статика; запрос во многом навигационный (fortnitetracker.com))_ | fortnite-api.com /v2/stats (бесплатный ключ; условия — проверить) · по запросу через серверный прокси (ключ не в браузере), кэш |
| P3 | `/fortnite/tienda` | Tienda de Fortnite de hoy | tienda fortnite hoy 1.4k/0 · tienda de fortnite hoy 1.3k/0 · tienda de fortnite 3.6k/18 · fortnite shop 4k/59 | Витрина дня + «когда предмет был в последний раз» (история) _(ВОПРОС владельцу: витрина покупок за V-Bucks для молодой аудитории — по умолчанию не делаем)_ | fortnite-api.com /v2/shop (без ключа) · лента раз в сутки после обновления магазина |

### Brawl Stars
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P2 | `/brawl` | Brawl Stars: brawlers, meta y eventos | brawl stars 44k/27 (не цель) | Текущая ротация событий, вход в инструменты _(не берём: rule 34/xxx/porno, gemas)_ | Supercell Brawl Stars API /events/rotation · лента раз в 3 ч |
| P1 | `/brawl/brawlers` | Todos los brawlers de Brawl Stars | brawl stars personajes 1.7k/0 · personajes de brawl stars 1.1k/0 · brawlers 1k/10 · brawlers de brawl stars 350/1 · todos los brawlers 300/0 · spike 2.2k/0 · edgar 1.9k/0 · leon 1.2k/0 · mandy 900/0 · melodie 900/0 · colette 700/0 | Сетка всех бравлеров с фильтром (редкость, класс), карточка со star powers и gadgets, «новый бравлер», счётчик коллекции (отметь своих → % и сколько осталось) _(страницы отдельных бравлеров не делаем (шаблон); ключ Supercell — шаг владельца)_ | Supercell Brawl Stars API (ключ бесплатный, привязан к IP сервера) /brawlers; редкость/класс — Brawlify API (неофициальный, условия) · лента раз в сутки |
| P2 | `/brawl/meta` | Meta de Brawl Stars | meta brawl stars 800/0 | По battlelog топ-200 (Аргентина и мир): частота выбора и винрейт по режимам, интервал Уилсона | Supercell API /rankings + /battlelog · лента раз в сутки |
| P2 | `/brawl/eventos` | Eventos de Brawl Stars de hoy | — (0–10) | Текущая ротация с таймерами до смены в часах AR, лучшие бравлеры на карту из /brawl/meta | Supercell API /events/rotation · лента раз в 1–3 ч |
| P2 | `/brawl/mejoras` | Calculadora de mejoras de Brawl Stars | — (0–10) | Текущий уровень → монеты и очки силы до максимума, на одного бравлера и на всю коллекцию | таблица стоимости Supercell (проверить) · статика, перепроверка раз в полгода |

### Clash Royale
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P2 | `/clash` | Clash Royale: mazos, cartas y meta | clash royale 27k/14 | Новые карты, топ-3 колоды из /clash/meta, вход в инструменты _(не берём: rule 34/xxx, store, apk, «códigos» с сайтов-агрегаторов)_ | Supercell Clash Royale API · лента раз в сутки |
| P1 | `/clash/mazos` | Constructor de mazos de Clash Royale | mazos clash royale 1k/0 · mazos de clash royale 500/0 · mejores mazos clash royale 500/1 · el mejor mazo 300/0 · califica mazo 300/– · mazo de clash royale 250/0 · mazos para clash royale 200/0 · mazo para arena 9 200/0 | 8 карт → средний эликсир, цикл из 4 самых дешёвых, покрытие (воздух/здания/заклинания), оценка-чеклист по ролям, ссылка на копирование колоды в игру (формат — проверить) | Supercell Clash Royale API /cards (ключ + IP сервера): имена, эликсир, редкость, иконки · лента раз в сутки (новые карты появляются сами) |
| P2 | `/clash/meta` | Los mazos del meta en Clash Royale | mazos meta clash royale 350/– · mejores mazos (часть) | Популярные колоды у топ-игроков (battlelog), винрейт с интервалом | Supercell CR API rankings/battlelog (доступность рейтингов — проверить) · лента раз в сутки |
| P2 | `/clash/cartas` | Todas las cartas de Clash Royale | cartas de clash royale 700/0 · duende 700/0 · valquiria 700/0 · mazo de megacaballero 300/0 · emotes 800/0 (не цель) | Фильтр по эликсиру, редкости и типу, сравнение двух карт | Supercell API /cards; статы — RoyaleAPI cr-api-data (GitHub, лицензию проверить) · лента раз в сутки |

### Rocket League
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P2 | `/rl` | Rocket League: rangos, MMR y autos | rocket league 17k/11 | Вход в инструменты, сезонный отсчёт (если есть источник) _(официального API нет; не берём торговлю предметами)_ | анонсы Psyonix · статика, перепроверка раз в полгода |
| P2 | `/rl/rangos` | Rangos y MMR de Rocket League | rangos rocket league 700/0 · rangos de rocket league 400/0 · mmr rocket league 200/0 | Лестница Bronze → SSL, границы MMR по режимам, «сколько побед до ранга» (оценка с пометкой) | границы MMR — неофициальные (источник найти) — РИСК · статика, перепроверка раз в полгода |
| P3 | `/rl/hitbox` | Hitbox de autos en Rocket League | fennec rocket league 800/0 · zen rocket league 200/5 | Сравнение хитбоксов (размеры, вид сверху/сбоку), какой кузов к какому относится | официальная таблица хитбоксов Psyonix (цитата) · статика, перепроверка раз в полгода |
| P3 | `/rl/requisitos` | Requisitos de Rocket League para PC | rocket league requisitos 450/0 | Своя конфигурация против минимальных и рекомендуемых | Epic Games Store (цитата) · статика, перепроверка раз в полгода |
| P3 | `/rl/sideswipe` | Rocket League Sideswipe | rocket league sideswipe 2.5k/5 | Таблица отличий от RL, таймлайн статуса _(статус игры в 2026 — проверить; без APK (sideswipe apk 700 — не цель))_ | анонсы Psyonix · статика, перепроверка раз в полгода |

### EA FC
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P2 | `/eafc` | EA Sports FC 26 | fc 26 12k/2 · fifa 26 6.6k/2 · ea sports fc 26 2.6k/4 · ea fc 26 1.5k/11 | Таблица версий (PS4/PS5/PC/Switch) и отличий, отсчёт до следующей части _(«fifa 26» частично = Mundial 2026 — смешанный интент; адрес без года, год — в title (переживёт FC 27))_ | EA (цитаты) · статика, перепроверка раз в полгода |
| P2 | `/eafc/quimica` | Calculadora de química de FC 26 | — (0–10) | 11 игроков (клуб/лига/нация) → очки химии по порогам, визуал состава _(без паков и покупок)_ | правила химии EA (цитата); база игроков не нужна — ввод вручную · статика, перепроверка раз в год (новая часть) |
| P2 | `/eafc/argentinos` | Los argentinos en FC 26 | messi fc 26 200/– | Таблица аргентинцев: рейтинг, позиция, клуб; распределение по лигам _(БЛОКЕР — условия EA)_ | публичная страница рейтингов EA (условия сбора — проверить) · лента раз в неделю |
| P3 | `/eafc/ps4` | FC 26 en PS4 frente a PS5 | fc 26 ps4 900/0 · fifa 26 ps4 800/0 | Таблица функций по платформам | EA (цитаты) · статика, перепроверка раз в полгода |
| P3 | `/eafc/sobres` | Sobres de FC 26: la cuenta real | — (0–10) | Опубликованные EA вероятности → ожидаемое число паков до игрока 90+, симулятор _(ВОПРОС владельцу: лутбокс-математика, как кейсы CS2)_ | вероятности EA в игре (цитата/скриншот) · статика, перепроверка раз в полгода |

### Mobile Legends
| Волна | URL | H1 | Ключи (объём/KD) | Инструмент | Данные · автообновление |
|---|---|---|---|---|---|
| P3 | `/mlbb` | Mobile Legends: héroes, roles y líneas | mobile legends 2.2k/13 · mobile legends pc 350/0 | Фильтр героев по роли и линии, подбор состава 5 ролей _(не берём: diamantes/recargar (350/0); tier list ML 300/53 — нет данных)_ | Moonton — API нет, вручную · статика, перепроверка раз в полгода |
| P3 | `/mlbb/torneos` | Mobile Legends competitivo | — (0–10) | Сетка M-Series/MSC, расписание AR, команды LATAM | Liquipedia MLBB · лента в дни турниров |
