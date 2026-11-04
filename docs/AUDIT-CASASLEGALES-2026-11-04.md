# Аудит casaslegales.com — 04.11.2026 (главная, провинции, реестры, верификатор, гайды, калькуляторы, служебные)

Задание владельца 04.11 (DECISIONS, «полный аудит трёх сайтов»). Страницы операторов `/operador/*`, страницы казино брендов и
`/casinos-online-legales` в это время перестраивает другой агент (обзоры), поэтому здесь по ним — только ключи и что должна закрыть
перестройка. Исправления этого аудита — коммит `9e57809` (выкладка — см. конец).

Проверка: сборка из HEAD + гейты (99 HTML, 0 замечаний), `npm test` зелёный, **76 независимых пересчётов чисел** калькуляторов
(скрипт без `engine/odds.mjs`, сверка с HTML) + ручные прогоны в браузере (375 px): маржа, конвертер (12 вводов во всех форматах),
«sin margen» (2 и 3 исхода, американские), комбинированная (1–3 события), гандикап (7 случаев, в т. ч. ошибки ввода).

## 1. Ключи (348 ключей, 5,94 млн/мес, `docs/research/kw-audit/kwaudit.json`)

| Класс | Ключей | Объём | Раскрыто страницей | Что с остальным |
|---|---|---|---|---|
| бренд (betsson, betano, bet365…) | 62 | 4,70 млн | 36 ключей / 450 тыс. | **betsson 1,9 млн, betano 1,33 млн, bet365 1,0 млн в плане не привязаны ни к одной странице** (`url: null`) — закрывает перестройка `/operador/*` в обзоры: страница бренда должна отвечать на «что это, легален ли в моей провинции, официальный адрес, оплата, вывод, приложение, поддержка». Привязать ключи к `/operador/<бренд>` в плане |
| бренд + провинция | 67 | 433 тыс. | 44 / 407 тыс. | betsson pba 149k → `/operador/betsson/buenos-aires`; **betsson caba 77k привязан к `/provincia/caba`, хотя есть `/operador/betsson/caba`** — перенести ключ; «betsson casino provincia/pba/caba/córdoba» (~20k) — новые страницы казино брендов |
| бренд + casino | 48 | 278 тыс. | 27 / 221 тыс. | казино брендов (перестройка). «casino magic online» 9,2k привязан к ненаписанной `/verificar/casino-magic`, а марка есть в списке Неукена → перенести на `/operador/casino-magic-online` |
| casino (общие) | 48 | 312 тыс. | 12 / 249 тыс. | **casino online 214k** → `/casinos-online-legales` (сейчас это страница «какие списки называют казино» — интент шире, см. §6); «casino online argentina» 18k привязан к `/provincias` — **несоответствие**, перенести на хаб казино; «casino 365 online» 7,7k + 1,9k = bet365 casino (казино бренда); «mercadopago» 9,4k, «que casino paga mas» 7k, «dinero real» 2,3k — гайды не написаны (нужны данные оплат/RTP из сбора) |
| login (бренд + iniciar sesión) | 24 | 84 тыс. | 0 | не обработаны: навигационный интент. Честный ответ возможен — см. §6 |
| app (бренд + app/apk/descargar) | 23 | 51 тыс. | 0 | не обработаны: нет копий страниц магазинов. После сбора — раздел «App» в обзоре |
| promo / gratis / código | 39 | 45 тыс. | 0 | **не обрабатываем намеренно**: «sin bonos» (решение владельца, без монетизации) |
| общие ставки (apuestas deportivas…) | 16 | 24,6 тыс. | 16 / 24,6 тыс. | раскрыты формально: «apuestas deportivas» 9,3k и «apuestas online» 5,1k висят на `/operadores` — интент «как это работает и где легально» закрыт слабо → гайд, §6 |
| legal | 15 | 6,0 тыс. | 14 / 5,8 тыс. | раскрыты: главная, `/licencias`, хаб казино, верификатор |
| бренд + legal/oficial | 4 | 4,4 тыс. | 3 | «betsson oficial» 2k → верификатор (теперь с кнопкой на офиц. адрес); «bet365 legal states» 2,2k — США, не наш интент |
| .bet.ar | 2 | 0,8 тыс. | 2 | `/guia/bet-ar` |

Итог по моим страницам: всё, что привязано к главной, реестрам, провинциям, верификатору и `/verificar/*`, построено и отвечает
на запрос; крупные дыры — бренды без привязки (4,2 млн — задача обзоров), «casino online» (интент шире страницы), login/app (135k).
Калькуляторы в выгрузке ключей отсутствуют (выгрузка была по «casas de apuestas / legales»): спрос на «calculadora de cuotas»,
«hándicap asiático», «apuestas combinadas» не измерен — отдельная выгрузка Ahrefs ≈ 10 фраз × 21 ед. ≈ 200 единиц.

