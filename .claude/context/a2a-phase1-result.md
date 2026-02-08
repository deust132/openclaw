# A2A Phase 1 결과 기록

**일시**: 2026-02-08
**상태**: completed (잔여 이슈 있음)

---

## 완료 항목

|  #  | 작업                       | 담당 |          결과          |
| :-: | -------------------------- | :--: | :--------------------: |
|  1  | maxConcurrent 2→4          | 하윤 |           OK           |
|  2  | 모든 봇 allowAgents ["*"]  | 하윤 |           OK           |
|  3  | SOUL.md sessions_send 규칙 | 하윤 |    스킵 (이미 존재)    |
|  4  | announce agentId 버그 수정 | 하윤 | OK (B안: agentId 제거) |

## 검증 결과

| 테스트                         |        결과        |
| ------------------------------ | :----------------: |
| pnpm build                     |        PASS        |
| 게이트웨이 5개 봇 시작         |   OK (PID 1289)    |
| 세나 announce → 텔레그램       | OK (send ✓ 1090ms) |
| 유리 announce → 텔레그램       | OK (send ✓ 490ms)  |
| 소율 → 세나/유리 sessions_send |         OK         |
| 세나 토론 내용 텔레그램 표시   |         OK         |

## 잔여 이슈 (Phase 2로)

### 1. 핑퐁 토론 연속성 (Layer 3)

- 유리가 "시작할게요" 메타 응답만 보내고 실제 토론(반박/의견)을 sessions_send로 세나에게 보내지 않음
- 원인: LLM이 "토론 이어가기"를 sessions_send 호출로 변환하지 못함
- 분류: 민서 보고서 Layer 3 (LLM 결정 불안정)
- 해결: SOUL.md 강화 또는 모델 변경 검토

### 2. deliveryContext webchat 고착

- 로그에서 `channel=webchat` 여전히 보임
- announce target은 올바르게 telegram으로 잡힘 (accountId 기반)
- 하지만 근본적으로 deliveryContext가 webchat인 건 불안정 요소
- 해결: sessions-announce-target.ts에서 requesterOrigin 재계산

### 3. 소율 lane wait exceeded

- `lane wait exceeded: waitedMs=51031~53961` 경고 반복
- maxConcurrent 4로 상향했지만 소율 세션 큐잉 발생
- 원인 추적 필요
