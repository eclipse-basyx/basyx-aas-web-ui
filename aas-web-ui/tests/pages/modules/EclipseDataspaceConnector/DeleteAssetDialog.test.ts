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

async function openDialog ({ settle = true } = {}) {
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
        'v-btn': { props: ['text', 'disabled'], template: '<button :disabled="disabled">{{ text }}</button>' },
      },
    },
  })
  // The referencing contracts are loaded when the dialog opens
  await wrapper.setProps({ modelValue: true })
  if (settle) {
    await flushPromises()
  }
  return wrapper
}

async function clickDelete (wrapper: Awaited<ReturnType<typeof openDialog>>): Promise<void> {
  await wrapper.findAll('button').find(button => button.text() === 'Delete')!.trigger('click')
  await flushPromises()
}

describe('DeleteAssetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryContractDefinitions.mockResolvedValue({ success: true, data: [contractOf('contract-1'), contractOf('contract-2', 'other-asset')] })
    mocks.deleteContractDefinition.mockResolvedValue({ success: true })
    mocks.deleteAsset.mockResolvedValue({ success: true })
  })

  it('deletes the referencing contracts before the asset', async () => {
    const wrapper = await openDialog()

    await clickDelete(wrapper)

    expect(mocks.deleteContractDefinition).toHaveBeenCalledTimes(1)
    expect(mocks.deleteContractDefinition).toHaveBeenCalledWith('default', 'contract-1')
    expect(mocks.deleteAsset).toHaveBeenCalledWith('default', 'asset-1')
    expect(wrapper.emitted('deleted')).toHaveLength(1)
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('finds the referencing contracts on all pages, also in "in" and combined criteria', async () => {
    const otherContracts = Array.from({ length: 500 }, (_, index) => contractOf(`other-${index}`, 'other-asset'))
    mocks.queryContractDefinitions
      .mockResolvedValueOnce({ success: true, data: otherContracts })
      .mockResolvedValueOnce({
        success: true,
        data: [
          { '@id': 'contract-in', 'assetsSelector': { operandLeft: 'id', operator: 'in', operandRight: ['asset-0', 'asset-1'] } },
          { '@id': 'contract-combined', 'assetsSelector': [
            { operandLeft: 'https://w3id.org/edc/v0.0.1/ns/id', operator: '=', operandRight: 'asset-1' },
            { operandLeft: 'type', operator: '=', operandRight: 'data' },
          ] },
          { '@id': 'contract-all-assets', 'assetsSelector': [] },
        ],
      })
    const wrapper = await openDialog()

    await clickDelete(wrapper)

    expect(mocks.queryContractDefinitions).toHaveBeenNthCalledWith(2, 'default', {
      querySpec: expect.objectContaining({ offset: 500, limit: 500 }),
    })
    // A contract with an empty selector selects all assets and is kept
    expect(mocks.deleteContractDefinition.mock.calls.map(([, contractId]) => contractId)).toEqual(['contract-in', 'contract-combined'])
    expect(mocks.deleteAsset).toHaveBeenCalledWith('default', 'asset-1')
  })

  it('waits for the referencing contracts before deleting', async () => {
    let resolveContracts: (result: unknown) => void = () => {}
    mocks.queryContractDefinitions.mockReturnValueOnce(new Promise(resolve => (resolveContracts = resolve)))
    const wrapper = await openDialog({ settle: false })

    expect(wrapper.findAll('button').find(button => button.text() === 'Delete')!.attributes('disabled')).toBeDefined()

    resolveContracts({ success: true, data: [contractOf('contract-1')] })
    await flushPromises()
    await clickDelete(wrapper)

    expect(mocks.deleteContractDefinition).toHaveBeenCalledWith('default', 'contract-1')
  })

  it('warns if the referencing contracts cannot be checked', async () => {
    mocks.queryContractDefinitions.mockResolvedValueOnce({ success: false, status: 502 })
    const wrapper = await openDialog()

    expect(wrapper.text()).toContain('The contracts referencing this asset could not be checked')

    await clickDelete(wrapper)

    expect(mocks.deleteContractDefinition).not.toHaveBeenCalled()
    expect(mocks.deleteAsset).toHaveBeenCalledWith('default', 'asset-1')
  })

  it('names the already deleted contracts if an agreement keeps the asset', async () => {
    mocks.deleteAsset.mockResolvedValue({ success: false, status: 409, details: agreementConflict })
    const wrapper = await openDialog()
    mocks.queryContractDefinitions.mockResolvedValue({ success: true, data: [] })

    await clickDelete(wrapper)

    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      baseError: 'Failed to delete Asset.',
      extendedError: `${agreementConflict}\n\nAlready deleted Contracts:\ncontract-1`,
    }))
    expect(wrapper.emitted('deleted')).toBeUndefined()
    // The dialog shows the contracts still referencing the asset
    expect(mocks.queryContractDefinitions).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('contract-1')
  })

  it('keeps the asset if a referencing contract cannot be deleted', async () => {
    mocks.queryContractDefinitions.mockResolvedValue({ success: true, data: [contractOf('contract-1'), contractOf('contract-3')] })
    mocks.deleteContractDefinition
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, status: 404 })
    const wrapper = await openDialog()

    await clickDelete(wrapper)

    expect(mocks.deleteAsset).not.toHaveBeenCalled()
    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'Failed to delete Asset.',
      extendedError: 'The asset was kept, as the Contract contract-3 could not be deleted:\n'
        + 'The Contract does not exist (anymore).'
        + '\n\nAlready deleted Contracts:\ncontract-1',
    }))
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })
})
