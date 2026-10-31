import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/DeleteAssetDialog.vue'

const mocks = vi.hoisted(() => ({
  deleteAsset: vi.fn(),
  deleteContractDefinition: vi.fn(),
  dispatchSnackbar: vi.fn(),
  queryContractDefinitions: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    deleteAsset: mocks.deleteAsset,
    deleteContractDefinition: mocks.deleteContractDefinition,
    queryContractDefinitions: mocks.queryContractDefinitions,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
    dispatchSnackbar: mocks.dispatchSnackbar,
  }),
}))

const slotStub = { template: '<div><slot /></div>' }
const asset = { '@id': 'asset-1' }
const agreementConflict = 'The asset cannot be deleted, because it is referenced by a contract agreement'

function contractOf (id: string, assetId = asset['@id']): Record<string, unknown> {
  return {
    '@id': id,
    'assetsSelector': { operandLeft: 'https://w3id.org/edc/v0.0.1/ns/id', operator: '=', operandRight: assetId },
  }
}

async function openDialog () {
  const wrapper = mount(DeleteAssetDialog, {
    props: { modelValue: false, asset },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-alert': slotStub,
        'v-list': slotStub,
        'v-list-item': slotStub,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { props: ['text'], template: '<button>{{ text }}</button>' },
      },
    },
  })
  // The referencing contract definitions are loaded when the dialog opens
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

async function clickDelete (wrapper: Awaited<ReturnType<typeof openDialog>>): Promise<void> {
  await wrapper.findAll('button').find(button => button.text() === 'Delete')!.trigger('click')
  await flushPromises()
}

describe('DeleteAssetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryContractDefinitions.mockResolvedValue([contractOf('contract-1'), contractOf('contract-2', 'other-asset')])
    mocks.deleteContractDefinition.mockResolvedValue({ success: true })
    mocks.deleteAsset.mockResolvedValue({ success: true })
  })

  it('deletes the referencing contract definitions before the asset', async () => {
    const wrapper = await openDialog()

    await clickDelete(wrapper)

    expect(mocks.deleteContractDefinition).toHaveBeenCalledTimes(1)
    expect(mocks.deleteContractDefinition).toHaveBeenCalledWith('default', 'contract-1')
    expect(mocks.deleteAsset).toHaveBeenCalledWith('default', 'asset-1')
    expect(wrapper.emitted('asset-deleted')).toEqual([[true]])
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('names the already deleted contract definitions if an agreement keeps the asset', async () => {
    mocks.deleteAsset.mockResolvedValue({ success: false, status: 409, errorDetails: agreementConflict })
    const wrapper = await openDialog()
    mocks.queryContractDefinitions.mockResolvedValue([])

    await clickDelete(wrapper)

    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      baseError: 'Failed to delete EDC Asset.',
      extendedError: `${agreementConflict}\n\nAlready deleted Contract Definitions:\ncontract-1`,
    }))
    expect(wrapper.emitted('asset-deleted')).toBeUndefined()
    // The dialog shows the contract definitions still referencing the asset
    expect(mocks.queryContractDefinitions).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('contract-1')
  })

  it('keeps the asset if a referencing contract definition cannot be deleted', async () => {
    mocks.queryContractDefinitions.mockResolvedValue([contractOf('contract-1'), contractOf('contract-3')])
    mocks.deleteContractDefinition
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, status: 404 })
    const wrapper = await openDialog()

    await clickDelete(wrapper)

    expect(mocks.deleteAsset).not.toHaveBeenCalled()
    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'Failed to delete EDC Asset.',
      extendedError: 'The asset was kept, as the Contract Definition contract-3 could not be deleted:\n'
        + 'The EDC Contract Definition does not exist (anymore).'
        + '\n\nAlready deleted Contract Definitions:\ncontract-1',
    }))
    expect(wrapper.emitted('asset-deleted')).toBeUndefined()
  })
})
