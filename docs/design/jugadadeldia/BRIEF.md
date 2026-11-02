# Brief: 10 home-page mockups for jugadadeldia.com (2026-11-02)

jugadadeldia.com = quiniela by province, lotteries (Quini 6, Loto Plus, Brinco, Telekino, Tómbola), truco and Argentine table
games (generala, chinchón, burako, escoba). Spanish of Argentina with "vos". **No monetization, no operators, no betting links.**
The owner (Russian speaker) picks one concept on his phone.

Each concept = one fragment `docs/design/jugadadeldia/parts/NN-slug.html` (NN = 01..10). `assemble.mjs` (same folder) puts all
ten into `ten-designs-2026-11-02.html` with per-concept toggles: light/dark and desktop (1120 px, scaled to fit on a phone) /
phone (390 px).

## Network footprint — the main risk
The owner runs other sites; this one must not look related to them.
- **gambeteo.com** (chosen look «Bondi porteño»: bus route plates, LED destination board, ticket stubs, yellow/red/blue line
  stripes; its other nine concepts: chalk tactics board, night stadium LED, potrero/kraft/stickers, 70s kiosk magazine with
  halftone, F1 timing tower, **fileteado porteño**, turf race programme, tin scoreboard, sticker album). Do not reuse any of
  these worlds, motifs or their fonts.
- **RinkMath** (ice-white/blue, red rink lines, condensed sporty caps).
- Also distinct from the two sister sites in this repo (pingalto = esports, casaslegales = bookmaker reviews): they will avoid
  the fonts listed in `FONTS.txt`.

## Fragment format (exactly this)
```
<!-- name: <concept name in Spanish> -->
<!-- desc: <1–2 sentences in RUSSIAN for the owner: idea, palette, mood, how light and dark differ> -->
<!-- fonts: <Google Fonts css2 family params, e.g. family=Literata:wght@400;700&family=Sometype+Mono:wght@500> -->
<style>
.jNN{ --bg:..; --fg:..; ... }                 light tokens
.jNN[data-mode="dark"]{ --bg:..; ... }        dark tokens (same names)
...
@container (max-width: 620px){ ... }          phone layout: ONLY container queries, never @media width
</style>
<div class="jNN mock" data-mode="light"> ...markup... </div>
```
- Every selector starts with `.jNN` (or `.jNN-something`). Nothing global: no `:root`, `body`, `html`, `*` alone, `@font-face`,
  `@import`, no styling of `.mock`. **No comments inside `<style>` or markup** (the three header comments are stripped by the
  assembler; nothing else may remain). No Cyrillic anywhere except the `desc` comment.
- The wrapper `.frame` has `container-type:inline-size`; desktop width = 1120 px, phone = 390 px. Must look complete and
  polished at both: no horizontal overflow at 390 px (long words wrap, tables fit — use `minmax(0,1fr)`, `min-width:0`,
  `overflow-wrap:anywhere` where needed), table text ≥ 13 px on phone, tap targets ≥ 40 px, compact header ≤ 64 px on phone.
- All colours from tokens; both themes designed with care (not a naive inversion). The mock sets its own `background` and `color`.
- No JavaScript. No external images, no data-URI bitmaps. Graphics: inline SVG (short paths) or CSS only. No emoji.
- No `position:fixed`; no `overflow:hidden` on large containers (use `overflow:clip` if needed).
- Fonts: max 2–3 Google families per concept, only the weights you use, always a real fallback stack, `font-variant-numeric:
  tabular-nums` for number columns. **Banned** (sister/other sites): IBM Plex Sans (and Plex family), Saira Condensed, Doto,
  Courier Prime, Archivo Narrow, Sora, Anton, Source Serif 4, Graduate, Barlow, Barlow Condensed, Geist, Geist Mono, Overpass,
  Overpass Mono, Kalam, Nunito Sans, Bungee, Chivo, Red Hat Mono, Inter, Space Grotesk, Roboto, Open Sans, Poppins, Montserrat —
  and every family gambeteo used: Cabin Sketch, Gochi Hand, Unbounded, Hanken Grotesk, DotGothic16, Permanent Marker, Work Sans,
  Archivo, Newsreader, Titillium Web, JetBrains Mono, Fraunces, Alegreya Sans, Zilla Slab, Libre Franklin, Allerta Stencil,
  Lilita One, Figtree. Each concept below has its assigned families — use those.
