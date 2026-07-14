import type { LocationQueryRaw } from 'vue-router'
import { parseQuery } from 'vue-router'

export type OAuth2ReturnLocation = {
  path: string
  query: LocationQueryRaw
  hash: string
}

type StoredAuthorizationTransaction = {
  infrastructureId: string
  returnUrl: string
}

type StoredLogoutTransaction = {
  callbackPath: string
  returnUrl: string
}

export type AuthorizationTransaction = {
  infrastructureId: string
  returnLocation: OAuth2ReturnLocation
}

const authorizationTransactionPrefix = 'oauth2_authorization_transaction_'
const logoutTransactionKey = 'oauth2_logout_transaction'

function getBasePath (): string {
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
  return basePath.endsWith('/') ? basePath : `${basePath}/`
}

function getApplicationPath (pathname: string): string | null {
  const basePath = getBasePath()
  if (basePath === '/') {
    return pathname || '/'
  }

  const basePathWithoutTrailingSlash = basePath.slice(0, -1)
  if (pathname === basePathWithoutTrailingSlash || pathname === basePath) {
    return '/'
  }

  if (!pathname.startsWith(basePath)) {
    return null
  }

  return `/${pathname.slice(basePath.length)}`
}

function getCurrentReturnLocation (): OAuth2ReturnLocation {
  const currentUrl = new URL(window.location.href)
  const path = getApplicationPath(currentUrl.pathname)

  if (!path) {
    throw new Error('Current URL is outside the application base path')
  }

  return {
    path,
    query: parseQuery(currentUrl.search),
    hash: currentUrl.hash,
  }
}

function getCurrentReturnUrl (): string {
  return window.location.href
}

function parseReturnLocation (returnUrl: unknown): OAuth2ReturnLocation | null {
  if (typeof returnUrl !== 'string') {
    return null
  }

  try {
    const url = new URL(returnUrl)
    if (url.origin !== window.location.origin) {
      return null
    }

    const path = getApplicationPath(url.pathname)
    if (!path) {
      return null
    }

    return {
      path,
      query: parseQuery(url.search),
      hash: url.hash,
    }
  } catch {
    return null
  }
}

function getOpaqueState (): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const randomValues = new Uint8Array(16)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues, value => value.toString(16).padStart(2, '0')).join('')
}

function readStoredValue<T> (key: string): T | null {
  const rawValue = sessionStorage.getItem(key)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    sessionStorage.removeItem(key)
    return null
  }
}

/**
 * Returns the registered OAuth callback URI for the current deployment.
 * Query and hash are intentionally excluded so strict IdPs do not require
 * dynamic redirect URI registration.
 */
export function getOAuth2CallbackUri (): string {
  return `${window.location.origin}${window.location.pathname}`
}

/**
 * Starts an authorization-code navigation transaction in the current tab.
 */
export function startAuthorizationTransaction (infrastructureId: string): { state: string, redirectUri: string } {
  const state = getOpaqueState()
  const transaction: StoredAuthorizationTransaction = {
    infrastructureId,
    returnUrl: getCurrentReturnUrl(),
  }

  sessionStorage.setItem(`${authorizationTransactionPrefix}${state}`, JSON.stringify(transaction))

  return {
    state,
    redirectUri: getOAuth2CallbackUri(),
  }
}

/**
 * Retrieves a pending authorization transaction without consuming it.
 */
export function getAuthorizationTransaction (state: string): AuthorizationTransaction | null {
  if (!state) {
    return null
  }

  const storageKey = `${authorizationTransactionPrefix}${state}`
  const transaction = readStoredValue<StoredAuthorizationTransaction>(storageKey)
  const returnLocation = parseReturnLocation(transaction?.returnUrl)

  if (!transaction || typeof transaction.infrastructureId !== 'string' || !returnLocation) {
    sessionStorage.removeItem(storageKey)
    return null
  }

  return {
    infrastructureId: transaction.infrastructureId,
    returnLocation,
  }
}

/**
 * Returns a pending authorization transaction and removes it from storage.
 */
export function consumeAuthorizationTransaction (state: string): AuthorizationTransaction | null {
  const transaction = getAuthorizationTransaction(state)
  sessionStorage.removeItem(`${authorizationTransactionPrefix}${state}`)
  return transaction
}

export function clearAuthorizationTransaction (state: string): void {
  sessionStorage.removeItem(`${authorizationTransactionPrefix}${state}`)
}

/**
 * Stores the current location before sending the browser to an IdP logout endpoint.
 */
export function startLogoutTransaction (): { callbackPath: string, redirectUri: string } {
  const returnLocation = getCurrentReturnLocation()
  const transaction: StoredLogoutTransaction = {
    callbackPath: returnLocation.path,
    returnUrl: getCurrentReturnUrl(),
  }

  sessionStorage.setItem(logoutTransactionKey, JSON.stringify(transaction))

  return {
    callbackPath: transaction.callbackPath,
    redirectUri: getOAuth2CallbackUri(),
  }
}

/**
 * Restores and consumes a pending logout location only at its expected callback route.
 */
export function consumeLogoutTransaction (callbackPath: string): OAuth2ReturnLocation | null {
  const transaction = readStoredValue<StoredLogoutTransaction>(logoutTransactionKey)
  if (!transaction || transaction.callbackPath !== callbackPath) {
    return null
  }

  sessionStorage.removeItem(logoutTransactionKey)
  return parseReturnLocation(transaction.returnUrl)
}
