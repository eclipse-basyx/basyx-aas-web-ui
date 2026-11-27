import type { InfrastructureConfig } from '@/types/Infrastructure'
import { describe, expect, it } from 'vitest'
import {
  edcAssetRepositoryUrl,
  edcAssetRepositoryUrlOptions,
  normalizeEdcAssetRepositoryUrl,
  replaceEdcAssetRepositoryUrl,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetRepositoryUrl'

function infrastructure (name: string, aasRepoUrl: string, smRepoUrl: string): InfrastructureConfig {
  return {
    id: name,
    name,
    template: 'full',
    components: {
      AASRepo: { url: aasRepoUrl },
      SubmodelRepo: { url: smRepoUrl },
    },
  } as unknown as InfrastructureConfig
}

describe('EdcAssetRepositoryUrl.ts', () => {
  it('removes trailing slashes and the endpoint path of a repository URL', () => {
    expect(normalizeEdcAssetRepositoryUrl(' https://repo.test/api/ ')).toBe('https://repo.test/api')
    expect(normalizeEdcAssetRepositoryUrl('https://repo.test/shells/')).toBe('https://repo.test')
    expect(normalizeEdcAssetRepositoryUrl('https://repo.test/submodels')).toBe('https://repo.test')
    expect(normalizeEdcAssetRepositoryUrl('')).toBe('')
  })

  it('returns the repository URL an endpoint starts with', () => {
    expect(edcAssetRepositoryUrl('https://repo.test/api/shells/dXJuOmFhcw')).toBe('https://repo.test/api')
    expect(edcAssetRepositoryUrl('https://repo.test/shells/dXJuOmFhcw/submodels/dXJuOnNt')).toBe('https://repo.test')
    expect(edcAssetRepositoryUrl('https://submodels/submodels/dXJuOnNt')).toBe('https://submodels')
    expect(edcAssetRepositoryUrl('https://repo.test/other/dXJuOnNt')).toBe('')
  })

  it('replaces the repository URL of an endpoint and keeps its endpoint path', () => {
    expect(replaceEdcAssetRepositoryUrl('https://repo.test/api/shells/dXJuOmFhcw', 'https://repo.intern:8081/shells/'))
      .toBe('https://repo.intern:8081/shells/dXJuOmFhcw')
    expect(replaceEdcAssetRepositoryUrl('https://repo.test/shells/dXJuOmFhcw/submodels/dXJuOnNt', 'https://repo.intern'))
      .toBe('https://repo.intern/shells/dXJuOmFhcw/submodels/dXJuOnNt')
  })

  it('keeps the endpoint without a repository URL or without an endpoint path', () => {
    expect(replaceEdcAssetRepositoryUrl('https://repo.test/shells/dXJuOmFhcw', '  ')).toBe('https://repo.test/shells/dXJuOmFhcw')
    expect(replaceEdcAssetRepositoryUrl('https://repo.test/other/dXJuOnNt', 'https://repo.intern')).toBe('https://repo.test/other/dXJuOnNt')
  })

  it('offers each repository URL of the infrastructures once with the components configuring it', () => {
    const options = edcAssetRepositoryUrlOptions([
      infrastructure('Local', 'http://localhost:8081', 'http://localhost:8081/'),
      infrastructure('Remote', 'https://remote.test/shells', ''),
    ])

    expect(options).toEqual([
      { value: 'http://localhost:8081', subtitle: 'Local: AAS Repository, Submodel Repository' },
      { value: 'https://remote.test', subtitle: 'Remote: AAS Repository' },
    ])
  })
})
