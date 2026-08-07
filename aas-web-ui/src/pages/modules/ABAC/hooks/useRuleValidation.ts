import type { JsonErrorMessage } from '../components/shared/JsonCodeEditor.vue'
import type { AbacValidationMessages } from '../i18n/locales'
import type { ConfiguredRule } from '@/composables/Client/ABAC/types/rules'
import { hasContent } from '@/utils/StringUtils'
import { createRuleSchema } from '../schemas/ruleSchema'
import { extractLineFromSyntaxError, findLineForPath } from '../utils/json'

export interface RuleValidationResult {
  rule: ConfiguredRule | null
  error: JsonErrorMessage | null
  errorLines: number[]
}

export function useRuleValidation (messages: AbacValidationMessages) {
  const { configuredRuleSchema } = createRuleSchema(messages)

  function validateJson (
    json: string,
    labels: {
      required: string
      invalidJson: string
      invalidRule: string
    },
  ): RuleValidationResult {
    if (!hasContent(json)) {
      return { rule: null, error: { title: labels.required }, errorLines: [] }
    }

    // 1) JSON syntax
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      const errorLine = extractLineFromSyntaxError(json, detail)
      return {
        rule: null,
        error: { title: labels.invalidJson, messages: [detail] },
        errorLines: errorLine ? [errorLine] : [],
      }
    }

    // 2) Structural validation
    const result = configuredRuleSchema.safeParse(parsed)
    if (!result.success) {
      return {
        rule: null,
        error: {
          title: labels.invalidRule,
          messages: result.error.issues.map(issue => {
            const path = issue.path.join('.') || '(root)'
            return `${path}: ${issue.message}`
          }),
        },
        errorLines: result.error.issues
          .map(issue => findLineForPath(json, issue.path))
          .filter((n): n is number => n !== null),
      }
    }

    return { rule: result.data as ConfiguredRule, error: null, errorLines: [] }
  }

  return { validateJson }
}
