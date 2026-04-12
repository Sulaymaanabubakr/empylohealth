#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

rg -n "firebase/auth|firebase/functions" "$ROOT_DIR/frontend/src/services/auth" "$ROOT_DIR/frontend/src/context" "$ROOT_DIR/web/src/admin/contexts" || true
