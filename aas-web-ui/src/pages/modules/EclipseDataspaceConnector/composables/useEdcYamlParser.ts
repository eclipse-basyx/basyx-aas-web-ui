import type { EdcConfig, EdcType, YamlEdcConfig, YamlEdcDataspaceConfig, YamlEdcSecurityConfig } from '@/pages/modules/EclipseDataspaceConnector/types/Edc'
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

  function parseDataspaceConfig (yamlDataspace?: YamlEdcDataspaceConfig): EdcConfig['dataspace'] {
    if (!yamlDataspace) {
      return {}
    }

    return {
      ssiHost: yamlDataspace.ssi_host ? yamlDataspace.ssi_host.trim() : undefined,
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
        dspEndpoint: yamlConfig.edc.controlplane.dspEndpoint.trim(),
      },
      dataspace: parseDataspaceConfig(yamlConfig.edc.dataspace),
      security: parseSecurityConfig(yamlConfig.edc.security),
      businessPartners: parseBusinessPartnersConfig(yamlConfig.edc['business-partners']),
    }
  }

  function validateControlplane (controlplane: unknown): boolean {
    if (!controlplane || typeof controlplane !== 'object') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane')
      return false
    }

    const obj = controlplane as Record<string, unknown>
    if (!obj.endpoint || typeof obj.endpoint !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane.endpoint')
      return false
    }
    if (!obj.managementEndpoint || typeof obj.managementEndpoint !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane.managementEndpoint')
      return false
    }
    if (!obj.dspEndpoint || typeof obj.dspEndpoint !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid controlplane.dspEndpoint')
      return false
    }
    return true
  }

  function validateDataspace (dataspace: unknown): boolean {
    // dataspace block (and ssi_host within it) is optional, e.g. for EDC v0.9
    if (dataspace === undefined) {
      return true
    }

    if (typeof dataspace !== 'object' || dataspace === null) {
      console.error('Invalid EDC YAML configuration: invalid dataspace')
      return false
    }

    const obj = dataspace as Record<string, unknown>
    if (obj.ssi_host !== undefined && typeof obj.ssi_host !== 'string') {
      console.error('Invalid EDC YAML configuration: invalid dataspace.ssi_host')
      return false
    }
    return true
  }

  function validateSecurity (security: unknown): boolean {
    if (!security || typeof security !== 'object') {
      console.error('Invalid EDC YAML configuration: missing or invalid security')
      return false
    }

    const obj = security as Record<string, unknown>
    if (!obj.type || typeof obj.type !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid security.type')
      return false
    }
    if (obj.config !== undefined && (typeof obj.config !== 'object' || obj.config === null)) {
      console.error('Invalid EDC YAML configuration: invalid security.config')
      return false
    }
    return true
  }

  function validateBusinessPartner (partner: unknown): boolean {
    if (typeof partner !== 'object' || partner === null) {
      console.error('Invalid EDC YAML configuration: business-partner entry is not an object')
      return false
    }

    const obj = partner as Record<string, unknown>
    if (!obj.name || typeof obj.name !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid business-partner.name')
      return false
    }
    if (!obj.bpn || typeof obj.bpn !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid business-partner.bpn')
      return false
    }
    if (!obj.dsp || typeof obj.dsp !== 'string') {
      console.error('Invalid EDC YAML configuration: missing or invalid business-partner.dsp')
      return false
    }
    return true
  }

  function validateBusinessPartners (businessPartners: unknown): boolean {
    if (businessPartners === undefined) {
      return true
    }
    if (!Array.isArray(businessPartners)) {
      console.error('Invalid EDC YAML configuration: business-partners must be an array')
      return false
    }
    return businessPartners.every(partner => validateBusinessPartner(partner))
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

    return (
      validateControlplane(edcObj.controlplane)
      && validateDataspace(edcObj.dataspace)
      && validateSecurity(edcObj.security)
      && validateBusinessPartners(edcObj['business-partners'])
    )
  }

  return {
    parseYamlConfig,
    validateYamlConfig,
  }
}
