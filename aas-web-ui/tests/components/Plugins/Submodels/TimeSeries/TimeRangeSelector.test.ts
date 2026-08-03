import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import TimeRangeSelector from '@/components/Plugins/Submodels/TimeSeries/TimeRangeSelector.vue'

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

function createWrapper () {
  return mount(TimeRangeSelector, {
    props: {
      modelValue: { mode: 'relative', value: 1, unit: 'minutes' },
    },
    global: {
      stubs: {
        'v-btn-toggle': true,
        'v-btn': true,
        'v-card': true,
        'v-card-actions': true,
        'v-card-text': true,
        'v-card-title': true,
        'v-select': true,
        'v-row': true,
        'v-col': true,
        'v-icon': true,
        'v-menu': true,
        'v-text-field': true,
      },
    },
  })
}

function createInteractiveWrapper () {
  return mount(TimeRangeSelector, {
    attachTo: document.body,
    props: {
      modelValue: { mode: 'relative', value: 1, unit: 'minutes' },
    },
    global: {
      plugins: [createVuetify()],
    },
  })
}

describe('TimeRangeSelector', () => {
  it('starts with the matching relative preset', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    expect(vm.mode).toBe('relative')
    expect(vm.selectedPreset).toBe('1m')
    expect(vm.buttonLabel).toBe('Last 1m')
  })

  it('emits a custom relative range', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.selectedPreset = 'custom'
    vm.relativeValue = 2
    vm.relativeUnit = 'hours'
    await nextTick()

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      mode: 'relative',
      value: 2,
      unit: 'hours',
    })
  })

  it('emits absolute inputs and exposes their validation error', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.mode = 'absolute'
    vm.absoluteStart = '2026-05-13T20:00'
    vm.absoluteStop = '2026-05-13T19:00'
    await nextTick()

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      mode: 'absolute',
      start: '2026-05-13T20:00',
      stop: '2026-05-13T19:00',
    })
    expect(vm.validationError).toContain('before the end')
  })

  it('supports absolute mode through user-facing controls', async () => {
    const wrapper = createInteractiveWrapper()
    ;(wrapper.vm as any).menuOpen = true
    await nextTick()
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Absolute')
    })

    const absoluteButton = Array.from(document.body.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === 'Absolute')
    expect(absoluteButton).toBeTruthy()

    absoluteButton!.click()
    await nextTick()
    const dateInputs = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]'))
    expect(dateInputs).toHaveLength(2)

    dateInputs[0].value = '2026-05-13T18:00'
    dateInputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    dateInputs[1].value = '2026-05-13T19:00'
    dateInputs[1].dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      mode: 'absolute',
      start: '2026-05-13T18:00',
      stop: '2026-05-13T19:00',
    })
    expect((wrapper.vm as any).validationError).toBeNull()
    expect(wrapper.get('button').attributes('aria-label')).toBe('Time range: Absolute range')

    wrapper.unmount()
  })
})
