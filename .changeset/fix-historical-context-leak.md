---
type: patch
slug: fix-historical-context-leak
author: unknown
date: 2026-02-09 17:41
affected:
  - src/agents/compaction.ts
  - src/agents/pi-embedded-utils.test.ts
  - src/agents/pi-embedded-utils.ts
  - src/agents/workspace.ts
---

에이전트 간 Historical Context 유출 방지 — stripHistoricalContext 추가 + stripDowngradedToolCallText 리팩터링 + pruneHistoryForContextShare droppedByRole/droppedImportantMessages 확장
