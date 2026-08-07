import type { FormulaExpression } from '@/composables/Client/ABAC/types/formula'
import type { z } from 'zod'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { useDefinitionValidation } from '../hooks/useDefinitionValidation'
import { usePolicyValidation } from '../hooks/usePolicyValidation'
import { useRuleValidation } from '../hooks/useRuleValidation'
import { en } from '../i18n/locales'
import { createDefinitionSchema } from './definitionSchema'
import { createFormulaSchema } from './formulaSchema'
import { createPolicySchema } from './policySchema'
import { createRuleSchema } from './ruleSchema'

const msgs = en.validation

const { formulaExpressionSchema } = createFormulaSchema(msgs)
const { configuredRuleSchema } = createRuleSchema(msgs)
const {
  defAttributeSchema,
  defAclSchema,
  defObjectSchema,
  defFormulaSchema,
  schemaForKind,
} = createDefinitionSchema(msgs)
const { policySchema } = createPolicySchema(msgs)

const validFormula = { $boolean: true }
const validAcl = {
  ACCESS: 'ALLOW',
  RIGHTS: ['READ'],
  ATTRIBUTES: [{ CLAIM: 'role' }],
}
const validObjectEntry = { ROUTE: '/shells/*' }

// ═══════════════════════════════════════════════════════════════════════════
// Formula Schema
// ═══════════════════════════════════════════════════════════════════════════

