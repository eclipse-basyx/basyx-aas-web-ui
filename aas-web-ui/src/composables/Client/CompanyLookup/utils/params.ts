import type { CompanyLookupQueryParameters } from '../types/api'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { hasContent } from '@/utils/StringUtils'

export function buildQueryParams (params?: CompanyLookupQueryParameters): URLSearchParams {
  const qp = new URLSearchParams()
  if (!params) {
    return qp
  }

  const { limit, cursor, name, assetId } = params

  if (limit !== undefined && limit > 0) {
    qp.set('limit', String(limit))
  }
  if (hasContent(cursor)) {
    qp.set('cursor', cursor)
  }
  if (hasContent(name)) {
    qp.set('name', base64Encode(name))
  }
  if (hasContent(assetId)) {
    qp.set('assetId', assetId)
  }

  return qp
}
