import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import AutoRefreshSelector from '@/components/Plugins/Submodels/TimeSeries/AutoRefreshSelector.vue'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    disconnect () {}
    observe () {}
    unobserve () {}
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

describe('AutoRefreshSelector', () => {
  it('enables and updates the interval through user-facing controls', async () => {
    const wrapper = mount(AutoRefreshSelector, {
      attachTo: document.body,
      props: {
        modelValue: { enabled: false, value: 30, unit: 'seconds' },
      },
      global: {
        plugins: [createVuetify()],
      },
    })

    ;(wrapper.vm as any).menuOpen = true
    await nextTick()
    await vi.waitFor(() => {
      expect(document.body.querySelector('input[type="checkbox"]')).not.toBeNull()
    })
    const checkbox = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    const numberInput = document.body.querySelector<HTMLInputElement>('input[type="number"]')!
    checkbox.click()
    await nextTick()
    numberInput.value = '5'
    numberInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      enabled: true,
      value: 5,
      unit: 'seconds',
    })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Auto refresh: 5s')

    wrapper.unmount()
  })

  it('shows validation feedback for sub-second intervals', async () => {
    const wrapper = mount(AutoRefreshSelector, {
      attachTo: document.body,
      props: {
        modelValue: { enabled: true, value: 1, unit: 'seconds' },
      },
      global: {
        plugins: [createVuetify()],
      },
    })

    ;(wrapper.vm as any).menuOpen = true
    await nextTick()
    await vi.waitFor(() => {
      expect(document.body.querySelector('input[type="number"]')).not.toBeNull()
    })
    const numberInput = document.body.querySelector<HTMLInputElement>('input[type="number"]')!
    numberInput.value = '0.5'
    numberInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(document.body.textContent).toContain('between 1 second and 24 days')
    expect(wrapper.get('button').classes()).toContain('text-error')

    wrapper.unmount()
  })
})
