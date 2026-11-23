/**
 * Placeholders of the asset, policy and contract templates: a string value `{{Label|Placeholder|Hint}}`,
 * e.g. `"baseUrl": "{{Base URL|https://…|URL of the backend}}"`. Placeholder text and hint are optional.
 *
 * Templates are filled on the object, so a value is inserted as a JSON value: it needs no escaping,
 * cannot add properties, and characters like `"`, `\` or `$&` have no special meaning.
 */

export interface TemplatePlaceholder {
  attribute: string // Property holding the placeholder, e.g. `baseUrl`; its first use for a label used several times
  attributes: string[] // All properties holding the placeholder
  label: string // Unique, the key of its value
  placeholder: string // '' if the template gives none
  hint: string // '' if the template gives none
}

const placeholderPattern = /^\{\{([^|}]*)(?:\|([^|}]*))?(?:\|([^}]*))?\}\}$/

function parsePlaceholder (value: unknown): Omit<TemplatePlaceholder, 'attribute' | 'attributes'> | null {
  if (typeof value !== 'string') {
    return null
  }
  const match = value.match(placeholderPattern)
  if (!match) {
    return null
  }
  return {
    label: match[1]!.trim(),
    placeholder: match[2]?.trim() ?? '',
    hint: match[3]?.trim() ?? '',
  }
}

/**
 * Returns the placeholders of a template, each label once, in the order of the template.
 */
export function templatePlaceholders (template: unknown): TemplatePlaceholder[] {
  const placeholders = new Map<string, TemplatePlaceholder>()

  function collect (value: unknown, attribute: string): void {
    const placeholder = parsePlaceholder(value)
    if (placeholder) {
      const existing = placeholders.get(placeholder.label)
      if (existing) {
        existing.attributes.push(attribute)
      } else {
        placeholders.set(placeholder.label, { attribute, attributes: [attribute], ...placeholder })
      }
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        collect(item, attribute)
      }
    } else if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        collect(item, key)
      }
    }
  }

  collect(template, '')
  return [...placeholders.values()]
}

/**
 * Replaces the placeholders of a template with the values given for their labels.
 * A placeholder without a value is removed with its property, or kept as `{{Label}}` with `keepUnfilled`, e.g. for a preview.
 */
export function fillTemplatePlaceholders (
  template: unknown,
  values: Record<string, string | undefined>,
  { keepUnfilled = false }: { keepUnfilled?: boolean } = {},
): unknown {
  const placeholder = parsePlaceholder(template)
  if (placeholder) {
    return values[placeholder.label] || (keepUnfilled ? `{{${placeholder.label}}}` : undefined)
  }
  if (Array.isArray(template)) {
    return template
      .map(item => fillTemplatePlaceholders(item, values, { keepUnfilled }))
      .filter(item => item !== undefined)
  }
  if (template !== null && typeof template === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(template)) {
      const filledValue = fillTemplatePlaceholders(value, values, { keepUnfilled })
      if (filledValue !== undefined) {
        result[key] = filledValue
      }
    }
    return result
  }
  return template
}
