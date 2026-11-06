import type { FragmentTarget } from './fragments'
import { describe, expect, it } from 'vitest'
import schema from '@/schemas/access-rules/aas-queries-and-access-rules-3.2.schema.json'
import { FRAGMENT_PATHS, readFragment, writeFragment } from './fragments'

const fragmentPattern = new RegExp(schema.definitions.FragmentFieldIdentifier.pattern)

describe('guided fragment syntax', () => {
  it('offers only schema-valid suggestions for every target', () => {
    for (const target of Object.keys(FRAGMENT_PATHS) as FragmentTarget[]) {
      for (const field of FRAGMENT_PATHS[target]) {
        const value = writeFragment(target, field)
        expect(value).toMatch(fragmentPattern)
        expect(readFragment(value)).toEqual({ target, field, path: '' })
      }
    }
  })

  it.each(['$sme.Motor.Temperature#value', '$sme.Sensors[0]#semanticId.keys[2]', '$sme.Sensors[]', '$aas#submodels[12].keys[0]'])('round-trips existing selectors without normalizing indices: %s', value => {
    const parsed = readFragment(value)!
    expect(value).toMatch(fragmentPattern)
    expect(writeFragment(parsed.target, parsed.field, parsed.path)).toBe(value)
  })

  it.each(['custom', '$bd#idShort', '$aas', '$aas.path#idShort'])('leaves unfamiliar syntax in custom mode: %s', value => {
    expect(readFragment(value)).toBeUndefined()
  })
})
