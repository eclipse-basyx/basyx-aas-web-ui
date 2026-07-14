import { useAuth } from '@/composables/Auth/useAuth'
import { useEnvStore } from '@/store/EnvironmentStore'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { useNavigationStore } from '@/store/NavigationStore'

export function useRequestHandling () {
  let lastRequestFailureStatus: number | undefined
  let lastRequestFailureDetails: string | undefined

  function setLastRequestFailureStatus (status: number | undefined): void {
    lastRequestFailureStatus = status
  }

  function setLastRequestFailureDetails (details: string | undefined): void {
    lastRequestFailureDetails = details
  }

  function buildErrorDetailsFromPayload (errorData: any): string {
    if (Array.isArray(errorData)) {
      return buildArrayErrorDetails(errorData)
    }

    if (errorData && typeof errorData === 'object') {
      return buildObjectErrorDetails(errorData as Record<string, unknown>)
    }

    if (typeof errorData === 'string') {
      return errorData
    }

    return ''
  }

  function buildArrayErrorDetails (errorData: any[]): string {
    if (errorData.length === 0) {
      return ''
    }

    const error = errorData[0] as {
      code?: unknown
      messageType?: unknown
      correlationId?: unknown
      timestamp?: unknown
      text?: unknown
    }

    const lines: string[] = []

    appendErrorLine(lines, 'Status', error.code)
    appendErrorLine(lines, 'Message Type', error.messageType)
    appendErrorLine(lines, 'Correlation ID', error.correlationId)

    if (error.timestamp) {
      appendErrorLine(lines, 'Timestamp', new Date(String(error.timestamp)).toLocaleString())
    }

    appendErrorLine(lines, 'Text', error.text)

    return lines.join('\n')
  }

  function buildObjectErrorDetails (errorData: Record<string, unknown>): string {
    const lines: string[] = []
    const message = errorData.error ?? errorData.message ?? errorData.text
    const route = [errorData.method, errorData.path]
      .map(value => typeof value === 'string' ? value.trim() : '')
      .filter(Boolean)
      .join(' ')

    appendErrorLine(lines, 'Status', errorData.status)
    appendErrorLine(lines, 'Code', errorData.code)
    appendErrorLine(lines, 'Message', message)
    appendErrorLine(lines, 'Route', route)
    appendErrorLine(lines, 'Correlation ID', errorData.correlationId)
    appendErrorLine(lines, 'Timestamp', errorData.timestamp)

    return lines.join('\n')
  }

  function appendErrorLine (lines: string[], label: string, value: unknown): void {
    let text = ''
    if (typeof value === 'string') {
      text = value.trim()
    } else if (value !== undefined && value !== null) {
      text = String(value)
    }

    if (text === '') {
      return
    }

    lines.push(`${label}: ${text}`)
  }

  function consumeLastRequestFailureStatus (): number | undefined {
    const status = lastRequestFailureStatus
    lastRequestFailureStatus = undefined
    return status
  }

  function consumeLastRequestFailureDetails (): string | undefined {
    const details = lastRequestFailureDetails
    lastRequestFailureDetails = undefined
    return details
  }

  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()
  const environmentStore = useEnvStore()
  const { showLoginRequiredSnackbar } = useAuth()

  /**
   * Centralized error handler for catch blocks
   * Handles authentication errors and general errors
   */
  function handleRequestError (error: unknown, disableMessage: boolean): { success: false, status?: number } {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const statusCode = extractStatusCode(errorMessage)
    const is401Error = statusCode === 401
    const is403Error = statusCode === 403
    setLastRequestFailureStatus(statusCode)
    setLastRequestFailureDetails(errorMessage)

    const currentInfra = infrastructureStore.getSelectedInfrastructure
    const hasAuth = currentInfra?.auth && currentInfra.auth.securityType !== 'No Authentication'
    const isInteractiveOAuth2WithoutToken = is403Error
      && currentInfra?.auth?.securityType === 'OAuth2'
      && currentInfra.auth.oauth2?.authFlow !== 'client-credentials'
      && !currentInfra.token?.accessToken
    const isAuthenticationRequired = is401Error || isInteractiveOAuth2WithoutToken

    // Handle authentication errors
    if (isAuthenticationRequired && hasAuth) {
      if (currentInfra?.id) {
        infrastructureStore.setAuthenticationStatusForInfrastructure(currentInfra.id, false)
      }
      showLoginRequiredSnackbar()

      return { success: false, status: statusCode }
    }

    if (is403Error && hasAuth) {
      const currentSnackbar = navigationStore.getSnackbar
      if (
        !currentSnackbar.status
        || currentSnackbar.kind !== 'access-denied'
        || currentSnackbar.infrastructureId !== currentInfra?.id
      ) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: 'warning',
          btnColor: 'buttonText',
          baseError: 'Access denied!',
          extendedError: 'You are not allowed to perform this action.',
          infrastructureId: currentInfra?.id,
          kind: 'access-denied',
        })
      }

      return { success: false, status: statusCode }
    }

    // Handle other errors
    if (!disableMessage) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 60_000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Error! Server responded with: ' + error,
      })
    }
    return { success: false, status: statusCode }
  }

  function extractStatusCode (errorMessage: string): number | undefined {
    const explicitErrorStatusMatch = errorMessage.match(/Error status:\s*(\d{3})/i)
    if (explicitErrorStatusMatch) {
      const statusCode = Number(explicitErrorStatusMatch[1])
      return Number.isNaN(statusCode) ? undefined : statusCode
    }

    const explicitStatusMatch = errorMessage.match(/\bstatus(?:\s*code)?\s*[:=]\s*(\d{3})\b/i)
    if (!explicitStatusMatch) {
      return undefined
    }

    const statusCode = Number(explicitStatusMatch[1])
    if (Number.isNaN(statusCode)) {
      return undefined
    }

    return statusCode
  }

  function extractErrorStatusFromPayload (data: any): number | undefined {
    if (!data) {
      return undefined
    }

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0] as { code?: unknown, status?: unknown }
      const fromCode = Number(first?.code)
      if (!Number.isNaN(fromCode) && fromCode >= 400) {
        return fromCode
      }
      const fromStatus = Number(first?.status)
      if (!Number.isNaN(fromStatus) && fromStatus >= 400) {
        return fromStatus
      }
      return undefined
    }

    if (typeof data === 'object') {
      const payload = data as { status?: unknown, code?: unknown }
      const fromStatus = Number(payload.status)
      if (!Number.isNaN(fromStatus) && fromStatus >= 400) {
        return fromStatus
      }
      const fromCode = Number(payload.code)
      if (!Number.isNaN(fromCode) && fromCode >= 400) {
        return fromCode
      }
    }

    return undefined
  }

  async function parseJsonIfPresent (response: Response): Promise<any> {
    const bodyText = await response.text()
    if (bodyText.trim() === '') {
      return undefined
    }
    return JSON.parse(bodyText)
  }

  function getResponseContentType (response: Response): string {
    return response.headers.get('Content-Type')?.split(';', 1)[0] ?? ''
  }

  function handlePayloadFailure (
    status: number,
    data: any,
    context: string,
    disableMessage: boolean,
  ): { success: false, status: number } {
    const details = buildErrorDetailsFromPayload(data)
    setLastRequestFailureStatus(status)
    setLastRequestFailureDetails(details)

    if (status === 401 || status === 403) {
      handleRequestError(new Error('Error status: ' + status), disableMessage)
      setLastRequestFailureStatus(status)
      setLastRequestFailureDetails(details)
      return { success: false, status }
    }

    if (!disableMessage) {
      errorHandler(data, context)
    }

    return { success: false, status }
  }

  function getRequest (path: string, context: string, disableMessage: boolean, headers: Headers = new Headers()): any {
    if (shouldAddAuthorizationHeader(path)) {
      // No Authorization needed for the /description endpoint.
      headers = addAuthorizationHeader(headers) // Add the Authorization header
    }
    return fetch(path, { method: 'GET', headers })
      .then(async response => {
        const contentType = getResponseContentType(response)
        // Check if the Server responded with content.
        if (
          contentType === 'application/json'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await parseJsonIfPresent(response) } // Return the response as JSON
        } else if (
          contentType === 'application/asset-administration-shell-package+xml'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.blob() } // Return the response as Blob}
        } else if (
          contentType.includes('image')
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.blob() } // Return the response as Blob
        } else if (
          contentType === 'text/csv'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.text() } // Return the response as text
        } else if (
          contentType === 'text/plain'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.text() } // Return the response as text
        } else if (
          contentType === 'application/pdf'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.blob() } // Return the response as Blob
        } else if (!response.ok) {
          // No content but received an HTTP error status
          throw new Error('Error status: ' + response.status)
        } else if (response.ok && response.status >= 200 && response.status < 300) {
          return { response, data: await response.blob() } // Return the response as Blob
        } else {
          // Unexpected HTTP status
          throw new Error('Unexpected HTTP status: ' + response.status)
        }
      })
      .then(({ response, data }) => {
        // Check if the Server responded with an error
        const failureStatus = extractErrorStatusFromPayload(data) ?? (response.ok ? undefined : response.status)
        if (failureStatus !== undefined) {
          return { ...handlePayloadFailure(failureStatus, data, context, disableMessage), raw: response }
        } else if (data !== undefined) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Successful response from the server
          return { success: true, data, status: response.status, raw: response }
        } else if (response.ok && response.status >= 200 && response.status < 300) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Empty successful response
          return { success: true, data: {}, status: response.status, raw: response }
        } else {
          // Unexpected response format
          throw new Error('Unexpected response format')
        }
      })
      .catch(error => handleRequestError(error, disableMessage))
  }

  function postRequest (
    path: string,
    body: any,
    headers: Headers,
    context: string,
    disableMessage: boolean,
    isTSRequest = false,
  ): any {
    if (!isTSRequest) {
      headers = addAuthorizationHeader(headers) // Add the Authorization header
    }
    return fetch(path, { method: 'POST', body, headers })
      .then(async response => {
        const contentType = getResponseContentType(response)
        // Check if the Server responded with content
        if (
          contentType === 'application/json'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await parseJsonIfPresent(response) } // Return the response as JSON
        } else if (
          contentType === 'text/csv'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return { response, data: await response.text() } // Return the response as text
        } else if (response.ok) {
          return { response, data: undefined } // Return without content
        } else {
          // No content but received an HTTP error status
          throw new Error('Error status: ' + response.status)
        }
      })
      .then(({ response, data }) => {
        // Check if the Server responded with an error
        const payloadStatus = extractErrorStatusFromPayload(data)
        if (payloadStatus !== undefined) {
          return handlePayloadFailure(payloadStatus, data, context, disableMessage)
        } else if (!response.ok) {
          setLastRequestFailureStatus(response.status)
          setLastRequestFailureDetails(buildErrorDetailsFromPayload(data) || undefined)
          if (!disableMessage && data) {
            errorHandler(data, context)
          }
          return { success: false, status: response.status }
        } else if (data) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Successful response from the server
          return { success: true, data }
        } else if (data === null || data === undefined) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // in this case no content is expected
          return { success: true }
        } else {
          // Unexpected response format
          throw new Error('Unexpected response format')
        }
      })
      .catch(error => handleRequestError(error, disableMessage))
  }

  function putRequest (path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
    headers = addAuthorizationHeader(headers) // Add the Authorization header
    return fetch(path, { method: 'PUT', body, headers })
      .then(response => {
        const contentType = getResponseContentType(response)
        // Check if the Server responded with content
        if (
          contentType === 'application/json'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return parseJsonIfPresent(response) // Return the response as JSON
        } else if (response.ok) {
          return // Return without content
        } else {
          // No content but received an HTTP error status
          throw new Error('Error status: ' + response.status)
        }
      })
      .then(data => {
        // Check if the Server responded with an error
        const payloadStatus = extractErrorStatusFromPayload(data)
        if (payloadStatus !== undefined) {
          return handlePayloadFailure(payloadStatus, data, context, disableMessage)
        } else if (data) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Successful response from the server
          return { success: true, data }
        } else if (data === null || data === undefined) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // in this case no content is expected
          return { success: true }
        } else {
          // Unexpected response format
          throw new Error('Unexpected response format')
        }
      })
      .catch(error => handleRequestError(error, disableMessage))
  }

  function patchRequest (path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
    headers = addAuthorizationHeader(headers) // Add the Authorization header
    return fetch(path, { method: 'PATCH', body, headers })
      .then(response => {
        const contentType = getResponseContentType(response)
        // Check if the Server responded with content
        if (
          contentType === 'application/json'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return parseJsonIfPresent(response) // Return the response as JSON
        } else if (response.ok) {
          return // Return without content
        } else {
          // No content but received an HTTP error status
          throw new Error('Error status: ' + response.status)
        }
      })
      .then(data => {
        // Check if the Server responded with an error
        const payloadStatus = extractErrorStatusFromPayload(data)
        if (payloadStatus !== undefined) {
          return handlePayloadFailure(payloadStatus, data, context, disableMessage)
        } else if (data) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Successful response from the server
          return { success: true, data }
        } else if (data === null || data === undefined) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // in this case no content is expected
          return { success: true }
        } else {
          // Unexpected response format
          throw new Error('Unexpected response format')
        }
      })
      .catch(error => handleRequestError(error, disableMessage))
  }

  function deleteRequest (path: string, context: string, disableMessage: boolean): any {
    return fetch(path, { method: 'DELETE', headers: addAuthorizationHeader(new Headers()) })
      .then(response => {
        const contentType = getResponseContentType(response)
        // Check if the Server responded with content
        if (
          contentType === 'application/json'
          && response.headers.get('Content-Length') !== '0'
        ) {
          return parseJsonIfPresent(response) // Return the response as JSON
        } else if (response.ok) {
          return // Return without content
        } else {
          // No content but received an HTTP error status
          throw new Error('Error status: ' + response.status)
        }
      })
      .then(data => {
        // Check if the Server responded with an error
        const payloadStatus = extractErrorStatusFromPayload(data)
        if (payloadStatus !== undefined) {
          return handlePayloadFailure(payloadStatus, data, context, disableMessage)
        } else if (data) {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // Successful response from the server
          return { success: true, data }
        } else {
          setLastRequestFailureStatus(undefined)
          setLastRequestFailureDetails(undefined)
          // in this case no content is expected
          return { success: true }
        }
      })
      .catch(error => handleRequestError(error, disableMessage))
  }

  function addAuthorizationHeader (headers: Headers): Headers {
    // Try to find which infrastructure component this request is for
    const selectedInfra = infrastructureStore.getSelectedInfrastructure

    if (selectedInfra) {
      // Use infrastructure-level authentication if configured
      const auth = selectedInfra.auth
      const authorizationPrefix = environmentStore.getAuthorizationPrefix
      if (auth && auth.securityType !== 'No Authentication') {
        if (auth.securityType === 'Bearer Token' && auth.bearerToken?.token) {
          headers.set('Authorization', authorizationPrefix + ' ' + auth.bearerToken.token)
          return headers
        } else if (auth.securityType === 'Basic Authentication' && auth.basicAuth) {
          headers.set(
            'Authorization',
            'Basic ' + btoa(auth.basicAuth.username + ':' + auth.basicAuth.password),
          )
          return headers
        } else if (auth.securityType === 'OAuth2' && selectedInfra.token?.accessToken) {
          headers.set('Authorization', authorizationPrefix + ' ' + selectedInfra.token.accessToken)
          return headers
        }
      }
    }

    return headers
  }

  function errorHandler (errorData: any, context: string): void {
    // console.log('Error: ', errorData, 'Context: ', context)
    const initialErrorMessage = 'Error ' + context + '!'
    const errorMessage = buildErrorDetailsFromPayload(errorData)
    setLastRequestFailureDetails(errorMessage)

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 60_000,
      color: 'error',
      btnColor: 'buttonText',
      baseError: initialErrorMessage,
      extendedError: errorMessage,
    })
  }

  function shouldAddAuthorizationHeader (path: string): boolean {
    const exemptionEnabled = environmentStore.getAuthorizationDescriptionEndpointExemption
    if (
      exemptionEnabled
      && path.endsWith('/description')
      && !path.includes('/submodels/')
      && !path.includes('/submodel-elements/')
    ) {
      return false
    }
    return true
  }

  return {
    getRequest,
    postRequest,
    putRequest,
    patchRequest,
    deleteRequest,
    consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails,
    errorHandler,
  }
}
