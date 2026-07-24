export type EdcSecurityType = 'Key' | 'Token' | 'None'
export const EDC_TYPES = ['Tractus-X EDC v0.9', 'Tractus-X EDC v0.12.1'] as const
export type EdcType = (typeof EDC_TYPES)[number]

export interface EdcControlPlaneConfig {
  endpoint: string
  managementEndpoint: string
  dspEndpoint: string
}

export interface BusinessPartner {
  name: string
  bpn: string
  dsp: string
}

export interface YamlEdcDataspaceConfig {
  // Optional for EDC v0.9
  ssi_host?: string
}

export interface YamlEdcSecurityConfig {
  type: string
  config?: Record<string, string>
}

export interface YamlEdcConfig {
  edc: {
    'type': EdcType
    'controlplane': EdcControlPlaneConfig
    'dataspace'?: YamlEdcDataspaceConfig
    'security': YamlEdcSecurityConfig
    'business-partners'?: BusinessPartner[]
  }
}

export interface EdcDataspaceConfig {
  // Optional for EDC v0.9
  ssiHost?: string
}

export interface EdcSecurityConfig {
  type: EdcSecurityType
  config: Record<string, string>
}

export interface EdcConfig {
  type: EdcType
  controlplane: EdcControlPlaneConfig
  dataspace?: EdcDataspaceConfig
  security: EdcSecurityConfig
  businessPartners?: BusinessPartner[]
}