describe('formulaSchema', () => {
  it('infers a type assignable to FormulaExpression', () => {
    expectTypeOf<z.infer<typeof formulaExpressionSchema>>()
      .toMatchTypeOf<FormulaExpression>()
  })

  // ── Leaf / literal expressions ──

  it.each([
    ['$boolean: true', { $boolean: true }],
    ['$boolean: false', { $boolean: false }],
  ])('accepts valid leaf: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  it.each([
    ['$boolean with string', { $boolean: 'true' }],
    ['$boolean with number', { $boolean: 1 }],
  ])('rejects invalid leaf: %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(false)
  })

  // ── Comparison operators ────────────────────────────────────────────────

  it.each([
    ['$eq', { $eq: [{ $boolean: true }, { $boolean: false }] }],
    ['$ne', { $ne: [{ $boolean: true }, { $boolean: false }] }],
    ['$gt', { $gt: [{ $numVal: 1 }, { $numVal: 2 }] }],
    ['$lt', { $lt: [{ $strVal: 'a' }, { $strVal: 'b' }] }],
  ])('accepts valid comparison: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  it.each([
    ['$eq with one operand', { $eq: [{ $boolean: true }] }],
    ['$eq with three operands', { $eq: [{ $boolean: true }, { $boolean: false }, { $boolean: true }] }],
    ['$ne with empty array', { $ne: [] }],
    ['$eq with non-array', { $eq: 'not-an-array' }],
    ['$gt with boolean operands', { $gt: [{ $boolean: true }, { $boolean: false }] }],
    ['$lt with boolean operands', { $lt: [{ $boolean: true }, { $boolean: false }] }],
    ['$ge with boolCast', { $ge: [{ $boolCast: { $strVal: 'x' } }, { $numVal: 1 }] }],
  ])('rejects invalid comparison: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(false)
  })

  // ── Logical operators ──

  it.each([
    ['$and multiple', { $and: [{ $boolean: true }, { $boolean: false }] }],
    ['$or multiple', { $or: [{ $boolean: true }, { $boolean: false }] }],
    ['$not', { $not: { $boolean: true } }],
    ['nested $and + $or',
      { $and: [{ $or: [{ $boolean: true }, { $boolean: false }] }, { $boolean: true }] },
    ],
  ])('accepts valid logical: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  it.each([
    ['$and single', { $and: [{ $boolean: true }] }],
    ['$or single', { $or: [{ $boolean: false }] }],
    ['$and empty array', { $and: [] }],
    ['$or empty array', { $or: [] }],
    ['$not with array', { $not: [{ $boolean: true }] }],
    ['$not with missing expression', { $not: undefined }],
  ])('rejects invalid logical: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(false)
  })

  // ── Match operators ──

  it.each([
    ['$regex', { $regex: [{ $strVal: 'abc' }, { $strVal: '^a' }] }],
    ['$contains', { $contains: [{ $strVal: 'abc' }, { $strVal: 'bc' }] }],
    ['$starts-with', { '$starts-with': [{ $strVal: 'hello' }, { $strVal: 'hel' }] }],
    ['$ends-with', { '$ends-with': [{ $strVal: 'foo' }, { $strVal: 'oo' }] }],
  ])('accepts valid match: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  it.each([
    ['$regex with one operand', { $regex: ['abc'] }],
    ['$contains with one operand', { $contains: [{ $boolean: true }] }],
  ])('rejects invalid match: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(false)
  })

  // ── Invalid / unknown operator ──

  it('rejects object with no known operator', () => {
    const result = formulaExpressionSchema.safeParse({ $foobar: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects object with multiple operators', () => {
    const result = formulaExpressionSchema.safeParse({ $boolean: true, $eq: [{ $boolean: true }, { $boolean: false }] })
    expect(result.success).toBe(false)
  })

  it('rejects non-object value', () => {
    const results = [
      formulaExpressionSchema.safeParse('string'),
      formulaExpressionSchema.safeParse(null),
      formulaExpressionSchema.safeParse([]),
      formulaExpressionSchema.safeParse(42),
    ]
    for (const r of results) {
      expect(r.success).toBe(false)
    }
  })

  it.each([
    ['$hexVal lowercase', { $eq: [{ $hexVal: '16#1f' }, { $hexVal: '16#1F' }] }],
    ['$hexVal 0x prefix', { $eq: [{ $hexVal: '0x1F' }, { $hexVal: '16#1F' }] }],
  ])('rejects malformed $hexVal: %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(false)
  })

  it.each([
    ['$timeVal without offset', { $lt: [{ $timeVal: '08:00:00' }, { $timeVal: '17:00:00Z' }] }],
    ['$dateTimeVal without offset', { $eq: [{ $dateTimeVal: '2026-08-06T12:00:00' }, { $dateTimeVal: '2026-08-06T12:00:00Z' }] }],
  ])('rejects malformed temporal literal: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(false)
  })

  it.each([
    ['$timeVal with Z', { $lt: [{ $timeVal: '08:00:00Z' }, { $timeVal: '17:00:00Z' }] }],
    ['$timeVal with numeric offset', { $lt: [{ $timeVal: '08:00:00+02:00' }, { $timeVal: '17:00:00+02:00' }] }],
    ['$hexVal canonical', { $eq: [{ $hexVal: '16#1F' }, { $hexVal: '16#FF' }] }],
  ])('accepts well-formed literal: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  it('rejects date part over GLOBAL ANONYMOUS', () => {
    const result = formulaExpressionSchema.safeParse({
      $eq: [{ $year: { $attribute: { GLOBAL: 'ANONYMOUS' } } }, { $numVal: 2026 }],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.datePartRequiresDateTime)).toBe(true)
  })

  it.each([
    ['hex vs number', { $eq: [{ $hexVal: '16#1F' }, { $numVal: 31 }] }],
    ['hex vs number ordered', { $gt: [{ $hexVal: '16#FF' }, { $numVal: 10 }] }],
    ['dateTime vs string', { $eq: [{ $dateTimeVal: '2026-08-06T12:00:00Z' }, { $strVal: '2026-08-06T12:00:00Z' }] }],
    ['time vs dateTime', { $eq: [{ $timeVal: '12:00:00Z' }, { $dateTimeVal: '2026-08-06T12:00:00Z' }] }],
  ])('rejects cross-kind comparison (BE GRAMMAR-LOGEXPR-CMPTYPE): %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.comparisonTypeMismatch)).toBe(true)
  })

  it.each([
    ['same kind hex', { $eq: [{ $hexVal: '16#1F' }, { $hexVal: '16#1F' }] }],
    ['same kind time', { $lt: [{ $timeVal: '08:00:00Z' }, { $timeVal: '17:00:00Z' }] }],
    ['$field wildcard', { $eq: [{ $field: '$sm#id' }, { $numVal: 1 }] }],
    ['ANONYMOUS as string', { $eq: [{ $attribute: { GLOBAL: 'ANONYMOUS' } }, { $strVal: 'true' }] }],
  ])('accepts compatible comparison: %s', (_label, expr) => {
    expect(formulaExpressionSchema.safeParse(expr).success).toBe(true)
  })

  // ── Semantic type checks ──

  it.each([
    ['$eq string vs number', { $eq: [{ $strVal: 'a' }, { $numVal: 1 }] }],
    ['$eq bool vs number', { $eq: [{ $boolean: true }, { $numVal: 1 }] }],
    ['$ne dateTime vs number', { $ne: [{ $dateTimeVal: '2026-01-01T00:00:00Z' }, { $numVal: 1 }] }],
    ['$gt string vs number', { $gt: [{ $strVal: 'a' }, { $numVal: 1 }] }],
    ['$lt time vs string', { $lt: [{ $timeVal: '12:00:00Z' }, { $strVal: 'a' }] }],
  ])('rejects comparison with incompatible types: %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.comparisonTypeMismatch)).toBe(true)
  })

  it.each([
    ['$dayOfWeek over string', { $eq: [{ $dayOfWeek: { $strVal: 'x' } }, { $numVal: 1 }] }],
    ['$month over number', { $eq: [{ $month: { $numVal: 5 } }, { $numVal: 5 }] }],
    ['$year over bool', { $eq: [{ $year: { $boolean: true } }, { $numVal: 2026 }] }],
  ])('rejects date part over non-dateTime operand: %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.datePartRequiresDateTime)).toBe(true)
  })

  it('rejects $dateTimeCast over a non-string operand', () => {
    const result = formulaExpressionSchema.safeParse({
      $eq: [{ $dateTimeCast: { $numVal: 1 } }, { $dateTimeVal: '2026-01-01T00:00:00Z' }],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.dateTimeCastRequiresString)).toBe(true)
  })

  it('rejects $timeCast over a numeric operand', () => {
    const result = formulaExpressionSchema.safeParse({
      $eq: [{ $timeCast: { $numVal: 1 } }, { $timeVal: '12:00:00Z' }],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.timeCastRequiresStringOrDateTime)).toBe(true)
  })

  it.each([
    ['$dayOfWeek over GLOBAL UTCNOW',
      { $eq: [{ $dayOfWeek: { $attribute: { GLOBAL: 'UTCNOW' } } }, { $numVal: 3 }] },
    ],
    ['$dateTimeCast over string',
      { $eq: [{ $dateTimeCast: { $strVal: '2026-01-01T00:00:00Z' } }, { $dateTimeVal: '2026-01-01T00:00:00Z' }] },
    ],
    ['$timeCast over dateTime',
      { $eq: [{ $timeCast: { $dateTimeVal: '2026-01-01T12:00:00Z' } }, { $timeVal: '12:00:00Z' }] },
    ],
    ['$field is compatible with any kind',
      { $eq: [{ $field: '$sm#id' }, { $numVal: 1 }] },
    ],
    ['$attribute CLAIM is compatible with any kind',
      { $gt: [{ $attribute: { CLAIM: 'level' } }, { $numVal: 5 }] },
    ],
  ])('accepts semantically valid expression: %s', (_label, expr) => {
    const result = formulaExpressionSchema.safeParse(expr)
    expect(result.success).toBe(true)
  })

  it('reports semantic issues from nested logical branches', () => {
    const result = formulaExpressionSchema.safeParse({
      $and: [
        { $boolean: true },
        { $or: [
          { $boolean: false },
          { $eq: [{ $strVal: 'a' }, { $numVal: 1 }] },
        ] },
      ],
    })
    expect(result.success).toBe(false)
    const mismatches = result.error!.issues.filter(i => i.message === msgs.comparisonTypeMismatch)
    expect(mismatches).toHaveLength(1)
  })

  it('reports semantic issues inside $match clauses', () => {
    const result = formulaExpressionSchema.safeParse({
      $match: [{ $eq: [{ $strVal: 'a' }, { $numVal: 1 }] }],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.comparisonTypeMismatch)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Rule Schema
// ═══════════════════════════════════════════════════════════════════════════

describe('ruleSchema', () => {
  // ── Valid inline rule ──

  it('accepts a valid inline rule', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(true)
  })

  // ── Valid reference rule ──

  it('accepts a valid reference rule (USEACL, USEOBJECTS, USEFORMULA)', () => {
    const result = configuredRuleSchema.safeParse({
      USEACL: 'myAcl',
      USEOBJECTS: ['myObjects'],
      USEFORMULA: 'myFormula',
    })
    expect(result.success).toBe(true)
  })

  // ── Exclusivity: ACL vs USEACL ──

  it('rejects when both ACL and USEACL are provided', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      USEACL: 'myAcl',
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneAcl)).toBe(true)
  })

  it('rejects when neither ACL nor USEACL is provided', () => {
    const result = configuredRuleSchema.safeParse({
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneAcl)).toBe(true)
  })

  // ── Exclusivity: OBJECTS vs USEOBJECTS ──

  it('rejects when both OBJECTS and USEOBJECTS are provided', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      USEOBJECTS: ['myObjects'],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneObjects)).toBe(true)
  })

  it('rejects when neither OBJECTS nor USEOBJECTS is provided', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneObjects)).toBe(true)
  })

  // ── Exclusivity: FORMULA vs USEFORMULA ──

  it('rejects when both FORMULA and USEFORMULA are provided', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      USEFORMULA: 'myFormula',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneFormula)).toBe(true)
  })

  it('rejects when neither FORMULA nor USEFORMULA is provided', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneFormula)).toBe(true)
  })

  // ── ACL entry edge cases ──

  it('rejects ACL with both ATTRIBUTES and USEATTRIBUTES', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{ CLAIM: 'role' }],
      USEATTRIBUTES: 'myAttrs',
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects ACL with neither ATTRIBUTES nor USEATTRIBUTES', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects ACL with empty RIGHTS array', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: [],
      ATTRIBUTES: [{ CLAIM: 'role' }],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects ACL with invalid ACCESS value', () => {
    const acl = {
      ACCESS: 'DENY',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{ CLAIM: 'role' }],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  // ── Attribute source edge cases ──

  it('rejects attribute source with no keys set', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{}],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects attribute source with multiple keys set', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{ CLAIM: 'role', GLOBAL: 'ANONYMOUS' }],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('accepts attribute source with GLOBAL: ANONYMOUS', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{ GLOBAL: 'ANONYMOUS' }],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(true)
  })

  it('accepts attribute source with REFERENCE', () => {
    const acl = {
      ACCESS: 'ALLOW',
      RIGHTS: ['READ'],
      ATTRIBUTES: [{ REFERENCE: '$sm#id' }],
    }
    const result = configuredRuleSchema.safeParse({
      ACL: acl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(true)
  })

  // ── Object entry edge cases ──

  it('rejects object entry with no keys', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [{}],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects object entry with multiple keys', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [{ ROUTE: '/shells', FRAGMENT: '/x' }],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty OBJECTS array', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [],
      FORMULA: validFormula,
    })
    expect(result.success).toBe(false)
  })

  // ── Filter edge cases ──

  it('accepts FILTER with CONDITION', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: { FRAGMENT: '$sme.temperature#value', CONDITION: { $boolean: true } },
    })
    expect(result.success).toBe(true)
  })

  it('accepts FILTER with USEFORMULA', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: { FRAGMENT: '$sme.temperature#value', USEFORMULA: 'myFilterFormula' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects FILTER with both CONDITION and USEFORMULA', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: {
        FRAGMENT: '$sme.temperature#value',
        CONDITION: { $boolean: true },
        USEFORMULA: 'myFilterFormula',
      },
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneFilterCondition)).toBe(true)
  })

  it('rejects FILTER without FRAGMENT', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: { CONDITION: { $boolean: true } },
    })
    expect(result.success).toBe(false)
  })

  it('rejects FILTER with neither CONDITION nor USEFORMULA', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: { FRAGMENT: '$sme.temperature#value' },
    })
    expect(result.success).toBe(false)
  })

  it('accepts FILTERLIST with multiple valid filters', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTERLIST: [
        { FRAGMENT: '$sme.temperature#value', CONDITION: { $boolean: true } },
        { FRAGMENT: '$sme.engine#idShort', USEFORMULA: 'myFormula' },
      ],
    })
    expect(result.success).toBe(true)
  })

  // ── Mixed inline + reference (partial ref rules are allowed by the API) ──

  it('accepts mixed rule: ACL inline, OBJECTS ref, FORMULA ref', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      USEOBJECTS: ['myObjects'],
      USEFORMULA: 'myFormula',
    })
    expect(result.success).toBe(true)
  })

  // ── Extra unknown keys ──

  it('accepts rule with extra unknown properties (looseObject)', () => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      EXTRA_FIELD: 'should be ignored',
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ['$sme', '$sme'],
    ['$sme with path', '$sme.temperature'],
    ['$sme with fragment', '$sme.temperature#value'],
    ['$sme indexed path', '$sme.MyList[2].temp#valueType'],
    ['$sme wildcard path', '$sme.a[].b[]#value'],
    ['$sme semantic key', '$sme.some.path#semanticId.keys[3]'],
    ['$sm semantic key', '$sm#semanticId.keys[0]'],
    ['$sm supplemental semantic key', '$sm#supplementalSemanticIds[2].keys[]'],
    ['$cd idShort', '$cd#idShort'],
  ])('accepts BE-valid FILTER fragment: %s', (_label, fragment) => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: {
        FRAGMENT: fragment,
        CONDITION: { $boolean: true },
      },
    })

    expect(result.success).toBe(true)
  })

  it.each([
    ['$sm submodelElements', '$sm#submodelElements[]'],
    ['$sm arbitrary array', '$sm#other[]'],
    ['$cd id', '$cd#id'],
    ['$sme Unicode idShort', '$sme.témperature#value'],
    ['$sme path segment ending in hyphen', '$sme.temperature-#value'],
    ['$sme path beginning with digit', '$sme.1temperature#value'],
  ])('rejects BE-invalid FILTER fragment: %s', (_label, fragment) => {
    const result = configuredRuleSchema.safeParse({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
      FILTER: {
        FRAGMENT: fragment,
        CONDITION: { $boolean: true },
      },
    })

    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Definition Schema
// ═══════════════════════════════════════════════════════════════════════════

describe('definitionSchema', () => {
  // ── DefAttribute ──

  it('accepts a valid DEFATTRIBUTES entry', () => {
    const result = defAttributeSchema.safeParse({
      name: 'adminClaims',
      attributes: [{ CLAIM: 'role' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects DEFATTRIBUTES without name', () => {
    const result = defAttributeSchema.safeParse({
      attributes: [{ CLAIM: 'role' }],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.path.includes('name'))).toBe(true)
  })

  it('rejects DEFATTRIBUTES with empty attributes array', () => {
    const result = defAttributeSchema.safeParse({
      name: 'empty',
      attributes: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects DEFATTRIBUTES with empty attribute source', () => {
    const result = defAttributeSchema.safeParse({
      name: 'bad',
      attributes: [{}],
    })
    expect(result.success).toBe(false)
  })

  it('rejects DEFATTRIBUTES with attribute source having all three keys', () => {
    const result = defAttributeSchema.safeParse({
      name: 'bad',
      attributes: [{ CLAIM: 'role', GLOBAL: 'ANONYMOUS', REFERENCE: '$sm#id' }],
    })
    expect(result.success).toBe(false)
  })

  // ── DefAcl ──

  it('accepts a valid DEFACLS entry', () => {
    const result = defAclSchema.safeParse({
      name: 'readAcl',
      acl: {
        ACCESS: 'ALLOW',
        RIGHTS: ['READ'],
        ATTRIBUTES: [{ CLAIM: 'role' }],
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts DEFACLS with USEATTRIBUTES reference', () => {
    const result = defAclSchema.safeParse({
      name: 'refAcl',
      acl: {
        ACCESS: 'DISABLED',
        RIGHTS: ['ALL'],
        USEATTRIBUTES: 'adminClaims',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects DEFACLS with both ATTRIBUTES and USEATTRIBUTES', () => {
    const result = defAclSchema.safeParse({
      name: 'badAcl',
      acl: {
        ACCESS: 'ALLOW',
        RIGHTS: ['READ'],
        ATTRIBUTES: [{ CLAIM: 'role' }],
        USEATTRIBUTES: 'adminClaims',
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects DEFACLS without name', () => {
    const result = defAclSchema.safeParse({
      acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
    })
    expect(result.success).toBe(false)
  })

  // ── DefObject ──

  it('accepts a valid DEFOBJECTS entry with inline objects', () => {
    const result = defObjectSchema.safeParse({
      name: 'adminRoutes',
      objects: [{ ROUTE: '/security/abac/*' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid DEFOBJECTS entry with USEOBJECTS reference', () => {
    const result = defObjectSchema.safeParse({
      name: 'refRoutes',
      USEOBJECTS: ['baseRoutes'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects DEFOBJECTS with both objects and USEOBJECTS', () => {
    const result = defObjectSchema.safeParse({
      name: 'badRoutes',
      objects: [{ ROUTE: '/x' }],
      USEOBJECTS: ['baseRoutes'],
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneObjects)).toBe(true)
  })

  it('rejects DEFOBJECTS with neither objects nor USEOBJECTS', () => {
    const result = defObjectSchema.safeParse({
      name: 'emptyRoutes',
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.exactlyOneObjects)).toBe(true)
  })

  it('rejects DEFOBJECTS without name', () => {
    const result = defObjectSchema.safeParse({
      objects: [{ ROUTE: '/x' }],
    })
    expect(result.success).toBe(false)
  })

  // ── DefFormula ──

  it('accepts a valid DEFFORMULAS entry', () => {
    const result = defFormulaSchema.safeParse({
      name: 'isAdmin',
      formula: {
        $and: [{ $boolean: true }, { $boolean: false }],
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects DEFFORMULAS without name', () => {
    const result = defFormulaSchema.safeParse({
      formula: { $boolean: true },
    })
    expect(result.success).toBe(false)
  })

  it('rejects DEFFORMULAS without formula', () => {
    const result = defFormulaSchema.safeParse({
      name: 'missingFormula',
    })
    expect(result.success).toBe(false)
  })

  it('rejects DEFFORMULAS with invalid formula', () => {
    const result = defFormulaSchema.safeParse({
      name: 'badFormula',
      formula: { $foobar: 1 },
    })
    expect(result.success).toBe(false)
  })

  // ── schemaForKind ──

  it.each([
    ['attributes', { name: 'test', attributes: [{ CLAIM: 'x' }] }],
    ['acls', { name: 'test', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'x' }] } }],
    ['objects', { name: 'test', objects: [{ ROUTE: '/x' }] }],
    ['formulas', { name: 'test', formula: { $boolean: true } }],
  ] as const)('schemaForKind(%s) accepts valid payload', (kind, payload) => {
    const schema = schemaForKind(kind)
    expect(schema.safeParse(payload).success).toBe(true)
  })

  it.each([
    ['attributes', { name: 'test', formula: { $boolean: true } }],
    ['acls', { name: 'test', attributes: [{ CLAIM: 'x' }] }],
    ['objects', { name: 'test', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'x' }] } }],
    ['formulas', { name: 'test', objects: [{ ROUTE: '/x' }] }],
  ] as const)('schemaForKind(%s) rejects wrong-shaped payload', (kind, payload) => {
    const schema = schemaForKind(kind)
    expect(schema.safeParse(payload).success).toBe(false)
  })

  it('rejects DEFFORMULAS with a semantically invalid formula', () => {
    const result = defFormulaSchema.safeParse({
      name: 'typeMismatch',
      formula: { $eq: [{ $strVal: 'a' }, { $numVal: 1 }] },
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.comparisonTypeMismatch)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Policy Schema
// ═══════════════════════════════════════════════════════════════════════════

describe('policySchema', () => {
  it('accepts a valid minimal policy', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        rules: [
          {
            ACL: validAcl,
            OBJECTS: [validObjectEntry],
            FORMULA: validFormula,
          },
        ],
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts a policy with definitions and rules', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        DEFATTRIBUTES: [{ name: 'adminClaims', attributes: [{ CLAIM: 'role' }] }],
        DEFACLS: [
          {
            name: 'readAcl',
            acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'x the typrole' }] },
          },
        ],
        DEFOBJECTS: [{ name: 'adminRoutes', objects: [{ ROUTE: '/security/abac/*' }] }],
        DEFFORMULAS: [
          {
            name: 'isAdmin',
            formula: { $and: [{ $boolean: true }, { $boolean: false }] },
          },
        ],
        rules: [
          {
            ACL: validAcl,
            OBJECTS: [validObjectEntry],
            FORMULA: validFormula,
          },
        ],
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects policy with empty rules array', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: { rules: [] },
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.some(i => i.message === msgs.rulesRequired)).toBe(true)
  })

  it('rejects policy with an invalid rule in the array', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        rules: [
          { ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula },
          { OBJECTS: [validObjectEntry], FORMULA: validFormula }, // missing ACL
        ],
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects policy missing AllAccessPermissionRules', () => {
    const result = policySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects policy with extra top-level keys (strictObject)', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        rules: [{ ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula }],
      },
      EXTRA: 'not allowed',
    })
    expect(result.success).toBe(false)
  })

  it('accepts policy with extra keys inside the rules object (loose)', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        rules: [{ ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula }],
        EXTRA: 'allowed inside',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects policy with invalid definition in DEFATTRIBUTES', () => {
    const result = policySchema.safeParse({
      AllAccessPermissionRules: {
        DEFATTRIBUTES: [{ name: '', attributes: [] }],
        rules: [{ ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula }],
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('usePolicyValidation', () => {
  const { validateJson } = usePolicyValidation(msgs)

  it('returns error for empty string', () => {
    const r = validateJson('', {
      required: 'required',
      invalidJson: 'invalid',
      invalidPolicy: 'invalid',
    })
    expect(r.policy).toBeNull()
    expect(r.error!.title).toBe('required')
    expect(r.errorLines).toEqual([])
  })

  it('returns error for whitespace-only string', () => {
    const r = validateJson(' '.repeat(3), {
      required: 'required',
      invalidJson: 'invalid',
      invalidPolicy: 'invalid',
    })
    expect(r.error!.title).toBe('required')
  })

  it('returns syntax error for malformed JSON', () => {
    const json = '{ "AllAccessPermissionRules": { "rules": [ }'
    const r = validateJson(json, {
      required: 'required',
      invalidJson: 'SYNTAX',
      invalidPolicy: 'invalid',
    })
    expect(r.policy).toBeNull()
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('returns structural error for JSON that parses but fails schema', () => {
    const json = JSON.stringify({ AllAccessPermissionRules: { rules: [] } })
    const r = validateJson(json, {
      required: 'required',
      invalidJson: 'invalid',
      invalidPolicy: 'SCHEMA_ERROR',
    })
    expect(r.policy).toBeNull()
    expect(r.error!.title).toBe('SCHEMA_ERROR')
    expect(r.errorLines.length).toBeGreaterThan(0)
  })

  it('returns parsed policy for valid JSON', () => {
    const json = JSON.stringify({
      AllAccessPermissionRules: {
        rules: [
          { ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula },
        ],
      },
    })
    const r = validateJson(json, {
      required: 'required',
      invalidJson: 'invalid',
      invalidPolicy: 'invalid',
    })
    expect(r.error).toBeNull()
    expect(r.policy).not.toBeNull()
    expect(r.policy!.AllAccessPermissionRules.rules).toHaveLength(1)
  })
})

describe('useRuleValidation', () => {
  const { validateJson } = useRuleValidation(msgs)

  const rl = {
    required: 'required',
    invalidJson: 'SYNTAX',
    invalidRule: 'SCHEMA',
  }

  it('returns error for empty string', () => {
    const r = validateJson('', rl)
    expect(r.error!.title).toBe('required')
  })

  it('returns syntax error for malformed JSON', () => {
    const r = validateJson('{ broken', rl)
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('returns structural error for JSON missing required fields', () => {
    const r = validateJson('{}', rl)
    expect(r.error!.title).toBe('SCHEMA')
  })

  it('returns parsed rule for valid JSON', () => {
    const json = JSON.stringify({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    const r = validateJson(json, rl)
    expect(r.error).toBeNull()
    expect(r.rule).not.toBeNull()
    expect(r.rule!.ACL).toBeDefined()
  })
})

describe('useDefinitionValidation', () => {
  const { validateJson } = useDefinitionValidation(msgs)

  const dl = {
    requiredKind: 'KIND_REQUIRED',
    requiredDefinition: 'DEF_REQUIRED',
    invalidJson: 'SYNTAX',
    invalidDefinition: 'SCHEMA',
  }

  it('returns error when kind is undefined', () => {
    const r = validateJson('{}', undefined, dl)
    expect(r.error!.title).toBe('KIND_REQUIRED')
  })

  it('returns error when json is empty', () => {
    const r = validateJson('', 'attributes', dl)
    expect(r.error!.title).toBe('DEF_REQUIRED')
  })

  it('returns syntax error for malformed JSON', () => {
    const r = validateJson('{ broken', 'attributes', dl)
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('returns structural error for JSON that fails schema', () => {
    const r = validateJson('{}', 'attributes', dl)
    expect(r.error!.title).toBe('SCHEMA')
  })

  it('returns parsed definition for valid JSON matching kind', () => {
    const json = JSON.stringify({ name: 'test', attributes: [{ CLAIM: 'x' }] })
    const r = validateJson(json, 'attributes', dl)
    expect(r.error).toBeNull()
    expect(r.payload).not.toBeNull()
    expect(r.payload!.name).toBe('test')
  })

  it('returns structural error when kind mismatches payload shape', () => {
    // formulas kind but payload is an attributes shape
    const json = JSON.stringify({ name: 'test', attributes: [{ CLAIM: 'x' }] })
    const r = validateJson(json, 'formulas', dl)
    expect(r.error).not.toBeNull()
    expect(r.error!.title).toBe('SCHEMA')
  })
})
