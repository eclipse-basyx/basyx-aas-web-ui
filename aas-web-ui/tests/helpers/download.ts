/**
 * Downloads a file that tests need but this repository does not contain.
 * Returns null and logs a warning on HTTP errors, timeouts and missing network access, so the dependent tests can be skipped.
 */
export async function download<T> (
  url: string,
  label: string,
  read: (response: Response) => Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!response.ok) {
      console.warn(`${label} not available (HTTP ${response.status}): ${url}`)
      return null
    }
    return await read(response)
  } catch (error) {
    console.warn(`${label} not available (${(error as Error).message}): ${url}`)
    return null
  }
}
