import { describe, expect, it } from 'vitest'
import { edcAssetName } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetName'

describe('edcAssetName', () => {
  it.each([
    ['the display name first', { displayName: 'Display', name: 'Name', description: 'Description' }, 'Display'],
    ['the name without a display name', { name: 'Name', description: 'Description' }, 'Name'],
    ['the description without a name', { description: 'Description' }, 'Description'],
    ['an empty string without any of them', {}, ''],
  ])('returns %s', (_case, properties, name) => {
    expect(edcAssetName({ '@id': 'asset-1', properties })).toBe(name)
  })

  it('returns an empty string without an asset', () => {
    expect(edcAssetName(null)).toBe('')
    expect(edcAssetName(undefined)).toBe('')
  })
})
