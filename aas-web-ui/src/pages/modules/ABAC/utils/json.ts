/**
 * Extracts a 1-based line number from a SyntaxError message (V8/Chrome).
 */
export function extractLineFromSyntaxError (text: string, message: string): number | null {
  const match = /position (\d+)/.exec(message)
  if (!match) {
    return null
  }
  const pos = Number(match[1])
  return text.slice(0, pos).split('\n').length
}

/**
 * Finds the 1-based line of a Zod issue path by walking the string keys
 * in order, narrowing the search below each matched parent key.
 */
export function findLineForPath (text: string, path: readonly PropertyKey[]): number | null {
  const lines = text.split('\n')
  const keys = path.filter((p): p is string => typeof p === 'string')
  if (keys.length === 0) {
    return null
  }

  let fromLine = 0
  let found: number | null = null

  for (const key of keys) {
    const idx = lines.findIndex((line, i) => i >= fromLine && line.includes(`"${key}"`))
    if (idx === -1) {
      return null
    }
    found = idx
    fromLine = idx
  }

  return found === null ? null : found + 1
}
