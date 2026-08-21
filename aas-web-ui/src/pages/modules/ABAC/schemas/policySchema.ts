/**
 * Zod schema for the policy import.
 *
 * Reuses the existing definition and rule schemas so an imported policy JSON
 * is validated against the full ABAC grammar (definitions + rules).
 */

import type { AbacValidationMessages } from '../i18n/locales'
import { z } from 'zod'
import { createDefinitionSchema } from './definitionSchema'
import { createRuleSchema } from './ruleSchema'

export function createPolicySchema (messages: AbacValidationMessages) {
  const { defAttributeSchema, defAclSchema, defObjectSchema, defFormulaSchema } = createDefinitionSchema(messages)

  const { configuredRuleSchema } = createRuleSchema(messages)

  const allAccessPermissionRulesSchema = z.strictObject({
    DEFATTRIBUTES: z.array(defAttributeSchema).optional(),
    DEFACLS: z.array(defAclSchema).optional(),
    DEFOBJECTS: z.array(defObjectSchema).optional(),
    DEFFORMULAS: z.array(defFormulaSchema).optional(),
    rules: z.array(configuredRuleSchema).min(1, { error: messages.rulesRequired }),
  })

  const policySchema = z.strictObject({ AllAccessPermissionRules: allAccessPermissionRulesSchema })

  return { policySchema }
}
