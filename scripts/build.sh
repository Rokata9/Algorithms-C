#!/usr/bin/env bash
# Compile the given .c file (must define main) together with helper .c files:
#   - other .c files in the same folder that do NOT define main
#   - .c files at the workspace root that do NOT define main
# Headers are searched in the workspace root and in the file's folder.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "usage: $0 <file.c>" >&2
  echo "Open a .c file that defines main, then run or debug." >&2
  exit 1
fi

FILE="$1"
if [[ "$FILE" != /* ]]; then
  FILE="$PWD/$FILE"
fi
if [[ ! -f "$FILE" ]]; then
  echo "error: no such file: $FILE" >&2
  exit 1
fi
FILE="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"

case "$FILE" in
  *.c) ;;
  *)
    echo "error: not a .c file: $FILE" >&2
    echo "Open a .c file that defines main, then run or debug." >&2
    exit 1
    ;;
esac

has_main() {
  grep -E -q '^[[:space:]]*(int|void)[[:space:]]+main[[:space:]]*\(' "$1"
}

if ! has_main "$FILE"; then
  echo "error: $(basename "$FILE") does not define main()." >&2
  echo "Run or debug the .c file that contains main." >&2
  echo "Helper .c files in the same folder (and at the repo root) are linked automatically." >&2
  exit 1
fi

DIR="$(dirname "$FILE")"
SOURCES=("$FILE")

add_helpers_from() {
  local folder="$1"
  local f
  for f in "$folder"/*.c; do
    [[ -e "$f" ]] || continue
    [[ "$f" == "$FILE" ]] && continue
    if has_main "$f"; then
      continue
    fi
    SOURCES+=("$f")
  done
}

add_helpers_from "$DIR"
if [[ "$DIR" != "$ROOT" ]]; then
  add_helpers_from "$ROOT"
fi

REL="${FILE#"$ROOT"/}"
if [[ "$REL" == "$FILE" ]]; then
  echo "error: file is not inside this workspace: $FILE" >&2
  exit 1
fi

OUT="$ROOT/build/${REL%.c}"
mkdir -p "$(dirname "$OUT")"

CC="${CC:-clang}"
CFLAGS="${CFLAGS:--std=c17 -g -O0 -Wall -Wextra -Wpedantic -fno-omit-frame-pointer}"

# shellcheck disable=SC2086
"$CC" $CFLAGS -I"$ROOT" -I"$DIR" "${SOURCES[@]}" -o "$OUT" -lm

echo "$OUT"
