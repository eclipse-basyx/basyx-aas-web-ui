import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import BankAccounts from '@/pages/modules/CompanyDataPortal/BankAccounts.vue'
import { useFormStore } from '@/pages/modules/CompanyDataPortal/stores/formData'

const slotStub = defineComponent({
  template: '<div><slot /></div>',
})

const formStub = defineComponent({
  template: '<form><slot /></form>',
})

const buttonStub = defineComponent({
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
})

const bankAccountFormStub = defineComponent({
  props: ['index', 'modelValue'],
  emits: ['update:modelValue'],
  template: '<div data-bank-account-form>{{ index }}</div>',
})

describe('CompanyDataPortal bank accounts', () => {
  it('removes an optional blank account so the user can continue', async () => {
    const next = vi.fn()
    const wrapper = mount(BankAccounts, {
      props: {
        next,
        prev: vi.fn(),
        isActiveComponent: true,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          VContainer: slotStub,
          VSheet: slotStub,
          VForm: formStub,
          VRow: slotStub,
          VCol: slotStub,
          VBtn: buttonStub,
          BankAccountForm: bankAccountFormStub,
        },
      },
    })

    wrapper.vm.addMore()
    await nextTick()

    expect(wrapper.findAll('[data-bank-account-form]')).toHaveLength(1)

    const deleteButton = wrapper.find('button[aria-label="Delete bank account 1"]')
    expect(deleteButton.exists()).toBe(true)

    await deleteButton.trigger('click')
    expect(wrapper.findAll('[data-bank-account-form]')).toHaveLength(0)

    await wrapper.find('form').trigger('submit')
    expect(next).toHaveBeenCalledOnce()
  })

  it('clears a previously saved account after the user deletes it', async () => {
    const pinia = createPinia()
    const store = useFormStore(pinia)
    const wrapper = mount(BankAccounts, {
      props: {
        next: vi.fn(),
        prev: vi.fn(),
        isActiveComponent: true,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VContainer: slotStub,
          VSheet: slotStub,
          VForm: formStub,
          VRow: slotStub,
          VCol: slotStub,
          VBtn: buttonStub,
          BankAccountForm: bankAccountFormStub,
        },
      },
    })

    wrapper.vm.addMore()
    await nextTick()

    wrapper.findComponent(bankAccountFormStub).vm.$emit('update:modelValue', {
      idShort: 'PrimaryAccount',
      accountHolder: 'Example GmbH',
      accountType: 'Business',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
    })
    await nextTick()
    await wrapper.find('form').trigger('submit')

    expect(store.bankAccounts).not.toBeNull()
    expect(store.mainAccountIdShort).toBe('PrimaryAccount')

    await wrapper.find('button[aria-label="Delete bank account 1"]').trigger('click')
    await wrapper.find('form').trigger('submit')

    expect(store.bankAccounts).toBeNull()
    expect(store.mainAccountIdShort).toBe('BankAccount__00__')
  })
})
