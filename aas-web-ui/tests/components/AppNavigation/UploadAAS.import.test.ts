import { flushPromises, mount } from '@vue/test-utils'
import { NewPackaging } from 'aas-package3-typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import UploadAAS from '@/components/AppNavigation/UploadAAS.vue'
import { useAASXImport } from '@/composables/AAS/AASXImport'
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'

const state = vi.hoisted(() => ({
  template: 'full',
  aasRepoUrl: 'https://import.test/shells',
  dispatchSnackbar: vi.fn(),
  reload: vi.fn(),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getAASRepoURL () {
      return state.aasRepoUrl
    },
    getSubmodelRepoURL: 'https://import.test/submodels',
    getConceptDescriptionRepoURL: 'https://import.test/concept-descriptions',
    getBasyxComponents: {},
    get getSelectedInfrastructure () {
      return {
        id: 'test',
        template: state.template,
        auth: { securityType: 'No Authentication' },
        components: { AASRepo: { url: state.aasRepoUrl } },
      }
    },
  }),
}))
vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
    dispatchSnackbar: state.dispatchSnackbar,
    dispatchTriggerAASListReload: state.reload,
  }),
}))
vi.mock('@/store/EnvironmentStore', () => ({ useEnvStore: () => ({}) }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => ({ getSelectedAAS: {} }) }))
vi.mock('@/composables/Auth/useAuth', () => ({ useAuth: () => ({ showLoginRequiredSnackbar: vi.fn() }) }))
vi.mock('@/composables/AAS/SubmodelElements/File', () => ({ useSMEFile: () => ({ determineContentType: vi.fn() }) }))
vi.mock('@/composables/AAS/SMHandling', () => ({ useSMHandling: () => ({}) }))
vi.mock('@/composables/Client/AASRegistryClient', () => ({ useAASRegistryClient: () => ({}) }))
vi.mock('@/composables/Client/SMRegistryClient', () => ({ useSMRegistryClient: () => ({}) }))
vi.mock('@/composables/Client/AASDiscoveryClient', () => ({ useAASDiscoveryClient: () => ({}) }))

const environment = {
  assetAdministrationShells: [{
    modelType: 'AssetAdministrationShell',
    id: 'urn:test:aas',
    assetInformation: { assetKind: 'Instance' },
  }],
  submodels: [{ modelType: 'Submodel', id: 'urn:test:sm' }],
  conceptDescriptions: [{ modelType: 'ConceptDescription', id: 'urn:test:cd' }],
}

function environmentFile (name = 'environment.json'): File {
  return { name, text: async () => JSON.stringify(environment) } as File
}

function errorResponse (status: number): Response {
  return Response.json([{
    code: status,
    messageType: 'Error',
    text: status === 409 ? 'Duplicate element id detected' : 'The repository rejected this object',
  }], { status, headers: { 'Content-Type': 'application/json' } })
}

