import type { SchemaIssueError } from './accessRulesValidation'
import type { SchemaValidationMessages } from './validationMessages'

export interface SchemaIssueMessage {
  title: string
  messages: string[]
}

const MAX_SCHEMA_MESSAGES = 50

/**
 * Formats localized schema issues with their JSON paths for advisory error display.
 * Shows up to 50 messages plus a localized omitted count. Monaco handles editor
 * diagnostic positions separately; this formatter does not calculate line numbers.
 *
 * @param error Schema issues from validating the document or effective merged update.
 * @param title Localized error heading.
 * @param messages Localized validation messages, including the omitted-issue template.
 * @returns Error heading and bounded list of messages with JSON paths.
 */
export function formatSchemaIssues (error: SchemaIssueError, title: string, messages: SchemaValidationMessages): SchemaIssueMessage {
  const issueMessages = error.issues.slice(0, MAX_SCHEMA_MESSAGES).map(issue => {
    const path = issue.path.join('.') || '(root)'
    return `${path}: ${issue.message}`
  })
  if (error.issues.length > MAX_SCHEMA_MESSAGES) {
    issueMessages.push(messages.schemaMoreIssues.replace('{count}', String(error.issues.length - MAX_SCHEMA_MESSAGES)))
  }
  return { title, messages: issueMessages }
}
