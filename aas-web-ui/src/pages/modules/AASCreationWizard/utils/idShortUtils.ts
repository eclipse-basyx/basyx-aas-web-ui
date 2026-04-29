export function labelToIdShort (
  label: string,
  fallback: string,
): string {
  const words = label.trim().replace(/[^a-zA-Z0-9]+/g, '').split(' ').filter(Boolean)

  const idShort = words.map(word => capitalizeWord(word)).join('')

  if (!idShort) {
    return fallback
  }

  if (/^[0-9]/.test(idShort)) {
    return `${fallback}${idShort}`
  }

  return idShort
}

export function createUniqueIdShort (
  label: string,
  usedIdShorts: Set<string>,
  fallback: string,
): string {
  const baseIdShort = labelToIdShort(label, fallback)

  let candidate = baseIdShort
  let suffix = 2

  while (usedIdShorts.has(candidate)) {
    candidate = `${baseIdShort}_${suffix}`
    suffix += 1
  }

  usedIdShorts.add(candidate)

  return candidate
}

function capitalizeWord (word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
