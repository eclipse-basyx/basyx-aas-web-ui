import type { JsonObject } from '../../types/json'
import { describe, expect, it } from 'vitest'
import { applyPolicyDraft, policyDraftDefinitionUsage, policyDraftState, representPolicyDraft } from './policy'

const policy: JsonObject = {
  AllAccessPermissionRules: {
    DEFATTRIBUTES: [
      { name: 'claims', attributes: [{ CLAIM: 'role' }] },
      { name: 'shared', USEATTRIBUTES: ['claims'] },
    ],
    DEFACLS: [{ name: 'readAcl', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' } }],
    DEFOBJECTS: [],
    DEFFORMULAS: [{ name: 'isAdmin', formula: { $eq: [{ $attribute: { CLAIM: 'role' } }, { $strVal: 'admin' }] } }],
    rules: [
      {
        USEACL: 'readAcl',
        OBJECTS: [{ ROUTE: '/shells' }],
        USEFORMULA: 'isAdmin',
      },
    ],
  },
}

describe('policy policy form codec', () => {
  it('preserves missing rules until a rule is added and retains an explicitly emptied list', () => {
    const document = { AllAccessPermissionRules: { DEFOBJECTS: [{ name: 'pending' }] } }
    expect(representPolicyDraft(document).ok).toBe(true)
    const state = policyDraftState(document)!
    expect(state.rules).toEqual([])
    expect(applyPolicyDraft(document, state)).toEqual(document)
    state.definitions[0] = { ...state.definitions[0]!, doc: { name: 'renamed' } }
    expect(applyPolicyDraft(document, state)).toEqual({ AllAccessPermissionRules: { DEFOBJECTS: [{ name: 'renamed' }] } })
    state.rules.push({ USEACL: 'acl', OBJECTS: [] })
    const updated = applyPolicyDraft(document, state)
    expect(updated.AllAccessPermissionRules).toEqual({ DEFOBJECTS: [{ name: 'renamed' }], rules: [{ USEACL: 'acl', OBJECTS: [] }] })
    state.rules = []
    expect(applyPolicyDraft(updated, state).AllAccessPermissionRules).toEqual({ DEFOBJECTS: [{ name: 'renamed' }], rules: [] })
  })

  it('round-trips combined object definitions and finds their collection references', () => {
    const document = { AllAccessPermissionRules: {
      DEFOBJECTS: [
        { name: 'shared', objects: [{ ROUTE: '/shells' }] },
        { name: 'combined', objects: [{ ROUTE: '/submodels' }], USEOBJECTS: ['shared'] },
      ],
      rules: [],
    } }
    expect(representPolicyDraft(document).ok).toBe(true)
    const state = policyDraftState(document)!
    expect(applyPolicyDraft(document, state)).toEqual(document)
    expect(policyDraftDefinitionUsage(state, 'objects', 'shared')).toContainEqual({
      kind: 'definition', definitionKind: 'objects', name: 'combined',
    })
  })

  it('opens filter lists inside imported policies, preserves their source, and tracks formula references', () => {
    const document = { AllAccessPermissionRules: {
      DEFFORMULAS: [{ name: 'shared', formula: { $boolean: true } }],
      rules: [{ USEACL: 'acl', OBJECTS: [], USEFORMULA: 'other', FILTERLIST: [{ FRAGMENT: '$sm#idShort', USEFORMULA: 'shared' }] }],
    } }
    expect(representPolicyDraft(document).ok).toBe(true)
    const state = policyDraftState(document)!
    expect(applyPolicyDraft(document, state)).toEqual(document)
    expect(policyDraftDefinitionUsage(state, 'formulas', 'shared')).toEqual([{ kind: 'rule', ruleIndex: 1 }])
  })

  it('round-trips a policy with a pending rule that has no ACL alternative', () => {
    const policyDocument = { AllAccessPermissionRules: { rules: [{ USEFORMULA: 'formula', OBJECTS: [] }] } }
    expect(representPolicyDraft(policyDocument).ok).toBe(true)
    expect(applyPolicyDraft(policyDocument, policyDraftState(policyDocument)!)).toEqual(policyDocument)
  })

  it('checks references inside the draft, including other definitions and newly added rules', () => {
    const state = policyDraftState(policy)!
    const usages = policyDraftDefinitionUsage(state, 'attributes', 'claims')
    expect(usages).toContainEqual({ kind: 'definition', definitionKind: 'attributes', name: 'shared' })
    expect(usages).toContainEqual({ kind: 'definition', definitionKind: 'acls', name: 'readAcl' })
    expect(policyDraftDefinitionUsage(state, 'acls', 'readAcl')).toContainEqual({ kind: 'rule', ruleIndex: 1 })
    state.rules = []
    expect(policyDraftDefinitionUsage(state, 'acls', 'readAcl')).toEqual([])
  })
  it('round-trips the whole policy document', () => {
    expect(representPolicyDraft(policy).ok).toBe(true)
    const state = policyDraftState(policy)!
    expect(applyPolicyDraft(policy, state)).toEqual(policy)
    expect(state.definitions).toHaveLength(4)
    expect(state.rules).toHaveLength(1)
  })

  it('rebuilds definition lists grouped by kind in policy form order', () => {
    const state = policyDraftState(policy)!
    const definitions = [...state.definitions]
    // Move the shared attributes entry to the front and drop the ACL collection.
    const sharedIndex = definitions.findIndex(entry => entry.kind === 'attributes' && entry.doc.name === 'shared')
    const [shared] = definitions.splice(sharedIndex, 1)
    definitions.unshift(shared!)
    const aclIndex = definitions.findIndex(entry => entry.kind === 'acls')
    definitions.splice(aclIndex, 1)
    const updated = { definitions, rules: [] }
    const doc = applyPolicyDraft(policy, updated)
    expect(doc.AllAccessPermissionRules).toMatchObject({
      DEFATTRIBUTES: [{ name: 'shared', USEATTRIBUTES: ['claims'] }, { name: 'claims', attributes: [{ CLAIM: 'role' }] }],
      DEFACLS: [],
      rules: [],
    })
  })

  it('rejects unrepresentable rules or definitions with the limited envelope intact', () => {
    const invalidRule = {
      AllAccessPermissionRules: {
        DEFATTRIBUTES: [{ name: 'claims', attributes: [{ CLAIM: 'role' }] }],
        rules: [{ USEACL: 'x', OBJECTS: [{ ROUTE: '/a' }], FORMULA: { $boolean: true }, USEFORMULA: 'y' }],
      },
    }
    expect(representPolicyDraft(invalidRule)).toEqual({ ok: false, limitation: 'structure' })
    const invalidDefinition = {
      AllAccessPermissionRules: {
        DEFATTRIBUTES: [{ name: 'claims', attributes: [{ CLAIM: 'role', GLOBAL: 'LOCALNOW' }] }],
        rules: [],
      },
    }
    expect(representPolicyDraft(invalidDefinition)).toEqual({ ok: false, limitation: 'attributeItem' })
    const bothAlternatives = {
      AllAccessPermissionRules: {
        DEFATTRIBUTES: [{ name: 'claims', attributes: [{ CLAIM: 'role' }] }],
        rules: [{ USEACL: 'x', FORMULA: { $boolean: true }, USEFORMULA: 'y' }],
      },
    }
    expect(representPolicyDraft(bothAlternatives)).toEqual({ ok: false, limitation: 'structure' })
    expect(representPolicyDraft({ AllAccessPermissionRules: 'text' })).toEqual({ ok: false, limitation: 'structure' })
    expect(representPolicyDraft('text')).toEqual({ ok: false, limitation: 'structure' })
  })

  it('keeps unknown envelope keys verbatim on rebuild', () => {
    const extended = {
      custom: 1,
      AllAccessPermissionRules: {
        futureUnknown: { x: 2 },
        rules: [{ USEACL: 'readAcl', OBJECTS: [{ ROUTE: '/shells' }], USEFORMULA: 'isAdmin' }],
      } as JsonObject,
    }
    const state = policyDraftState(extended)!
    expect(applyPolicyDraft(extended, state)).toEqual(extended)
  })
})
