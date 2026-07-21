import { onScopeDispose, ref, type Ref, watch } from 'vue'

/**
 * Creates a debounced version of an existing Ref that delays updating its value
 * until after the specified delay time has elapsed since the last source change.
 * Useful for throttling expensive side effects (like API calls) triggered by rapid
 * reactive changes, such as user keystrokes bound to `v-model`.
 *
 * @param source - The original source Ref to watch for changes
 * @param delayMs - The number of milliseconds to delay the update (default: 400)
 * @returns A new read-write Ref containing the debounced value
 *
 * @example
 * const search = ref('');
 * const debouncedSearch = debouncedRef(search, 500);
 * Watch the debounced ref instead of the raw input to prevent spamming your backend
 * watch(debouncedSearch, (newQuery) => { fetchResults(newQuery); });
 */
export function debouncedRef<T> (source: Ref<T>, delayMs = 400): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout> | undefined

  const stop = watch(source, val => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      debounced.value = val
    }, delayMs)
  })

  onScopeDispose(() => {
    if (timeout) {
      clearTimeout(timeout)
    }
    stop()
  })

  return debounced
}
