import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { VueDraggable } from 'vue-draggable-plus'
import DraggableList from './DraggableList.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('DraggableList keyboard ordering', () => {
  it('keeps row state when a model update changes raw items into reactive proxies', async () => {
    const first = { value: 'first' }
    const second = { value: 'second' }
    const wrapper = mount(DraggableList, {
      props: { modelValue: [first, second] },
      slots: { default: '<input :aria-label="params.item.value" />' },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const secondInput = wrapper.findAll('input')[1]!.element
      await wrapper.findAll('input')[1]!.setValue('local draft')
      wrapper.findComponent(VueDraggable).vm.$emit('update:modelValue', reactive([second, first]))
      await nextTick()
      await wrapper.setProps({ modelValue: [second, first] })
      expect(wrapper.findAll('input')[0]!.element).toBe(secondInput)
      expect(secondInput.value).toBe('local draft')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps collapsed bodies and their drafts with the row across edits and reorders', async () => {
    const first = { value: 'first' }
    const second = { value: 'second' }
    const host = document.createElement('div')
    document.body.append(host)
    const wrapper = mount(DraggableList, {
      attachTo: host,
      props: { modelValue: [first, second], collapsible: true },
      slots: { body: '<input :aria-label="params.item.value" />' },
      global: { stubs: { VIcon: true, VTooltip: true, VBtn: { template: '<button><slot /></button>' } } },
    })
    try {
      await wrapper.findAll('input')[0]!.setValue('unsaved draft')
      await wrapper.findAll('[aria-expanded]')[0]!.trigger('click')
      expect(wrapper.findAll('input')[0]!.isVisible()).toBe(false)
      const edited = { value: 'edited' }
      await wrapper.setProps({ modelValue: [edited, second] })
      await wrapper.setProps({ modelValue: [second, edited] })
      expect(wrapper.findAll('input')[0]!.isVisible()).toBe(true)
      expect(wrapper.findAll('input')[1]!.isVisible()).toBe(false)
      expect(wrapper.findAll('[aria-expanded]')[1]!.attributes('aria-expanded')).toBe('false')
      await wrapper.findAll('[aria-expanded]')[1]!.trigger('click')
      expect(wrapper.findAll('input')[1]!.isVisible()).toBe(true)
      expect(wrapper.findAll('input')[1]!.element.value).toBe('unsaved draft')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    } finally {
      wrapper.unmount()
      host.remove()
    }
  })

  it('reorders vertically outside either side of the list only during an active drag', async () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['first', 'second', 'third'] },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const list = wrapper.get('.abac-sortable-list').element
      const items = wrapper.findAll('.abac-sortable-row').map(row => row.element as HTMLElement)
      const item = items[2]!
      vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 200, 180))
      for (const row of items) {
        vi.spyOn(row, 'getBoundingClientRect').mockImplementation(() =>
          new DOMRect(100, Array.from(list.children).indexOf(row) * 60, 200, 60),
        )
      }
      const move = (clientX: number, clientY: number) =>
        document.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }))
      const draggable = wrapper.findComponent(VueDraggable)
      draggable.vm.$emit('choose', { item })
      move(450, 10)
      expect(list.lastElementChild).toBe(item)

      draggable.vm.$emit('start', { item })
      move(450, 10)
      expect(list.firstElementChild).toBe(item)
      move(0, 170)
      expect(list.lastElementChild).toBe(item)
      move(200, 10)
      expect(list.lastElementChild).toBe(item)

      const touch = new Event('touchmove')
      Object.defineProperty(touch, 'touches', { value: [{ clientX: 0, clientY: 80 }] })
      document.dispatchEvent(touch)
      expect(list.querySelector(':scope > :nth-child(2)')).toBe(item)
      expect(list.firstElementChild).toBe(items[0])
      expect(list.lastElementChild).toBe(items[1])
      // Sortable owns the model update when the drop commits.
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      draggable.vm.$emit('unchoose')
      move(450, 10)
      expect(list.querySelector(':scope > :nth-child(2)')).toBe(item)
      draggable.vm.$emit('choose', { item })
      draggable.vm.$emit('start', { item })
      await wrapper.setProps({ disabled: true })
      move(450, 10)
      expect(list.querySelector(':scope > :nth-child(2)')).toBe(item)
    } finally {
      wrapper.unmount()
      vi.restoreAllMocks()
    }
  })

  it('removes document drag listeners when unmounted during a drag', () => {
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['first', 'second'] },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      wrapper.findComponent(VueDraggable).vm.$emit('start')
      wrapper.unmount()
      for (const event of ['pointermove', 'mousemove', 'touchmove']) {
        expect(removeListener).toHaveBeenCalledWith(event, expect.any(Function))
      }
    } finally {
      removeListener.mockRestore()
    }
  })

  it('renders after-actions when reordering is unavailable', () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['only'], disabled: true },
      slots: { 'after-actions': '<span>Help</span>' },
    })
    try {
      expect(wrapper.get('.abac-row-actions').text()).toBe('Help')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps row state with its item across reorders, edits, and removals', async () => {
    const first = { value: 'first' }
    const second = { value: 'second' }
    const wrapper = mount(DraggableList, {
      props: { modelValue: [first, second] },
      attachTo: document.body,
      slots: { default: '<input :aria-label="params.item.value" />' },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const firstInput = wrapper.findAll('input')[0]!.element
      const secondInput = wrapper.findAll('input')[1]!.element
      await wrapper.findAll('input')[1]!.setValue('local draft')
      wrapper.findComponent(VueDraggable).vm.$emit('update:modelValue', [second, first])
      await wrapper.setProps({ modelValue: [second, first] })
      expect(wrapper.findAll('input')[0]!.element).toBe(secondInput)
      expect(wrapper.findAll('input')[1]!.element).toBe(firstInput)
      expect(secondInput.value).toBe('local draft')
      secondInput.focus()
      const edited = { value: 'edited' }
      await wrapper.setProps({ modelValue: [edited, first] })
      expect(wrapper.findAll('input')[0]!.element).toBe(secondInput)
      expect(document.activeElement).toBe(secondInput)
      await wrapper.setProps({ modelValue: [first] })
      expect(wrapper.get('input').element).toBe(firstInput)
    } finally {
      wrapper.unmount()
    }
  })

  it('preserves rows when wrappers are recreated using a custom item key', async () => {
    const first = { value: 'first' }
    const second = { value: 'second' }
    const wrapper = mount(DraggableList<{ entry: { value: string } }>, {
      props: {
        modelValue: [{ entry: first }, { entry: second }],
        itemKey: item => item.entry,
      },
      slots: { default: '<input :aria-label="params.item.entry.value" />' },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const inputs = wrapper.findAll('input').map(input => input.element)
      await wrapper.setProps({ modelValue: [{ entry: second }, { entry: first }] })
      expect(wrapper.findAll('input')[0]!.element).toBe(inputs[1])
      expect(wrapper.findAll('input')[1]!.element).toBe(inputs[0])
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps duplicate values in separate rows', async () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['same', 'same', 'other'] },
      slots: { default: '<input :aria-label="params.item" />' },
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const inputs = wrapper.findAll('input').map(input => input.element)
      await wrapper.setProps({ modelValue: ['other', 'same', 'same'] })
      expect(wrapper.findAll('input')[0]!.element).toBe(inputs[2])
      expect(wrapper.findAll('input')[1]!.element).toBe(inputs[0])
      expect(wrapper.findAll('input')[2]!.element).toBe(inputs[1])
    } finally {
      wrapper.unmount()
    }
  })

  it('colors the drag image from its parent, hides tooltips, and restores both afterwards', async () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['first', 'second'] },
      attachTo: document.body,
      global: { stubs: { VIcon: true, VTooltip: true } },
    })
    try {
      const parent = wrapper.element as HTMLElement
      parent.style.backgroundColor = 'rgb(33, 33, 33)'
      const item = wrapper.find('.abac-sortable-row').element as HTMLElement
      item.style.backgroundColor = 'rgb(1, 2, 3)'
      const draggable = wrapper.findComponent(VueDraggable)
      expect(draggable.props('forceFallback')).toBe(true)
      expect(draggable.props('fallbackOnBody')).toBe(true)
      expect(draggable.props('ghostClass')).toBe('abac-drag-placeholder')
      expect(draggable.props('fallbackClass')).toBe('abac-drag-preview')
      expect(wrapper.findAll('v-tooltip-stub')).toHaveLength(2)
      draggable.vm.$emit('choose', { item })
      await nextTick()
      expect(item.style.backgroundColor).toBe('rgb(33, 33, 33)')
      expect(wrapper.findAll('v-tooltip-stub')).toHaveLength(0)
      draggable.vm.$emit('end')
      await nextTick()
      expect(item.style.backgroundColor).toBe('rgb(1, 2, 3)')
      expect(wrapper.findAll('v-tooltip-stub')).toHaveLength(2)
    } finally {
      wrapper.unmount()
    }
  })

  it('hides handles when only one item exists or reordering is disabled', async () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: ['only'] },
      global: { stubs: { VBtn: { template: '<button><slot /></button>' }, VIcon: true, VTooltip: true } },
    })
    try {
      expect(wrapper.findAll('button')).toHaveLength(0)
      await wrapper.setProps({ modelValue: ['first', 'second'] })
      expect(wrapper.findAll('button')).toHaveLength(2)
      await wrapper.setProps({ disabled: true })
      expect(wrapper.findAll('button')).toHaveLength(0)
    } finally {
      wrapper.unmount()
    }
  })

  it('moves the focused entry, preserves values, and keeps focus on the moved handle', async () => {
    const original = ['first', 'second', 'third']
    const values = ref([...original])
    const wrapper = mount(defineComponent({
      setup () {
        return () => h(DraggableList<string>, {
          'modelValue': values.value,
          'onUpdate:modelValue': items => {
            values.value = items
          },
        }, { default: ({ item }: { item: string }) => h('span', item) })
      },
    }), {
      attachTo: document.body,
      global: { stubs: { VBtn: { template: '<button><slot /></button>' }, VIcon: true, VTooltip: true } },
    })
    try {
      await wrapper.findAll('button')[1]!.trigger('keydown', { key: 'ArrowUp' })
      expect(values.value).toEqual(['second', 'first', 'third'])
      expect(original).toEqual(['first', 'second', 'third'])
      expect(document.activeElement).toBe(wrapper.findAll('button')[0]!.element)
      await wrapper.findAll('button')[0]!.trigger('keydown', { key: 'ArrowDown' })
      expect(values.value).toEqual(original)
      expect(document.activeElement).toBe(wrapper.findAll('button')[1]!.element)
      await wrapper.findAll('button')[2]!.trigger('keydown', { key: 'ArrowDown' })
      expect(values.value).toEqual(original)
    } finally {
      wrapper.unmount()
    }
  })
})
