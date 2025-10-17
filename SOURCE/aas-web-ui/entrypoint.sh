#!/bin/sh

# Check if BASE_PATH is set, otherwise use default '/'
: "${BASE_PATH:=/}"

# Define other environment variables, with defaults if not provided
: "${LOGO_PATH:=}"
: "${LOGO_LIGHT_PATH:=Logo_light.svg}"
: "${LOGO_DARK_PATH:=Logo_dark.svg}"
: "${AAS_DISCOVERY_PATH:=}"
: "${AAS_REGISTRY_PATH:=}"
: "${SUBMODEL_REGISTRY_PATH:=}"
: "${AAS_REPO_PATH:=}"
: "${SUBMODEL_REPO_PATH:=}"
: "${CD_REPO_PATH:=}"
: "${PRIMARY_COLOR:=}"
: "${PRIMARY_LIGHT_COLOR:=#0cb2f0}"
: "${PRIMARY_DARK_COLOR:=#f69222}"
: "${INFLUXDB_TOKEN:=}"
: "${KEYCLOAK_URL:=}"
: "${KEYCLOAK_REALM:=}"
: "${KEYCLOAK_CLIENT_ID:=}"
: "${PRECONFIGURED_AUTH_USERNAME:=}"
: "${PRECONFIGURED_AUTH_PASSWORD:=}"
: "${ENDPOINT_CONFIG_AVAILABLE:=true}"
: "${SINGLE_AAS:=false}"
: "${SINGLE_AAS_REDIRECT:=}"
: "${SM_VIEWER_EDITOR:=true}"
: "${ALLOW_EDITING:=true}"
: "${ALLOW_UPLOADING:=true}"
: "${ALLOW_LOGOUT:=true}"
: "${BASIC_AUTH_USERNAME:=}"
: "${BASIC_AUTH_PASSWORD:=}"
: "${EDITOR_ID_PREFIX:=https://example.com/}"

# Replace ${BASE_PATH} in the NGINX config template (without trailing slash)
envsubst '${BASE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Add a trailing slash to BASE_PATH for the replacement in files
BASE_PATH_WITH_SLASH=$(echo "$BASE_PATH" | sed 's|/*$|/|')

# Set LOGO_LIGHT_PATH and LOGO_DARK_PATH based on LOGO_PATH
if [ -n "$LOGO_PATH" ]; then
    LOGO_LIGHT_PATH="$LOGO_PATH"
    LOGO_DARK_PATH="$LOGO_PATH"
fi

# Set PRIMARY_LIGHT_COLOR and PRIMARY_DARK_COLOR based on PRIMARY_COLOR
if [ -n "$PRIMARY_COLOR" ]; then
    PRIMARY_LIGHT_COLOR="$PRIMARY_COLOR"
    PRIMARY_DARK_COLOR="$PRIMARY_COLOR"
fi

# Automatically set KEYCLOAK_ACTIVE if URL, REALM, and CLIENT_ID are set
if [ -n "$KEYCLOAK_URL" ] && [ -n "$KEYCLOAK_REALM" ] && [ -n "$KEYCLOAK_CLIENT_ID" ]; then
    KEYCLOAK_ACTIVE=true
else
    KEYCLOAK_ACTIVE=false
fi

# Automatically set BASIC_AUTH_ACTIVE if BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD are set
if [ -n "$BASIC_AUTH_USERNAME" ] && [ -n "$BASIC_AUTH_PASSWORD" ]; then
    BASIC_AUTH_ACTIVE=true
else
    BASIC_AUTH_ACTIVE=false
fi

# Automatically set PRECONFIGURED_AUTH if PRECONFIGURED_AUTH_USERNAME and PRECONFIGURED_AUTH_PASSWORD are set
if [ -n "$PRECONFIGURED_AUTH_USERNAME" ] && [ -n "$PRECONFIGURED_AUTH_PASSWORD" ]; then
    PRECONFIGURED_AUTH=true
