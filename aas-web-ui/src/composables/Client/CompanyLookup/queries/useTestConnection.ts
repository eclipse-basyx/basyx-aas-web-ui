import { useMutation } from '@tanstack/vue-query'
import { useRequestHandling } from '@/composables/RequestHandling'
import { hasContent } from '@/utils/StringUtils'
import { normalizeBaseUrl } from '@/utils/url'
import { COMPANY_LOOKUP_ENDPOINT_PATHS, CONTEXT } from '../constants/api'

/**
 * Tests connectivity to a Company Lookup base URL by calling `{base}/description`.
 */
export function useTestConnection () {
  const { getRequest } = useRequestHandling()

  return useMutation({
    mutationFn: async (rawUrl: string): Promise<void> => {
      const url = normalizeBaseUrl(rawUrl, COMPANY_LOOKUP_ENDPOINT_PATHS.DESCRIPTION)
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
