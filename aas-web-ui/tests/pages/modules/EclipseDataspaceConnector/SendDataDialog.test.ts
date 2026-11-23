import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onMounted, ref } from 'vue'
import SendDataDialog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Dialogs/SendDataDialog.vue'

const internalSmUrl = 'https://sm-repo.internal/submodels/dXJuOnNtOjE'
const internalAasUrl = 'https://aas-repo.internal/shells/dXJuOmFhczox'

const selection = vi.hoisted(() => ({
  aas: null as any,
  submodels: [] as any[],
}))

const mocks = vi.hoisted(() => ({
  pushData: vi.fn(),
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ pushData: mocks.pushData }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute', () => ({
  useEdcDialogRoute: () => ({ dialogState: () => ref(null) }),
}))

const slotStub = { template: '<div><slot /></div>' }

function mountDialog () {
  return mount(SendDataDialog, {
    props: {
      modelValue: true,
      proxyId: 'proxy-a',
      businessPartner: { id: 'provider-a', name: 'Provider A', counterPartyId: 'BPNL-A', counterPartyAddress: 'https://provider-a.test/api/v1/dsp' } as any,
      catalogDataset: { '@id': 'push-asset' },
    },
    global: {
      stubs: {
        // The selection of the drawers: the AAS and its Submodels as loaded by the repository clients
        'InfrastructureSelectionDrawers': {
          emits: ['update:aas', 'update:submodels'],
          setup (_props: unknown, { emit }: { emit: (event: string, value: unknown) => void }) {
            onMounted(() => {
              emit('update:aas', { aas: selection.aas }) // An item of the AAS list
              emit('update:submodels', selection.submodels)
            })
          },
          template: '<div />',
        },
        'JsonPreviewTabs': true,
        'SelectAasEmptyState': true,
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-layout': slotStub,
        'v-main': slotStub,
        'v-container': slotStub,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { props: ['text', 'disabled'], emits: ['click'], template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>' },
      },
    },
  })
}

async function clickButton (wrapper: ReturnType<typeof mountDialog>, text: string): Promise<void> {
  await wrapper.findAll('button').find(button => button.text() === text)!.trigger('click')
  await flushPromises()
}

describe('SendDataDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pushData.mockResolvedValue({ success: true, data: { data: {}, edc: {} } })
    selection.aas = {
      modelType: 'AssetAdministrationShell',
      id: 'urn:aas:1',
      path: internalAasUrl,
      endpoints: [{ protocolInformation: { href: internalAasUrl }, interface: 'AAS-3.0' }],
      submodels: [
        { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'urn:sm:1' }] },
        { type: 'ModelReference', keys: [{ type: 'Submodel', value: 'urn:sm:2' }] },
      ],
    }
    selection.submodels = [{
      modelType: 'Submodel',
      id: 'urn:sm:1',
      idShort: 'Nameplate',
      path: internalSmUrl,
      endpoints: [{ protocolInformation: { href: internalSmUrl }, interface: 'SUBMODEL-3.0' }],
      submodelElements: [],
    }]
  })

  it('sends a Submodel without the internal repository URLs', async () => {
    const wrapper = mountDialog()
    await flushPromises()

    await clickButton(wrapper, 'Send Submodel')

    expect(mocks.pushData).toHaveBeenCalledWith('proxy-a', expect.objectContaining({
      counterPartyId: 'BPNL-A',
      assetId: 'push-asset',
      data: { modelType: 'Submodel', id: 'urn:sm:1', idShort: 'Nameplate', submodelElements: [] },
    }))
  })

  it('sends the AAS Environment without the internal repository URLs, with only the selected Submodels', async () => {
    const wrapper = mountDialog()
    await flushPromises()

    await clickButton(wrapper, 'Send AAS')

    const environment = mocks.pushData.mock.calls[0]![1].data
    expect(environment).toEqual({
      assetAdministrationShells: [{
        modelType: 'AssetAdministrationShell',
        id: 'urn:aas:1',
        submodels: [{ type: 'ModelReference', keys: [{ type: 'Submodel', value: 'urn:sm:1' }] }],
      }],
      submodels: [{ modelType: 'Submodel', id: 'urn:sm:1', idShort: 'Nameplate', submodelElements: [] }],
      conceptDescriptions: [],
    })
    expect(JSON.stringify(environment)).not.toContain('.internal')
  })
})
