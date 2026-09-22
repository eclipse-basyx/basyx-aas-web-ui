import type { z } from 'zod'

export function toNullish<T extends z.ZodRawShape> (s: z.ZodObject<T>) {
  return Object.fromEntries(
    Object.entries(s.shape).map(([k, v]) => [k, (v as z.ZodTypeAny).nullish()]),
  ) as unknown as { [K in keyof T]: z.ZodOptional<z.ZodNullable<T[K]>> }
}
