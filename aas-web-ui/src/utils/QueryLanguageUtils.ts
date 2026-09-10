import type { ServiceDescription } from '@/types/BaSyx'
import type { InfrastructureTemplate } from '@/types/Infrastructure'
import type {
  AasSearchScope,
  ParsedQuerySearchExpression,
  QueryFilter,
  QueryFilterFieldDefinition,
  QueryFilterMatchMode,
  QueryFilterOperator,
  QueryLanguageQuery,
  QueryTarget,
} from '@/types/QueryLanguage'

const BASYX_QUERY_SERVICE_PATHS: Record<QueryTarget, string> = {
  'aas-repository': 'AssetAdministrationShellRepositoryServiceSpecification/',
  'aas-registry': 'AssetAdministrationShellRegistryServiceSpecification/',
  'submodel-repository': 'SubmodelRepositoryService/',
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

const AAS_QUICK_SEARCH_FIELDS = [
  '$aas#id',
  '$aas#idShort',
  '$aas#assetInformation.globalAssetId',
  '$aas#assetInformation.specificAssetIds[].value',
]

const SUBMODEL_QUICK_SEARCH_FIELDS = [
  '$sm#id',
  '$sm#idShort',
  '$sm#semanticId.keys[].value',
  '$sm#supplementalSemanticIds[].keys[].value',
  '$sme#idShort',
  '$sme#value',
  '$sme#semanticId.keys[].value',
  '$sme#supplementalSemanticIds[].keys[].value',
]

const QUICK_SEARCH_FIELDS: Record<QueryTarget, string[]> = {
  'aas-repository': AAS_QUICK_SEARCH_FIELDS,
  'aas-registry': [
    '$aasdesc#id',
    '$aasdesc#idShort',
    '$aasdesc#globalAssetId',
    '$aasdesc#specificAssetIds[].value',
  ],
  'submodel-repository': SUBMODEL_QUICK_SEARCH_FIELDS,
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

const SUBMODEL_ELEMENT_FILTER_FIELDS: QueryFilterFieldDefinition[] = [
  createField('smeIdShort', 'Submodel Element ID Short', '$sme#idShort'),
  createField('smeValue', 'Submodel Element value', '$sme#value'),
  createField('smeSemanticId', 'Submodel Element Semantic ID value', '$sme#semanticId.keys[].value'),
  createField('smeSupplementalSemanticId', 'Submodel Element Supplemental Semantic ID value', '$sme#supplementalSemanticIds[].keys[].value'),
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
    ...SUBMODEL_ELEMENT_FILTER_FIELDS,
  ],
}

const AAS_ENVIRONMENT_FILTER_FIELDS: QueryFilterFieldDefinition[] = [
  createField('smId', 'Submodel ID', '$sm#id'),
  createField('smIdShort', 'Submodel ID Short', '$sm#idShort'),
  createField('smSemanticId', 'Submodel Semantic ID value', '$sm#semanticId.keys[].value'),
  createField('smSupplementalSemanticId', 'Submodel Supplemental Semantic ID value', '$sm#supplementalSemanticIds[].keys[].value'),
  ...SUBMODEL_ELEMENT_FILTER_FIELDS,
]

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

  const servicePath = BASYX_QUERY_SERVICE_PATHS[target]
  return description.profiles.some(profile => {
    if (typeof profile !== 'string') {
      return false
    }

    const normalized = profile.trim().replace(/\/$/, '')
    const match = normalized.match(/^https:\/\/basyx\.org\/aas\/API\/(\d+)\/(\d+)\/(.+)$/)
    if (!match) {
      return false
    }

    const major = Number(match[1])
    const minor = Number(match[2])
    const isAas32OrNewer = major > 3 || (major === 3 && minor >= 2)
    return isAas32OrNewer && match[3].startsWith(servicePath)
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
  infrastructureTemplate?: InfrastructureTemplate,
): QueryLanguageQuery | undefined {
  const search = searchValue.trim()
  if (search === '') {
    return undefined
  }

  const regex = `(?i)${escapeRegexLiteral(search)}`
  const fields = isAasEnvironmentQuery(target, infrastructureTemplate)
    ? [...QUICK_SEARCH_FIELDS[target], ...SUBMODEL_QUICK_SEARCH_FIELDS]
    : QUICK_SEARCH_FIELDS[target]
  const fieldConditions = fields.map(field => ({
    $regex: [
      { $field: field },
      { $strVal: regex },
    ],
  }))
  return {
    $condition: {
      $or: target === 'submodel-repository' || isAasEnvironmentQuery(target, infrastructureTemplate)
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
  searchScope: AasSearchScope = 'registry',
): QueryTarget {
  if (infrastructureTemplate === 'mono-all') {
    return searchScope === 'repository' ? 'aas-repository' : 'aas-registry'
  }

  if (activeSource === 'repository') {
    return 'aas-repository'
  }
  if (activeSource === 'registry') {
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

export function getQueryFilterFields (
  target: QueryTarget,
  infrastructureTemplate?: InfrastructureTemplate,
): QueryFilterFieldDefinition[] {
  return isAasEnvironmentQuery(target, infrastructureTemplate)
    ? [...QUERY_FILTER_FIELDS[target], ...AAS_ENVIRONMENT_FILTER_FIELDS]
    : QUERY_FILTER_FIELDS[target]
}

export function parseQuerySearchExpression (
  target: QueryTarget,
  expression: string,
  infrastructureTemplate?: InfrastructureTemplate,
): ParsedQuerySearchExpression {
  const fields = getQueryFilterFields(target, infrastructureTemplate)
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

export function formatQueryFilterExpression (filter: QueryFilter): string {
  const separators: Partial<Record<QueryFilterOperator, string>> = {
    'contains': ':',
    'equals': '=',
    'not-equals': '!=',
  }
  const separator = separators[filter.operator]
  if (!separator) {
    throw new Error(`Filter operator ${filter.operator} does not have a symbolic search representation.`)
  }
  return `${filter.field}${separator}${quoteQueryFilterValue(filter.value)}`
}

export function createQueryFilter (
  target: QueryTarget,
  id: string,
  infrastructureTemplate?: InfrastructureTemplate,
): QueryFilter {
  const field = getQueryFilterFields(target, infrastructureTemplate)[0]
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
  infrastructureTemplate?: InfrastructureTemplate,
): QueryLanguageQuery | undefined {
  const conditions: Array<Record<string, unknown>> = []
  const quickQuery = buildQuickSearchQuery(target, searchValue, infrastructureTemplate)
  if (quickQuery) {
    conditions.push(quickQuery.$condition)
  }

  const builtFilters = filters
    .map(filter => buildQueryFilterCondition(target, filter, infrastructureTemplate))
    .filter((filter): filter is BuiltQueryFilter => filter !== undefined)

  if (builtFilters.length > 0) {
    if (matchMode === 'all') {
      const positiveConditions = builtFilters
        .filter(filter => !filter.excludes)
        .map(filter => filter.condition)
      if (positiveConditions.length > 0) {
        conditions.push({ $match: positiveConditions })
      }
      conditions.push(...builtFilters
        .filter(filter => filter.excludes)
        .map(filter => ({ $not: { $match: [filter.condition] } })))
    } else {
      const alternatives = builtFilters.map(filter => filter.excludes
        ? { $not: { $match: [filter.condition] } }
        : { $match: [filter.condition] })
      conditions.push(alternatives.length === 1 ? alternatives[0] : { $or: alternatives })
    }
  }

  if (conditions.length === 0) {
    return undefined
  }
  if (conditions.length === 1) {
    return { $condition: conditions[0] }
  }
  return { $condition: { $and: conditions } }
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
      ? ' $sm and $sme roots for /query/shells are only available with mono-all infrastructures.'
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
    && infrastructureTemplate === 'mono-all'
  ) {
    return MONO_AAS_REPOSITORY_FIELD_ROOTS
  }

  return ALLOWED_FIELD_ROOTS[target]
}

function isAasEnvironmentQuery (
  target: QueryTarget,
  infrastructureTemplate?: InfrastructureTemplate,
): boolean {
  return target === 'aas-repository' && infrastructureTemplate === 'mono-all'
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

function quoteQueryFilterValue (value: string): string {
  return /[\s"\\]/.test(value)
    ? `"${value.replace(/[\\"]/g, String.raw`\$&`)}"`
    : value
}

interface BuiltQueryFilter {
  condition: Record<string, unknown>
  excludes: boolean
}

function buildQueryFilterCondition (
  target: QueryTarget,
  filter: QueryFilter,
  infrastructureTemplate?: InfrastructureTemplate,
): BuiltQueryFilter | undefined {
  const field = getQueryFilterFields(target, infrastructureTemplate)
    .find(candidate => candidate.key === filter.field)
  const value = filter.value.trim()
  if (!field || !field.operators.includes(filter.operator) || value === '') {
    return undefined
  }

  const fieldOperand = { $field: field.path }
  const stringOperand = { $strVal: value }
  if (filter.operator === 'equals') {
    return { condition: { $eq: [fieldOperand, stringOperand] }, excludes: false }
  }
  if (filter.operator === 'not-equals') {
    return { condition: { $eq: [fieldOperand, stringOperand] }, excludes: true }
  }
  if (filter.operator === 'contains') {
    return { condition: { $contains: [fieldOperand, stringOperand] }, excludes: false }
  }
  if (filter.operator === 'starts-with') {
    return { condition: { '$starts-with': [fieldOperand, stringOperand] }, excludes: false }
  }
  if (filter.operator === 'ends-with') {
    return { condition: { '$ends-with': [fieldOperand, stringOperand] }, excludes: false }
  }
  return { condition: { $regex: [fieldOperand, stringOperand] }, excludes: false }
}
