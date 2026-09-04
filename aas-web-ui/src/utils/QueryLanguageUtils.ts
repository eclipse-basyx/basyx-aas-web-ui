import type { ServiceDescription } from '@/types/BaSyx'
import type { InfrastructureTemplate } from '@/types/Infrastructure'
import type {
  ParsedQuerySearchExpression,
  QueryFilter,
  QueryFilterFieldDefinition,
  QueryFilterMatchMode,
  QueryFilterOperator,
  QueryLanguageQuery,
  QueryTarget,
} from '@/types/QueryLanguage'

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

const MONO_AAS_REPOSITORY_FIELD_ROOTS = ['$aas', '$sm', '$sme']

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
    '$sme#idShort',
    '$sme#value',
    '$sme#semanticId.keys[].value',
    '$sme#supplementalSemanticIds[].keys[].value',
  ],
}

const TEXT_FILTER_OPERATORS: QueryFilterOperator[] = [
  'contains',
  'equals',
  'not-equals',
  'starts-with',
  'ends-with',
  'regex',
]

const ENUM_FILTER_OPERATORS: QueryFilterOperator[] = ['equals', 'not-equals']

const ASSET_KIND_OPTIONS = [
  { title: 'Instance', value: 'Instance' },
  { title: 'Type', value: 'Type' },
  { title: 'Role', value: 'Role' },
  { title: 'Not Applicable', value: 'NotApplicable' },
]

const QUERY_FILTER_FIELDS: Record<QueryTarget, QueryFilterFieldDefinition[]> = {
  'aas-repository': [
    createField('id', 'AAS ID', '$aas#id'),
    createField('idShort', 'ID Short', '$aas#idShort'),
    createField('assetKind', 'Asset Kind', '$aas#assetInformation.assetKind', ENUM_FILTER_OPERATORS, ASSET_KIND_OPTIONS),
    createField('assetType', 'Asset Type', '$aas#assetInformation.assetType'),
    createField('globalAssetId', 'Global Asset ID', '$aas#assetInformation.globalAssetId'),
    createField('specificAssetId', 'Specific Asset ID value', '$aas#assetInformation.specificAssetIds[].value'),
  ],
  'aas-registry': [
    createField('id', 'AAS ID', '$aasdesc#id'),
    createField('idShort', 'ID Short', '$aasdesc#idShort'),
    createField('assetKind', 'Asset Kind', '$aasdesc#assetKind', ENUM_FILTER_OPERATORS, ASSET_KIND_OPTIONS),
    createField('assetType', 'Asset Type', '$aasdesc#assetType'),
    createField('globalAssetId', 'Global Asset ID', '$aasdesc#globalAssetId'),
    createField('specificAssetId', 'Specific Asset ID value', '$aasdesc#specificAssetIds[].value'),
  ],
  'submodel-repository': [
    createField('id', 'Submodel ID', '$sm#id'),
    createField('idShort', 'ID Short', '$sm#idShort'),
    createField('semanticId', 'Semantic ID value', '$sm#semanticId.keys[].value'),
    createField('supplementalSemanticId', 'Supplemental Semantic ID value', '$sm#supplementalSemanticIds[].keys[].value'),
  ],
}

export const QUERY_FILTER_OPERATOR_LABELS: Record<QueryFilterOperator, string> = {
  'contains': 'contains',
  'equals': 'equals',
  'not-equals': 'does not equal',
  'starts-with': 'starts with',
  'ends-with': 'ends with',
  'regex': 'matches regex',
}

export interface QueryContextValidation {
  isValid: boolean
  message: string
  query?: QueryLanguageQuery
}

export type AasQuerySource = 'registry' | 'repository'

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
  const fieldConditions = QUICK_SEARCH_FIELDS[target].map(field => ({
    $regex: [
      { $field: field },
      { $strVal: regex },
    ],
  }))
  return {
    $condition: {
      $or: target === 'submodel-repository'
        ? fieldConditions.map(condition => ({ $match: [condition] }))
        : fieldConditions,
    },
  }
}

