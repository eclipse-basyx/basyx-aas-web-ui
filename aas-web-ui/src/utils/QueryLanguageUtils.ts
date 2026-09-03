import type { ServiceDescription } from '@/types/BaSyx'
import type { QueryLanguageQuery, QueryTarget } from '@/types/QueryLanguage'

const QUERY_PROFILE_SUFFIXES: Record<QueryTarget, string> = {
  'aas-repository': '/AssetAdministrationShellRepositoryServiceSpecification/SSP-003',
  'aas-registry': '/AssetAdministrationShellRegistryServiceSpecification/SSP-004',
  'submodel-repository': '/SubmodelRepositoryServiceSpecification/SSP-005',
}

const QUERY_RESOURCE_PATHS: Record<QueryTarget, { collection: string, query: string }> = {
  'aas-repository': { collection: 'shells', query: 'query/shells' },
  'aas-registry': { collection: 'shell-descriptors', query: 'query/shell-descriptors' },
  'submodel-repository': { collection: 'submodels', query: 'query/submodels' },
}

const ALLOWED_FIELD_ROOTS: Record<QueryTarget, string[]> = {
  'aas-repository': ['$aas'],
  'aas-registry': ['$aasdesc', '$smdesc'],
  'submodel-repository': ['$sm', '$sme'],
}

const QUICK_SEARCH_FIELDS: Record<QueryTarget, string[]> = {
  'aas-repository': [
    '$aas#id',
    '$aas#idShort',
    '$aas#assetInformation.globalAssetId',
    '$aas#assetInformation.specificAssetIds[].value',
  ],
  'aas-registry': [
    '$aasdesc#id',
    '$aasdesc#idShort',
    '$aasdesc#globalAssetId',
    '$aasdesc#specificAssetIds[].value',
  ],
  'submodel-repository': [
    '$sm#id',
    '$sm#idShort',
    '$sm#semanticId.keys[].value',
    '$sm#supplementalSemanticIds[].keys[].value',
  ],
}

export interface QueryContextValidation {
  isValid: boolean
  message: string
  query?: QueryLanguageQuery
}

export function supportsQueryProfile (
  description: ServiceDescription | null | undefined,
  target: QueryTarget,
): boolean {
  if (!Array.isArray(description?.profiles)) {
    return false
  }

  const suffix = QUERY_PROFILE_SUFFIXES[target]
  return description.profiles.some(profile => {
    if (typeof profile !== 'string') {
      return false
    }
    const normalized = profile.trim().replace(/\/$/, '')
    return normalized.startsWith('https://admin-shell.io/aas/API/3/') && normalized.endsWith(suffix)
  })
}

export function buildQueryEndpoint (baseUrl: string, target: QueryTarget): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (trimmed === '') {
    return ''
  }

  const paths = QUERY_RESOURCE_PATHS[target]
  const querySuffix = `/${paths.query}`
  if (trimmed.endsWith(querySuffix)) {
    return trimmed
  }

  const collectionSuffix = `/${paths.collection}`
  const serviceRoot = trimmed.endsWith(collectionSuffix)
    ? trimmed.slice(0, -collectionSuffix.length)
    : trimmed

  return `${serviceRoot}${querySuffix}`
}

export function escapeRegexLiteral (value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

export function buildQuickSearchQuery (
  target: QueryTarget,
  searchValue: string,
): QueryLanguageQuery | undefined {
  const search = searchValue.trim()
  if (search === '') {
    return undefined
  }

  const regex = `(?i)${escapeRegexLiteral(search)}`
  return {
    $condition: {
      $or: QUICK_SEARCH_FIELDS[target].map(field => ({
        $regex: [
          { $field: field },
          { $strVal: regex },
        ],
      })),
    },
  }
}

export function createQueryExample (target: QueryTarget): string {
  const field = target === 'aas-repository'
    ? '$aas#idShort'
    : (target === 'aas-registry'
        ? '$aasdesc#idShort'
        : '$sm#idShort')

  return JSON.stringify({
    $condition: {
      $contains: [
        { $field: field },
        { $strVal: 'Example' },
      ],
    },
  }, null, 2)
}

export function validateQueryForTarget (queryText: string, target: QueryTarget): QueryContextValidation {
  let parsed: unknown
  try {
    parsed = JSON.parse(queryText)
  } catch {
    return { isValid: false, message: 'The query must contain valid JSON.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, message: 'The query must be a JSON object.' }
  }

  const query = parsed as QueryLanguageQuery
  if (!query.$condition || typeof query.$condition !== 'object' || Array.isArray(query.$condition)) {
    return { isValid: false, message: 'The query must contain a $condition object.' }
  }
  if (query.$select === 'id') {
    return { isValid: false, message: '$select: "id" cannot be used because this view needs complete objects.' }
  }

  const invalidFields = collectFieldValues(query)
    .filter(field => !isAllowedField(field, ALLOWED_FIELD_ROOTS[target]))
  if (invalidFields.length > 0) {
    return {
      isValid: false,
      message: `Field ${invalidFields[0]} is not valid for this query target. Allowed roots: ${ALLOWED_FIELD_ROOTS[target].join(', ')}.`,
    }
  }

  return { isValid: true, message: '', query }
}

function collectFieldValues (value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => collectFieldValues(item))
  }
  if (!value || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const fields = [record.$field, record.$fragment]
    .filter((field): field is string => typeof field === 'string')
  return fields.concat(Object.values(record).flatMap(item => collectFieldValues(item)))
}

function isAllowedField (field: string, roots: string[]): boolean {
  return roots.some(root =>
    field === root
    || field.startsWith(`${root}#`)
    || field.startsWith(`${root}.`)
    || field.startsWith(`${root}(`),
  )
}
