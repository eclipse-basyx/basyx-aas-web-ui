import type { DefinitionFor, DefinitionKind } from '../../types/definitions'
import type { AccessValue, AclState, DefinitionFormState, FormLimitation, ObjectItemState, Representation } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import { ACCESS_VALUES, OBJECT_ITEM_KINDS } from '@/schemas/access-rules/constants'
import { equals, isObject } from '../object'
import { decodeAttributeSources, encodeAttributeSource } from './attributes'
import { decodeExpression, encodeExpression } from './expression'

/**
 * Codecs between definition documents of the pinned access-rule schema and the
 * guided form states. A definition is representable when every managed field
 * matches a supported shape; any other content keeps the JSON editor open and
 * is left untouched. Applying a state preserves outer extra properties;
 * unsupported nested properties require JSON mode. Cleared optional references
 * are omitted; complete-document update preparation derives deletion markers.
 */

/**
 * Extracts one recognized string-valued alternative, such as { ROUTE: '/shells' }.
 * Unknown keys are checked by the enclosing round-trip check.
 */
function parseAlternatives<K extends string> (
  inputValue: unknown,
  keys: readonly K[],
): { key: K, value: string } | undefined {
  if (!isObject(inputValue)) {
    return undefined
  }
  const present = keys.filter(key => Object.hasOwn(inputValue, key))
  if (present.length !== 1) {
    return undefined
  }
  const key = present[0]!
  const value = inputValue[key]
  return typeof value === 'string' ? { key, value } : undefined
}

const MANAGED_KEYS: { [K in DefinitionKind]: readonly (keyof DefinitionFor<K>)[] } = {
  attributes: ['attributes', 'USEATTRIBUTES'],
  acls: ['acl'],
  objects: ['objects', 'USEOBJECTS'],
  formulas: ['formula'],
}

export function definitionExtras (definitionDocument: JsonObject, kind: DefinitionKind): JsonObject {
  const extras: JsonObject = {}
  for (const [key, value] of Object.entries(definitionDocument)) {
    if ((MANAGED_KEYS[kind] as readonly string[]).includes(key)) {
      continue
    }
    extras[key] = value
  }
  return extras
}

function decodeStringArray (inputValue: unknown): string[] | undefined {
  if (!Array.isArray(inputValue)) {
    return undefined
  }
  return inputValue.every(value => typeof value === 'string') ? (inputValue as string[]) : undefined
}

// ---------------------------------------------------------------------------
// ACL
// ---------------------------------------------------------------------------

function decodeAccess (inputValue: unknown): AccessValue | undefined {
  return ACCESS_VALUES.find(value => value === inputValue)
}

/**
 * Decodes supported ACL fields; the enclosing rule/definition checks round-trip equality.
 */
export function decodeAcl (inputValue: unknown): Representation & { acl: AclState | undefined } {
  if (!isObject(inputValue)) {
    return { ok: false, limitation: 'structure', acl: undefined }
  }
  const formState: AclState = {}
  if (Object.hasOwn(inputValue, 'ACCESS')) {
    const access = decodeAccess(inputValue.ACCESS)
    if (!access) {
      return { ok: false, limitation: 'rights', acl: undefined }
    }
    formState.access = access
  }
  if (Object.hasOwn(inputValue, 'RIGHTS')) {
    const rights = decodeStringArray(inputValue.RIGHTS)
    if (!rights) {
      return { ok: false, limitation: 'rights', acl: undefined }
    }
    formState.rights = rights
  }
  if (Object.hasOwn(inputValue, 'ATTRIBUTES')) {
    const attributes = decodeAttributeSources(inputValue.ATTRIBUTES)
    if (!attributes) {
      return { ok: false, limitation: 'attributeItem', acl: undefined }
    }
    formState.attributes = attributes
  }
  if (Object.hasOwn(inputValue, 'USEATTRIBUTES') && inputValue.USEATTRIBUTES !== null && typeof inputValue.USEATTRIBUTES !== 'string') {
    return { ok: false, limitation: 'structure', acl: undefined }
  }
  if (typeof inputValue.USEATTRIBUTES === 'string') {
    formState.useAttributes = inputValue.USEATTRIBUTES
  }
  return { ok: true, acl: formState }
}

export function encodeAcl (formState: AclState): JsonObject {
  const aclDocument: { [key: string]: unknown } = {}
  if (formState.access !== undefined) {
    aclDocument.ACCESS = formState.access
  }
  if (formState.rights !== undefined) {
    aclDocument.RIGHTS = [...formState.rights]
  }
  if (formState.attributes !== undefined) {
    aclDocument.ATTRIBUTES = formState.attributes.map(entry => encodeAttributeSource(entry))
  }
  if (formState.useAttributes !== undefined) {
    aclDocument.USEATTRIBUTES = formState.useAttributes
  }
  return aclDocument
}

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------

function decodeObjectItem (inputValue: unknown): ObjectItemState | undefined {
  const alternative = parseAlternatives(inputValue, OBJECT_ITEM_KINDS)
  if (!alternative) {
    return undefined
  }
  return { kind: alternative.key, value: alternative.value }
}

export function encodeObjectItem (formState: ObjectItemState): JsonObject {
  return { [formState.kind]: formState.value }
}

export function decodeObjectItems (inputValue: unknown): ObjectItemState[] | undefined {
  if (!Array.isArray(inputValue)) {
    return undefined
  }
  const states: ObjectItemState[] = []
  for (const entry of inputValue) {
    const formState = decodeObjectItem(entry)
    if (!formState) {
      return undefined
    }
    states.push(formState)
  }
  return states
}

