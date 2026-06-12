export type EdcSecurityType = 'Key' | 'Token' | 'None'
export const EDC_TYPES = ['Tractus-X EDC v0.9', 'Tractus-X EDC v0.11.2'] as const
export type EdcType = (typeof EDC_TYPES)[number]

export interface EdcControlPlaneConfig {
  endpoint: string
  managementEndpoint: string
}

export interface BusinessPartner {
  name: string
  bpn: string
  dsp: string
}

export interface YamlEdcSecurityConfig {
  type: string
  config?: Record<string, string>
}

export interface YamlEdcConfig {
  edc: {
    'type': EdcType
    'controlplane': EdcControlPlaneConfig
    'security': YamlEdcSecurityConfig
    'business-partners'?: BusinessPartner[]
  }
}

export interface EdcSecurityConfig {
  type: EdcSecurityType
  config: Record<string, string>
}

export interface EdcConfig {
  type: EdcType
  controlplane: EdcControlPlaneConfig
  security: EdcSecurityConfig
  businessPartners?: BusinessPartner[]
}
