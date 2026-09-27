import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmodelCreationGuard } from '@/composables/AAS/SubmodelCreationGuard'

const state = vi.hoisted(() => ({
  enabled: true,
  route: { name: 'AASEditor' },
  aas: { id: 'urn:aas' },
  infrastructure: { id: 'infra' },
  repository: 'https://example.test/shells',
  capability: vi.fn(),
  snackbar: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRoute: () => state.route }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => ({ get getSelectedAAS () {
  return state.aas
} }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({ supportsResourceAccess: () => state.enabled,
  get getSelectedInfrastructure () {
    return state.infrastructure
  },
  get getAASRepoURL () {
    return state.repository
  },
}) }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: state.snackbar }) }))
vi.mock('@/composables/Client/AASRepositoryClient', () => ({ useAASRepositoryClient: () => ({ fetchAasUpdateCapability: state.capability }) }))

describe('Submodel creation guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.enabled = true
    state.route.name = 'AASEditor'
    state.aas = { id: 'urn:aas' }
    state.infrastructure = { id: 'infra' }
    state.repository = 'https://example.test/shells'
    state.capability.mockResolvedValue(true)
  })

  it('skips ReBAC capability requests without the profile', async () => {
    state.enabled = false
    expect(await useSubmodelCreationGuard().canCreateSubmodel()).toBe(true)
    expect(state.capability).not.toHaveBeenCalled()
    expect(state.snackbar).not.toHaveBeenCalled()
  })

  it('checks each attempt afresh before allowing creation', async () => {
    const { canCreateSubmodel } = useSubmodelCreationGuard()
    expect(await canCreateSubmodel()).toBe(true)
    state.capability.mockResolvedValue(false)
    expect(await canCreateSubmodel()).toBe(false)
    expect(state.capability).toHaveBeenCalledTimes(2)
    expect(state.capability).toHaveBeenCalledWith('urn:aas')
    expect(state.snackbar).toHaveBeenCalledWith(expect.objectContaining({ color: 'warning', text: expect.stringContaining('Ask the owner') }))
  })

  it('exposes the pending check and prevents duplicate requests', async () => {
    let resolve!: (value: boolean) => void
    state.capability.mockReturnValueOnce(new Promise<boolean>(done => {
      resolve = done
    }))
    const { canCreateSubmodel, checkingAccess } = useSubmodelCreationGuard()
    const pending = canCreateSubmodel()
    expect(checkingAccess.value).toBe(true)
    expect(await canCreateSubmodel()).toBe(false)
    expect(state.capability).toHaveBeenCalledTimes(1)
    resolve(true)
    expect(await pending).toBe(true)
    expect(checkingAccess.value).toBe(false)
  })

  it('blocks an unavailable capability with a generic message', async () => {
    state.capability.mockResolvedValue(undefined)
    expect(await useSubmodelCreationGuard().canCreateSubmodel()).toBe(false)
    expect(state.snackbar).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('No submodel was created') }))
  })

  it('blocks missing AAS selection without a request', async () => {
    state.aas = { id: '' }
    expect(await useSubmodelCreationGuard().canCreateSubmodel()).toBe(false)
    expect(state.capability).not.toHaveBeenCalled()
  })

  it('leaves standalone submodel editing unchanged', async () => {
    state.route.name = 'SMEditor'
    expect(await useSubmodelCreationGuard().canCreateSubmodel()).toBe(true)
    expect(state.capability).not.toHaveBeenCalled()
    expect(state.snackbar).not.toHaveBeenCalled()
  })

  it.each(['aas', 'infrastructure', 'repository', 'route'])('rejects stale results after changing %s', async field => {
    state.capability.mockImplementationOnce(async () => {
      if (field === 'aas') {
        state.aas = { id: 'urn:other' }
      }
      if (field === 'infrastructure') {
        state.infrastructure = { id: 'other' }
      }
      if (field === 'repository') {
        state.repository = 'https://other.test/shells'
      }
      if (field === 'route') {
        state.route.name = 'SMEditor'
      }
      return true
    })
    expect(await useSubmodelCreationGuard().canCreateSubmodel()).toBe(false)
    expect(state.snackbar).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('selection changed') }))
  })
})
