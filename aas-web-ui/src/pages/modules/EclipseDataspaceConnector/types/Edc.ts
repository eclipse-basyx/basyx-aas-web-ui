export type EdcSecurityType = 'Key' | 'Token' | 'None'

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
  controlplane: EdcControlPlaneConfig
  dataspace?: EdcDataspaceConfig
  security: EdcSecurityConfig
  businessPartners?: BusinessPartner[]
}