export function resolveAasQueryTarget (
  infrastructureTemplate: InfrastructureTemplate,
  activeSource: AasQuerySource | undefined,
  repositoryAvailable: boolean,
  registryAvailable: boolean,
): QueryTarget {
  const isMonoInfrastructure = infrastructureTemplate === 'mono-repo' || infrastructureTemplate === 'mono-all'
  if (isMonoInfrastructure && repositoryAvailable) {
    return 'aas-repository'
  }

  if (activeSource === 'repository' && repositoryAvailable) {
    return 'aas-repository'
  }
  if (activeSource === 'registry' && registryAvailable) {
    return 'aas-registry'
  }
  if (registryAvailable) {
    return 'aas-registry'
  }
  if (repositoryAvailable) {
    return 'aas-repository'
  }

  return activeSource === 'registry' ? 'aas-registry' : 'aas-repository'
}

export function getQueryFilterFields (target: QueryTarget): QueryFilterFieldDefinition[] {
  return QUERY_FILTER_FIELDS[target]
}

export function parseQuerySearchExpression (
  target: QueryTarget,
  expression: string,
): ParsedQuerySearchExpression {
  const fields = QUERY_FILTER_FIELDS[target]
  const filters: QueryFilter[] = []
  const textParts: string[] = []
  const tokenPattern = /(?:^|\s)(-?)([a-z][a-z0-9]*)(:|!=|=)(?:"((?:\\.|[^"])*)"|(\S*))/gi
  let incompleteField: QueryFilterFieldDefinition['key'] | undefined
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(expression)) !== null) {
    const field = fields.find(candidate => candidate.key.toLowerCase() === match![2].toLowerCase())
    if (!field) {
      continue
    }

    textParts.push(expression.slice(lastIndex, match.index))
    lastIndex = tokenPattern.lastIndex

    const quotedValue = match[4]
    const rawValue = quotedValue ?? match[5] ?? ''
    const value = quotedValue === undefined
      ? rawValue
      : rawValue.replace(/\\([\\"])/g, '$1')

    if (value.trim() === '' || (quotedValue === undefined && value.startsWith('"'))) {
      incompleteField = field.key
      continue
    }

    const separator = match[3]
    const operator: QueryFilterOperator = match[1] === '-' || separator === '!='
      ? 'not-equals'
      : (separator === '=' || field.valueOptions ? 'equals' : 'contains')
    filters.push({
      id: `search-filter-${filters.length}-${field.key}`,
      field: field.key,
      operator,
      value,
    })
  }

  textParts.push(expression.slice(lastIndex))
  return {
    text: textParts.join('').trim().replace(/\s+/g, ' '),
    filters,
    incompleteField,
  }
}

export function createQueryFilter (target: QueryTarget, id: string): QueryFilter {
  const field = QUERY_FILTER_FIELDS[target][0]
  return {
    id,
    field: field.key,
    operator: field.operators[0],
    value: field.valueOptions?.[0]?.value ?? '',
  }
}

export function buildStructuredSearchQuery (
  target: QueryTarget,
  searchValue: string,
  filters: QueryFilter[],
  matchMode: QueryFilterMatchMode,
): QueryLanguageQuery | undefined {
  const conditions: Array<Record<string, unknown>> = []
  const quickQuery = buildQuickSearchQuery(target, searchValue)
  if (quickQuery) {
    conditions.push(quickQuery.$condition)
  }

  const filterConditions = filters
    .map(filter => buildQueryFilterCondition(target, filter))
    .filter((condition): condition is Record<string, unknown> => condition !== undefined)

  if (filterConditions.length === 1) {
    conditions.push(filterConditions[0])
  } else if (filterConditions.length > 1) {
    conditions.push({ [matchMode === 'all' ? '$and' : '$or']: filterConditions })
  }

  if (conditions.length === 0) {
    return undefined
  }
  if (conditions.length === 1) {
    return { $condition: conditions[0] }
  }
  return { $condition: { $and: conditions } }
}

export function formatQueryFilter (target: QueryTarget, filter: QueryFilter): string {
  const field = QUERY_FILTER_FIELDS[target].find(candidate => candidate.key === filter.field)
  const optionLabel = field?.valueOptions?.find(option => option.value === filter.value)?.title
  return `${field?.label ?? filter.field} ${QUERY_FILTER_OPERATOR_LABELS[filter.operator]} ${optionLabel ?? filter.value}`
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

export function validateQueryForTarget (
  queryText: string,
  target: QueryTarget,
  infrastructureTemplate?: InfrastructureTemplate,
): QueryContextValidation {
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

  const allowedConditionRoots = getAllowedConditionFieldRoots(target, infrastructureTemplate)
  const invalidConditionField = collectStringProperties(query.$condition, '$field')
    .find(field => !isAllowedField(field, allowedConditionRoots))
  if (invalidConditionField) {
    const invalidRoot = invalidConditionField.split(/[.#(]/, 1)[0]
    const monoRootHint = target === 'aas-repository' && ['$sm', '$sme'].includes(invalidRoot)
      ? ' $sm and $sme roots for /query/shells are only available with mono-repo or mono-all infrastructures.'
      : ''
    return {
      isValid: false,
      message: `Field ${invalidConditionField} is not valid for this query target. Allowed roots: ${allowedConditionRoots.join(', ')}.${monoRootHint}`,
    }
  }

  const allowedFilterRoots = ALLOWED_FIELD_ROOTS[target]
  const invalidFilterField = collectStringProperties(query.$filters, '$field')
    .find(field => !isAllowedField(field, allowedFilterRoots))
  const invalidFragment = collectStringProperties(query.$filters, '$fragment')
    .find(fragment => !isAllowedField(fragment, allowedFilterRoots))
  const invalidFilterValue = invalidFragment ?? invalidFilterField
  if (invalidFilterValue) {
    const role = invalidFragment ? 'Fragment' : 'Filter field'
    const hierarchyHint = target === 'aas-repository'
      ? ' $sm and $sme roots may only be used in the top-level condition for this endpoint.'
      : ''
    return {
      isValid: false,
      message: `${role} ${invalidFilterValue} is not valid for this query target. Allowed filter roots: ${allowedFilterRoots.join(', ')}.${hierarchyHint}`,
    }
  }

  return { isValid: true, message: '', query }
}

function getAllowedConditionFieldRoots (
  target: QueryTarget,
  infrastructureTemplate?: InfrastructureTemplate,
): string[] {
  if (
    target === 'aas-repository'
    && (infrastructureTemplate === 'mono-repo' || infrastructureTemplate === 'mono-all')
  ) {
    return MONO_AAS_REPOSITORY_FIELD_ROOTS
  }

  return ALLOWED_FIELD_ROOTS[target]
}

function collectStringProperties (value: unknown, property: '$field' | '$fragment'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => collectStringProperties(item, property))
  }
  if (!value || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const values = typeof record[property] === 'string' ? [record[property]] : []
  return values.concat(Object.values(record).flatMap(item => collectStringProperties(item, property)))
}

function isAllowedField (field: string, roots: string[]): boolean {
  return roots.some(root =>
    field === root
    || field.startsWith(`${root}#`)
    || field.startsWith(`${root}.`)
    || field.startsWith(`${root}(`),
  )
}

function createField (
  key: QueryFilterFieldDefinition['key'],
  label: string,
  path: string,
  operators: QueryFilterOperator[] = TEXT_FILTER_OPERATORS,
  valueOptions?: QueryFilterFieldDefinition['valueOptions'],
): QueryFilterFieldDefinition {
  return { key, label, path, operators, valueOptions }
}

function buildQueryFilterCondition (
  target: QueryTarget,
  filter: QueryFilter,
): Record<string, unknown> | undefined {
  const field = QUERY_FILTER_FIELDS[target].find(candidate => candidate.key === filter.field)
  const value = filter.value.trim()
  if (!field || !field.operators.includes(filter.operator) || value === '') {
    return undefined
  }

  const fieldOperand = { $field: field.path }
  const stringOperand = { $strVal: value }
  if (filter.operator === 'equals') {
    return { $eq: [fieldOperand, stringOperand] }
  }
  if (filter.operator === 'not-equals') {
    return { $not: { $eq: [fieldOperand, stringOperand] } }
  }
  if (filter.operator === 'regex') {
    return { $regex: [fieldOperand, stringOperand] }
  }

  const escaped = escapeRegexLiteral(value)
  const expression = filter.operator === 'starts-with'
    ? `(?i)^${escaped}`
    : (filter.operator === 'ends-with' ? `(?i)${escaped}$` : `(?i)${escaped}`)
  return { $regex: [fieldOperand, { $strVal: expression }] }
}
