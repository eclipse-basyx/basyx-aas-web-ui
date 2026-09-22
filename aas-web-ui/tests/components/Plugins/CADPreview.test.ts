import type * as Three from 'three'
import { flushPromises, mount } from '@vue/test-utils'
import { BufferGeometry, Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CADPreview from '@/components/Plugins/CADPreview.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  showLoginRequiredSnackbar: vi.fn(),
  setAuthenticationStatusForInfrastructure: vi.fn(),
}))

vi.mock('three', async importOriginal => ({
  ...await importOriginal<typeof Three>(),
  WebGLRenderer: class {
    domElement = document.createElement('canvas')
    shadowMap = {}
    setSize () {}
  },
}))
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    update () {}
  },
}))
vi.mock('three/examples/jsm/effects/OutlineEffect.js', () => ({
  OutlineEffect: class {
    render () {}
  },
}))
vi.mock('three/examples/jsm/helpers/ViewHelper.js', () => ({
  ViewHelper: class {
    render () {}
  },
}))
vi.mock('@/composables/AAS/SubmodelElements/File', () => ({
  useSMEFile: () => ({ valueUrl: () => ({ url: '/cad/attachment' }) }),
}))
vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getSelectedInfrastructure: {
      id: 'gateway',
      auth: { securityType: 'Custom Header', customHeader: { name: 'X-API-KEY', value: 'preview-key' } },
    },
    setAuthenticationStatusForInfrastructure: mocks.setAuthenticationStatusForInfrastructure,
  }),
}))
vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getAuthorizationPrefix: 'Bearer',
    getAuthorizationDescriptionEndpointExemption: false,
  }),
}))
vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ dispatchSnackbar: vi.fn() }),
}))
vi.mock('@/composables/Auth/useAuth', () => ({
  useAuth: () => ({ showLoginRequiredSnackbar: mocks.showLoginRequiredSnackbar }),
}))

const formats = [
  { format: 'STL', contentType: 'model/stl', loader: STLLoader, binary: true },
  { format: 'OBJ', contentType: 'application/obj', loader: OBJLoader, binary: false },
  { format: 'GLTF', contentType: 'model/gltf+json', loader: GLTFLoader, binary: true },
] as const

function mountPreview (contentType: string) {
  return mount(CADPreview, {
    props: { submodelElementData: { modelType: 'File', contentType } },
    global: {
      stubs: {
        'v-container': { template: '<div><slot /></div>' },
        'v-card': { template: '<div><slot /></div>' },
        'v-empty-state': { template: '<div>No available CAD visualization</div>' },
      },
    },
  })
}

describe('CADPreview attachment requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('ResizeObserver', class {
      observe () {}
    })
    vi.spyOn(STLLoader.prototype, 'parse').mockReturnValue(new BufferGeometry())
    vi.spyOn(OBJLoader.prototype, 'parse').mockReturnValue(new Group())
    vi.spyOn(GLTFLoader.prototype, 'parse').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each(formats)('sends custom authentication and preserves $format file contents', async ({ contentType, loader, binary }) => {
    const source = '{ "cad": "original bytes" }\n'
    mocks.fetch.mockResolvedValue(new Response(source, { headers: { 'Content-Type': contentType } }))

    const wrapper = mountPreview(contentType)
    await flushPromises()

    expect(mocks.fetch).toHaveBeenCalledOnce()
    expect(mocks.fetch.mock.calls[0][0]).toBe('/cad/attachment')
    expect(mocks.fetch.mock.calls[0][1].headers.get('X-API-KEY')).toBe('preview-key')
    expect(loader.prototype.parse).toHaveBeenCalledOnce()
    const parsedInput = vi.mocked(loader.prototype.parse).mock.calls[0][0]
    expect(binary ? new TextDecoder().decode(parsedInput as ArrayBuffer) : parsedInput).toBe(source)
    wrapper.unmount()
  })

  it.each(formats)('handles a $format HTTP 401 without parsing the error body', async ({ contentType, loader }) => {
    mocks.fetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    const wrapper = mountPreview(contentType)
    await flushPromises()

    expect(loader.prototype.parse).not.toHaveBeenCalled()
    expect(mocks.showLoginRequiredSnackbar).toHaveBeenCalledOnce()
    expect(mocks.setAuthenticationStatusForInfrastructure).toHaveBeenCalledWith('gateway', false)
    expect(wrapper.get('canvas').isVisible()).toBe(false)
    expect(wrapper.text()).toContain('No available CAD visualization')
    wrapper.unmount()
  })
})
