import type { ZodType } from 'zod'

export type Rule<T> = (v: T) => true | string

/**
 * Wraps a Zod schema into a Vuetify field-level rule.
 * Returns `true` on success, or the first issue message on failure.
 */
export function zodRule<T> (schema: ZodType<T>): Rule<T> {
  return (value: T): true | string => {
    const result = schema.safeParse(value)
    return result.success || (result.error.issues[0]?.message ?? 'Invalid value')
  }
}
