/** Accept only an HTTP(S) origin, without credentials, path, query, or fragment. */
export function parseTrustedOrigin (value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  try {
    const url = new URL(value.trim())
    if (
      !['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash
    ) {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}
