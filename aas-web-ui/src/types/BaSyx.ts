import type { Ref } from 'vue'

export type ComponentConnectionState
  = | 'checking'
    | 'connected'
    | 'not-configured'
    | 'unreachable'
    | 'authentication-required'
    | 'access-denied'
    | 'server-error'
    | 'invalid-response'
    | 'configuration-error'

export interface ComponentConnectionResult {
  state: ComponentConnectionState
  infrastructureId: string | null
  url: string
}

export interface BaSyxComponent {
  url: Ref<string>
  loading: Ref<boolean>
  connected: Ref<boolean | null>
  description: Ref<ServiceDescription | null>
  connect: () => void
  label: string
  pathCheck?: string
  additionalParams?: string
}

export interface ServiceDescription {
  profiles: string[]
}

export type BaSyxComponentKey
  = | 'AASDiscovery'
    | 'AASRegistry'
    | 'SubmodelRegistry'
    | 'AASRepo'
    | 'SubmodelRepo'
    | 'ConceptDescriptionRepo'
    | 'CompanyLookup'
