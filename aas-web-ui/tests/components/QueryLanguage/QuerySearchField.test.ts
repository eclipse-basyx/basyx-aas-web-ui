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

    expect(wrapper.get('.v-chip').text()).toContain('id:Motor')
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['id:Motor'])
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('allows a complete filter to be typed and commits it on submit', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('globalAssetId=urn:asset:42')
    await wrapper.get('input').trigger('keydown.enter')
    await nextTick()

    expect(wrapper.get('.v-chip').text()).toContain('globalAssetId=urn:asset:42')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('automatically searches when committed filter chips are removed', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('idShort:Motor')
    await wrapper.get('input').trigger('keydown.space')
    await wrapper.get('.v-chip__close').trigger('click')

    expect(wrapper.find('.v-chip').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('submit')).toHaveLength(2)
  })

  it('offers the advanced query action in the suggestions menu', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').trigger('focus')
    await nextTick()
    await new DOMWrapper(findMenuItem('Advanced Query Language')!).trigger('click')

    expect(wrapper.emitted('advanced')).toHaveLength(1)
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
