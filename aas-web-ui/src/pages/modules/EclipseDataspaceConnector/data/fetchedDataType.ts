import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
import { jsonization } from '@aas-core-works/aas-core3.1-typescript'

export interface FetchedDataType {
  title: string
  icon: string
  instance: aasTypes.Class // Deserialized AAS or Submodel
}

// Keyed by the `modelType` of the AAS JSON serialization
const fetchedDataTypes: Record<string, {
  title: string
  icon: string
  deserialize: (json: JsonValue) => { value: aasTypes.Class | null, error: unknown }
}> = {
  AssetAdministrationShell: { title: 'AAS', icon: 'custom:aasIcon', deserialize: jsonization.assetAdministrationShellFromJsonable },
  Submodel: { title: 'Submodel', icon: 'mdi-folder', deserialize: jsonization.submodelFromJsonable },
}

/**
 * Returns the type of data fetched from a data plane, if it deserializes to an AAS or Submodel.
 * The data can be any JSON (or text), so only objects with a matching `modelType` are deserialized.
 * Data planes that don't send a JSON content type deliver the JSON as text, so strings are parsed first.
 */
export function fetchedDataType (data: unknown): FetchedDataType | undefined {
  try {
    const json = typeof data === 'string' ? JSON.parse(data) : data
    if (!json || typeof json !== 'object' || Array.isArray(json) || !Object.hasOwn(fetchedDataTypes, json.modelType)) {
      return undefined
    }

    const { title, icon, deserialize } = fetchedDataTypes[json.modelType]!
    const { value, error } = deserialize(json)
    return error === null && value ? { title, icon, instance: value } : undefined
  } catch {
    // Text that is no JSON, or JSON the deserializer can't handle
    return undefined
  }
}
