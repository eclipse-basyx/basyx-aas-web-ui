import { describe, expect, it } from 'vitest'
import { createDefinitionSchema } from '@/schemas/access-rules/validation/accessRulesValidation'
import { enValidationMessages } from '@/schemas/access-rules/validation/validationMessages'
import { OBJECT_TARGETS, readObjectIdentifier, writeObjectIdentifier } from './objectIdentifiers'

const schema = createDefinitionSchema(enValidationMessages).SCHEMA_FOR_KIND.objects

describe('guided object identifier formats', () => {
  it('builds schema-valid examples for every offered target', () => {
    for (const [kind, targets] of Object.entries(OBJECT_TARGETS)) {
      for (const target of targets) {
        const value = writeObjectIdentifier(target, 'urn:example:target', 'Temperature')
        expect(schema.safeParse({ name: 'objects', objects: [{ [kind]: value }] }).success, value).toBe(true)
        expect(readObjectIdentifier(kind as keyof typeof OBJECT_TARGETS, value)?.identifier).toBe('urn:example:target')
      }
    }
  })

  it('preserves nested element paths and leaves unsupported syntax for Custom', () => {
    const value = '$sme("urn:example:sm").Motor.Temperature'
    const parsed = readObjectIdentifier('REFERABLE', value)!
    expect(writeObjectIdentifier(parsed.target, parsed.identifier, parsed.path)).toBe(value)
    expect(readObjectIdentifier('IDENTIFIABLE', value)).toBeUndefined()
    expect(readObjectIdentifier('REFERABLE', 'backend-specific syntax')).toBeUndefined()
  })
})
