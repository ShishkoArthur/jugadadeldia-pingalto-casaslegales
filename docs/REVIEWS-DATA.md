# Review data for casaslegales (collected 2026-11-04)

Owner 04.11: casaslegales becomes a review site («ссылки ставим, казино делаем, впн поставил»). This file is the map of the raw data.

- **Where:** `data/sources/reviews/<brand>.json` (one per brand) + `data/sources/reviews/<brand>/_docs/<slug>.txt` (page text excerpts).
  Screenshots: `data/shots/<brand>/review-2026-11-04-<view>.png` (git-ignored, listed in the brand JSON with sha256; views: home, sportsbook,
  match-markets, casino, payments, rg).
- **How collected:** the owner's Chrome with a VPN exit in Buenos Aires, public pages only — no login, registration, deposit, cashier, chat
  or forms; cookie banners rejected where a reject button exists. Age-confirmation gates may be clicked (owner 04.11). Bot checks / captchas
  are not passed: such pages are recorded as `bot-check` and skipped. Nothing about bonuses or promo codes is collected; screenshots avoid promo banners
  (scrolled or cropped, see `note`).
- **Brand JSON:** `hosts[]`, `status{host: {status, note}}` (open | geo-block | bot-check | age-gate | down), `docs{slug: {url, file, sha256}}`,
  `facts[]` = `{field, value, host, url, date, quote, doc}` — `quote` is verbatim from the saved doc (whitespace-normalised; the recorder refuses
  a quote it cannot find); `quote: null` = a negative finding ("not found on page X"), described in the doc. `shots[]` = `{view, file, url, sha256, note}`.
- **Page text:** rendered visible text (shadow DOM included) of the lines around what is quoted; `[...]` marks skipped parts, `[...]` in square
  brackets at the top describes how the excerpt was taken. Not the full page.
- **Fields:** `sportsbook.sports` (count+names), `.live`, `.streaming`, `.marketsOneMatch` (one Liga Profesional match, counting method in value),
  `.odds1x2` (raw decimal 1X2 for up to 5 Liga Profesional matches + capture time; margin is computed later, not here) · `casino.exists`, `.live`,
  `.providers`, `.categories`, `.rtpPublished` · `app.mentioned`, `.ios`, `.android` (store URLs as linked by the operator) ·
  `payments.depositMethods`, `.withdrawalMethods`, `.minDeposit`, `.maxDeposit`, `.minWithdrawal`, `.maxWithdrawal`, `.withdrawalTimes`, `.currency` ·
  `account.age`, `.kyc`, `.provinceRestriction` · `support.channels`, `.hours`, `.email` · `rg.limits`, `.sessionLimit`, `.pauseSelfExclusion`,
  `.provincialProgramme` · `licence.footer` (operator, CUIT, regulator, act number, date). The same field may appear from several docs/hosts.
- **Odds times:** the browser runs in UTC, so displayed kick-off times are UTC unless noted. The same five matches are used across operators where
  listed: Aldosivi–River Plate, Gimnasia La Plata–Belgrano, Barracas Central–Racing Club, Independiente–Deportivo Riestra, San Lorenzo–Platense.

## Progress (count of distinct quoted fields per group)

| brand | facts | sportsbook | casino | app | payments | account | support | rg | licence | shots | hosts: status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| betsson | 44 | 5 | 4 | 3 | 8 | 3 | 3 | 4 | 1 | 6 | pba.betsson.bet.ar: open; ofertas.pba.betsson.bet.ar: bot-check; www.betsson.bet.ar: open; caba.betsson.bet.ar: open; cba.betsson.bet.ar: open |
| betano | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| bet365 | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| bplay | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| betwarrior | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| codere | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| sportsbet | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| jugadon | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| playcet | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| casino-ba-online | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| stake | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| super7 | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| casinoclub | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| betfun | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| playuzu | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| macgroup | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| playbet | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| arbet | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| mitesoro | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| easybet | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| laneuquina | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| casinomagic | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| maverick | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| aladdin | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| larionegrina | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| casinosdelrio | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
| citycenteronline | — | · | · | · | · | · | · | · | · | 0 | not visited yet |
