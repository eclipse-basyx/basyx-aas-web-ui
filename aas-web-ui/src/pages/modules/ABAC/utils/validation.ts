import type { JsonErrorMessage, JsonObject } from '../types/json'
import { hasContent } from '@/utils/StringUtils'
import { isObject } from './object'

/**
 * Parses editor input without coercion; preserves each resource's localized errors.
 * An object payload can then undergo identity, update, and schema checks.
 */
export function parseJsonObject (json: string, messages: { required: string, invalidJson: string, invalidObject: string }): { payload: JsonObject, error: null } | { payload: null, error: JsonErrorMessage } {
  if (!hasContent(json)) {
    return { payload: null, error: { title: messages.required } }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    return { payload: null, error: { title: messages.invalidJson, messages: [(error as Error).message] } }
  }
  return isObject(parsed)
    ? { payload: parsed, error: null }
    : { payload: null, error: { title: messages.invalidObject } }
}
