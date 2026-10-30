import { describe, expect, it } from 'vitest'
import { de, en } from './locales'

function flatten (value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(value)) {
      flatten(entry, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out[prefix] = String(value)
  }
  return out
}

describe('ABAC locale placeholders', () => {
  const flatEn = flatten(en)
  const flatDe = flatten(de)

  it('uses the same interpolation placeholders in en and de', () => {
    const placeholder = /\{[^}]+\}/g
    for (const key of Object.keys(flatEn)) {
      const enPlaceholders = (flatEn[key].match(placeholder) ?? []).toSorted()
      const dePlaceholders = (flatDe[key].match(placeholder) ?? []).toSorted()
      expect(dePlaceholders, `placeholders of ${key}`).toEqual(enPlaceholders)
    }
  })
})
