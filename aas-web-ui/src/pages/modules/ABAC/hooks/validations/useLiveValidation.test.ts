import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLiveValidation } from './useLiveValidation'

afterEach(() => vi.useRealTimers())

function createValidation () {
  vi.useFakeTimers()
  const scope = effectScope()
  const enabled = ref(false)
  const text = ref('valid')
  const validate = vi.fn((input: string) => {
    if (input === 'invalid') {
      return { payload: null, error: { title: 'Invalid JSON' } }
    }
    return {
      payload: { text: input },
      error: input === 'warning' ? { title: 'Schema issue', paths: [['FORMULA']] } : null,
    }
  })
  const state = scope.run(() => useLiveValidation({
    enabled: () => enabled.value,
    input: () => text.value,
    validate,
  }))!
  return { scope, enabled, text, validate, ...state }
}

describe('live editor validation', () => {
  it('debounces changes and validates only the latest input while open', () => {
    const state = createValidation()
    try {
      vi.advanceTimersByTime(500)
      expect(state.validate).not.toHaveBeenCalled()
      state.enabled.value = true
      state.text.value = 'intermediate'
      vi.advanceTimersByTime(200)
      state.text.value = 'warning'
      vi.advanceTimersByTime(299)
      expect(state.validate).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(state.validate).toHaveBeenCalledExactlyOnceWith('warning')
      expect(state.advisory.value?.paths).toEqual([['FORMULA']])
      expect(state.error.value).toBeNull()
      const previousAdvisory = state.advisory.value
      state.text.value = 'intermediate'
      vi.advanceTimersByTime(200)
      expect(state.advisory.value).toBe(previousAdvisory)
      state.text.value = 'warning'
      vi.advanceTimersByTime(300)
      expect(state.advisory.value?.paths).toEqual([['FORMULA']])
    } finally {
      state.scope.stop()
    }
  })

  it('flushes pending validation on submit and distinguishes blocking errors from advisories', () => {
    const state = createValidation()
    try {
      state.enabled.value = true
      state.text.value = 'invalid'
      expect(state.validateNow().payload).toBeNull()
      expect(state.error.value?.title).toBe('Invalid JSON')
      expect(state.advisory.value).toBeNull()
      vi.advanceTimersByTime(500)
      expect(state.validate).toHaveBeenCalledTimes(1)
      state.text.value = 'warning'
      expect(state.validateNow().payload).toEqual({ text: 'warning' })
      expect(state.error.value).toBeNull()
      expect(state.advisory.value).not.toBeNull()
    } finally {
      state.scope.stop()
    }
  })

  it('clears save failures on edits while retaining advisories until revalidation', () => {
    const state = createValidation()
    try {
      state.enabled.value = true
      state.text.value = 'warning'
      state.validateNow()
      state.saveError.value = { title: 'Save failed' }
      expect(state.error.value?.title).toBe('Save failed')
      expect(state.advisory.value?.paths).toEqual([['FORMULA']])
      expect(state.errorPaths.value).toEqual([])
      state.saveError.value = { title: 'Duplicate name', paths: [['name']] }
      expect(state.errorPaths.value).toEqual([['name']])
      state.text.value = 'valid'
      expect(state.error.value).toBeNull()
      expect(state.advisory.value?.paths).toEqual([['FORMULA']])
      vi.advanceTimersByTime(300)
      expect(state.advisory.value).toBeNull()
    } finally {
      state.scope.stop()
    }
  })

  it('keeps blocking errors visible during typing and replaces them only after validation', () => {
    const state = createValidation()
    try {
      state.enabled.value = true
      state.text.value = 'invalid'
      state.validateNow()
      const originalError = state.error.value
      state.text.value = 'still typing'
      vi.advanceTimersByTime(200)
      expect(state.error.value).toBe(originalError)
      state.text.value = 'invalid'
      vi.advanceTimersByTime(300)
      expect(state.error.value?.title).toBe('Invalid JSON')
      state.text.value = 'valid'
      vi.advanceTimersByTime(299)
      expect(state.error.value?.title).toBe('Invalid JSON')
      vi.advanceTimersByTime(1)
      expect(state.error.value).toBeNull()
      state.text.value = 'warning'
      state.validateNow()
      state.enabled.value = false
      expect(state.advisory.value).toBeNull()
      expect(state.error.value).toBeNull()
    } finally {
      state.scope.stop()
    }
  })

  it('cancels scheduled work when closing or disposing the editor', () => {
    const state = createValidation()
    state.enabled.value = true
    state.text.value = 'warning'
    state.enabled.value = false
    vi.advanceTimersByTime(500)
    expect(state.validate).not.toHaveBeenCalled()
    state.enabled.value = true
    state.scope.stop()
    vi.advanceTimersByTime(500)
    expect(state.validate).not.toHaveBeenCalled()
  })
})
