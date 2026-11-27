type HttpError = Error & { status: number, details?: string, code?: string }

/**
 * Creates an error the BFF answers with the given HTTP status, e.g. 400 for an invalid request.
 * `details` tells the user how to fix it, `code` replaces the code derived from the message, e.g. `EDC_ID_MISSING`.
 */
export function createHttpError (message: string, status: number, details?: string, code?: string): HttpError {
  const error = new Error(message) as HttpError
  error.status = status
  if (details) {
    error.details = details
  }
  if (code) {
    error.code = code
  }
  return error
}
