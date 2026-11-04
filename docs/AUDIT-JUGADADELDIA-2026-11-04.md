# Аудит jugadadeldia.com — 04.11.2026

Запрос владельца 04.11 («полный аудит трёх сайтов», цитата — `docs/DECISIONS.md`, верх). Проверено: 74 живые страницы по sitemap
(тексты всех, кроме 24 страниц помощи — они служебные), все калькуляторы/симуляторы/проверки — в браузере (локально и на живом сайте)
и **независимым пересчётом** (`scratchpad/audit-jdd/verify.mjs`, `env.mjs` — своя математика без импорта движка), ключи — скрипт ведущего
`docs/research/kw-audit/kwaudit2.mjs jugadadeldia 'quiniela|truco|promedios'`. Исправлено и выложено в тот же день (коммиты `8f45a34`,
`3f520f6`): **79 страниц** (+5 страниц турно), гейты и `npm test` зелёные (на HEAD; в рабочей копии тест ленты падает из-за чужого
незакоммиченного `tools/feeds/jugadadeldia/provincias*.mjs` — это WIP ресёрчера источников, не наш код).

## 1. Ключи

**Даны:** 8 выгрузок Ahrefs AR (`data/keywords/*ar-ideas*` кинела, труко/генерала/анотадор/бурако/чинчон, promedios; `*jpc*` лотереи,
кинела+игры, труко+игры) — **509 ключей, 20,54 млн/мес**. Большая часть объёма — не наш продукт (футбол, бренды чужих сайтов).