- Avoid the generic "AI look": cream + serif + terracotta, black + single acid green, purple-blue gradient hero, everything
  centered, the same rounded card + shadow everywhere, emoji markers. Each concept needs a distinctive LAYOUT, not a recolour:
  its own header, hero composition, card shapes, table treatment, footer.
- Size: fragment ≤ 14 KB (14 336 bytes). Keep CSS terse.
- Copy in es-AR with "vos" (mirá, calculá, controlá, anotá). Numbers in es-AR format: thousands with dot ("$ 7.000",
  "9.366.819"), decimal comma, time "21:14 (hora argentina)". Never promise winnings.
- Accessibility: visible `:focus-visible` on links/buttons, text contrast ≥ 4.5:1 in both themes, one `h1`, sensible `h2`s,
  tab rows as links/buttons with `aria-current` / `aria-pressed` on the active one.

## Content (same for all ten; reorder and choose emphasis to fit the concept)
1. **Header**: a small logo mark drawn in SVG/CSS on theme (e.g. a lottery ball with a number, or card + die) + wordmark
   `jugadadeldia`; nav: Quiniela · Quini 6 · Loterías · Truco · Juegos; a theme icon-button (sun/moon SVG); on phone the nav is
   replaced by a burger icon-button (icon only, no menu).
2. **Hero**: headline, e.g. «La quiniela de hoy, clara y sin humo» or «Tu jugada, con la cuenta hecha»; subtitle exactly:
   «Extractos oficiales de cada provincia, cuánto paga cada apuesta y las chances reales. Y para la sobremesa: anotador de truco,
   generala y más.»; buttons «Ver la quiniela de hoy» (primary) and «¿Cuánto paga?».
   **Character slot**: `<div class="jNN-girl" role="img" aria-label="Ilustración">` right of the hero on desktop (≈ 260–320 px
   wide, aspect 2:3), smaller / beside text or below on phone. Tasteful placeholder in the concept's style (simple female
   figure silhouette in SVG + tiny caption «acá va ella»). Must look intentional.
3. **Main live card «Quiniela de hoy»**: jurisdiction tabs Nacional (active) · Provincia · Tucumán · Córdoba · Santa Fe; draw
   tabs La Previa · Primera · Matutina · Vespertina · Nocturna (active); a 20-position extract table (1–20, 4-digit numbers),
   clearly labelled «Ejemplo ilustrativo»; «La cabeza: 4721»; «Actualizado 21:14 (hora argentina)».
   Use exactly these numbers (pos: number): 1 4721 · 2 0938 · 3 6154 · 4 2307 · 5 8862 · 6 1495 · 7 7030 · 8 3618 · 9 5276 ·
   10 9143 · 11 0582 · 12 6409 · 13 2851 · 14 7764 · 15 1327 · 16 4990 · 17 8215 · 18 3046 · 19 5573 · 20 9681.
   On phone the table may fold into 2 columns (1–10 | 11–20) — classic extract layout.
4. **Card «¿Cuánto paga?»** — static mini calculator: Apuesta $ 100 · A la cabeza · 2 cifras → big «Cobrás $ 7.000»; below an
   honest line «Chance: 1 en 100 · por cada $ 100 apostados vuelven en promedio $ 70»; mark it «ejemplo».
5. **Card «Quini 6»** — «Controlá tu boleta»: six number-ball inputs (static, e.g. 04 11 17 26 33 45), modality chips
   Tradicional · La Segunda · Revancha · Siempre Sale; «Chance del pozo: 1 en 9.366.819»; button «Controlar».
6. **Card «Anotador de truco»** — two columns Nosotros / Ellos with "palitos" tally (squares of 5: four sides + diagonal),
   split into 15 «malas» / 15 «buenas» with a divider line. Example: Nosotros 17 (three full squares in malas + 2 palitos in
   buenas), Ellos 9 (one square + 4 palitos). Buttons «+1» per side and «Nuevo partido».
