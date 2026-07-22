# Claim-based feature control

This example runs the current checkout of the BaSyx AAS Web UI with Keycloak and a secured BaSyx Go AAS Environment. Keycloak is only the sample identity provider: the UI reads claims through the same provider-neutral mapping shape used by BaSyx Go.

## Start

Prerequisites are Docker Engine, Docker Compose, and free ports `3001`, `8080`, and `8081`.

From this directory, run:

```bash
docker compose up --build
```

Open [http://localhost:3001](http://localhost:3001) and select **Claim-based feature control**. Modern browsers resolve `keycloak.localhost` locally. If yours does not, add `127.0.0.1 keycloak.localhost` to the hosts file.

Use either account:

| User | Password | UI features | Backend access |
| --- | --- | --- | --- |
| `viewer` | `pwd` | Multiple AASs and Submodels; editing, uploading, and endpoint configuration hidden | Read only |
| `editor` | `pwd` | Multiple AASs and Submodels, viewer/editor switching, editing, uploading, and endpoint configuration | Full access |

Logging out removes token-derived overrides and restores the deployment defaults, which deliberately expose all controls so that authentication remains reachable without a token. The UI container is built from `../../aas-web-ui`, so the example always exercises the current branch rather than a published UI image. It reuses the small BOMAAS and Sensor AASX packages from `CombinedExample`.

## Mapping model

The UI receives this configuration:

```json
[
  {
    "target": "features",
    "mode": "list",
    "sources": ["/basyx_features"]
  }
]
```

Keycloak maps the multivalued `basyx_features` user attribute into the access token. BaSyx Go independently uses the same source in `security/trustlist.json`, producing the verified canonical claim `basyx.features` inside the backend. Identity providers must not emit `basyx.features` directly because BaSyx Go reserves the `basyx.*` namespace.

Feature values only change what the UI presents. They are not authorization. This example therefore maps the separate scalar `basyx_role` attribute to `basyx.role`; the ABAC policy grants `viewer` read access and `editor` full access.

## Microsoft Entra ID

For a stored user attribute, register a multivalued string directory extension such as `basyx_features`, populate it through Microsoft Graph or provisioning, and include it as an optional access-token claim on the BaSyx resource application. Entra emits directory extensions using a claim such as `extn.basyx_features`, so configure both consumers with:

```json
{
  "target": "features",
  "mode": "list",
  "sources": ["/extn.basyx_features"]
}
```

Alternatively, a custom claims provider can return a string array named `basyx_features`; in that case use `/basyx_features`. Access-token claims are configured on the resource application whose audience the UI requests, not only on the SPA registration.

## Stop or reset

```bash
docker compose down
```

Remove the database volume as well when a clean Keycloak import is needed:

```bash
docker compose down -v
```
