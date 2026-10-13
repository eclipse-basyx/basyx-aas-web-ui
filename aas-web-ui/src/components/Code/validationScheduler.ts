export interface ValidationScheduler {
  dispose: () => void
  schedule: (delay?: number) => void
}

interface ValidationSchedulerOptions<Result> {
  debounceMs?: number
  onError: (error: unknown) => void
  onResult: (result: Result) => void
  retryCount?: number
  retryDelayMs?: number
  shouldRetry?: (error: unknown) => boolean
  validate: () => Promise<Result>
}

export function getValidationSchedulerErrorMessage (error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return 'Unknown validation error'
}

export function isValidationSchedulerStartupError (error: unknown): boolean {
  return getValidationSchedulerErrorMessage(error) === 'JSON not registered!'
}

export function createValidationScheduler<Result> ({
  debounceMs = 300,
  onError,
  onResult,
  retryCount = 6,
  retryDelayMs = 50,
  shouldRetry = () => false,
  validate,
}: ValidationSchedulerOptions<Result>): ValidationScheduler {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let revision = 0
  let isDisposed = false

  async function runValidation (scheduledRevision: number, retryAttempt = 0): Promise<void> {
    if (isDisposed || scheduledRevision !== revision) {
      return
    }
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
      if (isDisposed) {
        return
      }
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
