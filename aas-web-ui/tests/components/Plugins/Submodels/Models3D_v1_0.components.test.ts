import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Models3DModelSwitcher from '@/components/Plugins/Submodels/Models3D_v1_0/components/Models3DModelSwitcher.vue'
import Models3DSummary from '@/components/Plugins/Submodels/Models3D_v1_0/components/Models3DSummary.vue'
import Models3DVersionMenu from '@/components/Plugins/Submodels/Models3D_v1_0/components/Models3DVersionMenu.vue'
import { parseModels3D } from '@/components/Plugins/Submodels/Models3D_v1_0/utils/parseModel3D'
import ur5eSubmodel from './fixtures/models3d.ur5e.json'

const slotStub = { template: '<div><slot /></div>' }
const [model] = parseModels3D(structuredClone(ur5eSubmodel) as any)

describe('Models3DSummary', () => {
  it('shows level of detail, intended use and the key facts', () => {
    const wrapper = mount(Models3DSummary, {
      props: { model },
      global: {
        stubs: {
          'v-icon': true,
          'v-chip': slotStub,
          'Models3DDefinitionList': { props: ['rows'], template: '<div data-test="facts">{{ rows.map(r => r.label).join(",") }}</div>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Low-poly visual model')
    expect(wrapper.text()).toContain('Visualisation')
    expect(wrapper.text()).toContain('Manufacturing (not a CAD model)')
    expect(wrapper.get('[data-test="facts"]').text()).toBe('Object type,Origin,Representation,Unit')
  })
})

describe('Models3DModelSwitcher', () => {
  const stubs = {
    'v-slide-group': slotStub,
    'v-slide-group-item': slotStub,
    'v-sheet': { template: '<div v-bind="$attrs"><slot /></div>' },
    'v-icon': { template: '<i class="star"><slot /></i>' },
    'Models3DPreviewImage': true,
  }

  it('emits the key of the clicked model', async () => {
    const models = [model, { ...model, key: 'model-1' }]
    const wrapper = mount(Models3DModelSwitcher, { props: { models, selectedKey: model.key }, global: { stubs } })

    await wrapper.findAll('[role="button"]')[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['model-1']])
  })

  it('only marks the primary model if not all models are primary', () => {
    const allPrimary = mount(Models3DModelSwitcher, {
      props: { models: [model, { ...model, key: 'model-1' }], selectedKey: model.key },
      global: { stubs },
    })
    expect(allPrimary.findAll('.star')).toHaveLength(0)

    const mixed = mount(Models3DModelSwitcher, {
      props: { models: [model, { ...model, key: 'model-1', isPrimary: false }], selectedKey: model.key },
      global: { stubs },
    })
    expect(mixed.findAll('.star')).toHaveLength(1)
  })
})

describe('Models3DVersionMenu', () => {
  const [first] = model.versions
  const versions = [
    { ...first, key: 'a', versionId: '1.0', setDate: '2026-09-12' },
    { ...first, key: 'b', versionId: '1.1', setDate: '2026-10-04' },
    { ...first, key: 'c', versionId: '0.9', setDate: '2026-08-30' },
  ]
  const stubs = {
    'v-menu': { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
    'v-btn': { template: '<button><slot /></button>' },
    'v-list': slotStub,
    'v-list-item': { props: ['title'], emits: ['click'], template: '<div data-test="entry" @click="$emit(\'click\')">{{ title }}<slot name="append" /></div>' },
    'v-chip': { template: '<span><slot /></span>' },
  }

  it('lists the newest version first and marks the latest one', () => {
    const wrapper = mount(Models3DVersionMenu, { props: { versions, selected: versions[1] }, global: { stubs } })

    const entries = wrapper.findAll('[data-test="entry"]')
    expect(entries.map(entry => entry.text().replace(/Latest|Released/g, '').trim())).toEqual(['v1.1', 'v1.0', 'v0.9'])
    expect(entries[0].text()).toContain('Latest')
    expect(entries[1].text()).not.toContain('Latest')
  })

  it('emits the selected version', async () => {
    const wrapper = mount(Models3DVersionMenu, { props: { versions, selected: versions[1] }, global: { stubs } })

    await wrapper.findAll('[data-test="entry"]')[2].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['c']])
  })

  it('shows a plain chip for a single version', () => {
    const wrapper = mount(Models3DVersionMenu, { props: { versions: [first], selected: first }, global: { stubs } })

    expect(wrapper.find('[data-test="entry"]').exists()).toBe(false)
    expect(wrapper.text()).toBe('v1.1')
  })
})
