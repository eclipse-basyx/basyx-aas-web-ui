export function cleanObjectRecursively (obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  // If it's an array, recursively clean each element
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectRecursively(item))
  }

  // If it's an object, create a copy and recursively clean it
  if (typeof obj === 'object') {
    const cleaned = { ...(obj as Record<string, unknown>) }

    // Remove tree-specific properties that were added by prepareForTree
    delete cleaned.showChildren
    delete cleaned.parent
    delete cleaned.path
    delete cleaned.selectionKey
    delete cleaned.persistence
    delete cleaned.operationVariableDirection
    delete cleaned.operationVariableIndex
    delete cleaned.isDirectOperationVariable
    delete cleaned.timestamp
    delete cleaned.listIndex
    delete cleaned.conceptDescriptions
    delete cleaned.idLower
    delete cleaned.idShortLower
    delete cleaned.nameLower
    delete cleaned.descLower
    delete cleaned.endpoints
    delete cleaned.validationError

    // Remove id property for all elements except Submodels
    if (cleaned.modelType !== 'Submodel') {
      delete cleaned.id
    }

    // Restore original structure based on modelType
    if (cleaned.modelType === 'Submodel' && Array.isArray(cleaned.children)) {
      // For Submodels, children should go back to submodelElements
      cleaned.submodelElements = cleanObjectRecursively(cleaned.children)
      delete cleaned.children
    } else if (
      ['SubmodelElementCollection', 'SubmodelElementList'].includes(cleaned.modelType as string)
      && Array.isArray(cleaned.children)
    ) {
      // For Collections and Lists, children should go back to value
      cleaned.value = cleanObjectRecursively(cleaned.children)
      delete cleaned.children
    } else if (cleaned.modelType === 'Entity' && Array.isArray(cleaned.children)) {
      // For Entities, children should go back to statements
      cleaned.statements = cleanObjectRecursively(cleaned.children)
      delete cleaned.children
    } else if (
      cleaned.modelType === 'AnnotatedRelationshipElement'
      && Array.isArray(cleaned.children)
    ) {
      cleaned.annotations = cleanObjectRecursively(cleaned.children)
      delete cleaned.children
    } else {
      // Remove children property if it exists but doesn't match any known pattern
      delete cleaned.children
    }

    // Recursively clean all remaining properties
    for (const key in cleaned) {
      if (Object.prototype.hasOwnProperty.call(cleaned, key)) {
        cleaned[key] = cleanObjectRecursively(cleaned[key])
      }
    }

    return cleaned
  }

  // For primitive types, return as is
  return obj
}
