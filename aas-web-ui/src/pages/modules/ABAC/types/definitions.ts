import type { DocumentUpdateOptions, JsonObject } from './json'
import type { DefinitionKind } from '@/schemas/access-rules/types/definitions'

export type { DefinitionFor, DefinitionKind, DefinitionSchemaProperty } from '@/schemas/access-rules/types/definitions'
export { DEFINITION_KINDS, DEFINITION_SCHEMA_PROPERTIES } from '@/schemas/access-rules/types/definitions'

export interface DefinitionBase {
  name: string
  versionId: string
  kind: DefinitionKind
}

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export type Definition = JsonObject & { name: string }
export type DefinitionsMap = Partial<Record<DefinitionKind, Definition[]>>

// Advisory editor submissions may contain schema-invalid properties.
export interface DefinitionCreate {
  versionId: string
  kind: DefinitionKind
  payload: JsonObject
}

export interface DefinitionPatch extends DefinitionBase {
  patch: JsonObject
}

export interface DefinitionReplace extends DefinitionBase {
  payload: JsonObject
}

export interface DefinitionUpdate extends DefinitionReplace, DocumentUpdateOptions {
  currentDefinition: Definition
}

export interface DefinitionDelete extends DefinitionBase {}

// ---------------------------------------------------------------------------
// Form editing
// ---------------------------------------------------------------------------

export interface DefinitionDialogProps {
  mode: 'create' | 'update'
  definition?: Definition
  kind?: DefinitionKind
}

export interface DefinitionUsage {
  kind: 'rule' | 'definition'
  /** Rules carry their one-based index for better display. */
  ruleIndex?: number
  /** Foreign definitions carry their kind and name. */
  definitionKind?: DefinitionKind
  name?: string
}
