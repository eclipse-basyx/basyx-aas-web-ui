type JsonRecord = Record<string, unknown>

/**
 * Fields the UI adds to loaded AAS, Submodels and their elements at runtime, e.g. `endpoints` with the URL of the repository.
 * They are no part of the AAS metamodel. `id` stays on Identifiable elements, `path` on an attachment entry (`contentType`, no `modelType`).
 */
const runtimeKeys = new Set(['path', 'timestamp', 'id', 'conceptDescriptions', 'endpoints', 'isExternal'])
const identifiableModelTypes = new Set(['AssetAdministrationShell', 'Submodel', 'ConceptDescription'])

/**
 * Returns a deep copy of an AAS, Submodel or ConceptDescription without the fields the UI adds at runtime,
 * e.g. before exporting or sending it.
 *
 * Apply it to Identifiable elements, not to an environment: its `conceptDescriptions` would be removed as well.
 */
export function withoutRuntimeFields<T = unknown> (value: T): T {
  return cloneWithoutRuntimeFields(value) as T
}

function cloneWithoutRuntimeFields (value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => cloneWithoutRuntimeFields(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const record = value as JsonRecord
  const result: JsonRecord = {}
  for (const [key, item] of Object.entries(record)) {
    if (runtimeKeys.has(key) && !shouldPreservePath(record, key) && !shouldPreserveId(record, key)) {
      continue
    }
    result[key] = cloneWithoutRuntimeFields(item)
  }
  return result
}

function shouldPreservePath (record: JsonRecord, key: string): boolean {
  if (key !== 'path') {
    return false
  }

  const hasContentType = typeof record.contentType === 'string' && record.contentType.trim() !== ''
  const hasModelType = typeof record.modelType === 'string' && record.modelType.trim() !== ''

  return hasContentType && !hasModelType
}

function shouldPreserveId (record: JsonRecord, key: string): boolean {
  if (key !== 'id') {
    return false
  }

  const modelType = typeof record.modelType === 'string' ? record.modelType.trim() : ''
  return identifiableModelTypes.has(modelType)
}
