import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AbacDialog from './AbacDialog.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))
const navigation = vi.hoisted(() => ({ isMobile: false }))
vi.mock('../../../hooks/navigation/useAbacNavigation', () => ({ useAbacNavigation: () => ({ isMobile: ref(navigation.isMobile) }) }))

beforeEach(() => {
  navigation.isMobile = false
})

const DraftForm = defineComponent({
  name: 'DraftForm',
  setup () {
    const expanded = ref(false)
    return { expanded }
  },
  template: '<button @click="expanded = !expanded">{{ expanded ? "Expanded" : "Collapsed" }}</button>',
})

describe('dialog editor mode changes', () => {
  it.each([false, true])('uses the app mobile flag for fullscreen=%s', isMobile => {
    navigation.isMobile = isMobile
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
    })
    try {
      const dialog = wrapper.findComponent({ name: 'VDialog' })
      expect(dialog.props('fullscreen')).toBe(isMobile)
      expect(dialog.props('maxWidth')).toBe(isMobile ? undefined : 860)
    } finally {
      wrapper.unmount()
    }
  })

  it.each([false, true])('places switch guidance above the footer controls on mobile=%s', async isMobile => {
    navigation.isMobile = isMobile
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, editorMode: 'json', formLimitation: 'malformed', messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
      slots: { json: '<textarea />' },
      global: { renderStubDefaultSlot: true },
    })
    try {
      await flushPromises()
      const actions = wrapper.get('v-card-actions-stub')
      const notice = actions.get('[role="status"]')
      const toggle = wrapper.findComponent({ name: 'VBtnToggle' })
      expect(notice.text()).toBe('forms.limitation.malformed')
      expect(toggle.attributes('aria-describedby')).toBe(notice.attributes('id'))
      expect(toggle.element.parentElement?.previousElementSibling).toBe(notice.element)
      expect(wrapper.get('v-card-text-stub').find('[role="status"]').exists()).toBe(false)
      await wrapper.setProps({ formLimitation: null, editorMode: 'form' })
      expect(actions.find('[role="status"]').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('mounts JSON immediately when a session opens with an unsupported form document', async () => {
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, editorMode: 'json', messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
      slots: { form: '<input aria-label="Form" />', json: '<textarea aria-label="JSON" />' },
      global: { renderStubDefaultSlot: true },
    })
    try {
      await flushPromises()
      expect(wrapper.get('textarea').isVisible()).toBe(true)
      expect(wrapper.get('input').isVisible()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('blocks submission, closing, and mode changes while a request is pending', async () => {
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, editorMode: 'form', loading: true, messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
      global: { renderStubDefaultSlot: true },
    })
    try {
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const save = buttons.find(button => button.text() === 'Save')!
      const cancel = buttons.find(button => button.text() === 'Cancel')!
      const close = buttons.find(button => button.attributes('aria-label') === 'Cancel')!
      save.vm.$emit('click')
      cancel.vm.$emit('click')
      close.vm.$emit('click')
      wrapper.findComponent({ name: 'VBtnToggle' }).vm.$emit('update:modelValue', 'json')
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.emitted('switch')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.get('v-form-stub').attributes('inert')).toBeDefined()
      await wrapper.setProps({ loading: false })
      save.vm.$emit('click')
      expect(wrapper.emitted('submit')).toHaveLength(1)
      await wrapper.setProps({ loading: true })
      save.vm.$emit('click')
      expect(wrapper.emitted('submit')).toHaveLength(1)
      await wrapper.setProps({ loading: false })
      cancel.vm.$emit('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    } finally {
      wrapper.unmount()
    }
  })

  it('retains mounted views, independent scroll positions, and JSON height until a new session opens', async () => {
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, editorMode: 'form', messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
      slots: { form: DraftForm, json: '<textarea aria-label="JSON" />' },
      global: { renderStubDefaultSlot: true, stubs: { DraftForm: false, VCardText: { template: '<div class="dialog-body"><slot /></div>' } } },
    })
    try {
      await flushPromises()
      const body = wrapper.get('.dialog-body').element as HTMLElement
      const form = wrapper.findComponent(DraftForm)
      await form.get('button').trigger('click')
      expect(wrapper.find('textarea').exists()).toBe(false)
      body.scrollTop = 400
      await wrapper.setProps({ editorMode: 'json' })
      await flushPromises()
      expect(body.scrollTop).toBe(0)
      const json = wrapper.get('textarea').element as HTMLTextAreaElement
      json.style.height = '600px'
      body.scrollTop = 150
      await wrapper.setProps({ editorMode: 'form' })
      await flushPromises()
      expect(body.scrollTop).toBe(400)
      expect(wrapper.findComponent(DraftForm).element).toBe(form.element)
      expect(form.text()).toBe('Expanded')
      await wrapper.setProps({ editorMode: 'json' })
      await flushPromises()
      expect(body.scrollTop).toBe(150)
      expect(wrapper.get('textarea').element).toBe(json)
      expect(json.style.height).toBe('600px')
      await wrapper.setProps({ modelValue: false })
      await wrapper.setProps({ modelValue: true, editorMode: 'form' })
      await flushPromises()
      expect(body.scrollTop).toBe(0)
      expect(wrapper.findComponent(DraftForm).text()).toBe('Collapsed')
      expect(wrapper.find('textarea').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps the current position when a requested mode change is rejected', async () => {
    const wrapper = shallowMount(AbacDialog, {
      props: { modelValue: true, editorMode: 'json', messages: { title: 'Edit', cancel: 'Cancel', submit: 'Save' } },
      global: { renderStubDefaultSlot: true, stubs: { VCardText: { template: '<div class="dialog-body"><slot /></div>' } } },
    })
    try {
      await flushPromises()
      const body = wrapper.get('.dialog-body').element as HTMLElement
      body.scrollTop = 300
      wrapper.findComponent({ name: 'VBtnToggle' }).vm.$emit('update:modelValue', 'form')
      await flushPromises()
      expect(wrapper.emitted('switch')).toEqual([['form']])
      expect(body.scrollTop).toBe(300)
    } finally {
      wrapper.unmount()
    }
  })
})
