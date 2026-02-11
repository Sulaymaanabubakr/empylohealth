#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BATCH_SIZE="${BATCH_SIZE:-6}"
MAX_RETRIES="${MAX_RETRIES:-4}"
RETRY_DELAY_SECONDS="${RETRY_DELAY_SECONDS:-25}"

if ! [[ "$BATCH_SIZE" =~ ^[0-9]+$ ]] || [ "$BATCH_SIZE" -lt 1 ]; then
  echo "BATCH_SIZE must be a positive integer. Got: $BATCH_SIZE"
  exit 1
fi

FUNCTIONS=()
while IFS= read -r fn; do
  [ -n "$fn" ] && FUNCTIONS+=("$fn")
done < <(grep -E '^export const [A-Za-z0-9_]+ =' src/index.ts | sed -E 's/^export const ([A-Za-z0-9_]+) =.*/\1/')

if [ "${#FUNCTIONS[@]}" -eq 0 ]; then
  echo "No exported functions found in src/index.ts"
  exit 1
fi

if [ -n "${FUNCTIONS_FILTER:-}" ]; then
  FILTERED_FUNCTIONS=()
  IFS=',' read -r -a REQUESTED <<< "$FUNCTIONS_FILTER"
  for raw in "${REQUESTED[@]}"; do
    fn="$(echo "$raw" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
    [ -z "$fn" ] && continue

    found=0
    for exported in "${FUNCTIONS[@]}"; do
      if [ "$exported" = "$fn" ]; then
        FILTERED_FUNCTIONS+=("$fn")
        found=1
        break
      fi
    done

    if [ "$found" -eq 0 ]; then
      echo "Requested function '$fn' is not exported from src/index.ts"
      exit 1
    fi
  done

  if [ "${#FILTERED_FUNCTIONS[@]}" -eq 0 ]; then
    echo "FUNCTIONS_FILTER was provided but no valid functions were selected."
    exit 1
  fi

  FUNCTIONS=("${FILTERED_FUNCTIONS[@]}")
fi

echo "Building functions..."
npm run build

echo "Deploying ${#FUNCTIONS[@]} functions in batches of ${BATCH_SIZE}..."

for ((i=0; i<${#FUNCTIONS[@]}; i+=BATCH_SIZE)); do
  BATCH=("${FUNCTIONS[@]:i:BATCH_SIZE}")
  ONLY=""
  for fn in "${BATCH[@]}"; do
    if [ -z "$ONLY" ]; then
      ONLY="functions:${fn}"
    else
      ONLY+=" ,functions:${fn}"
    fi
  done
  ONLY="${ONLY// ,/,}"

  echo "\n--- Deploying batch $((i / BATCH_SIZE + 1)) (${#BATCH[@]} functions) ---"
  echo "$ONLY"

  success=0
  for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
    set +e
    output=$(firebase deploy --only "$ONLY" 2>&1)
    status=$?
    set -e

    echo "$output"

    if [ "$status" -eq 0 ]; then
      success=1
      break
    fi

    if echo "$output" | grep -Eiq 'quota exceeded|already in progress'; then
      if [ "$attempt" -lt "$MAX_RETRIES" ]; then
        wait_time=$((RETRY_DELAY_SECONDS * attempt))
        echo "Transient deploy limit hit. Retrying in ${wait_time}s (attempt ${attempt}/${MAX_RETRIES})..."
        sleep "$wait_time"
        continue
      fi
    fi

    echo "Batch failed with non-retriable error."
    exit "$status"
  done

  if [ "$success" -ne 1 ]; then
    echo "Batch failed after ${MAX_RETRIES} attempts."
    exit 1
  fi

  sleep 2
done

echo "\nAll batches deployed successfully."
