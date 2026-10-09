export type JsonObject = Record<string, unknown>

export interface JsonErrorMessage {
  title: string
  messages?: string[]
}
