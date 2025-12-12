PRJ_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
FRESH_INSTALL='0'
Yellow='\033[1;33m'
ColorOff='\033[0m'
# Specify proxy if needed
# export HTTP_PROXY="http://proxyserver:port"
# export HTTPS_PROXY="http://proxyserver:port"

echo -e "${Yellow}Do a clean install?  (y/n) Default:n ${ColorOff}"
read clean_install
if [ "$clean_install" = "y" ]; then
    FRESH_INSTALL='1'
fi

echo -e "${Yellow}Build Docker images instead of starting dev-Server?  (y/n) Default:n ${ColorOff}"
read build_images
cd $PRJ_ROOT/aas-web-ui
if [ "$FRESH_INSTALL" = "1" ]; then
    rm -rf node_modules
    yarn install
fi

# Start Dev Server
if [ "$build_images" = "y" ]; then
    # Get the current date in the format YYMMDD
    DATE=$(date +%y%m%d)

    # Create a new builder instance
    docker buildx create --use --name basyx-builder

    # Build and push the Docker images
    docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t eclipsebasyx/aas-gui:v2-$DATE . --push
else
    yarn dev --host
fi

cd $PRJ_ROOT