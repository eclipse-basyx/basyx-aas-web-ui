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
  validate: () => Promise<Result>
}

export function createQueryLanguageValidationScheduler<Result> ({
  debounceMs = 300,
  onError,
  onResult,
  validate,
}: QueryLanguageValidationSchedulerOptions<Result>): QueryLanguageValidationScheduler {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let revision = 0
  let isDisposed = false

  async function runValidation (scheduledRevision: number): Promise<void> {
    try {
      const result = await validate()
      if (!isDisposed && scheduledRevision === revision) {
        onResult(result)
      }
    } catch (error) {
      if (!isDisposed && scheduledRevision === revision) {
        onError(error)
      }
    }
  }

  return {
    dispose (): void {
      isDisposed = true
      revision += 1
      if (timeout) {
        clearTimeout(timeout)
      }
    },
    schedule (delay = debounceMs): void {
      revision += 1
      const scheduledRevision = revision

      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        timeout = undefined
        void runValidation(scheduledRevision)
      }, delay)
    },
  }
}
