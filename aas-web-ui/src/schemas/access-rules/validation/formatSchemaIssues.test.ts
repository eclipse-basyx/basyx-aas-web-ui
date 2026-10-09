import { describe, expect, it } from 'vitest'
import { formatSchemaIssues } from './formatSchemaIssues'
import { enValidationMessages } from './validationMessages'

describe('formatSchemaIssues', () => {
  it('preserves paths, array indices, root errors, and localized issue text', () => {
    expect(formatSchemaIssues({ issues: [
      { path: ['FORMULA', '$and', '1', '$boolean'], message: 'Invalid boolean' },
      { path: [], message: 'Invalid document' },
    ] }, 'Validation warning', enValidationMessages)).toEqual({
      title: 'Validation warning',
      messages: ['FORMULA.$and.1.$boolean: Invalid boolean', '(root): Invalid document'],
    })
  })

  it('reports the exact omitted count after the message limit', () => {
    const issues = Array.from({ length: 53 }, (_, index) => ({ path: [String(index)], message: 'Invalid value' }))
    const result = formatSchemaIssues({ issues }, 'Warning', enValidationMessages)
    expect(result.messages).toHaveLength(51)
    expect(result.messages?.[49]).toBe('49: Invalid value')
    expect(result.messages?.at(-1)).toBe(enValidationMessages.schemaMoreIssues.replace('{count}', '3'))
  })
})
