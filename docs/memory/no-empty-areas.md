---
name: no-empty-areas
description: Owner forbids empty areas on pages (a short column next to a tall one on wide screens); check every layout change for them
metadata:
  node_type: memory
  type: feedback
  originSessionId: dce5dc33-4311-4cee-a23a-0131d145b96b
  modified: 2026-11-12T00:03:26.978Z
---

Owner 11.11.2026, on pingalto /fortnite/tracker (form + girl tall on the left, six tiles short on the right): «что за пустота? я же просил пустот не оставлять».

**Why:** he had asked before; he looks at desktop screenshots too, not only the phone, and a big blank column reads as a broken page.

**How to apply:** after any layout change, scan all sitemap pages of the three sites at 1024/1280/1440 in the browser (rows of a grid where one cell's content ends 180+ px above the row bottom, rows with empty columns, uneven column lists). Fix by content placement first (move the girl to the hero, long card full width), then the per-site follow/stack code (pingalto pin(), jugadadeldia stacks(), casaslegales follow()/lanes()). Mind the 160 KB page budget. Related: [[review-proactively]].
