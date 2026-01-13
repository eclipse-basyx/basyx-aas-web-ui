# Infrastructure Configuration

This document describes how to configure infrastructure connections for the BaSyx AAS Web UI, including authentication and component endpoints.

## Overview

The BaSyx AAS Web UI supports two methods for configuring infrastructure connections:

1. **YAML Configuration File** (Recommended for production): Define multiple infrastructures in a YAML file that can be mounted to Docker containers or placed in the development environment.
2. **Environment Variables** (Legacy): Configure a single infrastructure using environment variables.

The YAML configuration method is preferred as it allows system administrators to preconfigure multiple infrastructures with different authentication methods, making it easier to manage complex deployments.

## YAML Configuration

### File Locations

- **Development Mode**: Place the file at `/aas-web-ui/public/config/basyx-infra.yml`
- **Production Mode (Docker)**: Mount the file to `/basyx-infra.yml` in the container

The configuration file is copied to the application's config directory at container startup and parsed by the browser using the `js-yaml` library.

### Basic Configuration Example

Below is an example of a basic infrastructure configuration without authentication:

```yaml
infrastructures:
  default: local

  local:
    name: My BaSyx Infrastructure
    components:
      aasDiscovery:
        baseUrl: "http://localhost:9084"
      aasRegistry:
        baseUrl: "http://localhost:9082"
      submodelRegistry:
        baseUrl: "http://localhost:9083"
      aasRepository:
        baseUrl: "http://localhost:9081"
      submodelRepository:
        baseUrl: "http://localhost:9081"
      conceptDescriptionRepository:
        baseUrl: "http://localhost:9081"
    security:
      type: none
```

## OAuth2 Authentication Examples

The Web UI supports two OAuth2 flows: **Authorization Code Flow** and **Client Credentials Flow**.

### Authorization Code Flow

Use this flow for user-based authentication where users log in through a browser. The Web UI will redirect users to the identity provider for authentication.

```yaml
infrastructures:
  default: production

  production:
    name: BaSyx with OAuth2 (Authorization Code)
    components:
      aasDiscovery:
        baseUrl: "https://discovery.basyx.example.com"
      aasRegistry:
        baseUrl: "https://aasreg.basyx.example.com"
      submodelRegistry:
        baseUrl: "https://smreg.basyx.example.com"
      aasRepository:
        baseUrl: "https://aasenv.basyx.example.com"
      submodelRepository:
        baseUrl: "https://aasenv.basyx.example.com"
      conceptDescriptionRepository:
        baseUrl: "https://aasenv.basyx.example.com"
    security:
      type: oauth2
      config:
        flow: auth_code
        issuer: "https://keycloak.example.com/auth/realms/BaSyx"
        clientId: "basyx-web-ui"
        scope: "openid profile email"
```

### Client Credentials Flow

Use this flow for machine-to-machine authentication where the application authenticates directly with the identity provider using a client ID and secret.

> **⚠️ CRITICAL SECURITY WARNING**: **Client Credentials Flow is inherently insecure for browser-based applications!** 
> 
> The client secret must be included in the YAML configuration, which means:
> - The secret is sent to the browser and visible in browser developer tools
> - The secret is exposed in network requests and can be intercepted
> - Any user with access to the application can extract the secret
> - The secret cannot be truly protected in a client-side application
>
> **This flow should ONLY be used for:**
> - Internal development/testing environments
> - Trusted network environments with no external access
> - Demo/showcase scenarios with non-production credentials
>
> **For production use, always prefer Authorization Code Flow** which provides proper user-based authentication.

```yaml
infrastructures:
  default: service

  service:
    name: BaSyx with OAuth2 (Client Credentials)
    components:
      aasDiscovery:
        baseUrl: "https://discovery.basyx.service.com"
      aasRegistry:
        baseUrl: "https://aasreg.basyx.service.com"
      submodelRegistry:
        baseUrl: "https://smreg.basyx.service.com"
      aasRepository:
        baseUrl: "https://aasenv.basyx.service.com"
      submodelRepository:
        baseUrl: "https://aasenv.basyx.service.com"
      conceptDescriptionRepository:
        baseUrl: "https://aasenv.basyx.service.com"
    security:
      type: oauth2
      config:
        flow: client_credentials
        issuer: "https://keycloak.service.com/auth/realms/BaSyx"
        clientId: "basyx-service-client"
        clientSecret: "your-client-secret-here"
        scope: ""
```

## Other Authentication Methods

### Basic Authentication

