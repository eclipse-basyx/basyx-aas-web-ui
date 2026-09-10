import type { YamlInfrastructuresConfig } from '@/types/Infrastructure'
import { load } from 'js-yaml'
import { describe, expect, it, vi } from 'vitest'
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

  it('parses public Catena-X EDC proxy metadata', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Catena-X',
      template: 'catena-x',
      components: {
        digitalTwinRegistry: { baseUrl: 'https://dtr.example' },
        submodelService: { baseUrl: 'https://submodel-service.example' },
      },
      catenaX: {
        edc: {
          proxyId: 'default',
          defaultCounterPartyId: 'TEST_COUNTERPARTY_ID',
          defaultCounterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        },
      },
      security: { type: 'none' },
    }))

    expect(parsed.infrastructures[0].catenaX).toEqual({
      accessMode: 'edc',
      edc: {
        proxyId: 'default',
        defaultCounterPartyId: 'TEST_COUNTERPARTY_ID',
        defaultCounterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        defaultPartnerId: 'test-counterparty-id-https-counterparty-dsp-test-api-v1-dsp',
        partners: [
          {
            id: 'test-counterparty-id-https-counterparty-dsp-test-api-v1-dsp',
            counterPartyId: 'TEST_COUNTERPARTY_ID',
            counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
          },
        ],
      },
    })
  })

  it('parses custom-header security into a customHeader auth config', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Custom Header',
      components: {
        aasRepository: { baseUrl: 'https://aas-repo.example' },
      },
      security: {
        type: 'custom-header',
        config: { headerName: 'X-API-KEY', headerValue: 'secret-key-123' },
      },
    }))

    const auth = parsed.infrastructures[0].auth
    expect(auth?.securityType).toBe('Custom Header')
    expect(auth?.customHeader).toEqual({ name: 'X-API-KEY', value: 'secret-key-123' })
  })

  it('omits customHeader when headerName or headerValue is missing', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Custom Header Incomplete',
      components: {
        aasRepository: { baseUrl: 'https://aas-repo.example' },
      },
      security: {
        type: 'custom-header',
        config: { headerName: 'X-API-KEY' },
      },
    }))

    const auth = parsed.infrastructures[0].auth
    expect(auth?.securityType).toBe('Custom Header')
    expect(auth?.customHeader).toBeUndefined()
  })

  it.each([
    ['X-API-KEY:', 'secret'],
    ['X API KEY', 'secret'],
    ['', 'secret'],
    ['X-API-KEY', ' '.repeat(3)],
    ['X-API-KEY', 'line1\nline2'],
    ['X-API-KEY', 123_456],
    [123, 'secret'],
  ])('omits invalid custom-header YAML values (%j, %j)', (headerName, headerValue) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const raw = load(`infrastructures:
  gateway:
    components:
      aasRepository:
        baseUrl: https://aas-repo.example
    security:
      type: custom-header
      config:
        headerName: ${JSON.stringify(headerName)}
        headerValue: ${JSON.stringify(headerValue)}
`)
      const parser = useInfrastructureYamlParser()
      expect(parser.validateYamlConfig(raw)).toBe(true)
      const parsed = parser.parseYamlConfig(raw as YamlInfrastructuresConfig)
      expect(parsed.infrastructures[0].auth).toEqual({ securityType: 'Custom Header' })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('valid headerName and headerValue'))
    } finally {
      warn.mockRestore()
    }
  })

  it('parses Catena-X EDC partners from YAML', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Catena-X',
      template: 'catena-x',
      components: {},
      catenaX: {
        accessMode: 'edc',
        edc: {
          proxyId: 'default',
          defaultPartnerId: 'partner-a',
          partners: [
            {
              id: 'partner-a',
              name: 'Partner A',
              counterPartyId: 'TEST_PARTICIPANT_ID',
              counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
            },
          ],
        },
      },
      security: { type: 'none' },
    }))

    expect(parsed.infrastructures[0].catenaX?.edc).toEqual({
      proxyId: 'default',
      defaultCounterPartyId: 'TEST_PARTICIPANT_ID',
      defaultCounterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      defaultPartnerId: 'partner-a',
      partners: [
        {
          id: 'partner-a',
          name: 'Partner A',
          counterPartyId: 'TEST_PARTICIPANT_ID',
          counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        },
      ],
    })
  })

  it('preserves configured partner metadata when it matches the legacy default', () => {
    const { parseYamlConfig } = useInfrastructureYamlParser()

    const parsed = parseYamlConfig(createYamlConfig({
      name: 'Catena-X',
      template: 'catena-x',
      components: {},
      catenaX: {
        accessMode: 'edc',
        edc: {
          proxyId: 'default',
          defaultPartnerId: 'partner-a',
          defaultCounterPartyId: 'BPNL000000000AAA',
          defaultCounterPartyAddress: 'https://partner-a.example/api/v1/dsp',
          partners: [
            {
              id: 'partner-a',
              name: 'Partner A',
              counterPartyId: 'BPNL000000000AAA',
              counterPartyAddress: 'https://partner-a.example/api/v1/dsp',
            },
            {
              id: 'partner-b',
              name: 'Partner B',
              counterPartyId: 'BPNL000000000BBB',
              counterPartyAddress: 'https://partner-b.example/api/v1/dsp',
            },
          ],
        },
      },
      security: { type: 'none' },
    }))

    expect(parsed.infrastructures[0].catenaX?.edc).toEqual({
      proxyId: 'default',
      defaultPartnerId: 'partner-a',
      defaultCounterPartyId: 'BPNL000000000AAA',
      defaultCounterPartyAddress: 'https://partner-a.example/api/v1/dsp',
      partners: [
        {
          id: 'partner-a',
          name: 'Partner A',
          counterPartyId: 'BPNL000000000AAA',
          counterPartyAddress: 'https://partner-a.example/api/v1/dsp',
        },
        {
          id: 'partner-b',
          name: 'Partner B',
          counterPartyId: 'BPNL000000000BBB',
          counterPartyAddress: 'https://partner-b.example/api/v1/dsp',
        },
      ],
    })
  })
})
