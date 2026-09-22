import { DOMWrapper, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import QuerySearchField from '@/components/QueryLanguage/QuerySearchField.vue'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  })
  vi.stubGlobal('visualViewport', {
    addEventListener: vi.fn(),
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    removeEventListener: vi.fn(),
    width: 1024,
  })
})

afterEach(() => {
  document.body.innerHTML = ''
})

function mountSearchField (serverSearch = true) {
  return mount(QuerySearchField, {
    attachTo: document.body,
    props: {
      label: 'Search AAS',
      loading: false,
      modelValue: '',
      serverSearch,
      target: 'aas-repository' as const,
    },
    global: {
      plugins: [createVuetify()],
    },
  })
}

function findMenuItem (text: string): Element | undefined {
  return [...document.body.querySelectorAll('.v-overlay--active .v-list-item')]
    .find(item => item.textContent?.includes(text))
}

describe('QuerySearchField', () => {
  it('opens compact field suggestions on focus without a result count placeholder', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').trigger('focus')
    await nextTick()

    expect(findMenuItem('ID Short')).toBeDefined()
    expect(wrapper.find('[aria-label="Add a field filter"]').exists()).toBe(false)
    expect(wrapper.get('input').attributes('placeholder')).toBeUndefined()
    expect(wrapper.find('[aria-label="Run search"]').exists()).toBe(false)
    expect(document.body.querySelector('.v-sheet')).not.toBeNull()
    expect(document.body.querySelector('.v-list--slim')).not.toBeNull()
  })

  it('offers a Vuetify scope selector and emits scope changes', async () => {
    const wrapper = mountSearchField()
    await wrapper.setProps({
      searchScope: 'registry',
      searchScopeOptions: [
        { title: 'Registry', value: 'registry' },
        { title: 'Repository', value: 'repository' },
      ],
    })

    await wrapper.get('input').trigger('focus')
    await nextTick()

    expect(document.body.textContent).toContain('Search in')
    const repositoryButton = [...document.body.querySelectorAll('.v-btn')]
      .find(button => button.textContent?.includes('Repository'))
    expect(repositoryButton).toBeDefined()
    await new DOMWrapper(repositoryButton!).trigger('click')

    expect(wrapper.emitted('update:search-scope')).toEqual([['repository']])

    await wrapper.setProps({ searchScope: 'repository', target: 'aas-registry' })
    await nextTick()
    expect(document.body.querySelector('.v-overlay--active')).not.toBeNull()
    expect(findMenuItem('ID Short')).toBeDefined()
  })

  it('offers Submodel hierarchy fields only for AAS Environment searches', async () => {
    const wrapper = mountSearchField()
    await wrapper.setProps({ infrastructureTemplate: 'mono-all' })

    await wrapper.get('input').trigger('focus')
    await nextTick()

    expect(findMenuItem('Submodel ID Short')).toBeDefined()
    expect(findMenuItem('Submodel Element value')).toBeDefined()

    await wrapper.setProps({ infrastructureTemplate: 'full' })
    await nextTick()
    await wrapper.get('input').trigger('focus')
    await nextTick()

    expect(findMenuItem('Submodel ID Short')).toBeUndefined()
    expect(findMenuItem('Submodel Element value')).toBeUndefined()
  })

  it('offers Submodel Element fields for Submodel searches', async () => {
    const wrapper = mountSearchField()
    await wrapper.setProps({ target: 'submodel-repository' })

    await wrapper.get('input').trigger('focus')
    await nextTick()

    expect(findMenuItem('Submodel ID')).toBeDefined()
    expect(findMenuItem('Submodel Element ID Short')).toBeDefined()
    expect(findMenuItem('Submodel Element value')).toBeDefined()
  })

  it('guides field, operator, and value selection without inserting a colon', async () => {
    const wrapper = mountSearchField()
    await wrapper.get('input').trigger('focus')
    await nextTick()

    await new DOMWrapper(findMenuItem('AAS ID')!).trigger('click')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['id'])
    expect(findMenuItem('contains')).toBeDefined()
    expect(document.activeElement).toBe(wrapper.get('input').element)

    await new DOMWrapper(findMenuItem('contains')!).trigger('click')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['id:'])
    expect(document.activeElement).toBe(wrapper.get('input').element)

    await wrapper.get('input').setValue('id:Motor')
    await wrapper.get('input').trigger('keydown.space')

    expect(wrapper.get('.v-chip').text()).toContain('1 filter')
    expect(findMenuItem('id:Motor')).toBeDefined()
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['id:Motor'])
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('allows a complete filter to be typed and commits it on submit', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('globalAssetId=urn:asset:42')
    await wrapper.get('input').trigger('keydown.enter')
    await nextTick()

    expect(wrapper.get('.v-chip').text()).toContain('1 filter')
    await wrapper.get('.v-chip').trigger('click')
    await nextTick()
    expect(findMenuItem('globalAssetId=urn:asset:42')).toBeDefined()
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it.each(['id', 'idShort'])('submits the exact field name %s as free text', async value => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue(value)
    await wrapper.get('input').trigger('keydown.enter')
    await nextTick()

    expect(wrapper.find('.v-chip').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([value])
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('summarizes filters in the field and lists each applied filter in the menu', async () => {
    const wrapper = mountSearchField()

    for (const expression of ['id:one', 'idShort:two', 'globalAssetId:three']) {
      await wrapper.get('input').setValue(expression)
      await wrapper.get('input').trigger('keydown.space')
    }

    expect(wrapper.find('.v-slide-group').exists()).toBe(false)
    expect(wrapper.get('.v-chip').text()).toContain('3 filters')
    expect(wrapper.get('.v-chip').classes()).toContain('ml-n2')
    expect(wrapper.get('.v-chip').classes()).toContain('mr-2')
    expect(document.body.textContent).toContain('Applied filters')
    expect(findMenuItem('id:one')).toBeDefined()
    expect(findMenuItem('idShort:two')).toBeDefined()
    expect(findMenuItem('globalAssetId:three')).toBeDefined()
  })

  it('automatically searches when committed filter chips are removed', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('idShort:Motor')
    await wrapper.get('input').trigger('keydown.space')
    const removeButton = document.body.querySelector('[aria-label="Remove idShort:Motor"]')
    expect(removeButton).not.toBeNull()
    await new DOMWrapper(removeButton!).trigger('click')

    expect(wrapper.find('.v-chip').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('submit')).toHaveLength(2)
  })

  it('keeps the clear action visible when filters are active without search text', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('idShort:Motor')
    await wrapper.get('input').trigger('keydown.space')

    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.get('.v-field').classes()).toContain('v-field--persistent-clear')

    await wrapper.get('.v-field__clearable .v-icon').trigger('click')

    expect(wrapper.find('.v-chip').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('offers the advanced query action in the suggestions menu', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').trigger('focus')
    await nextTick()
    await new DOMWrapper(findMenuItem('Advanced Query Language')!).trigger('click')

    expect(wrapper.emitted('advanced')).toHaveLength(1)
  })

  it('does not offer or open advanced queries when they are disabled', async () => {
    const wrapper = mountSearchField()
    await wrapper.setProps({ advancedEnabled: false })

    await wrapper.get('input').trigger('focus')
    await nextTick()
    expect(findMenuItem('Advanced Query Language')).toBeUndefined()

    await wrapper.setProps({ advancedActive: true })
    await wrapper.get('.v-chip').trigger('click')
    expect(wrapper.emitted('advanced')).toBeUndefined()
  })

  it('closes and suppresses suggestions while the advanced dialog is open', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').trigger('focus')
    await nextTick()
    expect(findMenuItem('Advanced Query Language')).toBeDefined()

    await wrapper.setProps({ advancedDialogOpen: true })
    await nextTick()
    expect(findMenuItem('Advanced Query Language')).toBeUndefined()

    await wrapper.get('input').trigger('focus')
    await nextTick()
    expect(findMenuItem('Advanced Query Language')).toBeUndefined()
  })

  it('represents an advanced query as one editable and removable chip', async () => {
    const wrapper = mountSearchField()
    await wrapper.setProps({ advancedActive: true })

    expect(wrapper.get('.v-chip').text()).toContain('Advanced query')
    expect(wrapper.get('.v-chip').classes()).toContain('ml-n2')
    expect(wrapper.find('.v-field-label').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-label')).toBe('Search AAS')
    expect(wrapper.get('input').attributes('readonly')).toBeDefined()

    await wrapper.get('input').trigger('focus')
    await nextTick()
    expect(findMenuItem('AAS ID')).toBeUndefined()
    expect(findMenuItem('Edit advanced query')).toBeDefined()

    await wrapper.get('.v-chip').trigger('click')
    expect(wrapper.emitted('advanced')).toHaveLength(1)

    await wrapper.get('.v-chip__close').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('keeps plain local search behavior on unsupported backends', async () => {
    const wrapper = mountSearchField(false)

    await wrapper.get('input').setValue('Motor')
    await wrapper.get('input').trigger('keydown.enter')

    expect(document.body.querySelector('.v-list-item')).toBeNull()
    expect(wrapper.get('input').attributes('placeholder')).toBeUndefined()
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })
})
