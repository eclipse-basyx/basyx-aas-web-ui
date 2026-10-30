import { describe, expect, it } from 'vitest'
import { formatSchemaIssues } from './formatSchemaIssues'
import { enValidationMessages } from './validationMessages'

describe('formatSchemaIssues', () => {
  it('caps distinct direct summaries without dropping their detailed paths', () => {
    const issues = ['First', 'Second', 'Third', 'Fourth'].map((message, index) => ({ path: [String(index)], message }))
    const result = formatSchemaIssues({ issues }, 'Warning', enValidationMessages)
    expect(result.summary).toEqual(['First', 'Second', 'Third'])
    expect(result.paths).toEqual(issues.map(issue => issue.path))
    expect(result.messages).toHaveLength(4)
  })

  it('preserves paths, array indices, root errors, and localized issue text', () => {
    expect(formatSchemaIssues({ issues: [
      { path: ['FORMULA', '$and', '1', '$boolean'], message: 'Invalid boolean' },
      { path: [], message: 'Invalid document' },
    ] }, 'Validation warning', enValidationMessages)).toEqual({
      title: 'Validation warning',
      issues: [
        { path: ['FORMULA', '$and', '1', '$boolean'], message: 'Invalid boolean' },
        { path: [], message: 'Invalid document' },
      ],
      paths: [['FORMULA', '$and', '1', '$boolean'], []],
      messages: ['FORMULA.$and.1.$boolean: Invalid boolean', '(root): Invalid document'],
      summary: ['Invalid boolean', 'Invalid document'],
    })
  })

  it('reports the exact omitted count after the message limit', () => {
    const issues = Array.from({ length: 53 }, (_, index) => ({ path: [String(index)], message: 'Invalid value' }))
    const result = formatSchemaIssues({ issues }, 'Warning', enValidationMessages)
    expect(result.messages).toHaveLength(51)
    expect(result.messages?.[49]).toBe('49: Invalid value')
    expect(result.messages?.at(-1)).toBe(enValidationMessages.schemaMoreIssues.replace('{count}', '3'))
  })

  it('keeps alternative-branch noise in the details and preserves every diagnostic path', () => {
    const issues = [
      { path: ['FORMULA', '$eq', '0', '$strVal'], message: enValidationMessages.schemaPattern },
      { path: ['FORMULA', '$eq', '0', '$numVal'], message: enValidationMessages.schemaRequired },
      { path: ['FORMULA', '$eq'], message: enValidationMessages.schemaOneOf },
      { path: ['FORMULA', '$eq', '1', '$strVal'], message: enValidationMessages.schemaPattern },
    ]
    const result = formatSchemaIssues({ issues }, 'Warning', enValidationMessages)
    expect(result.summary).toEqual([enValidationMessages.schemaPattern])
    expect(result.messages).toHaveLength(4)
    expect(result.paths).toEqual(issues.map(issue => issue.path))
  })
})
