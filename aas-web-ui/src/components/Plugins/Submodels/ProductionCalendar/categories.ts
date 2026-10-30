import type { EventKind, KindStyle } from './types'

export const KIND_STYLES: Record<EventKind, KindStyle> = {
  production: { kind: 'production', label: 'Production', color: 'success', icon: 'mdi-factory' },
  break: { kind: 'break', label: 'Break', color: 'warning', icon: 'mdi-coffee-outline' },
  maintenance: { kind: 'maintenance', label: 'Maintenance', color: 'error', icon: 'mdi-wrench-outline' },
  other: { kind: 'other', label: 'Other', color: 'grey', icon: 'mdi-calendar-blank-outline' },
}

const CATEGORY_RULES: { kind: EventKind, pattern: RegExp }[] = [
  { kind: 'break', pattern: /break|pause/ },
  { kind: 'maintenance', pattern: /maint|service/ },
  { kind: 'production', pattern: /production|shift/ },
]

/** Classifies an event by its CATEGORIES. The IDTA template does not define categories, this is a fallback. */
export function kindFromCategories (categories: string[]): EventKind | undefined {
  const text = categories.join(' ').toLowerCase()
  return CATEGORY_RULES.find(rule => rule.pattern.test(text))?.kind
}