```yaml
infrastructures:
  default: staging

  staging:
    name: BaSyx with Basic Auth
    components:
      aasDiscovery:
        baseUrl: "https://discovery.staging.basyx.com"
      aasRegistry:
        baseUrl: "https://aasreg.staging.basyx.com"
      submodelRegistry:
        baseUrl: "https://smreg.staging.basyx.com"
      aasRepository:
        baseUrl: "https://aasenv.staging.basyx.com"
      submodelRepository:
        baseUrl: "https://aasenv.staging.basyx.com"
      conceptDescriptionRepository:
        baseUrl: "https://aasenv.staging.basyx.com"
    security:
      type: basic
      config:
        username: "admin"
        password: "admin123"
```

### Bearer Token Authentication

```yaml
infrastructures:
  default: test

  test:
    name: BaSyx with Bearer Token
    components:
      aasDiscovery:
        baseUrl: "https://discovery.test.basyx.com"
      aasRegistry:
        baseUrl: "https://aasreg.test.basyx.com"
      submodelRegistry:
        baseUrl: "https://smreg.test.basyx.com"
      aasRepository:
        baseUrl: "https://aasenv.test.basyx.com"
      submodelRepository:
        baseUrl: "https://aasenv.test.basyx.com"
      conceptDescriptionRepository:
        baseUrl: "https://aasenv.test.basyx.com"
    security:
      type: bearer
      config:
        token: "your-bearer-token-here"
```

## Multiple Infrastructure Configuration

You can define multiple infrastructures and set a default:

```yaml
infrastructures:
  default: production

  production:
    name: Production Environment
    components:
      # ... production components
    security:
      type: oauth2
      config:
        flow: auth_code
        # ... oauth2 config

  development:
    name: Development Environment
    components:
      # ... development components
    security:
      type: none
```

## Docker Deployment

### Mounting the Configuration File

To use YAML-based infrastructure configuration in Docker, mount your configuration file to `/basyx-infra.yml`:

```yaml
services:
  aas-web-ui:
    image: eclipsebasyx/aas-gui:latest
    ports:
      - '3000:3000'
    volumes:
      # Mount infrastructure configuration file
      - ./basyx-infra.yml:/basyx-infra.yml:ro
    environment:
      # Allow users to edit/add custom infrastructures in the UI
      ENDPOINT_CONFIG_AVAILABLE: "true"
```

### Configuration Precedence

**Important**: Environment variables always take precedence over YAML configurations to maintain backwards compatibility with existing deployments.

#### Precedence Order (Highest to Lowest)

1. **Environment Variables**: If any infrastructure-related environment variables are set (e.g., `AAS_REGISTRY_PATH`, `KEYCLOAK_URL`), the application uses the traditional environment variable configuration and ignores the YAML file.
2. **YAML Configuration**: Only used if no environment variables are configured.
3. **User Edits (localStorage)**: User modifications in the UI are preserved and merged with the active configuration source.

#### Configuration Modes

The `ENDPOINT_CONFIG_AVAILABLE` environment variable controls whether users can modify infrastructures:

- **`ENDPOINT_CONFIG_AVAILABLE=false`** (Locked Mode):
  - Active configuration source (env vars or YAML) takes full precedence
  - Users cannot add or edit infrastructures in the UI
  - All infrastructure definitions come from the configuration source
  - Recommended for production environments with strict security requirements

- **`ENDPOINT_CONFIG_AVAILABLE=true`** (Editable Mode - Default):
  - Configurations from active source are loaded as templates
  - Users can edit defined infrastructures (changes stored in browser localStorage)
  - Users can create additional custom infrastructures
  - User modifications are merged with the configuration source
  - Recommended for development and flexible production environments

### Complete Docker Compose Example

For a complete working example with multiple infrastructures, see the [MultiInfrastructure example](../examples/MultiInfrastructure/).

## Design Notes

- **Configuration Precedence**: Environment variables take precedence over YAML for backwards compatibility. YAML is only used when no environment variables are configured.
- Infrastructure keys (e.g., `local`, `production`) become stable IDs with the format `yaml_<key>`
- The `name` field is optional. If not defined, the infrastructure name defaults to the key
- The `default` field specifies which infrastructure to select by default on first load
- Error handling for invalid configurations is implemented in the application
- YAML parsing is done client-side using `js-yaml` library in the browser (works in both dev and production)
- The YAML file is served as-is without server-side conversion, eliminating the need for system dependencies like `yq`

## Security Configuration Reference

### Authentication Types

The `security.type` field specifies the authentication method. Supported values:

- **`none`**: No authentication is used.
- **`oauth2`**: OAuth2 authentication (supports authorization code and client credentials flows).
- **`basic`**: HTTP Basic authentication.
- **`bearer`**: Bearer token authentication.

### OAuth2 Configuration Fields

