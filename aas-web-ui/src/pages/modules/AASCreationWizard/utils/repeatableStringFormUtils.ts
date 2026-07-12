export function ensureStringArray (value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  return []
}

export function addStringRow (entries: string[]): string[] {
  return [...entries, '']
}

export function removeStringRow (entries: string[], index: number): string[] {
  const updated = [...entries]
  updated.splice(index, 1)
  return updated
}

export function updateStringRow (entries: string[], index: number, value: string): string[] {
  const updated = [...entries]
  updated[index] = value
  return updated
}
