/**
 * Creates an error the BFF answers with the given HTTP status, e.g. 400 for an invalid request.
 * `details` tells the user how to fix it.
 */
export function createHttpError (message: string, status: number, details?: string): Error & { status: number, details?: string } {
  const error = new Error(message) as Error & { status: number, details?: string }
  error.status = status
  if (details) {
    error.details = details
  }
  return error
}
