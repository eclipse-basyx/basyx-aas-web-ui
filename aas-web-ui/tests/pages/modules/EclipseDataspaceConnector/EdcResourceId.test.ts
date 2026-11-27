import { describe, expect, it } from 'vitest'
import { isSameEdcResource } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceId'

describe('isSameEdcResource', () => {
  it('returns true for resources with the same @id', () => {
    expect(isSameEdcResource({ '@id': 'asset-1' }, { '@id': 'asset-1', 'properties': {} })).toBe(true)
  })

  it('returns false for resources with different @ids', () => {
    expect(isSameEdcResource({ '@id': 'asset-1' }, { '@id': 'asset-2' })).toBe(false)
  })

  it.each([
    ['an empty resource', {}, { '@id': 'asset-1' }],
    ['an empty other resource', { '@id': 'asset-1' }, {}],
    ['two empty resources', {}, {}],
    ['an empty @id on both', { '@id': '' }, { '@id': '' }],
    ['no resource', null, { '@id': 'asset-1' }],
    ['no other resource', { '@id': 'asset-1' }, undefined],
  ])('returns false for %s', (_case, resource, other) => {
    expect(isSameEdcResource(resource, other)).toBe(false)
  })
})
