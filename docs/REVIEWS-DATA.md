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
| betano | 22 | 4 | 1 | 3 | 5 | 3 | · | 3 | 1 | 5 | www.betano.bet.ar: open; support.betano.bet.ar: open; www.betano.bet.ar/casino/: blank |
| bet365 | 21 | 3 | 3 | · | 5 | · | 2 | 4 | 1 | 3 | www.bet365.bet.ar: partial; help.bet365.bet.ar: open; juegoresponsable.bet365.bet.ar: open; casino.bet365.bet.ar: open |
| bplay | 22 | 4 | 5 | 1 | 2 | 3 | · | 4 | 1 | 3 | pba.bplay.bet.ar: open; deportespba.bplay.bet.ar: open; ayudapba.bplay.bet.ar: partial |
| betwarrior | 20 | 1 | · | 1 | 3 | 3 | 2 | 3 | 2 | 1 | betwarrior.bet.ar: open; apuestas.betwarrior.bet.ar: empty; caba.betwarrior.bet.ar: error; mza.betwarrior.bet.ar: open; betwarriormza.zendesk.com: open |
| codere | 16 | 4 | 1 | 1 | 3 | 2 | 1 | 3 | 1 | 2 | www.codere.bet.ar: open; m.caba.codere.bet.ar: open |
| sportsbet | 17 | 3 | 1 | · | 6 | 2 | 2 | 2 | 1 | 2 | pba.sports.bet.ar: open; sport.sportsbet.bet.ar: open |
| jugadon | 13 | · | 1 | · | 7 | 1 | · | 3 | 1 | 3 | caba.jugadon.bet.ar: open |
| playcet | 10 | · | 1 | · | 4 | 2 | 1 | 1 | 1 | 1 | playcet.bet.ar: open |
| casino-ba-online | 12 | 1 | 1 | 1 | 3 | 2 | 1 | 3 | · | 2 | casinobuenosairesonline.bet.ar: open; caba.casinobuenosairesonline.bet.ar: open; ayuda.casinobuenosairesonline.bet.ar: open |
| stake | 0 | · | · | · | · | · | · | · | · | 0 | pba.stake.bet.ar: bot-check |
| super7 | 6 | 1 | 1 | · | · | · | 1 | 3 | · | 1 | www.super7.com.ar: redirect; caba.super7.bet.ar: open |
| casinoclub | 8 | · | 1 | · | 2 | 3 | 1 | 1 | · | 2 | www.casinoclubonline.bet.ar: open |
| betfun | 6 | · | · | 1 | 1 | 1 | 1 | 1 | 1 | 0 | betfun.bet.ar: open |
| playuzu | 6 | · | 1 | · | 2 | 1 | · | 1 | 1 | 1 | www.playuzu.bet.ar: open |
| macgroup | 4 | · | · | · | 1 | 2 | 1 | · | · | 0 | casinosmacgroup.bet.ar: open |
| playbet | 2 | · | · | · | 1 | · | 1 | · | · | 0 | play.bet.ar: open |
| arbet | 0 | · | · | · | · | · | · | · | · | 0 | arbet.bet.ar: down; www.arbet.bet.ar: down |
| mitesoro | 0 | · | · | · | · | · | · | · | · | 0 | mitesoro.bet.ar: parked |
| easybet | 3 | · | · | · | · | 1 | 1 | · | 1 | 0 | larioja.easybet.bet.ar: open |
| laneuquina | 1 | · | · | · | · | · | · | · | · | 0 | www.laneuquinaonline.bet.ar: open |
| casinomagic | 5 | 1 | · | · | · | 1 | 1 | 1 | 1 | 0 | www.casinomagiconline.bet.ar: open |
| maverick | 5 | · | 1 | · | 2 | 1 | · | · | 1 | 0 | maverickonline.bet.ar: open |
| aladdin | 3 | · | 1 | · | · | 1 | · | · | 1 | 0 | aladdincasino.bet.ar: open |
| larionegrina | 0 | · | · | · | · | · | · | · | · | 0 | larionegrinaonline.bet.ar: partial |
| casinosdelrio | 2 | · | · | · | · | · | 1 | · | · | 0 | casinosdelrio.bet.ar: open |
| citycenteronline | 4 | 1 | · | · | · | 1 | 1 | · | 1 | 0 | www.citycenteronline.bet.ar: open |

## Blockers and odd findings (hosts not plainly open)

- **betsson** `ofertas.pba.betsson.bet.ar` — bot-check: App link (nav 'App' -> bga.onelink.me -> ofertas.pba.betsson.bet.ar/betsson-app) shows 'Max challenge attempts exceeded'; app store availability not verified
- **betano** `www.betano.bet.ar/casino/` — blank: Casino lobby rendered an empty page twice (10 s wait); providers not collected
- **bet365** `www.bet365.bet.ar` — partial: Home opens (cookie 'Solo esenciales' clicked); competition/coupon pages (Liga Profesional, #/AC/...) render an empty content pane — odds and market counts not collected
- **bplay** `ayudapba.bplay.bet.ar` — partial: Help centre home opens; article 'Cómo verificar mi cuenta' returned CloudFront 403; no payments section in the help centre
- **betwarrior** `apuestas.betwarrior.bet.ar` — empty: 'ARMÁ TU JUGADA' coupon builder for agencies (Jujuy/Salta); rendered empty
- **betwarrior** `caba.betwarrior.bet.ar` — error: Redirects to /es-ar/sports/home; after ~20 s shows 'ALGO SALIÓ MAL' (error page) — sportsbook, odds, casino not collected
- **stake** `pba.stake.bet.ar` — bot-check: Cloudflare 'Performing security verification' stayed on 'Verifying...' for 18 s; not passed, site skipped
- **super7** `www.super7.com.ar` — redirect: Redirects to https://caba.super7.bet.ar/aspnet2
- **arbet** `arbet.bet.ar` — down: ERR_TUNNEL_CONNECTION_FAILED through the VPN on 2026-11-04 (site down or not reachable)
- **arbet** `www.arbet.bet.ar` — down: ERR_TUNNEL_CONNECTION_FAILED (second try, www.)
- **mitesoro** `mitesoro.bet.ar` — parked: Domain shows a Wix 'Reconnect Your Domain' page — no casino site served
- **larionegrina** `larionegrinaonline.bet.ar` — partial: Redirects to /plataforma/ (same path pattern as La Neuquina's lottery platform); no text rendered within 8 s

- **Not collected anywhere:** RTP figures (only Betsson checked: none on its rules page), streaming lists, match odds for Sportsbet/Jugadón/Playcet (sportsbooks are cross-origin iframes), casino providers for Betano (lobby blank) and bet365 (not listed).
- **Age gates:** only Playcet showed an age modal (text readable behind it; not clicked). No page was skipped because of an age gate.
- **Odds comparability:** Betsson/Betano/bplay captured with browser time in UTC; Codere shows Argentina time. Same five Liga Profesional matches for Betsson, Betano, bplay, Codere.
