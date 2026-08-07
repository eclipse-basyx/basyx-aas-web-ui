/**
 * Zod schemas for ABAC rule validation.
 *
 * Enforces the ABAC grammar exclusivity rules:
 * - Exactly one of ACL | USEACL
 * - Exactly one of OBJECTS | USEOBJECTS
 * - Exactly one of FORMULA | USEFORMULA
 */

import type { AbacValidationMessages } from '../i18n/locales'
import { z } from 'zod'
import { createFormulaSchema } from './formulaSchema'
import { FIELD_PATTERN } from './pattern'
import { createSharedSchemas } from './sharedSchema'

export function createRuleSchema (messages: AbacValidationMessages) {
  const { formulaExpressionSchema } = createFormulaSchema(messages)

  const {
    aclEntrySchema,
    objectEntrySchema,
  } = createSharedSchemas(messages)

  const filterSchema = z
    .looseObject({
      FRAGMENT: z
        .string()
        .regex(FIELD_PATTERN, {
          error: messages.filterFragmentRequired,
        }),
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

  const configuredRuleSchema = z
    .looseObject({
      ACL: aclEntrySchema.optional(),
      USEACL: z.string().min(1).optional(),
      OBJECTS: z.array(objectEntrySchema).min(1).optional(),
      USEOBJECTS: z
        .array(
          z
            .string()
            .min(1, { error: messages.refObjectNameRequired }),
        )
        .min(1)
        .optional(),
      FORMULA: formulaExpressionSchema.optional(),
      USEFORMULA: z.string().min(1).optional(),
      FILTER: filterSchema.optional(),
      FILTERLIST: z.array(filterSchema).min(1).optional(),
    })
    .refine(
      v => (v.ACL ? !v.USEACL : !!v.USEACL),
      {
        error: messages.exactlyOneAcl,
        path: ['ACL'],
      },
    )
    .refine(
      v => (
        v.OBJECTS?.length
          ? !v.USEOBJECTS?.length
          : !!v.USEOBJECTS?.length
      ),
      {
        error: messages.exactlyOneObjects,
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

  return { configuredRuleSchema }
}
