import type { JsonObject } from '../types/json'

export function isObject (value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function equals (left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => equals(value, right[index]))
  }
  if (isObject(left) && isObject(right)) {
    return Object.keys(left).length === Object.keys(right).length
      && Object.keys(left).every(key => Object.hasOwn(right, key) && equals(left[key], right[key]))
  }
  return left === right
}

// Mirrors BaSyx Go's mergeJSONObjects: recurse only when both values are objects.
export function mergeObjects (base: JsonObject, patch: JsonObject): JsonObject {
  const merged = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete merged[key]
    } else {
      const previous = Object.hasOwn(base, key) ? base[key] : undefined
      // defineProperty instead of assignment so a submitted "__proto__" key
      // becomes an own property instead of mutating the prototype.
      Object.defineProperty(merged, key, {
        value: isObject(previous) && isObject(value) ? mergeObjects(previous, value) : value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
  }
  return merged
}
