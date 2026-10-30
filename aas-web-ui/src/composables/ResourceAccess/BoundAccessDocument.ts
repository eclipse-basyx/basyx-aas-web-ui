import type { AccessDocument } from '@/types/ResourceAccess'

/**
 * Holds the access document of one object with its ETag and the key of the
 * object it was loaded for. Only the latest request may set it, so a late
 * response for another object never replaces it, and changes are only sent
 * for the object the document belongs to.
 */
export function useBoundAccessDocument () {
  const document = ref<AccessDocument>()
  const etag = ref('')
  const boundKey = ref('')
  let latest = 0

  /** Starts a request and returns its number. */
  function begin (): number {
    latest++
    return latest
  }

  function isLatest (request: number): boolean {
    return request === latest
  }

  /** Stores the response of a request unless a newer request started. */
  function accept (request: number, key: string, next: AccessDocument | undefined, nextEtag = ''): boolean {
    if (!isLatest(request)) {
      return false
    }
    document.value = next
    etag.value = next ? nextEtag : ''
    boundKey.value = next ? key : ''
    return true
  }

  function boundTo (key: string): boolean {
    return Boolean(document.value) && boundKey.value === key
  }

  /** Forgets the document and ignores all pending responses. */
  function clear (): void {
    latest++
    document.value = undefined
    etag.value = ''
    boundKey.value = ''
  }

  return { document, etag, begin, isLatest, accept, boundTo, clear }
}
