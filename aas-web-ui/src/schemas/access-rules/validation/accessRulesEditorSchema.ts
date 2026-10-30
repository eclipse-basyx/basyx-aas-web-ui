import type { DefinitionKind } from '../types/definitions'
import type { CodeSchema } from '@/components/Code/codeSchema'
import source from '@/schemas/access-rules/aas-queries-and-access-rules-3.1.schema.json'
import { DEFINITION_SCHEMA_PROPERTIES } from '../types/definitions'

export type AccessRulesEditorViewer = 'policy' | 'rule' | 'definition'
export type AccessRulesEditorMode = 'create' | 'update' | 'view'

export interface AccessRulesEditorTarget {
  kind?: DefinitionKind
  mode: AccessRulesEditorMode
  viewer: AccessRulesEditorViewer
}

interface SchemaNode {
  [key: string]: unknown
}
type SchemaDefinitionMap = Record<string, SchemaNode>

const cache = new Map<string, CodeSchema>()

/**
 * Keys whose values are schema metadata or literal schema content; they are never transformed.
 */
const LEAF_KEYS = new Set([
  '$schema', '$id', '$ref', 'type', 'const', 'enum', 'pattern', 'title', 'description', 'format',
  'default', 'minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems', 'uniqueItems',
  'additionalProperties',
])
const SCHEMA_COMPOSITION_KEYS = new Set(['oneOf', 'anyOf', 'allOf'])

export function getAccessRulesEditorNamespace (target: AccessRulesEditorTarget): string {
  const parts = ['access-rules', target.viewer]
  if (target.viewer === 'definition' && target.kind) {
    parts.push(target.kind)
  }
  parts.push(target.mode)
  return parts.join('-')
}

/**
 * Cache editor schemas by viewer, definition kind, and mode so repeated mounts
 * reuse the same schema instead of cloning and transforming it again.
 */
export function createAccessRulesEditorSchema (target: AccessRulesEditorTarget): CodeSchema {
  const namespace = getAccessRulesEditorNamespace(target)
  const cached = cache.get(namespace)
  if (cached) {
    return cached
  }
  const entry = buildEntrySchema(target, namespace)
  cache.set(namespace, entry)
  return entry
}

/**
 * Select the upstream root for the editor document. Rule and definition updates
 * use separate Patch* definitions; complete originals remain available for array items.
 * All adaptations operate on a copy, leaving the pinned schema unchanged.
 */
function buildEntrySchema (target: AccessRulesEditorTarget, namespace: string): CodeSchema {
  if (target.viewer === 'definition' && !target.kind) {
    throw new Error('The definition editor requires a DefinitionKind.')
  }
  // Local schema identity for Monaco registration; no hosted resource is fetched.
  const uri = `urn:basyx:access-rules:editor:${namespace}`
  const definitions = structuredClone(source.definitions) as SchemaDefinitionMap
  const isUpdate = target.mode === 'update'

  let root: SchemaNode
  if (target.viewer === 'policy') {
    // A policy document wraps the rules object: { AllAccessPermissionRules: { ... } }.
    root = {
      allOf: [{
        type: 'object',
        properties: {
          AllAccessPermissionRules: { $ref: '#/definitions/AllAccessPermissionRules' },
        },
        required: ['AllAccessPermissionRules'],
        additionalProperties: false,
      }],
    }
  } else if (target.viewer === 'rule') {
    if (isUpdate) {
      transformDefsForUpdate(definitions)
    }
    root = { allOf: [{ $ref: `#/definitions/${isUpdate ? 'Patch' : ''}AccessPermissionRule` }] }
  } else {
    const kind = target.kind!
    const entryName = `DefinitionEntry${kind.charAt(0).toUpperCase()}${kind.slice(1)}`
    if (isUpdate) {
      transformDefsForUpdate(definitions)
      definitions[entryName] = definitionEntryDefinitionForUpdate(target.kind!)
    } else {
      definitions[entryName] = definitionEntryDefinition(target.kind!)
    }
    root = { allOf: [{ $ref: `#/definitions/${entryName}` }] }
  }

  return {
    fileMatch: [`inmemory://${namespace}/*.json`],
    schema: {
      ...root,
      $id: uri,
      $schema: source.$schema,
      definitions,
      title: entryTitle(target),
    },
    uri,
  }
}

