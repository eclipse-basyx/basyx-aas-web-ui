import type { EdcQuery, EdcQueryOptions } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import type { Ref } from 'vue'
import { queryAllEdcPages } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'

/**
 * All resources of a kind as the items of a select, sorted by their display name, e.g. the assets a contract can offer.
 * `resourceLabel` names them in the error log, e.g. `assets`.
 */
export function useEdcResourceOptions<T> (
  resourceLabel: string,
  query: EdcQuery<T>,
  displayName: (resource: T) => string,
  queryOptions: EdcQueryOptions = {},
) {
  // Data
  const options = ref([]) as Ref<T[]>
  const loading = ref(false)

  // Methods
  async function load (): Promise<void> {
    loading.value = true
    try {
      const result = await queryAllEdcPages(query, queryOptions)
      options.value = (result.success ? result.data : []).toSorted((a, b) => displayName(a).localeCompare(displayName(b)))
    } catch (error) {
      console.error(`Error loading ${resourceLabel}:`, error)
    } finally {
      loading.value = false
    }
  }

  return {
    options,
    loading,
    load,
  }
}
