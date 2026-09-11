import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { createLocalPolicy, validatePolicyJson } from '@/utils/ResourceAccessValidation'

const resource = { IDENTIFIABLE: '$aas("urn:example")' } as const

describe('ResourceAccessValidation', () => {
  it('accepts a policy bound to the server resource', () => {
    const result = validatePolicyJson(JSON.stringify({ RESOURCE: resource, rules: [] }), resource)
    expect(result.valid).toBe(true)
    expect(result.policy?.RESOURCE).toEqual(resource)
  })

  it('rejects malformed policies and changed resource bindings', () => {
    expect(validatePolicyJson('{', resource).message).toContain('not valid')
    expect(validatePolicyJson(JSON.stringify({ RESOURCE: resource }), resource).message).toContain('rules')
    expect(validatePolicyJson(JSON.stringify({ RESOURCE: { ROUTE: '/shells' }, rules: [] }), resource).message).toContain('exactly match')
    expect(validatePolicyJson(JSON.stringify({ RESOURCE: resource, rules: [], DEFACLS: null }), resource).message).toContain('DEFACLS')
  })

  it('copies inherited rules but binds a local policy to the addressed resource', () => {
    const inherited = reactive({ RESOURCE: { ROUTE: '/shells' } as const, rules: [{ FORMULA: true }] })
    expect(createLocalPolicy(resource, inherited)).toEqual({ RESOURCE: resource, rules: [{ FORMULA: true }] })
    expect(inherited.RESOURCE).toEqual({ ROUTE: '/shells' })
  })
})
