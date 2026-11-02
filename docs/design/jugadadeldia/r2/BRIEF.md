# Brief r2: five game-like variants of «02 Bolillero» for jugadadeldia.com (2026-11-02)

## Research (short, 10 lookups, 02.11)
- **The real quiniela draw uses five drums**: four bolilleros with ten balls 0–9 (millar, centena, decena, unidad) build each
  4-digit number, and a fifth drum with balls 1–20 gives its position on the extract (Lotería de la Ciudad / de la Provincia;
  explained in cronista.com draw pages). Five draws a day: La Previa 10:30, Primera 12:00, Matutina 14:30, Vespertina 17:30,
  Nocturna 21:00. So «4·7·2·1» honestly = one ball from each of four drums — variants 01 and 04 show this literally.
- **Quini 6**: mechanical drum, notaries present, Wed and Sun 21:15 from Lotería de Santa Fe, broadcast on regional TV and
  YouTube; four extractions (Tradicional, La Segunda, Revancha, Siempre Sale). Telekino: 15 of 25 balls, Sundays on TV.
- **Home bolillero**: small chrome or wooden cage with a side crank, balls leave one by one through a bottom opening
  (family bingo/lotería sets sold in AR) — the crank is the friendliest cartoon cue.
- **Argentine play culture to borrow (generic, no brands)**: bolitas / «ojo de gato» glass marbles, juego del sapo, truco
  scored with fósforos or porotos, Estanciero-style board (1937, provinces as squares), papel glasé school crafts, kiosco
  «colores brillantes, caos de formas» and candy jars.
- **Casual-game UI**: thick outlines, chunky rounded type, gentle curves, buttons with a beveled «lip» that presses down,
  bouncy (not blocky) feedback. **Neubrutalism / sticker**: thick black borders, hard offset shadows with zero blur, cut-out
  sticker shapes. Both kept honest: no money, no confetti of bills, no jackpot hype.

## The five variants (prefix `.kNN`, files `parts/NN-slug.html`)
01 **Tinta** — flat cartoon with thick ink outlines and hard shadows, crank drum with 0–9 balls, comic-panel cards, sticker tiles. [Luckiest Guy, Baloo 2]
02 **Golosinas** — kiosco candy: glossy jelly balls, jelly buttons with a lip, sprinkles, extract in two candy tubes. [DynaPuff, Varela Round]
03 **Paño y fichas** — board game on felt: path of numbered squares with a token, property-style tool cards, truco with matchsticks. [Chango, Bricolage Grotesque, Spline Sans Mono]
04 **Estudio de TV** — retro Saturday game-show set: sunburst, marquee bulbs, the real five drums (millar, centena, decena, unidad, ubicación 1–20), flip board. [Shrikhand, Outfit]
05 **Recortable** — papel glasé cut-out / pop-up toy: layered paper, dashed cut lines, brad fastener, lined and squared notebook paper, tag-shaped tools. [Grandstander, Mulish]

## Format and rules
Same as `../BRIEF.md` (fragment header, tokens light/dark, container queries only, no JS, no comments, no Cyrillic except `desc`,
same content blocks and numbers) with these changes: prefix `.kNN`, size ≤ 18 KB, playful fonts allowed but not the ban list,
not `../FONTS.txt` sister lists, not Syne/Lexend; tiny CSS animation only inside `@media (prefers-reduced-motion:no-preference)`.
Assembler: `assemble.mjs` → `five-variants-2026-11-02.html`.
