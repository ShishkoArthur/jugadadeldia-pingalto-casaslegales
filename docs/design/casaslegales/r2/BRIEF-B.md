# Brief B: casaslegales round 2, concepts 04–06 (2026-11-02)

Direction: **editorial and investigative**: consumer-watchdog journalism and data journalism. The page reads like a published
investigation that comes with its evidence, not like a form, a ledger or an official document. Concepts 01–03 (BRIEF-A) are
product/tool-first. Round 1 (`../parts/`) was rejected as bureaucratic and beige, so here there is no paper texture, no stamps,
no folios and no warm cream.

## Research findings (13 lookups, 02/11/2026)
1. Chequeado (Argentina) gives every piece one short uppercase verdict word (Verdadero, Engañoso, Falso, Insostenible...) above
   the headline: the verdict comes first and the argument after it. Argentines already read that pattern, so we borrow the idea
   of one big word per answer (SÍ / NO / ¿?) but not their label set, colours or brand.
2. Chequeado's method keeps a separate state for "cannot be verified" (Inchequeable / Insostenible). We need the same
   three-way honesty: «figura», «no figura» (which does not mean "ilegal") and «solo prensa, a confirmar».
3. Which? (Best Buy / Don't Buy), Stiftung Warentest (test-Urteil with a grade and the test date) and Consumer Reports all
   rely on a few named verdict labels plus the date of the test. Nobody uses stars. Trust comes from label + date + method.
4. Consumer Reports' Pentagram redesign moved from red/black Harvey balls to a green→red scale because people read it at a
   glance. A traffic-light code is fine if every colour also carries a word or shape (not colour only).
5. ProPublica lets the primary documents speak: the reader sees the document itself, annotated. Forensic Architecture builds
   whole sites around annotated evidence. For us the evidence is **our own screenshot**, with numbered marks on the domain, the
   licence line, 18+ and the RG link.
6. The Markup's "Show your work": publish the method and the data next to the story. That fits «Metodología» and
   «Registro de fuentes» in the footer, and a source and date on every cell.
7. The Pudding: visual essays with fewer words, big custom charts and the chart as the headline. Bloomberg graphics put
   display numbers and charts "free of the grid" for energy, and treat data as the brand.
8. Rest of World: one loud signature colour, three typefaces with distinct jobs (headline / reading / mono data), and an
   explicit WCAG AA rule for every colour pair. We copy the discipline, not the cobalt.
9. La Nación Data (Argentina) shows local data journalism as maps and searchable databases built from public sources. Readers
   here know "datos abiertos" journalism, so a data-essay home will feel local, not imported.
10. Awwwards typography winners in 2025 lean on oversized type and brutalist blocks. The poster register makes the page
    memorable, but it has to stay readable at 390 px. Verdict words shrink, they do not wrap.
11. Risks we avoid: no outlet branding, no fact-checker label names as our scale, no gob.ar celeste, no seals, no dark+gold,
    no stars or CTA tables. Argentine font: Piazzolla is by Huerta Tipográfica (Argentina), a quiet local signature.

## Three directions
- **04 Veredicto**: a consumer-watchdog poster. Huge wide words «SÍ en PBA · NO en Santa Fe · ¿? en Mendoza» on full-bleed
  colour slabs right under the hero; the licence matrix is a wall of SÍ/NO/? slabs on a black band; thick black frames, no
  cards with shadows. Light: pure white, black ink, green/red/amber signal slabs. Dark: near black, the slabs glow and the
  type on them turns dark. Font: Mona Sans (width axis: 125 % for verdicts, 100 % for text).
- **05 Bajo la lupa**: an investigation with evidence. The hero is our screenshot on a black slab with numbered magenta marks
  (domain, licence line, 18+, RG) and a «Lo que miramos» key; the verifier splits the address into labelled parts
  (pba. / ejemplo / .bet.ar); law quotes are document excerpts with a marker underline. Light: cool white, ink, magenta.
  Dark: blue-black light table, marks glow pink. Fonts: Piazzolla (Argentine serif) + Source Code Pro for labels.
- **06 Cifras a la vista**: a data essay. A giant «24» jurisdicciones with a 24-dot strip, a bar chart "how many of the six
  operators are in each province's register" (solid = registro, hatched = solo prensa), a dot matrix, chapters as lilac, lemon
  and ink slabs, stat tiles in the operator card. Light: white, lilac, lemon, indigo ink. Dark: deep indigo, muted slabs, glowing
  accents. Font: Parkinsans.

Bar values in 06 are counted from the example matrix (same data as in every concept): CABA 6, PBA 5, Córdoba 2, Santa Fe 0 + 2 a
confirmar, Mendoza 0 + 4 a confirmar. They are design examples, labelled «Datos de ejemplo».

Fragment rules as BRIEF-A / round 1 (`../BRIEF.md`): prefix `.lNN` / `lNN-`, ≤ 18 KB, container queries only, no JS.
Fonts in `FONTS-B.txt`. Assembler: `assemble.mjs` (owned by agent A).
