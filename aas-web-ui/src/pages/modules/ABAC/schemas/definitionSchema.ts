/**
 * Zod schemas for ABAC definition validation.
 *
 * Each definition kind has its own schema because the required fields differ.
 */

import type { AbacValidationMessages } from '../i18n/locales'
import type { DefinitionKind } from '@/composables/Client/ABAC/types/definitions'
import { z } from 'zod'
import { createFormulaSchema } from './formulaSchema'
import { createSharedSchemas } from './sharedSchema'

export function createDefinitionSchema (messages: AbacValidationMessages) {
  const { formulaExpressionSchema } = createFormulaSchema(messages)

  const {
    attributeSourceSchema,
    aclEntrySchema,
    objectEntrySchema,
  } = createSharedSchemas(messages)

  const defAttributeSchema = z.looseObject({
    name: z
      .string()
      .min(1, { error: messages.nameRequired }),
    attributes: z
      .array(attributeSourceSchema)
      .min(1, { error: messages.attributesRequired }),
  })

  const defAclSchema = z.looseObject({
    name: z
      .string()
      .min(1, { error: messages.nameRequired }),
    acl: aclEntrySchema,
  })

  const defObjectSchema = z
    .looseObject({
      name: z
        .string()
        .min(1, { error: messages.nameRequired }),
      objects: z
        .array(objectEntrySchema)
        .min(1, { error: messages.objectsRequired })
        .optional(),
      USEOBJECTS: z
        .array(
          z
            .string()
            .min(1, { error: messages.refObjectNameRequired }),
        )
        .min(1)
        .optional(),
    })
    .refine(
      v => (
        v.objects?.length
          ? !v.USEOBJECTS?.length
          : !!v.USEOBJECTS?.length
      ),
      {
        error: messages.exactlyOneObjects,
        path: ['objects'],
      },
    )

  const defFormulaSchema = z.looseObject({
    name: z
      .string()
      .min(1, { error: messages.nameRequired }),
    formula: formulaExpressionSchema,
  })

  function schemaForKind (kind: DefinitionKind) {
    switch (kind) {
      case 'attributes': {
        return defAttributeSchema
      }
      case 'acls': {
        return defAclSchema
      }
      case 'objects': {
        return defObjectSchema
      }
      case 'formulas': {
        return defFormulaSchema
      }
    }
  }

  return {
    defAttributeSchema,
    defAclSchema,
    defObjectSchema,
    defFormulaSchema,
    schemaForKind,
  }
}
