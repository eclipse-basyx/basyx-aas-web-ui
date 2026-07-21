import type { CatenaXPartner } from '@/types/Infrastructure'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import CatenaXEdcConfigPanel from '@/components/AppNavigation/Settings/CatenaXEdcConfigPanel.vue'

const VBtnStub = defineComponent({
  props: {
    text: String,
  },
  emits: ['click'],
  template: '<button v-bind="$attrs" type="button" @click="$emit(\'click\', $event)">{{ text }}<slot /></button>',
})

const VDialogStub = defineComponent({
  props: {
    modelValue: Boolean,
  },
  template: '<div v-if="modelValue"><slot /></div>',
})

const PartnerDialogStub = defineComponent({
  name: 'CatenaXPartnerDialog',
  props: {
    allowDefault: Boolean,
    modelValue: Boolean,
  },
  emits: ['save', 'update:modelValue'],
  setup (_props, { emit }) {
    const partner: CatenaXPartner = {
      id: 'partner-b',
      name: 'Partner B',
      counterPartyId: 'BPNL0002',
      counterPartyAddress: 'https://partner-b.example/dsp',
    }
    function save (): void {
      emit('save', partner, true)
    }
    return { save }
  },
  template: '<button v-if="modelValue" data-testid="save-dialog" :data-allow-default="allowDefault" type="button" @click="save">Save dialog</button>',
})

const SlotStub = defineComponent({
  template: '<div><slot name="prepend" /><slot /><slot name="append" /><slot name="activator" :props="{}" /></div>',
})

const VTextFieldStub = defineComponent({
  props: {
    modelValue: String,
  },
  template: '<input :value="modelValue">',
})

const partners: CatenaXPartner[] = [
  {
    id: 'partner-a',
    name: 'Partner A',
    counterPartyId: 'BPNL0001',
    counterPartyAddress: 'https://partner-a.example/dsp',
  },
]

function createWrapper (configuredPartners = partners) {
  return mount(CatenaXEdcConfigPanel, {
    props: {
      modelValue: {
        accessMode: 'edc',
        edc: {
          proxyId: 'default',
          defaultPartnerId: configuredPartners[0]?.id,
          partners: configuredPartners,
        },
      },
    },
    global: {
      stubs: {
        CatenaXPartnerDialog: PartnerDialogStub,
        VAlert: SlotStub,
        VBtn: VBtnStub,
        VCard: SlotStub,
        VCardActions: SlotStub,
        VCardText: SlotStub,
        VCardTitle: SlotStub,
        VChip: SlotStub,
        VContainer: SlotStub,
        VDialog: VDialogStub,
        VDivider: true,
        VList: SlotStub,
        VListItem: SlotStub,
        VListItemSubtitle: SlotStub,
        VListItemTitle: SlotStub,
        VRadio: true,
        VRadioGroup: SlotStub,
        VSpacer: true,
        VTextField: VTextFieldStub,
        VTooltip: SlotStub,
      },
    },
  })
}

describe('CatenaXEdcConfigPanel.vue', () => {
  it('adds a partner, makes it default, and synchronizes legacy defaults', async () => {
    const wrapper = createWrapper()
    const addButton = wrapper.findAll('button').find(button => button.text().includes('Add business partner'))!

    await addButton.trigger('click')
    await wrapper.get('[data-testid="save-dialog"]').trigger('click')

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      accessMode: 'edc',
      edc: {
        proxyId: 'default',
        defaultPartnerId: 'partner-b',
        defaultCounterPartyId: 'BPNL0002',
        defaultCounterPartyAddress: 'https://partner-b.example/dsp',
        partners: [...partners, {
          id: 'partner-b',
          name: 'Partner B',
          counterPartyId: 'BPNL0002',
          counterPartyAddress: 'https://partner-b.example/dsp',
        }],
      },
    })
  })

  it('promotes the next partner when deleting the default', async () => {
    const secondPartner: CatenaXPartner = {
      id: 'partner-b',
      name: 'Partner B',
      counterPartyId: 'BPNL0002',
      counterPartyAddress: 'https://partner-b.example/dsp',
    }
    const wrapper = createWrapper([...partners, secondPartner])

    await wrapper.get('[aria-label="Delete Partner A"]').trigger('click')
    expect(wrapper.text()).toContain('“Partner B” will become the default partner.')
    const deleteButton = wrapper.findAll('button').find(button => button.text() === 'Delete')!
    await deleteButton.trigger('click')

    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toEqual({
      accessMode: 'edc',
      edc: {
        proxyId: 'default',
        defaultPartnerId: 'partner-b',
        defaultCounterPartyId: 'BPNL0002',
        defaultCounterPartyAddress: 'https://partner-b.example/dsp',
        partners: [secondPartner],
      },
    })
  })

  it('selects the default from the full row without opening edit and hides default choice while editing', async () => {
    const secondPartner: CatenaXPartner = {
      id: 'partner-b',
      name: 'Partner B',
      counterPartyId: 'BPNL0002',
      counterPartyAddress: 'https://partner-b.example/dsp',
    }
    const wrapper = createWrapper([...partners, secondPartner])

    await wrapper.get('[aria-label="Use Partner B as default partner"]').trigger('click')
    expect(wrapper.emitted('update:model-value')?.at(-1)?.[0]).toMatchObject({
      edc: {
        defaultPartnerId: 'partner-b',
        defaultCounterPartyId: 'BPNL0002',
      },
    })

    await wrapper.get('[aria-label="Edit Partner A"]').trigger('click')
    expect(wrapper.get('[data-testid="save-dialog"]').attributes('data-allow-default')).toBe('false')
  })

  it('warns when deleting the final default partner', async () => {
    const wrapper = createWrapper()

    await wrapper.get('[aria-label="Delete Partner A"]').trigger('click')
    expect(wrapper.text()).toContain('No default partner will remain.')
  })
})
