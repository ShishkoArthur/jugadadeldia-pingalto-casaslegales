# Обслуживание раз в полгода — jugadadeldia.com · pingalto.com · casaslegales.com

Владелец хочет вмешиваться **не чаще раза в полгода** (PLAYBOOK §17.2; 04.11: «Работай до конца по всем моментам что не нужно моего
вмешательства»). Здесь — что идёт само, что делает агент и что может сделать только владелец, с датами (состояние на 04.11.2026).
Ленты подробно — `docs/FEEDS.md`; копии владельца — `docs/reference/owner-saves/README.md`; обзоры — `docs/REVIEWS-DATA.md`.

## Календарь

| Дата | Что истекает / происходит | Сайт | Кто | Что сделать |
|---|---|---|---|---|
| каждый месяц | сервер перепроверяет официальные страницы (лента `listas`): 42 копии реестров, провинций и пакета помощи (04.11: 38 сошлись, 4 не открылись) | casaslegales (+ пакет помощи jdd) | **само** | ничего; изменение списка → Telegram |
| **до 09.02.2027** | пакет помощи (копии 01.11, 100 дн.) — в репозитории; на сервере обновляется сам | jdd, casaslegales | агент | `feeds-server.sh casaslegales pull --write` → `npm test` → commit → `sync` обеих лент → deploy jdd и casaslegales |
| **09.04.2027** | Telegram-напоминание (за 21 день до 30.04) — один список на полгода: копии владельца, операторы, обзоры (всё, что истекает до 29.06) | casaslegales | бот | — |
| **30.04.2027** | 4 копии 01.11, ждут копию владельца (180 дн.): новость Diputados (hcdn.gob.ar), помощь Mendoza (mendoza.gob.ar — 403 серверу), помощь Tucumán (cajapopular.gov.ar — таймаут), ley 8986 (e-legis — robots 500) | casaslegales, jdd | **владелец** | сохранить из Chrome в Аргентине (README owner-saves) |
| **02.05.2027** | 17 копий владельца (180 дн., решение 04.11): Córdoba, Neuquén, Río Negro, Salta, Santa Fe, Mendoza + их страницы помощи, главная Caja Popular (Tucumán) | casaslegales (+ копии в jdd `/quiniela/online/`) | **владелец** | сохранить из Chrome (таблица ниже) и прислать |
| **02.05.2027** | копии страниц операторов и скриншоты (180 дн.) | casaslegales | владелец + агент | Chrome из AR / `capture-shots.mjs` |
| **02.05.2027** | источники pingalto (`data/sources/pingalto`, 180 дн., копии 03–04.11) | pingalto | агент | скачать заново, сверить цитаты, commit, deploy |
| **03.05.2027** | данные обзоров 27 марок (180 дн., собраны 04.11) | casaslegales | **владелец** (Chrome + VPN AR) | пересобрать обзоры |
| **05.05.2027** | копии правил лотерей LOTBA/PBA/CAS (183 дн.) и правила игр (труко, генерала, чинчон, эскоба, бурако) | jdd | агент | `verify-sources --recheck --write`, копии правил — заново, commit, `sync`, deploy |
| 9-е число | сброс лимита Ahrefs | все | — | ключи обновлять после 9-го |

Что будет, если ничего не делать: **живые сайты работают** (страницы статичны, ленты обновляются сами). Перестают проходить
выкладки (гейт `fresh`), а на сайтах со сроком помощи строки помощи провинции прячутся и остаётся национальная линия.

## Что идёт само (без людей)
- **jugadadeldia:** кинела каждые 15 мин, провинции, лото, программа и цены LOTBA, сроки источников (`fuentes`) — Telegram за 14 дней.
- **pingalto:** расписание PandaScore, Clash Royale, Brawl Stars, рейтинги — каждый час/сутки.
- **casaslegales:** `listas` — раз в месяц скачивает каждую официальную страницу, которую серверу можно качать, и сверяет цитаты и
  полноту списков; без изменений → новая дата «revisada el …» на страницах (через `/data/feeds/listas.json`), серверная копия
  обновлена; изменилось → не публикуется, сообщение с разницей (кто добавлен/убран). `plazos` — сроки того, что сервер не обновит,
  и одно напоминание за 21 день.
- Образы контейнеров пересобираются раз в 30 дней (обновления Node и poppler), логи ротируются.

## Что может сделать только владелец
1. **Копии сайтов, закрытых для ИИ, и гео-блок** (Chrome на компьютере, `Ctrl+U` → `Ctrl+S`, «только HTML»; Santa Fe и Mendoza — из
   Аргентины или с VPN AR). Список и адреса — `docs/reference/owner-saves/README.md` («Что сохранить»), на 04.11 это 21 страница:
   `cba-juegos-online`, `ar-x-loteria-juego-responsable` (Córdoba); `neu-juego-legal`, `neu-casinos`, `ar-q-ijan-juego-responsable` (Neuquén);
   `rne-inicio`, `rne-rionegrina-online`, `ar-r-loteria-autoexclusion` (Río Negro); `sal-enreja-juego-autorizado`, `ar-a-enreja-jr` (Salta);
   `santa-fe-plataformas`, `santa-fe-inicio`, `santa-fe-juego-responsable`, `santa-fe-juego-compulsivo`, `santa-fe-historia` (Santa Fe);
   `mendoza-plataformas` (Mendoza); `ar-hcdn-media-sancion-2024-11-27` (Diputados, закрыт для ИИ с 04.11); `ar-m-ipjyc-juego-responsable` (mendoza.gob.ar, 403 серверу),
   `tuc-caja-popular-inicio`, `ar-t-caja-popular-juego-responsable`, `ar-t-ley-8986` (Tucumán; сервер их не открывает). Плюс страницы из
   пункта 2 напоминания, если сервер перестанет открывать новые. Положить в `docs/reference/owner-saves/<ГГГГ-ММ-ДД>/` или прислать в чат.
