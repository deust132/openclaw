#!/usr/bin/env bash
# downstream-test.sh — 변경된 파일의 downstream 소비자 테스트를 자동 식별하고 실행
# 사용법: scripts/downstream-test.sh <changed-file> [changed-file2 ...]
#
# 동작:
#   1. 변경 파일의 모듈명 추출 (basename, 확장자 제거)
#   2. 해당 모듈을 import하는 파일 검색 (depth 1)
#   3. depth-1 소비자를 다시 import하는 파일 검색 (depth 2)
#   4. 대응하는 .test.ts 파일 수집 + 실행
#
# 알려진 한계:
#   - grep 기반이므로 dynamic import, re-export 체인(3+ depth)은 미탐지
#   - barrel index (index.ts re-export) 경유 import는 depth-2까지만 커버
#   - 대규모 변경 시 --reporter=verbose 추가 권장

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <changed-file> [changed-file2 ...]"
  echo ""
  echo "Examples:"
  echo "  $0 src/agents/pi-embedded-utils.ts"
  echo "  $0 src/agents/compaction.ts src/agents/workspace.ts"
  exit 1
fi

cd "$PROJECT_ROOT"

declare -A SEEN_TESTS
TEST_FILES=()
ALL_DEPTH1_IMPORTERS=()

# collect_importers <module> — stdout에 importer 목록 출력, 테스트 파일도 수집
collect_importers() {
  local module="$1"
  # Match: from ".../<module>" or from ".../<module>.js" or from ".../<module>.ts"
  grep -rl "from.*['\"].*/${module}\(\.\(js\|ts\)\)\?['\"]" src/ --include='*.ts' 2>/dev/null || true
}

# add_test_for_file <source-file> — 대응 테스트 파일이 있으면 수집
add_test_for_file() {
  local src_file="$1"
  local test_file="${src_file%.ts}.test.ts"
  if [ -f "$test_file" ] && [ -z "${SEEN_TESTS[$test_file]:-}" ]; then
    SEEN_TESTS["$test_file"]=1
    TEST_FILES+=("$test_file")
  fi
}

echo "=== Downstream Test Discovery ==="
echo ""

for changed in "$@"; do
  module=$(basename "$changed" | sed 's/\.[^.]*$//')
  echo "[depth-1] Scanning importers of: $module"

  # 변경 파일 자체의 테스트
  add_test_for_file "$changed"

  # depth-1: 직접 import하는 파일
  importers=$(collect_importers "$module")
  for imp in $importers; do
    [[ "$imp" == *.test.ts ]] && continue
    add_test_for_file "$imp"
    ALL_DEPTH1_IMPORTERS+=("$imp")
  done
done

# depth-2: depth-1 소비자를 import하는 파일
if [ ${#ALL_DEPTH1_IMPORTERS[@]} -gt 0 ]; then
  echo "[depth-2] Scanning importers of depth-1 consumers..."

  declare -A SEEN_D1
  for d1 in "${ALL_DEPTH1_IMPORTERS[@]}"; do
    d1_module=$(basename "$d1" | sed 's/\.[^.]*$//')
    [ -n "${SEEN_D1[$d1_module]:-}" ] && continue
    SEEN_D1["$d1_module"]=1

    d2_importers=$(collect_importers "$d1_module")
    for imp in $d2_importers; do
      [[ "$imp" == *.test.ts ]] && continue
      add_test_for_file "$imp"
    done
  done
fi

echo ""

if [ ${#TEST_FILES[@]} -eq 0 ]; then
  echo "No downstream tests found."
  exit 0
fi

# 정렬
IFS=$'\n' SORTED_TESTS=($(printf '%s\n' "${TEST_FILES[@]}" | sort -u)); unset IFS

echo "=== Downstream Tests Found: ${#SORTED_TESTS[@]} ==="
printf '  %s\n' "${SORTED_TESTS[@]}"
echo ""
echo "Running tests..."
echo ""

pnpm exec vitest run "${SORTED_TESTS[@]}"
