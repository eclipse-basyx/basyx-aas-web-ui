import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAbacClient } from './useAbacClient'

const requests = vi.hoisted(() => ({ getRequest: vi.fn(), putRequest: vi.fn(), patchRequest: vi.fn(), postRequest: vi.fn() }))
vi.mock('@/composables/RequestHandling', () => ({ useRequestHandling: () => requests }))
vi.mock('../stores/useAbacConfigStore', () => ({ useAbacConfigStore: () => ({ apiUrl: 'https://example.test/security/abac' }) }))

beforeEach(() => {
  vi.clearAllMocks()
  requests.getRequest.mockResolvedValue({ success: true, data: [], status: 200 })
  requests.putRequest.mockResolvedValue({ success: true, data: { version_id: 7 }, status: 200 })
  requests.patchRequest.mockResolvedValue({ success: true, data: { version_id: 7 }, status: 200 })
  requests.postRequest.mockResolvedValue({ success: true, data: { version_id: 7 }, status: 200 })
})

describe('ABAC rule request contract', () => {
  it.each([
    { options: undefined, expected: true },
    { options: {}, expected: true },
    { options: { suppressMessages: false }, expected: false },
  ])('uses message suppression=$expected for options $options', async ({ options, expected }) => {
    const client = useAbacClient(options)
    await client.getPolicyVersions()
    await client.createRule({ versionId: '7', payload: { rule: { USEACL: 'reader' } } })
    expect(requests.getRequest.mock.calls[0]![2]).toBe(expected)
    expect(requests.postRequest.mock.calls[0]![4]).toBe(expected)
  })

  it('retains the backend creation envelope and requested position', async () => {
    const payload = { position: 3, rule: { USEACL: 'reader' } }
    await useAbacClient().createRule({ versionId: '7', payload })
    expect(JSON.parse(requests.postRequest.mock.calls[0]![1])).toEqual(payload)
  })

  it.each([false, true])('retains direct PUT/PATCH bodies with message suppression=%s', async suppressMessages => {
    const client = useAbacClient({ suppressMessages })
    const replacement = { USEACL: 'reader', USEFORMULA: 'allowed', OBJECTS: [] }
    const patch = { ACL: { USEATTRIBUTES: null } }
    await client.replaceRule({ versionId: '7', ruleIndex: 2, payload: replacement })
    await client.patchRule({ versionId: '7', ruleIndex: 2, payload: patch })
    for (const [request, expected] of [[requests.putRequest, replacement], [requests.patchRequest, patch]] as const) {
      const args = request.mock.calls[0]!
      expect(args[0]).toMatch(/\/7\/rules\/2$/)
      expect(JSON.parse(args[1])).toEqual(expected)
      expect(args[2].get('Content-Type')).toBe('application/json')
      expect(args[4]).toBe(suppressMessages)
    }
  })

  it('propagates request failures without turning them into successful updates', async () => {
    requests.patchRequest.mockResolvedValue({ success: false, status: 400, data: { text: 'ABACPOLICY-RULE-DECODE invalid rule' } })
    await expect(useAbacClient().patchRule({ versionId: '7', ruleIndex: 2, payload: {} }))
      .rejects
      .toThrow('ABACPOLICY-RULE-DECODE')
  })
})