#### Common Fields (Both Flows)

- **`flow`** (required): The OAuth2 flow to use. Values: `auth_code` or `client_credentials`.
- **`issuer`** (required): The URL to the OAuth2 authorization server.
- **`clientId`** (required): The client ID for OAuth2 authentication.
- **`scope`** (optional): Space-separated list of OAuth2 scopes to request. Default: `""`.

#### Client Credentials Flow Specific

- **`clientSecret`** (required): The client secret for authentication.

### Basic Authentication Fields

- **`username`** (required): The username for basic authentication.
- **`password`** (required): The password for basic authentication.

### Bearer Token Fields

- **`token`** (required): The bearer token to be used for authentication.

## Implementation Details

### File Structure

```
aas-web-ui/
  public/
    config/
      basyx-infra.yml              # Sample configuration for development
  src/
    composables/
      Infrastructure/
        useInfrastructureConfigLoader.ts  # Loads and parses YAML using js-yaml
        useInfrastructureYamlParser.ts    # Validates and converts YAML to internal format
        useInfrastructureStorage.ts       # Merges YAML with localStorage
    types/
      Infrastructure.ts                   # TypeScript types for YAML config
  package.json                            # Includes js-yaml dependency
  Dockerfile                             # No YAML processing dependencies needed
  entrypoint.sh                          # Copies YAML file to dist/config
```

### Key Design Decisions

1. **Infrastructure IDs**: 
   - YAML-based: `yaml_<yamlKey>` (stable across reloads)
   - User-created: `infra_<timestamp>` (unique per creation)

2. **YAML to Internal Format Mapping**:
   - YAML uses `baseUrl` → Internal uses `url`
   - YAML uses `snake_case` for some fields → Internal uses `camelCase`
   - Component keys map: `aasDiscovery` → `AASDiscovery`, etc.
   - Security types map: `none` → `No Authentication`, `oauth2` → `OAuth2`, etc.

3. **Loading Order**:
   - Check if environment variables are configured first (backwards compatibility)
   - If env vars exist, use traditional configuration
   - If no env vars, load YAML config from `/config/basyx-infra.yml`
   - Merge active configuration with localStorage based on `ENDPOINT_CONFIG_AVAILABLE`

4. **Merge Strategy**:
   - Environment variables checked first, take precedence over YAML
   - `ENDPOINT_CONFIG_AVAILABLE=false`: Active config source takes full precedence, no user edits allowed
   - `ENDPOINT_CONFIG_AVAILABLE=true`: 
     - Configurations merged with localStorage edits (user changes preserved)
     - User-created infrastructures added alongside defined ones
     - Selected infrastructure persists in localStorage

5. **OAuth2 Client Credentials**:
   - Automatic authentication on app load for `client_credentials` flow
   - Token stored in memory and localStorage
   - Token refresh handled automatically

### Processing Pipeline

1. **Container Startup** (entrypoint.sh):
   ```bash
   if [ -f /basyx-infra.yml ]; then
     mkdir -p /usr/src/app/dist/config
     cp /basyx-infra.yml /usr/src/app/dist/config/basyx-infra.yml
     echo "YAML configuration copied to application"
   fi
   ```

2. **Application Startup** (useInfrastructureConfigLoader):
   - Determine base path (dev: `import.meta.env.BASE_URL`, prod: `envStore.getEnvBasePath`)
   - Fetch YAML file from `/config/basyx-infra.yml`
   - Parse YAML using `js-yaml.load()`
   - Validate structure with `validateYamlConfig()`
   - Return null if file doesn't exist (404)

3. **YAML Parsing** (useInfrastructureYamlParser):
   - Convert YAML structure to internal format
   - Map security types: `none` → `No Authentication`, `oauth2` → `OAuth2`, etc.
   - Map OAuth2 flows: `auth_code` → `auth-code`, `client_credentials` → `client-credentials`
   - Map component keys: `aasDiscovery` → `AASDiscovery`, `baseUrl` → `url`
   - Generate infrastructure IDs: `yaml_<yamlKey>`

4. **Configuration Merging** (useInfrastructureStorage):
   - Check if environment variables are configured (backwards compatibility)
   - If env vars exist, use traditional configuration (env vars take precedence)
   - If no env vars, load and use YAML configuration
   - Merge active configuration with localStorage based on `ENDPOINT_CONFIG_AVAILABLE`
   - Authenticate client credentials flows automatically

5. **Storage Management**:
   - YAML infrastructures: ID format `yaml_<key>`
   - User infrastructures: ID format `infra_<timestamp>`
   - All stored in localStorage under `basyxInfrastructures` key
   - User modifications to YAML infrastructures override YAML definitions
