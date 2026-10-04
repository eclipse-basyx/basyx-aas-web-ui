import type { EventKind, KindStyle } from './types'

export const KIND_STYLES: Record<EventKind, KindStyle> = {
  production: { kind: 'production', label: 'Production', color: 'success', icon: 'mdi-factory' },
  break: { kind: 'break', label: 'Break', color: 'warning', icon: 'mdi-coffee-outline' },
  maintenance: { kind: 'maintenance', label: 'Maintenance', color: 'error', icon: 'mdi-wrench-outline' },
  other: { kind: 'other', label: 'Other', color: 'grey', icon: 'mdi-calendar-blank-outline' },
}

const KIND_RULES: { kind: EventKind, pattern: RegExp }[] = [
  { kind: 'break', pattern: /break|pause/ },
  { kind: 'maintenance', pattern: /maint|service/ },
  { kind: 'production', pattern: /production|shift/ },
]

/**
 * Classifies an event from its CATEGORIES and X- property names (e.g. `X-BREAK`).
 * Categories win over X- properties; the first matching rule wins.
 */
export function resolveKind (categories: string[], xProperties: string[]): EventKind {
  for (const candidates of [categories, xProperties]) {
    const text = candidates.join(' ').toLowerCase()
    const rule = KIND_RULES.find(rule => rule.pattern.test(text))
    if (rule) {
      return rule.kind
    }
  }
  return 'other'
}
