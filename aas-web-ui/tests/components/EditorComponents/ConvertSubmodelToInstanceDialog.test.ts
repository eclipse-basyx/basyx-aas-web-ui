import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConvertSubmodelToInstanceDialog from '@/components/EditorComponents/ConvertSubmodelToInstanceDialog.vue'

const mocks = vi.hoisted(() => ({
  fetchSm: vi.fn(),
  putSubmodel: vi.fn(),
  consumeFailureStatus: vi.fn(),
  consumeFailureDetails: vi.fn(),
  fetchAndDispatchSme: vi.fn(),
  snackbar: vi.fn(),
  reloadTree: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {
      path: 'https://example.test/submodels/template/submodel-elements/Property',
      fragment: 'inputVariables/0/value',
    },
  }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    fetchSm: mocks.fetchSm,
    putSubmodel: mocks.putSubmodel,
    consumeLastRequestFailureStatus: mocks.consumeFailureStatus,
    consumeLastRequestFailureDetails: mocks.consumeFailureDetails,
  }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({
    fetchAndDispatchSme: mocks.fetchAndDispatchSme,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: { id: 'urn:example:aas' },
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mocks.snackbar,
    dispatchTriggerTreeviewReload: mocks.reloadTree,
  }),
}))

const slotStub = { template: '<div><slot /></div>' }

function templateSubmodelJson (): jsonization.JsonValue {
  const templateQualifier = new aasTypes.Qualifier(
    'SMT/Cardinality',
    aasTypes.DataTypeDefXsd.String,
    null,
    null,
    aasTypes.QualifierKind.TemplateQualifier,
  )
  const property = new aasTypes.Property(aasTypes.DataTypeDefXsd.String)
  property.idShort = 'Property'
  property.qualifiers = [templateQualifier]

  const submodel = new aasTypes.Submodel('urn:example:submodel')
  submodel.idShort = 'TemplateSubmodel'
  submodel.kind = aasTypes.ModellingKind.Template
  submodel.qualifiers = [templateQualifier]
  submodel.submodelElements = [property]
  return jsonization.toJsonable(submodel)
}

function mountDialog () {
  return mount(ConvertSubmodelToInstanceDialog, {
    props: {
      modelValue: true,
      submodel: {
        id: 'urn:example:submodel',
        idShort: 'TemplateSubmodel',
        path: 'https://example.test/submodels/template',
      },
    },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-card': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { template: '<button><slot /></button>' },
      },
    },
  })
}

describe('ConvertSubmodelToInstanceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchSm.mockResolvedValue(templateSubmodelJson())
    mocks.putSubmodel.mockResolvedValue(true)
    mocks.fetchAndDispatchSme.mockResolvedValue({})
  })

  it('updates the complete converted Submodel with one PUT', async () => {
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.fetchSm).toHaveBeenCalledWith('https://example.test/submodels/template')
    expect(mocks.putSubmodel).toHaveBeenCalledOnce()
    const [updatedSubmodel, suppressErrorMessage, aasId] = mocks.putSubmodel.mock.calls[0]
    expect(updatedSubmodel.kind).toBe(aasTypes.ModellingKind.Instance)
    expect(updatedSubmodel.qualifiers).toBeNull()
    expect(updatedSubmodel.submodelElements[0].qualifiers).toBeNull()
    expect(suppressErrorMessage).toBe(true)
    expect(aasId).toBe('urn:example:aas')
    expect(mocks.reloadTree).toHaveBeenCalledOnce()
    expect(mocks.fetchAndDispatchSme).toHaveBeenCalledWith(
      'https://example.test/submodels/template/submodel-elements/Property',
      false,
      'inputVariables/0/value',
    )
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'success',
      text: 'Submodel converted to an instance. Removed 2 template qualifiers.',
    }))
    expect(wrapper.emitted('update:model-value')?.at(-1)).toEqual([false])
  })

  it('does not write when the latest Submodel is no longer a template', async () => {
    const instance = templateSubmodelJson() as Record<string, unknown>
    instance.kind = 'Instance'
    mocks.fetchSm.mockResolvedValue(instance)
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodel).not.toHaveBeenCalled()
    expect(mocks.reloadTree).toHaveBeenCalledOnce()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'info',
      text: expect.stringContaining('No changes were written.'),
    }))
    expect(wrapper.emitted('update:model-value')?.at(-1)).toEqual([false])
  })

  it('keeps the dialog open and reports repository details when the PUT fails', async () => {
    mocks.putSubmodel.mockResolvedValue(false)
    mocks.consumeFailureStatus.mockReturnValue(409)
    mocks.consumeFailureDetails.mockReturnValue('Concurrent update')
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodel).toHaveBeenCalledOnce()
    expect(mocks.reloadTree).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      baseError: 'Failed to convert Submodel to an instance.',
      extendedError: expect.stringContaining('Concurrent update'),
    }))
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })

  it.each([
    ['cannot be fetched', {}, 'could not be fetched'],
    ['cannot be deserialized', { modelType: 'Property' }, 'is invalid'],
  ])('does not write when the latest Submodel %s', async (_scenario, response, expectedMessage) => {
    mocks.fetchSm.mockResolvedValue(response)
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodel).not.toHaveBeenCalled()
    expect(mocks.reloadTree).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      extendedError: expect.stringContaining(expectedMessage),
    }))
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })
})
