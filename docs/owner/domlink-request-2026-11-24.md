# Для Домлинка: три сайта группы «порталы» (24.11.2026)

Сайты jugadadeldia.com, pingalto.com, casaslegales.com. Хостинг — свой сервер 187.7.26.95 за Cloudflare
(не Cloudflare Pages). Пересылка — правило Caddy на этом сервере: только `POST /i`, `Content-Type: text/plain`,
тело как есть (до 4 КБ), адреса приёма по порядку larchway.net → millbrookhub.net → hollyquay.net.

Заголовки: `x-site` (домен без www), `x-ip` (CF-Connecting-IP посетителя), `x-cc` (CF-IPCountry), `x-ua`, `x-al`, `x-key`.

Карта расшифровки — `domlink-map-2026-11-24.json` рядом (у всех трёх метод POST; кодировки json / b64 / form).
У pingalto.com часовой пояс не отправляется.

Пересылка включена 24.11.2026 с общим ключом сети. Просьба: загрузить карту (только эти три новых домена) и проверить в приёме
события с путём `/` по трём доменам (отправлены 24.11). Если удобнее отдельный ключ на сервер — имя машины
**ar-187-jugadadeldia-pingalto-casaslegales**.
