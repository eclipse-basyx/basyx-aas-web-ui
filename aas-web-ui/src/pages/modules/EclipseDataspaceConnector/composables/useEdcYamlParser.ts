import type { EdcConfig, EdcType, YamlEdcConfig, YamlEdcSecurityConfig } from '../types/Edc'
import { EDC_TYPES } from '../types/Edc'

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

  function parseYamlConfig (yamlConfig: YamlEdcConfig): EdcConfig {
    return {
      type: yamlConfig.edc.type,
      controlplane: {
        endpoint: yamlConfig.edc.controlplane.endpoint.trim(),
        managementEndpoint: yamlConfig.edc.controlplane.managementEndpoint.trim(),
      },
      security: parseSecurityConfig(yamlConfig.edc.security),
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

    return true
  }

  return {
    parseYamlConfig,
    validateYamlConfig,
  }
}
