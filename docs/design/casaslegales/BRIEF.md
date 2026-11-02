# Brief: 10 home-page mockups for casaslegales.com (2026-11-02)

casaslegales.com = a reference of betting operators licensed in Argentine provinces: licence matrix operator × province,
domain verifier (.bet.ar), operator files with our own screenshots of public pages, regulator quotes with dates, guides,
responsible gambling. Spanish of Argentina with "vos". **No people at all, no monetization, no links to operators, no bonuses.**
The owner (Russian speaker) picks one concept on his phone.

Each concept = one fragment `docs/design/casaslegales/parts/NN-slug.html` (NN = 01..10). `assemble.mjs` (same folder) puts all
ten into `ten-designs-2026-11-02.html` with per-concept toggles: light/dark and desktop (1120 px, scaled to fit on a phone) /
phone (390 px). The assembler also prints warnings for broken fragment rules (size, prefixes, `@media` width, scripts, Cyrillic).

## Network footprint — the main risk
Must not look related to the owner's other sites:
- **jugadadeldia** (sister site, `docs/design/jugadadeldia/`): lottery agency window, draw drum, official draw sheet with
  guilloché and rubber stamp, Spanish deck, social club, AM radio, shop calendar, tile cartogram with contours, data dashboard,
  afternoon tabloid. Do not reuse the tile cartogram, the guilloché security sheet or the tabloid look.
- **pingalto** (sister site, `docs/design/pingalto/`, made in parallel): esports, "alt" zine look (photocopy, cut-out words).
- **gambeteo** (bus-ticket «Bondi», route plates; fonts Bungee, Chivo, Red Hat Mono) and its other nine worlds.
- **RinkMath** (ice white/blue, red rink lines, condensed sporty caps).
- **Casino-affiliate cliché** — banned: dark + gold, star ratings, "BONUS" buttons, top-10 tables with CTA, "mejor casa".
- **Must not impersonate a government or regulator**: no coats of arms, no official seals, no gob.ar styling (celeste/white
  header bar, Encode Sans), no ministry-like names. The site is an independent consumer reference and says so.

## Fragment format (exactly the jugadadeldia format, prefix `.cNN`)
```
<!-- name: <concept name in Spanish> -->
<!-- desc: <1–2 sentences in RUSSIAN for the owner: idea, palette, mood, how light and dark differ> -->
<!-- fonts: <Google Fonts css2 family params> -->
<style>
.cNN{ --bg:..; --fg:..; --mu:..; --ac:..; ... }   light tokens
.cNN[data-mode="dark"]{ ... }                      dark tokens (same names)
@container (max-width: 620px){ ... }               phone layout: ONLY container queries
</style>
<div class="cNN mock" data-mode="light"> ...markup... </div>
```
- Every selector starts with `.cNN`; every class in markup starts with `cNN-` (plus `cNN` and `mock` on the wrapper).
  Nothing global (`:root`, `body`, `html`, `@font-face`, `@import`), no styling of `.mock`.
- No comments inside `<style>` or markup; no Cyrillic except `desc`; no JavaScript; no external images or bitmaps;
  graphics as inline SVG with short paths or CSS; no emoji (✓ / — / ? in the matrix are drawn with CSS).
- Phone 390 px: no horizontal overflow, header ≤ 64 px with a burger icon, tap targets ≥ 40 px, table text ≥ 13 px.
- Tokens: `--bg` page, `--fg` text, `--mu` muted text, `--ac` accent text, optional `--pa` panel; text contrast ≥ 4.5:1 in
  both themes; visible `:focus-visible`. Dark themes are designed, not inverted.
- Fragment ≤ 14 KB (14 336 bytes); 1–2 font families per concept, only used weights, real fallback stacks, tabular numbers.

