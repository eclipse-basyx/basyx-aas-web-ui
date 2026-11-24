import { useRoute } from 'vue-router'

/** Height of the visualization panel below the app bars, e.g. `calc(100svh - 202px)` */
export function useVisualizationPanelHeight () {
  const route = useRoute()
  return computed(() => (route?.name === 'AASSubmodelViewer' ? 'calc(100svh - 137px)' : 'calc(100svh - 202px)'))
}
