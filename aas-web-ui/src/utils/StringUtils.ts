/**
 * Converts the first character of a string to uppercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character capitalized.
 */
export function capitalizeFirstLetter (string: string): string {
  if (!string || string.length === 0) {
    return ''
  }
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Converts the first character of a string to lowercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character lowercased.
 */
export function firstLetterToLowerCase (string: string): string {
  if (!string || string.length === 0) {
    return ''
  }
  return string[0].toLowerCase() + string.slice(1)
}

/**
 * Strips the last character from a given string.
 *
 * This function takes a string as input and returns a new string
 * with the last character removed. If the string is empty has only
 * one character, it returns an empty string.
 *
 * @param {string} string - The input string from which the last character
 * will be removed.
 * @returns {string} - The string without the last character, or an empty
 * string if the input is empty has only one character.
 */
export function stripLastCharacter (string: string): string {
  if (!string || string.length < 2) {
    return ''
  }
  return string.slice(0, Math.max(0, string.length - 1))
}

/**
 * Checks if the provided string is empty or only contains whitespace.
 *
 * @param {string} val - The string to be checked.
 * @returns {boolean} - Returns true if the string is empty or only contains whitespace; otherwise, returns false.
 */
export function isEmptyString (val: string): boolean {
  return !val || val.trim() === ''
}

/**
 * Sanitizes a string to be safe for path/file segments by replacing unsupported characters.
 * Rejects dot-only segments and reserved Windows device names.
 *
 * @param {string} value - The value to sanitize.
 * @param {string} fallback - The value to return if sanitization results in an empty string.
 * @returns {string} A sanitized segment or the fallback.
 */
export function safeSegment (value: string, fallback: string): string {
  const cleaned = value
    ?.trim()
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')

  if (!cleaned) {
    return fallback
  }

  // Strip leading and trailing dots to avoid dot-only or hidden path segments.
  const dotStripped = cleaned.replace(/^\.+/, '').replace(/\.+$/, '')
  if (!dotStripped || dotStripped === '.' || dotStripped === '..') {
    return fallback
  }

  // Reject reserved Windows device names.
  const windowsReservedPattern = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i
  if (windowsReservedPattern.test(dotStripped)) {
    return fallback
  }

  return dotStripped
}

/**
 * Checks if a value is a valid, non-empty string.
 *
 * @remarks
 * This function acts as a TypeScript Type Guard (`val is string`). When used in conditional
 * branches or array filters, it refines the type, allowing you to safely access string-specific
 * properties (like `.toLowerCase()`) without further nullish checks.
 *
 * @param {string | null} val - The value to examine.
 * @returns {boolean} true if the value is a string and has a trimmed length greater than 0; otherwise false.
 *
 * @example
 * 1. Standard conditional check
 * if (hasContent(username)) {
 * console.log(username.toUpperCase()) // Safely inferred as string
 * }
 *
 * 2. Filtering collections
 * const names: (string | null | undefined)[] = ['Alice', ' ', null, 'Bob']
 * const cleanNames: string[] = names.filter(hasContent) // Output: ['Alice', 'Bob']
 */
export function hasContent (val?: string | null): val is string {
  return typeof val === 'string' && val.trim().length > 0
}