// ---------------------------------------------------------------------------
// Definition entry level
// ---------------------------------------------------------------------------

export function representDefinition (kind: DefinitionKind, inputValue: unknown): Representation {
  const formState = definitionFormState(kind, inputValue)
  if (formState === undefined) {
    return { ok: false, limitation: definitionLimitation(kind, inputValue) }
  }
  // Opening the form must not change anything: only documents that the state
  // rebuilds identically are representable.
  const sourceDefinition = isObject(inputValue) ? inputValue : undefined
  if (!equals(sourceDefinition ?? {}, applyDefinitionState(sourceDefinition, formState))) {
    return { ok: false, limitation: 'structure' }
  }
  return { ok: true }
}

/** Decodes editable fields; use representDefinition to also check preservation of the source. */
export function definitionFormState (kind: DefinitionKind, inputValue: unknown): DefinitionFormState | undefined {
  if (!isObject(inputValue)) {
    return undefined
  }
  switch (kind) {
    case 'attributes': {
      const entries = Object.hasOwn(inputValue, 'attributes') ? decodeAttributeSources(inputValue.attributes) : []
      const references = Object.hasOwn(inputValue, 'USEATTRIBUTES') ? decodeStringArray(inputValue.USEATTRIBUTES) : []
      if (entries === undefined || references === undefined) {
        return undefined
      }
      return { kind: 'attributes', attributes: { entries, references } }
    }
    case 'acls': {
      if (!Object.hasOwn(inputValue, 'acl')) {
        return undefined
      }
      const acl = decodeAcl(inputValue.acl)
      return acl.ok ? { kind: 'acls', acls: { acl: acl.acl! } } : undefined
    }
    case 'objects': {
      const entries = Object.hasOwn(inputValue, 'objects') ? decodeObjectItems(inputValue.objects) : []
      const references = Object.hasOwn(inputValue, 'USEOBJECTS') ? decodeStringArray(inputValue.USEOBJECTS) : []
      if (entries === undefined || references === undefined) {
        return undefined
      }
      return { kind: 'objects', objects: { entries, references } }
    }
    case 'formulas': {
      if (!Object.hasOwn(inputValue, 'formula')) {
        return undefined
      }
      if (inputValue.formula === null) {
        return undefined
      }
      const expression = decodeExpression(inputValue.formula)
      return expression === undefined ? undefined : { kind: 'formulas', formulas: { expression } }
    }
  }
}

export function definitionLimitation (kind: DefinitionKind, inputValue: unknown): FormLimitation {
  if (!isObject(inputValue)) {
    return 'structure'
  }
  switch (kind) {
    case 'attributes': {
      if (Object.hasOwn(inputValue, 'attributes') && decodeAttributeSources(inputValue.attributes) === undefined) {
        return 'attributeItem'
      }
      return 'structure'
    }
    case 'acls': {
      if (!Object.hasOwn(inputValue, 'acl')) {
        return 'structure'
      }
      const result = decodeAcl(inputValue.acl)
      return result.ok ? 'structure' : result.limitation
    }
    case 'objects': {
      if (Object.hasOwn(inputValue, 'objects') && decodeObjectItems(inputValue.objects) === undefined) {
        return 'attributeItem'
      }
      return 'structure'
    }
    case 'formulas': {
      return inputValue.formula === null ? 'structure' : 'expression'
    }
  }
}

/**
 * Builds the effective document for a definition state. When editing an
 * existing definition, inline lists retain an explicit empty selection. Cleared
 * optional references are omitted; complete-document update preparation derives
 * their deletion markers. Untouched empty JSON arrays retain their original shape.
 */
export function applyDefinitionState (sourceDefinition: JsonObject | undefined, formState: DefinitionFormState): JsonObject {
  const updatedDefinition: JsonObject = { ...definitionExtras(sourceDefinition ?? {}, formState.kind) }
  const kind = formState.kind

  function emitList (key: 'attributes' | 'USEATTRIBUTES' | 'objects' | 'USEOBJECTS', entries: unknown[]): void {
    if (entries.length > 0) {
      updatedDefinition[key] = entries
      return
    }
    const previousEntries = sourceDefinition?.[key]
    if (Array.isArray(previousEntries) && (key === 'attributes' || key === 'objects' || previousEntries.length === 0)) {
      updatedDefinition[key] = []
    }
  }

  switch (kind) {
    case 'attributes': {
      emitList('attributes', formState.attributes.entries.map(entry => encodeAttributeSource(entry)))
      emitList('USEATTRIBUTES', formState.attributes.references)

      break
    }
    case 'acls': {
      updatedDefinition.acl = encodeAcl(formState.acls.acl)

      break
    }
    case 'objects': {
      emitList('objects', formState.objects.entries.map(entry => encodeObjectItem(entry)))
      emitList('USEOBJECTS', formState.objects.references)
      if (!Object.hasOwn(updatedDefinition, 'objects') && !Object.hasOwn(updatedDefinition, 'USEOBJECTS')
        && (!sourceDefinition || Object.hasOwn(sourceDefinition, 'objects') || Object.hasOwn(sourceDefinition, 'USEOBJECTS'))) {
        updatedDefinition.objects = []
      }

      break
    }
    default: {
      if (formState.formulas.expression !== null) {
        updatedDefinition.formula = encodeExpression(formState.formulas.expression)
      }
      // A deliberately cleared formula simply omits the key; explicit deletion
      // stays in JSON mode where null markers are first-class.
    }
  }
  return updatedDefinition
}
