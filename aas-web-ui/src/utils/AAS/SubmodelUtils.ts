const unavailableSubmodelIdShorts = new Set([
  'Submodel not found',
  'Submodel Not Authorized!',
])

export interface SubmodelPayload {
  id: string
  modelType: 'Submodel'
}

/**
 * Checks whether an unknown repository response contains a usable Submodel.
 */
export function isSubmodelPayload (value: unknown): value is SubmodelPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const submodel = value as { id?: unknown, idShort?: unknown, modelType?: unknown }
  const idShort = typeof submodel.idShort === 'string' ? submodel.idShort : ''

  return submodel.modelType === 'Submodel'
    && typeof submodel.id === 'string'
    && submodel.id.trim() !== ''
    && !unavailableSubmodelIdShorts.has(idShort)
}
