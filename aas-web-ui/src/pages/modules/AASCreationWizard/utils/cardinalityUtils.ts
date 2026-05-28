import type { CardinalityInfo, CardinalityKind, TemplateElement } from '../types/template'

function isQualifierRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getMultiplicityQualifierValue (element: TemplateElement): CardinalityKind {
  const qualifiers = Array.isArray(element.qualifiers) ? element.qualifiers : []

  for (const qualifier of qualifiers) {
    if (!isQualifierRecord(qualifier)) {
      continue
    }

    const type = qualifier.type
    const value = qualifier.value

    if ((type === 'SMT/Cardinality' || type === 'Multiplicity') && typeof value === 'string' && (
      value === 'One'
      || value === 'ZeroToOne'
      || value === 'ZeroToMany'
      || value === 'OneToMany'
    )) {
      return value
    }
  }

  return 'Unknown'
}

export function parseCardinality (element: TemplateElement): CardinalityInfo {
  const raw = getMultiplicityQualifierValue(element)

  switch (raw) {
    case 'One': {
      return {
        raw,
        required: true,
        repeatable: false,
        minOccurs: 1,
        maxOccurs: 1,
      }
    }

    case 'ZeroToOne': {
      return {
        raw,
        required: false,
        repeatable: false,
        minOccurs: 0,
        maxOccurs: 1,
      }
    }

    case 'ZeroToMany': {
      return {
        raw,
        required: false,
        repeatable: true,
        minOccurs: 0,
        maxOccurs: null,
      }
    }

    case 'OneToMany': {
      return {
        raw,
        required: true,
        repeatable: true,
        minOccurs: 1,
        maxOccurs: null,
      }
    }

    default: {
      return {
        raw: 'Unknown',
        required: true,
        repeatable: false,
        minOccurs: 1,
        maxOccurs: 1,
      }
    }
  }
}

// functions for rendering check
export function isRequiredElement (element: TemplateElement): boolean {
  return (element._cardinality ?? parseCardinality(element)).required
}

export function isOptionalSingleElement (element: TemplateElement): boolean {
  const cardinality = element._cardinality ?? parseCardinality(element)
  return !cardinality.required && !cardinality.repeatable && cardinality.maxOccurs === 1
}

export function isRepeatableElement (element: TemplateElement): boolean {
  return (element._cardinality ?? parseCardinality(element)).repeatable
}
