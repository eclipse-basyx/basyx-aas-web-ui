type Key = { value: string }

type Segment = {
  idShort: string
  semanticId: { keys: Key[] }
  value: any[]
}

export const INTERNAL_SEGMENT_SEMANTIC_ID = 'https://admin-shell.io/idta/TimeSeries/Segments/InternalSegment/1/1'
export const LINKED_SEGMENT_SEMANTIC_ID = 'https://admin-shell.io/idta/TimeSeries/Segments/LinkedSegment/1/1'
export const EXTERNAL_SEGMENT_SEMANTIC_ID = 'https://admin-shell.io/idta/TimeSeries/Segments/ExternalSegment/1/1'

export function createTimeSeriesSubmodelData (): any {
  const internalSegment: Segment = {
    idShort: 'InternalSegment',
    semanticId: { keys: [{ value: INTERNAL_SEGMENT_SEMANTIC_ID }] },
    value: [
      {
        idShort: 'Records',
        value: [
          {
            value: [
              { idShort: 'time', value: '2026-05-13T19:15:53.340582794Z' },
              { idShort: 'AirQuality', value: '398.98' },
            ],
          },
          {
            value: [
              { idShort: 'time', value: '2026-05-13T19:15:54.345702712Z' },
              { idShort: 'AirQuality', value: '264.02' },
            ],
          },
        ],
      },
    ],
  }

  const linkedSegment: Segment = {
    idShort: 'LinkedSegment',
    semanticId: { keys: [{ value: LINKED_SEGMENT_SEMANTIC_ID }] },
    value: [
      { idShort: 'Endpoint', value: 'http://localhost:8086/api/v2/query?org=basyx' },
      { idShort: 'Query', value: 'from(bucket: "basyx") |> range(start: -10m) |> filter(fn: (r) => r["_field"] == "{{y-value}}")' },
    ],
  }

  const externalSegment: Segment = {
    idShort: 'ExternalSegment',
    semanticId: { keys: [{ value: EXTERNAL_SEGMENT_SEMANTIC_ID }] },
    value: [{ idShort: 'Data', modelType: 'File', value: '/attachment.csv' }],
  }

  return {
    path: '/submodels/time-series',
    submodelElements: [
      {
        idShort: 'Segments',
        value: [internalSegment, linkedSegment, externalSegment],
      },
      {
        idShort: 'Metadata',
        value: [
          {
            idShort: 'Record',
            value: [
              { idShort: 'time' },
              { idShort: 'AirQuality' },
              { idShort: 'rpm' },
            ],
          },
        ],
      },
    ],
  }
}
