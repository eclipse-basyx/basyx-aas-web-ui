import type { AttributeSourceState } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import { ATTRIBUTE_SOURCE_KINDS, GLOBAL_ATTRIBUTE_VALUES } from '@/schemas/access-rules/constants'
import { isObject } from '../object'

/**
 * Shared attribute-source decoding for definitions, ACLs, and expression operands.
 */
export function decodeAttributeSource (inputValue: unknown): AttributeSourceState | undefined {
  if (!isObject(inputValue) || Object.keys(inputValue).length !== 1) {
    return undefined
  }
  const kind = ATTRIBUTE_SOURCE_KINDS.find(candidate => Object.hasOwn(inputValue, candidate))
  if (!kind) {
    return undefined
  }
  const value = inputValue[kind]
  if (typeof value !== 'string' || (kind === 'GLOBAL' && !(GLOBAL_ATTRIBUTE_VALUES as readonly string[]).includes(value))) {
    return undefined
  }
  return { kind, value }
}

export function encodeAttributeSource (formState: AttributeSourceState): JsonObject {
  return { [formState.kind]: formState.value }
}

/**
 * Returns undefined if any entry cannot be edited as an attribute source.
 */
export function decodeAttributeSources (inputValue: unknown): AttributeSourceState[] | undefined {
  if (!Array.isArray(inputValue)) {
    return undefined
  }
  const attributeSources: AttributeSourceState[] = []
  for (const entry of inputValue) {
    const attributeSource = decodeAttributeSource(entry)
    if (!attributeSource) {
      return undefined
    }
    attributeSources.push(attributeSource)
  }
  return attributeSources
}
