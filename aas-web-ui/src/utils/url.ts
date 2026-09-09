import { hasContent, stripLastCharacter } from '@/utils/StringUtils'

export function normalizeBaseUrl (url: string, endpoint: string): string | undefined {
  const raw = url.trim()
  if (!hasContent(raw)) {
    return undefined
  }

  const trimmed = raw.endsWith('/') ? stripLastCharacter(raw) : raw
  return trimmed.endsWith(endpoint) ? trimmed : `${trimmed}${endpoint}`
}
