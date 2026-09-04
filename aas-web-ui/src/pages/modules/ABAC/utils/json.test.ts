import { describe, expect, it } from 'vitest'
import { extractLineFromSyntaxError, findLineForPath } from '@/pages/modules/ABAC/utils/json'

describe('ABAC JSON Error Location Utilities', () => {
  describe('extractLineFromSyntaxError', () => {
    it('returns the correct 1-based line from a V8 SyntaxError message', () => {
      const json = '{\n  "key": "value",\n  "missing": }'
      // position of the stray ',' after "value" — V8 reports the position
      const message = 'Unexpected token } in JSON at position 28'
      const line = extractLineFromSyntaxError(json, message)
      expect(line).toBe(3) // line 3: '  "missing": }'
    })

    it('returns line 1 for position 0', () => {
      const json = 'invalid'
      const line = extractLineFromSyntaxError(json, 'Unexpected token i in JSON at position 0')
      expect(line).toBe(1)
    })

    it('returns null when the message has no position clause', () => {
      const json = '{}'
      const line = extractLineFromSyntaxError(json, 'Something went wrong')
      expect(line).toBeNull()
    })

    it('returns null for an empty message', () => {
      const json = '{}'
      const line = extractLineFromSyntaxError(json, '')
      expect(line).toBeNull()
    })

    it('handles multi-line JSON correctly', () => {
      const json = '{\n  "a": 1,\n  "b": true,\n  "c": [\n    1,\n    2\n  ]\n}'
      // position at character 40 — should land around line 3 or 4
      const message = 'Unexpected token at position 40'
      const line = extractLineFromSyntaxError(json, message)
      expect(line).toBeGreaterThanOrEqual(3)
      expect(line).toBeLessThanOrEqual(5)
    })
  })

  describe('findLineForPath', () => {
    const multilineJson = [
      '{',
      '  "ACL": {',
      '    "ACCESS": "ALLOW",',
      '    "RIGHTS": ["READ"],',
      '    "ATTRIBUTES": [',
      '      { "CLAIM": "role" }',
      '    ]',
      '  },',
      '  "OBJECTS": [',
      '    { "ROUTE": "/**" }',
      '  ]',
      '}',
    ].join('\n')

    it('finds the line for a single-key path', () => {
      const line = findLineForPath(multilineJson, ['ACL'])
      expect(line).toBe(2) // line 2: '  "ACL": {'
    })

    it('finds the line for a nested two-key path', () => {
      const line = findLineForPath(multilineJson, ['ACL', 'ACCESS'])
      expect(line).toBe(3) // line 3: '    "ACCESS": "ALLOW",'
    })

    it('finds the line for a deeply nested path', () => {
      const line = findLineForPath(multilineJson, ['ACL', 'ATTRIBUTES'])
      expect(line).toBe(5) // line 5: '    "ATTRIBUTES": ['
    })

    it('finds the line for OBJECTS key', () => {
      const line = findLineForPath(multilineJson, ['OBJECTS'])
      expect(line).toBe(9) // line 9: '  "OBJECTS": ['
    })

    it('returns null when a key is not found', () => {
      const line = findLineForPath(multilineJson, ['NONEXISTENT'])
      expect(line).toBeNull()
    })

    it('returns null when an intermediate key is found but the final key is not', () => {
      const line = findLineForPath(multilineJson, ['ACL', 'NONEXISTENT'])
      expect(line).toBeNull()
    })

    it('returns null for an empty path array', () => {
      const line = findLineForPath(multilineJson, [])
      expect(line).toBeNull()
    })

    it('filters out numeric path segments and treats string keys correctly', () => {
      const line = findLineForPath(multilineJson, ['OBJECTS', 0, 'ROUTE'])
      expect(line).toBe(10) // line 10: '    { "ROUTE": "/**" }'
    })
  })
})
