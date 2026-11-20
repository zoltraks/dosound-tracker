#!/usr/bin/env bash
# Sync local branches with the configured remotes: fetch, create missing
# local tracking branches for remote heads, pull every tracked branch, then
# optionally force-push all local branches.
#
# Safety posture mirrors scripts/retention-sweep.mjs - dry-run is the
# default and prints the plan without changing anything:
#
#   scripts/sync-branches.sh                         print the plan, stop
#   scripts/sync-branches.sh --apply                 local sync only
#   scripts/sync-branches.sh --push                  sync plus force-push
#   scripts/sync-branches.sh --push --remote a,b     restrict push targets
#
# --push implies --apply. --remote takes a comma-separated allowlist and
# requires --push - without it every configured remote is a push target.
# The push phase never deletes branches: remote refs absent locally are
# left untouched. The script never commits.

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/sync-branches.sh [--apply] [--push] [--remote <name>[,<name>...]] [--help]

  (no flags)   Dry-run: print what the sync would do and stop.
  --apply      Run the local sync: fetch all remotes, create missing local
               tracking branches, pull every tracked branch. No remote
               writes.
  --push       Also force-push (--force-with-lease) every local branch to
               the target remotes. Implies --apply.
  --remote     Comma-separated allowlist of push targets. Requires --push;
               default is every configured remote.
  --help       Show this message.

The push phase never deletes branches - remote refs absent locally are
left untouched. The script never commits.
EOF
}

APPLY=false
PUSH=false
REMOTE_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --apply)
            APPLY=true
            ;;
        --push)
            PUSH=true
            ;;
        --remote)
            shift
            if [ $# -eq 0 ]; then
                echo "sync-branches: --remote requires a comma-separated remote list" >&2
                exit 2
            fi
            # Remote names never contain whitespace - compact it away so
            # "--remote origin, scene" parses the same as "origin,scene".
            REMOTE_CSV="${1//[[:space:]]/}"
            IFS=',' read -ra _batch <<<"$REMOTE_CSV"
            for _remote in "${_batch[@]}"; do
                [ -n "$_remote" ] && REMOTE_ARGS+=("$_remote")
            done
            ;;
        --help | -h)
            usage
            exit 0
            ;;
        *)
            echo "sync-branches: unknown option '$1'" >&2
            usage >&2
            exit 2
            ;;
    esac
    shift
done

if [ "${#REMOTE_ARGS[@]}" -gt 0 ] && [ "$PUSH" != true ]; then
    echo "sync-branches: --remote only applies together with --push" >&2
    exit 2
fi
if [ "$PUSH" = true ]; then
    APPLY=true
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "sync-branches: not inside a git work tree" >&2
    exit 1
fi

ALL_REMOTES=()
while IFS= read -r remote; do
    ALL_REMOTES+=("$remote")
done < <(git remote)

if [ "${#ALL_REMOTES[@]}" -eq 0 ]; then
    echo "sync-branches: no remotes configured" >&2
    exit 1
fi

PUSH_TARGETS=()
if [ "$PUSH" = true ]; then
    if [ "${#REMOTE_ARGS[@]}" -gt 0 ]; then
        for candidate in "${REMOTE_ARGS[@]}"; do
            known=false
            for remote in "${ALL_REMOTES[@]}"; do
                if [ "$candidate" = "$remote" ]; then
                    known=true
                    break
                fi
            done
            if [ "$known" != true ]; then
                echo "sync-branches: --remote '$candidate' is not a configured remote (have: ${ALL_REMOTES[*]})" >&2
                exit 2
            fi
            PUSH_TARGETS+=("$candidate")
        done
    else
        PUSH_TARGETS=("${ALL_REMOTES[@]}")
    fi
fi

CURRENT_BRANCH=$(git branch --show-current)
restore_branch() {
    if [ -n "$CURRENT_BRANCH" ] && [ "$(git branch --show-current)" != "$CURRENT_BRANCH" ]; then
        git checkout "$CURRENT_BRANCH" ||
            echo "sync-branches: warning - could not return to $CURRENT_BRANCH" >&2
    fi
}
trap restore_branch EXIT

# Print "<sha>\t<branch>" for every head on the named remote. Queries the
# live remote first and falls back to the cached remote-tracking refs when
# the remote is unreachable, so a dry-run still produces a plan. Pass
# "cached" as $2 to skip the live query - used after git fetch --all,
# where the tracking refs are already fresh.
remote_heads() {
    local remote="$1" mode="${2:-live}" out
    if [ "$mode" != "cached" ]; then
        if out=$(git ls-remote --heads "$remote" 2>/dev/null) && [ -n "$out" ]; then
            printf '%s\n' "$out" | awk '{ print $1 "\t" substr($2, 12) }'
            return 0
        fi
        echo "sync-branches: note - $remote unreachable, using cached remote-tracking refs" >&2
    fi
    git for-each-ref --format='%(objectname)%09%(refname:strip=3)' "refs/remotes/$remote" |
        awk '$2 != "HEAD"'
}

# Refresh LOCAL_SHA: branch name -> local commit sha for every local branch.
declare -A LOCAL_SHA=()
refresh_local_shas() {
    LOCAL_SHA=()
    local branch
    while IFS= read -r branch; do
        LOCAL_SHA["$branch"]="$(git rev-parse "refs/heads/$branch")"
    done < <(git for-each-ref --format='%(refname:short)' refs/heads)
}

