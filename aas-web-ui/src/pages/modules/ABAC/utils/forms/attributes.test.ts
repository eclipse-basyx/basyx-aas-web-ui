import { describe, expect, it } from 'vitest'
import { decodeAttributeSource, decodeAttributeSources, encodeAttributeSource } from './attributes'

describe('attribute source codec', () => {
  it.each([{ CLAIM: 'role' }, { GLOBAL: 'UTCNOW' }, { REFERENCE: '$sm#idShort' }])('round-trips a supported attribute source: %j', attributeSource => {
    const formState = decodeAttributeSource(attributeSource)
    expect(formState).toBeDefined()
    expect(encodeAttributeSource(formState!)).toEqual(attributeSource)
  })

  it.each([null, [], {}, { UNKNOWN: 'role' }, { GLOBAL: 'OTHER' }, { CLAIM: 42 }, { CLAIM: 'role', extra: true }])('rejects an unsupported attribute source: %j', attributeSource => {
    expect(decodeAttributeSource(attributeSource)).toBeUndefined()
  })

  it('rejects an entire attribute list when any entry cannot be represented', () => {
    expect(decodeAttributeSources([{ CLAIM: 'role' }, { UNKNOWN: 'other' }])).toBeUndefined()
    expect(decodeAttributeSources([])).toEqual([])
  })
})