function simulateRepository (postStatus = 409, putStatus = 204) {
  const fetch = vi.fn(async (_url: string, options?: RequestInit) => {
    if (options?.method === 'POST') {
      return postStatus >= 400 ? errorResponse(postStatus) : new Response(null, { status: postStatus })
    }
    if (options?.method === 'PUT') {
      return putStatus >= 400 ? errorResponse(putStatus) : new Response(null, { status: putStatus })
    }
    return Response.json(environment.conceptDescriptions[0], { headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const Dialog = defineComponent({
  props: ['modelValue'],
  template: '<section v-if="modelValue" role="dialog"><slot /></section>',
})
const FileInput = defineComponent({ name: 'FileInput', props: ['modelValue'], emits: ['update:modelValue'], template: '<div />' })
const Button = defineComponent({
  props: ['text', 'disabled'],
  template: '<button :disabled="disabled">{{ text }}<slot /></button>',
})
const Slot = defineComponent({ props: ['title'], template: '<div>{{ title }}<slot /></div>' })
const wrappers: ReturnType<typeof mount>[] = []

async function uploadFiles (files = [environmentFile()]) {
  const wrapper = mount(UploadAAS, {
    props: { modelValue: false },
    global: {
      stubs: {
        VDialog: Dialog,
        VFileUpload: FileInput,
        VBtn: Button,
        VCard: Slot,
        VCardText: Slot,
        VCardTitle: Slot,
        VCardActions: Slot,
        VSheet: Slot,
        VAlert: Slot,
        VLabel: Slot,
        VRadioGroup: Slot,
        VRadio: true,
        VCheckbox: true,
        VProgressLinear: true,
        VDivider: true,
        VSpacer: true,
      },
    },
  })
  wrappers.push(wrapper)
  await wrapper.setProps({ modelValue: true })
  wrapper.findComponent(FileInput).vm.$emit('update:modelValue', files)
  await flushPromises()
  await wrapper.findAll('button').find(button => button.text() === 'Upload')!.trigger('click')
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  state.template = 'full'
  state.aasRepoUrl = 'https://import.test/shells'
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) {
    wrapper.unmount()
  }
  vi.unstubAllGlobals()
})

describe('client import outcomes through repository HTTP responses', () => {
  it('reports fresh objects as created', async () => {
    const fetch = simulateRepository(201)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes.map(({ action }) => action)).toEqual(['created', 'created', 'created'])
    expect(result.warnings).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('keeps duplicate CDs and updates duplicate shells and submodels only after conflicts', async () => {
    const fetch = simulateRepository()
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes).toEqual([
      expect.objectContaining({ kind: 'Concept Description', action: 'skipped', id: 'urn:test:cd' }),
      expect.objectContaining({ kind: 'Submodel', action: 'updated', id: 'urn:test:sm' }),
      expect.objectContaining({ kind: 'AAS', action: 'updated', id: 'urn:test:aas' }),
    ])
    expect(result.importedAasIds).toEqual(['urn:test:aas'])
    expect(fetch.mock.calls.map(([, options]) => options?.method)).toEqual(['POST', 'POST', 'PUT', 'POST', 'PUT'])
    expect(state.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it.each([
    ['full', 201, 'created'],
    ['full', 409, 'updated'],
    ['identifiable', 201, 'written'],
    ['identifiable', 409, 'written'],
  ] as const)('retains padded submodel IDs for descriptor sync with %s and POST %s', async (template, status, action) => {
    state.template = template
    const fetch = simulateRepository(status)
    const id = '  urn:test:sm  '
    const payload = {
      ...environment,
      assetAdministrationShells: [{
        ...environment.assetAdministrationShells[0],
        submodels: [{ type: 'ModelReference', keys: [{ type: 'Submodel', value: id.trim() }] }],
      }, { ...environment.assetAdministrationShells[0], id: 'urn:test:unrelated' }],
      submodels: [{ ...environment.submodels[0], id }],
    }
    const file = { name: 'padded.json', text: async () => JSON.stringify(payload) } as File
    const result = await useAASXImport().importEnvironmentFileClient(file)
    expect(result.importedSubmodels).toEqual([{ modelType: 'Submodel', id }])
    expect(result.outcomes.find(outcome => outcome.kind === 'Submodel')).toMatchObject({ id, action })
    const write = fetch.mock.calls.find(([url]) => template === 'identifiable'
      ? url.includes('/submodels/')
      : url.endsWith('/submodels'))
    expect(JSON.parse(write![1]!.body as string)).toMatchObject({ id })
    if (template === 'identifiable') {
      expect(write![0]).toBe('https://import.test/shells/dXJuOnRlc3Q6YWFz/submodels/dXJuOnRlc3Q6c20')
    }
  })

  it.each(['xml', 'aasx'] as const)('reports duplicates consistently for %s imports', async format => {
    simulateRepository()
    const importer = useAASXImport()
    let result
    if (format === 'xml') {
      const xml = `<environment xmlns="https://admin-shell.io/aas/3/0">
        <assetAdministrationShells><assetAdministrationShell><id>urn:test:aas</id>
          <assetInformation><assetKind>Instance</assetKind></assetInformation>
        </assetAdministrationShell></assetAdministrationShells>
        <submodels><submodel><id>urn:test:sm</id></submodel></submodels>
        <conceptDescriptions><conceptDescription><id>urn:test:cd</id></conceptDescription></conceptDescriptions>
      </environment>`
      result = await importer.importEnvironmentFileClient({ name: 'environment.xml', text: async () => xml } as File)
    } else {
      let bytes: Uint8Array = new Uint8Array()
      const pkg = await NewPackaging().CreateInStream({
        readAll: () => bytes.slice(),
        writeAll: data => {
          bytes = data.slice()
        },
      })
      const spec = await pkg.PutPart(new URL('https://package.local/aasx/environment.json'),
        'application/json', new TextEncoder().encode(JSON.stringify(environment)))
      await pkg.MakeSpec(spec)
      const packageBytes = await pkg.Flush()
      pkg.Close()
      result = await importer.importAasxFileClient({
        name: 'environment.aasx', arrayBuffer: async () => Uint8Array.from(packageBytes).buffer,
      } as File)
    }
    expect(result.outcomes.map(({ action }) => action)).toEqual(['skipped', 'updated', 'updated'])
  })

  it.each([400, 401, 403, 404, 500, 503])('never updates or accepts an existing object after HTTP %s', async status => {
    const fetch = simulateRepository(status)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes).toHaveLength(3)
    for (const outcome of result.outcomes) {
      expect(outcome).toMatchObject({ action: 'failed', details: expect.stringContaining(`HTTP ${status}`) })
      expect(outcome.details).toContain('The repository rejected this object')
    }
    expect(result.importedAasIds).toEqual([])
    expect(result.importedAas).toEqual([])
    expect(result.importedSubmodels).toEqual([])
    expect(result.importedConceptDescriptions).toEqual([])
    expect(fetch.mock.calls.every(([, options]) => options?.method === 'POST')).toBe(true)
  })

  it('reports failed conflict updates with their final status and details', async () => {
    simulateRepository(409, 500)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes.map(({ action }) => action)).toEqual(['skipped', 'failed', 'failed'])
    expect(result.outcomes[2]?.details).toContain('HTTP 500')
    expect(result.outcomes[2]?.details).toContain('The repository rejected this object')
    expect(result.importedAasIds).toEqual([])
  })

  it('does not turn network failures into updates', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Network unavailable'))
    vi.stubGlobal('fetch', fetch)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes.every(outcome => outcome.action === 'failed' && outcome.details?.includes('Network unavailable'))).toBe(true)
    expect(fetch.mock.calls.every(([, options]) => options.method === 'POST')).toBe(true)
  })

  it('does not reuse a previous conflict after an endpoint becomes unavailable', async () => {
    const fetch = simulateRepository()
    const importer = useAASXImport()
    await importer.importEnvironmentFileClient(environmentFile())
    fetch.mockClear()
    state.aasRepoUrl = ''
    const result = await importer.importEnvironmentFileClient(environmentFile())
    expect(result.outcomes.find(outcome => outcome.kind === 'AAS')?.action).toBe('failed')
    expect(fetch.mock.calls.some(([url]) => url.includes('/shells'))).toBe(false)
  })

  it('reports superpath writes without claiming that they created new submodels', async () => {
    state.template = 'identifiable'
    const fetch = simulateRepository(201)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes.map(({ kind, action }) => ({ kind, action }))).toEqual([
      { kind: 'AAS', action: 'created' },
      { kind: 'Submodel', action: 'written' },
    ])
    expect(fetch.mock.calls.map(([, options]) => options?.method)).toEqual(['POST', 'PUT'])
  })

  it('does not treat a superpath PUT conflict as a skipped duplicate', async () => {
    state.template = 'identifiable'
    simulateRepository(201, 409)
    const result = await useAASXImport().importEnvironmentFileClient(environmentFile())
    expect(result.outcomes[1]).toMatchObject({ kind: 'Submodel', action: 'failed', details: expect.stringContaining('HTTP 409') })
  })

  it('preserves the CD client default of accepting an existing CD only after HTTP 409', async () => {
    const { types } = await import('@aas-core-works/aas-core3.1-typescript')
    const cd = new types.ConceptDescription('urn:test:cd')
    const fetch = simulateRepository()
    expect(await useCDRepositoryClient().postConceptDescription(cd)).toBe(true)
    expect(fetch.mock.calls.map(([, options]) => options?.method)).toEqual(['POST', 'GET'])
    fetch.mockClear()
    simulateRepository(500)
    expect(await useCDRepositoryClient().postConceptDescription(cd)).toBe(false)
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1)
  })
})

