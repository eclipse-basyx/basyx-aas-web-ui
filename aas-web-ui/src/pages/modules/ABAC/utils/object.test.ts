import { describe, expect, it } from 'vitest'
import { equals, isObject, mergeObjects } from './object'

describe('isObject', () => {
  it.each([{}, { name: 'shared' }])('accepts objects: %j', value => {
    expect(isObject(value)).toBe(true)
  })

  it.each([null, undefined, [], [1], 'text', 42, true])('rejects arrays and non-objects: %j', value => {
    expect(isObject(value)).toBe(false)
  })
})

describe('equals', () => {
  it('ignores object key order at every level', () => {
    expect(equals(
      { name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'] } },
      { acl: { RIGHTS: ['READ'], ACCESS: 'ALLOW' }, name: 'shared' },
    )).toBe(true)
  })

  it('detects changes in nested values', () => {
    expect(equals({ formula: { $boolean: true } }, { formula: { $boolean: false } })).toBe(false)
  })

  it('compares array contents and preserves their order', () => {
    expect(equals([{ CLAIM: 'role' }, { GLOBAL: 'ANONYMOUS' }], [{ CLAIM: 'role' }, { GLOBAL: 'ANONYMOUS' }])).toBe(true)
    expect(equals(['READ', 'UPDATE'], ['UPDATE', 'READ'])).toBe(false)
    expect(equals(['READ'], ['READ', 'UPDATE'])).toBe(false)
    expect(equals([], {})).toBe(false)
  })

  it('distinguishes missing properties from explicit null', () => {
    expect(equals({}, { value: null })).toBe(false)
    expect(equals({ value: null }, { value: null })).toBe(true)
  })

  it('compares primitive values without coercion', () => {
    expect(equals(1, 1)).toBe(true)
    expect(equals(1, '1')).toBe(false)
    expect(equals(null, undefined)).toBe(false)
  })

  it('treats method names as ordinary JSON properties', () => {
    const value = { toString: 'text', valueOf: 1, constructor: 'custom' }
    expect(equals(value, { ...value })).toBe(true)
    expect(equals(value, { ...value, valueOf: 2 })).toBe(false)
  })
})

describe('mergeObjects', () => {
  it('preserves omitted fields and deletes explicit nulls at every object level', () => {
    expect(mergeObjects(
      { name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], USEATTRIBUTES: 'old' }, extra: true },
      { acl: { USEATTRIBUTES: null, ATTRIBUTES: [{ CLAIM: 'role' }] }, extra: null },
    )).toEqual({ name: 'shared', acl: { ACCESS: 'ALLOW', RIGHTS: ['READ'], ATTRIBUTES: [{ CLAIM: 'role' }] } })
  })

  it('replaces arrays in full, including their object items', () => {
    expect(mergeObjects(
      { items: [{ a: 1, b: 2 }, { a: 3 }] },
      { items: [{ a: 4 }] },
    )).toEqual({ items: [{ a: 4 }] })
    expect(mergeObjects({ items: [1] }, { items: [] })).toEqual({ items: [] })
  })

  it('preserves nulls inside newly assigned objects to match the backend', () => {
    const value = { nested: null }
    expect(mergeObjects({}, { value })).toEqual({ value })
    expect(mergeObjects({ value: 1 }, { value })).toEqual({ value })
  })

  it('replaces an object with a primitive value', () => {
    expect(mergeObjects({ value: { nested: 1 } }, { value: false })).toEqual({ value: false })
  })

  it('does not mutate either input when merging nested objects', () => {
    const base = Object.freeze({ nested: Object.freeze({ keep: true, remove: 1 }), items: Object.freeze([1, 2]) })
    const patch = Object.freeze({ nested: Object.freeze({ remove: null, added: 3 }), items: Object.freeze([4]) })
    const merged = mergeObjects(base, patch)

    expect(merged).toEqual({ nested: { keep: true, added: 3 }, items: [4] })
    expect(base).toEqual({ nested: { keep: true, remove: 1 }, items: [1, 2] })
    expect(patch).toEqual({ nested: { remove: null, added: 3 }, items: [4] })
    expect(merged).not.toBe(base)
    expect(merged.nested).not.toBe(base.nested)
  })

  it('treats a __proto__ key as an own property instead of a prototype mutation', () => {
    const merged = mergeObjects({}, JSON.parse('{"__proto__": {"x": 1}}'))
    expect(Object.hasOwn(merged, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
  })
})
