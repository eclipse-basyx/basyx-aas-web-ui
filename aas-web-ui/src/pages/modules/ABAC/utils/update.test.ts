import { describe, expect, it } from 'vitest'
import { useDefinitionValidation } from '../hooks/validations/useDefinitionValidation'
import { usePolicyValidation } from '../hooks/validations/usePolicyValidation'
import { useRuleValidation } from '../hooks/validations/useRuleValidation'
import { en } from '../i18n/locales'
import { mergeObjects } from './object'
import { detectDefinitionUpdate, detectRuleUpdate, resolveUpdateDocument } from './update'

describe('ABAC update selection', () => {
  it('keeps immutable definition identity in a form merge base without mutating it', () => {
    const original = { name: 'shared', acl: { ACCESS: 'ALLOW', USEATTRIBUTES: 'old' } }
    const mergeBase = { acl: { ACCESS: 'ALLOW' } }
    const update = detectDefinitionUpdate(original, { acl: { RIGHTS: ['READ'] } }, 'acls', { mergeBase })
    expect(resolveUpdateDocument(original, update)).toEqual({ name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'] } })
    expect(mergeBase).toEqual({ acl: { ACCESS: 'ALLOW' } })
    expect(resolveUpdateDocument(original, detectDefinitionUpdate(original, original, 'acls'))).toEqual(original)
  })

  it('derives deletions from a complete document but preserves omissions in JSON merge input', () => {
    const original = { ACL: { ACCESS: 'ALLOW', USEATTRIBUTES: 'old' }, FILTER: { FRAGMENT: 'f' }, extra: true }
    const complete = { ACL: { ACCESS: 'ALLOW' }, extra: true }
    expect(detectRuleUpdate(original, complete, { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { ACL: { USEATTRIBUTES: null }, FILTER: null },
    })
    expect(detectRuleUpdate(original, complete)).toEqual({ mode: 'unchanged', payload: {} })
  })

  it('keeps prior form deletions when JSON edits use the latest form snapshot as their merge base', () => {
    const original = { ACL: { ACCESS: 'ALLOW', USEATTRIBUTES: 'old' }, extra: true }
    const mergeBase = { ACL: { ACCESS: 'ALLOW' }, extra: true }
    const update = detectRuleUpdate(original, { extra: false }, { inputMode: 'merge', mergeBase })
    const effective = update.mode === 'replace' ? update.payload : mergeObjects(original, update.payload)
    expect(effective).toEqual({ ACL: { ACCESS: 'ALLOW' }, extra: false })
    expect(original.ACL.USEATTRIBUTES).toBe('old')
  })

  it('derives the cleared ACL reference for a complete definition update', () => {
    const original = { name: 'shared', acl: { ACCESS: 'ALLOW', USEATTRIBUTES: 'old' } }
    const complete = { name: 'shared', acl: { ACCESS: 'ALLOW' } }
    expect(detectDefinitionUpdate(original, complete, 'acls', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { acl: { USEATTRIBUTES: null } },
    })
  })

  it.each(['null', '[]', '42', 'true', '"text"'])('blocks non-object editor JSON: %s', json => {
    const rule = useRuleValidation(en.rules.ruleDialog.errors, en.validation).validateJson({
      json,
    })
    expect(rule.payload).toBeNull()
    expect(rule.error?.title).toBe(en.rules.ruleDialog.errors.invalidRule)

    const policy = usePolicyValidation(en.policies.import.errors, en.validation).validateJson({
      json,
    })
    expect(policy.payload).toBeNull()
    expect(policy.error?.title).toBe(en.policies.import.errors.invalidPolicy)

    const definition = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation).validateJson({
      json, kind: 'formulas', name: 'shared',
      currentDefinition: { name: 'shared', formula: { $boolean: true } },
    })
    expect(definition.payload).toBeNull()
    expect(definition.error?.title).toBe(en.definitions.definitionDialog.errors.invalidDefinition)

    const createDefinition = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation).validateJson({
      json, kind: 'formulas',
    })
    expect(createDefinition.payload).toBeNull()
  })

  it('skips unchanged documents regardless of object key order', () => {
    expect(detectRuleUpdate({ a: 1, b: 2 }, { b: 2, a: 1 }).mode).toBe('unchanged')
  })

  it('patches a switch from an inline formula to a reference', () => {
    expect(detectRuleUpdate(
      { FORMULA: { $boolean: true } },
      { FORMULA: null, USEFORMULA: 'shared' },
    )).toEqual({ mode: 'patch', payload: { FORMULA: null, USEFORMULA: 'shared' } })
  })

  it('includes nested deletions while leaving unchanged fields out', () => {
    const original = { FORMULA: { $boolean: true }, USEACL: 'admin' }
    const submitted = { FORMULA: { $boolean: null, $not: { $boolean: false } } }
    const operation = detectRuleUpdate(original, submitted)
    expect(operation).toEqual({
      mode: 'patch',
      payload: { FORMULA: { $boolean: null, $not: { $boolean: false } } },
    })
    expect(mergeObjects(original, operation.payload)).toEqual({
      FORMULA: { $not: { $boolean: false } }, USEACL: 'admin',
    })
  })

  it('replaces arrays as complete values', () => {
    expect(detectRuleUpdate(
      { ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ', 'UPDATE'] } },
      { ACL: { RIGHTS: ['READ'] } },
    )).toEqual({ mode: 'patch', payload: { ACL: { RIGHTS: ['READ'] } } })
  })

  it('treats an explicit null as deletion', () => {
    expect(detectRuleUpdate({ value: 1 }, { value: null }))
      .toEqual({ mode: 'patch', payload: { value: null } })
  })

  it('preserves omitted fields at every object level', () => {
    const original = { ACL: { RIGHTS: ['READ'], ACCESS: 'ALLOW' }, USEFORMULA: 'shared' }
    const operation = detectRuleUpdate(original, { ACL: { RIGHTS: ['UPDATE'] } })
    expect(operation).toEqual({ mode: 'patch', payload: { ACL: { RIGHTS: ['UPDATE'] } } })
    expect(mergeObjects(original, operation.payload)).toEqual({
      ACL: { RIGHTS: ['UPDATE'], ACCESS: 'ALLOW' }, USEFORMULA: 'shared',
    })
    expect(detectRuleUpdate(original, {}).mode).toBe('unchanged')
  })

  it('matches the backend when assigning a new object containing null', () => {
    const submitted = { value: { nested: null } }
    const operation = detectRuleUpdate({}, submitted)
    expect(operation.mode).toBe('replace')
    expect(operation.payload).toEqual(submitted)
    expect(mergeObjects({}, operation.payload)).toEqual(submitted)
  })

  it('preserves omitted backend-only fields when changing an upstream attribute source', () => {
    const original = { name: 'shared', formula: { $attribute: { CLAIMPATH: '/roles' } } }
    const submitted = { formula: { $attribute: { CLAIM: 'role' } } }
    expect(detectDefinitionUpdate(original, submitted, 'formulas')).toEqual({ mode: 'patch', payload: submitted })
    expect(mergeObjects(original, submitted)).toEqual({
      name: 'shared', formula: { $attribute: { CLAIMPATH: '/roles', CLAIM: 'role' } },
    })
  })

  it('validates the merged rule when explicitly replacing a formula with a reference', () => {
    const { validateJson } = useRuleValidation(en.rules.ruleDialog.errors, en.validation)
    const result = validateJson({
      json: JSON.stringify({ FORMULA: null, USEFORMULA: 'shared' }),
      currentRule: { USEACL: 'admin', USEOBJECTS: ['routes'], FORMULA: { $boolean: true } },
    })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({ FORMULA: null, USEFORMULA: 'shared' })
  })

  it('validates an inferred switch to a formula reference', () => {
    const { validateJson } = useRuleValidation(en.rules.ruleDialog.errors, en.validation)
    const result = validateJson({
      json: JSON.stringify({ USEFORMULA: 'shared' }),
      currentRule: { USEACL: 'admin', USEOBJECTS: ['routes'], FORMULA: { $boolean: true } },
    })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({ USEFORMULA: 'shared' })
  })

  it('accepts partial nested updates and explicit nested deletions in definitions', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const result = validateJson({
      kind: 'acls',
      name: 'shared',
      json: JSON.stringify({ acl: { USEATTRIBUTES: null, ATTRIBUTES: [{ CLAIM: 'role' }] } }),
      currentDefinition: { name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'old' } },
    })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({ acl: { USEATTRIBUTES: null, ATTRIBUTES: [{ CLAIM: 'role' }] } })
  })

  it('returns the definition editor input without its immutable name', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const result = validateJson({
      kind: 'formulas',
      name: 'shared',
      json: JSON.stringify({ formula: { $boolean: false } }),
      currentDefinition: { name: 'shared', formula: { $boolean: true } },
    })
    expect(result.error).toBeNull()
    expect(result.payload?.name).toBeUndefined()
    expect(result.payload).toEqual({ formula: { $boolean: false } })
  })

  it('returns the parsed policy alongside structural errors for backend-refereed import', () => {
    const { validateJson } = usePolicyValidation(en.policies.import.errors, en.validation)
    const result = validateJson({
      json: JSON.stringify({ AllAccessPermissionRules: {} }),
    })
    expect(result.error).not.toBeNull()
    expect(result.payload).toEqual({ AllAccessPermissionRules: {} })
  })
})

