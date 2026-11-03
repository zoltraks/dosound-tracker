#!/usr/bin/env bash
# clean / purge maintenance for dosound-tracker.
#
#   scripts/clean.sh            remove gitignored build artifacts and temp residue
#   scripts/clean.sh --purge    additionally remove node_modules/ and work/
#   scripts/clean.sh --dry-run  list targets without deleting
#
# Every target is verified git-ignored and untracked before deletion.
# Locked files are reported and skipped rather than failing the run.
set -u
cd "$(dirname "$0")/.."

DRY_RUN=0
PURGE=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --purge) PURGE=1 ;;
    -h | --help)
      echo "usage: clean.sh [--dry-run] [--purge]"
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

# Removable directory targets.
TARGETS="dist coverage playwright-report test-results"
if [ "$PURGE" -eq 1 ]; then
  TARGETS="$TARGETS node_modules work"
fi

# A path is removable only when git reports it ignored and no tracked file
# answers to it.
removable() {
  git check-ignore -q "$1" || return 1
  ! git ls-files --error-unmatch "$1" >/dev/null 2>&1
}

removed=0
skipped=0

remove_path() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "would remove: $1"
    removed=$((removed + 1))
    return
  fi
  if rm -rf "$1" 2>/dev/null; then
    echo "removed: $1"
    removed=$((removed + 1))
  else
    echo "skipped (locked or busy): $1" >&2
    skipped=$((skipped + 1))
  fi
}

for dir in $TARGETS; do
  [ -e "$dir" ] || continue
  if removable "$dir"; then
    remove_path "$dir"
  else
    echo "skipped (not ignored or tracked): $dir" >&2
    skipped=$((skipped + 1))
  fi
done

# Temp residue anywhere in the tree, outside node_modules.
while IFS= read -r -d '' f; do
  if removable "$f"; then
    remove_path "$f"
  fi
done < <(find . \( -path ./node_modules -o -path ./.git \) -prune -o -type f \( -name '*.log' -o -name '*.tmp' -o -name '*.bak' -o -name '.DS_Store' \) -print0)

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run complete: $removed target(s) listed, $skipped skipped"
else
  echo "done: $removed removed, $skipped skipped"
fi

if [ "$PURGE" -eq 1 ]; then
  echo "restore with: npm install"
fi
