import { useMutation } from '@tanstack/vue-query'
import { hasContent, stripLastCharacter } from '@/../shared/utils/StringUtils'
import { useRequestHandling } from '@/composables/RequestHandling'
import { COMPANY_LOOKUP_ENDPOINT_PATHS, CONTEXT } from '../constants/api'

/**
 * Tests connectivity to a Company Lookup base URL by calling `{base}/description`.
 */
export function useTestConnection () {
  const { getRequest } = useRequestHandling()

  return useMutation({
    mutationFn: async (rawUrl: string): Promise<void> => {
      const url = getDescriptionEndpointUrl(rawUrl)
      if (!hasContent(url)) {
        throw new Error('Invalid URL')
      }

      // Silence the global snackbar
      const response = await getRequest(url, CONTEXT.GET_DESCRIPTION, true)

      if (!response?.success) {
        throw new Error(`Connection failed${response?.status ? ` (HTTP ${response.status})` : ''}`)
      }
    },
  })
}

function getDescriptionEndpointUrl (raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!hasContent(trimmed)) {
    return undefined
  }

  const withoutSlash = trimmed.endsWith('/') ? stripLastCharacter(trimmed) : trimmed
  return withoutSlash.endsWith(COMPANY_LOOKUP_ENDPOINT_PATHS.DESCRIPTION)
    ? withoutSlash
    : `${withoutSlash}${COMPANY_LOOKUP_ENDPOINT_PATHS.DESCRIPTION}`
}
