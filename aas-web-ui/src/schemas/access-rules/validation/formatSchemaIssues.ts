import type { SchemaIssues } from './accessRulesValidation'
import type { SchemaValidationMessages } from './validationMessages'

export interface SchemaIssueMessage {
  title: string
  messages: string[]
  summary: string[]
  issues: { path: string[], message: string }[]
  paths: string[][]
}

const MAX_SCHEMA_MESSAGES = 50

/**
 * Formats localized schema issues with their JSON paths for advisory error display.
 * Provides a short overview and up to 50 technical messages plus an omitted count.
 * Alternative-branch diagnostics remain in the details rather than crowding the overview.
 * Monaco handles editor
 * diagnostic positions separately; this formatter does not calculate line numbers.
 *
 * @param error Schema issues from validating the document or effective merged update.
 * @param title Localized error heading.
 * @param messages Localized validation messages, including the omitted-issue template.
 * @returns Error heading, bounded display messages, and full structured paths for section indicators.
 */
export function formatSchemaIssues (error: SchemaIssues, title: string, messages: SchemaValidationMessages): SchemaIssueMessage {
  const issueMessages = error.issues.slice(0, MAX_SCHEMA_MESSAGES).map(issue => {
    const path = issue.path.join('.') || '(root)'
    return `${path}: ${issue.message}`
  })
  if (error.issues.length > MAX_SCHEMA_MESSAGES) {
    issueMessages.push(messages.schemaMoreIssues.replace('{count}', String(error.issues.length - MAX_SCHEMA_MESSAGES)))
  }
  const alternativeMessages = new Set([messages.schemaRequired, messages.schemaAdditional, messages.schemaOneOf, messages.schemaAnyOf])
  const directIssues = error.issues.filter(issue => !alternativeMessages.has(issue.message))
  const summary = [...new Set((directIssues.length > 0 ? directIssues : error.issues).map(issue => issue.message))].slice(0, 3)
  return { title, messages: issueMessages, summary, issues: error.issues, paths: error.issues.map(issue => issue.path) }
}
