# Движок труко (jugadadeldia.com)

Решение владельца 03.11: «Игры против компьютера делай» — первым труко, потом generala, chinchón, escoba de 15, burako.
Generala, chinchón и escoba — в `docs/ENGINE-GAMES.md`.
Движок — чистые модули без DOM: один и тот же код в браузере (страница игры, инструменты) и в Node (сборка, тесты).

## Файлы
| Файл | Что делает |
|---|---|
| `engine/cards/rng.mjs` | ГСЧ xoshiro128** с засевом splitmix64 (не mulberry32 — TRAPS); сид — целое ≥ 0 или строка; состояние — 4 числа, кладётся в JSON |
| `engine/cards/spanish.mjs` | испанская колода 40 карт (без 8 и 9), имена карт, тасовка Фишера–Йетса, раздача по одной, перебор сочетаний |
| `engine/truco/cards.mjs` | сила карт (лестница 14 ступеней), очки envido и flor |
| `engine/truco/rules.mjs` | наборы правил (все поля обязательны), falta envido, цены цепочек envido |
| `engine/truco/game.mjs` | машина состояний: `newMatch`, `legalActions`, `apply`/`step`, `observation`, `serialize`/`deserialize`, `customHand` |
| `engine/truco/probability.mjs` | точные вероятности (полный перебор, дроби) |
| `engine/truco/simulate.mjs` | МК с сидом и его точный двойник (проверка) |
| `engine/truco/bots.mjs` | компьютер: `facil`, `normal`, `dificil` |
| `engine/truco/index.mjs` | всё вместе для страниц |
| `data/sources/truco/rules.json` + `_docs/` | источники правил, сохранённые копии, sha256, дословные цитаты |

Карта — строка: число + масть (`1e` — as de espadas, `7o`, `12c`); масти e/b/o/c.

## Правила (truco argentino, 1 на 1) и источники
Каждое правило движка стоит на цитате; тест `engine/test/truco-sources.test.mjs` проверяет sha256 копий и что каждая цитата дословно
есть в документе (PDF — через `pdftotext`, без учёта пробелов; HTML — видимый текст).

Источники (скачаны 03.11.2026):
1. **Juegos Bonaerenses 2026**, регламент труко (Провинция Буэнос-Айрес, juegos.gba.gob.ar) — главный: лестница карт, таблица envido,
   парда, truco/retruco/vale cuatro, flor, «a baraja» без карт, игра до 40 (20 malas + 20 buenas).
2. **Reglamento de Truco** (juegosdesalon.com, копия на folkloretradiciones.com.ar) — подсчёт envido и flor, максимум 33, игра до 30
   (15 malas + 15 buenas), «no quiero» в цепочке, falta «сколько не хватает ведущему до победы».
3. **Ludoteka, Truco (versión Truco Argentino)** — парда «по одной взятке и ничья — выигрывает тот, кто взял раньше».
4. **Регламент Encuentro Nacional de Empleados de Rentas** (Catamarca, arcat.gob.ar) — flor по договорённости; falta «до buenas, если
   ведущий в malas».

Что заложено:
- **Лестница:** 1e > 1b > 7e > 7o > тройки > двойки > 1o, 1c > 12 > 11 > 10 > 7c, 7b > 6 > 5 > 4; равная сила — парда.
- **Envido:** две карты одной масти — 20 + их значения; фигуры (10, 11, 12) — 0; иначе — старшая карта. Три одной масти без flor —
  20 + две старшие. Максимум 33. Ничья — у mano. Петь — только до своей первой карты и пока truco не принят; на truco можно ответить
  envido («el envido está primero»), потом ответить на truco.
- **Цепочка envido** — подпоследовательность envido, envido, real envido, falta envido. Querido — сумма (2 и 3), falta заменяет сумму.
  No querido — принятая часть до последнего канто (минимум 1). Пример из таблицы GBA: E+E+R+F no querido = 7.
