import { describe, expect, it } from 'vitest'
import { en } from '../i18n/locales'
import { useDefinitionValidation } from './useDefinitionValidation'
import { usePolicyValidation } from './usePolicyValidation'
import { useRuleValidation } from './useRuleValidation'

const msgs = en.validation
const validFormula = { $boolean: true }
const validAcl = { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] }
const validObjectEntry = { ROUTE: '/shells/*' }

describe('usePolicyValidation', () => {
  const { validateJson } = usePolicyValidation({ required: 'required', invalidJson: 'SYNTAX', invalidPolicy: 'SCHEMA' }, msgs)

  it.each(['null', '[]', '42', 'true', '"policy"'])('blocks non-object JSON: %s', json => {
    const result = validateJson({ json })
    expect(result.policy).toBeNull()
    expect(result.error?.title).toBe('SCHEMA')
  })

  it('returns error for empty string', () => {
    const r = validateJson({
      json: '',
    })
    expect(r.policy).toBeNull()
    expect(r.error!.title).toBe('required')
  })

  it('returns error for whitespace-only string', () => {
    const r = validateJson({
      json: ' '.repeat(3),
    })
    expect(r.error!.title).toBe('required')
  })

  it('returns syntax error for malformed JSON', () => {
    const json = '{ "AllAccessPermissionRules": { "rules": [ }'
    const r = validateJson({
      json,
    })
    expect(r.policy).toBeNull()
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('returns structural error for JSON that parses but fails schema', () => {
    const json = JSON.stringify({ AllAccessPermissionRules: { rules: [{}] } }, null, 2)
    const r = validateJson({
      json,
    })
    // Advisory: the parsed document is returned so import can still be attempted; the backend decides.
    expect(r.policy).toEqual({ AllAccessPermissionRules: { rules: [{}] } })
    expect(r.error!.title).toBe('SCHEMA')
  })

  it('returns parsed policy for valid JSON', () => {
    const json = JSON.stringify({
      AllAccessPermissionRules: {
        rules: [
          { ACL: validAcl, OBJECTS: [validObjectEntry], FORMULA: validFormula },
        ],
      },
    })
    const r = validateJson({
      json,
    })
    expect(r.error).toBeNull()
    expect(r.policy).not.toBeNull()
    expect(r.policy).toEqual(JSON.parse(json))
  })
})

describe('useRuleValidation', () => {
  const errorMessages = {
    required: 'required',
    invalidJson: 'SYNTAX',
    invalidRule: 'SCHEMA',
  }
  const { validateJson } = useRuleValidation(errorMessages, msgs)

  it('returns error for empty string', () => {
    const r = validateJson({ json: '' })
    expect(r.error!.title).toBe('required')
  })

  it('returns syntax error for malformed JSON', () => {
    const r = validateJson({ json: '{ broken' })
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('returns structural error for JSON missing required fields', () => {
    const r = validateJson({ json: '{}' })
    expect(r.rule).toEqual({})
    expect(r.error!.title).toBe('SCHEMA')
  })

  it.each(['null', '[]', '42', 'true', '"rule"'])('blocks non-object JSON: %s', json => {
    const result = validateJson({ json })
    expect(result.rule).toBeNull()
    expect(result.error?.title).toBe('SCHEMA')
  })

  it('keeps backend extensions submittable without deleting unknown properties', () => {
    const input = { USEACL: 'acl', USEOBJECTS: ['object'], USEFORMULA: 'formula', extra: 'preserve me' }
    const result = validateJson({ json: JSON.stringify(input) })
    expect(result.rule).toEqual(input)
    expect(result.error?.title).toBe('SCHEMA')
  })

  it('validates the merged update rather than treating omitted fields as missing', () => {
    const currentRule = { USEACL: 'acl', USEOBJECTS: ['object'], USEFORMULA: 'formula' }
    const result = validateJson({ json: '{"USEACL":"other"}', currentRule })
    expect(result.error).toBeNull()
    expect(result.rule).toEqual({ USEACL: 'other' })
  })

  it('returns parsed rule for valid JSON', () => {
    const json = JSON.stringify({
      ACL: validAcl,
      OBJECTS: [validObjectEntry],
      FORMULA: validFormula,
    })
    const r = validateJson({ json })
    expect(r.error).toBeNull()
    expect(r.rule).not.toBeNull()
    expect(r.rule!.ACL).toBeDefined()
  })
})

describe('useDefinitionValidation', () => {
  const errorMessages = {
    requiredKind: 'KIND_REQUIRED',
    requiredDefinition: 'DEF_REQUIRED',
    invalidJson: 'SYNTAX',
    invalidDefinition: 'SCHEMA',
    requiredName: 'NAME_REQUIRED',
    cannotRename: 'CANNOT_RENAME',
  }
  const { validateJson } = useDefinitionValidation(errorMessages, msgs)

  it('returns error when kind is undefined', () => {
    const r = validateJson({ json: '{}', kind: undefined })
    expect(r.error!.title).toBe('KIND_REQUIRED')
  })

  it('returns error when json is empty', () => {
    const r = validateJson({ json: '', kind: 'attributes' })
    expect(r.error!.title).toBe('DEF_REQUIRED')
  })

  it('returns syntax error for malformed JSON', () => {
    const r = validateJson({ json: '{ broken', kind: 'attributes' })
    expect(r.error!.title).toBe('SYNTAX')
  })

  it('blocks an object without definition identity', () => {
    const r = validateJson({ json: '{}', kind: 'attributes' })
    expect(r.payload).toBeNull()
    expect(r.error?.messages).toContain(errorMessages.requiredName)
    expect(r.error!.title).toBe('SCHEMA')
  })

  it.each(['null', '[]', '42', 'true', '"definition"'])('blocks non-object JSON even with a supplied name: %s', json => {
    const result = validateJson({ json, kind: 'attributes', name: 'shared' })
    expect(result.payload).toBeNull()
    expect(result.error?.title).toBe('SCHEMA')
  })

  it.each([undefined, 'shared'])('validates a merged definition update with omitted or unchanged name: %s', name => {
    const currentDefinition = { name: 'shared', acl: validAcl }
    const before = structuredClone(currentDefinition)
    const result = validateJson({
      json: JSON.stringify({ name, acl: { ACCESS: 'DISABLED' } }),
      kind: 'acls', currentDefinition,
    })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({ acl: { ACCESS: 'DISABLED' } })
    expect(currentDefinition).toEqual(before)
  })

  it.each(['renamed', '', null, 42])('blocks an explicit definition identity change: %s', name => {
    const currentDefinition = { name: 'shared', acl: validAcl }
    const before = structuredClone(currentDefinition)
    const result = validateJson({
      json: JSON.stringify({ name, acl: { ACCESS: 'DISABLED' } }),
      kind: 'acls', currentDefinition,
    })
    expect(result.payload).toBeNull()
    expect(result.error).toEqual({ title: errorMessages.invalidDefinition, messages: [errorMessages.cannotRename] })
    expect(currentDefinition).toEqual(before)
  })

  it('reports deletion of required definition content while preserving the deletion payload', () => {
    const result = validateJson({
      json: '{"formula":null}', kind: 'formulas',
      currentDefinition: { name: 'shared', formula: validFormula },
    })
    expect(result.payload).toEqual({ formula: null })
    expect(result.error?.title).toBe('SCHEMA')
    expect(result.error?.messages).toContain(`formula: ${msgs.schemaRequired}`)
  })

  it('returns parsed definition for valid JSON matching kind', () => {
    const json = JSON.stringify({ name: 'test', attributes: [{ CLAIM: 'x' }] })
    const r = validateJson({ json, kind: 'attributes' })
    expect(r.error).toBeNull()
    expect(r.payload).not.toBeNull()
    expect(r.payload!.name).toBe('test')
  })

  it.each([undefined, null, '', ' '.repeat(3), 42])('blocks a missing or invalid definition identity: %s', name => {
    const r = validateJson({ json: JSON.stringify({ name, attributes: [] }), kind: 'attributes' })
    expect(r.payload).toBeNull()
    expect(r.error?.messages).toContain(errorMessages.requiredName)
  })

  it('keeps schema errors advisory when the definition has an identity', () => {
    const r = validateJson({ json: '{"name":"shared","extra":true}', kind: 'formulas' })
    expect(r.payload).toEqual({ name: 'shared', extra: true })
    expect(r.error).not.toBeNull()
  })

  it('returns structural error when kind mismatches payload shape', () => {
    // formulas kind but payload is an attributes shape
    const json = JSON.stringify({ name: 'test', attributes: [{ CLAIM: 'x' }] })
    const r = validateJson({ json, kind: 'formulas' })
    expect(r.error).not.toBeNull()
    expect(r.error!.title).toBe('SCHEMA')
  })
})
