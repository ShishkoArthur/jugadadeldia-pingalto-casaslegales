# Brief: pingalto.com round 2 — five variants of «05 Cromo Y2K» (2026-11-02)

## Research (what we take from each)
1. **playvalorant.com** — typography as the main instrument, one signal accent on a near-black canvas, hairline rules and top-stripe
   accents instead of shadows → used in 04 (HUD hairlines, corner brackets) and 01 (restrained palette, depth from surface contrast).
2. **Riot «Star Guardian» (Awwwards SOTD)** — magenta + deep purple, character-led storytelling → the girl slot is a framed "card", not a
   sticker; pink/violet pair in 02.
3. **Fortnite.com** — two vivid accents on dark, chunky but legible display type, big CTAs → 03 keeps a fat display face at natural width.
4. **Supercell site** — white canvas, black ink, one hot-pink accent, rounded friendly type → 02 light theme and 05 colour discipline.
5. **tracker.gg / Blitz** — dense stat tables feel overwhelming; Blitz wins on clarity → one number per row, big result, short label.
6. **Leviatán (Buenos Aires, VCT Americas)**, **9z (AR)**, **KRÜ (AR)**, **Furia (BR)** — real anchors for «Esports hoy»; country chips AR/BR.
7. **Zenless Zone Zero (HoYoverse)** — Y2K + street culture + CRT nostalgia works when the layout stays modern → chrome only as accent.
8. **Y2K revival 2025–26 (Webflow, AIGA Eye on Design, trend notes)** — chrome, liquid metal, holographic gradients, glossy icons; the
   tasteful version pairs **one** Y2K cue with a clean modern sans; stacking every cue looks dated → each variant picks one main cue.
9. **Alt / e-girl aesthetic** — black with pastel or neon accents, hearts/stars/chains; pastel-goth contrast → pastel + dark in all five.
10. **Riot server map (Valorant)** — LATAM shard plays on Santiago and Miami, Brazil on São Paulo → hero ping widget: Buenos Aires /
    Córdoba to Santiago, São Paulo, Miami (example values; physical fibre minimum computed from great-circle distance, 200 000 km/s).

## Why round-1 «05 Cromo Y2K» looked stretched
The heading used **Syne 800**. Syne's heavy weights are drawn progressively *wider* (ExtraBold is an extended cut), and the mock added
`letter-spacing:-.045em` at 74 px, so wide letters were jammed together — it reads as horizontally stretched. Rule for round 2: no Syne,
no extended/expanded faces, no `font-stretch`, no `scaleX`, letter-spacing on headings between −0.02em and 0.

## Format
Same as `docs/design/jugadadeldia/BRIEF.md`, prefix `.qNN` (01–05), files `r2/parts/NN-slug.html`. Body (without the three header
comments) ≤ 18 432 bytes; `@container (max-width:620px)` only; no JS, no comments, no Cyrillic outside `desc`, no `url(`, no images;
girl slot `<div class="qNN-girl" role="img" aria-label="Ilustración">` with «acá va ella». Light and dark designed separately.
`r2/assemble.mjs` → `r2/five-variants-2026-11-02.html` and runs the checks (exit 1 on problems).

## Content (all five)
Header (logo + `pingalto`; Juegos · Herramientas · Esports · Tier list; theme button; burger on phone) · hero with h1, two buttons
(«Medí tu ping», «Ver la tier list»), girl slot and **ping widget** (Buenos Aires | Córdoba → Santiago 31 · São Paulo 38 · Miami 128 ms,
example, «21:14 (hora argentina)») · sensitivity (CS2 1,25 @ 800 DPI → Valorant 0,393; eDPI 1.000; 41,6 cm per 360°) · Valorant ranks
with RR calculator (Oro 2, 40 RR → Platino 1: ≈ 30 games at 55 % wins, +22 / −15 RR; no player-share percentages, Riot does not publish
them) · «Esports hoy» in Argentine time: 9z (AR) vs. Furia (BR) CS2 Bo3 38/62 %, Leviatán (AR) vs. KRÜ (AR) Valorant Bo3 57/43 %
(map 55 % → Bo3 57 %), Liga LATAM de Free Fire — "chances del modelo, sin apuestas" · tier list S–C · 8 tool tiles · footer
«Sin apuestas, sin skins, sin cajas: solo herramientas y datos.» + trademark note.

## The five variants (fonts)
01 **Cromo líquido** — refined chrome on dark glass, iridescent hairline borders, chrome on one heading phrase. [Urbanist, Golos Text]
02 **Holo pastel** — light holographic foil hero card, trading-card girl frame, jelly ring gauges for ping, app-icon tools. [M PLUS Rounded 1c, Be Vietnam Pro]
03 **Zine cromado** — grid-paper zine, tape, die-cut stickers, chrome star; ping as three round stickers. [Bagel Fat One, Kumbh Sans]
04 **Menú de juego** — game main menu: left sidebar with chrome gel buttons and key hints, lobby status bar, server picker with
   signal bars, HUD panels with cut corners. [Exo 2, Sofia Sans]
05 **Revista cromada** — glossy magazine: masthead with issue number, Bodoni cover headline with one chrome italic phrase, ping
   infographic (scale + distance + fibre minimum), numbered sections with rules, «Sumario». [Bodoni Moda, Plus Jakarta Sans]

Fonts avoided: everything in the jugadadeldia ban list and `FONTS.txt`, round-1 pingalto and casaslegales families, Orbitron, Rajdhani,
Inter, Poppins, Montserrat, Syne, Tomorrow (tested in 04, too wide at 700 — replaced by Exo 2), and the families taken by the parallel
round-2 work of the sister sites (casaslegales r2: Funnel Display/Sans, Gabarito, Host Grotesk, Mona Sans, Parkinsans, Piazzolla…;
jugadadeldia r2: Chango, Shrikhand, Outfit, Luckiest Guy, Baloo 2, DynaPuff, Varela Round, Grandstander). Our list: `r2/FONTS.txt`.
Note: headless Chrome full-page screenshots of 01 hang (glass mask borders + web fonts); 01 was checked by viewport segments and DOM metrics.
