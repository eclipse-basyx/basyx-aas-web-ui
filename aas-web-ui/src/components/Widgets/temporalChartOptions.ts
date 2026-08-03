export function mergeTemporalChartControls (baseChart: any, externalChart: any): any {
  const external = externalChart || {}

  return {
    ...baseChart,
    ...external,
    events: {
      ...external.events,
      ...baseChart.events,
    },
    selection: {
      ...external.selection,
      ...baseChart.selection,
    },
    toolbar: {
      ...external.toolbar,
      ...baseChart.toolbar,
      tools: {
        ...external.toolbar?.tools,
        ...baseChart.toolbar?.tools,
      },
    },
    zoom: {
      ...external.zoom,
      ...baseChart.zoom,
      allowMouseWheelZoom: false,
    },
  }
}
