#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# cr-agent.sh  —  CodeRabbit review agent
#
# Watches for new commits, runs CodeRabbit, passes findings to Claude Code
# to auto-apply fixes, then commits the result.
#
# Usage:  bash cr-agent.sh [--interval <seconds>]
# ─────────────────────────────────────────────────────────────────────────────

REPO_DIR="/Users/nupurpatil/plant scanner app/Plantopia"
INNER_DIR="$REPO_DIR/Plantopia"
LOG_FILE="$REPO_DIR/.cr-agent.log"
LAST_COMMIT_FILE="$REPO_DIR/.cr-agent-last-commit"
INTERVAL="${2:-60}"   # default: check every 60 seconds

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

log()   { local ts; ts=$(date '+%H:%M:%S'); echo -e "${CYAN}[$ts]${NC} $1" | tee -a "$LOG_FILE"; }
ok()    { local ts; ts=$(date '+%H:%M:%S'); echo -e "${GREEN}[$ts] ✓${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { local ts; ts=$(date '+%H:%M:%S'); echo -e "${YELLOW}[$ts] ⚠${NC} $1" | tee -a "$LOG_FILE"; }
err()   { local ts; ts=$(date '+%H:%M:%S'); echo -e "${RED}[$ts] ✗${NC} $1" | tee -a "$LOG_FILE"; }

separator() { echo -e "${CYAN}$(printf '─%.0s' {1..78})${NC}" | tee -a "$LOG_FILE"; }

# ── prereq checks ─────────────────────────────────────────────────────────────
check_prereqs() {
  local missing=0
  command -v coderabbit &>/dev/null || { err "coderabbit CLI not found"; missing=1; }
  command -v claude     &>/dev/null || { err "claude CLI not found";     missing=1; }
  command -v git        &>/dev/null || { err "git not found";            missing=1; }
  [ $missing -eq 1 ] && exit 1
  ok "All prerequisites found"
}

# ── run one review cycle ──────────────────────────────────────────────────────
run_cycle() {
  cd "$REPO_DIR" || { err "Cannot cd to $REPO_DIR"; return 1; }

  local current_commit
  current_commit=$(git rev-parse HEAD 2>/dev/null)
  if [ -z "$current_commit" ]; then
    warn "Not a git repo or no commits yet"; return 0
  fi

  local last_commit
  last_commit=$(cat "$LAST_COMMIT_FILE" 2>/dev/null || echo "")

  if [ "$last_commit" = "$current_commit" ]; then
    log "No new commits (${current_commit:0:8}). Waiting…"; return 0
  fi

  separator
  log "New commit detected: ${current_commit:0:8}"
  local base_ref="${last_commit:-HEAD~1}"

  # ── run CodeRabbit review ──────────────────────────────────────────────────
  log "Running CodeRabbit review (base: ${base_ref:0:8})…"
  local review_file
  review_file=$(mktemp /tmp/cr-review-XXXXXX.txt)

  if ! coderabbit review --plain --base "$base_ref" > "$review_file" 2>&1; then
    local output
    output=$(cat "$review_file")
    if echo "$output" | grep -q "No files found"; then
      ok "Nothing to review"
      echo "$current_commit" > "$LAST_COMMIT_FILE"
      rm -f "$review_file"
      return 0
    fi
    err "CodeRabbit review failed:"
    cat "$review_file" | tee -a "$LOG_FILE"
    rm -f "$review_file"
    return 1
  fi

  # Check if there are actual findings (potential_issue / bug lines)
  if ! grep -q "Type: potential_issue\|Type: bug\|Type: security" "$review_file"; then
    ok "Review complete — no actionable findings"
    echo "$current_commit" > "$LAST_COMMIT_FILE"
    rm -f "$review_file"
    return 0
  fi

  local finding_count
  finding_count=$(grep -c "^============" "$review_file" || echo "?")
  warn "Found $finding_count finding(s). Applying fixes via Claude Code…"

  # ── pass to Claude Code CLI ───────────────────────────────────────────────
  local fix_prompt
  fix_prompt="$(cat <<'PROMPT'
You are acting as an automated code-fix agent.
Below are CodeRabbit review findings for this codebase.
For each finding marked as potential_issue or bug:
  1. Read the relevant file(s)
  2. Apply the suggested fix exactly as described
  3. Do NOT fix things already fixed, skip if the issue no longer exists
  4. Do NOT add explanatory comments or reformat unrelated code

After applying all fixes, run: npx expo lint
Fix any NEW lint errors introduced by your changes.

Here are the findings:

PROMPT
)"
  fix_prompt+=$'\n\n'
  fix_prompt+=$(cat "$review_file")

  local fix_log="$REPO_DIR/.cr-agent-fix.log"
  cd "$INNER_DIR" || return 1

  log "Invoking Claude Code to apply fixes…"
  if ! claude --print --allowedTools "Edit,Read,Write,Bash,Glob,Grep" "$fix_prompt" 2>&1 | tee "$fix_log" | tail -20 | tee -a "$LOG_FILE"; then
    err "Claude Code invocation failed — see $fix_log"
    rm -f "$review_file"
    return 1
  fi

  # ── lint check ────────────────────────────────────────────────────────────
  log "Running lint check…"
  cd "$INNER_DIR" && npx expo lint 2>&1 | tee -a "$LOG_FILE"
  local lint_exit=${PIPESTATUS[0]}
  if [ $lint_exit -ne 0 ]; then
    warn "Lint issues detected after fixes — check $fix_log"
  fi

  # ── commit if changes exist ───────────────────────────────────────────────
  cd "$REPO_DIR" || return 1
  if git diff --quiet && git diff --staged --quiet; then
    ok "No file changes made"
  else
    git add -A
    git commit -m "$(cat <<EOF
fix: auto-apply CodeRabbit review findings ($finding_count issues)

Automated fixes applied by cr-agent using CodeRabbit + Claude Code.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
    ok "Fixes committed: $(git rev-parse --short HEAD)"
  fi

  echo "$current_commit" > "$LAST_COMMIT_FILE"
  rm -f "$review_file"
  separator
}

# ── main loop ─────────────────────────────────────────────────────────────────
main() {
  # Parse --interval flag
  while [[ $# -gt 0 ]]; do
    case $1 in
      --interval|-i) INTERVAL="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  mkdir -p "$(dirname "$LOG_FILE")"
  > "$LOG_FILE"   # start fresh log each run

  separator
  log "🌿 CodeRabbit Agent starting"
  log "   Repo   : $REPO_DIR"
  log "   Interval: ${INTERVAL}s"
  log "   Log     : $LOG_FILE"
  separator

  check_prereqs

  while true; do
    run_cycle
    log "Sleeping ${INTERVAL}s…"
    sleep "$INTERVAL"
  done
}

main "$@"