## 2. Соответствие интенту и title (после правок)

| Страница | Главные ключи (объём) | Title (длина) | Интент / вывод |
|---|---|---|---|
| `/` | casas de apuestas 2,1k; casa de apuestas 2k; apuestas deportivas argentina 1,8k | Casas de apuestas legales en Argentina, por provincia (53) | да: выбор провинции → сколько сайтов, список, помощь |
| `/licencias` | casinos online argentina legales 3,6k; casinos legales… | **было** «Registro de licencias de apuestas online por provincia» → **Casinos y apuestas online legales: registro de licencias** (56) | да; добавлено: «Ir» к каждому адресу, оговорка «2 списка выделяют казино» (число считает код) |
| `/provincias` | casino online argentina 18k | Juego online por provincia: regulador y sitios habilitados (58) | **нет для 18k**: страница про регуляторов. Ключ — на хаб казино |
| `/verificador` | betsson oficial 2k; bet365.com.ar 1,1k; bet365.bet.ar 500 | ¿Es legal este sitio de apuestas? Verificador .bet.ar (53) | да; в результате — кнопка на офиц. сайт (другой агент) |
| `/casinos-online-legales` | casino online 214k | Casinos online legales en Argentina, provincia por provincia (60) | частично: отвечает «какие легальны», не «что такое/как выбрать/как играть» — §6 (файл другого агента) |
| `/operadores` | apuestas deportivas 9,3k; apuestas online 5,1k | Operadores de apuestas con licencia provincial… (59) | слабо для этих ключей → гайд §6 |
| `/provincia/buenos-aires` | casino buenos aires online 10k; casino online buenos aires 2,9k | Apuestas online legales en Provincia de Buenos Aires (52) | частично → **добавлен блок «¿Buscás Casino Buenos Aires Online?»**: в списке PBA её нет, она в списке CABA (адрес, ссылка на карточку). «casino» в title — после того как обзоры подтвердят казино у 7 сайтов |
| `/provincia/caba` | betsson caba 77k | Apuestas online legales en CABA: sitios que autorizó LOTBA (58) | для «betsson caba» точнее `/operador/betsson/caba` — перенести ключ |
| `/provincia/cordoba` | casino online cordoba 2,6k | Apuestas online legales en Córdoba: las 4 plataformas (53) | да по легальности; «casino» — как PBA |
| `/provincia/santa-fe` | casino online santa fe 1,4k + 0,9k | …Santa Fe: las 4 plataformas (54) | да; список SFE сам делит casino/apuestas |
| `/provincia/mendoza` | casino online mendoza 1,3k | …Mendoza: las 7 plataformas (53) | да |
| `/provincia/la-rioja`, `/neuquen`, `/rio-negro` | jugadon la rioja 3,2k; casino magic neuquén 1,1k; casino del rio 1,4k | «Juego online legal en …» (50–53) | да: марки в списках, ссылки «Ir» |
| `/provincia/entre-rios` | bplay entre rios 2,4k | Juego online legal en Entre Ríos: la plataforma de IAFAS (56) | **добавлен ответ «¿bplay es legal en Entre Ríos?»**: в копии iafas.gov.ar имени нет (код считает вхождения), где bplay есть в списках |
| `/provincia/jujuy` | bplay jujuy 1,3k; betwarrior jujuy 350 | **было** «Juego online en Jujuy: qué pudimos verificar» → ¿Es legal apostar online en Jujuy? Lo que verificamos (53) | теперь явно про легальность + ответы по bplay и BetWarrior |
| `/provincia/salta` | betwarrior salta 900 | → ¿Es legal apostar online en Salta? Lo que publica el ENREJA (59) | + ответ по BetWarrior (0 вхождений в копии ENREJA) |
| `/provincia/chubut` | betwarrior chubut 300; casino club comodoro/trelew 450 | → ¿Es legal el juego online en Chubut? Por qué no lo citamos (58) | + ответы по BetWarrior и Casino Club |
| `/provincia/santa-cruz` | casino club río gallegos 450 | → ¿Es legal el juego online en Santa Cruz? Qué dice la Lotería (60) | + ответ по Casino Club |
| `/provincia/san-luis` | jugadon san luis 400 | → ¿Es legal apostar online en San Luis? Lo que verificamos (56) | + ответ по Jugadón |
| `/provincia/tucuman`, `san-juan`, `tierra-del-fuego`, `catamarca`, `la-pampa`, `formosa`, `santiago-del-estero` | — | все → «¿Es legal el juego online en …?» (44–57) | страницы только о легальности — теперь это явно в title и H1 (правило владельца) |
| `/calculadora/margen` | (нет в выгрузке) | Calculadora de margen de cuotas: cuánto se queda la casa (56) | **было неточно**: плитка «6,65 % margen de la casa» + текст «cuánto se queda la casa» — а казино оставляет 6,23 %. Исправлено (§3) |
| `/calculadora/cuotas` | — | Conversor de cuotas: decimal, fraccional y americana (52) | да |
| `/calculadora/combinada` | — | Apuestas combinadas: cómo se multiplica el margen (49) | да; термины выровнены с калькулятором маржи |
| `/guia/handicap` | — | Qué es el hándicap en apuestas, con fútbol argentino (52) | да; **добавлен калькулятор** и отличие от европейского гандикапа |
| `/guia/bet-ar` | .bet.ar 450; bet.ar 350 | Qué es el dominio .bet.ar y por qué importa (43) | да (исправлено «pba..» в перечне поддоменов) |
| `/guia/como-verificar` | — | Cómo verificar si un sitio de apuestas es legal en Argentina (60) | да |
| `/guia/sitios-ilegales` | — | Sitios de apuestas ilegales: qué dicen las provincias (53) | да |
| `/guia/ley-federal` | — | Ley federal de juego online: en qué estado está (47) | да |
| `/guia/menores` | — | Menores y apuestas online: la regla de los 18 en Argentina (58) | да |
| `/juego-responsable`, `/autoexclusion` | — | (53), (57) | да; помощь без ссылок на операторов (гейт) |
| `/verificar/zeus` … `/mystake` (7) | casino zeus online 5,6k; jugabet 1,8k; tucan win 1,6k; betbox 1,5k; 1win 1,2k; betonwin 1,1k; mystake 0,9k | «¿Es legal X en Argentina? Qué dicen los registros» (52–59) | да: легальность в title и H1, 0 вхождений в 8 списках (код) |

