import type { PolicyDraft } from '../../types/policy'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { POLICY_FORM_CONTEXT_KEY } from '../../constants/inject'
import { useDefinitionUsage } from '../resources/useDefinitionUsage'
import { useDefinitionNames } from './useDefinitionNames'
import { usePolicyFormContext } from './usePolicyFormContext'

vi.mock('../../api/definition/useGetDefinitions', () => ({ useGetDefinitions: () => {
  throw new Error('Unexpected saved definition query')
} }))
vi.mock('../../api/rule/useGetRules', () => ({ useGetRules: () => {
  throw new Error('Unexpected saved rule query')
} }))
vi.mock('../navigation/useAbacNavigation', () => ({ useAbacNavigation: () => {
  throw new Error('Unexpected saved policy lookup')
} }))

describe('policy form context', () => {
  it('shares reactive suggestions and dependencies without querying or mutating a saved policy', async () => {
    const state = ref<PolicyDraft>({
      definitions: [
        { kind: 'attributes', doc: { name: 'claims', attributes: [] } },
        { kind: 'acls', doc: { name: 'readAcl', acl: { USEATTRIBUTES: 'claims' } } },
      ],
      rules: [],
    })
    const target = ref<{ name: string } | undefined>({ name: 'claims' })
    const context = usePolicyFormContext(() => state.value)
    const child = defineComponent({
      setup () {
        const names = useDefinitionNames('attributes')
        const { usages } = useDefinitionUsage(() => target.value, 'attributes')
        return () => h('span', `${names.value.join(',')}|${usages.value.length}`)
      },
    })
    const wrapper = mount(defineComponent({
      setup () {
        provide(POLICY_FORM_CONTEXT_KEY, context)
        return () => h(child)
      },
    }))
    try {
      const snapshot = JSON.stringify(state.value)
      expect(wrapper.text()).toBe('claims|1')
      target.value = undefined
      await nextTick()
      expect(wrapper.text()).toBe('claims|0')
      target.value = { name: 'claims' }
      await nextTick()
      expect(wrapper.text()).toBe('claims|1')
      expect(context.usagesOf('attributes', 'claims')).toEqual([{ kind: 'definition', definitionKind: 'acls', name: 'readAcl' }])
      expect(JSON.stringify(state.value)).toBe(snapshot)
      state.value.rules.push({ ACL: { USEATTRIBUTES: 'claims' } })
      state.value.definitions.push({ kind: 'attributes', doc: { name: 'other', attributes: [] } })
      await nextTick()
      expect(wrapper.text()).toBe('claims,other|2')
      expect(context.usagesOf('attributes', 'claims')).toContainEqual({ kind: 'rule', ruleIndex: 1 })
      state.value.rules = []
      state.value.definitions[1]!.doc.acl = { ATTRIBUTES: [{ CLAIM: 'role' }] }
      await nextTick()
      expect(wrapper.text()).toBe('claims,other|0')
    } finally {
      wrapper.unmount()
    }
  })
})
