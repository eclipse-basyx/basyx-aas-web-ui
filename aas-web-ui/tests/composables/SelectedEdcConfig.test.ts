import { describe, expect, it, vi } from 'vitest'
import { useSelectedEdcConfig } from '@/composables/SelectedEdcConfig'

const mockState = vi.hoisted(() => ({
  selectedInfrastructure: null as any,
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getSelectedInfrastructure () {
      return mockState.selectedInfrastructure
    },
  }),
}))

function withEdcConfig (edc: unknown) {
  mockState.selectedInfrastructure = { id: 'infra-1', catenaX: { edc } }
  return useSelectedEdcConfig()
}

describe('useSelectedEdcConfig', () => {
  it('returns the EDC configuration and the trimmed proxy ID of the selected infrastructure', () => {
    const edc = { proxyId: ' supplier ' }
    const { selectedEdcConfig, edcProxyId } = withEdcConfig(edc)

    expect(selectedEdcConfig.value).toBe(edc)
    expect(edcProxyId.value).toBe('supplier')
  })

  it.each([
    ['no proxy ID', {}],
    ['an empty proxy ID', { proxyId: '' }],
    ['a blank proxy ID', { proxyId: ' '.repeat(3) }],
  ])('uses the default proxy for %s', (_case, edc) => {
    expect(withEdcConfig(edc).edcProxyId.value).toBe('default')
  })

  it('uses the default proxy without a selected infrastructure', () => {
    mockState.selectedInfrastructure = null
    const { selectedEdcConfig, edcProxyId } = useSelectedEdcConfig()

    expect(selectedEdcConfig.value).toBeNull()
    expect(edcProxyId.value).toBe('default')
  })
})