function entryTitle (target: AccessRulesEditorTarget): string {
  if (target.viewer === 'policy') {
    return 'Access Rules Model (policy import)'
  }
  const parts = [target.viewer === 'rule' ? 'Access permission rule' : 'Definition']
  if (target.kind) {
    parts.push(target.kind)
  }
  parts.push(target.mode)
  return `Access Rules ${parts.join(' ')} editor`
}

/**
 * Clone the category's DEF-* array item schema as the editor root.
 * Create/view retains the complete entry, including its required name.
 */
function definitionEntryDefinition (kind: DefinitionKind): SchemaNode {
  const sourceDefs = source.definitions as SchemaDefinitionMap
  const envelopeProps = sourceDefs.AllAccessPermissionRules.properties as SchemaNode
  const definitionKey = DEFINITION_SCHEMA_PROPERTIES[kind]
  const item = (envelopeProps[definitionKey] as SchemaNode).items as SchemaNode
  return structuredClone(item) as SchemaNode
}

/**
 * Allow update omissions and null deletions, then remove name from editable
 * properties: definition identity travels in the API path, not the merge patch.
 */
function definitionEntryDefinitionForUpdate (kind: DefinitionKind): SchemaNode {
  const withoutName = toUpdateCompatibleNode(definitionEntryDefinition(kind)) as SchemaNode
  if (isSchemaNode(withoutName.properties)) {
    delete withoutName.properties.name
  }
  return withoutName
}

/**
 * Recursively prepares a schema for merge-patch editor documents:
 * omission preserves (drop "required"), null deletes (property values become
 * nullable), and presence-only exclusivity constraints are removed because a
 * patch may legitimately replace a referenced entry with its deletion marker.
 */
function toUpdateCompatibleNode (node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(element => toUpdateCompatibleNode(element))
  }
  if (!isSchemaNode(node)) {
    return node
  }
  // An array replaces the whole value. Its items keep the full schemas and
  // original references, including required properties and exclusivity checks.
  if (node.type === 'array') {
    return node
  }

  const result: SchemaNode = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      result[key] = value.replace('#/definitions/', '#/definitions/Patch')
      continue
    }
    if (key === 'required') {
      continue
    }
    if (key === 'properties' && isSchemaNode(value)) {
      result[key] = Object.fromEntries(
        Object.entries(value).map(([name, schemaFor]) => [name, nullable(toUpdateCompatibleNode(schemaFor))]),
      )
      continue
    }
    if (SCHEMA_COMPOSITION_KEYS.has(key) && Array.isArray(value)) {
      const branches = value
        .filter(branch => !isPresenceOnly(branch))
        .filter(branch => !isPresenceOnlyGroup(branch))
      if (branches.length > 0) {
        result[key] = branches.map(branch => toUpdateCompatibleNode(branch))
      }
      continue
    }
    if (LEAF_KEYS.has(key)) {
      result[key] = value
      continue
    }
    result[key] = toUpdateCompatibleNode(value)
  }
  return result
}

function transformDefsForUpdate (definitions: SchemaDefinitionMap): void {
  for (const [name, definition] of Object.entries(definitions)) {
    // Keep full definitions available for array elements.
    definitions[`Patch${name}`] = toUpdateCompatibleNode(definition) as SchemaNode
  }
}

/**
 * Property values may carry the merge instruction null (field deletion).
 */
function nullable (schemaFor: unknown): unknown {
  return { anyOf: [schemaFor, { type: 'null' }] }
}

/**
 * Identify a branch containing only required property names, removable when updates allow omissions.
 */
function isPresenceOnly (node: unknown): boolean {
  if (!isSchemaNode(node)) {
    return false
  }
  const keys = Object.keys(node)
  return keys.length === 1 && keys[0] === 'required' && (node.required as unknown[]).length > 0
}

/**
 * Identify compositions made entirely of presence checks, with no value constraints to retain.
 */
function isPresenceOnlyGroup (node: unknown): boolean {
  if (!isSchemaNode(node)) {
    return false
  }
  const keys = Object.keys(node)
  if (keys.length !== 1 || (keys[0] !== 'oneOf' && keys[0] !== 'allOf' && keys[0] !== 'anyOf')) {
    return false
  }
  return (node[keys[0]] as unknown[]).every(branch => isPresenceOnly(branch))
}

function isSchemaNode (value: unknown): value is SchemaNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
