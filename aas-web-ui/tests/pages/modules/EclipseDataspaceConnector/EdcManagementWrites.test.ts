import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useEdcManagementWrites } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcManagementWrites'

const mocks = vi.hoisted(() => ({
  fetchStatus: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ fetchStatus: mocks.fetchStatus }),
}))

describe('useEdcManagementWrites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows writes when the BFF status allows them', async () => {
    mocks.fetchStatus.mockResolvedValue({ managementWritesAllowed: true })

    const { managementWritesAllowed } = useEdcManagementWrites('default')
    expect(managementWritesAllowed.value).toBe(false)
    await flushPromises()

    expect(mocks.fetchStatus).toHaveBeenCalledWith('default')
    expect(managementWritesAllowed.value).toBe(true)
  })

  it.each([
    ['disabled writes', { managementWritesAllowed: false }],
    ['a BFF without the status field', {}],
    ['a failed status request', null],
  ])('denies writes for %s', async (_, status) => {
    mocks.fetchStatus.mockResolvedValue(status)

    const { managementWritesAllowed } = useEdcManagementWrites('default')
    await flushPromises()

    expect(managementWritesAllowed.value).toBe(false)
  })

  it('follows the selected proxy and ignores the status of the previous one', async () => {
    let resolveFirstStatus: (status: unknown) => void = () => {}
    mocks.fetchStatus
      .mockReturnValueOnce(new Promise(resolve => (resolveFirstStatus = resolve)))
      .mockResolvedValueOnce({ managementWritesAllowed: false })
    const proxyId = ref('writable')

    const { managementWritesAllowed } = useEdcManagementWrites(proxyId)
    proxyId.value = 'read-only'
    await flushPromises()
    resolveFirstStatus({ managementWritesAllowed: true })
    await flushPromises()

    expect(mocks.fetchStatus).toHaveBeenNthCalledWith(2, 'read-only')
    expect(managementWritesAllowed.value).toBe(false)
  })
})
