#!/bin/sh

# Check if environment variables are set and update config.json accordingly
if [ -n "$LOGO_PATH" ]; then
    jq '.logoPath = env.LOGO_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$AAS_DISCOVERY_PATH" ]; then
    jq '.aasDiscoveryPath = env.AAS_DISCOVERY_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$AAS_REGISTRY_PATH" ]; then
    jq '.aasRegistryPath = env.AAS_REGISTRY_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$SUBMODEL_REGISTRY_PATH" ]; then
    jq '.submodelRegistryPath = env.SUBMODEL_REGISTRY_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$AAS_REPO_PATH" ]; then
    jq '.aasRepoPath = env.AAS_REPO_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$SUBMODEL_REPO_PATH" ]; then
    jq '.submodelRepoPath = env.SUBMODEL_REPO_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$CD_REPO_PATH" ]; then
    jq '.cdRepoPath = env.CD_REPO_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$DASHBOARD_SERVICE_PATH" ]; then
    jq '.dashboardServicePath = env.DASHBOARD_SERVICE_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$PRIMARY_COLOR" ]; then
    jq '.primaryColor = env.PRIMARY_COLOR' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$INFLUXDB_TOKEN" ]; then
    jq '.influxdbToken = env.INFLUXDB_TOKEN' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$KEYCLOAK_URL" ]; then
    jq '.keycloakUrl = env.KEYCLOAK_URL' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$KEYCLOAK_REALM" ]; then
    jq '.keycloakRealm = env.KEYCLOAK_REALM' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$KEYCLOAK_CLIENT_ID" ]; then
    jq '.keycloakClientId = env.KEYCLOAK_CLIENT_ID' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$ENDPOINT_CONFIG_AVAILABLE" ]; then
    jq '.endpointConfigAvailable = env.ENDPOINT_CONFIG_AVAILABLE' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
fi

if [ -n "$BASE_PATH" ]; then
    echo "====================="
    echo "BASE_PATH: $BASE_PATH"
    echo "====================="

    envsubst '${BASE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
    
    echo "nginx configuration:"
    echo "-------------------------------"
    cat /etc/nginx/nginx.conf
    echo
    echo "-------------------------------"

    echo "Updating config.json and index.html with BASE_PATH..."

    jq '.basePath = env.BASE_PATH' /usr/src/app/dist/config.json > /tmp/config.json && mv /tmp/config.json /usr/src/app/dist/config.json
    sed -i "s|<base href=\"/\">|<base href=\"$BASE_PATH/\">|g" /usr/src/app/dist/index.html

    echo "Update complete."
else
    echo "BASE_PATH not set. Using default nginx configuration."

    BASE_PATH="" envsubst '${BASE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

    echo "nginx configuration:"
    echo "-------------------------------"
    cat /etc/nginx/nginx.conf
    echo
    echo "-------------------------------"

    echo "Using default config.json and index.html."
fi

# Start Nginx
exec nginx -g 'daemon off;'