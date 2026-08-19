import type { JsonErrorMessage } from '../components/shared/JsonCodeEditor.vue'
import type { AbacValidationMessages } from '../i18n/locales'
import type { CompletePolicy } from '@/pages/modules/ABAC/types/policy'
import { hasContent } from '@/utils/StringUtils'
import { createPolicySchema } from '../schemas/policySchema'
import { extractLineFromSyntaxError, findLineForPath } from '../utils/json'

export interface PolicyValidationInput {
  json: string
  errorMessages: {
    required: string
    invalidJson: string
    invalidPolicy: string
  }
}

export interface PolicyValidationResult {
  policy: CompletePolicy | null
  error: JsonErrorMessage | null
  errorLines: number[]
}

export function usePolicyValidation (messages: AbacValidationMessages) {
  const { policySchema } = createPolicySchema(messages)

  function validateJson ({ json, errorMessages }: PolicyValidationInput): PolicyValidationResult {
    if (!hasContent(json)) {
      return { policy: null, error: { title: errorMessages.required }, errorLines: [] }
    }

    // 1) JSON syntax
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      const errorLine = extractLineFromSyntaxError(json, detail)
      return {
        policy: null,
        error: { title: errorMessages.invalidJson, messages: [detail] },
        errorLines: errorLine ? [errorLine] : [],
      }
    }

    // 2) Structural validation
    const result = policySchema.safeParse(parsed)
    if (!result.success) {
      return {
        policy: null,
        error: {
          title: errorMessages.invalidPolicy,
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

    return { policy: result.data as CompletePolicy, error: null, errorLines: [] }
  }

  return { validateJson }
}
