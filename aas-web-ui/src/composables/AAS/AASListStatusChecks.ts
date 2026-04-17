import type { Ref } from 'vue'
import { ref } from 'vue'

export interface AasStatusCheckItem {
  id?: string
  status?: string
}

export interface UseAASListStatusChecksOptions<TItem extends AasStatusCheckItem = AasStatusCheckItem> {
  aasList: Ref<Array<TItem>>
  getVirtualScrollContainer: () => HTMLElement | null
  itemHeight: number
  viewportBufferRows: number
  fallbackLimit: number
  concurrency: number
  aasIsAvailableById: (aasId: string) => Promise<boolean>
}

export function useAASListStatusChecks<TItem extends AasStatusCheckItem = AasStatusCheckItem> (
  options: UseAASListStatusChecksOptions<TItem>,
) {
  const statusCheckInProgress = ref(false)

  function getStatusCheckTargets (): Array<TItem> {
    if (!Array.isArray(options.aasList.value) || options.aasList.value.length === 0) {
      return []
    }

    const container = options.getVirtualScrollContainer()
    let candidates: Array<TItem>

    if (container) {
      const visibleRows = Math.max(1, Math.ceil(container.clientHeight / options.itemHeight))
      const firstVisibleIndex = Math.max(0, Math.floor(container.scrollTop / options.itemHeight) - options.viewportBufferRows)
      const endIndex = Math.min(
        options.aasList.value.length,
        firstVisibleIndex + visibleRows + options.viewportBufferRows * 2,
      )
      candidates = options.aasList.value.slice(firstVisibleIndex, endIndex)
    } else {
      candidates = options.aasList.value.slice(0, options.fallbackLimit)
    }

    const seenIds = new Set<string>()
    return candidates.filter(item => {
      const id = item?.id
      if (!id || seenIds.has(id)) {
        return false
      }
      seenIds.add(id)
      return true
    })
  }

  async function updateStatus (statusCheckEnabled: boolean, init = false): Promise<void> {
    if (statusCheckInProgress.value) {
      return
    }

    const statusTargets = getStatusCheckTargets()
    if (statusTargets.length === 0) {
      return
    }

    statusCheckInProgress.value = true

    try {
      const queue = [...statusTargets]
      const workerCount = Math.min(options.concurrency, queue.length)

      const workers = Array.from({ length: workerCount }, async () => {
        while (queue.length > 0) {
          const aasOrAasDescriptor = queue.shift()

          if (!aasOrAasDescriptor || !aasOrAasDescriptor.id) {
            continue
          }

          const aasIsAvailable = await options.aasIsAvailableById(aasOrAasDescriptor.id)

          if (aasIsAvailable) {
            aasOrAasDescriptor.status
              = statusCheckEnabled ? 'online' : (init ? '' : 'check disabled')
          } else {
            aasOrAasDescriptor.status
              = statusCheckEnabled ? 'offline' : (init ? '' : 'check disabled')
          }
        }
      })

      await Promise.all(workers)
    } finally {
      statusCheckInProgress.value = false
    }
  }

  return {
    updateStatus,
    getStatusCheckTargets,
  }
}
