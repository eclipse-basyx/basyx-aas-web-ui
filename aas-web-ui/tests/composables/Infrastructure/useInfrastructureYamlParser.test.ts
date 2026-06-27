import type { YamlInfrastructuresConfig } from '@/types/Infrastructure'
import { describe, expect, it } from 'vitest'
import { useInfrastructureYamlParser } from '@/composables/Infrastructure/useInfrastructureYamlParser'

function createYamlConfig (
  infrastructure: YamlInfrastructuresConfig['infrastructures'][string],
): YamlInfrastructuresConfig {
  return {
    infrastructures: {
      default: 'local',
      local: infrastructure,
    },
  }
}

describe('useInfrastructureYamlParser.ts', () => {
  it('defaults missing template values to full', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Local',
      components: {
        aasRepository: { baseUrl: 'https://aas-repo.example' },
      },
      security: { type: 'none' },
    }))

    expect(parsed.infrastructures[0].template).toBe('full')
    expect(parsed.defaultInfrastructureId).toBe('yaml_local')
  })

  it('falls back to full for invalid template values', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Invalid Template',
      template: 'not-a-template',
      components: {
        aasRepository: { baseUrl: 'https://aas-repo.example' },
      },
      security: { type: 'none' },
    }))

    expect(parsed.infrastructures[0].template).toBe('full')
  })

  it.each(['full', 'identifiable', 'mono-repo', 'mono-all', 'catena-x'] as const)(
    'parses explicit %s template values',
    template => {
      const { parseYamlConfig } = useInfrastructureYamlParser()

      const parsed = parseYamlConfig(createYamlConfig({
        name: template,
        template,
        components: {
          aasRepository: { baseUrl: 'https://aas-repo.example' },
        },
        security: { type: 'none' },
      }))

      expect(parsed.infrastructures[0].template).toBe(template)
    },
  )

  it('maps mono-repo AAS Environment URL to repository compatibility slots', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Mono Repo',
      template: 'mono-repo',
      components: {
        aasDiscovery: { baseUrl: 'https://discovery.example' },
        aasRegistry: { baseUrl: 'https://aas-registry.example' },
        submodelRegistry: { baseUrl: 'https://sm-registry.example' },
        aasEnvironment: {
          baseUrl: 'https://aas-env.example',
          hasRegistryIntegration: false,
        },
      },
      security: { type: 'none' },
    }))

    const components = parsed.infrastructures[0].components
    expect(components.AASDiscovery.url).toBe('https://discovery.example')
    expect(components.AASRegistry.url).toBe('https://aas-registry.example')
    expect(components.SubmodelRegistry.url).toBe('https://sm-registry.example')
    expect(components.AASRepo.url).toBe('https://aas-env.example')
    expect(components.SubmodelRepo.url).toBe('https://aas-env.example')
    expect(components.ConceptDescriptionRepo.url).toBe('https://aas-env.example')
    expect(components.AASRepo.hasRegistryIntegration).toBe(false)
    expect(components.SubmodelRepo.hasRegistryIntegration).toBe(false)
  })

  it('maps Catena-X DTR and Submodel Service URLs to compatibility slots', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Catena-X',
      template: 'catena-x',
      components: {
        digitalTwinRegistry: { baseUrl: 'https://dtr.example' },
        submodelService: { baseUrl: 'https://submodel-service.example' },
      },
      security: { type: 'oauth2', config: { issuer: 'https://issuer.example', clientId: 'ui' } },
    }))

    const infrastructure = parsed.infrastructures[0]
    expect(infrastructure.template).toBe('catena-x')
    expect(infrastructure.components.AASDiscovery.url).toBe('https://dtr.example')
    expect(infrastructure.components.AASRegistry.url).toBe('https://dtr.example')
    expect(infrastructure.components.SubmodelRepo.url).toBe('https://submodel-service.example')
    expect(infrastructure.components.SubmodelRegistry.url).toBe('')
    expect(infrastructure.auth?.securityType).toBe('OAuth2')
  })
})
