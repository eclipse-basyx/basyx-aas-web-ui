import { describe, expect, it } from 'vitest'
import { resolveCadFormat } from '@/utils/AAS/CadFormat'

describe('resolveCadFormat', () => {
  it.each([
    ['model/stl', 'stl'],
    ['application/sla', 'stl'],
    ['application/obj', 'obj'],
    ['text/obj', 'obj'],
    ['model/gltf+json', 'gltf'],
    ['model/gltf-binary', 'gltf'],
    ['Model/GLTF-Binary; charset=binary', 'gltf'],
  ])('maps content type %s to %s', (contentType, expected) => {
    expect(resolveCadFormat({ contentType })).toBe(expected)
  })

  it.each([
    ['/aasx/files/robot.glb', 'gltf'],
    ['/aasx/files/robot.gltf?download=1', 'gltf'],
    ['https://example.com/part.STL#v2', 'stl'],
    ['/files/part.obj', 'obj'],
  ])('falls back to the extension of %s', (value, expected) => {
    expect(resolveCadFormat({ contentType: 'application/octet-stream', value })).toBe(expected)
  })

  it('prefers the file name over the value path', () => {
    expect(resolveCadFormat({ contentType: '', fileName: 'model.glb', value: '/files/blob' })).toBe('gltf')
  })

  it.each([
    [{ contentType: 'application/pdf', value: '/files/doc.pdf' }],
    [{ contentType: 'image/png' }],
    [{}],
    [undefined],
  ])('returns null for unsupported input %j', file => {
    expect(resolveCadFormat(file)).toBeNull()
  })
})
