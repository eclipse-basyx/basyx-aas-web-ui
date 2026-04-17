import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useAASListStatusChecks } from '@/composables/AAS/AASListStatusChecks'

describe('AASListStatusChecks.ts', () => {
  it('uses fallback targets, de-duplicates by id, and updates online/offline status', async () => {
    const aasList = ref([
      { id: 'aas-1' },
      { id: 'aas-1' },
      { id: 'aas-2' },
      { id: 'aas-3' },
    ])

    const aasIsAvailableById = vi.fn(async (id: string) => id === 'aas-1')

    const { updateStatus } = useAASListStatusChecks({
      aasList,
      getVirtualScrollContainer: () => null,
      itemHeight: 56,
      viewportBufferRows: 1,
      fallbackLimit: 3,
      concurrency: 2,
      aasIsAvailableById,
    })

    await updateStatus(true)

    expect(aasIsAvailableById).toHaveBeenCalledTimes(2)
    expect(aasIsAvailableById).toHaveBeenCalledWith('aas-1')
    expect(aasIsAvailableById).toHaveBeenCalledWith('aas-2')
    expect(aasList.value[0].status).toBe('online')
    expect(aasList.value[2].status).toBe('offline')
    expect(aasList.value[3].status).toBeUndefined()
  })

  it('limits checks to current visible virtual-scroll slice', async () => {
    const aasList = ref([
      { id: 'aas-1' },
      { id: 'aas-2' },
      { id: 'aas-3' },
      { id: 'aas-4' },
      { id: 'aas-5' },
      { id: 'aas-6' },
    ])

    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', {
      value: 112,
      configurable: true,
    })
    Object.defineProperty(container, 'scrollTop', {
      value: 56,
      configurable: true,
      writable: true,
    })

    const aasIsAvailableById = vi.fn(async () => true)

    const { updateStatus } = useAASListStatusChecks({
      aasList,
      getVirtualScrollContainer: () => container,
      itemHeight: 56,
      viewportBufferRows: 1,
      fallbackLimit: 6,
      concurrency: 2,
      aasIsAvailableById,
    })

    await updateStatus(true)

    expect(aasIsAvailableById).toHaveBeenCalledTimes(4)
    expect(aasIsAvailableById).toHaveBeenNthCalledWith(1, 'aas-1')
    expect(aasIsAvailableById).toHaveBeenNthCalledWith(2, 'aas-2')
    expect(aasIsAvailableById).toHaveBeenNthCalledWith(3, 'aas-3')
    expect(aasIsAvailableById).toHaveBeenNthCalledWith(4, 'aas-4')
  })

  it('prevents overlapping update runs while one is in progress', async () => {
    const aasList = ref([{ id: 'aas-1' }])
    let resolveAvailability!: (value: boolean) => void
    const aasIsAvailableById = vi.fn(() => new Promise<boolean>(resolve => {
      resolveAvailability = resolve
    }))

    const { updateStatus } = useAASListStatusChecks({
      aasList,
      getVirtualScrollContainer: () => null,
      itemHeight: 56,
      viewportBufferRows: 1,
      fallbackLimit: 1,
      concurrency: 1,
      aasIsAvailableById,
    })

    const firstRun = updateStatus(true)
    const secondRun = updateStatus(true)

    expect(aasIsAvailableById).toHaveBeenCalledTimes(1)

    resolveAvailability(true)
    await firstRun
    await secondRun

    expect(aasList.value[0].status).toBe('online')
  })

  it('writes disabled status when checks are disabled', async () => {
    const aasList = ref([{ id: 'aas-1' }])
    const aasIsAvailableById = vi.fn(async () => true)

    const { updateStatus } = useAASListStatusChecks({
      aasList,
      getVirtualScrollContainer: () => null,
      itemHeight: 56,
      viewportBufferRows: 1,
      fallbackLimit: 1,
      concurrency: 1,
      aasIsAvailableById,
    })

    await updateStatus(false)

    expect(aasList.value[0].status).toBe('check disabled')
  })
})
