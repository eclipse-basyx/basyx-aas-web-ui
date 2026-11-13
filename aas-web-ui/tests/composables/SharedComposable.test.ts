import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { createSharedComposable } from '@/composables/SharedComposable'

describe('createSharedComposable', () => {
  it('shares one instance between active scopes and disposes it with the last scope', () => {
    const cleanup = vi.fn()
    const useShared = createSharedComposable(() => {
      onScopeDispose(cleanup)
      return { id: Symbol('instance') }
    })
    const first = effectScope()
    const second = effectScope()

    const a = first.run(useShared)!
    const b = second.run(useShared)!
    expect(a).toBe(b)

    first.stop()
    expect(cleanup).not.toHaveBeenCalled()
    second.stop()
    expect(cleanup).toHaveBeenCalledOnce()

    const third = effectScope()
    expect(third.run(useShared)).not.toBe(a)
    third.stop()
  })

  it('creates an independent instance outside an effect scope', () => {
    const useShared = createSharedComposable(() => ({ id: Symbol('instance') }))
    expect(useShared()).not.toBe(useShared())
  })
})
