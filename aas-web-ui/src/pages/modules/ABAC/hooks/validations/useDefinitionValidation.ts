import type { AbacValidationMessages, DefinitionDialogErrors } from '../../i18n/locales'
import type { Definition, DefinitionKind } from '../../types/definitions'
import type { DocumentUpdateOptions, DocumentValidationResult } from '../../types/json'
import { createDefinitionSchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { hasContent } from '@/utils/StringUtils'
import { detectDefinitionUpdate, resolveUpdateDocument } from '../../utils/update'
import { parseJsonObject } from '../../utils/validation'

export interface DefinitionValidationInput extends DocumentUpdateOptions {
  json: string
  kind: DefinitionKind | undefined
  currentDefinition?: Definition
  name?: string | null
}

export function useDefinitionValidation (messages: DefinitionDialogErrors, validationMessages: AbacValidationMessages) {
  const { SCHEMA_FOR_KIND } = createDefinitionSchema(validationMessages)

  function validateJson ({ json, kind, currentDefinition, name, inputMode, mergeBase }: DefinitionValidationInput): DocumentValidationResult {
    if (!hasContent(kind)) {
      return { payload: null, error: { title: messages.requiredKind, paths: [['kind']] } }
    }

    const { payload: parsed, error } = parseJsonObject(json, {
      required: messages.requiredDefinition,
      invalidJson: messages.invalidJson,
      invalidObject: messages.invalidDefinition,
    })
    if (!parsed) {
      return { payload: null, error }
    }

    // Reject an explicit identity change before reattaching the API resource name.
    if (currentDefinition && Object.hasOwn(parsed, 'name') && parsed.name !== currentDefinition.name) {
      return {
        payload: null,
        error: { title: messages.invalidDefinition, messages: [messages.cannotRename], paths: [['name']] },
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
        error: { title: messages.invalidDefinition, messages: [messages.requiredName], paths: [['name']] },
      }
    }

    let effectiveDefinition = parsed

    // Update flow: currentDefinition is only passed in update flow
    if (currentDefinition) {
      effectiveDefinition = resolveUpdateDocument(currentDefinition, detectDefinitionUpdate(currentDefinition, parsed, kind, { inputMode, mergeBase }))
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
