#!/usr/bin/env bash
# Seed Firestore from your terminal via deployed HTTP endpoints.
# Run from repo root or backend/; SEED_TOKEN is optional (only required if set in Firebase Functions config).
#
# Usage:
#   export SEED_TOKEN=your-secret   # optional; must match Firebase env SEED_TOKEN if set
#   ./backend/scripts/seed-from-terminal.sh status    # show counts
#   ./backend/scripts/seed-from-terminal.sh seed      # seed all (skip if data exists)
#   ./backend/scripts/seed-from-terminal.sh seed force   # clear & reseed
#   ./backend/scripts/seed-from-terminal.sh backfill  # add images to affirmations
#   ./backend/scripts/seed-from-terminal.sh backfill force

set -euo pipefail
PROJECT_ID="${FIREBASE_PROJECT_ID:-circles-app-by-empylo}"
BASE_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net"

pretty_print() {
  if command -v jq >/dev/null 2>&1; then
    jq .
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json, sys
try:
    obj = json.load(sys.stdin)
    json.dump(obj, sys.stdout, indent=2)
    sys.stdout.write("\n")
except Exception:
    sys.stdout.write(sys.stdin.read())'
    return
  fi

  cat
}

cmd="${1:-}"
extra="${2:-}"
query_parts=()
[ -n "${SEED_TOKEN:-}" ] && query_parts+=("token=${SEED_TOKEN}")
[ "$extra" = "force" ] && query_parts+=("force=1")
query=$(IFS='&'; echo "${query_parts[*]-}")

build_url() {
  local path="$1"
  if [ -n "$query" ]; then
    echo "${BASE_URL}/${path}?${query}"
  else
    echo "${BASE_URL}/${path}"
  fi
}

case "$cmd" in
  status)
    url=$(build_url "getSeedStatus")
    echo "GET ${url}"
    response=$(curl -s -X GET "${url}")
    pretty_print <<<"${response}"
    ;;
  seed)
    url=$(build_url "seedAll")
    echo "GET ${url} ${extra}"
    response=$(curl -s -X GET "${url}")
    pretty_print <<<"${response}"
    ;;
  backfill)
    url=$(build_url "backfillAffirmationImages")
    echo "GET ${url} ${extra}"
    response=$(curl -s -X GET "${url}")
    pretty_print <<<"${response}"
    ;;
  *)
    echo "Usage: $0 {status|seed|backfill} [force]"
    echo "  status              - show collection counts"
    echo "  seed [force]        - seed resources, challenges, affirmations (force = reset first)"
    echo "  backfill [force]    - add images to affirmations (force = seed affirmations if missing)"
    exit 1
    ;;
esac
