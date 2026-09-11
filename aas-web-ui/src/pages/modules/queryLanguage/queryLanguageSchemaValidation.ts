import type { ErrorObject, ValidateFunction } from 'ajv'
import Ajv from 'ajv'
import { queryLanguageSchema } from './queryLanguageSchema'

export interface QueryLanguageSchemaValidation {
  isValid: boolean
  message: string
}

let validator: ValidateFunction | undefined

export async function validateQueryLanguageSchema (
  queryText: string,
): Promise<QueryLanguageSchemaValidation> {
  let query: unknown
  try {
    query = JSON.parse(queryText)
  } catch {
    return { isValid: false, message: 'The query must contain valid JSON.' }
  }

  let validate: ValidateFunction
  try {
    validate = getValidator()
  } catch {
    return { isValid: false, message: 'The AAS Query Language schema could not be loaded.' }
  }
  if (validate(query)) {
    return { isValid: true, message: '' }
  }

  return {
    isValid: false,
    message: formatValidationError(validate.errors?.[0]),
  }
}

function getValidator (): ValidateFunction {
  validator ??= (() => {
    const ajv = new Ajv({ allErrors: true, strict: false })
    return ajv.compile(queryLanguageSchema)
  })()
  return validator
}

function formatValidationError (error: ErrorObject | null | undefined): string {
  if (!error) {
    return 'The query does not match the AAS Query Language schema.'
  }

  const location = error.instancePath || 'query'
  return `The query does not match the AAS Query Language schema: ${location} ${error.message ?? 'is invalid'}.`
}