## Fonts
Banned: everything listed in `docs/design/jugadadeldia/BRIEF.md` (ban list and its ten concepts' families), everything in
`docs/design/pingalto/` fragments (so far Special Elite, Darker Grotesque) and their FONTS.txt, plus Inter, Space Grotesk, Roboto,
Open Sans, Poppins, Montserrat, Encode Sans (gob.ar). Ours are listed in `FONTS.txt`.

## Content (same for all ten; reorder to fit)
1. Header: logo mark (house + check, rubber stamp, index card…; never a shield or coat of arms) + `casaslegales`;
   nav Operadores · Provincias · Licencias · Verificador · Guías; theme icon-button; phone: burger icon.
2. Hero: «¿Es legal donde apostás? Fijate en tu provincia»; subtitle «Qué casas de apuestas tienen licencia en cada provincia,
   con la cita del regulador y la fecha en que lo revisamos. Sin enlaces a operadores, sin bonos.»; static select
   «Elegí tu provincia: Buenos Aires»; buttons «Ver licencias» / «Verificar un sitio». Screenshot slot
   `<figure class="cNN-shot">`: browser frame with address «www.ejemplo.bet.ar», caption «Captura propia de la página pública · 02/11/2026».
3. «Licencias por provincia» matrix: Betano, Betsson, bplay, BetWarrior, bet365, Codere × PBA · CABA · Córdoba · Santa Fe ·
   Mendoza; ✓ / — / ? cells (from the preliminary matrix in `docs/PAGES-CASASLEGALES.md`, shown as example); caption
   «Datos de ejemplo para el diseño · fuente y fecha en cada celda».
4. «Verificador»: input «Pegá la dirección del sitio» → «pba.ejemplo.bet.ar — dominio .bet.ar · licencia en Provincia de
   Buenos Aires (ejemplo)» with a status chip.
5. «Ficha de operador»: «Operador de ejemplo», licence chips, «Revisado: 02/11/2026», RG tools ✓, payment methods,
   minimum age 18, regulator quote block with source and date.
6. «La ley, provincia por provincia»: three quote rows «Cita textual del regulador (ejemplo)» with dates.
7. Guides (6): Cómo saber si un sitio es legal · Qué significa .bet.ar · Autoexclusión por provincia · Medios de pago y
   Mercado Pago · Cuotas y margen: la cuenta · Qué hacer si apostaste en un sitio ilegal.
8. Footer: «Sin enlaces a operadores ni bonos. No es asesoramiento legal: depende de la ley de tu provincia.» · Metodología ·
   Quiénes escriben · Registro de fuentes · Juego responsable · RG strip «18+ · Si el juego dejó de ser un juego: línea
   gratuita de tu provincia → Juego responsable» (no phone numbers).

## The ten worlds [fonts]
01 **Boletín de licencias** — an independent legal-bulletin newspaper: issue line, big masthead, double rules, three columns
   with column rules, halftone screenshot, numbered articles, a «Sumario» with dotted leaders. [Old Standard TT, PT Sans]
02 **Trámite claro** — civic-tech step flow (not gov): numbered steps with a connector line, a search band for the verifier,
   highlighter-yellow marks, teal and ink; panels with thick left borders. [Atkinson Hyperlegible]
03 **Escribanía** — notarial protocol sheet: wide margin with marginal notes and folio numbers, violet rubber-stamp ink,
   «Anexo» screenshot held by a paper clip, signature line. [EB Garamond, Petit Formal Script]
04 **Ensayo comparativo** — consumer-magazine test report: black and safety orange, test numbers, filled/empty test
   squares instead of stars, verdict labels, numbered tiles. [Familjen Grotesk]
05 **Mapa de licencias** — province checker: schematic outline map of Argentina with pins and a callout, app-like side
   panel; ink blue + coral. Night map in dark. [Albert Sans, Reddit Mono]
06 **Libro de registro** — the ledger: spine sidebar with tabs, pale green ruled paper, red double rules, folio numbers,
   «asientos» instead of cards. [Spectral, Anonymous Pro]
07 **Grilla suiza** — Swiss editorial: visible 12-column grid, huge flush-left type, red square mark, big section numerals,
   hairlines only. [Instrument Sans]
08 **Pasaporte** — passport data page and visa stamps: guilloché-free pale page, labelled fields, a machine-readable strip,
   ink stamps in four colours as matrix cells and guide tiles. [B612, B612 Mono]
09 **Fichero** — library card catalogue: steel drawer with province tab dividers, index cards with red header rule and
   blue lines, punched hole, call numbers. [Cutive Mono, Libre Baskerville]
10 **Consola** — terminal verifier: prompts, box-drawn tables, status line; light = green-bar continuous printer paper with
   tractor holes, dark = night terminal (navy, amber, cyan). [Inconsolata]
