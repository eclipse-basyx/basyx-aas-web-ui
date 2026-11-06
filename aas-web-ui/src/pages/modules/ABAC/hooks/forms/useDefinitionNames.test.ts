import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { POLICY_FORM_CONTEXT_KEY } from '../../constants/inject'
import { useDefinitionNames } from './useDefinitionNames'

vi.mock('../../api/definition/useGetDefinitions', () => ({
  useGetDefinitions: () => {
    throw new Error('A draft must not query definitions from a saved policy')
  },
}))

describe('draft definition suggestions', () => {
  it('uses the provided draft names and reflects additions and renames', async () => {
    const names = ref(['draftAcl'])
    const child = defineComponent({
      setup () {
        const suggestions = useDefinitionNames('acls')
        return () => h('span', suggestions.value.join(','))
      },
    })
    const wrapper = mount(defineComponent({
      setup () {
        provide(POLICY_FORM_CONTEXT_KEY, {
          definitionNames: computed(() => ({ attributes: [], acls: names.value, objects: [], formulas: [] })),
          usagesOf: () => [],
        })
        return () => h(child)
      },
    }))
    expect(wrapper.text()).toBe('draftAcl')
    names.value = ['renamedAcl', 'newAcl']
    await nextTick()
    expect(wrapper.text()).toBe('renamedAcl,newAcl')
    wrapper.unmount()
  })
})