describe('upload report visible to the user', () => {
  it('shows one warning summary and a durable report for duplicate imports', async () => {
    simulateRepository()
    const wrapper = await uploadFiles()
    expect(state.dispatchSnackbar).toHaveBeenCalledOnce()
    expect(state.dispatchSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({
      color: 'warning',
      text: expect.stringContaining('Objects: 2 updated, 1 skipped.'),
      actionText: 'View report',
    }))
    expect(wrapper.get('[role="dialog"]').text()).toContain('Upload report')
    expect(wrapper.text()).toContain('SKIPPED: Concept Description \'urn:test:cd\'')
    expect(wrapper.text()).toContain('UPDATED: AAS \'urn:test:aas\'')
    expect(wrapper.text()).toContain('UPDATED: Submodel \'urn:test:sm\'')
    expect(wrapper.text()).toContain('existing object was kept')
    expect(state.reload).toHaveBeenCalledOnce()
  })

  it('keeps green success for new objects and allows reopening the report', async () => {
    simulateRepository(201)
    const wrapper = await uploadFiles()
    expect(state.dispatchSnackbar).toHaveBeenCalledOnce()
    const snackbar = state.dispatchSnackbar.mock.calls[0]![0]
    expect(snackbar).toMatchObject({ color: 'success', text: expect.stringContaining('Objects: 3 created.') })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    snackbar.actionCallback()
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').text()).toContain('CREATED: AAS \'urn:test:aas\'')
  })

  it('shows errors and preserves every file and object detail across a batch', async () => {
    simulateRepository(500)
    const wrapper = await uploadFiles([environmentFile('first.json'), environmentFile('second.json')])
    expect(state.dispatchSnackbar).toHaveBeenCalledOnce()
    expect(state.dispatchSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({
      color: 'error', text: expect.stringContaining('Uploaded 0/2 file(s). 2 failed.'),
    }))
    expect(wrapper.text()).toContain('first.json')
    expect(wrapper.text()).toContain('second.json')
    expect(wrapper.text()).toContain('HTTP 500')
    expect(wrapper.text()).toContain('The repository rejected this object')
    expect(state.reload).not.toHaveBeenCalled()
  })

  it('includes all wrapped BaSyx Go REST messages in the client import report', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ messages: [{
      code: '500', messageType: 'Error', text: 'SMREPO-NEWSM-CREATE-FAILED',
      correlationId: 'SMREPO-500-PostSubmodel-InternalServerError', timestamp: '2026-11-11T16:29:44Z',
    }, { code: '500', messageType: 'Error', text: 'Storage is unavailable' }] }, { status: 500 })))
    const wrapper = await uploadFiles()
    expect(wrapper.text()).toContain('SMREPO-NEWSM-CREATE-FAILED')
    expect(wrapper.text()).toContain('Storage is unavailable')
    expect(wrapper.text()).toContain('SMREPO-500-PostSubmodel-InternalServerError')
    expect(wrapper.text()).toContain('HTTP 500')
  })

  it('includes the REST answer in server upload failures too', async () => {
    state.template = 'mono-repo'
    const fetch = vi.fn(async () => Response.json({ messages: [{
      code: '409', messageType: 'Error', text: 'AASENV-UPLOAD-CONFLICT',
      correlationId: 'AASENV-409-UploadEnvironment-Conflict',
    }] }, { status: 409 }))
    vi.stubGlobal('fetch', fetch)
    const wrapper = await uploadFiles([new File(['test'], 'environment.aasx')])
    expect(fetch).toHaveBeenCalledWith('https://import.test/upload?ignore-duplicates=true', expect.objectContaining({ method: 'POST' }))
    expect(wrapper.text()).toContain('AASENV-UPLOAD-CONFLICT')
    expect(wrapper.text()).toContain('AASENV-409-UploadEnvironment-Conflict')
    expect(wrapper.text()).toContain('HTTP 409')
  })

  it('reports a partial file as failed while reloading shells that were imported', async () => {
    const fetch = simulateRepository(201)
    fetch.mockResolvedValueOnce(errorResponse(500))
    const wrapper = await uploadFiles()
    expect(state.dispatchSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({
      color: 'error', text: expect.stringContaining('Uploaded 0/1 file(s). 1 failed.'),
    }))
    expect(wrapper.text()).toContain('FAILED: Concept Description \'urn:test:cd\'')
    expect(wrapper.text()).toContain('CREATED: AAS \'urn:test:aas\'')
    expect(state.reload).toHaveBeenCalledOnce()
  })
})
