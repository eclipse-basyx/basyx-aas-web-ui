import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createQueryLanguageValidationScheduler,
  getQueryLanguageValidationErrorMessage,
  isQueryLanguageValidationStartupError,
} from '@/pages/modules/queryLanguage/queryLanguageValidation'

interface Deferred<Result> {
  promise: Promise<Result>
  resolve: (result: Result) => void
}

function createDeferred<Result> (): Deferred<Result> {
  let resolvePromise: (result: Result) => void = () => {}
  const promise = new Promise<Result>(resolve => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: resolvePromise,
  }
}

describe('query language validation scheduler', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces consecutive content changes', async () => {
    vi.useFakeTimers()
    const validate = vi.fn().mockResolvedValue([])
    const onResult = vi.fn()
    const scheduler = createQueryLanguageValidationScheduler({
      debounceMs: 300,
      onError: vi.fn(),
      onResult,
      validate,
    })

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(200)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(299)

    expect(validate).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(validate).toHaveBeenCalledOnce()
    expect(onResult).toHaveBeenCalledOnce()
    scheduler.dispose()
  })

  it('ignores an in-flight result after a newer change', async () => {
    vi.useFakeTimers()
    const firstValidation = createDeferred<string>()
    const secondValidation = createDeferred<string>()
    const validate = vi.fn()
      .mockReturnValueOnce(firstValidation.promise)
      .mockReturnValueOnce(secondValidation.promise)
    const onResult = vi.fn()
    const scheduler = createQueryLanguageValidationScheduler({
      debounceMs: 0,
      onError: vi.fn(),
      onResult,
      validate,
    })

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(0)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(0)

    firstValidation.resolve('stale')
    await Promise.resolve()

    expect(onResult).not.toHaveBeenCalled()

    secondValidation.resolve('current')
    await Promise.resolve()

    expect(onResult).toHaveBeenCalledOnce()
    expect(onResult).toHaveBeenCalledWith('current')
    scheduler.dispose()
  })

  it('retries a transient worker activation failure', async () => {
    vi.useFakeTimers()
    const validate = vi.fn()
      .mockRejectedValueOnce('JSON not registered!')
      .mockResolvedValueOnce([])
    const onError = vi.fn()
    const onResult = vi.fn()
    const scheduler = createQueryLanguageValidationScheduler({
      debounceMs: 0,
      onError,
      onResult,
      shouldRetry: isQueryLanguageValidationStartupError,
      validate,
    })

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(0)

    expect(validate).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)

    expect(validate).toHaveBeenCalledTimes(2)
    expect(onResult).toHaveBeenCalledWith([])
    expect(onError).not.toHaveBeenCalled()
    scheduler.dispose()
  })

  it('formats string rejections without displaying undefined', () => {
    expect(getQueryLanguageValidationErrorMessage('JSON not registered!'))
      .toBe('JSON not registered!')
    expect(getQueryLanguageValidationErrorMessage(new Error('Worker failed')))
      .toBe('Worker failed')
    expect(getQueryLanguageValidationErrorMessage(undefined))
      .toBe('Unknown validation error')
    expect(isQueryLanguageValidationStartupError('JSON not registered!')).toBe(true)
    expect(isQueryLanguageValidationStartupError(new Error('Worker failed'))).toBe(false)
  })
})
