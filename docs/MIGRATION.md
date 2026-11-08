# Переезд на новое устройство (05.11.2026)

Всё, что нужно для работы, — в GitHub **кроме** секретов и тяжёлых исходников картинок. Ниже — что где лежит и как поднять проект с нуля.

## 1. Что в GitHub (`git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git`, ветка `main`)
Весь код трёх сайтов, движки, ленты, гейты, данные и источники с копиями документов, планы страниц, решения владельца (`docs/DECISIONS.md`),
ловушки (`docs/TRAPS.md`), состояние (`HANDOFF.md`), обслуживание (`docs/MAINTENANCE.md`), инструкции (`docs/I18N.md`, `docs/FEEDS.md`,
`docs/TELEGRAM-BOT.md`), переписка (`chat.md`), память агента (`docs/memory/`), готовые картинки сайтов (webp в `sites/*/static/`).

## 2. Что НЕ в GitHub — перенести отдельно
| Что | Где сейчас | Как перенести |
|---|---|---|
| `.env` — все ключи API, токены, путь к SSH-ключу сервера | `/home/dev/jugadadeldia-pingalto-casaslegales/.env` | **вручную**, защищённо (флешка/менеджер паролей), `chmod 600`; в чат и в git не класть |
| SSH-ключ GitHub | `~/.ssh/jpc_ed25519` (+ `.pub`) | скопировать в `~/.ssh/`, `chmod 600`; либо создать новый и добавить в GitHub → Settings → Deploy keys (Allow write) |
| SSH-ключ сервера | `~/.ssh/blackjackcab_ed25519` (путь в `.env` `DEPLOY_KEY`) | скопировать в `~/.ssh/`, `chmod 600` (ключ общий с другими проектами владельца) |
| Исходники картинок (девушки, сцены, фоны, скриншоты операторов, вырезки) — ~540 МБ | `data/img-review/`, `data/shots/`, `data/art/` (под `.gitignore`) | **резервная копия на нашем сервере**: `/opt/web/jpc-backup/assets-2026-11-05.tar` (538 МБ, sha256 начинается с `1fbde54ae1cbde52`) — скачать и распаковать в корень проекта (команда ниже). Нужны только для новых сцен/переделки картинок; сайты работают без них |
| Память агента Claude | `~/.claude/projects/-home-dev-jugadadeldia-pingalto-casaslegales/memory/` | копия в `docs/memory/` — положить в такую же папку на новом устройстве (путь зависит от пути проекта) |
| Chrome владельца: расширение Claude + VPN Argentina | браузер владельца | поставить заново на новом устройстве (нужно для сбора данных операторов и гео-закрытых страниц) |

Самый простой путь: **скопировать папку проекта целиком** (`/home/dev/jugadadeldia-pingalto-casaslegales/`, включая скрытые `.env` и `.git`)
и папку `~/.ssh/` — тогда восстанавливать ничего не нужно, кроме `npm install` и памяти агента.

## 3. Поднять с нуля (git clone)
```bash
git clone git@github.com:ShishkoArthur/jugadadeldia-pingalto-casaslegales.git
cd jugadadeldia-pingalto-casaslegales
git config core.sshCommand "ssh -i ~/.ssh/jpc_ed25519 -o IdentitiesOnly=yes"
# положить .env (вручную), chmod 600 .env
npm install          # Node 24 (проверено на v24.21.0)
set -a; . ./.env; set +a
ssh -i "${DEPLOY_KEY/#\~/$HOME}" -o IdentitiesOnly=yes "${DEPLOY_USER:-root}@$DEPLOY_HOST" 'cat /opt/web/jpc-backup/assets-2026-11-05.tar' | tar -xf -   # картинки (по желанию)
npm test             # должно быть 273/273 и все selftest зелёные
```
Если путь проекта другой (не `/home/dev/...`): скопировать `docs/memory/*.md` в `~/.claude/projects/<путь-проекта-через-дефисы>/memory/`.

