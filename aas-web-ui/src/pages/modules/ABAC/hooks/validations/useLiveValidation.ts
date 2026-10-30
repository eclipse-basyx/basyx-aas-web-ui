import type { JsonErrorMessage } from '../../types/json'

interface ValidationResult<Payload> {
  payload: Payload | null
  error: JsonErrorMessage | null
}

/**
 * Debounces local diagnostics while keeping save failures separate. A usable
 * payload with diagnostics is advisory; a missing payload blocks submission.
 * Keep local diagnostics visible until the next result to avoid typing flicker.
 * Submission cancels the debounce and validates the latest input immediately.
 */
export function useLiveValidation<Input, Payload> (options: {
  enabled: () => boolean
  input: () => Input
  validate: (input: Input) => ValidationResult<Payload>
}) {
  const blockingError = shallowRef<JsonErrorMessage | null>(null)
  const advisory = shallowRef<JsonErrorMessage | null>(null)
  const saveError = shallowRef<JsonErrorMessage | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  const error = computed(() => blockingError.value ?? saveError.value)
  const errorPaths = computed(() => [...(blockingError.value?.paths ?? []), ...(saveError.value?.paths ?? [])])

  watch([options.enabled, options.input], ([enabled]) => {
    cancelPending()
    saveError.value = null
    if (enabled) {
      timer = setTimeout(validateNow, 300)
    } else {
      blockingError.value = null
      advisory.value = null
    }
  }, { immediate: true, flush: 'sync' })

  onScopeDispose(cancelPending)

  function cancelPending (): void {
    clearTimeout(timer)
    timer = undefined
  }

  function validateNow (): ValidationResult<Payload> {
    cancelPending()
    const result = options.validate(options.input())
    blockingError.value = result.payload === null ? result.error : null
    advisory.value = result.payload === null ? null : result.error
    return result
  }

  return { error, errorPaths, advisory, saveError, validateNow }
}
