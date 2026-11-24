/** idShort of the placeholder the Submodel Repository client returns for a request refused with 401 or 403 */
export const SUBMODEL_NOT_AUTHORIZED_ID_SHORT = 'Submodel Not Authorized!'

const unavailableSubmodelIdShorts = new Set([
  'Submodel not found',
  SUBMODEL_NOT_AUTHORIZED_ID_SHORT,
])

/**
 * Checks whether a repository response is the placeholder for a Submodel the user isn't allowed to read.
 */
export function isUnauthorizedSubmodelPlaceholder (value: unknown): boolean {
  return (value as { idShort?: unknown } | null | undefined)?.idShort === SUBMODEL_NOT_AUTHORIZED_ID_SHORT
}

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
