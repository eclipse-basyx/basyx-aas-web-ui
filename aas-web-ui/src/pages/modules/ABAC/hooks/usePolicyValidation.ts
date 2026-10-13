import type { AbacValidationMessages, PolicyImportErrors } from '../i18n/locales'
import type { JsonErrorMessage, JsonObject } from '../types/json'
import { createPolicySchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { hasContent } from '@/utils/StringUtils'
import { isObject } from '../utils/object'

export interface PolicyValidationInput {
  json: string
}

export interface PolicyValidationResult {
  policy: JsonObject | null
  error: JsonErrorMessage | null
}

export function usePolicyValidation (messages: PolicyImportErrors, validationMessages: AbacValidationMessages) {
  const { policySchema } = createPolicySchema(validationMessages)

  function validateJson ({ json }: PolicyValidationInput): PolicyValidationResult {
    if (!hasContent(json)) {
      return { policy: null, error: { title: messages.required } }
    }

    // 1) JSON syntax
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch (error) {
      const detail = (error as Error).message
      return {
        policy: null,
        error: { title: messages.invalidJson, messages: [detail] },
      }
    }

    if (!isObject(parsed)) {
      return { policy: null, error: { title: messages.invalidPolicy } }
    }

    // 2) Structural validation
    const result = policySchema.safeParse(parsed)

    if (!result.success) {
      const failure = formatSchemaIssues(result.error, messages.invalidPolicy, validationMessages)
      // Schema warnings do not block submission; the backend decides whether to accept the policy.
      return { policy: parsed, error: failure }
    }

    return { policy: parsed, error: null }
  }

  return { validateJson }
}
