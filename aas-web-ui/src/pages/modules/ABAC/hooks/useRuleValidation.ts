import type { JsonErrorMessage } from '@/pages/modules/ABAC/components/shared/JsonCodeEditor.vue'
import type { AbacValidationMessages } from '@/pages/modules/ABAC/i18n/locales'
import type { ConfiguredRule } from '@/pages/modules/ABAC/types/rules'
import type { ZodError } from 'zod'
import { createRuleSchema } from '@/pages/modules/ABAC/schemas/ruleSchema'
import { extractLineFromSyntaxError, findLineForPath } from '@/pages/modules/ABAC/utils/json'
import { hasContent } from '@/utils/StringUtils'

export interface RuleValidationInput {
  json: string
  currentRule?: ConfiguredRule
  errorMessages: {
    required: string
    invalidJson: string
    invalidRule: string
  }
}

export interface RuleValidationResult {
  rule: ConfiguredRule | null
  error: JsonErrorMessage | null
  errorLines: number[]
}

export function useRuleValidation (messages: AbacValidationMessages) {
  const { configuredRuleSchema, patchRuleSchema } = createRuleSchema(messages)

  function validateJson ({ json, currentRule, errorMessages }: RuleValidationInput): RuleValidationResult {
    if (!hasContent(json)) {
      return { rule: null, error: { title: errorMessages.required }, errorLines: [] }
    }

    // JSON syntax validation
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      const errorLine = extractLineFromSyntaxError(json, detail)
      return {
        rule: null,
        error: { title: errorMessages.invalidJson, messages: [detail] },
        errorLines: errorLine ? [errorLine] : [],
      }
    }

    // Patch flow: currentRule is only passed in patch flow
    if (currentRule) {
      const patchResult = patchRuleSchema.safeParse(parsed)
      // Check if passed input is valid
      if (!patchResult.success) {
        return formatSchemaError(patchResult.error, errorMessages.invalidRule, json)
      }

      const patch = patchResult.data
      const base: Record<string, unknown> = { ...currentRule }
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) {
          delete base[key]
        } else {
          base[key] = value
        }
      }

      // Check if expected rule is valid
      const mergedResult = configuredRuleSchema.safeParse(base)
      if (!mergedResult.success) {
        return formatSchemaError(mergedResult.error, errorMessages.invalidRule, json)
      }

      return { rule: patch as ConfiguredRule, error: null, errorLines: [] }
    }

    // Structural validation against full schema
    const result = configuredRuleSchema.safeParse(parsed)

    return result.success
      ? { rule: result.data as ConfiguredRule, error: null, errorLines: [] }
      : formatSchemaError(result.error, errorMessages.invalidRule, json)
  }

  function formatSchemaError (error: ZodError, title: string, json: string): RuleValidationResult {
    return {
      rule: null,
      error: {
        title,
        messages: error.issues.map(issue => {
          const path = issue.path.join('.') || '(root)'
          return `${path}: ${issue.message}`
        }),
      },
      errorLines: error.issues
        .map(issue => findLineForPath(json, issue.path))
        .filter((n): n is number => n !== null),
    }
  }

  return { validateJson }
}
