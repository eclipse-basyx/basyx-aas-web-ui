import { describe, expect, it } from 'vitest'

import {
  appendOrMergeSortedAasById,
  compareAasById,
  mergeSortedAasById,
  withPinnedItem,
} from '@/composables/AAS/AASListAccumulation'

describe('AASListAccumulation.ts', () => {
  it('appends directly when incoming page starts after current tail', () => {
    const existingItems = [{ id: 'aas-001' }, { id: 'aas-002' }]
    const incomingItems = [{ id: 'aas-003' }, { id: 'aas-004' }]

    expect(appendOrMergeSortedAasById(existingItems, incomingItems)).toEqual([
      { id: 'aas-001' },
      { id: 'aas-002' },
      { id: 'aas-003' },
      { id: 'aas-004' },
    ])
  })

  it('falls back to merge when incoming page is out of order', () => {
    const existingItems = [{ id: 'aas-002' }, { id: 'aas-004' }]
    const incomingItems = [{ id: 'aas-001' }, { id: 'aas-003' }]

    expect(appendOrMergeSortedAasById(existingItems, incomingItems)).toEqual([
      { id: 'aas-001' },
      { id: 'aas-002' },
      { id: 'aas-003' },
      { id: 'aas-004' },
    ])
  })

  it('falls back on overlapping boundaries and keeps only one item per ID', () => {
    const existingItems = [{ id: 'aas-001' }, { id: 'aas-002' }]
    const incomingItems = [{ id: 'aas-002' }, { id: 'aas-003' }]

    expect(appendOrMergeSortedAasById(existingItems, incomingItems)).toEqual([
      { id: 'aas-001' },
      { id: 'aas-002' },
      { id: 'aas-003' },
    ])
  })

  it('compares IDs lexicographically', () => {
    expect(compareAasById({ id: 'aas-010' }, { id: 'aas-010' })).toBe(0)
    expect(compareAasById({ id: 'aas-009' }, { id: 'aas-010' })).toBeLessThan(0)
    expect(compareAasById({ id: 'aas-011' }, { id: 'aas-010' })).toBeGreaterThan(0)
  })

  it('merges two sorted arrays deterministically', () => {
    const existingItems = [{ id: 'aas-001' }, { id: 'aas-003' }]
    const incomingItems = [{ id: 'aas-002' }, { id: 'aas-004' }]

    expect(mergeSortedAasById(existingItems, incomingItems)).toEqual([
      { id: 'aas-001' },
      { id: 'aas-002' },
      { id: 'aas-003' },
      { id: 'aas-004' },
    ])
  })

  it('puts the pinned item first without its copy among the items', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

    expect(withPinnedItem(items, { id: 'b' })).toEqual([{ id: 'b' }, { id: 'a' }, { id: 'c' }])
    expect(withPinnedItem(items, { id: 'x' })).toEqual([{ id: 'x' }, ...items])
    expect(withPinnedItem(items, null)).toBe(items)
    expect(withPinnedItem(items, { id: '' })).toBe(items)
  })
})
