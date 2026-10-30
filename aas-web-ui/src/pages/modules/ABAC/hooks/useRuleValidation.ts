import type { AbacValidationMessages, RuleDialogErrors } from '../i18n/locales'
import type { JsonErrorMessage, JsonObject } from '../types/json'
import { createRuleSchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { hasContent } from '@/utils/StringUtils'
import { isObject, mergeObjects } from '../utils/object'
import { detectRuleUpdate } from '../utils/update'

export interface RuleValidationInput {
  json: string
  currentRule?: JsonObject
}

export interface RuleValidationResult {
  rule: JsonObject | null
  error: JsonErrorMessage | null
}

export function useRuleValidation (messages: RuleDialogErrors, validationMessages: AbacValidationMessages) {
  const { configuredRuleSchema } = createRuleSchema(validationMessages)

  function validateJson ({ json, currentRule }: RuleValidationInput): RuleValidationResult {
    if (!hasContent(json)) {
      return { rule: null, error: { title: messages.required } }
    }

    // JSON syntax validation
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      return {
        rule: null,
        error: { title: messages.invalidJson, messages: [detail] },
      }
    }

    if (!isObject(parsed)) {
      return { rule: null, error: { title: messages.invalidRule } }
    }

    let effectiveRule = parsed
    // Update flow: currentRule is only passed in update flow
    if (currentRule) {
      const { mode, payload } = detectRuleUpdate(currentRule, parsed)
      effectiveRule = mode === 'replace' ? payload : mergeObjects(currentRule, payload)
    }
    const result = configuredRuleSchema.safeParse(effectiveRule)

    if (!result.success) {
      const failure = formatSchemaIssues(result.error, messages.invalidRule, validationMessages)
      // Schema warnings do not block submission; the backend decides whether to accept the rule.
      return { rule: parsed, error: failure }
    }

    return { rule: parsed, error: null }
  }

  return { validateJson }
}
