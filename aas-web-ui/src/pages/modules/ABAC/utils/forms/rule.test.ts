import type { RuleState } from '../../types/forms'
import type { JsonObject } from '../../types/json'
import { describe, expect, it } from 'vitest'
import { useRuleValidation } from '../../hooks/validations/useRuleValidation'
import { en } from '../../i18n/locales'
import { mergeObjects } from '../object'
import { detectRuleUpdate } from '../update'
import { decodeExpression } from './expression'
import { applyRuleState, representRule, ruleFormState } from './rule'

describe('rule form codec', () => {
  it('preserves unknown root fields while editing supported rule content', () => {
    const sourceRule = { USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [{ ROUTE: '/shells' }], future: { enabled: true } }
    const formState = ruleFormState(sourceRule)!
    formState.objects.entries = [{ kind: 'ROUTE', value: '/submodels' }]
    expect(applyRuleState(sourceRule, formState)).toEqual({ ...sourceRule, OBJECTS: [{ ROUTE: '/submodels' }] })
    expect(sourceRule.OBJECTS).toEqual([{ ROUTE: '/shells' }])
    expect(sourceRule.future).toEqual({ enabled: true })
  })

  it('preserves a missing ACL until the inline form contains a value', () => {
    const sourceRule = { USEFORMULA: 'formula', OBJECTS: [] }
    const representation = representRule(sourceRule)
    expect(representation.ok).toBe(true)
    expect(representation.rule?.acl).toEqual({ mode: 'inline', acl: {} })
    const formState = representation.rule!
    expect(applyRuleState(sourceRule, formState)).toEqual(sourceRule)
    expect(applyRuleState(undefined, formState)).not.toHaveProperty('ACL')
    expect(applyRuleState(sourceRule, { ...formState, acl: { mode: 'inline', acl: { access: 'ALLOW' } } }))
      .toEqual({ ...sourceRule, ACL: { ACCESS: 'ALLOW' } })
  })

  it('omits a cleared nested filter reference and derives its deletion at the update boundary', () => {
    const base = { USEACL: 'acl', USEFORMULA: 'formula', USEOBJECTS: ['objects'], FILTER: { FRAGMENT: 'fragment', USEFORMULA: 'old' } }
    const state = ruleFormState(base)!
    state.filters[0]!.condition = { mode: 'reference', name: undefined }
    const doc = applyRuleState(base, state)
    expect(doc.FILTERLIST).toEqual([{ FRAGMENT: 'fragment' }])
    expect(representRule(doc).ok).toBe(true)
    const update = detectRuleUpdate(base, doc, { inputMode: 'complete' })
    const effective = update.mode === 'replace' ? update.payload : mergeObjects(base, update.payload)
    expect(effective).not.toHaveProperty('FILTER')
    expect(effective.FILTERLIST).toEqual([{ FRAGMENT: 'fragment' }])
  })
  const documents: unknown[] = [
    {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $eq: [{ $attribute: { CLAIM: 'role' } }, { $strVal: 'admin' }] },
    },
    {
      USEACL: 'readAcl',
      OBJECTS: [{ ROUTE: '/shells' }],
      USEOBJECTS: ['routes'],
      USEFORMULA: 'isAdmin',
    },
    {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' },
      OBJECTS: [{ ROUTE: '/shells' }, { IDENTIFIABLE: 'id' }],
      USEOBJECTS: ['routes'],
      FORMULA: { $boolean: true },
    },
    {
      USEACL: 'readAcl',
      OBJECTS: [{ ROUTE: '/shells' }],
      USEFORMULA: 'isAdmin',
      FILTER: { FRAGMENT: '$sm#idShort', CONDITION: { $boolean: true } },
    },
    {
      USEACL: 'readAcl',
      OBJECTS: [{ ROUTE: '/shells' }],
      USEFORMULA: 'isAdmin',
      FILTER: { FRAGMENT: '$sm#idShort', USEFORMULA: 'isAdmin' },
    },
  ]

  it('round-trips every supported rule document', () => {
    for (const doc of documents) {
      const representation = representRule(doc)
      expect(representation.ok, JSON.stringify(doc)).toBe(true)
      expect(representation.rule).toBeDefined()
      expect(applyRuleState(doc as never, representation.rule!)).toEqual(doc)
    }
  })

  it('reports unsupported rule content with limitation tokens', () => {
    expect(representRule({ ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] }, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true }, FILTERLIST: [{ FRAGMENT: 'f', CONDITION: { $future: true } }] })).toEqual({ ok: false, limitation: 'expression', rule: undefined })
    expect(representRule({ ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] }, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true }, USEFORMULA: 'shared' })).toEqual({ ok: false, limitation: 'structure', rule: undefined })
    expect(representRule({ USEACL: 'shared', OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true } }).ok).toBe(true)

    const expressionOnly = representRule({ USEACL: 'a', OBJECTS: [], FORMULA: { $strCast: { $strVal: 'x' } } })
    expect(expressionOnly).toEqual({ ok: false, limitation: 'expression', rule: undefined })

    expect(representRule({ USEACL: {}, OBJECTS: [] })).toEqual({ ok: false, limitation: 'structure', rule: undefined })
    expect(representRule({ ACL: {}, USEACL: 'a', OBJECTS: [{ ROUTE: '/shells' }] })).toEqual({ ok: false, limitation: 'structure', rule: undefined })
    expect(representRule({ USEACL: 'a', OBJECTS: [{ UNKNOWN: 'x' }], FORMULA: { $boolean: true } })).toEqual({ ok: false, limitation: 'attributeItem', rule: undefined })
    // Reference alternatives and forms of both object lists are valid rules.
    expect(representRule({ USEACL: 'a', USEFORMULA: 'f', OBJECTS: [{ ROUTE: '/shells' }], USEOBJECTS: ['b'] }).ok).toBe(true)
  })

  it('represents an empty inline ACL without inventing values', () => {
    const representation = representRule({ ACL: {}, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true } })
    expect(representation.ok).toBe(true)
    expect(representation.rule).toEqual({
      acl: { mode: 'inline', acl: {} },
      objects: { entries: [{ kind: 'ROUTE', value: '/shells' }], references: [] },
      formula: { mode: 'inline', formula: { kind: 'boolean', value: true } },
      filters: [],
    })
    expect(applyRuleState({ ACL: {}, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true } } as never, representation.rule!)).toEqual({
      ACL: {}, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true },
    })
  })

  it('opens rules without a formula alternative as a pending inline formula', () => {
    const bare = { ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' }, OBJECTS: [{ ROUTE: '/shells' }] }
    const representation = representRule(bare)
    expect(representation.ok).toBe(true)
    expect(representation.rule?.formula).toEqual({ mode: 'inline', formula: null })
    expect(applyRuleState(bare, representation.rule!)).toEqual(bare)
  })

  it('omits a cleared formula reference from the complete form document', () => {
    const original = { USEACL: 'acl', OBJECTS: [{ ROUTE: '/shells' }], USEFORMULA: 'isAdmin' }
    const state = ruleFormState(original)!
    const cleared = applyRuleState(original, { ...state, formula: { mode: 'reference', name: undefined } })
    expect(cleared).toEqual({ USEACL: 'acl', OBJECTS: [{ ROUTE: '/shells' }] })
    expect(representRule(cleared).ok).toBe(true)
    expect(detectRuleUpdate(original, cleared, { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { USEFORMULA: null } })
    expect(representRule({ ...cleared, USEFORMULA: null }).ok).toBe(false)
  })

  it('round-trips a pending condition-less filter', () => {
    const pending = {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $boolean: true },
      FILTER: { FRAGMENT: '$sm#idShort' },
    }
    const representation = representRule(pending)
    expect(representation.ok).toBe(true)
    expect(representation.rule?.filters[0]?.condition).toBeUndefined()
    expect(applyRuleState(pending, representation.rule!)).toEqual(pending)
  })

  it('emits empty arrays for cleared update lists and keeps omission on create', () => {
    const base = { ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] }, OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true } }
    const cleared = applyRuleState(base, {
      acl: { mode: 'inline', acl: { access: 'ALLOW', rights: ['READ'], attributes: [] } },
      objects: { entries: [], references: [] },
      formula: { mode: 'inline', formula: { kind: 'boolean', value: true } },
      filters: [],
    })
    expect(cleared).toEqual({
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [] },
      OBJECTS: [],
      FORMULA: { $boolean: true },
    })
  })

  it('omits cleared object references and derives their update deletion', () => {
    const original = { ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] }, OBJECTS: [{ ROUTE: '/shells' }], USEOBJECTS: ['routes'], FORMULA: { $boolean: true } }
    const state = ruleFormState(original)!
    const cleared = applyRuleState(original, { ...state, objects: { ...state.objects, references: [] } })
    expect(cleared).not.toHaveProperty('USEOBJECTS')
    expect(cleared.OBJECTS).toEqual(original.OBJECTS)
    expect(detectRuleUpdate(original, cleared, { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { USEOBJECTS: null } })
    const emptyJson = { ...original, USEOBJECTS: [] }
    expect(representRule(emptyJson).ok).toBe(true)
    expect(applyRuleState(emptyJson, ruleFormState(emptyJson)!)).toEqual(emptyJson)
  })

  it('omits the removed filter from form documents and derives its update deletion', () => {
    const base = {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $boolean: true },
      FILTER: { FRAGMENT: 'f', CONDITION: { $boolean: true } },
    }
    const state = ruleFormState(base)!
    const cleared = applyRuleState(base, { ...state, filters: [] })
    expect(cleared).toEqual({
      ACL: base.ACL, OBJECTS: base.OBJECTS, FORMULA: base.FORMULA,
    })
    expect(detectRuleUpdate(base, cleared, { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { FILTER: null } })

    const created = applyRuleState(undefined, { ...state, filters: [] })
    expect(created).toEqual({ ACL: base.ACL, OBJECTS: base.OBJECTS, FORMULA: base.FORMULA })
  })

  it('switches alternative mode through the shared update detector', () => {
    const base = {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $boolean: true },
    }
    const state = {
      acl: { mode: 'reference', name: 'readAcl' },
      objects: { entries: [{ kind: 'ROUTE', value: '/shells' }], references: [] },
      formula: { mode: 'inline', formula: { kind: 'boolean', value: true } },
      filters: [],
    } satisfies RuleState
    const submitted = applyRuleState(base, state)
    expect(submitted).toEqual({
      USEACL: 'readAcl', OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true },
    })
    expect(detectRuleUpdate(base, submitted)).toEqual({ mode: 'replace', payload: {
      USEACL: 'readAcl', OBJECTS: [{ ROUTE: '/shells' }], FORMULA: { $boolean: true },
    } })
  })

  it('submits form edits through the existing rule validation flow', () => {
    const { validateJson } = useRuleValidation(en.rules.ruleDialog.errors, en.validation)
    const base = documents[0] as JsonObject
    const edited = ruleFormState({
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ', 'UPDATE'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $eq: [{ $attribute: { CLAIM: 'role' } }, { $strVal: 'admin' }] },
    })!
    const submitted = applyRuleState(base, edited)
    const result = validateJson({ json: JSON.stringify(submitted), currentRule: base })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual(submitted)
    expect(detectRuleUpdate(base, result.payload as never).mode).toBe('replace')
    expect(mergeObjects(base, result.payload as never)).toEqual(submitted)
  })

  it('represents expressions inside rule FILTER conditions and formula references', () => {
    const expression = decodeExpression({ $eq: [{ $attribute: { CLAIM: 'role' } }, { $strVal: 'admin' }] })
    expect(expression).toBeDefined()
  })
})

