import type { RequestResult } from '@/composables/RequestHandling'
import type { BaSyxComponentKey, ComponentConnectionState, ServiceDescription } from '@/types/BaSyx'

function isRecord (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString (value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

export function isValidServiceDescription (value: unknown): value is ServiceDescription {
  return isRecord(value)
    && Array.isArray(value.profiles)
    && value.profiles.length > 0
    && value.profiles.every(isNonEmptyString)
}

export function isValidConnectionResponse (componentKey: BaSyxComponentKey, value: unknown): boolean {
  // Company Lookup has its own API; it cannot establish AAS data availability.
  if (componentKey === 'CompanyLookup') {
    return true
  }
  if (!isRecord(value) || !Array.isArray(value.result)) {
    return false
  }
  return componentKey === 'AASDiscovery'
    ? value.result.every(isNonEmptyString)
    : value.result.every(entry => isRecord(entry) && isNonEmptyString(entry.id))
}

export function getConnectionFailureState (response: RequestResult): ComponentConnectionState {
  if (response.status === 401) {
    return 'authentication-required'
  }
  if (response.status === 403) {
    return 'access-denied'
  }
  if (response.status !== undefined && response.status >= 400) {
    return 'server-error'
  }
  if (response.failureKind === 'network') {
    return 'unreachable'
  }
  if (response.failureKind === 'invalid-response') {
    return 'invalid-response'
  }
  return 'configuration-error'
}

export function getFallbackConnectionFailure (description: RequestResult, fallback: RequestResult): ComponentConnectionState {
  const failure = fallback.success ? 'invalid-response' : getConnectionFailureState(fallback)
  if (failure !== 'unreachable' || description.status === 404 || description.status === 405) {
    return failure
  }
  // Preserve evidence of a responding server when the fallback fails at the
  // network layer. Unsupported description endpoints may still use the fallback.
  return description.success ? 'invalid-response' : getConnectionFailureState(description)
}
