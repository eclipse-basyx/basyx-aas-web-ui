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
})