describe('filter list editing and preservation', () => {
  const base = { USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [] }
  const first = { FRAGMENT: '$sm#idShort', USEFORMULA: 'first' }
  const last = { FRAGMENT: '$sme#value', CONDITION: { $boolean: true } }

  it.each([
    {}, { FILTER: first }, { FILTERLIST: [] }, { FILTERLIST: [first] },
    { FILTERLIST: [first, first], FILTER: last },
  ])('preserves untouched source fields, including while editing elsewhere: %j', filters => {
    const source = { ...base, ...filters }
    expect(representRule(source).ok).toBe(true)
    const state = ruleFormState(source)!
    expect(applyRuleState(source, state)).toEqual(source)
    expect(applyRuleState(source, { ...state, acl: { mode: 'reference', name: 'changed' } })).toEqual({ ...source, USEACL: 'changed' })
  })

  it('combines backend order and converts both fields on the first filter edit with deletion markers', () => {
    const source = { ...base, FILTERLIST: [first], FILTER: last }
    const state = ruleFormState(source)!
    expect(state.filters.map(filter => filter.fragment)).toEqual([first.FRAGMENT, last.FRAGMENT])
    state.filters[1] = { ...state.filters[1], fragment: '$sm#idShort' }
    const complete = applyRuleState(source, state)
    const expected = [first, { ...last, FRAGMENT: '$sm#idShort' }]
    expect(complete).toEqual({ ...base, FILTERLIST: expected })
    expect(detectRuleUpdate(source, complete, { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { FILTER: null, FILTERLIST: expected } })
    expect(source.FILTER).toEqual(last)
    expect(representRule(complete).ok).toBe(true)
    const validation = useRuleValidation(en.rules.ruleDialog.errors, en.validation)
    expect(validation.validateJson({ json: JSON.stringify(complete), currentRule: source, inputMode: 'complete' }).error).toBeNull()
  })

  it('converts a lone legacy filter on add/edit, retains a list with one entry, and removes both fields when cleared', () => {
    const legacy = { ...base, FILTER: first }
    const state = ruleFormState(legacy)!
    state.filters.push(ruleFormState({ ...base, FILTER: last })!.filters[0]!)
    const added = applyRuleState(legacy, state)
    expect(added).toEqual({ ...base, FILTERLIST: [first, last] })
    const single = applyRuleState(added, { ...state, filters: [state.filters[0]!] })
    expect(single).toEqual({ ...base, FILTERLIST: [first] })
    const both = { ...base, FILTER: last, FILTERLIST: [first] }
    const cleared = applyRuleState(both, { ...state, filters: [] })
    expect(cleared).toEqual(base)
    expect(detectRuleUpdate(both, cleared, { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { FILTER: null, FILTERLIST: null } })
  })

  it.each([null, {}, [null], [{ FRAGMENT: '$sm#idShort', CONDITION: { $future: true } }], [{ ...first, extra: true }]])(
    'keeps unsupported filter-list content in JSON without modifying it: %j', FILTERLIST => {
      const source = { ...base, FILTERLIST }
      const before = JSON.stringify(source)
      expect(representRule(source).ok).toBe(false)
      expect(JSON.stringify(source)).toBe(before)
    },
  )
})
