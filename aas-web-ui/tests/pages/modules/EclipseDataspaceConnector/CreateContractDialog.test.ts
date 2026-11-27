import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import CreateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Dialogs/CreateContractDialog.vue'
import { formStub } from '../../../helpers/vuetifyStubs'

const mocks = vi.hoisted(() => ({
  createContractDefinition: vi.fn(),
  dispatchSnackbar: vi.fn(),
  options: {} as Record<string, unknown[]>,
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    createContractDefinition: mocks.createContractDefinition,
    queryAssets: vi.fn(),
    queryPolicyDefinitions: vi.fn(),
  }),
}))

// The assets and policies a test offers, by the resource label of the dialog, e.g. `policies`
vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceOptions', () => ({
  useEdcResourceOptions: (resourceLabel: string) => ({ options: ref(mocks.options[resourceLabel] ?? []), loading: ref(false), load: vi.fn() }),
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
// Like the field, and offers its items and their titles to the test
const selectStub = { ...fieldStub, props: [...fieldStub.props, 'items', 'itemTitle'] }

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
        'v-select': selectStub,
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

function selectItems (wrapper: Wrapper, label: string): string[] {
  const select = wrapper.findAllComponents(selectStub).find(component => component.props('label') === label)!
  return select.props('items').map((item: unknown) => select.props('itemTitle')(item))
}

function policy (id: string, actions: string[]) {
  return { '@id': id, 'policy': { permission: actions.map(action => ({ action })) } }
}

function contractId (wrapper: Wrapper): string {
  return (wrapper.find('input[data-label="Contract ID"]').element as HTMLInputElement).value
}

describe('CreateContractDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.options = {}
  })

  it('offers each policy select only policies of its type, and policies of unknown type in both', async () => {
    mocks.options = {
      policies: [
        policy('access-policy', ['odrl:access']),
        policy('usage-policy', ['odrl:use']),
        policy('mixed-policy', ['odrl:access', 'odrl:use']),
        policy('unknown-policy', []),
      ],
    }
    const wrapper = mountDialog()
    await flushPromises()

    expect(selectItems(wrapper, 'Access Policy ID')).toEqual(['access-policy', 'mixed-policy', 'unknown-policy'])
    expect(selectItems(wrapper, 'Usage Policy ID')).toEqual(['usage-policy', 'mixed-policy', 'unknown-policy'])
    wrapper.unmount()
  })

  it('names each asset with its ID, so assets of the same template can be told apart', async () => {
    mocks.options = {
      assets: [
        { '@id': 'asset-1', 'properties': { name: 'Submodel Service' } },
        { '@id': 'asset-2', 'properties': { name: 'Submodel Service' } },
        { '@id': 'asset-3', 'properties': {} },
      ],
    }
    const wrapper = mountDialog()
    await flushPromises()

    expect(selectItems(wrapper, 'Asset ID')).toEqual(['Submodel Service (asset-1)', 'Submodel Service (asset-2)', 'asset-3'])
    wrapper.unmount()
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
