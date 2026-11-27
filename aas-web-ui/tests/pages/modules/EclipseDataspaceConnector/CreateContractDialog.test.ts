import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import CreateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Dialogs/CreateContractDialog.vue'
import { formStub } from '../../../helpers/vuetifyStubs'

const mocks = vi.hoisted(() => ({
  createContractDefinition: vi.fn(),
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    createContractDefinition: mocks.createContractDefinition,
    queryAssets: vi.fn(),
    queryPolicyDefinitions: vi.fn(),
  }),
}))

// The selects are stubbed and get their values directly, so no assets or policies need to be loaded
vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceOptions', () => ({
  useEdcResourceOptions: () => ({ options: ref([]), loading: ref(false), load: vi.fn() }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

const slotStub = { template: '<div><slot /></div>' }
const fieldStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: '<input :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
}

function mountDialog () {
  return mount(CreateContractDialog, {
    props: { 'modelValue': true, 'proxyId': 'proxy-a', 'onUpdate:modelValue': () => {} },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-form': formStub,
        'v-divider': true,
        'v-spacer': true,
        'v-select': fieldStub,
        'v-text-field': fieldStub,
        'v-btn': { props: ['text', 'disabled'], emits: ['click'], template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>' },
        'JSONPreview': true,
      },
    },
  })
}

type Wrapper = ReturnType<typeof mountDialog>

async function setField (wrapper: Wrapper, label: string, value: string): Promise<void> {
  await wrapper.find(`input[data-label="${label}"]`).setValue(value)
  await flushPromises()
}

async function selectAll (wrapper: Wrapper, assetId: string, accessPolicyId: string, usagePolicyId: string): Promise<void> {
  await setField(wrapper, 'Asset ID', assetId)
  await setField(wrapper, 'Access Policy ID', accessPolicyId)
  await setField(wrapper, 'Usage Policy ID', usagePolicyId)
}

function contractId (wrapper: Wrapper): string {
  return (wrapper.find('input[data-label="Contract ID"]').element as HTMLInputElement).value
}

describe('CreateContractDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates the Contract ID again when the asset changes', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    await selectAll(wrapper, 'asset-a', 'access-a', 'usage-a')
    expect(contractId(wrapper)).toBe('contract-asset-a-access-a-usage-a')

    await setField(wrapper, 'Asset ID', 'asset-b')
    expect(contractId(wrapper)).toBe('contract-asset-b-access-a-usage-a')
    wrapper.unmount()
  })

  it('generates the Contract ID again when a policy changes', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    await selectAll(wrapper, 'asset-a', 'access-a', 'usage-a')

    await setField(wrapper, 'Access Policy ID', 'access-b')
    expect(contractId(wrapper)).toBe('contract-asset-a-access-b-usage-a')

    await setField(wrapper, 'Usage Policy ID', 'usage-b')
    expect(contractId(wrapper)).toBe('contract-asset-a-access-b-usage-b')
    wrapper.unmount()
  })

  it('keeps a typed Contract ID, and generates it again after the field is cleared', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    await selectAll(wrapper, 'asset-a', 'access-a', 'usage-a')
    await setField(wrapper, 'Contract ID', 'my-contract')

    await setField(wrapper, 'Asset ID', 'asset-b')
    expect(contractId(wrapper)).toBe('my-contract')

    await setField(wrapper, 'Contract ID', '')
    await setField(wrapper, 'Usage Policy ID', 'usage-b')
    expect(contractId(wrapper)).toBe('contract-asset-b-access-a-usage-b')
    wrapper.unmount()
  })
})
