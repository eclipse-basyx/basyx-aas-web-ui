#!/usr/bin/env bash

set -euo pipefail

# Install the integrity-pinned packageManager version directly instead of
# bootstrapping it through a different pnpm release's self-update command.
corepack enable pnpm

PACKAGE_MANAGER="$(node -p "require('./package.json').packageManager")"
if [[ "${PACKAGE_MANAGER}" != pnpm@* ]]; then
  echo "Expected packageManager to pin pnpm, got: ${PACKAGE_MANAGER}" >&2
  exit 1
fi

EXPECTED_VERSION="${PACKAGE_MANAGER#pnpm@}"
EXPECTED_VERSION="${EXPECTED_VERSION%%+*}"
ACTUAL_VERSION="$(pnpm --version)"

if [[ "${ACTUAL_VERSION}" != "${EXPECTED_VERSION}" ]]; then
  echo "Expected pnpm ${EXPECTED_VERSION}, got ${ACTUAL_VERSION}" >&2
  exit 1
fi

echo "Using pnpm ${ACTUAL_VERSION} from the packageManager field."
