---
type: patch
slug: dns-rebinding-defense
author: unknown
date: 2026-02-09 16:31
affected:
  - src/cli/gateway-cli/run.ts
  - src/commands/doctor-security.ts
  - src/config/types.gateway.ts
  - src/gateway/net.ts
  - src/gateway/origin-check.test.ts
  - src/gateway/origin-check.ts
  - src/gateway/server/ws-connection/message-handler.ts
  - src/macos/gateway-daemon.ts
---

Add DNS rebinding defense via Host header validation and 'all' bind mode
