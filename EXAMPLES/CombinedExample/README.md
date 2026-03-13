# Combined Feature Showcase

This example provides a comprehensive showcase setup for the BaSyx AAS Web UI. It combines as many major UI features as possible in one ready-to-run environment and is intended for demos, workshops, and end-to-end validation.

## Overview

The setup includes two preconfigured BaSyx infrastructures:

- **Infrastructure 1 (Secured BaSyx)**: OAuth2-secured environment with Keycloak
- **Infrastructure 2 (Local BaSyx)**: Unsecured environment without authentication

The Web UI is preconfigured to connect to both infrastructures and demonstrate cross-infrastructure workflows.

## Showcased Features

- Multi infrastructure handling
- OAuth2 support (Keycloak)
- File management with the File Explorer submodel plugin
- Live sensor data integration via Node-RED (including auto-sync behavior)
- Time series data plugin with InfluxDB integration and chart visualization
- IFC file rendering for BIM use cases
- PCF Process module for carbon footprint calculation from materials and quantities
- Digital Product Passport module for AAS-based DPP visualization
- Submodel plugin showcase: technical data, handover documentation, digital nameplate, contact information
- Bill of Materials submodel plugin with graphical editing capabilities (dynamic flow chart)

## Architecture

The example includes:

- A single **AAS Web UI** instance
- **Infrastructure 1** with secured BaSyx services (AAS Environment, Registry, Submodel Registry, Discovery), Keycloak, reverse proxy, InfluxDB, Telegraf, and MQTT publisher
- **Infrastructure 2** with unsecured BaSyx services, Node-RED, MQTT broker, and MQTT client
- A shared **MongoDB** database for both infrastructures

## Prerequisites

- Docker and Docker Compose installed
- Available ports including: `80`, `3000`, `8086`, `1880`, `1883`, `1884`, `8081-8084`, `9081-9084`, `9097`
- Host entries for `*.basyx.localhost` domains

Add the following entries to your hosts file (for example `/etc/hosts`):

```text
127.0.0.1 aasgui.basyx.localhost
127.0.0.1 keycloak.basyx.localhost
127.0.0.1 discovery.basyx.localhost
127.0.0.1 aasreg.basyx.localhost
127.0.0.1 smreg.basyx.localhost
127.0.0.1 aasenv.basyx.localhost
```

## Getting Started

1. Start all services from this folder:

```bash
docker compose up -d
```

2. Open the AAS Web UI:

http://localhost:3000

3. (Optional) Open supporting tools:

- InfluxDB UI: http://localhost:8086
- Node-RED: http://localhost:1880
- Keycloak admin console: http://keycloak.basyx.localhost

Keycloak admin credentials:

- Username: `admin`
- Password: `keycloak-admin`

## Usage

### Infrastructure Switching

1. Open the Web UI at http://localhost:3000
2. Open the settings menu
3. Navigate to Infrastructure Management
4. Switch between:
	- **Secured BaSyx** (OAuth2)
	- **Local BaSyx** (no auth)

### OAuth2 Flow (Secured Infrastructure)

1. Select **Secured BaSyx**
2. Access secured AAS content
3. Complete login in Keycloak when redirected
4. Return to the UI with an authenticated session

### Suggested Feature Tour

Use this sequence for a complete showcase:

1. Start in **Secured BaSyx** and demonstrate OAuth2 login
2. Open AAS/Submodels that contain technical data, handover documentation, digital nameplate, and contact information plugins
3. Demonstrate file upload/download via the File Explorer plugin
4. Show IFC file rendering for BIM-related AAS data
5. Open the Time Series submodel plugin and visualize linked data from InfluxDB
6. Switch to **Local BaSyx** and demonstrate live sensor updates (Node-RED + MQTT + auto-sync)
7. Open the Bill of Materials plugin and edit structures using the dynamic flow chart editor
8. Launch the **PCF Process** module and calculate a product footprint from selected materials/quantities
9. Launch the **Digital Product Passport** module to visualize DPP-related AAS content

## Configuration Notes

- Infrastructure definitions are stored in `basyx-infra.yml`
- Endpoint editing is enabled (`ENDPOINT_CONFIG_AVAILABLE=true`), so users can add or modify infrastructures in the UI
- The InfluxDB token is preconfigured through the Web UI container environment

## Stopping the Setup

Stop all services:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

## Troubleshooting

### Secured infrastructure is unreachable

1. Verify host entries for `*.basyx.localhost`
2. Check that the reverse proxy is running (`proxy` container)
3. Check service health:

```bash
docker compose ps
```

### OAuth2 login issues

1. Verify Keycloak status and logs
2. Confirm the selected infrastructure is **Secured BaSyx**
3. Ensure `keycloak.basyx.localhost` resolves on your machine

### Time series charts show no data

1. Verify InfluxDB is running and reachable at http://localhost:8086
2. Check Telegraf and MQTT publisher containers for incoming data
3. Re-run data fetch in the plugin after waiting for fresh data points

### Live sensor values are not updating

1. Verify Node-RED and MQTT services in Infrastructure 2
2. Check MQTT client/publisher container logs
3. Confirm auto-sync is enabled in the BaSyx UI settings

## Related Documentation

- [Main README](../../README.md)
- [MultiInfrastructure Example](../MultiInfrastructure/README.md)
- [TimeSeriesData Example](../TimeSeriesData/README.md)
- [PcfCalculation Example](../PcfCalculation/README.md)
