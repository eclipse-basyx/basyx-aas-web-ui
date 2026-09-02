export interface QueryLanguageValidation {
  isValid: boolean
  messages: string[]
}

export interface QueryLanguageValidationScheduler {
  dispose: () => void
  schedule: (delay?: number) => void
}

interface QueryLanguageValidationSchedulerOptions<Result> {
  debounceMs?: number
  onError: (error: unknown) => void
  onResult: (result: Result) => void
  retryCount?: number
  retryDelayMs?: number
  shouldRetry?: (error: unknown) => boolean
  validate: () => Promise<Result>
}

export function getQueryLanguageValidationErrorMessage (error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return 'Unknown validation error'
}

export function isQueryLanguageValidationStartupError (error: unknown): boolean {
  return getQueryLanguageValidationErrorMessage(error) === 'JSON not registered!'
}

export function createQueryLanguageValidationScheduler<Result> ({
  debounceMs = 300,
  onError,
  onResult,
  retryCount = 6,
  retryDelayMs = 50,
  shouldRetry = () => false,
  validate,
}: QueryLanguageValidationSchedulerOptions<Result>): QueryLanguageValidationScheduler {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let revision = 0
  let isDisposed = false

  async function runValidation (scheduledRevision: number, retryAttempt = 0): Promise<void> {
    try {
      const result = await validate()
      if (!isDisposed && scheduledRevision === revision) {
        onResult(result)
      }
    } catch (error) {
      if (isDisposed || scheduledRevision !== revision) {
        return
      }

      if (retryAttempt < retryCount && shouldRetry(error)) {
        const retryInMs = retryDelayMs * 2 ** retryAttempt
        timeout = setTimeout(() => {
          timeout = undefined
          void runValidation(scheduledRevision, retryAttempt + 1)
        }, retryInMs)
      } else {
        onError(error)
      }
    }
  }

  return {
    dispose (): void {
      isDisposed = true
      revision += 1
      if (timeout !== undefined) {
        clearTimeout(timeout)
        timeout = undefined
      }
    },
    schedule (delay = debounceMs): void {
      revision += 1
      const scheduledRevision = revision

      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        timeout = undefined
        void runValidation(scheduledRevision)
      }, delay)
    },
  }
}