7. **Tool grid (6 tiles)**, each with a one-line description and a small drawn icon:
   Quiniela por provincia — «Los extractos de las 24 jurisdicciones» ·
   Cuánto paga la quiniela — «A la cabeza, a los 5, 10, 20 y redoblona» ·
   Controlar Quini 6 — «Las cuatro modalidades, en un toque» ·
   Loto Plus y Brinco — «Pozos, chances y cómo se juega» ·
   Valores del truco — «Qué carta mata a cuál, y las señas» ·
   Generala: probabilidades — «Servida, póker, escalera: la cuenta exacta».
8. **Footer**: «Sin apuestas online, sin operadores: solo datos oficiales y la cuenta.» · links: Quiénes somos · De dónde salen
   los datos · Juego responsable · RG strip «18+ · Si el juego dejó de ser un juego: línea gratuita de tu provincia → Juego
   responsable». No phone numbers.

## The ten worlds (assigned fonts in brackets)
01 **Agencia de barrio** — the window of an official lottery agency: striped awning over a shop sign, a black felt
   letter board with white peg letters (changeable-letter board) listing the day's «cabezas» by draw, receipts taped behind
   glass, opening-hours plate. Green/white official-agency feel; dark = the agency lit at night behind glass.
   [Martian Mono, Schibsted Grotesk]
02 **Bolillero** — the draw drum: hero dominated by an SVG wire drum with numbered balls, balls rolling down a chute into a
   tray that spells the extract; cards are trays/racks of balls; deep green baize + brass + ivory balls with red/blue numbers.
   Dark = studio under a spotlight. [Bricolage Grotesque, Spline Sans Mono]
03 **Extracto oficial** — the printed official draw sheet: pale green security paper with guilloché pattern (CSS), ruled
   boxes, form numbers, a round rubber stamp «Escribanía» and a signature line, perforated tear edge, classic two-column 1–10 /
   11–20 table. Dark = blue-black carbon copy. [Literata, Sometype Mono]
04 **Naipes españoles** — the Spanish deck: each section is a big playing card with corner index and its suit drawn simply in
   SVG: Quiniela = oros (coin), ¿Cuánto paga? = copas (cup), Quini 6 = espadas (sword), Truco = bastos (club). Red and blue card
   frame lines, green baize table; light = card-table linen. No copies of real card art. [Young Serif, Karla]
05 **Club de barrio** — social club wall: two-tone painted wall (dark green dado, pale upper), stencilled club lettering,
   a row of pennants, the truco anotador on a formica table as the hero centrepiece (palitos drawn big, hand-drawn font),
   tool tiles as membership cards (carnet de socio). [Alfa Slab One, Mulish, Nanum Pen Script]
06 **Radio AM** — the evening radio reading of «la cabeza»: walnut/bakelite cabinet header, a horizontal tuning dial with
   AM frequencies and a moving needle as the jurisdiction switcher, preset push-buttons as draw tabs, a green «magic eye»
   indicator, VU-meter bars. No real station names. Dark = dial glowing at night. [Josefin Sans, Share Tech Mono]
07 **Almanaque del almacén** — the free wall calendar from a neighbourhood shop: big picture area on top (the girl slot is the
   calendar picture), a shop-name ribbon, two-colour offset print (red + blue on white), month grid with draw days marked
   (quiniela Mon–Sat, Quini 6 Wed and Sun), tear-off strips for cards, a hanging hole and ring. [Bowlby One, Manrope]
08 **Mapa de jurisdicciones** — atlas: a tile cartogram of Argentina's 24 jurisdictions (square tiles with 3-letter codes,
   arranged roughly in the country's shape, Nacional/CABA highlighted) as the hero and jurisdiction switcher; topographic
   contour lines background; palette pampas sage, sand, deep indigo. [Epilogue, Azeret Mono]
09 **Tablero de datos** — clean modern data dashboard (fintech-like, not generic): left sidebar nav on desktop, KPI tiles,
   a 00–99 frequency sparkline/heat strip with an honest note «cada terminación tiene 1 en 100», dense data grid for the
   extract; slate + teal + amber. Dark = graphite. [Onest, Fragment Mono]
10 **Edición de la tarde** — a popular afternoon tabloid (generic, not a real masthead): screaming red flash bands, all-caps
   heavy headlines, newsprint columns with rules, «ÚLTIMO MOMENTO» strip, the extract as a boxed news item, classified-ads
   style tool tiles. Dark = night edition on charcoal newsprint. [Dela Gothic One, Noticia Text]
