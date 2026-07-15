import type { Ref } from 'vue'
import { ref } from 'vue'

type LoadGeneration = {
  loading: Ref<boolean>
  start: () => number
  invalidate: () => void
  isCurrent: (generation: number) => boolean
  finish: (generation: number) => void
}

/**
 * Tracks the latest asynchronous component load and owns its loading state.
 * Invalidating a load also stops its indicator, while late results remain
 * unable to update the current view.
 */
export function useLoadGeneration (): LoadGeneration {
  const loading = ref(false)
  let currentGeneration = 0

  function start (): number {
    currentGeneration += 1
    loading.value = true
    return currentGeneration
  }

  function invalidate (): void {
    currentGeneration += 1
    loading.value = false
  }

  function isCurrent (generation: number): boolean {
    return generation === currentGeneration
  }

  function finish (generation: number): void {
    if (isCurrent(generation)) {
      loading.value = false
    }
  }

  return { loading, start, invalidate, isCurrent, finish }
}
