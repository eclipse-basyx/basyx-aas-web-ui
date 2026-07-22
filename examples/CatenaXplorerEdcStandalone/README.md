# CatenaXplorer EDC Standalone Deployment

This example deploys the BaSyx AAS Web UI as an internal Catena-X Explorer for an existing decentralized Catena-X dataspace setup. It is intended for companies that already operate or can access a consumer EDC and want an internal UI for browsing AAS descriptors from partner DTR assets.

The default setup does not require a separate user identity provider for the UI. It assumes the UI is used inside a trusted company network, VPN, or protected platform route. EDC authentication remains server-side and is configured through container environment variables.

## What This Deploys

- One `aas-web-ui` container.
- The UI starts directly on the CatenaXplorer page.
- The same container serves the browser application and runs an internal server-side EDC backend.
- The browser can request AAS descriptors from partner DTR assets through EDC.
- EDC Management API URL, EDC API key, EDR tokens, and provider data-plane authorization stay server-side inside the container.
- No DTR or Submodel Service endpoint is exposed directly to the browser in EDC mode.

This example does not deploy an EDC, DTR, Submodel Service, IAM, or reverse proxy. It connects to existing services.

## Required External Services

Before starting the container, collect these values from your Catena-X environment.

Consumer EDC:

- EDC Management API base URL, ending at `/management`.
- Management API key.
- Management API key header name, usually `X-Api-Key`.
- Optional own participant ID.
- Optional own DSP endpoint.

Provider/partner:

- Provider participant ID.
- Provider DSP endpoint.
- Provider DSP endpoint prefix for the backend allowlist.

Network:

- The container must be able to reach the consumer EDC Management API.
- The container must be able to reach provider data-plane endpoints returned by EDR data addresses.
- Users should reach the UI only through a trusted internal network, VPN, platform route, or reverse proxy.
- If the UI is exposed outside a trusted network, terminate HTTPS and add access control before traffic reaches the container.

## Security Model

The browser only talks to the BaSyx UI host:

```text
Browser
  -> http(s)://<your-ui-host>/api/catena-x/edc/...
  -> aas-web-ui nginx on port 3000
  -> internal EDC backend on 127.0.0.1:3001
  -> consumer EDC Management API and provider data plane
```

Important rules:

- Publish only the UI port `3000`.
- Do not publish the internal backend port `3001`.
- Do not put the EDC Management API URL or API key in `basyx-infra.yml`.
- Do not put client credentials or API keys into browser-facing configuration.
- Keep the UI reachable only by authorized internal users or protect it with your ingress/reverse proxy.

The default example sets `CX_EDC_BFF_AUTH_MODE=none`. That means the internal backend trusts requests that reach the UI container. This is appropriate only when access to the UI itself is controlled by the deployment environment.

## Files

- `docker-compose.yml`: one-container BaSyx UI deployment with the integrated EDC backend enabled.
- `basyx-infra.yml`: Catena-X infrastructure shown in the UI.
- `.env.example`: placeholder runtime values for the container.
- `.gitignore`: prevents a local `.env` file from being committed.

## Configure Runtime Values

Copy the placeholder file:

```bash
cp .env.example .env
```

Edit `.env`.

UI:

- `PUBLIC_UI_PORT`: host port mapped to container port `3000`.
- `PUBLIC_BASE_PATH`: URL base path if the UI is served below a path, otherwise `/`.

Internal backend:

- `CX_EDC_BFF_AUTH_MODE`: default `none` for internal deployments without a UI identity provider.

Consumer EDC:

- `CX_EDC_DEFAULT_MANAGEMENT_URL`: consumer EDC Management API base URL.
- `CX_EDC_DEFAULT_API_KEY`: consumer EDC Management API key.
- `CX_EDC_DEFAULT_API_KEY_HEADER`: Management API key header, usually `X-Api-Key`.
- `CX_EDC_DEFAULT_PARTICIPANT_ID`: optional own participant ID.
- `CX_EDC_DEFAULT_DSP_ENDPOINT`: optional own DSP endpoint.

Partner allowlist:

- `CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES`: comma-separated HTTPS provider DSP endpoint prefixes.
- `CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES`: keep `false` except for local test systems.

EDR polling:

