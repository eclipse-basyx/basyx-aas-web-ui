#!/bin/bash
set -euo pipefail

ROOT="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

echo "Starting backend..."
cd "$ROOT/aas-test-backend"
docker compose up -d

cd "$ROOT/aas-web-ui"

read -r -p "Do a clean install? (y/N)" clean_install
if [ "$clean_install" = "y" ] || [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  rm -rf node_modules
  yarn install
fi

echo "Starting frontend..."
yarn dev
