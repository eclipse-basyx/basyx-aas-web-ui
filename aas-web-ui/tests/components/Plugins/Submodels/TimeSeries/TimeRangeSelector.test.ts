import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TimeRangeSelector from '@/components/Plugins/Submodels/TimeSeries/TimeRangeSelector.vue'

function createWrapper () {
  return mount(TimeRangeSelector, {
    props: {
      modelValue: { mode: 'relative', value: 1, unit: 'minutes' },
    },
    global: {
      stubs: {
        'v-btn-toggle': true,
        'v-btn': true,
        'v-select': true,
        'v-row': true,
        'v-col': true,
        'v-text-field': true,
      },
    },
  })
}

describe('TimeRangeSelector', () => {
  it('starts with the matching relative preset', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    expect(vm.mode).toBe('relative')
    expect(vm.selectedPreset).toBe('1m')
    expect(wrapper.text()).toContain('Time Range')
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
})
