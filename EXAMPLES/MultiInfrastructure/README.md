# Multi-Infrastructure Example

This example demonstrates how to configure and run the BaSyx AAS Web UI with multiple BaSyx infrastructures using YAML-based configuration.

## Overview

This setup showcases:

- **Infrastructure 1 (Secured BaSyx)**: A fully secured environment with Keycloak OAuth2 authentication
- **Infrastructure 2 (Local BaSyx)**: A local development environment without authentication

Both infrastructures are preconfigured via the `basyx-infra.yml` file, allowing users to easily switch between them in the Web UI.

## Architecture

The example includes:

- **Infrastructure 1**: Complete BaSyx environment with AAS Environment, Registries, Discovery, and Keycloak
- **Infrastructure 2**: Simple local BaSyx setup (endpoints point to localhost services)
- **MongoDB**: Shared database for both infrastructures
- **AAS Web UI**: Single UI instance that can connect to both infrastructures

## Prerequisites

- Docker and Docker Compose installed
- Available ports: 3000, 27017, and various ports for BaSyx components
- Host entries configured for `*.basyx.localhost` domains

## Quick Start

1. Start all services:

  ```bash
  docker-compose up -d
  ```

1. Access the Web UI at http://localhost:3000

2. The UI will load with both infrastructures preconfigured:
   - **Secured BaSyx** (default)
   - **Local BaSyx**

3. Switch between infrastructures using the infrastructure selector in the settings menu

## Configuration

### Infrastructure Configuration File

The `basyx-infra.yml` file defines both infrastructures:

```yaml
infrastructures:
  default: infra1  # Secured BaSyx is selected by default

  infra1:
    name: Secured BaSyx
    components:
      # Component URLs for Infrastructure 1
      ...
    security:
      type: oauth2
      config:
        flow: auth_code
        issuer: "http://keycloak.basyx.localhost/realms/BaSyx"
        clientId: "basyx-web-ui"

  infra2:
    name: Local BaSyx
    components:
      # Component URLs for Infrastructure 2
      ...
    security:
      type: none
```

### Docker Compose Configuration

The `docker-compose.yml` mounts the configuration file into the container:

```yaml
volumes:
  - ./basyx-infra.yml:/basyx-infra.yml:ro
environment:
  ENDPOINT_CONFIG_AVAILABLE: "true"  # Allow users to edit infrastructures
```

## Usage

### Switching Between Infrastructures

1. Open the Web UI at http://localhost:3000
2. Click the settings icon (gear) in the navigation bar
3. Select "Infrastructure Management"
4. Choose the desired infrastructure from the list

### Authentication for Infrastructure 1

Infrastructure 1 uses Keycloak OAuth2 authentication:

- When accessing secured endpoints, you'll be redirected to Keycloak for login
- Use the credentials configured in Infrastructure 1's Keycloak setup
- After successful authentication, you'll be redirected back to the Web UI

### Adding Custom Infrastructures

Since `ENDPOINT_CONFIG_AVAILABLE=true`, users can:

- Edit the preconfigured infrastructures
- Add new custom infrastructures via the UI
- Delete infrastructures (custom ones only if configured)

User-added infrastructures are stored in browser localStorage and persist across sessions.

## Stopping the Services

Stop all services:

  ```bash
  docker-compose down
  ```

To also remove volumes:

  ```bash
  docker-compose down -v
  ```

## Customization

### Adding More Infrastructures

Edit `basyx-infra.yml` to add more environments:

```yaml
infrastructures:
  default: infra1
  
  infra1:
    # ... existing config
  
  infra2:
    # ... existing config
  
  infra3:
    name: Staging Environment
    components:
      # ... staging component URLs
    security:
      type: basic
      config:
        username: "admin"
        password: "admin123"
```

Then restart the services:

  ```bash
  docker-compose restart aas-web-ui
  ```

### Locking Infrastructures

To prevent users from editing the preconfigured infrastructures, set:

```yaml
environment:
  ENDPOINT_CONFIG_AVAILABLE: "false"
```

This makes the infrastructures read-only, and users cannot add custom ones.

## Troubleshooting

### Infrastructures Not Loading

Check the Web UI container logs:

  ```bash
  docker logs aas-web-ui
  ```

Look for messages about YAML processing and infrastructure configuration.

### Authentication Issues

For Infrastructure 1 (Keycloak):

1. Verify Keycloak is running: `docker ps | grep keycloak`
2. Check Keycloak logs: `docker logs <keycloak-container>`
3. Ensure the client ID "basyx-client" is configured in the BaSyx realm
4. Verify redirect URIs include the Web UI URL

### Connection Failures

If components can't be reached:

1. Verify all services are running: `docker-compose ps`
2. Check service logs for errors
3. Ensure host entries are configured for `*.basyx.localhost`
4. Test component URLs directly in a browser

## Related Documentation

- [Infrastructure Configuration Schema](../../Docs/infrastructure-config.md)
- [Main README](../../README.md)
- [BaSyx Documentation](https://wiki.basyx.org/)
