# Time Series Data plugin example

This example starts a complete local environment for exploring the AAS Web UI's Time Series Data plugin. It demonstrates three common ways to provide time-series data:

- **InternalSegment**: archived values stored directly in the AAS
- **ExternalSegment**: archived values stored in a CSV attachment
- **LinkedSegment**: continuously generated values queried from InfluxDB

Use the example to compare the segment types, try relative and absolute time ranges, reuse Flux queries from InfluxDB or Grafana, enable automatic refresh, and inspect the available visualizations.

## What the example starts

| Service | Purpose |
| --- | --- |
| AAS Web UI | Displays the example AAS and the Time Series Data plugin |
| BaSyx Go AAS Environment | Serves the preconfigured `SensorExampleAAS` and its submodel |
| BaSyx Go Configuration Service | Initializes the PostgreSQL schema before the AAS Environment starts |
| PostgreSQL | Stores the BaSyx environment data |
| MQTT publisher and Mosquitto | Generate and transport new sensor and machine values every second |
| Telegraf | Writes the MQTT values to InfluxDB |
| InfluxDB 2.7 | Stores the live LinkedSegment data |

The included [`TimeSeriesDemo.aasx`](aas/TimeSeriesDemo.aasx) is loaded automatically when the environment starts.

## Quick start

### Prerequisites

- Docker with Docker Compose v2

This stack is intended for local demonstration only. It uses fixed demo credentials, a preconfigured InfluxDB administration token, and published host ports. Do not expose it to an untrusted network.

From the repository root, run:

```shell
cd examples/TimeSeriesData
docker compose up -d
docker compose ps
```

The first start can take a few minutes while Docker downloads the images and the services initialize. Wait until `timeseries-aas-env`, `timeseries-postgres`, and `mosquitto` are healthy. The `timeseries-basyx-configuration` container is expected to finish with exit code `0`; it performs a one-time initialization task.

Open the following services:

| Service | URL | Credentials |
| --- | --- | --- |
| AAS Web UI | http://localhost:3000 | None |
| InfluxDB | http://localhost:8086 | `admin` / `influxpassword` |
| AAS Environment API | http://localhost:8081 | None |

## Explore the plugin

Start with these common navigation steps:

1. Open the AAS Web UI at http://localhost:3000.
2. Select `SensorExampleAAS`.
3. Select the `TimeSeries` submodel in the tree.
4. Open the **Visualization** tab.

The **Preview Configuration** card lets you select a segment, a timestamp property, one or more value properties, a time range, and an optional refresh interval. Press **Fetch Data** to load the selected data immediately.

### InternalSegment

Use this segment to inspect data stored directly in the AAS:

1. Select `InternalSegment` as the segment.
2. Select `time` as the time value.
3. Select `Temperature` as the y-value.
4. Select a time range and press **Fetch Data**.
5. Select a chart type in **Preview Chart**.

Relative ranges are anchored to the newest timestamp in the stored records, so the archived example remains usable even when its timestamps are older than the current time.

### ExternalSegment

Use this segment to inspect data from the CSV attachment referenced by the AAS:

1. Select `ExternalSegment` as the segment.
2. Select `time` as the time value.
3. Select `Temperature` as the y-value.
4. Select a time range and press **Fetch Data**.
5. Select a chart type in **Preview Chart**.

As with InternalSegment, relative ranges are anchored to the newest valid timestamp in the returned file.

### LinkedSegment

Use this segment to query the live machine data stored in InfluxDB:

1. Select `LinkedSegment` as the segment.
2. Select `time` as the time value.
3. Select `pressure`, `rpm`, or `vibration` as a y-value.
4. Select a recent relative range such as **Last 5m**.
5. Press **Fetch Data** and select a chart type.

The Web UI container receives the example token through `INFLUXDB_TOKEN`, so an API-token field normally does not appear. If it does appear, use the token configured in [`docker-compose.yaml`](docker-compose.yaml).