## 3. Ошибки в числах

Арифметических ошибок нет: все 76 чисел на четырёх страницах совпали с независимым пересчётом; интерактивные расчёты в браузере
совпали с формулами (пример: 1,90/1,90 → маржа 5,26 %, казино оставляет 5,00 %; −110/−110 → 4,76 %; 10/11 → 1,91 и −110;
гандикап −0,75 при 2-1 и кф 1,90 → $1 450).

Найдено и исправлено (смысл чисел):
1. **Маржа ≠ «сколько оставляет казино».** Маржа = сумма вероятностей − 1 (6,65 % в примере); казино оставляет 1 − 1/сумма (6,23 %).
   Страница называла первое вторым. Теперь четыре плитки: маржа · «se queda la casa» · возврат · сумма; текст объясняет разницу
   («de cada $1.000 vuelven $938, la casa se queda $62»); добавлен разбор «paso a paso» с числами примера.
2. **Комбинированная противоречила калькулятору маржи**: одно и то же событие 1,72/3,60/5,00 там «margen 5,6 %», здесь было бы 5,92 %.
   Теперь на комбинированной «se queda la casa» (5,6 % → 32,2 % за 6 событий) и отдельно маржа комбинации s₁×…×sₙ − 1 = 47,5 % (код).
3. Гандикап: была только сетка исходов — нет расчёта для своего матча. Добавлен калькулятор (любая линия −3…+3 с шагом 0,25,
   голы, кф, сумма → исход, счёт с линией, возврат, прибыль/убыток), формат «1,5» вместо «1,50».
4. `/guia/bet-ar`: «…mza., pba..» — лишняя точка в конце перечня.

## 4. UX: новичок и эксперт

- **Новичок.** Сильное: выбор провинции на главной сразу даёт число сайтов и линию помощи; «Cómo leer una dirección» (поддомен/имя/
  .bet.ar); на каждом калькуляторе «что говорит / чего не говорит». Слабое (исправлено): страницы провинций без списка были тупиком —
  теперь прямой ответ «¿X es legal en <провинция>?»; на калькуляторе маржи — пошаговый разбор. Осталось: нет глоссария (cuota,
  margen, hándicap, disposición, subdominio); в `/licencias` колонка «Acto» непонятна без пояснения.
- **Эксперт.** Сильное: цитаты регулятора дословно, дата и sha256 копии, реестр источников, «cuota justa» во всех форматах.
  Не хватает: журнала изменений списков (`/cambios`, нужен хеш-монитор), выгрузки реестра (CSV/JSON), реально измеренной маржи
  операторов (даст перестройка обзоров через `engine/odds.mjs`).