- `CX_EDC_REQUEST_TIMEOUT_MS`: timeout for upstream EDC/data-plane requests.
- `CX_EDC_EDR_POLLING_ATTEMPTS`: number of EDR polling attempts.
- `CX_EDC_EDR_POLLING_INTERVAL_MS`: wait time between EDR polling attempts.

## Configure the UI Infrastructure

Edit `basyx-infra.yml`.

Keep these settings:

```yaml
template: catena-x
components: {}
catenaX:
  accessMode: edc
  edc:
    proxyId: default
security:
  type: none
```

Replace the partner placeholders:

```yaml
defaultCounterPartyId: "<COUNTERPARTY_ID>"
defaultCounterPartyAddress: "https://counterparty-edc.example.test/api/v1/dsp"
partners:
  - id: provider-a
    name: Provider A
    counterPartyId: "<COUNTERPARTY_ID>"
    counterPartyAddress: "https://counterparty-edc.example.test/api/v1/dsp"
```

The provider DSP endpoint in `basyx-infra.yml` must match one of the prefixes in `CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES`.

When `VITE_ENDPOINT_CONFIG_AVAILABLE=true`, partners can also be managed from **Settings → Manage Infrastructures**. Edit the Catena-X EDC infrastructure, then add, edit, remove, or choose the default business partner. These UI changes are stored in the current browser; server credentials and the DSP address allowlist remain deployment settings.

In CatenaXplorer, selecting a partner prepares the new context and clears results from the previous provider. Select **Load descriptors** to start the EDC request. To use an unconfigured provider, select **Use another partner…**, enter its counterparty ID and DSP address, and load it. After a successful request, the partner is remembered in that browser and can be saved to the editable infrastructure.

## Optional User Authentication

If your company does have an identity provider and wants the backend to validate browser users before EDC access, switch from `none` to `jwt`.

In `.env`:

```bash
CX_EDC_BFF_AUTH_MODE=jwt
CX_EDC_BFF_AUTH_JWKS_URL=https://identity.example.test/realms/catena-x/protocol/openid-connect/certs
CX_EDC_BFF_AUTH_ISSUER=https://identity.example.test/realms/catena-x
CX_EDC_BFF_AUTH_AUDIENCE=basyx-aas-web-ui
CX_EDC_BFF_REQUIRED_ROLES=catena-xplorer
```

In `basyx-infra.yml`:

```yaml
security:
  type: oauth2
  config:
    flow: auth_code
    issuer: "https://identity.example.test/realms/catena-x"
    clientId: "basyx-aas-web-ui"
    scope: "openid profile email"
```

Do not use OAuth client credentials in the browser. If an EDC setup later needs client credentials, configure them only server-side in the backend.

## Start

From this folder:

```bash
docker compose up -d --build
```

For local testing:

```text
http://localhost:3000
```

For production-like deployment, expose the same container through your internal platform route, ingress, load balancer, or reverse proxy.

## Verify

Check that the container is healthy:

```bash
docker compose ps
```

Check logs:

```bash
docker compose logs -f aas-web-ui
```

In the browser:

1. Open the UI.
2. The CatenaXplorer page should open by default.
3. Select the configured partner or choose **Use another partner…** and enter an allowed runtime partner.
4. Select **Load descriptors**.

## Troubleshooting

`401` from `/api/catena-x/edc/...`:

- This should only happen when `CX_EDC_BFF_AUTH_MODE=jwt`.
- The browser token is missing, expired, or not accepted by the backend.
- Check `security.config.issuer` and `security.config.clientId` in `basyx-infra.yml`.
- Check `CX_EDC_BFF_AUTH_JWKS_URL`, `CX_EDC_BFF_AUTH_ISSUER`, `CX_EDC_BFF_AUTH_AUDIENCE`, and required roles in `.env`.

Allowlist error:

- The requested provider DSP endpoint is not allowed.
- Add the exact provider DSP endpoint prefix to `CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES`.

EDR polling timeout:

- Contract negotiation did not produce an EDR before the timeout.
- Check provider catalog policy compatibility, EDC logs, and increase `CX_EDC_EDR_POLLING_ATTEMPTS` if negotiation is slow.

Data address or descriptor fetch error:

- The EDR data address may not expose the expected DTR API path.
- The provider asset must allow the backend to call `/shell-descriptors` through the returned data-plane endpoint.

## Stop

```bash
docker compose down
```