## 4. Внешние зависимости, которых нет в репозитории
- **Playwright** для браузерных проверок (`tools/qa/*`, скриншоты) берётся из чужого проекта: `/home/dev/manuallysites/casinovictoriaargentina/node_modules/playwright`
  (только чтение). На новом устройстве: `npm i -D playwright && npx playwright install chromium` в этом проекте и поправить путь в `tools/qa/*.cjs`,
  `tools/capture-shots.mjs`, `tools/review-shots.mjs` (поиск: `grep -rn manuallysites tools/`).
- Образцы для чтения (не нужны для работы, только как справка): `/home/dev/gambeteo`, `/home/dev/canadabetting`, `/home/dev/kenomath`.
- Сервер 187.7.26.95 не переезжает: сайты, ленты, прокси Fortnite и резервная копия остаются там; новому устройству нужен только SSH-доступ.

## 5. Проверка после переезда
1. `npm test` — зелёный.
2. `git push` — проходит (ключ GitHub).
3. `bash tools/feeds-server.sh jugadadeldia status` (и `pingalto`, `casaslegales`), `bash tools/fnapi-server.sh status` — health OK (ключ сервера).
4. `node tools/render.mjs casaslegales && node tools/check-dist.mjs casaslegales` — сборка и гейты.
5. Новый чат Claude: «Прочитай HANDOFF.md и продолжай» — дальше всё по репозиторию.

## 6. Переезд выполнен: Windows 11, `C:\dev` (07–08.11.2026)
Владелец перенёс всё со старого сервера: `C:\dev` — бывший `/home/dev`, ключи — `C:\dev\.ssh` (как были), секреты — `C:\dev\.secrets`.
Проект: `C:\dev\jugadadeldia-pingalto-casaslegales`, работа — Git Bash (Claude Code desktop). Сделано и проверено 08.11:
- **SSH:** `git config core.sshCommand "ssh -i C:/dev/.ssh/jpc_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=C:/dev/.ssh/known_hosts"`;
  в `.env` `DEPLOY_KEY=C:/dev/.ssh/blackjackcab_ed25519`. Отпечатки сервера в `~/.ssh/known_hosts` и `C:\dev\.ssh\known_hosts` совпадают.
  `~/.ssh` пользователя не связывать с `C:\dev\.ssh`: там `authorized_keys` старого сервера.
- **git:** `core.fileMode false`, `core.autocrlf false`, в репозитории `.gitattributes` `* -text` (иначе checkout пишет CRLF и ломает
  sha256 сохранённых копий и скрипты для сервера).
- **pdftotext:** в Git for Windows первым в PATH стоит xpdf (`/ucrt64/bin`), он раскладывает текст иначе, цитаты из PDF не находятся.
  Нужен poppler: `winget install oschwartz10612.Poppler` (уже стоит, 25.07) и в `.env`
  `PDFTOTEXT=C:/Users/arthurops/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftotext.exe`.
  Код берёт путь из `engine/pdf.mjs` (по умолчанию `pdftotext`, на сервере и в Linux ничего не меняется). `npm test` вручную — после `set -a; . ./.env; set +a`.
- **rsync** локально не нужен: `feeds-server.sh` и `fnapi-server.sh` шлют `git archive HEAD` через `tar | ssh`, удаление лишнего делает rsync сервера.
- **Playwright** ищется рядом: `../manuallysites/casinovictoriaargentina/node_modules/playwright` (переопределение — `PLAYWRIGHT`, `PLAYWRIGHT_DIR`).
- **Память агента** скопирована в `C:\Users\arthurops\.claude\projects\C--dev-jugadadeldia-pingalto-casaslegales\memory\`.
- **Проверка:** `npm test` 273/273, selftest гейтов трёх сайтов зелёные; сборка всех трёх сайтов здесь совпала с выложенной на сервере
  байт в байт (414 + 298 + 509 файлов). Node здесь v26.13.0 (на сервере в лентах — node24).
