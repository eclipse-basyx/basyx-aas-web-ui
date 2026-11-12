import type { Ref } from 'vue'

/**
 * Outcome of a saved component connection check. Setup guidance appears only when every
 * relevant source is `unreachable` or has no URL. The other failure states keep their regular
 * error feedback and are recorded so that guidance never hides a server that responded.
 */
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
