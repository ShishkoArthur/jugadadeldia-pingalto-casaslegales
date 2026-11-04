# Обслуживание раз в полгода — jugadadeldia.com · pingalto.com · casaslegales.com

Владелец хочет вмешиваться **не чаще раза в полгода** (PLAYBOOK §17.2; 04.11: «Работай до конца по всем моментам что не нужно моего
вмешательства»). Здесь — что идёт само, что делает агент и что может сделать только владелец, с датами (состояние на 04.11.2026).
Ленты подробно — `docs/FEEDS.md`; копии владельца — `docs/reference/owner-saves/README.md`; обзоры — `docs/REVIEWS-DATA.md`.

## Календарь

| Дата | Что истекает / происходит | Сайт | Кто | Что сделать |
|---|---|---|---|---|
| каждый месяц | сервер перепроверяет официальные страницы (лента `listas`): 43 копии реестров, провинций и пакета помощи | casaslegales (+ пакет помощи jdd) | **само** | ничего; изменение списка → Telegram |
| **21.01.2027** | Telegram-напоминание (за 21 день до 11.02) — один список: что сохранить и как | casaslegales | бот | — |
| **до 09.02.2027** | пакет помощи (копии 01.11, 100 дн.) — в репозитории; на сервере обновляется сам | jdd, casaslegales | агент | `feeds-server.sh casaslegales pull --write` → `npm test` → commit → `sync` обеих лент → deploy jdd и casaslegales |
| **11.02.2027** | 16 копий владельца (100 дн.): Córdoba, Neuquén, Río Negro, Salta, Santa Fe, Mendoza + их страницы помощи | casaslegales | **владелец** | сохранить из Chrome (таблица ниже) и прислать |
| 11.04.2027 | второе напоминание (за 21 день до 02.05) | casaslegales | бот | — |
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
   Аргентины или с VPN AR). Список и адреса — `docs/reference/owner-saves/README.md` («Что сохранить»), на 04.11 это 16 страниц:
   `cba-juegos-online`, `ar-x-loteria-juego-responsable` (Córdoba); `neu-juego-legal`, `neu-casinos`, `ar-q-ijan-juego-responsable` (Neuquén);
   `rne-inicio`, `rne-rionegrina-online`, `ar-r-loteria-autoexclusion` (Río Negro); `sal-enreja-juego-autorizado`, `ar-a-enreja-jr` (Salta);
   `santa-fe-plataformas`, `santa-fe-inicio`, `santa-fe-juego-responsable`, `santa-fe-juego-compulsivo`, `santa-fe-historia` (Santa Fe);
   `mendoza-plataformas` (Mendoza). Плюс страницы из пункта 2 напоминания («сервер не смог обновить» — обычно гео-блок, например
   `mendoza.gob.ar` отвечает серверу 403). Положить в `docs/reference/owner-saves/<ГГГГ-ММ-ДД>/` или прислать в чат.
2. **Обзоры** (27 марок): Chrome с VPN-выходом в Буэнос-Айресе, только публичные страницы, без входа и депозитов (порядок — `docs/REVIEWS-DATA.md`).
   Агент ведёт сбор через Chrome владельца (как 04.11) — владельцу нужно только включить VPN и Chrome с расширением.
3. **Search Console** — добавить три сайта (обещано «в гск добавлю потом»); раз в полгода посмотреть покрытие и ошибки.
4. **Ключи** — если сервис сменил условия: PandaScore (токен, бесплатный план), Supercell (ключи привязаны к IP 187.7.26.95),
   Telegram-бот @jpc_avisos_bot, Cloudflare (токен должен видеть три зоны), Ahrefs (общий лимит рабочего пространства).

**Предложение владельцу (нужно решение):** копии сайтов, закрытых для ИИ, сейчас живут 100 дней (правило источников PLAYBOOK), поэтому
их приходится сохранять раз в ~3 месяца — чаще, чем раз в полгода. Если разрешить для **списков лицензий** (не для телефонов помощи —
для них PLAYBOOK §1.3 требует ≤ 100 дней) срок 180 дней, то всё, что делает владелец, сойдётся в один визит в полгода. Пока решения нет — 100 дней.

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
- Сроки: реестры, провинции, пакет помощи — 100 дней (`maxAgeDays` в JSON); обзоры — 180 (`REVIEW_MAX_AGE` в `tools/lib/revsources.mjs`,
  подпись на странице обзора); операторы — 180 (`operators.json`); pingalto — 180; правила лотерей и игр jdd — 183.
- Гейты сборки сверяют сроки по датам **в репозитории**; сервер обновляет свои копии сам, в репозиторий их переносит `pull --write`.
- `feeds-server.sh <сайт> sync` отправляет только закоммиченное (`git archive HEAD`).
