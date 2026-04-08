export function normalizeBasePath (value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return '/'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (withLeadingSlash === '/') {
    return '/'
  }

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function getPathCandidates (input: string, normalized: string): string[] {
  if (normalized === '/') {
    return ['/']
  }

  const candidates = [normalized]
  if (!input.endsWith('/')) {
    candidates.push(normalized.slice(0, -1))
  }
  return candidates
}

export function toBaseScopedPath (basePath: string, suffix: string): string {
  if (basePath === '/') {
    return `/${suffix}`
  }
  return `${basePath}${suffix}`
}
