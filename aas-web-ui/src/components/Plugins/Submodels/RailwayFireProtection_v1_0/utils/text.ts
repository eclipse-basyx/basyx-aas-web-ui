const QUOTED = /^["'“„«]([\s\S]*)["'”“»]$/

/**
 * Removes whitespace and one pair of surrounding quotes, e.g. `"Compliant: Hazard Level 3"` →
 * `Compliant: Hazard Level 3`. The IDTA 02102 example stores several string values with literal quotes.
 */
export function stripQuotes (value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(QUOTED)
  return match ? match[1].trim() : trimmed
}
