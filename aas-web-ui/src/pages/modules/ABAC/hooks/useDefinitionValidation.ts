import type { JsonErrorMessage } from '@/pages/modules/ABAC/components/shared/JsonCodeEditor.vue'
import type { AbacValidationMessages } from '@/pages/modules/ABAC/i18n/locales'
import type { Definition, DefinitionCreatePayload, DefinitionKind } from '@/pages/modules/ABAC/types/definitions'
import type { ZodError } from 'zod'
import { createDefinitionSchema } from '@/pages/modules/ABAC/schemas/definitionSchema'
import { extractLineFromSyntaxError, findLineForPath } from '@/pages/modules/ABAC/utils/json'
import { hasContent } from '@/utils/StringUtils'

export interface DefinitionValidationInput {
  json: string
  kind: DefinitionKind | undefined
  currentDefinition?: Definition
  name?: string | null
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
  const { SCHEMA_FOR_KIND, PATCH_SCHEMA_FOR_KIND } = createDefinitionSchema(messages)

  function validateJson ({ json, kind, currentDefinition, name, errorMessages }: DefinitionValidationInput): DefinitionValidationResult {
    if (!hasContent(kind)) {
      return { payload: null, error: { title: errorMessages.requiredKind }, errorLines: [] }
    }

    if (!hasContent(json)) {
      return { payload: null, error: { title: errorMessages.requiredDefinition }, errorLines: [] }
    }

    // JSON syntax validation
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

    // Patch flow: currentDefinition is only passed in patch flow
    if (currentDefinition) {
      const patchResult = PATCH_SCHEMA_FOR_KIND[kind].safeParse(parsed)
      // Check if passed input is valid
      if (!patchResult.success) {
        return formatSchemaError(patchResult.error, errorMessages.invalidDefinition, json)
      }

      const patch = patchResult.data
      const base: Record<string, unknown> = { ...currentDefinition }
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) {
          delete base[key]
        } else {
          base[key] = value
        }
      }

      // Check if expected definition is valid
      const mergedResult = SCHEMA_FOR_KIND[kind].safeParse(base)
      if (!mergedResult.success) {
        return formatSchemaError(mergedResult.error, errorMessages.invalidDefinition, json)
      }

      return { payload: patch as DefinitionCreatePayload, error: null, errorLines: [] }
    }

    // Structural validation against full schema
    const result = SCHEMA_FOR_KIND[kind].safeParse(parsed)

    return result.success
      ? { payload: result.data as DefinitionCreatePayload, error: null, errorLines: [] }
      : formatSchemaError(result.error, errorMessages.invalidDefinition, json)
  }

  function formatSchemaError (error: ZodError, title: string, json: string): DefinitionValidationResult {
    return {
      payload: null,
      error: {
        title,
        messages: error.issues.map(issue => {
          const path = issue.path.join('.') || '(root)'
          return `${path}: ${issue.message}`
        }),
      },
      errorLines: error.issues
        .map(issue => findLineForPath(json, issue.path))
        .filter((n): n is number => n !== null),
    }
  }

  return { validateJson }
}
