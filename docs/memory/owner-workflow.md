---
name: owner-workflow
description: "How the owner of the three Argentine sites wants the work run (Russian answers, max 8 agents, show results in the overview artifact)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 26f1f9cb-0a95-4e0a-abb5-fb4272bbdb0f
  modified: 2026-11-03T15:26:50.105Z
---

Owner writes Russian and wants short Russian answers. Run at most 8 background agents at once (raised 04.11 «можешь работать в 8 потоков»; was 2 on 03.11 (03.11: «Слишком много потоков…
процессор загибается»); tell every agent not to spawn its own agents. Show choices/results on the single overview artifact
https://claude.ai/artifact/GHyiNUXUDLCApby67KxLtS (rebuild `node docs/owner/build-overview.mjs`, republish same path).

**Why:** owner reviews from a phone; 03.11 the CPU choked on 6+ agents, 04.11 he allowed 8.

**How to apply:** queue extra work instead of launching more agents; update the overview and tell the owner when something is ready.
Related: [[girl-scenes-style]].
