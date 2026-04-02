import { describe, expect, it } from 'vitest'
import { appendHttpStatusFailureReason, describeHttpStatusFailure } from '@/composables/HttpStatusMessages'

describe('HttpStatusMessages.ts', () => {
  it('describes common HTTP statuses with concrete user-facing reasons', () => {
    expect(describeHttpStatusFailure(401)).toContain('authentication is missing or expired')
    expect(describeHttpStatusFailure(403)).toContain('insufficient permissions')
    expect(describeHttpStatusFailure(404)).toContain('not found')
    expect(describeHttpStatusFailure(500)).toContain('internal error')
  })

  it('appends status reason to base message when status is available', () => {
    const message = appendHttpStatusFailureReason('Submodel was not created.', 403)
    expect(message).toContain('Submodel was not created.')
    expect(message).toContain('insufficient permissions')
  })

  it('keeps base message unchanged when status is unknown', () => {
    const message = appendHttpStatusFailureReason('Submodel was not created.', undefined)
    expect(message).toBe('Submodel was not created.')
  })
})
