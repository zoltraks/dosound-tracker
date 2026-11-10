#!/usr/bin/env bash
# Release gate: verifies the documentation-state preconditions a version bump
# requires (docs/VERSIONING.md). Reports every finding; exits 1 on a failed
# required check unless --warn is passed.

set -euo pipefail
cd "$(dirname "$0")/.."

WARN_ONLY=0
[ "${1:-}" = "--warn" ] && WARN_ONLY=1

VERSION=$(node -e "console.log(require('./package.json').version)")
FAIL=0

say()  { printf '%s\n' "$1"; }
fail() { say "FAIL  $1"; FAIL=1; }
warn() { say "WARN  $1"; }
ok()   { say "OK    $1"; }

say "Release gate for version ${VERSION}"
say ""

# 1. Change records: when src/ carries a delta, docs/change/<version>/ must
#    hold at least one record. Coverage is presence-level - records do not
#    name their changed files.
SRC_DELTA=$(git status --porcelain -- src/ electron/ public/worker.js 2>/dev/null | wc -l | tr -d ' ')
RECORDS=$(ls "docs/change/${VERSION}" 2>/dev/null | grep -c '\.md$' || true)
# Window N's records produce release N+1: post-bump, the uncommitted delta's
# records sit under the previous patch version.
PREV_VERSION=$(echo "$VERSION" | awk -F. '{printf "%s.%s.%d", $1, $2, ($3 > 0 ? $3 - 1 : $3)}')
RECORDS_DIR="${VERSION}"
if [ "$RECORDS" -eq 0 ] && [ "$PREV_VERSION" != "$VERSION" ]; then
  PREV_RECORDS=$(ls "docs/change/${PREV_VERSION}" 2>/dev/null | grep -c '\.md$' || true)
  if [ "$PREV_RECORDS" -gt 0 ]; then
    RECORDS=$PREV_RECORDS
    RECORDS_DIR="${PREV_VERSION}"
  fi
fi
if [ "$SRC_DELTA" -gt 0 ]; then
  if [ "$RECORDS" -gt 0 ]; then
    ok "change records: ${RECORDS} record(s) in docs/change/${RECORDS_DIR}/ for ${SRC_DELTA} changed file(s)"
  else
    fail "change records: ${SRC_DELTA} src/ file(s) changed but docs/change/${VERSION}/ has no records"
  fi
else
  ok "change records: no src/ delta"
fi

# 1b. Served changelog: a stale dist/CHANGELOG.md (missing the current
#     version heading) means the build predates the changelog entry.
if [ -f "dist/CHANGELOG.md" ] && ! grep -q "## Version ${VERSION}" dist/CHANGELOG.md; then
  fail "served changelog: dist/CHANGELOG.md has no '## Version ${VERSION}' entry - run npm run build"
else
  ok "served changelog: dist/CHANGELOG.md covers ${VERSION}"
fi

# 2. Refactoring assessments: the current version's cycle requires an
#    ASSESSMENT.md; historical gaps predate the convention (recorded
#    variance) and are warnings, not failures.
for p in "docs/refactoring/${VERSION}/REFACTORING.md"; do
  if [ -e "$p" ] && [ ! -f "$(dirname "$p")/ASSESSMENT.md" ]; then
    fail "refactoring: docs/refactoring/${VERSION} has no ASSESSMENT.md"
  fi
done
[ -e "docs/refactoring/${VERSION}/REFACTORING.md" ] && [ -f "docs/refactoring/${VERSION}/ASSESSMENT.md" ] \
  && ok "refactoring: ${VERSION} cycle is assessed"
[ ! -e "docs/refactoring/${VERSION}/REFACTORING.md" ] \
  && ok "refactoring: no cycle open for ${VERSION}"
for p in docs/refactoring/*/REFACTORING.md; do
  [ -e "$p" ] || continue
  d=$(dirname "$p"); v=$(basename "$d")
  [ "$v" = "$VERSION" ] && continue
  [ -f "$d/ASSESSMENT.md" ] || warn "refactoring: historical cycle $v has no ASSESSMENT.md (recorded variance)"
done

# 3. Window review: reported, never enforced - ad-hoc bumps are allowed
#    without a window when the waiver is recorded in VERSIONING.md.
if [ -f "docs/review/${VERSION}/review-${VERSION}.md" ]; then
  ok "window review: docs/review/${VERSION}/review-${VERSION}.md present"
elif [ -d "docs/review" ] && ls docs/review/ >/dev/null 2>&1; then
  warn "window review: no review for ${VERSION} (acceptable for an ad-hoc bump; a window bump requires it)"
else
  warn "window review: none for ${VERSION}"
fi

say ""
if [ "$FAIL" -eq 0 ]; then
  say "Gate clear - proceed with: verification loop, npm audit, npm run bump"
else
  say "Gate failed - resolve the FAIL items before bumping"
fi
[ "$WARN_ONLY" -eq 1 ] && exit 0
[ "$FAIL" -eq 0 ]
