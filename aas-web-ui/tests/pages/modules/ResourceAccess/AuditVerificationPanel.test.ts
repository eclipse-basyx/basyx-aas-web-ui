import { mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import AuditVerificationPanel from '@/pages/modules/ResourceAccess/components/AuditVerificationPanel.vue'

const verifyAudit = vi.hoisted(() => vi.fn())
vi.mock('@/composables/Client/ResourceAccessClient', () => ({ useResourceAccessClient: () => ({ verifyAudit }) }))

function range (overrides: Record<string, unknown>) {
  return { ok: true, data: { valid: true, complete: false, checked: 1000, evidenceVerified: 1000, evidenceMissing: 0, ...overrides } }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  })
})

describe('AuditVerificationPanel', () => {
  beforeEach(() => {
    verifyAudit.mockReset()
  })

  it('verifies the trail range by range, continuing from the last head', async () => {
    verifyAudit
      .mockResolvedValueOnce(range({ lastId: 1000, headHash: 'a' }))
      .mockResolvedValueOnce(range({ complete: true, checked: 5, evidenceVerified: 5, lastId: 1005, headHash: 'b' }))
    const wrapper = mount(AuditVerificationPanel, { props: { component: 'AASRepo' }, global: { plugins: [createVuetify()] } })
    const vm = wrapper.vm as any
    vm.expectedHead = 'b'
    await vm.verify()
    expect(verifyAudit.mock.calls.map(call => call[1])).toEqual([
      { limit: 1000, expectedHead: 'b' },
      { limit: 1000, expectedHead: 'b', afterId: 1000, afterHash: 'a' },
    ])
    expect(vm.result).toMatchObject({ valid: true, complete: true, checked: 1005, evidenceVerified: 1005, lastId: 1005, headHash: 'b' })
  })

  it('starts after a checkpoint and stops at the first invalid range', async () => {
    verifyAudit.mockResolvedValueOnce(range({ valid: false, checked: 3, firstInvalidId: 12, reason: 'the event content does not match its hash' }))
    const wrapper = mount(AuditVerificationPanel, { props: { component: 'AASRepo' }, global: { plugins: [createVuetify()] } })
    const vm = wrapper.vm as any
    vm.checkpointId = 9
    vm.checkpointHash = ' c '
    await vm.verify()
    expect(verifyAudit).toHaveBeenCalledTimes(1)
    expect(verifyAudit.mock.calls[0]![1]).toMatchObject({ afterId: 9, afterHash: 'c' })
    expect(vm.result).toMatchObject({ valid: false, firstInvalidId: 12 })
  })
})
