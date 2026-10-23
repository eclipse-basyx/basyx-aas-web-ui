import type { AbacValidationMessages, PolicyImportErrors } from '../../i18n/locales'
import type { DocumentValidationResult } from '../../types/json'
import { createPolicySchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { formatSchemaIssues } from '@/schemas/access-rules/validation/formatSchemaIssues'
import { isObject } from '../../utils/object'
import { parseJsonObject } from '../../utils/validation'

export interface PolicyValidationInput {
  json: string
}

export function usePolicyValidation (messages: PolicyImportErrors, validationMessages: AbacValidationMessages, definitionNameRequired = validationMessages.schemaRequired) {
  const { policySchema } = createPolicySchema(validationMessages)

  function validateJson ({ json }: PolicyValidationInput): DocumentValidationResult {
    const { payload: parsed, error } = parseJsonObject(json, {
      required: messages.required,
      invalidJson: messages.invalidJson,
      invalidObject: messages.invalidPolicy,
    })
    if (!parsed) {
      return { payload: null, error }
    }

    const policy = parsed

    const identityIssues: { path: string[], message: string }[] = []
    if (isObject(policy.AllAccessPermissionRules)) {
      for (const key of ['DEFATTRIBUTES', 'DEFACLS', 'DEFOBJECTS', 'DEFFORMULAS']) {
        const definitions = policy.AllAccessPermissionRules[key]
        if (!Array.isArray(definitions)) {
          continue
        }
        for (const [index, definition] of definitions.entries()) {
          // The schema accepts empty strings, but backend definition identity does not.
          if (isObject(definition) && (typeof definition.name !== 'string' || definition.name.trim() === '')) {
            identityIssues.push({ path: ['AllAccessPermissionRules', key, String(index), 'name'], message: definitionNameRequired })
          }
        }
      }
    }
    if (identityIssues.length > 0) {
      return { payload: null, error: formatSchemaIssues({ issues: identityIssues }, messages.invalidPolicy, validationMessages) }
    }

    const result = policySchema.safeParse(policy)
    if (!result.success) {
      const failure = formatSchemaIssues(result.error, messages.invalidPolicy, validationMessages)
      // Local advisories do not block submission; the backend decides whether to accept the policy.
      return { payload: policy, error: failure }
    }

    return { payload: policy, error: null }
  }

  return { validateJson }
}
