import type { EffectScope } from 'vue'

/**
 * Shares one instance of a composable between all components that use it at the same time.
 * The instance is created by the first subscriber and disposed with the last one.
 * Calls outside an effect scope receive an independent instance.
 */
export function createSharedComposable<T> (composable: () => T): () => T {
  let subscribers = 0
  let scope: EffectScope | undefined
  let state: T | undefined

  function dispose (): void {
    subscribers -= 1
    if (subscribers <= 0) {
      scope?.stop()
      scope = undefined
      state = undefined
      subscribers = 0
    }
  }

  return () => {
    if (!getCurrentScope()) {
      return composable()
    }
    subscribers += 1
    if (!scope) {
      scope = effectScope(true)
      state = scope.run(composable)
    }
    onScopeDispose(dispose)
    return state as T
  }
}
