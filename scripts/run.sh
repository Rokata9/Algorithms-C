#!/usr/bin/env bash
# Build the given .c program, then run it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$("$ROOT/scripts/build.sh" "${1:?}")"
exec "$BIN"
