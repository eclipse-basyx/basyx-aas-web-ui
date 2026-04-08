#!/bin/sh
set -eu

TARGET="${IT_TARGET:-preview}"
PORT="${IT_PORT:-4173}"
BASE_PATH_INPUT="${IT_BASE_PATH:-/ui/}"
LOGO_MODE="${IT_LOGO_MODE:-none}"
DOCKER_IMAGE_TAG="${IT_DOCKER_IMAGE_TAG:-aas-web-ui-integration:local}"
BUILD_DOCKER_IMAGE="${IT_BUILD_DOCKER_IMAGE:-false}"

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
FIXTURE_LOGO_PATH="$ROOT_DIR/tests/integration/fixtures/custom-logo.svg"
CONFIG_FILE_PATH="$ROOT_DIR/public/config/basyx-infra.yml"

cd "$ROOT_DIR"

normalize_base_path() {
  path_value="$1"

  if [ -z "$path_value" ]; then
    path_value="/"
  fi

  case "$path_value" in
    /*) ;;
    *) path_value="/$path_value" ;;
  esac

  if [ "$path_value" = "/" ]; then
    printf '/'
    return
  fi

  path_value="${path_value%/}/"
  printf '%s' "$path_value"
}

NORMALIZED_BASE_PATH=$(normalize_base_path "$BASE_PATH_INPUT")

echo "Starting integration runtime"
echo "  target: $TARGET"
echo "  base path input: $BASE_PATH_INPUT"
echo "  base path normalized: $NORMALIZED_BASE_PATH"
echo "  logo mode: $LOGO_MODE"

if [ "$TARGET" = "preview" ]; then
  export VITE_BASE_PATH="$NORMALIZED_BASE_PATH"
  export VITE_LOGO_LIGHT_PATH="${VITE_LOGO_LIGHT_PATH:-Logo_light.svg}"
  export VITE_LOGO_DARK_PATH="${VITE_LOGO_DARK_PATH:-Logo_dark.svg}"
  export VITE_PRIMARY_LIGHT_COLOR="${VITE_PRIMARY_LIGHT_COLOR:-#0cb2f0}"
  export VITE_PRIMARY_DARK_COLOR="${VITE_PRIMARY_DARK_COLOR:-#f69222}"

  if [ "$LOGO_MODE" = "env" ]; then
    export VITE_LOGO_LIGHT_PATH="custom-logo.svg"
    export VITE_LOGO_DARK_PATH="custom-logo.svg"
  fi

  BASE="$NORMALIZED_BASE_PATH" pnpm build-only

  if [ "$LOGO_MODE" = "env" ]; then
    cp "$FIXTURE_LOGO_PATH" "$ROOT_DIR/dist/Logo/custom-logo.svg"
  fi

  if [ "$LOGO_MODE" = "replace-default" ]; then
    cp "$FIXTURE_LOGO_PATH" "$ROOT_DIR/dist/Logo/Logo_light.svg"
    cp "$FIXTURE_LOGO_PATH" "$ROOT_DIR/dist/Logo/Logo_dark.svg"
  fi

  exec env BASE="$NORMALIZED_BASE_PATH" pnpm preview --host 127.0.0.1 --port "$PORT" --strictPort
fi

if [ "$TARGET" = "docker" ]; then
  docker rm -f aas-web-ui-it >/dev/null 2>&1 || true

  cleanup_container() {
    docker rm -f aas-web-ui-it >/dev/null 2>&1 || true
  }

  trap cleanup_container INT TERM EXIT

  if [ "$BUILD_DOCKER_IMAGE" = "true" ]; then
    docker build -t "$DOCKER_IMAGE_TAG" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"
  fi

  set -- \
    --rm \
    --name aas-web-ui-it \
    -p "$PORT:3000" \
    -e "BASE_PATH=$BASE_PATH_INPUT" \
    -v "$CONFIG_FILE_PATH:/basyx-infra.yml:ro"

  if [ "$LOGO_MODE" = "env" ]; then
    set -- "$@" \
      -e "LOGO_PATH=custom-logo.svg" \
      -v "$FIXTURE_LOGO_PATH:/usr/src/app/dist/Logo/custom-logo.svg:ro"
  fi

  if [ "$LOGO_MODE" = "replace-default" ]; then
    set -- "$@" \
      -v "$FIXTURE_LOGO_PATH:/usr/src/app/dist/Logo/Logo_light.svg:ro" \
      -v "$FIXTURE_LOGO_PATH:/usr/src/app/dist/Logo/Logo_dark.svg:ro"
  fi

  docker run "$@" "$DOCKER_IMAGE_TAG" &
  docker_pid=$!
  wait "$docker_pid"
  exit $?
fi

echo "Unsupported IT_TARGET: $TARGET" >&2
exit 1
