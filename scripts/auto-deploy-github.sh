#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

INTERVAL_SECONDS="${AUTO_PUSH_INTERVAL:-5}"
COMMIT_PREFIX="${AUTO_PUSH_MESSAGE_PREFIX:-chore(auto): sync changes}"
REMOTE_NAME="${AUTO_PUSH_REMOTE:-origin}"
BRANCH_NAME="${AUTO_PUSH_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

if ! [[ "$INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SECONDS" -lt 1 ]]; then
  echo "AUTO_PUSH_INTERVAL must be a positive integer (seconds)."
  exit 1
fi

if [[ "$BRANCH_NAME" == "HEAD" ]]; then
  echo "Detached HEAD detected. Checkout a branch before running auto deploy."
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Current directory is not a git repository."
  exit 1
fi

if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  echo "Remote '$REMOTE_NAME' does not exist."
  exit 1
fi

has_upstream() {
  git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1
}

is_git_busy() {
  [[ -f .git/MERGE_HEAD ]] || \
  [[ -d .git/rebase-merge ]] || \
  [[ -d .git/rebase-apply ]] || \
  [[ -f .git/CHERRY_PICK_HEAD ]] || \
  [[ -f .git/REVERT_HEAD ]] || \
  [[ -f .git/BISECT_LOG ]] || \
  [[ -f .git/index.lock ]]
}

status_snapshot() {
  git status --porcelain --untracked-files=normal
}

push_changes_if_needed() {
  if is_git_busy; then
    echo "[auto-deploy] Git operation in progress, skipping this cycle."
    return
  fi

  local current_status
  current_status="$(status_snapshot)"
  if [[ -z "$current_status" ]]; then
    return
  fi

  git add -A

  if git diff --cached --quiet; then
    return
  fi

  local timestamp commit_message
  timestamp="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  commit_message="${COMMIT_PREFIX} (${timestamp})"

  if ! git commit -m "$commit_message" >/dev/null 2>&1; then
    echo "[auto-deploy] Commit skipped."
    return
  fi

  if has_upstream; then
    git push "$REMOTE_NAME" "$BRANCH_NAME"
  else
    git push --set-upstream "$REMOTE_NAME" "$BRANCH_NAME"
  fi

  echo "[auto-deploy] Pushed commit to ${REMOTE_NAME}/${BRANCH_NAME}: ${commit_message}"
}

echo "[auto-deploy] Watching ${REPO_DIR}"
echo "[auto-deploy] Branch: ${BRANCH_NAME}, interval: ${INTERVAL_SECONDS}s"
echo "[auto-deploy] Press Ctrl+C to stop."

trap 'echo "[auto-deploy] Stopped."; exit 0' INT TERM

while true; do
  push_changes_if_needed
  sleep "$INTERVAL_SECONDS"
done
