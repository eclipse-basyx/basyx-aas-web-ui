import type { ResourceBoundPolicy, ResourceObject } from '@/types/ResourceAccess'

export interface PolicyValidationResult {
  valid: boolean
  policy?: ResourceBoundPolicy
  message?: string
}

export function validatePolicyJson (source: string, resource: ResourceObject): PolicyValidationResult {
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    return { valid: false, message: 'Policy JSON is not valid.' }
  }
  if (!isObject(value) || Array.isArray(value)) {
    return { valid: false, message: 'Policy must be a JSON object.' }
  }
  if (!Array.isArray(value.rules)) {
    return { valid: false, message: 'Policy rules must be an array.' }
  }
  if (!sameResource(value.RESOURCE, resource)) {
    return { valid: false, message: 'RESOURCE must exactly match the resource returned by the server.' }
  }
  for (const field of ['DEFATTRIBUTES', 'DEFACLS', 'DEFFORMULAS']) {
    if (field in value && !Array.isArray(value[field])) {
      return { valid: false, message: `${field} must be an array when present.` }
    }
  }
  return { valid: true, policy: value as unknown as ResourceBoundPolicy }
}

export function createLocalPolicy (resource: ResourceObject, effectivePolicy: ResourceBoundPolicy | null): ResourceBoundPolicy {
  if (!effectivePolicy) {
    return { RESOURCE: cloneJson(resource), rules: [] }
  }
  return { ...cloneJson(effectivePolicy), RESOURCE: cloneJson(resource) }
}

export function sameResource (left: unknown, right: ResourceObject): boolean {
  if (!isObject(left) || Array.isArray(left)) {
    return false
  }
  return JSON.stringify(left) === JSON.stringify(right)
}

function isObject (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function cloneJson<T> (value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneJson(item)) as T
  }
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJson(item)])) as T
  }
  return value
}
