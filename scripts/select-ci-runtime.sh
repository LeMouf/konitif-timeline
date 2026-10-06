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

printf '%s\n' 'No preinstalled Node >=22.14.0 with npm found in PATH or the runner cache. No tools were installed.' >&2
exit 1