- **Можно ли перейти по легальному адресу (вопрос владельца).** Да на: списках `/provincia/*` и верификаторе (другой агент),
  **`/licencias` — кнопка «Ir» у всех 47 адресов (ARBET без кнопки: домен не резолвится, `DEAD`)**, главная — блок «¿Estás en el sitio
  de tu provincia?». Намеренно без кнопки: адреса других провинций в блоке «misma marca» на странице провинции (кнопка своей
  провинции — в списке выше), примеры в гайдах `/guia/bet-ar`, `/guia/como-verificar`, страницы помощи (гейт). **Ещё нужно:**
  таблица 48 адресов на `/verificador`; платформы провинций (iafasplay.bet.ar, guazubet, interbet, la correntina) — сейчас гейт
  разрешает только хосты из 8 проверенных списков; предлагаю расширить разрешённый список хостами, которые регулятор сам
  ссылает на своём сайте (`href` уже в доказательстве `provinces.json`) — решение по гейту за агентом, ведущим ссылки.
- **Важное выделено**: большие числа (сайтов в списке), цветные чипы статуса, плитки результата; 18+ и линия помощи в каждом подвале.

## 5. Сравнение с blackjack.cab/es

| | blackjack.cab | casaslegales |
|---|---|---|
| Обучение «как» | Academy + ~20 страниц «cómo/cuándo» и глоссарий | 4 калькулятора/гайда по ставкам; глоссария нет |
| Калькуляторы | «Cómo se calcula» под каждым, сравнение «tu mesa vs otras», блок «Otras calculadoras» | формулы, примеры, визуал (полосы, лестница); пошаговый разбор пока только на марже; перекрёстные ссылки есть |
| Легальность | одна страница по странам, H1 «¿Es legal…?» | 24 юрисдикции, 8 официальных списков с цитатой и датой — **глубже и проверяемее** |
| Доверие | методика, juego responsable | методика, реестр источников с хешами, гейты публикации — **сильнее** |

Вывод: по источникам и честности casaslegales выше эталона; по объёму обучающих «как»-страниц и глубине калькуляторов — ниже.

## 6. Что расширить (по убыванию пользы)

1. **Хаб «casino online» (214k + 18k + 2,7k).** Развернуть `/casinos-online-legales` (не новая страница — без каннибализации):
   что такое казино онлайн, RTP и преимущество казино (считает код), слоты vs live, какие сайты легальны в твоей провинции
   (кнопки «Ir»), ссылки на казино брендов, как проверить, помощь. Файл ведёт агент обзоров — согласовать; ключ «casino online
   argentina» перевести с `/provincias` сюда.
2. **`/guia/apuestas-deportivas` (9,3k + 5,1k + 1,8k).** Как работает ставка: кф и вероятность, 1X2, más/menos, ambos marcan,
   гандикап, комбинированная, live/cash out, маржа; где легально — по провинциям; все числа из `engine/odds.mjs`, ссылки на 4 калькулятора.
3. **Честные «iniciar sesión / app» (135k).** Не отдельные тонкие страницы, а разделы обзора бренда с якорями (`#ingresar`, `#app`):
   официальный адрес твоей провинции (кнопка), как отличить фишинг, своя капча публичной страницы входа, ссылка на страницу
   приложения в магазине (копия публичной страницы — сбор через Chrome владельца). Для топ-3 (Betsson 25k+19k+6,5k, bet365, Betano) —
   отдельные страницы `/operador/<бренд>/ingresar`, если владелец согласен.
4. **Гайды на данных сбора:** `/guia/mercado-pago` (9,4k), «qué casino paga más» (7k, честно: RTP игр и почему «паёт больше» не бывает),
   «casino online dinero real» (2,3k).
5. **Списки Jujuy, Salta, Chubut через Chrome владельца с VPN** (InProJuy грузится только скриптом; Lotería del Chubut — лимит и
   вставки): если появится список — блоки «¿X es legal…?» сами превратятся в ответ «figura/no figura».
6. **Глоссарий** `/guia/glosario` и «paso a paso» на конвертере и комбинированной (как у blackjack.cab).
7. **В title провинций PBA/Córdoba/Mendoza добавить «casino»** — после того как обзоры подтвердят казино у сайтов списка (сейчас
   списки PBA/CABA/CBA/LRI/RNE/MZA не разделяют казино и ставки — утверждать нельзя).
8. Выгрузка Ahrefs по калькуляторам (≈ 200 ед.) — понять спрос до расширения.
9. План: перенести ключи betsson caba → `/operador/betsson/caba`, casino magic online → `/operador/casino-magic-online`,
   betsson/betano/bet365 → `/operador/<бренд>`.
