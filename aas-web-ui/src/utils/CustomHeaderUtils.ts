import type { CustomHeaderData } from '@/types/Infrastructure'

export function validateCustomHeaderName (value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Enter a custom header name.'
  }

  try {
    new Headers([[value.trim(), 'validation']])
    return true
  } catch {
    return 'Enter a valid HTTP header name without spaces or a trailing colon.'
  }
}

export function validateCustomHeaderValue (value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Enter a non-empty custom header value as text.'
  }

  try {
    new Headers([['X-API-KEY', value]])
    return true
  } catch {
    return 'Enter a valid HTTP header value without line breaks or unsupported characters.'
  }
}

export function isValidCustomHeader (customHeader: unknown): customHeader is CustomHeaderData {
  if (!customHeader || typeof customHeader !== 'object') {
    return false
  }

  return 'name' in customHeader && 'value' in customHeader
    && validateCustomHeaderName(customHeader.name) === true
    && validateCustomHeaderValue(customHeader.value) === true
}
