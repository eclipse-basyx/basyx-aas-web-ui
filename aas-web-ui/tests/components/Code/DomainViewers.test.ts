import type { CompanyDescriptor } from '@/composables/Client/CompanyLookup/types/company'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, shallowRef } from 'vue'
import SubmodelElementJSONView from '@/components/SubmodelElementJSONView.vue'
import CompanyJsonView from '@/pages/modules/CompanyLookup/components/detail/CompanyJsonView.vue'

const mocks = vi.hoisted(() => ({ selected: undefined as unknown }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => ({ get getSelectedNode () {
  return mocks.selected
} }) }))
vi.mock('@/pages/modules/CompanyLookup/i18n/useCompanyLookupI18n', () => ({ useCompanyLookupI18n: () => ({ t: (key: string) => key }) }))
const viewer = defineComponent({
  props: ['text', 'fileName', 'copyLabel', 'downloadLabel'],
  template: '<div>{{ text }}</div>',
})
const global = { stubs: { CodeViewer: viewer } }

describe('domain JSON viewers', () => {
  it('cleans tree metadata and restores children without modifying the selected node', () => {
    const selected = {
      modelType: 'Submodel', id: 'urn:sm', idShort: 'Fixture', path: '/private/tree/path',
      children: [{ modelType: 'Property', idShort: 'Value', path: '/child/path', valueType: 'xs:string', value: 'kept' }],
    }
    mocks.selected = selected
    const wrapper = mount(SubmodelElementJSONView, { global })
    expect(JSON.parse(wrapper.getComponent(viewer).props('text'))).toEqual({
      modelType: 'Submodel', id: 'urn:sm', idShort: 'Fixture',
      submodelElements: [{ modelType: 'Property', idShort: 'Value', valueType: 'xs:string', value: 'kept' }],
    })
    expect(selected.children).toEqual([expect.objectContaining({ path: '/child/path' })])
    expect(wrapper.getComponent(viewer).props('fileName')).toBe('Fixture.json')
    wrapper.unmount()
  })

  it('passes serialized company JSON exactly once and updates its filename with the company', async () => {
    const company = shallowRef<CompanyDescriptor>({ domain: 'example.org', idShort: 'First', endpoints: [{ interface: 'example', protocolInformation: { href: 'https://example.org' } }] })
    const wrapper = mount(CompanyJsonView, { props: { company: company.value }, global })
    expect(JSON.parse(wrapper.getComponent(viewer).props('text'))).toEqual(company.value)
    expect(wrapper.getComponent(viewer).props('copyLabel')).toBe('detail.json.copy')
    await wrapper.setProps({ company: { ...company.value, idShort: 'Second' } })
    expect(wrapper.getComponent(viewer).props('fileName')).toBe('Second.json')
    wrapper.unmount()
  })
})
