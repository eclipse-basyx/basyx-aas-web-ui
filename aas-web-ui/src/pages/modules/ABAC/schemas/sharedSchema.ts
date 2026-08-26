/**
 * Shared Zod schemas used by ABAC rules and definitions.
 */

import type { AbacValidationMessages } from '@/pages/modules/ABAC/i18n/locales'
import { z } from 'zod'

export function createSharedSchemas (messages: AbacValidationMessages) {
  const attributeSourceSchema = z.strictObject({
    CLAIM: z.string().optional(),
    GLOBAL: z.enum(['LOCALNOW', 'UTCNOW', 'CLIENTNOW', 'ANONYMOUS']).optional(),
    REFERENCE: z.string().optional(),
  })
    .refine(v => {
      const keys = [v.CLAIM, v.GLOBAL, v.REFERENCE]
        .filter(value => value !== undefined)

      return keys.length === 1
    }, {
      error: messages.attributeSourceOneKey,
    })

  const aclEntrySchema = z.strictObject({
    USEATTRIBUTES: z.string().min(1, { error: messages.aclAttributesRequired }).optional(),
    ATTRIBUTES: z.array(attributeSourceSchema).min(1, { error: messages.aclAttributesRequired }).optional(),
    RIGHTS: z.array(z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'VIEW', 'ALL'])).min(1, { error: messages.aclRightsRequired }),
    ACCESS: z.enum(['ALLOW', 'DISABLED'], { error: messages.aclAccessMustBeAllowOrDisabled }),
  })
    .refine(
      v => (v.ATTRIBUTES ? !v.USEATTRIBUTES : !!v.USEATTRIBUTES),
      {
        error: messages.exactlyOneAclAttributes,
        path: ['ATTRIBUTES'],
      },
    )

  const objectEntrySchema = z.union([
    z.strictObject({ ROUTE: z.string().min(1, { error: messages.objectEntryValueRequired }) }),
    z.strictObject({ IDENTIFIABLE: z.string().min(1, { error: messages.objectEntryValueRequired }) }),
    z.strictObject({ REFERABLE: z.string().min(1, { error: messages.objectEntryValueRequired }) }),
    z.strictObject({ FRAGMENT: z.string().min(1, { error: messages.objectEntryValueRequired }) }),
    z.strictObject({ DESCRIPTOR: z.string().min(1, { error: messages.objectEntryValueRequired }) }),
  ])

  return {
    attributeSourceSchema,
    aclEntrySchema,
    objectEntrySchema,
  }
}
