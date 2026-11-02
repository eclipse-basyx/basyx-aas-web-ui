export type JsonObject = Record<string, unknown>

export interface DocumentValidationResult {
  /** A usable document, even when nonblocking schema advisories are present. */
  payload: JsonObject | null
  error: JsonErrorMessage | null
}

export interface DocumentUpdateOptions {
  /** Complete form document or JSON merge instructions; defaults to merge. */
  inputMode?: 'complete' | 'merge'
  /** Latest form snapshot used as the base for subsequent JSON merge edits. */
  mergeBase?: JsonObject
}

export interface JsonErrorMessage {
  title: string
  /** Localized diagnostic messages paired with their document locations. */
  issues?: { path: string[], message: string }[]
  messages?: string[]
  /** Short advisory overview; full diagnostic messages remain available separately. */
  summary?: string[]
  /** Structured schema paths for section indicators; backend errors may omit them. */
  paths?: string[][]
}
