import type { JsonErrorMessage } from '../../types/json'

/**
 * Finds the severity at a field or row path, including its descendants.
 * Backend/blocking errors take precedence over local schema advisories.
 */
export function diagnosticSeverity (errorPaths: string[][], warningPaths: string[][], ...prefix: string[]): 'error' | 'warning' | undefined {
  const matches = (path: string[]) => prefix.every((segment, index) => path[index] === segment)
  if (errorPaths.some(path => matches(path))) {
    return 'error'
  }
  if (warningPaths.some(path => matches(path))) {
    return 'warning'
  }
  return undefined
}

/**
 * Bind field severity and an accessible explanation while the summary retains
 * the detailed schema/backend message. Errors take precedence over advisories.
 */
export function diagnosticFieldProps (
  errorPaths: string[][],
  warningPaths: string[][],
  translate: (key: 'forms.validation.fieldError' | 'forms.validation.fieldWarning') => string,
  ...prefix: string[]
) {
  const severity = diagnosticSeverity(errorPaths, warningPaths, ...prefix)
  return {
    'class': { 'abac-field-warning': severity === 'warning' },
    'aria-invalid': severity === 'error',
    'error': severity === 'error',
    'baseColor': severity === 'warning' ? 'warning' : undefined,
    'color': severity === 'warning' ? 'warning' : undefined,
    'messages': severity ? [translate(severity === 'error' ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning')] : [],
  }
}

/**
 * Selects bounded section diagnostics by absolute location, with errors first.
 * Summary-only failures have no field location and remain in the dialog summary.
 */
export function sectionDiagnosticMessages (
  error: JsonErrorMessage | null | undefined,
  advisory: JsonErrorMessage | null | undefined,
  prefix: string[] = [],
  keys?: string[],
  excludeKeys: string[] = [],
): string[] {
  const matches = (path: string[]) => prefix.every((part, i) => path[i] === part)
    && (!keys || keys.includes(path[prefix.length] ?? ''))
    && !excludeKeys.includes(path[prefix.length] ?? '')
  const messages = [error, advisory].flatMap(diagnostic => {
    if (diagnostic?.issues) {
      return diagnostic.issues.filter(issue => matches(issue.path)).map(issue => issue.message)
    }
    return diagnostic?.paths?.some(path => matches(path)) ? (diagnostic.messages?.length ? diagnostic.messages : [diagnostic.title]) : []
  })
  return [...new Set(messages)]
}
