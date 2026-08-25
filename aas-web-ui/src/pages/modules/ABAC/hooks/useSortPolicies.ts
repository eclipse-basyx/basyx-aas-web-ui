import type { PolicyVersion } from '@/pages/modules/ABAC/types/policy'
import type { Sort } from '@/pages/modules/ABAC/types/sort'
import { computed, ref, type Ref } from 'vue'
import { useAbacConfigStore } from '@/pages/modules/ABAC/stores/useAbacConfigStore'

export function useSortPolicies (policies: Ref<PolicyVersion[] | undefined>) {
  const config = useAbacConfigStore()
  const locale = computed(() => config.language)

  const sort = ref<Sort>({ accessor: 'status', order: 'asc' })

  function onSort (accessor: Sort['accessor']) {
    sort.value = sort.value.accessor === accessor
      ? {
          accessor,
          order: sort.value.order === 'asc' ? 'desc' : 'asc',
        }
      : { accessor, order: 'asc' }
  }

  const sortedPolicies = computed<PolicyVersion[]>(() => {
    const items = [...policies.value ?? []]
    const factor = sort.value.order === 'asc' ? 1 : -1

    return items.toSorted((a, b) => {
      const av = a[sort.value.accessor]
      const bv = b[sort.value.accessor]

      if (av == null && bv == null) {
        return 0
      }
      if (av == null) {
        return 1
      }
      if (bv == null) {
        return -1
      }

      return av.toString().localeCompare(bv.toString(), locale.value, { numeric: true }) * factor
    })
  })

  return { sort, onSort, sortedPolicies }
}
