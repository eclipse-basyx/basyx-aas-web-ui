import { describe, expect, it } from 'vitest'
import { getVariableInfo, normalizeVariableName } from '@/components/Plugins/Submodels/ProductionCalendar/variables'

describe('variables', () => {
  it('normalizes the spelling used by the template', () => {
    expect(normalizeVariableName('x_break')).toBe('X-BREAK')
    expect(normalizeVariableName(' X-Production-Day ')).toBe('X-PRODUCTION-DAY')
  })

  it('knows the three variables of the template', () => {
    expect(getVariableInfo('X_BREAK')?.kind).toBe('break')
    expect(getVariableInfo('X-MAINTENANCE')?.kind).toBe('maintenance')
    expect(getVariableInfo('X-PRODUCTION-DAY')?.label).toBe('Production day')
    expect(getVariableInfo('X-CUSTOM')).toBeUndefined()
  })
})
