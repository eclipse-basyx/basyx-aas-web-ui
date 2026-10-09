import type { SchemaObject as SchemaNode } from 'ajv'
import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import upstream from '@/schemas/access-rules/aas-queries-and-access-rules-3.1.schema.json'
import { createAccessRulesEditorSchema, getAccessRulesEditorNamespace } from './accessRulesEditorSchema'

describe('ABAC editor entry roots', () => {
  it('preserves the upstream definitions in create and view roots', () => {
    for (const mode of ['create', 'view'] as const) {
      const root = createAccessRulesEditorSchema({ mode, viewer: 'rule' }).schema as SchemaNode
      expect(root.definitions).toEqual(upstream.definitions)
      expect(root['x-abac']).toBeUndefined()
    }
  })

  it('uses upstream compact object targets and rejects backend-only structured targets', () => {
    const schema = createAccessRulesEditorSchema({ mode: 'create', viewer: 'rule' }).schema
    const validate = new Ajv({ strict: false, unicodeRegExp: false, ignoreKeywordsWithRef: true, logger: false }).compile(schema as SchemaNode)
    const rule = {
      ACL: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] },
      FORMULA: { $boolean: true },
    }
    for (const object of [
      { ROUTE: '/shells' },
      { IDENTIFIABLE: '$sm("id")' },
      { REFERABLE: '$sme("id").temperature' },
      { DESCRIPTOR: '$smdesc("id")' },
    ]) {
      expect(validate({ ...rule, OBJECTS: [object] }), JSON.stringify(object)).toBe(true)
    }
    expect(validate({ ...rule, OBJECTS: [{ ROUTE: { Route: '/shells' } }] })).toBe(false)
    expect(validate({ ...rule, OBJECTS: [{ ROUTE: '/shells', DESCRIPTOR: '$smdesc("id")' }] })).toBe(false)
    expect(validate({ ...rule, OBJECTS: [] })).toBe(true)
    expect(validate({ FORMULA: { $boolean: true } })).toBe(false)
  })

  it('derives the namespaces per viewer/mode/kind', () => {
    expect(getAccessRulesEditorNamespace({ mode: 'create', viewer: 'policy' })).toBe('access-rules-policy-create')
    expect(getAccessRulesEditorNamespace({ mode: 'update', viewer: 'rule' })).toBe('access-rules-rule-update')
    expect(getAccessRulesEditorNamespace({ kind: 'acls', mode: 'create', viewer: 'definition' })).toBe('access-rules-definition-acls-create')
  })

  it('keeps the policy document wrapper at the entry root', () => {
    const policyRoot = createAccessRulesEditorSchema({ mode: 'create', viewer: 'policy' }).schema as SchemaNode
    const wrapper = (policyRoot.allOf as SchemaNode[])[0]
    expect(wrapper.required).toEqual(upstream.required)
    expect(wrapper.properties).toEqual(upstream.properties)
    expect(wrapper.additionalProperties).toBe(upstream.additionalProperties)
  })

  it.each([
    { kind: 'acls', entry: 'DefinitionEntryAcls', property: 'DEFACLS' },
    { kind: 'attributes', entry: 'DefinitionEntryAttributes', property: 'DEFATTRIBUTES' },
    { kind: 'objects', entry: 'DefinitionEntryObjects', property: 'DEFOBJECTS' },
    { kind: 'formulas', entry: 'DefinitionEntryFormulas', property: 'DEFFORMULAS' },
  ] as const)('preserves the complete $kind definition entry in create/view', ({ kind, entry, property }) => {
    for (const mode of ['create', 'view'] as const) {
      const root = createAccessRulesEditorSchema({ kind, mode, viewer: 'definition' }).schema as SchemaNode
      const definition = root.definitions![entry] as SchemaNode
      expect(definition).toEqual(upstream.definitions.AllAccessPermissionRules.properties[property].items)
      expect(definition.required).toContain('name')
    }
  })

  it('prepares update roots for merge-patch documents', () => {
    const updateRoot = createAccessRulesEditorSchema({ mode: 'update', viewer: 'rule' }).schema

    const defs = (updateRoot as SchemaNode).definitions as Record<string, SchemaNode>
    expect(updateElement(defs.PatchAccessPermissionRule).hasRequired).toBe(false)
    expect(updateElement(defs.PatchAccessPermissionRule).presenceOnly).toBe(false)

    const aclProperty = defs.PatchAccessPermissionRule.properties!.ACL as SchemaNode
    expect(aclProperty.anyOf).toBeDefined()
    expect(aclProperty.anyOf).toContainEqual({ type: 'null' })

    const formulaPatch = defs.PatchAccessPermissionRule.properties!.FORMULA as SchemaNode
    expect(formulaPatch.anyOf).toBeDefined()

    expect(aclProperty.anyOf[0].$ref).toBe('#/definitions/PatchACL')
    expect(defs.PatchACL.required).toBeUndefined()
    expect(defs.PatchACL.anyOf).toBeUndefined()
  })

  it('accepts nested deletions and operator switches but requires complete array elements', () => {
    const schema = createAccessRulesEditorSchema({ mode: 'update', viewer: 'rule' }).schema
    const validate = new Ajv({ strict: false, unicodeRegExp: false, ignoreKeywordsWithRef: true, logger: false }).compile(schema as SchemaNode)
    expect(validate({ ACL: { ACCESS: 'DISABLED' } })).toBe(true)
    expect(validate({ FORMULA: { $boolean: null, $not: { $boolean: false } } })).toBe(true)
    expect(validate({ FORMULA: { $eq: [{ $numVal: 1 }, { $numVal: 2 }] } })).toBe(true)
    expect(validate({ ACL: { ATTRIBUTES: [{ CLAIM: 'role' }] } })).toBe(true)
    expect(validate({ ACL: { ATTRIBUTES: [{}] } })).toBe(false)
    expect(validate({ ACL: { ATTRIBUTES: [{ CLAIM: null }] } })).toBe(false)
    expect(validate({ FORMULA: { $and: [{}, { $boolean: true }] } })).toBe(false)
    expect(validate({ FORMULA: { $eq: [{}, {}] } })).toBe(false)
    expect(validate({ FILTERLIST: [{ MATCH: true }] })).toBe(false)
  })

  it('strips the immutable name from definition update entries', () => {
    const definitionRoot = createAccessRulesEditorSchema({ kind: 'formulas', mode: 'update', viewer: 'definition' }).schema as SchemaNode
    const entry = (definitionRoot.definitions as Record<string, SchemaNode>).DefinitionEntryFormulas as SchemaNode
    const properties = entry.properties as SchemaNode
    expect(properties.name).toBeUndefined()
    expect(properties.formula).toBeDefined()
    expect(Object.keys(properties)).toEqual(['formula'])
  })

  it('keeps the entry, object and attribute structure strict in update entries', () => {
    const attributesRoot = createAccessRulesEditorSchema({ kind: 'attributes', mode: 'update', viewer: 'definition' }).schema as SchemaNode
    const entry = (attributesRoot.definitions as Record<string, SchemaNode>).DefinitionEntryAttributes as SchemaNode
    const properties = entry.properties as SchemaNode
    expect(Object.keys(properties)).toEqual(['attributes', 'USEATTRIBUTES'])

    const attributeItems = properties.attributes as SchemaNode
    expect(attributeItems.anyOf).toBeDefined()
    const attributesAnyOf = attributeItems.anyOf as SchemaNode[]

    const attributeArray = attributesAnyOf[0] as SchemaNode
    expect((attributeArray.items as SchemaNode).$ref).toBe('#/definitions/attributeItem')
    expect(attributesAnyOf[1]).toEqual({ type: 'null' })
  })
})

function updateElement (node: SchemaNode): { hasRequired: boolean, presenceOnly: boolean } {
  const hasRequired = 'required' in node
  const presenceOnly = 'oneOf' in node || 'allOf' in node
  return { hasRequired, presenceOnly }
}
