import type { AbacValidationMessages, DefinitionDialogErrors } from '../i18n/locales'
import type { Definition, DefinitionKind } from '../types/definitions'
import type { JsonErrorMessage, JsonObject } from '../types/json'
import { createDefinitionSchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { hasContent } from '@/utils/StringUtils'
import { isObject, mergeObjects } from '../utils/object'
import { detectDefinitionUpdate } from '../utils/update'

export interface DefinitionValidationInput {
  json: string
  kind: DefinitionKind | undefined
  currentDefinition?: Definition
  name?: string | null
}

export interface DefinitionValidationResult {
  payload: JsonObject | null
  error: JsonErrorMessage | null
}

export function useDefinitionValidation (messages: DefinitionDialogErrors, validationMessages: AbacValidationMessages) {
  const { SCHEMA_FOR_KIND } = createDefinitionSchema(validationMessages)

  function validateJson ({ json, kind, currentDefinition, name }: DefinitionValidationInput): DefinitionValidationResult {
    if (!hasContent(kind)) {
      return { payload: null, error: { title: messages.requiredKind } }
    }

    if (!hasContent(json)) {
      return { payload: null, error: { title: messages.requiredDefinition } }
    }

    // JSON syntax validation
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      return {
        payload: null,
        error: { title: messages.invalidJson, messages: [detail] },
      }
    }

    if (!isObject(parsed)) {
      return { payload: null, error: { title: messages.invalidDefinition } }
    }

    // Reject an explicit identity change before reattaching the API resource name.
    if (currentDefinition && Object.hasOwn(parsed, 'name') && parsed.name !== currentDefinition.name) {
      return {
        payload: null,
        error: { title: messages.invalidDefinition, messages: [messages.cannotRename] },
      }
    }

    // Re-attach name only after establishing that the JSON is an object.
    const definitionName = currentDefinition?.name ?? name
    if (hasContent(definitionName)) {
      parsed.name = definitionName
    }

    if (typeof parsed.name !== 'string' || !hasContent(parsed.name)) {
      return {
        payload: null,
        error: { title: messages.invalidDefinition, messages: [messages.requiredName] },
      }
    }

    let effectiveDefinition = parsed

    // Update flow: currentDefinition is only passed in update flow
    if (currentDefinition) {
      const { mode, payload } = detectDefinitionUpdate(currentDefinition, parsed, kind)
      effectiveDefinition = mode === 'replace' ? payload : mergeObjects(currentDefinition, payload)
      delete parsed.name
    }
    const result = SCHEMA_FOR_KIND[kind].safeParse(effectiveDefinition)

    if (!result.success) {
      const failure = formatSchemaIssues(result.error, messages.invalidDefinition, validationMessages)
      // Schema warnings do not block submission; the backend decides whether to accept the definition.
      return { payload: parsed, error: failure }
    }

    return { payload: parsed, error: null }
  }

  return { validateJson }
}
