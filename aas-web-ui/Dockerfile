# Build Stage
FROM --platform=$BUILDPLATFORM node:lts-slim AS build-stage
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NODE_OPTIONS=--max-old-space-size=8192
ARG VITE_APP_VERSION
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV VITE_APP_VERSION=$VITE_APP_VERSION
# Set working directory
WORKDIR /app
# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./
# Install dependencies
RUN --mount=type=cache,target=/root/.cache/yarn \
    yarn install --frozen-lockfile --non-interactive --network-timeout 600000
# Copy project files
COPY . .
# Build the application
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn build

# Production Stage
FROM nginx:mainline-alpine-slim AS production-stage
ARG HTTP_PROXY
ARG HTTPS_PROXY
# Set working directory
WORKDIR /usr/src/app
# Install jq
RUN apk add --no-cache jq
# Install gettext for envsubst
RUN apk add --no-cache gettext
# Create a non-root user and group
RUN addgroup -g 1000 -S mygroup && \
    adduser -u 1000 -D -S -G mygroup myuser
# Copy the dist folder from the build stage to the production stage
COPY --from=build-stage /app/dist /usr/src/app/dist
# Replace the default Nginx configuration file with a custom one
COPY nginx.conf /etc/nginx/nginx.conf.template
# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh
# Change the ownership of the /usr/src/app, /var/cache/nginx and /tmp directories to the non-root user
RUN chown -R myuser:mygroup /usr/src/app /var/cache/nginx /tmp /etc/nginx /usr/share/nginx/html
# Give the myuser/mygroup/other read/write/execute permissions to the /usr/src/app, /var/cache/nginx and /tmp directories
RUN chmod -R 777 /usr/src/app /var/cache/nginx /tmp /etc/nginx
# Switch to the non-root user
USER myuser
# Set the entrypoint
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