else
    PRECONFIGURED_AUTH=false
fi

# Informational message
echo "========================================="
echo "Starting NGINX with base path: $BASE_PATH"
echo "========================================="
echo

echo "nginx configuration:"
echo "----------------------------------------------------------------"
cat /etc/nginx/nginx.conf
echo
echo "----------------------------------------------------------------"
echo

echo "Environment variables:"
echo "-------------------------------------------------------------------------------------------------------------------------"
printf "%-38s %s\n" "Logo light path:" "$LOGO_LIGHT_PATH"
printf "%-38s %s\n" "Logo dark path:" "$LOGO_DARK_PATH"
printf "%-38s %s\n" "AAS Discovery path:" "$AAS_DISCOVERY_PATH"
printf "%-38s %s\n" "AAS Registry path:" "$AAS_REGISTRY_PATH"
printf "%-38s %s\n" "Submodel Registry path:" "$SUBMODEL_REGISTRY_PATH"
printf "%-38s %s\n" "AAS Repository path:" "$AAS_REPO_PATH"
printf "%-38s %s\n" "Submodel Repository path:" "$SUBMODEL_REPO_PATH"
printf "%-38s %s\n" "Concept Description Repository path:" "$CD_REPO_PATH"
printf "%-38s %s\n" "Primary light color:" "$PRIMARY_LIGHT_COLOR"
printf "%-38s %s\n" "Primary dark color:" "$PRIMARY_DARK_COLOR"
printf "%-38s %s\n" "Keycloak active:" "$KEYCLOAK_ACTIVE"
printf "%-38s %s\n" "Keycloak URL:" "$KEYCLOAK_URL"
printf "%-38s %s\n" "Keycloak realm:" "$KEYCLOAK_REALM"
printf "%-38s %s\n" "Keycloak client ID:" "$KEYCLOAK_CLIENT_ID"
printf "%-38s %s\n" "Preconfigured auth:" "$PRECONFIGURED_AUTH"
printf "%-38s %s\n" "Preconfigured auth username:" "$PRECONFIGURED_AUTH_USERNAME"
printf "%-38s %s\n" "Preconfigured auth password:" "$PRECONFIGURED_AUTH_PASSWORD"
printf "%-38s %s\n" "InfluxDB token:" "$INFLUXDB_TOKEN"
printf "%-38s %s\n" "Endpoint config available:" "$ENDPOINT_CONFIG_AVAILABLE"
printf "%-38s %s\n" "Single AAS:" "$SINGLE_AAS"
printf "%-38s %s\n" "Single AAS redirect:" "$SINGLE_AAS_REDIRECT"
printf "%-38s %s\n" "SM Viewer/Editor:" "$SM_VIEWER_EDITOR"
printf "%-38s %s\n" "Allow editing:" "$ALLOW_EDITING"
printf "%-38s %s\n" "Allow uploading:" "$ALLOW_UPLOADING"
printf "%-38s %s\n" "Allow logout:" "$ALLOW_LOGOUT"
printf "%-38s %s\n" "Basic Auth active:" "$BASIC_AUTH_ACTIVE"
printf "%-38s %s\n" "Basic Auth username:" "$BASIC_AUTH_USERNAME"
printf "%-38s %s\n" "Basic Auth password:" "$BASIC_AUTH_PASSWORD"
printf "%-38s %s\n" "Editor ID prefix:" "$EDITOR_ID_PREFIX"
echo "-------------------------------------------------------------------------------------------------------------------------"

