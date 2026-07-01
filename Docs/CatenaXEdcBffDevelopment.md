# Catena-X EDC BFF Local Development

This guide explains how to run the Catena-X EDC backend-for-frontend (BFF) locally while using the Vite dev server for the BaSyx AAS Web UI.

The important security rule is: the browser only knows an EDC `proxyId`. The EDC Management API URL and `x-api-key` stay in the local BFF process.

## 1. Configure a Catena-X Infrastructure

Use a Catena-X infrastructure in `aas-web-ui/public/config/basyx-infra.yml` or configure it in the UI:

```yaml
infrastructures:
  default: local-catena-x

  local-catena-x:
    name: Local Catena-X
    template: catena-x
    components:
      digitalTwinRegistry:
        baseUrl: "http://localhost:5004/api/v3"
      submodelService:
        baseUrl: "http://localhost:5005"
    catenaX:
      edc:
        proxyId: default
        defaultCounterPartyId: "did:web:provider.example"
        defaultCounterPartyAddress: "https://provider.example/api/v1/dsp"
    security:
      type: none
```

Only `proxyId` and optional UI defaults belong in this file. Do not add the EDC Management API URL or API key here.

## 2. Run the BFF

From `aas-web-ui`, build the BFF once:

```bash
pnpm bff:build
```

Start it with local development auth disabled:

```bash
CX_EDC_BFF_AUTH_MODE=none \
CX_EDC_DEFAULT_MANAGEMENT_URL=http://localhost:8182/management \
CX_EDC_DEFAULT_API_KEY=password \
CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES='*' \
CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES=true \
pnpm bff:start
```

For a real connector, replace:

- `CX_EDC_DEFAULT_MANAGEMENT_URL` with your own consumer EDC Management API URL.
- `CX_EDC_DEFAULT_API_KEY` with the local Management API key.
- `CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES` with explicit provider DSP endpoint prefixes.

Example allowlist:

```bash
CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES='https://provider.example/api/v1/dsp,https://other-provider.example/api/v1/dsp'
```

The wildcard is convenient for local testing, but avoid it for shared or production-like environments.

If port `3001` is already in use, either stop the existing process or choose another BFF port.

To find the process:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
```

To stop it:

```bash
kill <PID>
```

Or run the BFF on another port:

```bash
CX_EDC_BFF_PORT=3002 \
CX_EDC_BFF_AUTH_MODE=none \
CX_EDC_DEFAULT_MANAGEMENT_URL=http://localhost:8182/management \
CX_EDC_DEFAULT_API_KEY=password \
CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES='*' \
CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES=true \
pnpm bff:start
```

## 3. Run the UI Dev Server

In a second terminal, start Vite:

```bash
CX_EDC_BFF_UPSTREAM_URL=http://localhost:3001 pnpm dev
```

If you changed the BFF port, use the same port here:

```bash
CX_EDC_BFF_UPSTREAM_URL=http://localhost:3002 pnpm dev
```

The UI calls `/api/catena-x/edc/...`; Vite proxies those requests to the local BFF.

Open the UI, select the Catena-X infrastructure, open CatenaXplorer, select a descriptor, and expand **EDC Connection** below the descriptor details.

## 4. Smoke Test Without a Real EDC

Status can be tested with only the BFF running:

```bash
curl http://localhost:3001/api/catena-x/edc/default/status
```

For discovery and catalog requests without a real connector, run a tiny mock Management API in another terminal:

```bash
node - <<'NODE'
import http from 'node:http'

http.createServer(async (req, res) => {
  let body = ''
  for await (const chunk of req) body += chunk

  res.setHeader('content-type', 'application/json')

  if (req.url === '/management/v4alpha/connectordiscovery/connectors') {
    res.end(JSON.stringify([{
      'edc:counterPartyId': 'did:web:provider.example',
      'edc:counterPartyAddress': 'https://provider.example/api/v1/dsp/2025-1',
      'edc:protocol': 'dataspace-protocol-http:2025-1'
    }]))
    return
  }

  if (req.url === '/management/v4alpha/connectordiscovery/dspversionparams') {
    res.end(JSON.stringify({
      'edc:counterPartyId': 'did:web:provider.example',
      'edc:counterPartyAddress': 'https://provider.example/api/v1/dsp/2025-1',
      'edc:protocol': 'dataspace-protocol-http:2025-1'
    }))
    return
  }

  if (req.url === '/management/v3/catalog/request') {
    res.end(JSON.stringify({
      '@type': 'Catalog',
      participantId: 'did:web:provider.example',
      dataset: [{ '@id': 'mock-asset', '@type': 'Dataset' }]
    }))
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ status: 404, error: 'not found', body }))
}).listen(8182, () => {
  console.log('Mock EDC Management API listening on http://localhost:8182/management')
})
NODE
```

Then use the BFF command from step 2 with:

```bash
CX_EDC_DEFAULT_MANAGEMENT_URL=http://localhost:8182/management
CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES='*'
CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES=true
```

## 5. Useful BFF Environment Variables

| Variable | Purpose |
| --- | --- |
| `CX_EDC_BFF_PORT` | BFF port, default `3001`. |
| `CX_EDC_BFF_AUTH_MODE` | `jwt` or `none`. Use `none` for local unauthenticated dev. |
| `CX_EDC_BFF_AUTH_JWKS_URL` | Required when `CX_EDC_BFF_AUTH_MODE=jwt`. |
| `CX_EDC_BFF_AUTH_ISSUER` | Optional JWT issuer check. |
| `CX_EDC_BFF_AUTH_AUDIENCE` | Optional JWT audience check. |
| `CX_EDC_BFF_REQUIRED_ROLES` | Comma-separated required roles/scopes. |
| `CX_EDC_DEFAULT_MANAGEMENT_URL` | Server-side consumer EDC Management API URL. |
| `CX_EDC_DEFAULT_API_KEY` | Server-side EDC Management API key. |
| `CX_EDC_DEFAULT_API_KEY_HEADER` | API key header, default `X-Api-Key`. |
| `CX_EDC_DEFAULT_PARTICIPANT_ID` | Optional own participant ID shown in status. |
| `CX_EDC_DEFAULT_DSP_ENDPOINT` | Optional own DSP endpoint metadata. |
| `CX_EDC_DEFAULT_DATA_PLANE_PROXY_URL` | Optional data plane proxy metadata for later phases. |
| `CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES` | Comma-separated provider DSP endpoint prefixes or `*`. |
| `CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES` | Allows `http://` counterparty addresses for local testing. |
| `CX_EDC_REQUEST_TIMEOUT_MS` | Upstream EDC request timeout, default `30000`. |

For multiple proxy IDs, use `CX_EDC_PROXY_CONFIG_JSON` or `CX_EDC_PROXY_CONFIG_FILE`:

```json
{
  "proxies": {
    "default": {
      "managementUrl": "http://localhost:8182/management",
      "apiKey": "password",
      "allowedCounterPartyAddresses": ["https://provider.example/api/v1/dsp"]
    },
    "partner-test": {
      "managementUrl": "https://consumer-test.example/management",
      "apiKey": "another-secret",
      "participantId": "BPNL000000000001"
    }
  }
}
```

The infrastructure `catenaX.edc.proxyId` selects one of these server-side proxy entries.
