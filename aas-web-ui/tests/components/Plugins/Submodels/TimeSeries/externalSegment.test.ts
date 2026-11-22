import { describe, expect, it } from 'vitest'
import { findExternalSegmentData } from '@/components/Plugins/Submodels/TimeSeries/externalSegment'

function semanticId (value: string) {
  return { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value }] }
}

describe('findExternalSegmentData', () => {
  it('finds the File element defined by IDTA 02008-1-1', () => {
    const file = { idShort: 'File', modelType: 'File', value: '/profile.csv', semanticId: semanticId('https://admin-shell.io/idta/TimeSeries/File/1/1') }
    const segment = { value: [{ idShort: 'RecordCount', modelType: 'Property', value: '2' }, file] }

    expect(findExternalSegmentData(segment)).toBe(file)
  })

  it('finds a File by its semanticId when it has another idShort', () => {
    const file = { idShort: 'ProfileCsv', modelType: 'File', value: '/profile.csv', semanticId: semanticId('https://admin-shell.io/idta/TimeSeries/File/1/1') }

    expect(findExternalSegmentData({ value: [file] })).toBe(file)
  })

  it('keeps supporting the Data idShort of earlier BaSyx examples', () => {
    const data = { idShort: 'Data', modelType: 'File', value: '/aasx/files/data.csv' }

    expect(findExternalSegmentData({ value: [data] })).toBe(data)
  })

  it('prefers the element that has a value when File and Blob are both present', () => {
    const file = { idShort: 'File', modelType: 'File', value: '' }
    const blob = { idShort: 'Blob', modelType: 'Blob', value: '/profile.csv' }

    expect(findExternalSegmentData({ value: [file, blob] })).toBe(blob)
  })

  it('ignores elements that are neither File nor Blob', () => {
    expect(findExternalSegmentData({ value: [{ idShort: 'File', modelType: 'Property', value: 'x' }] })).toBeUndefined()
    expect(findExternalSegmentData(null)).toBeUndefined()
  })
})
