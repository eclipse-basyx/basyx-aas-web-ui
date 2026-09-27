import { describe, expect, it } from 'vitest'
import { hasResourceAccessProfile, RESOURCE_ACCESS_PROFILE } from '@/utils/ResourceAccessProfile'

describe('ReBAC profile', () => {
  it('requires the exact profile in a profiles array', () => {
    expect(hasResourceAccessProfile({ profiles: [RESOURCE_ACCESS_PROFILE] })).toBe(true)
    for (const value of [undefined, null, {}, { profiles: [] }, { profiles: RESOURCE_ACCESS_PROFILE }, { profiles: [`${RESOURCE_ACCESS_PROFILE}/`] }]) {
      expect(hasResourceAccessProfile(value)).toBe(false)
    }
  })
})