describe('ABAC update detection', () => {
  const current = {
    USEACL: 'admin', OBJECTS: [{ ROUTE: '/shells' }], USEOBJECTS: ['shared'],
    FORMULA: { $boolean: true },
    FILTER: { FRAGMENT: '$sme.temperature#value', CONDITION: { $boolean: true } },
  }

  it('uses PUT for a complete edited document and skips an identical document', () => {
    expect(detectRuleUpdate(current, current).mode).toBe('unchanged')
    const submitted = { ...current, USEACL: 'reader' }
    expect(detectRuleUpdate(current, submitted)).toEqual({ mode: 'replace', payload: submitted })
  })

  it('uses PATCH for partial edits and explicit deletions', () => {
    expect(detectRuleUpdate(current, { USEACL: 'reader' }))
      .toEqual({ mode: 'patch', payload: { USEACL: 'reader' } })
    expect(detectRuleUpdate(current, { FILTER: null }))
      .toEqual({ mode: 'patch', payload: { FILTER: null } })
  })

  it('replaces a formula operator while retaining unrelated rule fields', () => {
    const formula = { $eq: [{ $numVal: 1 }, { $numVal: 2 }] }
    expect(detectRuleUpdate(current, { FORMULA: formula }))
      .toEqual({ mode: 'replace', payload: { ...current, FORMULA: formula } })
  })

  it('replaces filter conditions with references but preserves fragment and match settings', () => {
    expect(detectRuleUpdate(current, { FILTER: { USEFORMULA: 'shared' } }))
      .toEqual({ mode: 'replace', payload: {
        ...current, FILTER: { FRAGMENT: current.FILTER.FRAGMENT, USEFORMULA: 'shared' },
      } })
  })

  it('preserves coexisting object lists and attribute sources when omitted', () => {
    expect(detectRuleUpdate(current, { OBJECTS: [] }))
      .toEqual({ mode: 'patch', payload: { OBJECTS: [] } })
    expect(detectDefinitionUpdate(
      { name: 'shared', attributes: [{ CLAIM: 'role' }] },
      { name: 'shared', USEATTRIBUTES: ['other'] }, 'attributes',
    )).toEqual({ mode: 'patch', payload: { USEATTRIBUTES: ['other'] } })
    expect(detectDefinitionUpdate(
      { name: 'acl', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'shared' } },
      { acl: { ATTRIBUTES: [{ CLAIM: 'role' }] } }, 'acls',
    )).toEqual({ mode: 'patch', payload: { acl: { ATTRIBUTES: [{ CLAIM: 'role' }] } } })
  })

  it('adds object-definition references without removing inline objects', () => {
    expect(detectDefinitionUpdate(
      { name: 'routes', objects: [{ ROUTE: '/shells' }] },
      { USEOBJECTS: ['other'] }, 'objects',
    )).toEqual({ mode: 'patch', payload: { USEOBJECTS: ['other'] } })
  })

  it('switches nested attribute operands without replacing the surrounding expression', () => {
    expect(detectDefinitionUpdate(
      { name: 'test', formula: { $boolCast: { $attribute: { CLAIM: 'role' } } } },
      { formula: { $boolCast: { $attribute: { GLOBAL: 'ANONYMOUS' } } } }, 'formulas',
    )).toEqual({ mode: 'replace', payload: {
      name: 'test', formula: { $boolCast: { $attribute: { GLOBAL: 'ANONYMOUS' } } },
    } })
  })

  it('does not resolve multiple explicitly supplied alternatives by dropping user input', () => {
    const submitted = { FORMULA: { $boolean: false }, USEFORMULA: 'shared' }
    expect(detectRuleUpdate(current, submitted))
      .toEqual({ mode: 'patch', payload: submitted })
  })

  it('does not convert definition categories based on pasted keys', () => {
    expect(detectDefinitionUpdate({ name: 'test', formula: { $boolean: true } }, { acl: {} }, 'formulas'))
      .toEqual({ mode: 'patch', payload: { acl: {} } })
    const result = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation).validateJson({
      json: JSON.stringify({ acl: {} }), kind: 'formulas',
      currentDefinition: { name: 'test', formula: { $boolean: true } },
    })
    expect(result.error).not.toBeNull()
    expect(result.payload).toEqual({ acl: {} })
  })
})
