import { hasContent, stripLastCharacter } from '@/utils/StringUtils'

export function normalizeBaseUrl (url: string, endpoint: string): string | undefined {
  const raw = url.trim()
  if (!hasContent(raw)) {
    return undefined
  }

  const trimmed = raw.endsWith('/') ? stripLastCharacter(raw) : raw
  return trimmed.endsWith(endpoint) ? trimmed : `${trimmed}${endpoint}`
}

/**
 * Removes `suffix` from the end of `url` if it ends with it, otherwise returns `url` unchanged.
 * @param url url
 * @param suffix suffix to remove
 * @returns updated url
 */
export function stripLastSegmentOf (url: string, suffix?: string): string {
  if (!suffix) {
    return url
  }
  const trimmed = url.endsWith('/') ? url.slice(0, -1) : url
  return trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed
}

/**
 * Normalizes a configured endpoint URL or path for comparison by trimming
 * whitespace and removing trailing slashes.
 * @param url endpoint URL or path
 * @returns normalized value, or an empty string when no value is given
 */
export function normalizeEndpointUrl (url: string | undefined): string {
  return url?.trim().replace(/\/+$/, '') ?? ''
}
