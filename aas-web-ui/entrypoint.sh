#!/bin/sh

# Check if BASE_PATH is set, otherwise use default '/'
: "${BASE_PATH:=/}"

# Define other environment variables, with defaults if not provided
: "${LOGO_LIGHT_PATH:='Logo_light.svg'}"
: "${LOGO_DARK_PATH:='Logo_dark.svg'}"
: "${AAS_DISCOVERY_PATH:=''}"
: "${AAS_REGISTRY_PATH:=''}"
: "${SUBMODEL_REGISTRY_PATH:=''}"
: "${AAS_REPO_PATH:=''}"
: "${SUBMODEL_REPO_PATH:=''}"
: "${CD_REPO_PATH:=''}"
: "${DASHBOARD_SERVICE_PATH:=''}"
: "${PRIMARY_LIGHT_COLOR:='#0cb2f0'}"
: "${PRIMARY_DARK_COLOR:='#f69222'}"
: "${KEYCLOAK_ACTIVE:='false'}"
: "${INFLUXDB_TOKEN:=''}"
: "${KEYCLOAK_URL:=''}"
: "${KEYCLOAK_REALM:=''}"
: "${KEYCLOAK_CLIENT_ID:=''}"
: "${ENDPOINT_CONFIG_AVAILABLE:='true'}"
: "${SINGLE_AAS:='false'}"
: "${SINGLE_AAS_REDIRECT:=''}"

# Replace ${BASE_PATH} in the NGINX config template (without trailing slash)
envsubst '${BASE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Add a trailing slash to BASE_PATH for the replacement in files
BASE_PATH_WITH_SLASH=$(echo "$BASE_PATH" | sed 's|/*$|/|')

# Informational message
echo "========================================="
echo "Starting NGINX with base path: $BASE_PATH"
echo "========================================="

echo "nginx configuration:"
echo "-----------------------------------------"
cat /etc/nginx/nginx.conf
echo
echo "-----------------------------------------"

echo "Environment variables:"
echo "-----------------------------------------"
echo "Logo light path: $LOGO_LIGHT_PATH"
echo "Logo dark path: $LOGO_DARK_PATH"
echo "AAS Discovery path: $AAS_DISCOVERY_PATH"
echo "AAS Registry path: $AAS_REGISTRY_PATH"
echo "Submodel Registry path: $SUBMODEL_REGISTRY_PATH"
echo "AAS Repository path: $AAS_REPO_PATH"
echo "Submodel Repository path: $SUBMODEL_REPO_PATH"
echo "Concept Description Repository path: $CD_REPO_PATH"
echo "Dashboard Service path: $DASHBOARD_SERVICE_PATH"
echo "Primary light color: $PRIMARY_LIGHT_COLOR"
echo "Primary dark color: $PRIMARY_DARK_COLOR"
echo "Keycloak active: $KEYCLOAK_ACTIVE"
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Keycloak realm: $KEYCLOAK_REALM"
echo "Keycloak client ID: $KEYCLOAK_CLIENT_ID"
echo "InfluxDB token: $INFLUXDB_TOKEN"
echo "Endpoint config available: $ENDPOINT_CONFIG_AVAILABLE"
echo "Single AAS: $SINGLE_AAS"
echo "Single AAS redirect: $SINGLE_AAS_REDIRECT"

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
    -e "s|/__DASHBOARD_SERVICE_PATH_PLACEHOLDER__/|$DASHBOARD_SERVICE_PATH|g" \
    -e "s|/__PRIMARY_LIGHT_COLOR_PLACEHOLDER__/|$PRIMARY_LIGHT_COLOR|g" \
    -e "s|/__PRIMARY_DARK_COLOR_PLACEHOLDER__/|$PRIMARY_DARK_COLOR|g" \
    -e "s|/__INFLUXDB_TOKEN_PLACEHOLDER__/|$INFLUXDB_TOKEN|g" \
    -e "s|/__KEYCLOAK_ACTIVE_PLACEHOLDER__/|$KEYCLOAK_ACTIVE|g" \
    -e "s|/__KEYCLOAK_URL_PLACEHOLDER__/|$KEYCLOAK_URL|g" \
    -e "s|/__KEYCLOAK_REALM_PLACEHOLDER__/|$KEYCLOAK_REALM|g" \
    -e "s|/__KEYCLOAK_CLIENT_ID_PLACEHOLDER__/|$KEYCLOAK_CLIENT_ID|g" \
    -e "s|/__ENDPOINT_CONFIG_AVAILABLE_PLACEHOLDER__/|$ENDPOINT_CONFIG_AVAILABLE|g" \
    -e "s|/__SINGLE_AAS_PLACEHOLDER__/|$SINGLE_AAS|g" \
    -e "s|/__SINGLE_AAS_REDIRECT_PLACEHOLDER__/|$SINGLE_AAS_REDIRECT|g" \
    {} \;

# Start Nginx
exec nginx -g 'daemon off;'