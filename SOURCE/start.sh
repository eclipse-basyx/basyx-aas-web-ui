#!/bin/bash
set -euo pipefail

ROOT="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

cleanup() {
  echo "Stopping backend services..."
  kill "$MAVEN_PID" 2>/dev/null || true
  cd "$ROOT/aas-test-backend"
  docker compose down
}
trap cleanup EXIT

read -r -p "Do a clean install? (y/N) " clean_install
if [[ "$clean_install" == "y" ]]; then
  echo "Installing dependencies..."
  (cd "$ROOT/aas4j" && mvn clean install -DskipTests)
  (cd "$ROOT/aas-spring-backend" && mvn clean install -DskipTests)
  (cd "$ROOT/aas-spring-backend/basyx.aasenvironment/basyx.aasenvironment.component" && mvn clean install -DskipTests)
  (cd "$ROOT/aas-web-ui" && rm -rf node_modules && yarn install)
fi

echo "Starting backend..."
cd "$ROOT/aas-test-backend"
docker compose up -d

cd "$ROOT/aas-spring-backend/basyx.aasenvironment/basyx.aasenvironment.component"
mvn spring-boot:run &> /dev/null &
MAVEN_PID=$!

echo "Starting frontend..."
cd "$ROOT/aas-web-ui"
yarn dev