The MQTT publisher creates a new machine-data sample every second. If the first query is empty immediately after startup, wait a few seconds and fetch again.

## Time ranges and Flux variables

The selected range controls both the query and every visualization:

- LinkedSegment relative ranges end at the current time.
- InternalSegment and ExternalSegment relative ranges end at the newest available sample.
- Absolute ranges use the entered local start and end times and are converted to UTC for the query.

Flux queries copied from the InfluxDB query editor or a Grafana Flux panel can use the variables supplied by the plugin:

| Variable | Supplied value |
| --- | --- |
| `v.timeRangeStart` | Selected UTC range start |
| `v.timeRangeStop` | Selected UTC range end |
| `v.windowPeriod` | A duration calculated for approximately 360 points |

For example:

```flux
from(bucket: "basyx")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "machine_metric")
  |> filter(fn: (r) => r["_field"] == "{{y-value}}")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
```

`{{y-value}}` is replaced with the first y-value selected in the plugin. Other `v.*` references must be defined by the query itself. Queries with hard-coded `range()` calls are sent unchanged.

## Auto refresh

Auto refresh is disabled by default. Open the adjacent **Auto Refresh** menu to enable it and select an interval in seconds, minutes, or hours.

- Press **Fetch Data** once when you want an immediate result; automatic updates occur after the selected interval.
- A refresh tick is skipped while an earlier request is still running.
- Relative LinkedSegment windows advance with incoming data.
- Absolute ranges retain their exact bounds.
- A manual chart zoom is preserved across refreshes.
- Fetching a changed time range resets the chart viewport.

## Visualizations

The plugin provides:

- Line Chart
- Area Chart
- Scatter Chart
- Histogram
- Gauge
- Display Field

Line, Area, and Scatter charts support x-axis selection, zoom in/out, pan, and reset from the chart toolbar. Hovered values include their configured units. Scrolling the page while the pointer is over a chart does not zoom it.

Gauge values, labels, and units remain visible without hovering. Selecting multiple y-values creates separate responsive gauges. Display Field shows the newest value and formats numeric values with two decimal places.

## Stop or reset the example

Stop the running containers without removing them:

```shell
docker compose stop
```

Remove the containers and network:

```shell
docker compose down
```

PostgreSQL data is stored in its service container and is recreated after `docker compose down`. InfluxDB uses the bind-mounted `influxdb/data` and `influxdb/config` directories. To completely reset InfluxDB, bring the stack down and delete those generated directories before starting it again.

## Troubleshooting

### A Docker image download fails

Transient registry or network failures can produce messages such as `failed to copy`, `EOF`, or CloudFront download errors. Retry the pull and start:

```shell
docker compose pull
docker compose up -d
```

### A service does not become ready

Check its status and logs:

```shell
docker compose ps
docker compose logs --tail=100 aas-env
```

Replace `aas-env` with another service when needed. Useful service names include `influxdb`, `telegraf`, `mosquitto`, and `mqtt-publisher`.

### LinkedSegment returns no data

- Wait a few seconds after startup so the publisher and Telegraf can create samples.
- Use a recent relative range such as **Last 5m**.
- Confirm that `influxdb`, `telegraf`, `mosquitto`, and `mqtt-publisher` are running.
- Inspect the Telegraf and publisher logs for connection errors.

### A published port is already in use

Stop the conflicting local service or change the host-side port in `docker-compose.yaml`. The example publishes ports `3000`, `8081`, `8086`, `9999`, and `1883`.

## Scope

- LinkedSegment database access is implemented for Flux queries against InfluxDB.
- ExternalSegment is demonstrated with a CSV file containing a header row.
- The AAS follows the IDTA [Time Series Data submodel template](https://industrialdigitaltwin.org/wp-content/uploads/2023/03/IDTA-02008-1-1_Submodel_TimeSeriesData.pdf).
