#!/usr/bin/env bash
set -euo pipefail
root="$1"
script="$2"
mkdir -p "$root/cache/node/24.9.0/x64/bin" "$root/old"
printf '#!/bin/sh\necho v24.9.0\n' > "$root/cache/node/24.9.0/x64/bin/node"
printf '#!/bin/sh\nexit 0\n' > "$root/cache/node/24.9.0/x64/bin/npm"
printf '#!/bin/sh\necho v20.19.0\n' > "$root/old/node"
cp "$root/cache/node/24.9.0/x64/bin/npm" "$root/old/npm"
chmod +x "$root/cache/node/24.9.0/x64/bin/"* "$root/old/"*
export GITHUB_PATH="$root/path-output"
export RUNNER_TOOL_CACHE="$root/cache"
export PATH="$root/old:/usr/bin:/bin"
bash "$script"
grep -F "$root/cache/node/24.9.0/x64/bin" "$GITHUB_PATH"
export RUNNER_TOOL_CACHE="$root/absent"
if bash "$script"; then echo 'Expected incompatible runtime refusal' >&2; exit 1; fi
export PATH="$root/cache/node/24.9.0/x64/bin:/usr/bin:/bin"
bash "$script"
printf '#!/bin/sh\necho v22.14.0\n' > "$root/cache/node/24.9.0/x64/bin/node"
bash "$script"
printf '#!/bin/sh\necho v22.13.9\n' > "$root/cache/node/24.9.0/x64/bin/node"
if bash "$script"; then echo 'Expected minimum-version refusal' >&2; exit 1; fi
echo 'Five runtime-selection scenarios passed'

export KONITIF_PUBLISH_RUNTIME=1
printf '#!/bin/sh\necho v24.9.0\n' > "$root/cache/node/24.9.0/x64/bin/node"
printf '#!/bin/sh\necho 11.5.0\n' > "$root/cache/node/24.9.0/x64/bin/npm"
if bash "$script"; then echo 'Expected obsolete publishing npm refusal' >&2; exit 1; fi
printf '#!/bin/sh\necho 11.5.1\n' > "$root/cache/node/24.9.0/x64/bin/npm"
bash "$script"
echo 'Publishing npm boundary scenarios passed'