import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConvertSubmodelToInstanceDialog from '@/components/EditorComponents/ConvertSubmodelToInstanceDialog.vue'

const mocks = vi.hoisted(() => ({
  fetchSm: vi.fn(),
  putSubmodel: vi.fn(),
  putSubmodelAtPath: vi.fn(),
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
    putSubmodelAtPath: mocks.putSubmodelAtPath,
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
const dialogStub = {
  name: 'VDialog',
  props: ['persistent'],
  template: '<div><slot /></div>',
}
const sheetStub = {
  name: 'VSheet',
  props: {
    border: Boolean,
    rounded: String,
  },
  template: '<div><slot /></div>',
}
const cardTitleStub = {
  name: 'VCardTitle',
  template: '<div><slot /></div>',
}
const buttonStub = {
  name: 'VBtn',
  props: ['color', 'disabled', 'loading', 'rounded', 'text', 'variant'],
  template: '<button><slot />{{ text }}</button>',
}

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
        'v-dialog': dialogStub,
        'v-sheet': sheetStub,
        'v-card': slotStub,
        'v-card-title': cardTitleStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': buttonStub,
      },
    },
  })
}

describe('ConvertSubmodelToInstanceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchSm.mockResolvedValue(templateSubmodelJson())
    mocks.putSubmodel.mockResolvedValue(true)
    mocks.putSubmodelAtPath.mockResolvedValue(true)
    mocks.fetchAndDispatchSme.mockResolvedValue({ modelType: 'Property' })
    mocks.consumeFailureStatus.mockReturnValue(undefined)
    mocks.consumeFailureDetails.mockReturnValue(undefined)
  })

  it('uses the standard dialog surface, title, and button styling', () => {
    const wrapper = mountDialog()
    const sheet = wrapper.findComponent({ name: 'VSheet' })
    const buttons = wrapper.findAllComponents({ name: 'VBtn' })
    const cancelButton = buttons.find(button => button.text() === 'Cancel')
    const convertButton = buttons.find(button => button.text() === 'Convert to Instance')

    expect(sheet.props()).toEqual(expect.objectContaining({
      border: true,
      rounded: 'lg',
    }))
    expect(wrapper.findComponent({ name: 'VCardTitle' }).classes()).toContain('bg-cardHeader')
    expect(cancelButton?.props('rounded')).toBe('lg')
    expect(convertButton?.classes()).toContain('text-buttonText')
    expect(convertButton?.props()).toEqual(expect.objectContaining({
      color: 'primary',
      rounded: 'lg',
      variant: 'flat',
    }))
  })

  it('updates the complete converted Submodel with one PUT', async () => {
    const wrapper = mountDialog()

    await wrapper.findAll('button').find(button => button.text() === 'Convert to Instance')!.trigger('click')
    await flushPromises()

    expect(mocks.fetchSm).toHaveBeenCalledWith('https://example.test/submodels/template')
    expect(mocks.putSubmodel).not.toHaveBeenCalled()
    expect(mocks.putSubmodelAtPath).toHaveBeenCalledOnce()
    const [updatedSubmodel, endpoint, suppressErrorMessage] = mocks.putSubmodelAtPath.mock.calls[0]
    expect(updatedSubmodel.kind).toBe(aasTypes.ModellingKind.Instance)
    expect(updatedSubmodel.qualifiers).toBeNull()
    expect(updatedSubmodel.submodelElements[0].qualifiers).toBeNull()
    expect(endpoint).toBe('https://example.test/submodels/template')
    expect(suppressErrorMessage).toBe(true)
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
    expect(mocks.putSubmodelAtPath).not.toHaveBeenCalled()
    expect(mocks.reloadTree).toHaveBeenCalledOnce()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'info',
      text: expect.stringContaining('No changes were written.'),
    }))
    expect(wrapper.emitted('update:model-value')?.at(-1)).toEqual([false])
  })

  it('keeps the dialog open and reports repository details when the PUT fails', async () => {
    mocks.putSubmodelAtPath.mockResolvedValue(false)
    mocks.consumeFailureStatus.mockReturnValue(409)
    mocks.consumeFailureDetails.mockReturnValue('Concurrent update')
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodelAtPath).toHaveBeenCalledOnce()
    expect(mocks.reloadTree).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      baseError: 'Failed to convert Submodel to an instance.',
      extendedError: expect.stringContaining('Concurrent update'),
    }))
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })

  it('rejects synthetic failure Submodels instead of treating them as stale instances', async () => {
    mocks.fetchSm.mockResolvedValue({
      id: 'synthetic-error-id',
      idShort: 'Submodel Not Authorized!',
      modelType: 'Submodel',
      submodelElements: [],
    })
    mocks.consumeFailureStatus.mockReturnValue(403)
    mocks.consumeFailureDetails.mockReturnValue('Access denied')
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodelAtPath).not.toHaveBeenCalled()
    expect(mocks.reloadTree).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      baseError: 'Failed to convert Submodel to an instance.',
      extendedError: expect.stringContaining('Access denied'),
    }))
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })

  it('keeps the conversion target stable and prevents re-entry while loading', async () => {
    let resolveFetch!: (value: jsonization.JsonValue) => void
    mocks.fetchSm.mockReturnValueOnce(new Promise(resolve => {
      resolveFetch = resolve
    }))
    const wrapper = mountDialog()

    const firstConversion = (wrapper.vm as any).confirmConversion()
    await flushPromises()
    await wrapper.setProps({
      modelValue: false,
      submodel: {
        id: 'urn:example:other-submodel',
        idShort: 'OtherSubmodel',
        path: 'https://other.example/submodels/other',
      },
    })
    await wrapper.setProps({ modelValue: true })
    await (wrapper.vm as any).confirmConversion()

    expect(mocks.fetchSm).toHaveBeenCalledOnce()

    resolveFetch(templateSubmodelJson())
    await firstConversion
    await flushPromises()

    expect(mocks.putSubmodelAtPath).toHaveBeenCalledOnce()
    expect(mocks.putSubmodelAtPath).toHaveBeenCalledWith(
      expect.anything(),
      'https://example.test/submodels/template',
      true,
    )
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })

  it('makes the dialog persistent while the conversion is loading', async () => {
    let resolveFetch!: (value: jsonization.JsonValue) => void
    mocks.fetchSm.mockReturnValueOnce(new Promise(resolve => {
      resolveFetch = resolve
    }))
    const wrapper = mountDialog()

    const conversion = (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'VDialog' }).props('persistent')).toBe(true)

    resolveFetch(templateSubmodelJson())
    await conversion
  })

  it('reports a refresh warning when persistence succeeds but the selected node cannot be refreshed', async () => {
    mocks.fetchAndDispatchSme.mockResolvedValue({})
    const wrapper = mountDialog()

    await (wrapper.vm as any).confirmConversion()
    await flushPromises()

    expect(mocks.putSubmodelAtPath).toHaveBeenCalledOnce()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'warning',
      baseError: 'Submodel converted with refresh warning.',
    }))
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
    expect(mocks.putSubmodelAtPath).not.toHaveBeenCalled()
    expect(mocks.reloadTree).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error',
      extendedError: expect.stringContaining(expectedMessage),
    }))
    expect((wrapper.vm as any).conversionDialog).toBe(true)
  })
})
