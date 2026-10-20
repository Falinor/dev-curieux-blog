#!/bin/bash
# Cloud-session setup: Node from .nvmrc, pnpm from packageManager, dependencies
# (which also installs the lefthook git hooks), and the preinstalled Playwright browser.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi
cd "$CLAUDE_PROJECT_DIR"

# nvm is not strict-mode safe, so relax it around nvm calls only.
NODE_MAJOR="$(cat .nvmrc)"
export NVM_DIR=/opt/nvm
set +eu
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh" --no-use
nvm install "$NODE_MAJOR" >/dev/null
NODE_PATH_BIN="$(nvm which "$NODE_MAJOR")"
set -eu
NODE_BIN="$(dirname "$NODE_PATH_BIN")"
export PATH="$NODE_BIN:$PATH"

PNPM_VERSION="$(node -p "require('./package.json').packageManager.split('@')[1]")"
if [ "$("$NODE_BIN/pnpm" -v 2>/dev/null || true)" != "$PNPM_VERSION" ]; then
  npm install -g --allow-scripts=pnpm "pnpm@$PNPM_VERSION" >/dev/null
fi
pnpm install

# The container's Chromium build differs from what the npm Playwright expects,
# so the Playwright config launches this binary when the variable is set.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$NODE_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  echo 'export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium' >> "$CLAUDE_ENV_FILE"
fi
