# Infrastructure Configuration

This document describes how to configure infrastructure connections for the BaSyx AAS Web UI, including authentication and component endpoints.

## Basic Configuration Example

Below is an example of a basic infrastructure configuration without authentication:

```yaml
infrastructures:
  default: infra1

  infra1:
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
  default: infra1

  infra1:
    name: BaSyx with OAuth2 (Authorization Code)
    components:
      aasDiscovery:
        baseUrl: "http://discovery.basyx.localhost"
      aasRegistry:
        baseUrl: "http://aasreg.basyx.localhost"
      submodelRegistry:
        baseUrl: "http://smreg.basyx.localhost"
      aasRepository:
        baseUrl: "http://aasenv.basyx.localhost"
      submodelRepository:
        baseUrl: "http://aasenv.basyx.localhost"
      conceptDescriptionRepository:
        baseUrl: "http://aasenv.basyx.localhost"
    security:
      type: oauth2
      config:
        flow: auth_code
        issuer: "http://keycloak.basyx.localhost/auth/realms/BaSyx"
        scope: "openid profile email"
        clientId: "basyx-web-ui"
```

### Client Credentials Flow

Use this flow for machine-to-machine authentication where the application authenticates directly with the identity provider using a client ID and secret.

```yaml
infrastructures:
  default: infra1

  infra1:
    name: BaSyx with OAuth2 (Client Credentials)
    components:
      aasDiscovery:
        baseUrl: "http://discovery.basyx.localhost"
      aasRegistry:
        baseUrl: "http://aasreg.basyx.localhost"
      submodelRegistry:
        baseUrl: "http://smreg.basyx.localhost"
      aasRepository:
        baseUrl: "http://aasenv.basyx.localhost"
      submodelRepository:
        baseUrl: "http://aasenv.basyx.localhost"
      conceptDescriptionRepository:
        baseUrl: "http://aasenv.basyx.localhost"
    security:
      type: oauth2
      config:
        flow: client_credentials
        issuer: "http://keycloak.basyx.localhost/auth/realms/BaSyx"
        scope: ""
        clientId: "basyx-service-client"
        clientSecret: "your-client-secret"
```

## Other Authentication Methods

### Basic Authentication

```yaml
infrastructures:
  default: infra1

  infra1:
    name: BaSyx with Basic Auth
    components:
      # ... component configuration
    security:
      type: basic
      config:
        username: "admin"
        password: "admin123"
```

### Bearer Token Authentication

```yaml
infrastructures:
  default: infra1

  infra1:
    name: BaSyx with Bearer Token
    components:
      # ... component configuration
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

## Design Notes

- Infrastructure keys are used as identifiers (IDs will be generated internally).
- The `name` field is optional. If not defined, the infrastructure name defaults to the key.
- The `default` field specifies which infrastructure to use by default.
- Error handling for invalid configurations is implemented in the application.

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

## Implementation Plan

- Phase 1: Infrastructure & Types
  1. Add YAML configuration types to Infrastructure.ts
  2. Create YAML parser/mapper composable to convert YAML format to internal format
  3. Create sample YAML file at /aas-web-ui/public/config/basyx-infra.yml
- Phase 2: Backend Processing (Docker/Production)

  4. Update entrypoint.sh to:
     - Check if /basyx-infra.yml is mounted
     - Use jq to convert YAML to JSON (via a conversion script or inline)
     - Write to /usr/src/app/dist/config/infrastructure-config.json
- Phase 3: Frontend Loading

  5. Create infrastructure config loader composable that:
     - Fetches /config/infrastructure-config.json at app startup
     - Handles 404 gracefully (no YAML = use env vars)
     - Parses and validates the structure
     - Update useInfrastructureStorage to:
  6. Load YAML-based infrastructures if available
     - Merge with localStorage based on ENDPOINT_CONFIG_AVAILABLE flag
     - Handle stable IDs for YAML infrastructures (use YAML keys)
     - Apply precedence rules
  7. Update InfrastructureStore to:
     - Initialize with YAML config loader
     - Properly handle the merge logic

- Phase 4: Documentation & Testing
  1. Update infrastructure-config.md with YAML examples
  2. Add README section about YAML configuration
  3. Create docker-compose example showing YAML mount

## Detailed Technical Plan

File Structure

```
aas-web-ui/
  public/
    config/
      basyx-infra.yml (sample for dev mode)
      infrastructure-config.json (generated in prod)
  src/
    composables/
      Infrastructure/
        useInfrastructureConfigLoader.ts (NEW)
        useInfrastructureYamlParser.ts (NEW)
        useInfrastructureStorage.ts (MODIFY)
    types/
      Infrastructure.ts (MODIFY - add YAML types)
  entrypoint.sh (MODIFY)
```

Key Design Decisions:

1. Infrastructure IDs: `yaml_<yamlKey>` for YAML-based, `infra_<timestamp>` for user-created
2. JSON Format: Matches internal structure after mapping (PascalCase keys, url not baseUrl)
3. Loading Order: YAML config → localStorage merge → env vars fallback
4. Precedence:
   - `ENDPOINT_CONFIG_AVAILABLE=false`: YAML always wins
   - `ENDPOINT_CONFIG_AVAILABLE=true`: localStorage edits preserved for YAML infras, plus user-created ones
