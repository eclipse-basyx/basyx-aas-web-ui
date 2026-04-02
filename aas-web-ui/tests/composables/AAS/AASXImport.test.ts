import type { Part } from 'aasx-package-ts'
import { describe, expect, it } from 'vitest'
import {
  buildAttachmentSmePath,
  normalizePackagePath,
  packagePathCandidates,
  pickSupplementaryPart,
} from '@/composables/AAS/AASXImport'

type MinimalPart = Pick<Part, 'URI'>

function partWithPath (path: string): MinimalPart {
  return {
    URI: new URL(`https://package.local${path}`),
  }
}

describe('AASXImport.ts; pure helper tests', () => {
  it('builds client import SME attachment path with dot-separated idShort segments', () => {
    const smEndpoint = 'https://example.test/submodels/encoded-submodel-id'
    const idShortPath = ['Documents', 'Manual', 'Pdf File']

    const path = buildAttachmentSmePath(smEndpoint, idShortPath)

    expect(path).toBe(
      'https://example.test/submodels/encoded-submodel-id/submodel-elements/Documents.Manual.Pdf%20File',
    )
  })

  it('normalizes package path by trimming, removing query, and adding leading slash', () => {
    const normalized = normalizePackagePath('  aasx-suppl/file.png?cache=1  ')

    expect(normalized).toBe('/aasx-suppl/file.png')
  })

  it('creates decoded package path candidates for encoded path segments', () => {
    const candidates = packagePathCandidates('/aasx-suppl/Markings%5B0%5D.png')

    expect(candidates).toContain('/aasx-suppl/Markings%5B0%5D.png')
    expect(candidates).toContain('/aasx-suppl/Markings[0].png')
  })

  it('matches supplementary parts whose filenames were sanitized during packaging', () => {
    const supplementaryMap = new Map<string, Part>()
    const packagedPart = partWithPath(
      '/aasx-suppl/aHR0cHM6Ly9hZG1pbi1zaGVsbC5pby9pZHRhL1N1Ym1vZGVsVGVtcGxhdGUvRGlnaXRhbE5hbWVwbGF0ZS8zLzA-Markings-0-.MarkingFile-Schwindegg.png',
    )
    supplementaryMap.set(packagedPart.URI.pathname, packagedPart as Part)

    const foundPart = pickSupplementaryPart(
      'aHR0cHM6Ly9hZG1pbi1zaGVsbC5pby9pZHRhL1N1Ym1vZGVsVGVtcGxhdGUvRGlnaXRhbE5hbWVwbGF0ZS8zLzA-Markings[0].MarkingFile-Schwindegg.png',
      supplementaryMap,
    )

    expect(foundPart).toBe(packagedPart as Part)
  })

  it('does not report ambiguity when one underlying part is indexed by multiple path candidates', () => {
    const supplementaryMap = new Map<string, Part>()
    const packagedPart = partWithPath('/aasx-suppl/folder/shared.png')

    // Simulate buildSupplementaryMap behavior where the same Part is stored under multiple candidate keys.
    supplementaryMap.set('/aasx-suppl/folder/shared.png', packagedPart as Part)
    supplementaryMap.set('aasx-suppl/folder/shared.png', packagedPart as Part)

    const foundPart = pickSupplementaryPart('shared.png', supplementaryMap)

    expect(foundPart).toBe(packagedPart as Part)
  })

  it('returns null when filename-only matching would be ambiguous', () => {
    const supplementaryMap = new Map<string, Part>()
    const firstPart = partWithPath('/aasx-suppl/folderA/shared.png')
    const secondPart = partWithPath('/aasx-suppl/folderB/shared.png')
    supplementaryMap.set(firstPart.URI.pathname, firstPart as Part)
    supplementaryMap.set(secondPart.URI.pathname, secondPart as Part)

    const foundPart = pickSupplementaryPart('shared.png', supplementaryMap)

    expect(foundPart).toBeNull()
  })
})
