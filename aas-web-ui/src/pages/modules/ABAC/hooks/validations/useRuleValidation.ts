import type { AbacValidationMessages, RuleDialogErrors } from '../../i18n/locales'
import type { DocumentUpdateOptions, DocumentValidationResult, JsonObject } from '../../types/json'
import { createRuleSchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { detectRuleUpdate, resolveUpdateDocument } from '../../utils/update'
import { parseJsonObject } from '../../utils/validation'

export interface RuleValidationInput extends DocumentUpdateOptions {
  json: string
  currentRule?: JsonObject
}

export function useRuleValidation (messages: RuleDialogErrors, validationMessages: AbacValidationMessages) {
  const { configuredRuleSchema } = createRuleSchema(validationMessages)

  function validateJson ({ json, currentRule, inputMode, mergeBase }: RuleValidationInput): DocumentValidationResult {
    const { payload: parsed, error } = parseJsonObject(json, {
      required: messages.required,
      invalidJson: messages.invalidJson,
      invalidObject: messages.invalidRule,
    })
    if (!parsed) {
      return { payload: null, error }
    }

    let effectiveRule = parsed
    // Update flow: currentRule is only passed in update flow
    if (currentRule) {
      effectiveRule = resolveUpdateDocument(currentRule, detectRuleUpdate(currentRule, parsed, { inputMode, mergeBase }))
    }
    const result = configuredRuleSchema.safeParse(effectiveRule)

    if (!result.success) {
      const failure = formatSchemaIssues(result.error, messages.invalidRule, validationMessages)
      // Schema warnings do not block submission; the backend decides whether to accept the rule.
      return { payload: parsed, error: failure }
    }

    return { payload: parsed, error: null }
  }

  return { validateJson }
}
