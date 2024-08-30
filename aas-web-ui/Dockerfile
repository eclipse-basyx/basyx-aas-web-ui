# Build Stage
FROM node:lts-alpine as build-stage
# Set working directory
WORKDIR /app
# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./
# Install dependencies
RUN yarn install
# Copy project files
COPY . .
# Build the application
RUN yarn build

# Production Stage
FROM nginx:alpine as production-stage
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
RUN chown -R myuser:mygroup /usr/src/app /var/cache/nginx /tmp /etc/nginx
# Give the myuser/mygroup/other read/write/execute permissions to the /usr/src/app, /var/cache/nginx and /tmp directories
RUN chmod -R 777 /usr/src/app /var/cache/nginx /tmp /etc/nginx
# Switch to the non-root user
USER myuser
# Set the entrypoint
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
