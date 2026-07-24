# Combined Feature Showcase

This example runs the BaSyx AAS Web UI against two independent BaSyx Go AAS Environments. It is intended for local feature exploration and for exercising the OAuth return-to-selection flow without a reverse proxy or external identity provider.

## Topology

- **Infrastructure 1 — Secured BaSyx**: a BaSyx Go AAS Environment in `mono-all` mode, protected by Keycloak and ABAC.
- **Infrastructure 2 — Local BaSyx**: an independent, unsecured BaSyx Go AAS Environment in `mono-all` mode.
- Each environment has its own PostgreSQL 18.4 database and one-shot BaSyx configuration service, so their persisted data and schema setup are isolated.
- Keycloak 26.7 is exposed directly at `http://keycloak.localhost:8080`; no reverse proxy or `*.basyx.localhost` host entries are required.
- InfluxDB, Telegraf, MQTT, and Node-RED remain available for the time-series and live-sensor portions of the showcase.
- Infrastructure 1 preloads the IESE Drive Motor package alongside protected showcase packages. Anonymous visitors see only the Motor shell plus its Nameplate and Technical Data submodels.
- Infrastructure 2 preloads five Go-compatible showcase packages, including the IESE Drive Motor package from the BaSyx Go minimal example in place of the incompatible PFC200 package.

The UI service uses the published `eclipsebasyx/aas-gui:SNAPSHOT` image.

## Prerequisites

- Docker Engine and Docker Compose
- Available ports: `3000`, `8080`, `8081`, `8086`, `9081`, `1880`, `1883`, and `1884`

Modern browsers resolve `keycloak.localhost` to the local machine automatically. If yours does not, add this one hosts-file entry:

```text
127.0.0.1 keycloak.localhost
```

## Start

From this directory:

```bash
docker compose up -d
```

Open the UI at [http://localhost:3000](http://localhost:3000).

Supporting endpoints:

- Keycloak: [http://keycloak.localhost:8080](http://keycloak.localhost:8080)
- InfluxDB: [http://localhost:8086](http://localhost:8086)
- Node-RED: [http://localhost:1880](http://localhost:1880)

Keycloak administrator credentials are `admin` / `admin`. The secured UI test account is `admin` / `pwd` and has full access to Infrastructure 1.
The checked-in realm defines only this test account, the UI client, and its role and audience mappers; Keycloak supplies its built-in clients and authentication flows.
For portability, the showcase client accepts any login redirect URI, web origin, and post-logout redirect URI. Restrict these wildcards when adapting the setup for a non-demo deployment.

## Verify anonymous filtered access

1. Open **Secured BaSyx** without logging in, or log out after selecting it.
2. The AAS list must contain only **IESEDriveMotorDM3000** even though Infra 1 preloads further AASX packages.
3. Open the Motor AAS. Only **Nameplate** and **TechnicalData** must be visible and readable.
4. Log in as `admin` / `pwd` to see all preloaded AASs and all submodels.

The policy grants anonymous `READ` access to both the descriptors and the actual AAS/Submodel identifiables. The Motor AAS is selected by its AAS ID; the two public submodels are selected by semantic ID and constrained to their matching Motor IDs. All Concept Descriptions are also readable anonymously, which lets the UI resolve standard semantic IDs without prompting for login. The UI omits references that resolve to an intentional privacy-preserving `404` instead of rendering them as failed tree entries. Filtering `$aas#submodels[]` directly is currently disabled because it triggers a BaSyx Go SQL error; see [BaSyx Go issue #496](https://github.com/eclipse-basyx/basyx-go-components/issues/496).

The compose setup uses `ABAC_POLICY_FILE_IMPORT=always`, so restarting Infra 1 reapplies the checked-in policy. This is intentional for a reproducible example; do not use this setting where policies are managed at runtime.

## Verify the OAuth deep-link fix

1. Select **Secured BaSyx** in Infrastructure Management and sign in as `admin` / `pwd`.
2. Open any AAS, then copy its `/aasviewer?aas=...` URL.
3. Log out, or open that URL in a fresh browser profile.
4. Complete the Keycloak login again.

After login, the browser must return to the same AAS viewer location, including its `aas` query parameter. Logout restores the same location when the selected AAS remains anonymously readable; otherwise, the unavailable AAS and Submodel selection is cleared. The Keycloak redirect URI remains the canonical `http://localhost:3000/`; the UI restores and revalidates the exact in-app route from its per-tab transaction state.

## Feature tour

- Infrastructure switching and OAuth2 authentication
- File handling, IFC rendering, PCF, and Digital Product Passport submodels
- Time-series charts backed by InfluxDB
- Live sensor updates backed by MQTT and Node-RED
- Bill of Materials editing

## Stop or reset

```bash
docker compose down
```

To remove the containers and any named volumes:

```bash
docker compose down -v
```

If the AAS Environment cannot reach Keycloak, check the `keycloak` and `secured-aas-env` logs. Its OIDC trust list and ABAC model are in `Infrastructure1/security_env/`.