2. **Обзоры** (27 марок): Chrome с VPN-выходом в Буэнос-Айресе, только публичные страницы, без входа и депозитов (порядок — `docs/REVIEWS-DATA.md`).
   Агент ведёт сбор через Chrome владельца (как 04.11) — владельцу нужно только включить VPN и Chrome с расширением.
3. **Search Console** — добавить три сайта (обещано «в гск добавлю потом»); раз в полгода посмотреть покрытие и ошибки.
4. **Ключи** — если сервис сменил условия: PandaScore (токен, бесплатный план), Supercell (ключи привязаны к IP 187.7.26.95),
   Telegram-бот @jpc_avisos_bot, Cloudflare (токен должен видеть три зоны), Ahrefs (общий лимит рабочего пространства).

**Решение владельца 04.11** («да, продлевай до 180 дней», `docs/DECISIONS.md`): копии владельца (сайты, закрытые для ИИ, и гео-блок) —
180 дней, как обзоры и операторы. Всё, что делает владелец, сходится в один визит в полгода (одно напоминание 09.04.2027). Копии, которые
сервер скачивает сам, — по-прежнему 100 дней (он обновляет их каждый месяц).

## Что делает агент (по напоминанию или раз в полгода)
1. `bash tools/feeds-server.sh <сайт> status` для jugadadeldia, pingalto, casaslegales: health OK, `fails` 0, таблица `expiries`, `logs 300`.
2. **casaslegales:** `bash tools/feeds-server.sh casaslegales pull` (что сервер обновил) → `pull --write` → `npm test` → commit
   `data/sources/...` → `sync` casaslegales **и jugadadeldia** (общий пакет помощи) → `bash tools/deploy.sh casaslegales` и `jugadadeldia`.
   Изменения из Telegram («changed on the official page»): открыть страницу, поправить данные руками (новая строка — с HTML-доказательством),
   ничего не подгонять.
3. Копии владельца: `node tools/owner-copy.mjs <имя> <файл> --date <дата> [--write]` для каждой (README owner-saves) → `npm test` → commit → deploy.
4. Обзоры: пересобрать через Chrome владельца (формат `docs/REVIEWS-DATA.md`), `node tools/verify-reviews.mjs`, `review-shots.mjs`, deploy.
   Операторы: `node tools/capture-shots.mjs` (гео-блок — Chrome владельца), `verify-operators`, deploy.
5. jugadadeldia: `node tools/verify-sources.mjs --recheck --write` (реестры) и копии правил лотерей/игр к 05.05.2027; `sync` jugadadeldia.
6. pingalto: источники (`data/sources/pingalto`) — скачать заново к 02.05.2027, сверить цитаты; robots.txt Supercell/PandaScore не закрыли нас.
7. Ahrefs (после 9-го числа, считать единицы заранее — TRAPS): обновить ключи по трём сайтам, сверить title с интентом.
8. Сервер: `du -sh /opt/web/*-feeds`, `docker images | grep -feeds`, соседние сайты не тронуты; Caddy-блоки трёх доменов на месте.
9. Обновить `HANDOFF.md` и этот календарь (новые даты), commit.

## Как это устроено (для агента)
- Сроки — **одно место: `tools/lib/copyage.mjs`** (`docMaxAge`): копия владельца (`copiedBy: "owner"`, `pendingOwnerCopy`, хост из
  `AI_BLOCKED_HOSTS`, `refresh: "manual"`) — `OWNER_COPY_MAX_AGE` = 180 дней в любом наборе; скачанная нашими программами — `maxAgeDays`
  своего JSON: реестры, провинции, пакет помощи — 100; операторы — 180; правила лотерей jdd — 183 (`online.json` — 100). Обзоры —
  `REVIEW_MAX_AGE` = `OWNER_COPY_MAX_AGE` (подпись на странице обзора); pingalto — 180; правила игр jdd — 183. Это правило используют
  verify-sources/-rg/-operators/-reviews, гейт `fresh` (selftest проверяет 180-й и 181-й день копии владельца), ленты `listas`, `plazos`
  (casaslegales) и `fuentes` (jdd; `copyage.mjs` синхронизируется на сервер jdd), тексты casaslegales (`{{max_age}}`, `{{owner_max_age}}`,
  `{{next_check}}` = первый срок любой копии) и таблица источников jdd.
- Гейты сборки сверяют сроки по датам **в репозитории**; сервер обновляет свои копии сам, в репозиторий их переносит `pull --write`.
- `feeds-server.sh <сайт> sync` отправляет только закоммиченное (`git archive HEAD`).
