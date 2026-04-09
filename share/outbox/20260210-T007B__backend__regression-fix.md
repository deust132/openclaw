# T-007B: Regression Fix

- 커밋: e6c987673
- 상태: 완료

## 수정 내용

| Regression                        | 원인                                    | 수정                                             |
| --------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `[Tool Call: foo (ID: 1)]` 미제거 | regex가 Arguments 블록 필수로 요구      | `.replace(/\[Tool Call:[^\]]*\]\s?/gi, "")` 추가 |
| "Hi there" -> "Hithere"           | `.trim()`이 블록 간 trailing space 제거 | `stripDowngradedToolCallText`에서 `.trim()` 제거 |
| trailing space 3개                | 인라인 regex가 `]` 뒤 space 미소비      | `\s?` 추가로 trailing space 1개 소비             |

## 테스트 결과

```
pi-embedded-utils.test.ts      41/41 PASS
sessions-helpers.test.ts        6/6  PASS
commands-parsing.test.ts        5/5  PASS
Total: 52/52 PASS
```

## Pre-existing (미수정)

- `pi-embedded-helpers.iscompactionfailureerror.test.ts` — main에도 동일, T-007 무관
