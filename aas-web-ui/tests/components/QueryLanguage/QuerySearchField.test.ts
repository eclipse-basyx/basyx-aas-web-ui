import { DOMWrapper, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
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

function mountSearchField (serverSearch = true) {
  return mount(QuerySearchField, {
    props: {
      example: 'idShort:Motor',
      label: 'Search AAS',
      loading: false,
      modelValue: '',
      placeholder: '3 Shells',
      serverSearch,
      target: 'aas-repository' as const,
    },
    global: {
      plugins: [createVuetify()],
    },
  })
}

describe('QuerySearchField', () => {
  it('keeps filter expressions in the normal text field', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').setValue('pump idShort:Motor')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['pump idShort:Motor'])
    expect(wrapper.find('[aria-label="Add a field filter"]').exists()).toBe(true)
  })

  it('inserts a selected field qualifier without an apply button', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('[aria-label="Add a field filter"]').trigger('click')
    await nextTick()
    const items = [...document.body.querySelectorAll('.v-list-item')]
    const idShortItem = items.find(item => item.textContent?.includes('ID Short'))

    expect(idShortItem).toBeDefined()
    await new DOMWrapper(idShortItem!).trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['idShort:'])
  })

  it('does not offer server filter suggestions on unsupported backends', () => {
    const wrapper = mountSearchField(false)

    expect(wrapper.find('[aria-label="Add a field filter"]').exists()).toBe(false)
    expect(wrapper.get('input').attributes('placeholder')).toBe('3 Shells')
  })

  it('submits on Enter and through the search button', async () => {
    const wrapper = mountSearchField()

    await wrapper.get('input').trigger('keydown.enter')
    await wrapper.get('[aria-label="Run search"]').trigger('click')

    expect(wrapper.emitted('submit')).toHaveLength(2)
  })
})
