import type { JsonErrorMessage } from '../components/shared/JsonCodeEditor.vue'
import type { AbacValidationMessages } from '../i18n/locales'
import type { DefinitionCreatePayload, DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import { hasContent } from '@/utils/StringUtils'
import { createDefinitionSchema } from '../schemas/definitionSchema'
import { extractLineFromSyntaxError, findLineForPath } from '../utils/json'

export interface DefinitionValidationInput {
  json: string
  kind: DefinitionKind | undefined
  name?: string
  errorMessages: {
    requiredKind: string
    requiredDefinition: string
    invalidJson: string
    invalidDefinition: string
  }
}

export interface DefinitionValidationResult {
  payload: DefinitionCreatePayload | null
  error: JsonErrorMessage | null
  errorLines: number[]
}

export function useDefinitionValidation (messages: AbacValidationMessages) {
  const { schemaForKind } = createDefinitionSchema(messages)

  function validateJson ({ json, kind, name, errorMessages }: DefinitionValidationInput): DefinitionValidationResult {
    if (!hasContent(kind)) {
      return { payload: null, error: { title: errorMessages.requiredKind }, errorLines: [] }
    }

    if (!hasContent(json)) {
      return { payload: null, error: { title: errorMessages.requiredDefinition }, errorLines: [] }
    }

    // 1) JSON syntax
    let parsed: unknown
    try {
      const obj = JSON.parse(json)
      // Re-attach the name that was stripped from the editor JSON in case of replace or patch
      if (hasContent(name)) {
        obj.name = name
      }
      parsed = obj
    } catch (error) {
      const detail = (error as Error).message
      const errorLine = extractLineFromSyntaxError(json, detail)
      return {
        payload: null,
        error: { title: errorMessages.invalidJson, messages: [detail] },
        errorLines: errorLine ? [errorLine] : [],
      }
    }

    // 2) Structural validation
    const result = schemaForKind(kind!).safeParse(parsed)
    if (!result.success) {
      return {
        payload: null,
        error: {
          title: errorMessages.invalidDefinition,
          messages: result.error.issues.map(issue => {
            const path = issue.path.join('.') || '(root)'
            return `${path}: ${issue.message}`
          }),
        },
        errorLines: result.error.issues
          .map(issue => findLineForPath(json, issue.path))
          .filter((n): n is number => n !== null),
      }
    }

    return { payload: result.data as DefinitionCreatePayload, error: null, errorLines: [] }
  }

  return { validateJson }
}