- **Falta envido** — поле `falta` набора правил, три процитированных варианта: `malas-wins-match` (GBA: в malas — партия, в buenas —
  сколько не хватает ведущему), `leader-to-win` (juegosdesalon), `leader-to-stage` (Catamarca).
- **Truco:** callado 1; truco 2, retruco 3, vale cuatro 4; отказ — 1, 2, 3. Повышает только сторона, сказавшая «quiero».
  Ответ «retruco» на truco = «quiero retruco».
- **Парда:** первая парда — решает вторая; три парды — mano; по одной взятке и парда — кто взял первым; после парды ходит mano.
- **Me voy al mazo:** соперник получает текущую цену truco; до любой своей карты и до любых кантов — `mazoNoCardPoints` (GBA: 2).
- **Flor** (поле `flor: true/false`, по договорённости): обязательна, поётся первой, гасит envido; одна flor — 3; две: «con flor me
  achico» — 4 первому, contraflor — 6 лучшей (отказ — 4), contraflor al resto — лучшая берёт chico (отказ — 4). Ничья — mano.
  Если ушёл в mazo, а у соперника не спетая flor — она всё равно засчитывается.
- **Счёт:** envido и flor записываются сразу (партия может кончиться посреди раздачи), truco — в конце раздачи. Цель — 15, 30 или 40.
- **Наборов по умолчанию нет:** `newMatch(rules, seed)` без правил или сида — ошибка; именованные наборы (`RULESETS`:
  `bonaerense-40-con-flor`, `clasico-30-sin-flor`, `clasico-30-con-flor`, `corto-15-sin-flor`) страница передаёт явно.
- **2 на 2** (`players: 4`, `engine/truco/game4.mjs`, `bots4.mjs`; game.mjs сам отправляет туда состояния на четверых). Наборы
  `parejas-30-sin-flor` (ответ — пие) и `parejas-15-sin-flor` (ответ — следующий соперник, mazo до карт — 1). Цитаты `4p-*`:
  места по кругу против часовой, партнёры напротив (`seat % 2`); mano первым, следующая раздача — следующее место; база — старшая
  карта, равные старшие одной команды — команде, разных — парда; следующую базу начинает взявший, после парды — mano;
  envido поёт каждый до своей первой карты, пока truco не принят; отвечает другая команда — поле `responder` (обязательное):
  `'pie'` (последний игрок команды в раздаче, juegosdesalon: «capitán y estratega») или `'next'` (следующий её игрок после
  певшего: «cualquier jugador del bando contrario puede contestar»); querido — поют от mano, показывает только тот, кто бьёт
  лучший показанный соперника (иначе «son buenas»), ничья — ближе к mano; mazo — игрок уходит один, партнёр доигрывает, ушли
  оба — соперник берёт цену truco (до карт и кантов — `mazoNoCardPoints`). **Señas** — только у человека: `signal(state, seat,
  sign)` вне очереди, список из juegosdesalon §16 (`SENAS`), движок пускает только правдивые и по разу, видит их только
  партнёр; боты не сигналят, но партнёр-бот верит señas человека. **С flor 2 на 2 пока нет** (ошибка в правилах): у четырёх рук
  свои правила flor (несколько flor, «3 por cada flor»), не строили.
- Боты 2 на 2: те же уровни. normal/dificil тянут скрытые карты (с учётом сыгранных, показанных очков envido и señas партнёра),
  в каждой выборке играют базы с открытыми картами точным минимаксом за обе команды; dificil — больше выборок, веса по поведению
  соперников, учёт счёта и блеф. Турнир 03.11 (до 15, сиды фиксированы): dificil–facil 20/20, normal–facil 20/20,
  dificil–normal 14/20.

