// scheduler implementation moved to the shared Code
export {
  createValidationScheduler as createQueryLanguageValidationScheduler,
  getValidationSchedulerErrorMessage as getQueryLanguageValidationErrorMessage,
  isValidationSchedulerStartupError as isQueryLanguageValidationStartupError,
  type ValidationScheduler as QueryLanguageValidationScheduler,
} from '@/components/Code/validationScheduler'

export interface QueryLanguageValidation {
  isValid: boolean
  messages: string[]
}