| Группа | Ключей | Объём/мес | Что с ними |
|---|---:|---:|---|
| Раскрыты целиком (страница есть, title покрывает ≥ 80 % слов ключа) | 139 | 7,43 млн | quiniela 1,41 млн, quiniela de hoy 1,08 млн, quini 6 660k, quiniela en vivo 490k, quiniela hoy 273k, mendoza 267k, quiniela plus 193k, telekino 185k, loto plus 184k, nacional 167k, nocturna 110k (новая страница), matutina 40k (новая) … |
| Раскрыты частично (страница есть, title/контент не полностью по интенту) | 86 | 0,80 млн | «resultados quini 6» 47k, «sorteo quini 6» 36k, «resultado del quini 6» 33k и т. п. — **результатов Quini 6 у нас нет** (нет проверенной ленты: сайт Santa Fe закрыт гео-блоком, CAS San Juan отстаёт на 6 дней); «quiniela nacional y provincia nocturna de hoy 21 hs» 114k — частично (/quiniela/nacional-y-provincia/ + новая /quiniela/nocturna/); «lotería de Entre Ríos» 35k, «lotería de Córdoba» 20k — навигационные (ищут сайт лотереи); «quiniela de ayer» 20k — /quiniela/extractos/ (title исправлен) |
| В плане, не построены | 75 | 2,44 млн | **Tucumán 961k** (TLS-сертификат API не проверяется — не отключаем проверку; лента «provincias» сейчас делается другим агентом), Tómbola santiagueña 189k, Catamarca 169k, Chaco 149k, Corrientes 144k, Tómbola salteña 141k, Formosa 134k, San Juan 127k, Misiones 66k, Jujeña 61k, Santiago 54k, Salta 50k … — нет официального источника результатов/регламента (`data/sources/lottery/gaps.json`); /quiniela/significado-de-los-numeros/ 10k — нет официальной таблицы; /quini-6/pozo-extra/, /probabilidades/ — дубли /quini-6/ |
| Не в плане | 209 | 9,87 млн | офтоп (Mundial, fixture, NBA, F1, promedios, Colapinto, Libertadores, plazo fijo) 51 / 5,21 млн; бренды чужих сайтов результатов (quiniela enzo 1,24 млн, notitimba, confiable, ruta 1000, al minuto, san diego) 25 / 2,63 млн — навигационные, не наши; «quiniela/lotería mundial(es)» 7 / 0,75 млн — неясно (бренд или игра на чемпионат), не трогали; казино/рулетка 10 / 0,37 млн — не наш продукт; общие «resultado(s) de la quiniela (de hoy)» 50 / 0,58 млн — **по сути обслуживает /quiniela/** (в плане не перечислены дословно); Тукуман-варианты 12 / 0,11 млн; прочее 54 / 0,22 млн (quiniela online 97k — см. «Что расширить») |

Итого после аудита: в плане 300 ключей / 10,67 млн; построено 225 / 8,23 млн; title покрывает 139 / 7,43 млн (было 119 / 6,17 млн).
Перенесено: ключи турно (nocturna 110k, matutina 40k + 37k, vespertina 18k, previa 15k + 14k, loteria nacional nocturna 43k) с
/quiniela/horarios/ на новые страницы результатов турно — интент «что выпало в Nocturna», а не «во сколько».

## 2. Соответствие интенту и title (топ-40 страниц по спросу)

Вердикт: ✅ — совпадает; ⚠️ — частично; ✏️ — исправлено 04.11.

| URL | Главный ключ | Title (сейчас) | Что ищет человек | Что даёт страница | Вердикт |
|---|---|---|---|---|---|
| /quiniela/ | quiniela 1,41 млн; de hoy 1,08 млн; en vivo 490k; resultado 189k | Quiniela de hoy en vivo: resultados y cabezas por provincia | кабесы и выписки сегодня, сразу | сетка 6 юрисдикций × 5 турно, 20 чисел по нажатию, обновление 15 мин, «Sin datos» при задержке | ✏️ было без «en vivo»; добавлены плитки турно |
| /quiniela/nocturna/ (новая) | quiniela nocturna 110k; de hoy nocturna 40k; lotería nacional nocturna 43k | Quiniela Nocturna de hoy en vivo: Nacional, Provincia y más | номера Nocturna 21 h | последняя Nocturna во всех 6, «сегодня выйдет в 21:00», неделя Nocturna, связь с Quiniela Plus | ✏️ новая |
| /quiniela/matutina/ (новая) | matutina 40k + de hoy 37k | Quiniela Matutina de hoy: cabezas de Nacional y Provincia | номера Matutina | то же для 15:00 | ✏️ новая |
| /quiniela/vespertina/ (новая) | vespertina 18k | Quiniela Vespertina de hoy: … | номера Vespertina | то же для 18:00 | ✏️ новая |
| /quiniela/la-previa/ (новая) | previa 15k + la previa 14k | Quiniela La Previa de hoy: … | номера 10:15 | то же | ✏️ новая |
| /quiniela/la-primera/ (новая) | (в выгрузке нет) | Quiniela La Primera de hoy: … | номера 12:00 | то же | ✏️ новая (полнота турно) |
| /quiniela/nacional/ | nacional 167k; nacional nocturna de hoy 21 hs 71k | Quiniela Nacional de hoy: la Nocturna y todos los turnos | Nacional сегодня, особенно Nocturna | последний тираж Ciudad крупно, неделя, «¿salió mi número?» с выплатой | ✏️ title + description |
| /quiniela/nacional-y-provincia/ | NyP nocturna de hoy 21 hs 114k; NyP 83k; en vivo 44k | Quiniela Nacional y Provincia de hoy en vivo, turno a turno | обе выписки рядом | обе по турно, совпадения отмечены, сравнение с азартом | ✏️ ⚠️ «nocturna 21 hs» — лучше /quiniela/nocturna/ |
| /quiniela/mendoza/ | quiniela de mendoza 267k | Quiniela de Mendoza hoy: resultados de cada turno | выписка Мендосы | копия LOTBA («1 fuente»), неделя | ✅ |
| /quiniela/entre-rios/ | 104k | Quiniela de Entre Ríos: resultados del día | выписка | ✅ | ✅ |
| /quiniela/cordoba/ | 99k | Quiniela de Córdoba: extractos de hoy y anteriores | выписка | ✅ | ✅ |
| /quiniela/santa-fe/ | 64k | Quiniela de Santa Fe: resultados y turnos | выписка | ✅ | ✅ |
| /quiniela/provincia/ | 33k | Quiniela de la Provincia de Buenos Aires: extractos de hoy | выписка PBA | ✅ | ✅ |
| /quiniela/extractos/ | quiniela de ayer 20k; extractos anteriores | Extractos de la quiniela de ayer y anteriores, por fecha | вчерашние/старые выписки | архив 120 дней, поиск по дате/турно/терминации | ✏️ «de ayer» |
| /quiniela/numeros-que-mas-salen/ | números que más salen | Números que más salen en la quiniela: ¿sirve saberlo? | «горячие» номера | частоты + χ² + честное «1 из 100» | ✅ (интент «какие номера ставить» — честно отвечает «никакие не лучше») |
| /quiniela/cuanto-paga/ | cuánto paga la quiniela 4,5k | ¿Cuánto paga la quiniela? Calculadora de premios en pesos | сколько получу | калькулятор + вся таблица Ciudad/Provincia, формула, FAQ | ✅ |
| /quiniela/redoblona/ | redoblona | Redoblona: qué es, cuánto paga y qué chance tiene | выплата редоблоны | калькулятор с потолками регламента, все исходы | ✅ (исправлено: старые числа при ошибке) |
| /quiniela/como-se-juega/ | cómo se juega a la quiniela | Cómo se juega a la quiniela: la boleta paso a paso | как играть | интерактивный билет на примере, квиз | ✅ |
| /quiniela/horarios/ | hay quiniela hoy 6,8k | Horarios de la quiniela: ¿hay sorteo hoy? | есть ли тираж, во сколько | да/нет на сегодня/завтра, отсчёт, программа LOTBA | ✅ (+ ссылки на турно) |
| /quiniela/simulador/ | (P2) | Simulador: un año jugando a la quiniela, en pesos | что будет за год | точный расчёт + 10 000 лет МК | ✅ (исправлена фраза медианы) |
| /quini-6/ | quini 6 660k; resultados 47k; hoy 46k; sorteo 36k | Quini 6: controlá tu boleta y la chance de cada premio | **результаты тиража** | контроль билета + шансы; результатов нет | ✏️ ⚠️ честно: карточка «¿Ya salió el sorteo?» → loteriasantafe.gov.ar + контроль; полное соответствие — только с лентой результатов |
| /quini-6/controlar/ | controlar quini 6 | Controlar Quini 6: revisá varias boletas a la vez | проверить билет | до 10 билетов | ✅ (числа тиража — вручную) |
| /quini-6/como-se-juega/ | cómo se juega quini 6 | Cómo se juega al Quini 6: modalidades y premios | правила | интерактивный volante | ✅ |
| /loto-plus/ | loto plus 184k | Loto Plus: controlá tu jugada y la chance de cada modalidad | результаты | контроль + шансы + цена | ✏️ ⚠️ как Quini 6 (ссылка на loto.loteriadelaciudad.gob.ar) |
| /telekino/ | telekino 185k | Telekino: controlá tu cartón, premios y chances | результаты | контроль + шансы | ✏️ ⚠️ (ссылка на loteria.gba.gob.ar) |
| /telekino/controlar/ | controlar telekino | Controlar Telekino: revisá tu cartón | проверить картон | сетка 5×5 | ✅ |
| /brinco/ | brinco 35k | Brinco: chances por aciertos y control de tu jugada | результаты | контроль + шансы | ⚠️ (+ карточка результатов) |
| /quiniela-plus/ | quiniela plus 193k; controlar 16k | Quiniela Plus: controlá tu jugada con la última Nocturna | результаты/проверка | **кнопка «Traer la última Nocturna de la Provincia»** — тираж из ленты, проверка в один клик | ✏️ ✅ (Plus по регламенту решается Nocturna PBA) |
| /poceada/ | quiniela poceada 24k; poceada 37k | Quiniela Poceada de la Ciudad: cómo funciona y chances | правила/результаты | шансы, контроль | ✏️ «Quiniela» в title; результаты — ссылкой |
| /cuanto-devuelve-cada-juego/ | — (своя идея) | ¿Cuánto devuelve cada juego? Quiniela, Quini 6, Loto y más | какая игра «выгоднее» | сравнение по регламентам, годовая потеря | ✅ (исправлены 2 ошибки, ниже) |
| /truco/valores-de-las-cartas/ | valores del truco 21k (24 ключа, 52,6k) | Valores del truco: tabla de cartas de mayor a menor | порядок карт | 14 ступеней, «mata a N», тренажёр, «machete» для печати | ✅ |
| /truco/ | truco argentino 23k | Truco argentino: reglas, valores, señas y anotador | всё о труко | хаб, раздача руки с энвидо | ✅ |
| /truco/jugar/ | truco online 16k | Jugar al truco online gratis contra la compu | играть | 1×1, 3 уровня, разбор | ✅ (2×2 нет) |
| /truco/senas/ | señas 16k | Señas del truco: todas, con dibujo y significado | знаки | рисунки + цитаты | ✅ |
| /truco/anotador/ | anotador 17k | Anotador de truco online: a 15 o a 30, con fósforos | счётчик | спички, malas/buenas | ✅ |
| /truco/envido/ | envido | Envido: cómo contar los tantos y qué chance tenés | как считать | калькулятор + шанс против случайной руки | ✅ |
| /truco/reglas/ | reglas del truco | Reglas del truco argentino, mano por mano | правила | правила + «¿quién ganó la mano?» | ✅ |
| /burako/ | burako 8,4k | Burako: reglas, canastas y cuántos puntos vale cada una | правила, очки | регламент Juegos Bonaerenses + калькулятор | ✅ |
| /generala/ | generala 3,5k | Generala: anotador online, puntos y reglas | анотадор | анотадор + «¿dónde anotar?» | ✅ |
| /dados/ | tirar dados | Tirador de dados online: 1 a 10 dados, para la generala | бросить кубики | crypto, история, гистограмма | ✅ (title покрывает 48 % ключей — ключи «dados online/virtuales» близки) |
| /chinchon/ | chinchón 4,4k | Chinchón: reglas y cuándo se puede cortar | правила | «¿puedo cortar?» | ✅ |

## 3. Ошибки в числах (найдено → исправлено)

Независимо пересчитано и **совпало**: Quini 6 (C(46,6) = 9 366 819; 5 = 1/39 028, 4 = 1/801, 3 = 1/47,4; любой приз 1/784, два тиража
1/392; Premio Extra 1/1 163 — точное распределение объединения трёх тиражей), Brinco (3 838 380; 1/18 816, 1/456, 1/32,1; любой 1/29,9),
Telekino (3 268 760 … 11 = 1/11,4; любой 1/9,4), Poceada (186 087 894 300; 1/1 477 240, 1/30 006, 1/1 519, 1/146; любой 1/133),
Quiniela Plus (8 = 1/3 198 054 … 5 = 1/223; любой 1/205 — включения-исключения и МК 2 млн), Loto Plus Multiplicador 1/31 222 733,
Tombolina 3/5/7 (35,25 / 36,67 / 38,69 на $ 100; 1/142, 1/18,8, 1/7,1), квинела 1–4 цифры × 1/5/10/20 мест (все 16 шансов), редоблона
(Ciudad cabeza + a los 5: $ 150 000 1/102 025, $ 98 000 1/2 082, EV 48,54; Provincia 80×80: $ 200 000 / $ 128 000, EV 63,44; 5×5: максимум
$ 117 600 1/500 000 000, EV 39,20), доли пула по регламенту (Quini 6 Tradicional 29,88 — сверено с арт. 21 и определением «valor nominal 90 %»,
Revancha 43,2, Siempre Sale 32,4, Brinco 41,21, Loto 18,32, Poceada 38,02, QPlus 56,5), симулятор (40,7 % лет в плюсе, 59,3 % без
попадания; 4 цифры 6/нед — 3,1 %), энвидо (≥ 20 59,5 % … 33 1,5 %; флор 480 = 4,86 % = 1/20,6; шансы против случайной руки 100 / 43,1 /
19,5 % — пересчитаны перебором 7 770 рук), генерала (6/150/300/240 из 7 776; генерала за 1/2/3 броска 1/1 296, 1/79,2, 1/21,7), лестница карт
труко (mata a 39 … 0), таблица энвидо-цепочек.

| # | Где | Было | Почему неверно | Стало |
|---|---|---|---|---|
| 1 | /quini-6/ | «Для равного шанса … unas **6.492.584 jugadas distintas**» | Для **разных** комбинаций 50 % = N/2 = 4 683 410; 6,49 млн = ln2·N — это число **случайных независимых** билетов/тиражей | «… cubrir la mitad de las combinaciones: **4.683.410** jugadas distintas. Con una jugada por sorteo, el 50 % llega recién después de **6.492.584** sorteos.» Других мест с этой формулой нет (поиск по коду) |
| 2 | /cuanto-devuelve-cada-juego/ | «Quiniela a 1 o 2 cifras — 1 en 100» | 1 цифра a la cabeza — 1 из 10; строка смешивала две ставки | две строки: «a 1 cifra, a la cabeza 1 en 10», «a 2 cifras, a la cabeza 1 en 100»; у 3–5 цифр — «a la cabeza» |
| 3 | /cuanto-devuelve-cada-juego/ | «Loto Plus — 1 en 784» | билет Loto Plus играет Tradicional + Match (по 6/5/4) + Desquite → 1/392 (как Quini 6 «два тиража») | 1 en 392; на /loto-plus/ добавлена эта же строка |
| 4 | /quiniela/simulador/ | «La mitad de los años termina en −$ 26.000 **o peor**» | хуже −26 000 не бывает: это медиана = потеря всего; 59,3 % лет без попадания | «En el **59,3 %** de los años no acertás ni una vez y perdés todo lo puesto» (когда медиана = всё поставленное; иначе прежняя фраза) |
| 5 | /quiniela/redoblona/ (браузер) | при ошибке ввода (обе a la cabeza; в Provincia первая дальше второй) оставались **прежние** «Chance 1 en 575 · $ 49» и таблица | вводит в заблуждение | при ошибке шанс/EV/таблица очищаются |
| 6 | /quiniela/cuanto-paga/ (браузер) | Provincia 5 цифр: «vuelven en promedio $ 10 **a $ 10**» | диапазон с одинаковыми концами | показывается одно число, если концы совпадают |
| 7 | деньги на всех страницах | «$ 43,2», «$ 175.087,5» | формат es-AR для денег — 2 знака | «$ 43,20», «$ 175.087,50»; целые — без копеек |
| 8 | /quiniela/simulador/ (браузер) | при неверной ставке оставались старые числа | — | очищаются |

Не ошибка, но отмечено: на всех турно с 27.10 по 31.10 и часть 03.11 стоит «1 fuente · LOTBA» — архив догружен только из LOTBA, а PBA за
вчера бралась из кэша на 20 ч (снятого до Vespertina/Nocturna). Исправлено в коде ленты (`tools/feeds/jugadadeldia/quiniela.mjs`: кэш PBA за
вчера 3 ч), **на сервер не синхронизировано**: `feeds-server.sh jugadadeldia sync` копирует рабочую копию, а в ней сейчас чужой
незакоммиченный `provincias*.mjs` — синк после того, как ресёрчер его закоммитит/уберёт.

## 4. UX: новичок и эксперт

- **Новичок не теряется:** у каждой страницы-лотереи первым экраном — что это и кнопка к инструменту; везде «1 en 100» простыми словами,
  «ningún número avisa», «para cobrar manda el extracto oficial». Главная уязвимость была в интенте «результаты»: человек с «quini 6»
  попадал на шансы. Теперь сверху карточка **«¿Ya salió el sorteo …?»**: где официальные числа (ссылка на лотерею, `rel="noopener"`, это
  не оператор ставок — гейт operator проходит) и что делать дальше (контроль билета ниже).
- **Эксперт получает достаточно:** точные дроби, формулы, цитаты регламентов с копией и датой (раскрывающиеся «De dónde sale»),
  χ², МК против точного расчёта, разбор цепочек энвидо, потолки редоблоны. Не хватает: формулы «по клику» на /quini-6/ (есть только
  таблица), явной оговорки на энвидо-тренажёре, что 3 одной масти без флор считаются как лучшие две (сейчас — только в тексте под таблицей).
- **Порядок на телефоне** (вопрос владельцу с QA 03.11, ответа нет): на страницах-инструментах сцена девушки стоит до инструмента.
  **Не меняли.** Предложение прежнее: сцена после первого инструмента (как на столах). На турно-страницах сцены нет — инструмент сразу.
- **Мелочи:** карты в калькуляторах энвидо/флор — `span role="img"` с кликом (лучше `button aria-pressed`); на /quiniela/ таблица
  6 × 5 на телефоне прокручивается вбок (ожидаемо, первая колонка липкая); турно-таблица сделана узкой (короткие имена, без min-width).
- **Лишнее «для стиля»:** не нашли воды; самое «декоративное» — пример-картон на /telekino/ и доска на /poceada/ (наглядность правила,
  оставили). Блоки «Cómo armamos cada extracto» повторяются на 11 страницах результатов — это доверие, но на турно-страницах они идут
  последними.

## 5. Сравнение с blackjack.cab (/es/, только чтение)

| | blackjack.cab | jugadadeldia |
|---|---|---|
| Структура гайда | длинная страница с оглавлением якорями (objetivo → valor → ronda paso a paso → jugadas → crupier → pagos → FAQ) | карточки-разделы, текст короткий, инструмент в первом экране |
| Инструменты | отдельный раздел /calculadoras/ (6 штук), тренер | инструмент на каждой странице (41 интерактив), игры против компьютера |
| FAQ | на каждом гайде | только /quiniela/cuanto-paga/ |
| Источники | правила казино без цитат | цитата + копия + sha256 у каждого числа регламента — **сильнее** |
| Данные | статичные | живые выписки каждые 15 мин, архив 120 дней |
| Перелинковка | футер «Herramientas / Aprender / Información» | меню, плитки «Seguí con», хлебные крошки |

Уровень по точности и инструментам — не ниже; по «пошаговости» гайдов blackjack.cab аккуратнее (оглавление + FAQ).
Предложение: короткий FAQ (3–5 вопросов с ответом из цитат) на /quini-6/, /loto-plus/, /telekino/, /quiniela/nocturna/ — только из того,
что уже процитировано (дни тиражей Quini 6 у нас **не** процитированы — не писать).

## 6. Что расширить (по спросу)

1. **Тукуман** 961k (+ варианты 106k вне плана) — самая большая дыра; лента Caja Popular делается (ресёрчер). Затем Catamarca 169k,
   Chaco 149k, Corrientes 144k, Formosa 134k, San Juan 127k — только с официальным источником.
2. **Результаты Quini 6 / Loto Plus / Telekino / Brinco** (≈ 1,0 млн по «resultados/sorteo/hoy» + головные 660k/184k/185k/35k): лента
   из официального источника (LOTBA публикует Loto; для Quini 6 — нужна читаемая копия) → тогда «Quini 6 de hoy: resultados» в title
   и автоподстановка чисел в контроль (как сделано на /quiniela-plus/).
3. **Tómbolas** (santiagueña 189k, salteña 141k, jujeña 61k, entrerriana 33k) — нет регламента/ленты (`gaps.json`).
4. **Nocturna по провинциям** («quiniela nocturna de mendoza» 21k, «córdoba nocturna» 16k): якорь/выбор турно уже есть на страницах
   провинций; можно добавить в title провинций «… hoy: Nocturna y turnos» (не трогали — title и так по главному ключу).
5. **«quiniela online» 97k** — гайд «¿Se puede jugar a la quiniela online?» (официальные каналы, возраст 18+, без ссылок на операторов)
   — нужна проверка закона по провинциям (casaslegales-реестры), по слову владельца.
6. **Significado de los números** 10k (+ «que número es la rata/la caída») — только как фольклор с пометкой 1/100; нужен цитируемый
   источник таблицы.
7. 2×2 в труко против компьютера (движок `game4.mjs` есть, UI нет) — для «truco online» 16k.

## Что сделано (кратко)

- Новые страницы: /quiniela/nocturna/, /matutina/, /vespertina/, /la-primera/, /la-previa/ (лента → последний тираж турно в 6
  юрисдикциях, неделя турно, час из программы LOTBA с цитатой); в меню — Nocturna/Matutina/Vespertina; плитки на /quiniela/,
  ссылки из таблицы часов /quiniela/horarios/ и шапки сетки дня.
- /quiniela-plus/: кнопка «Traer la última Nocturna de la Provincia» (из ленты, с отметкой «1/2 fuentes» и предупреждением при задержке).
- Карточки «¿Ya salió el sorteo?» на /quini-6/, /loto-plus/, /brinco/, /telekino/, /poceada/.
- Title/description по интенту: /quiniela/, /quiniela/nacional/, /quiniela/nacional-y-provincia/, /quiniela/extractos/, /quini-6/,
  /loto-plus/, /telekino/, /poceada/, /quiniela-plus/; план `data/plan/jugadadeldia.json` синхронизирован (116 строк, +5 турно).
- Исправления чисел и интерфейса — раздел 3.
