import { mergeQueryLanguageSchemaRegistration } from '@/pages/modules/queryLanguage/queryLanguageDiagnostics'

export const queryLanguageSchemas = mergeQueryLanguageSchemaRegistration()

export {
  type CodeDiagnostic as QueryLanguageError,
  validateJsonDocument as validateQueryLanguageDocument,
} from '@/components/Code/monacoRuntime'
