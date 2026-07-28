import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'

type Qualifiable = {
  qualifiers: Array<aasTypes.Qualifier> | null
}

function isQualifiable (value: object): value is object & Qualifiable {
  return 'qualifiers' in value
}

function removeTemplateQualifiers (value: object): number {
  if (!isQualifiable(value) || !Array.isArray(value.qualifiers)) {
    return 0
  }

  const remainingQualifiers = value.qualifiers.filter(
    qualifier => qualifier.kind !== aasTypes.QualifierKind.TemplateQualifier,
  )
  const removedQualifierCount = value.qualifiers.length - remainingQualifiers.length

  value.qualifiers = remainingQualifiers.length > 0 ? remainingQualifiers : null
  return removedQualifierCount
}

export function convertSubmodelTemplateToInstance (submodel: aasTypes.Submodel): number {
  submodel.kind = aasTypes.ModellingKind.Instance

  let removedQualifierCount = removeTemplateQualifiers(submodel)
  for (const descendant of submodel.descend()) {
    removedQualifierCount += removeTemplateQualifiers(descendant)
  }

  return removedQualifierCount
}
