import type { CatenaXEdcQueryResult, CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
import { EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

/**
 * The EDC returns at most `limit` resources per query, 50 without a limit.
 * Lists load page by page; filters evaluated in the browser and lookups across all resources load all pages.
 */

/** One page of a list, `search` filters by a part of the ID */
export interface EdcListPage {
  offset: number
  limit: number
  search?: string
}

/** A page of resources. `hasMore: false` marks a complete list, e.g. of a filter evaluated in the browser */
export type EdcPageResult<T> = CatenaXEdcQueryResult<T> & { hasMore?: boolean }

/** Sends the given query spec to the EDC, e.g. `querySpec => queryAssets(proxyId, { querySpec })` */
export type EdcQuery<T> = (querySpec: CatenaXEdcQuerySpec) => Promise<CatenaXEdcQueryResult<T>>

export interface EdcQueryOptions {
  filter?: CatenaXEdcQuerySpec // e.g. the asset type, combined with the search
  search?: string
  idOperand?: string
}

// The ID of an asset is one of its properties, contract and policy definitions have it as a field
export const EDC_ASSET_ID_OPERAND = `${EDC_NAMESPACE}id`
const EDC_ID_OPERAND = 'id'

const allPagesLimit = 500
const maxAllPages = 100

/**
 * Builds a query spec sorted by ID. The search matches a part of the ID, ignoring case (`ilike`).
 */
export function edcQuerySpec (
  { filter, search, idOperand = EDC_ID_OPERAND }: EdcQueryOptions,
  offset: number,
  limit: number,
): CatenaXEdcQuerySpec {
  const searchText = search?.trim()
  const filterExpression = [
    ...[filter?.filterExpression ?? []].flat(),
    ...(searchText ? [{ '@type': 'Criterion', 'operandLeft': idOperand, 'operator': 'ilike', 'operandRight': `%${searchText}%` }] : []),
  ]

  return {
    '@context': { '@vocab': EDC_NAMESPACE },
    '@type': 'QuerySpec',
    offset,
    limit,
    'sortField': 'id',
    'sortOrder': 'ASC',
    ...(filterExpression.length > 0 ? { filterExpression } : {}),
  }
}

/**
 * Queries one page of a list. A full page means there may be more.
 */
export async function queryEdcPage<T> (
  query: EdcQuery<T>,
  page: EdcListPage,
  options: Omit<EdcQueryOptions, 'search'> = {},
): Promise<EdcPageResult<T>> {
  const result = await query(edcQuerySpec({ ...options, search: page.search }, page.offset, page.limit))
  return result.success ? { ...result, hasMore: result.data.length >= page.limit } : result
}

/**
 * Queries all pages, e.g. for a filter evaluated in the browser or for all contracts referencing an asset.
 */
export async function queryAllEdcPages<T> (query: EdcQuery<T>, options: EdcQueryOptions = {}): Promise<EdcPageResult<T>> {
  const resources: T[] = []

  for (let page = 0; page < maxAllPages; page++) {
    const result = await query(edcQuerySpec(options, page * allPagesLimit, allPagesLimit))
    if (!result.success) {
      return result
    }

    resources.push(...result.data)
    if (result.data.length < allPagesLimit) {
      return { success: true, data: resources, hasMore: false }
    }
  }

  // Also stops an EDC that ignores the offset and returns the same page again and again
  return { success: false, details: `The EDC returned more than ${maxAllPages * allPagesLimit} resources.` }
}
