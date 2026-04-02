import { describe, expect, it, vi } from 'vitest'
import { upsertDescriptor } from '@/composables/DescriptorSync'

describe('DescriptorSync.ts', () => {
  it('uses POST first for create and skips PUT when POST succeeds', async () => {
    const callOrder: string[] = []
    const postAction = vi.fn(async () => {
      callOrder.push('post')
      return true
    })
    const putAction = vi.fn(async () => {
      callOrder.push('put')
      return true
    })

    const success = await upsertDescriptor(true, postAction, putAction)

    expect(success).toBe(true)
    expect(postAction).toHaveBeenCalledTimes(1)
    expect(putAction).not.toHaveBeenCalled()
    expect(callOrder).toEqual(['post'])
  })

  it('falls back to PUT for create when POST fails', async () => {
    const callOrder: string[] = []
    const postAction = vi.fn(async () => {
      callOrder.push('post')
      return false
    })
    const putAction = vi.fn(async () => {
      callOrder.push('put')
      return true
    })

    const success = await upsertDescriptor(true, postAction, putAction)

    expect(success).toBe(true)
    expect(postAction).toHaveBeenCalledTimes(1)
    expect(putAction).toHaveBeenCalledTimes(1)
    expect(callOrder).toEqual(['post', 'put'])
  })

  it('uses PUT first for update and skips POST when PUT succeeds', async () => {
    const callOrder: string[] = []
    const postAction = vi.fn(async () => {
      callOrder.push('post')
      return true
    })
    const putAction = vi.fn(async () => {
      callOrder.push('put')
      return true
    })

    const success = await upsertDescriptor(false, postAction, putAction)

    expect(success).toBe(true)
    expect(putAction).toHaveBeenCalledTimes(1)
    expect(postAction).not.toHaveBeenCalled()
    expect(callOrder).toEqual(['put'])
  })

  it('falls back to POST for update when PUT fails', async () => {
    const callOrder: string[] = []
    const postAction = vi.fn(async () => {
      callOrder.push('post')
      return true
    })
    const putAction = vi.fn(async () => {
      callOrder.push('put')
      return false
    })

    const success = await upsertDescriptor(false, postAction, putAction)

    expect(success).toBe(true)
    expect(putAction).toHaveBeenCalledTimes(1)
    expect(postAction).toHaveBeenCalledTimes(1)
    expect(callOrder).toEqual(['put', 'post'])
  })

  it('returns false when both actions fail', async () => {
    const postAction = vi.fn(async () => false)
    const putAction = vi.fn(async () => false)

    const successCreate = await upsertDescriptor(true, postAction, putAction)
    const successUpdate = await upsertDescriptor(false, postAction, putAction)

    expect(successCreate).toBe(false)
    expect(successUpdate).toBe(false)
  })
})
