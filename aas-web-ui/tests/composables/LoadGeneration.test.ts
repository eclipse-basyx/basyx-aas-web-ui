import { describe, expect, it } from 'vitest'
import { useLoadGeneration } from '@/composables/LoadGeneration'

describe('useLoadGeneration', () => {
  it('leaves loading false when an in-flight load is invalidated by a cleared selection', () => {
    const load = useLoadGeneration()
    const staleGeneration = load.start()

    expect(load.loading.value).toBe(true)

    load.invalidate()
    load.finish(staleGeneration)

    expect(load.loading.value).toBe(false)
    expect(load.isCurrent(staleGeneration)).toBe(false)
  })

  it('allows only the latest load to finish the loading state', () => {
    const load = useLoadGeneration()
    const staleGeneration = load.start()
    const currentGeneration = load.start()

    load.finish(staleGeneration)
    expect(load.loading.value).toBe(true)

    load.finish(currentGeneration)
    expect(load.loading.value).toBe(false)
  })
})
