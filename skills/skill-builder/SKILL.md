---
name: skill-builder
description: "스킬 생성, skill creation, 에이전트 스킬, skill builder, 스킬 최적화, TDD 테스트, 합리화 방지. TDD 기반 스킬 생성 + OpenClaw 스킬 저장소 관리. MCP 통합, 한국 현지화."
metadata: { "openclaw": { "emoji": "🛠️", "version": "1.0.0" } }
user-invocable: true
---

# Skill Builder (OpenClaw Edition)

**Architecture:** Progressive Disclosure | **Methodology:** TDD-First + Evaluation-First
**Token Limit:** <5,000 (한국어 400줄) | **Standard:** OpenClaw Skill Spec

## 실행 흐름

```
요청 수신 → 소크라틱 인터뷰 → 옵션 제시 → TDD RED → 설계 → 빌드 → TDD GREEN → 검증 → REFACTOR → skill-save
```

## 스킬 저장소

**저장소 경로:** 프로젝트 `skills/` 디렉토리 + ClawHub 연동

### 명령어

| 트리거          | 동작                                 |
| --------------- | ------------------------------------ |
| "스킬 목록"     | `skills/` 내 스킬 카테고리별 표시    |
| "[스킬명] 로드" | SKILL.md 읽어서 세션에 적용          |
| "릴리즈"        | version 필드 업데이트 + ClawHub 배포 |
| (생성 완료 시)  | `skills/[name]/SKILL.md`에 자동 저장 |

### 저장소 구조

```
skills/
└── [skill-name]/
    ├── SKILL.md          # 메인 스킬 문서
    └── references/       # 참조 자료 (L3 로딩)
```

## Step 0: TDD for Skills

**철칙: "실패하는 테스트 없이 스킬 작성 금지"**

### RED Phase (스킬 작성 전)

1. 압박 시나리오 3개+ 생성
2. 스킬 없이 서브에이전트 실행 (vitest 기반)
3. 실패 행동 + 합리화 표현 그대로 기록

### GREEN Phase (스킬 적용)

1. 관찰된 실패만 해결하는 최소 스킬 작성
2. 동일 시나리오 + 스킬로 재실행
3. 에이전트 준수 확인

### REFACTOR Phase (허점 봉쇄)

1. 새로운 합리화 발견 시 명시적 차단 추가
2. 합리화 표 업데이트
3. bulletproof까지 반복

> vitest 기반 테스트: `pnpm test` 으로 스킬 동작 검증

## Step 1: 소크라틱 인터뷰

**트리거:** 막연한 요청, 문제 중심 요청, 질문형 요청

```
Q1. "지금은 이걸 어떻게 하고 있어요?"        → 현재 상태
Q2. "가장 짜증나는 부분이 뭐예요?"           → 문제점
Q3. "완벽히 작동하면 어떤 상태?"              → 이상 상태
Q4. "이런 경우는? 저런 경우는?"              → 엣지케이스
Q5. "정리하면 이건데, 맞아요?"               → 확인
```

**스킵 조건:** 구체적 스펙 제공, 레퍼런스 있음, "바로 만들어"

## Step 2: 옵션 메뉴

```
스킬 분석 완료

필수 선택
├─ 유형: (1)문서 (2)데이터 (3)API (4)자동화 (5)코드 (6)커뮤니케이션
└─ 자유도: 높음/중간/낮음 (규율 스킬은 낮음 필수)

권장 옵션 (자동 감지)
├─ [A] {감지된 옵션}
└─ [B] {감지된 옵션}

고급 옵션
├─ [T] TDD 서브에이전트 테스트 (규율 스킬 필수)
├─ [X] 멀티모델 게이팅
├─ [Y] 한국 현지화
└─ [Z] 압박 테스팅
```

## 핵심 원칙

### 1. CSO (Claude Search Optimization) - 스킬 트리거 최적화

description은 증상(symptoms) 기반으로 작성:

```yaml
# BAD
description: "PDF 파일 처리"

# GOOD
description: "PDF 텍스트 추출, 양식 채우기. 'PDF 안 열려요', '텍스트 복사 안 됨' 시 사용"
```

OpenClaw의 스킬 매칭은 description 기반이므로, 사용자가 실제로 말할 증상/키워드를 포함해야 한다.

### 2. 합리화 방지 (Rationalization Prevention)

모든 규율 스킬에 필수 포함:

```markdown
## 합리화 표

| 변명                              | 현실          |
| --------------------------------- | ------------- |
| "[에이전트가 사용한 정확한 표현]" | [왜 잘못인지] |

## Red Flags - 즉시 중단

- [위반 징후]
  > Red Flag 발생 시: 작업 폐기, 처음부터
```

### 3. Progressive Disclosure (토큰 관리)

| Level           | 시점      | 예산   | 콘텐츠            |
| --------------- | --------- | ------ | ----------------- |
| L1 Metadata     | 항상      | ~100   | name, description |
| L2 Instructions | 트리거 시 | <5k    | SKILL.md 본문     |
| L3 Resources    | 필요 시   | 무제한 | references/       |

한국어: 400줄 이하, 출력 토큰 35% 버퍼 확보

### 4. MCP 통합

외부 서비스 연동 시:
| 조건 | 권장 |
|------|------|
| 로컬/IDE | stdio |
| 클라우드 SaaS | Streamable HTTP |

한국 서비스 (Naver Works, KakaoWork, JANDI, Dooray!) → 커스텀 래퍼 필요 여부 확인

MCP 브릿지(`src/agents/skills/mcp-bridge.ts`)로 MCP 서버 도구를 SKILL.md로 자동 변환 가능.

### 5. Multi-Model Validation

```
Haiku  → 기본 동작 확인
Sonnet → 중간 복잡도
Opus   → 엣지케이스 + 합리화 저항
```

3개 모델 모두 통과해야 배포 허용.

## 토큰 관리

| 범위        | 상태                     |
| ----------- | ------------------------ |
| 0-3,000     | OK                       |
| 3,001-4,000 | 분할 고려 (한국어 300줄) |
| 4,001-5,000 | WARNING (한국어 400줄)   |
| 5,001+      | BLOCKED                  |

## 버전 관리

OpenClaw의 스킬 메타데이터에 version 필드 사용:

```yaml
metadata: { "openclaw": { "version": "1.0.0" } }
```

## Production Checklist

**Core:**

- [ ] description에 증상 기반 트리거 (max 1024자)
- [ ] SKILL.md < 400줄 (한국어)
- [ ] 스텁 코드 없음

**TDD (규율 스킬 필수):**

- [ ] RED: 압박 시나리오 3개+ 실패 관찰
- [ ] GREEN: 스킬 적용 후 준수 확인
- [ ] REFACTOR: 합리화 표 + Red Flags 완성

**Validation:**

- [ ] 멀티모델 검증 통과 (Haiku/Sonnet/Opus)
- [ ] 압박 테스팅 통과

**Version:**

- [ ] metadata version 업데이트
- [ ] skills/ 디렉토리에 저장 완료

## References

- `references/tdd_for_skills.md` - TDD 방법론
- `references/cso_guide.md` - CSO 가이드
- `references/socratic_interview.md` - 소크라틱 인터뷰
- `references/mcp_integration.md` - MCP 통합
- `references/pressure_testing.md` - 합리화 방지 테스팅
