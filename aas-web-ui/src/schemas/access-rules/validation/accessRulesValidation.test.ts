import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createDefinitionSchema, createPolicySchema, createRuleSchema } from './accessRulesValidation'
import { formatSchemaIssues } from './formatSchemaIssues'
import { deValidationMessages as de, enValidationMessages as en } from './validationMessages'

const rule = { USEACL: 'acl', USEOBJECTS: ['object'], USEFORMULA: 'formula' }

describe('upstream ABAC advisory validation', () => {
  it('preserves the pinned upstream artifact byte for byte', () => {
    const bytes = readFileSync(fileURLToPath(import.meta.resolve('../aas-queries-and-access-rules-3.1.schema.json')))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('12a298f893dd137b0d0d92c76db32d938ff6006a89411f146537b05f460e83fb')
  })

  it('explains enum failures with the allowed values', () => {
    const result = createDefinitionSchema(en).SCHEMA_FOR_KIND.acls.safeParse({
      name: 'acl', acl: { ACCESS: 'DENY', RIGHTS: [], ATTRIBUTES: [] },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual({
        path: ['acl', 'ACCESS'],
        message: en.schemaEnum.replace('{values}', '["ALLOW","DISABLED"]'),
      })
    }
  })

  it('does not add backend reference resolution to policy schema validation', () => {
    const input = { AllAccessPermissionRules: { rules: [rule] } }
    expect(createPolicySchema(en).policySchema.safeParse(input).success).toBe(true)
  })

  it('uses draft-07 reference semantics for inline formula and filter objects', () => {
    const input = {
      USEACL: 'acl', USEOBJECTS: ['object'], FORMULA: { $boolean: true },
      FILTER: { FRAGMENT: '$sme#value', CONDITION: { $boolean: true } },
    }
    expect(createRuleSchema(en).configuredRuleSchema.safeParse(input).success).toBe(true)
    expect(createRuleSchema(en).configuredRuleSchema.safeParse({ ...input, FORMULA: { $boolean: 'true' } }).success).toBe(false)
  })

  it('selects each definition item from the upstream schema', () => {
    const { SCHEMA_FOR_KIND } = createDefinitionSchema(en)
    expect(SCHEMA_FOR_KIND.attributes.safeParse({ name: 'a', attributes: [{ CLAIM: 'role' }] }).success).toBe(true)
    expect(SCHEMA_FOR_KIND.objects.safeParse({ name: 'o', objects: [{ ROUTE: '/shells' }] }).success).toBe(true)
    expect(SCHEMA_FOR_KIND.acls.safeParse({ name: 'a', acl: { ACCESS: 'ALLOW', RIGHTS: [], ATTRIBUTES: [] } }).success).toBe(true)
    expect(SCHEMA_FOR_KIND.formulas.safeParse({ name: 'f', formula: { $boolean: true } }).success).toBe(true)
    expect(SCHEMA_FOR_KIND.formulas.safeParse({ name: 'f', objects: [] }).success).toBe(false)
  })

  it('leaves invalid values, unknown properties and missing fields untouched', () => {
    const input = { USEACL: 42, extra: 'preserve me' }
    const before = structuredClone(input)
    const result = createRuleSchema(en).configuredRuleSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(input).toEqual(before)
  })

  it('localizes cached validators independently and retains error paths', () => {
    for (const messages of [en, de]) {
      const result = createRuleSchema(messages).configuredRuleSchema.safeParse({ ...rule, extra: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual({ path: ['extra'], message: messages.schemaAdditional })
      }
    }
  })

  it('bounds displayed alternative diagnostics', () => {
    const input = { USEACL: 'acl', USEOBJECTS: ['object'], FORMULA: {
      $and: Array.from({ length: 64 }, () => ({ $eq: [{ $numVal: 1 }, { $strVal: 'x' }] })),
    } }
    const result = createRuleSchema(en).configuredRuleSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatSchemaIssues(result.error, 'schema', de)
      expect(formatted.messages).toHaveLength(51)
      expect(formatted.messages?.at(-1)).toBe(de.schemaMoreIssues.replace('{count}', String(result.error.issues.length - 50)))
    }
  })
})