# Replace the placeholders in all relevant files (.js, .html, .css)
find /usr/src/app/dist -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) -exec sed -i \
    -e "s|/__BASE_PATH_PLACEHOLDER__/|$BASE_PATH_WITH_SLASH|g" \
    -e "s|/__LOGO_LIGHT_PATH_PLACEHOLDER__/|$LOGO_LIGHT_PATH|g" \
    -e "s|/__LOGO_DARK_PATH_PLACEHOLDER__/|$LOGO_DARK_PATH|g" \
    -e "s|/__AAS_DISCOVERY_PATH_PLACEHOLDER__/|$AAS_DISCOVERY_PATH|g" \
    -e "s|/__AAS_REGISTRY_PATH_PLACEHOLDER__/|$AAS_REGISTRY_PATH|g" \
    -e "s|/__SUBMODEL_REGISTRY_PATH_PLACEHOLDER__/|$SUBMODEL_REGISTRY_PATH|g" \
    -e "s|/__AAS_REPO_PATH_PLACEHOLDER__/|$AAS_REPO_PATH|g" \
    -e "s|/__SUBMODEL_REPO_PATH_PLACEHOLDER__/|$SUBMODEL_REPO_PATH|g" \
    -e "s|/__CD_REPO_PATH_PLACEHOLDER__/|$CD_REPO_PATH|g" \
    -e "s|/__PRIMARY_LIGHT_COLOR_PLACEHOLDER__/|$PRIMARY_LIGHT_COLOR|g" \
    -e "s|/__PRIMARY_DARK_COLOR_PLACEHOLDER__/|$PRIMARY_DARK_COLOR|g" \
    -e "s|/__INFLUXDB_TOKEN_PLACEHOLDER__/|$INFLUXDB_TOKEN|g" \
    -e "s|/__KEYCLOAK_ACTIVE_PLACEHOLDER__/|$KEYCLOAK_ACTIVE|g" \
    -e "s|/__KEYCLOAK_URL_PLACEHOLDER__/|$KEYCLOAK_URL|g" \
    -e "s|/__KEYCLOAK_REALM_PLACEHOLDER__/|$KEYCLOAK_REALM|g" \
    -e "s|/__KEYCLOAK_CLIENT_ID_PLACEHOLDER__/|$KEYCLOAK_CLIENT_ID|g" \
    -e "s|/__PRECONFIGURED_AUTH_PLACEHOLDER__/|$PRECONFIGURED_AUTH|g" \
    -e "s|/__PRECONFIGURED_AUTH_USERNAME_PLACEHOLDER__/|$PRECONFIGURED_AUTH_USERNAME|g" \
    -e "s|/__PRECONFIGURED_AUTH_PASSWORD_PLACEHOLDER__/|$PRECONFIGURED_AUTH_PASSWORD|g" \
    -e "s|/__ENDPOINT_CONFIG_AVAILABLE_PLACEHOLDER__/|$ENDPOINT_CONFIG_AVAILABLE|g" \
    -e "s|/__SINGLE_AAS_PLACEHOLDER__/|$SINGLE_AAS|g" \
    -e "s|/__SINGLE_AAS_REDIRECT_PLACEHOLDER__/|$SINGLE_AAS_REDIRECT|g" \
    -e "s|/__SM_VIEWER_EDITOR_PLACEHOLDER__/|$SM_VIEWER_EDITOR|g" \
    -e "s|/__ALLOW_EDITING_PLACEHOLDER__/|$ALLOW_EDITING|g" \
    -e "s|/__ALLOW_UPLOADING_PLACEHOLDER__/|$ALLOW_UPLOADING|g" \
    -e "s|/__ALLOW_LOGOUT_PLACEHOLDER__/|$ALLOW_LOGOUT|g" \
    -e "s|/__BASIC_AUTH_ACTIVE_PLACEHOLDER__/|$BASIC_AUTH_ACTIVE|g" \
    -e "s|/__BASIC_AUTH_USERNAME_PLACEHOLDER__/|$BASIC_AUTH_USERNAME|g" \
    -e "s|/__BASIC_AUTH_PASSWORD_PLACEHOLDER__/|$BASIC_AUTH_PASSWORD|g" \
    -e "s|/__EDITOR_ID_PREFIX_PLACEHOLDER__/|$EDITOR_ID_PREFIX|g" \
    {} \;

# Start Nginx
exec nginx -g 'daemon off;'