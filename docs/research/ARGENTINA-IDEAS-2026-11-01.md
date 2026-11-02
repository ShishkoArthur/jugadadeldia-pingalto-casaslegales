# Аргентина: идеи сайтов (ресёрч 01.11.2026, агент; сохранено ведущим)

Владелец 01.11: «Предложи какие сайты мы можем сделать для Аргентины». Выгрузки Ahrefs: `data/keywords/*ar-ideas*` (AR, среднее за 12 мес.).
Ahrefs: 16 640 единиц (overview ≈ 98 ед./строку, matching ≈ 67 ед./строку — дороже, чем в PLAYBOOK); счётчик 195 745 → 212 385, сброс 9.11.

## Уже есть у владельца (не дублировать)
- casinovictoriargentina.com — одно казино Victoria (Энтре-Риос), 17 стр.
- atlassinoar.com — реестр 35 наземных казино по провинциям + academy (рулетка, блэкджек, баккара, крэпс, покер) + помощь.
- simsinohub.com /es/ — 78 стр. казино-симуляторов на испанском. blackjack.cab — есть es.
- Исключены: реестр казино, симуляторы казино, блэкджек, обзоры букмекеров (монетизация; закон о рекламе ужесточают).

## Ключи (объём/мес, KD)
Quiniela и лотереи: quiniela 1 410 000/43; quiniela de hoy 1 080 000/55; quini 6 660 000/17; quiniela de tucumán 546 000/0;
quiniela en vivo 490 000/18; quiniela de mendoza 267 000/13; quiniela plus 193 000/5; telekino 185 000/0; loto plus 184 000/10;
quiniela nacional 167 000/46; quiniela formoseña 120 000/25; catamarca/san juan 115 000/113 000, KD 0; entre rios 104 000/30;
córdoba 47 000/0; poceada 37 000/12; brinco 35 000/0; tombola 26 000/5; cuanto paga la quiniela 4 500/12; los numeros de la
quiniela 1 500/43. Лидеры: notitimba DR 2,9; ruta1000 7; quini-6-resultados 13; jugandoonline 15; tujugada 18; vivitusuerte 20.
Труко и игры: truco argentino 23 000/0; valores del truco 21 000/0; señas del truco 16 000/0; truco online 16 000/0; truco 12 000/12;
anotador de truco 10 000/0 (+ ≈7 000 вариантов); burako 8 400/0; jugar al truco 5 400/9; chinchon 4 400/0; generala 3 500/3.
Футбол: promedios 361 000/13 (навигационный к promiedos.com.ar DR 53); tabla anual 72 000/16; copa de la liga 13 000/12;
tabla de promedios 9 500/14; prode 7 800/45; simulador mundial 2026 6 800/1 (ЧМ прошёл); copa libertadores 263 000/50.
Моторы и прочее: formula 1 525 000/44; colapinto 298 000/35; turismo carretera 19 000/13; hipodromo de palermo 9 300/22;
dakar 5 000/22; apuestas deportivas 9 300/47; casino online 214 000/61.

## Закон и помощь (первоисточники, 01.11.2026)
- PBA (loteria.gba.gob.ar/juego-online): ley 15.079 (2019), decreto 181/19, 7 лицензий; 18+; «Todos los sitios legales de apuestas
  terminan en “.bet.ar”».
- CABA: список агентств на juegosegurolegal.gob.ar.
- Федеральный закон о лудомании: полусанкция Diputados 27.11.2024, в Сенате стоит; может потерять статус в ноябре 2026; проект
  правительства (май 2026) — ограничение рекламы. Источники вторичные (canal26.com 20.10.2026, focusgn.com 29.09.2025) — перепроверить.
- Помощь: CABA 0800-666-6006; PBA 0800-444-4000 (самоисключение 2 года); Córdoba 0800-777-2983; Entre Ríos (IAFAS) 0800 444 2327.
  Santa Fe — сайт не отвечает с нашего сервера (гео-блок?), Mendoza — не проверено.
- Для некоммерческого сайта прямых запретов нет: 18+, помощь по провинции, без ссылок на операторов.

## Живые данные без ключей
- loteria.gba.gob.ar/api-loteria/extractos/<дата> — 200, JSON с PDF-выписками в base64 (все тиражи quiniela PBA), pdftotext.
- LOTBA, Córdoba, IAFAS — HTML, ленты искать; Santa Fe (Quini 6, Brinco) — нужен доступ из AR.
- Футбол: ESPN site.web.api.espn.com standings arg.1 — 200 (неофициально); TheSportsDB (ключ «123») — проверить условия.

## Концепции
1. **QuinielaMath — математика quiniela и лотерей + официальные результаты** (модель kenomath). Калькуляторы quiniela (a la cabeza,
   a los 5/10/20 — коэффициенты из регламента), redoblona, Quini 6 по модальностям, Loto Plus/Brinco/Telekino/Tómbola, проверка билета,
   результаты по юрисдикциям, частоты 00–99 с разбором ошибки игрока, «значения номеров» как фольклор с оговоркой 1/100, возврат на
   песо, симулятор «год игры», налог (ARCA), расписание, помощь. Риски: много хрупких лент (PDF/HTML), права на перепубликацию.
   Домены (whois свободны на 01.11): quinielamath.com, quinimath.com, bolilleromath.com.
2. **Truco и местные игры** — анотадор, envido/flor вероятности, тренажёр «quiero/no quiero», бот 1×1, генерала (servida 1/1296),
   чинчон, буракo, escoba. KD 0, без данных, вне азартных игр. Домены: trucomath.com, envidomath.com, cuantoenvido.com.
3. **Футбол Аргентины** — promedios с проекцией вылета, tabla anual, Монте-Карло, cuotas/no-vig. Риски: регламент AFA меняется
   ежегодно, promiedos DR 53, данные «серые». Домены: descensometro.com, promediomath.com, tablamath.com.
4. **Моторы** — F1 (Колапинто) + Turismo Carretera. Интент новостной, KD 35–44, TC без API.
5. **Скачки** (Palermo, San Isidro) — малый спрос; лучше разделом №1 или №3.

Рекомендация агента: №1 QuinielaMath; вторым дешёвым — №2 Truco (если владелец согласен выйти за беттинг).
