import { flushPromises, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AbacEditor from './AbacEditor.vue'

vi.mock('../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('ABAC JSON editor view state', () => {
  it.each([
    { mode: 'view' as const, disabled: false, readOnly: true },
    { mode: 'create' as const, disabled: true, readOnly: true },
    { mode: 'update' as const, disabled: false, readOnly: false },
  ])('enforces the editor contract for $mode with disabled=$disabled', async ({ mode, disabled, readOnly }) => {
    const wrapper = shallowMount(AbacEditor, { props: { modelValue: '{}', target: { mode, viewer: 'rule' }, disabled, rows: 18 } })
    try {
      const code = wrapper.findComponent({ name: 'CodeEditor' })
      expect(code.props('readOnly')).toBe(readOnly)
      expect(code.props('height')).toBe('376px')
      const dispose = vi.fn()
      const getContribution = vi.fn(() => ({ dispose }))
      code.vm.$emit('ready', {}, { getContribution })
      expect(getContribution).toHaveBeenCalledWith('editor.contrib.readOnlyMessageController')
      expect(dispose).toHaveBeenCalledOnce()
      await wrapper.setProps({ rows: 'auto', disabled: true })
      expect(code.props('height')).toBe('100%')
      expect(code.props('readOnly')).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })

  it('restores scrolling after hidden edits without restoring an old cursor or selection', async () => {
    const wrapper = shallowMount(AbacEditor, {
      props: { modelValue: '{}', target: { mode: 'create', viewer: 'rule' } },
    })
    const instance = {
      getContribution: vi.fn(),
      getScrollTop: vi.fn(() => 240),
      getScrollLeft: vi.fn(() => 32),
      setScrollPosition: vi.fn(),
      restoreViewState: vi.fn(),
      layout: vi.fn(),
    }
    try {
      wrapper.findComponent({ name: 'CodeEditor' }).vm.$emit('ready', {}, instance)
      await wrapper.setProps({ active: false })
      expect(instance.getScrollTop).toHaveBeenCalledOnce()
      await wrapper.setProps({ modelValue: '{"updated": true}' })
      expect(instance.setScrollPosition).not.toHaveBeenCalled()
      await wrapper.setProps({ active: true })
      await flushPromises()
      expect(instance.layout).toHaveBeenCalledOnce()
      expect(instance.setScrollPosition).toHaveBeenCalledWith({ scrollTop: 240, scrollLeft: 32 })
      expect(instance.restoreViewState).not.toHaveBeenCalled()
      expect(instance.layout.mock.invocationCallOrder[0]).toBeLessThan(instance.setScrollPosition.mock.invocationCallOrder[0]!)
    } finally {
      wrapper.unmount()
    }
  })
})
