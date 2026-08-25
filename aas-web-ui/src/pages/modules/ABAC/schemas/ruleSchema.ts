/**
 * Zod schemas for ABAC rule validation.
 *
 * Enforces the ABAC grammar exclusivity rules:
 * - Exactly one of ACL | USEACL
 * - At least one of OBJECTS | USEOBJECTS
 * - Exactly one of FORMULA | USEFORMULA
 */

import type { AbacValidationMessages } from '@/pages/modules/ABAC/i18n/locales'
import { z } from 'zod'
import { createFormulaSchema } from '@/pages/modules/ABAC/schemas/formulaSchema'
import { FIELD_PATTERN } from '@/pages/modules/ABAC/schemas/pattern'
import { createSharedSchemas } from '@/pages/modules/ABAC/schemas/sharedSchema'
import { toNullish } from '@/pages/modules/ABAC/utils/zod'

export function createRuleSchema (messages: AbacValidationMessages) {
  const { formulaExpressionSchema } = createFormulaSchema(messages)

  const { aclEntrySchema, objectEntrySchema } = createSharedSchemas(messages)

  const filterSchema = z.strictObject({
    FRAGMENT: z.string().regex(FIELD_PATTERN, { error: messages.filterFragmentRequired }),
    MATCH: z.boolean().optional(),
    CONDITION: formulaExpressionSchema.optional(),
    USEFORMULA: z.string().min(1).optional(),
  })
    .refine(
      v => (v.CONDITION ? !v.USEFORMULA : !!v.USEFORMULA),
      {
        error: messages.exactlyOneFilterCondition,
        path: ['CONDITION'],
      },
    )

  const ruleSchema = z.strictObject({
    ACL: aclEntrySchema.optional(),
    USEACL: z.string().min(1).optional(),
    OBJECTS: z.array(objectEntrySchema).min(1).optional(),
    USEOBJECTS: z.array(z.string().min(1, { error: messages.refObjectNameRequired })).min(1).optional(),
    FORMULA: formulaExpressionSchema.optional(),
    USEFORMULA: z.string().min(1).optional(),
    FILTER: filterSchema.optional(),
    FILTERLIST: z.array(filterSchema).min(1).optional(),
  })

  const configuredRuleSchema = ruleSchema
    .refine(
      v => (v.ACL ? !v.USEACL : !!v.USEACL),
      {
        error: messages.exactlyOneAcl,
        path: ['ACL'],
      },
    )
    .refine(
      v => !!(v.OBJECTS?.length || v.USEOBJECTS?.length),
      {
        error: messages.atLeastOneObjectOrUseobject,
        path: ['OBJECTS'],
      },
    )
    .refine(
      v => (v.FORMULA ? !v.USEFORMULA : !!v.USEFORMULA),
      {
        error: messages.exactlyOneFormula,
        path: ['FORMULA'],
      },
    )

  const patchRuleSchema = ruleSchema.extend(toNullish(ruleSchema)).strict()

  return { configuredRuleSchema, patchRuleSchema }
}
