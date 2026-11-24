# Для Домлинка: три сайта группы «порталы» (24.11.2026)

Сайты jugadadeldia.com, pingalto.com, casaslegales.com. Хостинг — свой сервер 187.7.26.95 за Cloudflare
(не Cloudflare Pages). Пересылка — правило Caddy на этом сервере: только `POST /i`, `Content-Type: text/plain`,
тело как есть (до 4 КБ), адреса приёма по порядку larchway.net → millbrookhub.net → hollyquay.net.

Заголовки: `x-site` (домен без www), `x-ip` (CF-Connecting-IP посетителя), `x-cc` (CF-IPCountry), `x-ua`, `x-al`, `x-key`.

Карта расшифровки — `domlink-map-2026-11-24.json` рядом (у всех трёх метод POST; кодировки json / b64 / form).
У pingalto.com часовой пояс не отправляется.

Просьба: выдать ключ на сервер. Имя машины: **ar-187-jugadadeldia-pingalto-casaslegales**.
Пока ключа нет, наши адреса счётчика отвечают 204 и ничего не пересылают — отказов у вас не будет.