## Машина состояний
`legalActions(state, seat)` — пусто, если ход не этого места. `apply(state, action)` не меняет вход и бросает ошибку на незаконном
действии. Действия: `{type:'play', card}`, `envido`, `realEnvido`, `faltaEnvido`, `truco`, `retruco`, `valeCuatro`, `quiero`,
`noQuiero`, `mazo`, `flor`, `conFlorMeAchico`, `contraflor`, `contraflorResto`. После раздачи сразу сдаётся следующая (из ГСЧ в
состоянии), законченная лежит в `state.lastHand`, счёт по раздачам — `state.history`. `observation(state, seat)` прячет карты соперника
и ГСЧ — бот видит только её.

## Компьютер (`createBot(level, seed)`)
- **facil** — случайные законные ходы с простыми правилами (envido при ≥ 28, «quiero» монеткой с поправкой на сильную карту).
- **normal** — envido по точной вероятности выиграть (перебор всех рук соперника, совместимых с тем, что видно: сыгранные карты,
  показанные очки, flor/не flor); truco — по вероятности взять взятки (перебор рук соперника, обе стороны играют с открытыми картами),
  принимает, если ожидание «quiero» не хуже отказа; кладёт самую младшую бьющую карту, первой — ту, что держит лучший шанс.
- **dificil** — то же для envido, плюс МК-детерминизация: руки соперника из точного остатка колоды, взвешенные по его поведению (пел ли
  envido, молчал ли, звал или принимал truco), решение по выборке; учитывает счёт (на матч-пойнте соперника не отказывается) и блефует
  с заданной частотой (10 %).
Детерминированы при одном сиде; выбирают только из `obs.legal`, незаконный ход невозможен (проверено фаззом).

Сила на сидах (турнир 03.11, места по очереди, сиды фиксированы): dificil — normal 74/100 до 30 и 67/100 до 15;
dificil — facil 59/60 до 30 с flor; normal — facil 57/60 до 30. В тестах — замок «> 60 %» для dificil и normal против facil.

## Вероятности (тест-замки)
- Распределение envido по всем C(40,3) = 9880 рукам — замок по каждой клетке; 0 очков — 108, 33 — 152.
- P(flor) = 4·C(10,3)/C(40,3) = **12/247**; шанс flor у соперника при моей руке — точная дробь (пример 38/777).
- Envido против случайной руки (7770 рук), «у соперника ≥ X», карта против случайной карты.
- Взятки с открытыми картами против случайной руки (точный минимакс; сверен с перебором через сам движок на 150 раздачах).
- МК с сидом `handWinMC` и его точный двойник `handWinPlainExact` (та же простая игра по всем 7770 рукам) — МК в пределах 4σ.

## Как страница будет пользоваться
```js
import { RULESETS, newMatch, legalActions, apply, toAct, observation, createBot } from '/engine/truco/index.mjs';
let s = newMatch(RULESETS['clasico-30-sin-flor'], crypto.getRandomValues(new Uint32Array(1))[0]);
const bot = createBot('normal', 12345);
// ход человека: s = apply(s, action) из legalActions(s, 0); ход компа: s = apply(s, bot.choose(observation(s, 1)))
```
Состояние — JSON: сохранить партию в `localStorage` и продолжить — `serialize`/`deserialize`. Для тренажёра «¿quiero o no quiero?» —
`customHand(rules, seed, hands, { mano, score })` и ответ `normal`/`dificil` как «ответ движка». Для `/truco/envido/`, `/truco/flor/`,
«repartí una mano» — функции `probability.mjs`. Анимации и звук — на странице (PLAYBOOK §10), движок их не знает.

## Тесты
`engine/test/cards.test.mjs`, `truco-rules`, `truco-game`, `truco-4` (2 на 2: правила, базы, envido по командам, ответ pie/next,
mazo, señas, фазз 10 000 раздач, боты), `truco-fuzz` (10 000 раздач случайной игры: законность, счёт, конец матча,
чистота `apply`, сериализация; все уровни ботов друг против друга с flor и без), `truco-prob`, `truco-bots`, `truco-sources`.
