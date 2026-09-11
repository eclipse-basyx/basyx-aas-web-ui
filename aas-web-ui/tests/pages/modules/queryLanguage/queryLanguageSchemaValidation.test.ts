import { describe, expect, it } from 'vitest'
import { validateQueryLanguageSchema } from '@/pages/modules/queryLanguage/queryLanguageSchemaValidation'

describe('validateQueryLanguageSchema', () => {
  it('accepts a valid Query Language query', async () => {
    const result = await validateQueryLanguageSchema(JSON.stringify({
      $condition: {
        $contains: [
          { $field: '$aas#idShort' },
          { $strVal: 'Example' },
        ],
      },
    }))

    expect(result).toEqual({ isValid: true, message: '' })
  })

  it('rejects parseable JSON with unsupported Query Language operators', async () => {
    const result = await validateQueryLanguageSchema(JSON.stringify({
      $condition: { $unsupported: [] },
    }))

    expect(result.isValid).toBe(false)
    expect(result.message).toContain('AAS Query Language schema')
  })
})
