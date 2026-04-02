export function describeHttpStatusFailure (status: number | undefined): string {
  switch (status) {
    case 401:
      return 'The request was rejected because authentication is missing or expired (HTTP 401).'
    case 403:
      return 'The request was rejected due to insufficient permissions (HTTP 403).'
    case 404:
      return 'The requested resource or endpoint was not found (HTTP 404).'
    case 409:
      return 'The request conflicts with the current server state (HTTP 409).'
    case 500:
      return 'The server encountered an internal error while processing the request (HTTP 500).'
    case 502:
      return 'The server received an invalid response from an upstream service (HTTP 502).'
    case 503:
      return 'The service is currently unavailable (HTTP 503).'
    case 504:
      return 'The request timed out while waiting for an upstream service (HTTP 504).'
    default:
      return status === undefined ? '' : `The request failed with HTTP ${status}.`
  }
}

export function appendHttpStatusFailureReason (baseMessage: string, status: number | undefined): string {
  const reason = describeHttpStatusFailure(status)
  if (reason === '') {
    return baseMessage
  }

  return `${baseMessage} ${reason}`
}