# Print the force-push plan for one remote: which local branches are new on
# it, which differ from the remote head, which are unchanged, and which
# remote heads have no local branch - push --all never deletes those.
print_push_preview() {
    local remote="$1"
    local -A remote_sha=()
    local -a remote_branch_list=() new_branches=() update_branches=() remote_only=()
    local branch sha same_count=0

    while IFS=$'\t' read -r sha branch; do
        [ -z "${branch:-}" ] && continue
        remote_sha["$branch"]="$sha"
        remote_branch_list+=("$branch")
    done < <(remote_heads "$remote")

    while IFS= read -r branch; do
        if [ -z "${remote_sha[$branch]:-}" ]; then
            new_branches+=("$branch")
        elif [ "${remote_sha[$branch]}" != "${LOCAL_SHA[$branch]:-}" ]; then
            update_branches+=("$branch")
        else
            same_count=$((same_count + 1))
        fi
    done < <(git for-each-ref --format='%(refname:short)' refs/heads)

    for branch in "${remote_branch_list[@]}"; do
        git show-ref --verify --quiet "refs/heads/$branch" || remote_only+=("$branch")
    done

    echo "  $remote: ${#new_branches[@]} new, ${#update_branches[@]} update(s), $same_count unchanged, ${#remote_only[@]} remote-only head(s) left untouched"
    if [ "${#new_branches[@]}" -gt 0 ]; then
        echo "    new:    ${new_branches[*]}"
    fi
    if [ "${#update_branches[@]}" -gt 0 ]; then
        echo "    update: ${update_branches[*]}"
    fi
    if [ "${#remote_only[@]}" -gt 0 ]; then
        echo "    remote-only: ${remote_only[*]}"
    fi
}

# Print the full dry-run plan: fetch, tracking-branch creation across all
# remotes in remote order, the pull set, and the force-push preview.
print_dry_run() {
    local -A will_have=()
    local -a creations=() pulls=()
    local branch remote sha

    echo "sync-branches dry-run - no changes made"
    echo ""
    echo "Remotes: ${ALL_REMOTES[*]}"

    while IFS= read -r branch; do
        will_have["$branch"]=1
    done < <(git for-each-ref --format='%(refname:short)' refs/heads)

    for remote in "${ALL_REMOTES[@]}"; do
        while IFS=$'\t' read -r sha branch; do
            [ -z "${branch:-}" ] && continue
            if [ -z "${will_have[$branch]+x}" ]; then
                will_have["$branch"]=1
                creations+=("$branch <- $remote/$branch")
            fi
        done < <(remote_heads "$remote")
    done

    while IFS= read -r branch; do
        if git config --get "branch.$branch.remote" >/dev/null 2>&1; then
            pulls+=("$branch")
        fi
    done < <(git for-each-ref --format='%(refname:short)' refs/heads)

    echo ""
    echo "Fetch: git fetch --all"
    if [ "${#creations[@]}" -gt 0 ]; then
        echo ""
        echo "Would create local tracking branches (${#creations[@]}):"
        printf '  %s\n' "${creations[@]}"
    else
        echo ""
        echo "Would create local tracking branches: none"
    fi
    echo ""
    echo "Would pull (${#pulls[@]} branches with upstream config, plus the ${#creations[@]} new tracking branches):"
    if [ "${#pulls[@]}" -gt 0 ]; then
        printf '  %s\n' "${pulls[@]}"
    else
        echo "  none"
    fi

    echo ""
    echo "Push preview (runs only with --push, as git push --all --force-with-lease; never deletes):"
    refresh_local_shas
    for remote in "${ALL_REMOTES[@]}"; do
        print_push_preview "$remote"
    done

    echo ""
    echo "Dry-run only - pass --apply to run the local sync (fetch, track, pull)."
    echo "Add --push to also force-push every local branch; add --remote <name>[,<name>...]"
    echo "with --push to restrict push targets to an allowlist."
}

if [ "$APPLY" != true ]; then
    print_dry_run
    exit 0
fi

echo "Fetching from all remotes..."
git fetch --all

echo "Creating local tracking branches for missing remote branches..."
for remote in "${ALL_REMOTES[@]}"; do
    while IFS=$'\t' read -r _sha branch; do
        [ -z "${branch:-}" ] && continue
        if ! git show-ref --verify --quiet "refs/heads/$branch"; then
            echo "  $branch <- $remote/$branch"
            git branch --track "$branch" "$remote/$branch"
        fi
    done < <(remote_heads "$remote" cached)
done

echo "Pulling all local branches..."
while IFS= read -r branch; do
    if git config --get "branch.$branch.remote" >/dev/null 2>&1; then
        echo "Pulling $branch"
        git checkout "$branch"
        git pull
    fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads)

if [ "$PUSH" = true ]; then
    echo ""
    echo "WARNING: force-pushing every local branch to ${#PUSH_TARGETS[@]} remote(s)"
    echo "with --force-with-lease. Remote refs are set to the local sha; remote"
    echo "heads without a local branch are never deleted. The lease fails"
    echo "safely if a remote moved since the fetch above."
    echo ""
    refresh_local_shas
    for remote in "${PUSH_TARGETS[@]}"; do
        print_push_preview "$remote"
    done
    for remote in "${PUSH_TARGETS[@]}"; do
        echo "Pushing to $remote..."
        git push --all --force-with-lease "$remote"
    done
    echo "Push complete."
else
    echo ""
    echo "Local sync complete - no remote writes. Pass --push to also force-push."
fi
