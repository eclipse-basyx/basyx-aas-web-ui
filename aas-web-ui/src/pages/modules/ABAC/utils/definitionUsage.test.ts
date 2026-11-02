import type { Rule } from '../types/rules'
import { describe, expect, it } from 'vitest'
import { findDefinitionReferences } from './definitionUsage'

const rules: Rule[] = [
  {
    rule_index: 1,
    rule_id: 'r1',
    _location: {
      _blocId: 'x',
    },
    configured_rule_json: {
      USEACL: ' readAcl ',
      OBJECTS: [{ ROUTE: '/shells' }],
      USEFORMULA: 'isAdmin',
    },
  },
  {
    rule_index: 2,
    rule_id: 'r2',
    _location: {
      _blocId: 'y',
    },
    configured_rule_json: {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' },
      OBJECTS: [{ ROUTE: '/shells' }],
      USEOBJECTS: ['routes'],
    },
  },
  {
    rule_index: 3,
    rule_id: 'r3',
    _location: {
      _blocId: 'z',
    },
    configured_rule_json: {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      OBJECTS: [{ ROUTE: '/shells' }],
      FORMULA: { $boolean: true },
      FILTER: { FRAGMENT: '$sm#idShort', USEFORMULA: 'isAdmin' },
      FILTERLIST: [{ FRAGMENT: 'f', CONDITION: { $boolean: true } }],
    },
  },
] as unknown as Rule[]

const definitions: Record<string, unknown[]> = {
  attributes: [
    { name: 'claims', attributes: [{ CLAIM: 'role' }] },
    { name: 'client', USEATTRIBUTES: ['claims'] },
  ],
  acls: [{ name: 'readAcl', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'claims' } }],
  objects: [{ name: 'routes', objects: [{ ROUTE: '/a' }] }, { name: 'other', objects: [{ ROUTE: '/submodels' }], USEOBJECTS: ['routes'] }],
  formulas: [{ name: 'isAdmin', formula: { $boolean: true } }],
}

describe('definition usage check', () => {
  it('finds rules and definitions referencing an attribute collection', () => {
    const usage = findDefinitionReferences('attributes', 'claims', definitions as never, rules)
    expect(usage).toEqual([
      { kind: 'rule', ruleIndex: 2 },
      { kind: 'definition', definitionKind: 'attributes', name: 'client' },
      { kind: 'definition', definitionKind: 'acls', name: 'readAcl' },
    ])
  })

  it('finds users of ACL, object and formula definitions, trimming names like the backend', () => {
    expect(findDefinitionReferences('acls', 'readAcl', definitions as never, rules)).toEqual([
      { kind: 'rule', ruleIndex: 1 },
    ])
    const objects = findDefinitionReferences('objects', 'routes', definitions as never, rules)
    expect(objects).toEqual([
      { kind: 'rule', ruleIndex: 2 },
      { kind: 'definition', definitionKind: 'objects', name: 'other' },
    ])
    const formulas = findDefinitionReferences('formulas', 'isAdmin', definitions as never, rules)
    expect(formulas).toEqual([
      { kind: 'rule', ruleIndex: 1 },
      { kind: 'rule', ruleIndex: 3 },
    ])
  })

  it('is unused without any references and self-references are skipped', () => {
    expect(findDefinitionReferences('attributes', 'client', definitions as never, rules)).toEqual([])
    expect(findDefinitionReferences('acls', 'other', definitions as never, rules)).toEqual([])
    const selfReferencing = { attributes: [{ name: 'loop', USEATTRIBUTES: ['loop'] }] }
    expect(findDefinitionReferences('attributes', 'loop', selfReferencing as never, [])).toEqual([])
  })

  it('never classifies usage from incomplete data', () => {
    expect(findDefinitionReferences('acls', 'readAcl', undefined, rules)).toEqual([])
    expect(findDefinitionReferences('acls', 'readAcl', definitions as never, undefined)).toEqual([])
  })
})
