import type { DefinitionFormState } from '../../types/forms'
import { describe, expect, it } from 'vitest'
import { useDefinitionValidation } from '../../hooks/validations/useDefinitionValidation'
import { en } from '../../i18n/locales'
import { mergeObjects } from '../object'
import { detectDefinitionUpdate } from '../update'
import { applyDefinitionState, definitionFormState, definitionLimitation, representDefinition } from './definitions'

describe('complete ACL definition documents', () => {
  it('omits a cleared reference and leaves deletion markers to update preparation', () => {
    const original = { name: 'shared', acl: { ACCESS: 'ALLOW', USEATTRIBUTES: 'old' } }
    const state = definitionFormState('acls', original)!
    if (state.kind !== 'acls') {
      throw new Error('Expected ACL definition')
    }
    const complete = applyDefinitionState(original, { ...state, acls: { acl: { ...state.acls.acl, useAttributes: undefined } } })
    expect(complete).toEqual({ name: 'shared', acl: { ACCESS: 'ALLOW' } })
    expect(detectDefinitionUpdate(original, complete, 'acls', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { acl: { USEATTRIBUTES: null } },
    })
  })
})

describe('definition form codec', () => {
  it('opens missing object sources without inventing a list, then allows either source to be added', () => {
    const original = { name: 'pending' }
    expect(representDefinition('objects', original).ok).toBe(true)
    const state = definitionFormState('objects', original)!
    if (state.kind !== 'objects') {
      throw new Error('Expected objects state')
    }
    expect(applyDefinitionState(original, state)).toEqual(original)
    expect(applyDefinitionState({ name: 'renamed' }, state)).toEqual({ name: 'renamed' })
    state.objects.references = ['shared']
    expect(applyDefinitionState(original, state)).toEqual({ name: 'pending', USEOBJECTS: ['shared'] })
    state.objects.references = []
    state.objects.entries = [{ kind: 'ROUTE', value: '/shells' }]
    expect(applyDefinitionState(original, state)).toEqual({ name: 'pending', objects: [{ ROUTE: '/shells' }] })
  })

  it.each([
    { $strVal: { nested: true } },
    { $numVal: null },
    { $timeVal: [] },
    { $attribute: { UNKNOWN: 'role' } },
    { $attribute: { GLOBAL: 'OTHER' } },
  ])('keeps unsupported formula operands in JSON mode without changing them: %j', operand => {
    const definitionDocument = { name: 'formula', formula: { $eq: [operand, { $strVal: 'x' }] } }
    const originalJson = JSON.stringify(definitionDocument)
    expect(representDefinition('formulas', definitionDocument).ok).toBe(false)
    expect(definitionLimitation('formulas', definitionDocument)).toBe('expression')
    expect(JSON.stringify(definitionDocument)).toBe(originalJson)
  })

  it('preserves outer extras and keeps unsupported nested ACL extras in JSON mode', () => {
    const definitionDocument = { name: 'acl', extra: { enabled: true }, acl: { ACCESS: 'ALLOW', extra: 1 } }
    expect(representDefinition('acls', definitionDocument).ok).toBe(false)
    expect(definitionDocument.acl.extra).toBe(1)
  })

  it('combines object entries with references and removes cleared references on complete updates', () => {
    const original = { name: 'routes', objects: [{ ROUTE: '/shells' }], USEOBJECTS: ['target'] }
    const state = definitionFormState('objects', original)!
    if (state.kind !== 'objects') {
      throw new Error('Expected objects state')
    }
    expect(representDefinition('objects', original).ok).toBe(true)
    expect(applyDefinitionState(original, state)).toEqual(original)
    state.objects.references = []
    const cleared = applyDefinitionState(original, state)
    expect(cleared).toEqual({ name: 'routes', objects: original.objects })
    expect(detectDefinitionUpdate(original, cleared, 'objects', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { USEOBJECTS: null },
    })
  })
  const documents: Array<{ kind: Parameters<typeof representDefinition>[0], doc: object }> = [
    { kind: 'attributes', doc: { name: 'claims', attributes: [{ CLAIM: 'role' }, { GLOBAL: 'ANONYMOUS' }, { REFERENCE: '$sm#idShort' }] } },
    { kind: 'attributes', doc: { name: 'claims', attributes: [{ CLAIM: 'role' }], USEATTRIBUTES: ['other'] } },
    { kind: 'attributes', doc: { name: 'claims', USEATTRIBUTES: ['other'] } },
    { kind: 'acls', doc: { name: 'readAcl', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' } } },
    { kind: 'acls', doc: { name: 'readAcl', acl: { ACCESS: 'DISABLED', RIGHTS: ['READ', 'UPDATE'], ATTRIBUTES: [{ CLAIM: 'role' }] } } },
    { kind: 'objects', doc: { name: 'routes', objects: [{ ROUTE: '/shells' }, { IDENTIFIABLE: 'id' }] } },
    { kind: 'objects', doc: { name: 'routes', USEOBJECTS: ['other'] } },
    { kind: 'objects', doc: { name: 'routes', objects: [{ ROUTE: '/a' }], USEOBJECTS: ['other'] } },
    { kind: 'objects', doc: { name: 'routes', objects: [], USEOBJECTS: [] } },
    { kind: 'formulas', doc: { name: 'isAdmin', formula: { $eq: [{ $attribute: { CLAIM: 'role' } }, { $strVal: 'admin' }] } } },
    { kind: 'attributes', doc: { name: 'shared', attributes: [{ CLAIM: 'role' }], future: { nested: [1] } } },
  ]

  it('round-trips every supported definition document', () => {
    for (const { kind, doc } of documents) {
      expect(representDefinition(kind, doc).ok, JSON.stringify(doc)).toBe(true)
      const state = definitionFormState(kind, doc)
      expect(applyDefinitionState(doc as never, state!)).toEqual(doc)
    }
  })

  it('reports unsupported content with a stable limitation token', () => {
    expect(definitionLimitation('attributes', { name: 'x', attributes: [{ CLAIM: 'role', GLOBAL: 'LOCALNOW' }] })).toBe('attributeItem')
    expect(definitionLimitation('attributes', { name: 'x', attributes: [{}] })).toBe('attributeItem')
    expect(definitionLimitation('attributes', { name: 'x', attributes: [{ GLOBAL: 'OTHER' }] })).toBe('attributeItem')
    expect(definitionLimitation('acls', { name: 'x', acl: { ACCESS: 'HOLD', RIGHTS: ['READ'] } })).toBe('rights')
    expect(definitionLimitation('acls', { name: 'x', acl: 'text' })).toBe('structure')
    expect(definitionLimitation('objects', { name: 'x', objects: [{ UNKNOWN: 'a' }] })).toBe('attributeItem')
    expect(definitionLimitation('formulas', { name: 'x', formula: { $boolCast: { $attribute: { CLAIM: 'role' } } } })).toBe('expression')
    expect(definitionLimitation('formulas', { name: 'x', formula: { $and: [{ $boolean: true }] } })).toBe('expression')
    for (const { kind, doc } of documents) {
      expect(representDefinition(kind, doc).ok).toBe(true)
    }
  })

  it('does not invent defaults when applying unchanged states', () => {
    const base = { name: 'shared', USEATTRIBUTES: ['other'] }
    const state = definitionFormState('attributes', base)
    expect(applyDefinitionState(base, state!)).toEqual(base)
  })

  it('emits empty arrays for cleared update lists and stays absent on create', () => {
    const updateBase = { name: 'shared', attributes: [{ CLAIM: 'role' }], USEATTRIBUTES: ['other'] }
    const state = { kind: 'attributes', attributes: { entries: [], references: ['other'] } } as DefinitionFormState
    expect(applyDefinitionState(updateBase, state)).toEqual({ name: 'shared', attributes: [], USEATTRIBUTES: ['other'] })
    expect(applyDefinitionState(undefined, state)).toEqual({ USEATTRIBUTES: ['other'] })

    const createEntries = { kind: 'attributes', attributes: { entries: [{ kind: 'CLAIM', value: 'role' }], references: [] } } satisfies DefinitionFormState
    expect(applyDefinitionState(undefined, createEntries as never)).toEqual({ attributes: [{ CLAIM: 'role' }] })
  })

  it('removes a cleared optional attribute reference and clears its alternatives advisory', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const initial = { name: 'claims', attributes: [{ CLAIM: 'role' }] }
    const withReference = { ...initial, USEATTRIBUTES: ['other'] }
    const advisory = validateJson({ json: JSON.stringify(withReference), kind: 'attributes' })
    expect(advisory.payload).not.toBeNull()
    expect(advisory.error?.paths).toContainEqual([])
    const state = definitionFormState('attributes', withReference)!
    if (state.kind !== 'attributes') {
      throw new Error('Expected attributes state')
    }
    const cleared = applyDefinitionState(withReference, { ...state, attributes: { ...state.attributes, references: [] } })
    expect(cleared).toEqual(initial)
    expect(validateJson({ json: JSON.stringify(cleared), kind: 'attributes' }).error).toBeNull()
    expect(validateJson({ json: JSON.stringify(cleared), kind: 'attributes', currentDefinition: withReference, inputMode: 'complete' }).error).toBeNull()
    expect(detectDefinitionUpdate(withReference, cleared, 'attributes', { inputMode: 'complete' })).toEqual({ mode: 'patch', payload: { USEATTRIBUTES: null } })
  })

  it('preserves untouched explicit empty reference arrays when opening JSON in the form', () => {
    const doc = { name: 'claims', attributes: [{ CLAIM: 'role' }], USEATTRIBUTES: [] }
    expect(representDefinition('attributes', doc).ok).toBe(true)
    expect(applyDefinitionState(doc, definitionFormState('attributes', doc)!)).toEqual(doc)
  })

  it('keeps references when adding inline objects and validates both sources together', () => {
    const original = { name: 'routes', USEOBJECTS: ['other'] }
    const state = definitionFormState('objects', original)!
    if (state.kind !== 'objects') {
      throw new Error('Expected objects state')
    }
    state.objects.entries = [{ kind: 'ROUTE', value: '/shells' }]
    const complete = applyDefinitionState(original, state)
    expect(complete).toEqual({ ...original, objects: [{ ROUTE: '/shells' }] })
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    expect(validateJson({ json: JSON.stringify(complete), kind: 'objects' }).error).toBeNull()
    expect(detectDefinitionUpdate(original, complete, 'objects', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { objects: [{ ROUTE: '/shells' }] },
    })
    state.objects.entries = []
    const cleared = applyDefinitionState(complete, state)
    expect(cleared).toEqual({ ...original, objects: [] })
    expect(detectDefinitionUpdate(complete, cleared, 'objects', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { objects: [] },
    })
  })

  it('returns to an empty inline list when the last object reference is cleared', () => {
    const original = { name: 'routes', USEOBJECTS: ['other'] }
    const state = definitionFormState('objects', original)!
    if (state.kind !== 'objects') {
      throw new Error('Expected objects state')
    }
    state.objects.references = []
    const complete = applyDefinitionState(original, state)
    expect(complete).toEqual({ name: 'routes', objects: [] })
    expect(representDefinition('objects', complete).ok).toBe(true)
    expect(detectDefinitionUpdate(original, complete, 'objects', { inputMode: 'complete' })).toEqual({
      mode: 'patch', payload: { objects: [], USEOBJECTS: null },
    })
  })

  it('submits attribute edits through the existing validation flow', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const original = { name: 'shared', attributes: [{ CLAIM: 'role' }] }
    const state = definitionFormState('attributes', { name: 'shared', attributes: [{ CLAIM: 'role' }, { GLOBAL: 'UTCNOW' }] })
    const doc = applyDefinitionState(original, state!)
    const result = validateJson({ json: JSON.stringify(doc), kind: 'attributes', currentDefinition: original })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({ attributes: [{ CLAIM: 'role' }, { GLOBAL: 'UTCNOW' }] })
  })

  it('keeps identity handling on the merge path for updates', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const currentDefinition = { name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'old' } }
    const doc = mergeObjects(currentDefinition, { acl: { USEATTRIBUTES: null, ATTRIBUTES: [{ CLAIM: 'role' }] } })
    const result = validateJson({ json: JSON.stringify(doc), kind: 'acls', currentDefinition })
    expect(result.error).toBeNull()
    expect(result.payload).toEqual({
      acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
    })
  })

  it('blocks a pasted rename while re-attaching the resource name', () => {
    const { validateJson } = useDefinitionValidation(en.definitions.definitionDialog.errors, en.validation)
    const currentDefinition = { name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'old' } }
    const result = validateJson({
      json: JSON.stringify({ name: 'other', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'old' } }),
      kind: 'acls',
      currentDefinition,
    })
    expect(result.payload).toBeNull()
    expect(result.error?.messages).toContain(en.definitions.definitionDialog.errors.cannotRename)
  })
})
