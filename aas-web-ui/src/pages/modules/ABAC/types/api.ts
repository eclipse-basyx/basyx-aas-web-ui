export interface AbacClientOptions {
  /** Suppress request snackbars by default; pass false to enable client messages. */
  suppressMessages?: boolean
}

export interface AbacResponse<T> {
  success: boolean
  data?: T
  status?: number
}

/** BaSyx error messages may arrive as one object or an array of messages. */
export interface AbacErrorMessage {
  code?: string
  correlationId?: string
  messageType?: string
  text?: string
  timestamp?: string
  /** Optional structured paths; current backends may only provide text. */
  paths?: string[][]
}

export interface AbacErrorDetails {
  status?: number
  messages: AbacErrorMessage[]
  paths?: string[][]
}
