/**
 * Zod schemas for ABAC definition validation.
 *
 * Each definition kind has its own schema because the required fields differ.
 */

import type { AbacValidationMessages } from '../i18n/locales'
import type { DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import { z } from 'zod'
import { toNullish } from '../utils/zod'
import { createFormulaSchema } from './formulaSchema'
import { createSharedSchemas } from './sharedSchema'

export function createDefinitionSchema (messages: AbacValidationMessages) {
  const { formulaExpressionSchema } = createFormulaSchema(messages)

  const { attributeSourceSchema, aclEntrySchema, objectEntrySchema } = createSharedSchemas(messages)

  const defAttributeSchema = z.strictObject({
    name: z.string().min(1, { error: messages.nameRequired }),
    attributes: z.array(attributeSourceSchema).min(1, { error: messages.attributesRequired }).optional(),
    USEATTRIBUTES: z.array(z.string().min(1, { error: messages.refObjectNameRequired })).min(1).optional(),
  })

  const defAclSchema = z.strictObject({
    name: z.string().min(1, { error: messages.nameRequired }),
    acl: aclEntrySchema,
  })

  const defObjectSchema = z.strictObject({
    name: z.string().min(1, { error: messages.nameRequired }),
    objects: z.array(objectEntrySchema).min(1, { error: messages.objectsRequired }).optional(),
    USEOBJECTS: z.array(z.string().min(1, { error: messages.refObjectNameRequired })).min(1).optional(),
  })

  const defFormulaSchema = z.strictObject({
    name: z.string().min(1, { error: messages.nameRequired }),
    formula: formulaExpressionSchema,
  })

  const SCHEMA_FOR_KIND = {
    attributes: defAttributeSchema.refine(
      v => (
        !!(v.attributes?.length || v.USEATTRIBUTES?.length)
      ),
      {
        error: messages.atLeastOneAttributesOrUseattributes,
        path: ['attributes'],
      },
    ),
    acls: defAclSchema,
    objects: defObjectSchema.refine(
      v => (
        v.objects?.length
          ? !v.USEOBJECTS?.length
          : !!v.USEOBJECTS?.length
      ),
      {
        error: messages.exactlyOneObjectOrUseobject,
        path: ['objects'],
      },
    ),
    formulas: defFormulaSchema,
  } as const satisfies Record<DefinitionKind, z.ZodType>

  const PATCH_SCHEMA_FOR_KIND = {
    attributes: defAttributeSchema.extend(toNullish(defAttributeSchema)).strict(),
    acls: defAclSchema.extend(toNullish(defAclSchema)).strict(),
    objects: defObjectSchema.extend(toNullish(defObjectSchema)).strict(),
    formulas: defFormulaSchema.extend(toNullish(defFormulaSchema)).strict(),
  } as const satisfies Record<DefinitionKind, z.ZodType>

  return {
    defAttributeSchema,
    defAclSchema,
    defObjectSchema,
    defFormulaSchema,
    SCHEMA_FOR_KIND,
    PATCH_SCHEMA_FOR_KIND,
  }
}
