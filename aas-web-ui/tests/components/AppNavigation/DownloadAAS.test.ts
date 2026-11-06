import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import DownloadAAS from '@/components/AppNavigation/DownloadAAS.vue'

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({ getSubmodelRefsById: vi.fn().mockResolvedValue([]) }),
}))

vi.mock('@/composables/AAS/AASXPackaging', () => ({
  useAASXPackaging: () => ({
    createClientSerialization: vi.fn(),
    downloadViaBackendSerialization: vi.fn(),
  }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ fetchSmById: vi.fn() }),
}))

vi.mock('@/composables/IDUtils', () => ({
  useIDUtils: () => ({ generateUUIDFromString: vi.fn() }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ dispatchSnackbar: vi.fn() }),
}))

const SlotStub = defineComponent({ template: '<div><slot /></div>' })

const VRadioGroupStub = defineComponent({
  name: 'VRadioGroup',
  props: { modelValue: String },
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
})

async function mountOpenDialog () {
  const wrapper = mount(DownloadAAS, {
    props: { modelValue: false, aas: null },
    global: {
      stubs: {
        VDialog: SlotStub,
        VSheet: SlotStub,
        VCardText: SlotStub,
        VAlert: SlotStub,
        VRadioGroup: VRadioGroupStub,
        VRadio: true,
        VCardTitle: true,
        VCardActions: true,
        VCheckbox: true,
        VDivider: true,
        VLabel: true,
        SubmodelSelection: true,
      },
    },
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

async function select (wrapper: Awaited<ReturnType<typeof mountOpenDialog>>, mode: string, format: string) {
  const [modeGroup, formatGroup] = wrapper.findAllComponents(VRadioGroupStub)
  modeGroup!.vm.$emit('update:modelValue', mode)
  formatGroup!.vm.$emit('update:modelValue', format)
  await wrapper.vm.$nextTick()
}

describe('DownloadAAS dialog', () => {
  it('warns that AASX with JSON content may be unsupported by the backend', async () => {
    const wrapper = await mountOpenDialog()
    await select(wrapper, 'backend', 'aasx-json')

    expect(wrapper.text()).toContain('application/aasx+json')
  })

  it.each([
    ['client', 'aasx-json'],
    ['backend', 'aasx-xml'],
  ])('shows no backend compatibility hint for %s mode with %s', async (mode, format) => {
    const wrapper = await mountOpenDialog()
    await select(wrapper, mode, format)

    expect(wrapper.text()).not.toContain('application/aasx+json')
  })
})
