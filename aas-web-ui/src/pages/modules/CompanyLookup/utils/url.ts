import { hasContent } from '@/utils/StringUtils'

// Todo: regex import { urlRegex } from '@/composables/UrlUtils' does not allow localhost
export const urlRegexWithLocalhost = /^(?:(?:https?|ftp):)?\/\/(?:\S+@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])|localhost|(?:(?:[a-z0-9\u00A1-\uFFFF][\w\u00A1-\uFFFF-]{0,62})?[a-z0-9\u00A1-\uFFFF]\.)+[a-z\u00A1-\uFFFF]{2,}\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

export function validateURL (url?: string): boolean {
  try {
    const raw = url?.trim()
    if (!hasContent(raw)) {
      return false
    }
    const u = new URL(raw)
    return ['http:', 'https:'].includes(u.protocol) && urlRegexWithLocalhost.test(raw)
  } catch {
    return false
  }
}
