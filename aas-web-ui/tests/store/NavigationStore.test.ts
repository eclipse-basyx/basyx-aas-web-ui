import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNavigationStore } from '@/store/NavigationStore'

describe('NavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('increments reload and clear signals for every dispatch', () => {
    const navigationStore = useNavigationStore()

    expect(navigationStore.getTriggerAASListReload).toBe(0)
    expect(navigationStore.getClearAASList).toBe(0)
    expect(navigationStore.getClearTreeview).toBe(0)
    expect(navigationStore.getTriggerTreeviewReload).toBe(0)

    navigationStore.dispatchTriggerAASListReload()
    navigationStore.dispatchTriggerAASListReload()
    navigationStore.dispatchClearAASList()
    navigationStore.dispatchClearAASList()
    navigationStore.dispatchClearTreeview()
    navigationStore.dispatchClearTreeview()
    navigationStore.dispatchTriggerTreeviewReload()
    navigationStore.dispatchTriggerTreeviewReload()

    expect(navigationStore.getTriggerAASListReload).toBe(2)
    expect(navigationStore.getClearAASList).toBe(2)
    expect(navigationStore.getClearTreeview).toBe(2)
    expect(navigationStore.getTriggerTreeviewReload).toBe(2)
  })

  it('dismisses infrastructure-scoped snackbars when the infrastructure changes', () => {
    const navigationStore = useNavigationStore()

    navigationStore.dispatchSnackbar({
      status: true,
      text: 'Authentication required',
      infrastructureId: 'infra-1',
    })
    navigationStore.dispatchDismissInfrastructureSnackbar()

    expect(navigationStore.getSnackbar).toEqual({ status: false })

    navigationStore.dispatchSnackbar({
      status: true,
      text: 'A general notification',
    })
    navigationStore.dispatchDismissInfrastructureSnackbar()

    expect(navigationStore.getSnackbar).toEqual({
      status: true,
      text: 'A general notification',
    })
  })

  it('preserves list search parameters when route selections change', () => {
    const navigationStore = useNavigationStore()
    const query = {
      aas: 'https://example.com/shells/example',
      aasQuery: '{"$condition":{"$boolean":true}}',
      aasSearch: 'idShort:Motor',
      path: 'https://example.com/submodels/example',
      smQuery: '{"$condition":{"$boolean":true}}',
      smSearch: 'semanticId:0173',
    }

    expect(navigationStore.filterQueryParams(query)).toEqual({
      filteredQuery: query,
      removedParams: [],
    })
  })
})
