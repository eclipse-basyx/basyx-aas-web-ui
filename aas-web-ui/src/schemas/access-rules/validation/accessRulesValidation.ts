import type { DefinitionKind, DefinitionSchemaProperty } from '../types/definitions'
import type { SchemaValidationMessages } from './validationMessages'
import type { ErrorObject, ValidateFunction } from 'ajv'
import Ajv from 'ajv'
import source from '@/schemas/access-rules/aas-queries-and-access-rules-3.1.schema.json'
import { DEFINITION_KINDS, DEFINITION_SCHEMA_PROPERTIES } from '../types/definitions'

/**
 * Published patterns escape characters such as commas (\,), which Unicode-mode regexes reject.
 * Use unicodeRegExp: false to compile them without changing the pinned schema.
 * Validation is observational: no defaults, coercion, or property removal.
 * Draft-07 ignores sibling keywords of $ref, including the published FORMULA/FILTER constraints.
 */
const ajv = new Ajv({ strict: false, unicodeRegExp: false, allErrors: true, ignoreKeywordsWithRef: true, logger: false })
const validators = new Map<string, ValidateFunction>()

/** Localized schema issues consumed by the shared error formatter. */
export interface SchemaIssueError {
  issues: { path: string[], message: string }[]
}

/**
 * Decode JSON Pointer paths and append property names reported separately by Ajv.
 */
function issue (error: ErrorObject, messages: SchemaValidationMessages) {
  const path = error.instancePath.split('/').slice(1).map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'))
  let message = messages.schemaConstraint.replace('{keyword}', error.keyword)
  switch (error.keyword) {
    case 'required': {
      path.push(String(error.params.missingProperty))
      message = messages.schemaRequired

      break
    }
    case 'additionalProperties': {
      path.push(String(error.params.additionalProperty))
      message = messages.schemaAdditional

      break
    }
    case 'type': {
      message = messages.schemaType.replace('{type}', String(error.params.type))

      break
    }
    case 'enum': {
      message = messages.schemaEnum.replace('{values}', JSON.stringify(error.params.allowedValues))

      break
    }
    case 'pattern': {
      message = messages.schemaPattern

      break
    }
    case 'minItems': {
      message = messages.schemaMinItems.replace('{count}', String(error.params.limit))

      break
    }
    case 'maxItems': {
      message = messages.schemaMaxItems.replace('{count}', String(error.params.limit))

      break
    }
    case 'oneOf': {
      message = messages.schemaOneOf

      break
    }
    case 'anyOf': {
      message = messages.schemaAnyOf

      break
    }
  // No default
  }
  return { path, message }
}

/**
 * Reuse compiled validators by schema pointer while keeping localized messages
 * specific to each caller. Validation reports issues without modifying the input;
 * callers decide which failures prevent submission.
 */
function schema (pointer: string, messages: SchemaValidationMessages) {
  let validate = validators.get(pointer)
  if (!validate) {
    const document = pointer === '#'
      ? source
      : { $schema: source.$schema, definitions: source.definitions, $ref: pointer }
    validate = ajv.compile(document)
    validators.set(pointer, validate)
  }
  const compiled = validate
  return {
    safeParse (value: unknown): { success: true } | { success: false, error: SchemaIssueError } {
      if (compiled(value)) {
        return { success: true }
      }
      const issues = (compiled.errors ?? []).map(error => issue(error, messages))
      // Nested alternatives can report the same localized issue more than once.
      const unique = new Map(issues.map(entry => [JSON.stringify(entry), entry]))
      return { success: false, error: { issues: [...unique.values()] } }
    },
  }
}

/**
 * Validate a complete policy against the pinned schema's root.
 */
export function createPolicySchema (messages: SchemaValidationMessages) {
  return { policySchema: schema('#', messages) }
}

/**
 * Validate a complete rule, including the effective document after an update.
 */
export function createRuleSchema (messages: SchemaValidationMessages) {
  return { configuredRuleSchema: schema('#/definitions/AccessPermissionRule', messages) }
}

/**
 * Validate complete, named definitions using the schema's category-specific array items.
 */
export function createDefinitionSchema (messages: SchemaValidationMessages) {
  const definition = (name: DefinitionSchemaProperty) => schema(`#/definitions/AllAccessPermissionRules/properties/${name}/items`, messages)
  const SCHEMA_FOR_KIND = Object.fromEntries(
    DEFINITION_KINDS.map(kind => [kind, definition(DEFINITION_SCHEMA_PROPERTIES[kind])]),
  ) as Record<DefinitionKind, ReturnType<typeof schema>>
  return { SCHEMA_FOR_KIND }
}
