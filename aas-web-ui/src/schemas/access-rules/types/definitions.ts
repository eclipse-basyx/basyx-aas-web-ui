import type { AllAccessPermissionRules } from './accessRules.generated'

export const DEFINITION_SCHEMA_PROPERTIES = {
  attributes: 'DEFATTRIBUTES',
  acls: 'DEFACLS',
  objects: 'DEFOBJECTS',
  formulas: 'DEFFORMULAS',
} as const satisfies Record<string, keyof AllAccessPermissionRules>

export type DefinitionKind = keyof typeof DEFINITION_SCHEMA_PROPERTIES
export type DefinitionSchemaProperty = (typeof DEFINITION_SCHEMA_PROPERTIES)[DefinitionKind]

export const DEFINITION_KINDS = Object.keys(DEFINITION_SCHEMA_PROPERTIES) as DefinitionKind[]

export type DefinitionFor<K extends DefinitionKind>
  = NonNullable<AllAccessPermissionRules[(typeof DEFINITION_SCHEMA_PROPERTIES)[K]]>[number]
