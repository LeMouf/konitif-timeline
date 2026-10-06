#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_PATH:?GitHub path required}"

# Use a compatible preinstalled runtime; never download or install a toolchain.
compatible_node() {
  local version major minor patch
  version="$("$1" --version 2>/dev/null)" || return 1
  [[ "$version" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || return 1
  major="${BASH_REMATCH[1]}"; minor="${BASH_REMATCH[2]}"; patch="${BASH_REMATCH[3]}"
  (( major > 22 || (major == 22 && minor >= 14) ))
}

select_runtime() {
  local bin="$1"
  [[ -x "$bin/node" && -x "$bin/npm" ]] || return 1
  compatible_node "$bin/node" || return 1
  if [[ "${KONITIF_PUBLISH_RUNTIME:-0}" == 1 ]]; then
    local npm_version npm_major npm_minor npm_patch
    npm_version="$(PATH="$bin:$PATH" "$bin/npm" --version 2>/dev/null)" || return 1
    [[ "$npm_version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || return 1
    npm_major="${BASH_REMATCH[1]}"; npm_minor="${BASH_REMATCH[2]}"; npm_patch="${BASH_REMATCH[3]}"
    (( npm_major > 11 || (npm_major == 11 && (npm_minor > 5 || (npm_minor == 5 && npm_patch >= 1))) )) || return 1
  fi
  printf '%s\n' "$bin" >> "$GITHUB_PATH"
  printf 'Selected preinstalled Node %s\n' "$("$bin/node" --version)"
}

node_path="$(command -v node || true)"
if [[ -n "$node_path" ]] && select_runtime "${node_path%/*}"; then
  exit 0
fi

if [[ -n "${RUNNER_TOOL_CACHE:-}" ]]; then
  for node_bin in "$RUNNER_TOOL_CACHE"/node/*/x64/bin; do
    if select_runtime "$node_bin"; then exit 0; fi
  done
fi

printf '%s\n' 'No compatible preinstalled Node >=22.14.0 with npm found. Publishing additionally requires npm >=11.5.1. No tools were installed.' >&2
exit 1
