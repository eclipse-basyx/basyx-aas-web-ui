import type { EdcConfig, EdcType, YamlEdcConfig, YamlEdcSecurityConfig } from '@/pages/modules/EclipseDataspaceConnector/types/Edc'
import { EDC_TYPES } from '@/pages/modules/EclipseDataspaceConnector/types/Edc'

export function useEdcYamlParser (): {
  parseYamlConfig: (yamlConfig: YamlEdcConfig) => EdcConfig
  validateYamlConfig: (config: unknown) => config is YamlEdcConfig
} {
  function normalizeSecurityType (securityType: string): EdcConfig['security']['type'] {
    const normalizedType = String(securityType || '').trim().toLowerCase()

    if (normalizedType === 'key') {
      return 'Key'
    }

    if (normalizedType === 'token') {
      return 'Token'
    }

    return 'None'
  }

  function parseSecurityConfig (yamlSecurity: YamlEdcSecurityConfig): EdcConfig['security'] {
    return {
      type: normalizeSecurityType(yamlSecurity.type),
      config: yamlSecurity.config ? { ...yamlSecurity.config } : {},
    }
  }

  function parseBusinessPartnersConfig (yamlBusinessPartners?: unknown): EdcConfig['businessPartners'] {
    if (!yamlBusinessPartners || !Array.isArray(yamlBusinessPartners)) {
      return []
    }

    return yamlBusinessPartners.map(partner => {
      const partnerObj = partner as Record<string, unknown>
      return {
        name: String(partnerObj.name || ''),
        bpn: String(partnerObj.bpn || ''),
        dsp: String(partnerObj.dsp || ''),
      }
    })
  }

  function parseYamlConfig (yamlConfig: YamlEdcConfig): EdcConfig {
    return {
      type: yamlConfig.edc.type,
      controlplane: {
        endpoint: yamlConfig.edc.controlplane.endpoint.trim(),
        managementEndpoint: yamlConfig.edc.controlplane.managementEndpoint.trim(),
      },
      security: parseSecurityConfig(yamlConfig.edc.security),
      businessPartners: parseBusinessPartnersConfig(yamlConfig.edc['business-partners']),
    }
  }

  function validateYamlConfig (config: unknown): config is YamlEdcConfig {
    if (!config || typeof config !== 'object') {
      console.error('Invalid EDC YAML configuration: not an object')
      return false
    }

    const configObj = config as Record<string, unknown>
    const edc = configObj.edc
    if (!edc || typeof edc !== 'object') {
      console.error('Invalid EDC YAML configuration: missing or invalid edc block')
      return false
    }

    const edcObj = edc as Record<string, unknown>
    if (!edcObj.type || typeof edcObj.type !== 'string' || !EDC_TYPES.includes(edcObj.type as EdcType)) {
      console.error('Invalid EDC YAML configuration: missing or invalid edc.type')
      return false
    }

    const controlplane = edcObj.controlplane
    const security = edcObj.security

    if (!controlplane || typeof controlplane !== 'object') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane')
      return false
    }

    const controlplaneObj = controlplane as Record<string, unknown>
    if (!controlplaneObj.endpoint || typeof controlplaneObj.endpoint !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane.endpoint')
      return false
    }
    if (!controlplaneObj.managementEndpoint || typeof controlplaneObj.managementEndpoint !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane.managementEndpoint')
      return false
    }

    if (!security || typeof security !== 'object') {
      console.error('Invalid EDC YAML configuration: missing or invalid security')
      return false
    }

    const securityObj = security as Record<string, unknown>
    if (!securityObj.type || typeof securityObj.type !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid security.type')
      return false
    }

    if (securityObj.config !== undefined && (typeof securityObj.config !== 'object' || securityObj.config === null)) {
      console.error('Invalid EDC YAML configuration: invalid security.config')
      return false
    }

    // Validate business-partners if present
    const businessPartners = edcObj['business-partners']
    if (businessPartners !== undefined) {
      if (!Array.isArray(businessPartners)) {
        console.error('Invalid EDC YAML configuration: business-partners must be an array')
        return false
      }

      for (const partner of businessPartners) {
        if (typeof partner !== 'object' || partner === null) {
          console.error('Invalid EDC YAML configuration: business-partner entry is not an object')
          return false
        }

        const partnerObj = partner as Record<string, unknown>
        if (!partnerObj.name || typeof partnerObj.name !== 'string') {
          console.error('Invalid EDC YAML configuration: missing or invalid business-partner.name')
          return false
        }
        if (!partnerObj.bpn || typeof partnerObj.bpn !== 'string') {
          console.error('Invalid EDC YAML configuration: missing or invalid business-partner.bpn')
          return false
        }
        if (!partnerObj.dsp || typeof partnerObj.dsp !== 'string') {
          console.error('Invalid EDC YAML configuration: missing or invalid business-partner.dsp')
          return false
        }
      }
    }

    return true
  }

  return {
    parseYamlConfig,
    validateYamlConfig,
  }
}
