import { useIDUtils } from '@/composables/IDUtils'

function getDisplayNameText (referable: any, language: string): string {
  if (!referable?.displayName || !Array.isArray(referable.displayName) || referable.displayName.length === 0) {
    return ''
  }

  const displayName = referable.displayName.find((item: any) => {
    return item.language === language && item?.text
  })

  return displayName?.text && displayName.text.trim() !== '' ? displayName.text : ''
}

function shouldHideIdDisplay (referable: any, uuidV4Regex: RegExp): boolean {
  const isSubmodelElementListChild = !!(
    referable?.parent
    && Object.keys(referable.parent).length > 0
    && referable.parent?.modelType === 'SubmodelElementList'
  )

  return isSubmodelElementListChild || uuidV4Regex.test(referable.id)
}

export function useReferableUtils () {
  const { uuidV4Regex } = useIDUtils()

  /**
   * Extracts the display name from a Referable object based on the specified language.
   *
   * The function follows these steps to determine the display name:
   * 1. If a `displayName` entry with the specified language is found, it returns its text.
   * 2. If `defaultNameToDisplay` is provided and not an empty string, it returns this value.
   * 3. If `idShort` is available and not an empty string, it returns `idShort`.
   * 4. If `id` is available and not an empty string, it returns `id`.
   * 5. If none of the above conditions are met, it returns an empty string.
   *
   * @param {Object} referable - The Referable object to extract the display name from.
   * @param {string} [language='en'] - The language code for the desired display name text. Defaults to 'en'.
   * @param {string} [defaultNameToDisplay=''] - The default name to return if no display name is found. Defaults to an empty string.
   * @returns {string} The determined display name or an appropriate fallback value.
   */
  function nameToDisplay (referable: any, language = 'en', defaultNameToDisplay = ''): string {
    const fallbackName = defaultNameToDisplay.trim() || ''

    if (!referable || Object.keys(referable).length === 0) {
      return fallbackName
    }

    const displayNameText = getDisplayNameText(referable, language)
    if (displayNameText !== '') {
      return displayNameText
    }

    if (defaultNameToDisplay.trim() !== '') {
      return defaultNameToDisplay
    }

    if (referable?.idShort && referable.idShort.trim() !== '') {
      return referable.idShort
    }

    if (referable?.id && referable.id.trim() !== '') {
      // Note: Constraint AASd-120: idShort of submodel elements being a direct child of a SubmodelElementList shall not be specified.
      // This condition avoids the output of an UUID v4.
      if (shouldHideIdDisplay(referable, uuidV4Regex)) {
        return fallbackName
      }

      return referable.id
    }

    return fallbackName
  }

  /**
   * Extracts the description from a Referable object based on the specified language.
   * If no suitable description is found, it returns a default description.
   *
   * The function checks if the Referable object has a non-empty `description` array,
   * and then it attempts to find a description in the specified language (default is English).
   *
   * @param {any} referable - The Referable object containing descriptions.
   * @param {string} [language='en'] - The language code indicating the desired description language.
   * @param {string} [defaultDescriptionToDisplay=''] - The default description to return if no matching description is found.
   * @returns {string} The text of the found description in the specified language or the default description if not found.
   */
  function descriptionToDisplay (referable: any, language = 'en', defaultDescriptionToDisplay = '') {
    if (
      referable
      && Object.keys(referable).length > 0
      && Array.isArray(referable?.description)
      && referable?.description.length > 0
    ) {
      const descriptionEn = referable.description.find(
        (description: any) => description && description.language === language && description.text !== '',
      )
      if (descriptionEn && descriptionEn.text) {
        return descriptionEn.text
      }
    }
    return defaultDescriptionToDisplay
  }

  /**
   * Checks if the `idShort` of a Referable object matches the given `idShort`.
   * The comparison can be performed in two modes:
   * - **startsWith**: checks if the `idShort` of the Referable object starts with the given `idShort`.
   * - **strict**: indicates whether the comparison should consider case sensitivity.
   *
   * @param {any} referable - The Referable object containing the `idShort` to check.
   * @param {string} idShort - The `idShort` string to compare against the Referable's `idShort`.
   * @param {boolean} [startsWith=false] - If true, checks if the Referable's `idShort` starts with the given `idShort`.
   * @param {boolean} [strict=false] - If true, the check will be case-sensitive.
   * @returns {boolean} Returns true if a matching `idShort` is found, false otherwise.
   */
  function checkIdShort (
    referable: any,
    idShort: string,
    startsWith = false,
    strict = false,
  ): boolean {
    if (idShort.trim() === '') {
      return false
    }

    if (
      !referable
      || Object.keys(referable).length === 0
      || !referable?.idShort
      || referable?.idShort.trim() === ''
    ) {
      return false
    }

    if (startsWith) {
      // For matching e.g. ProductImage{00} with idShort ProductImage
      // For matching e.g. Markings__00__
      return strict
        ? (
            referable.idShort === idShort
            || referable.idShort.startsWith(idShort + '{')
            || referable.idShort.startsWith(idShort + '__')
          )
        : (
            referable.idShort.toLowerCase() === idShort.toLowerCase()
            || referable.idShort.toLowerCase().startsWith(idShort.toLowerCase() + '{')
            || referable.idShort.toLowerCase().startsWith(idShort.toLowerCase() + '__')
          )
    } else {
      return strict ? referable.idShort === idShort : referable.idShort.toLowerCase() === idShort.toLowerCase()
    }
  }

  /**
   * Retrieves a SubmodelElement (SME) by its `idShort` from a given Submodel (SM) or SubmodelElement (SME).
   * If the `idShort` is not found or if the input is invalid, an empty object is returned.
   *
   * The function supports the following types of elements:
   * - **Submodel (SM)**: Searches through `submodelElements`.
   * - **SubmodelElementCollection (SMC)** and **SubmodelElementList (SML)**: Searches through their `value` arrays.
   *
   * @param {string} idShort - The `idShort` of the SME to search for.
   * @param {any} submodelElement - The parent SM/SME to search within.
   * @returns {any} The found SME or an empty object if not found or input is invalid.
   */
  function getSubmodelElementByIdShort (idShort: string, submodelElement: any): any {
    const failResponse = {} as any

    if (idShort.trim() == '') {
      return failResponse
    }

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') {
      return failResponse
    }

    switch (submodelElement.modelType) {
      case 'Submodel': {
        if (
          submodelElement?.submodelElements
          && Array.isArray(submodelElement.submodelElements)
          && submodelElement.submodelElements.length > 0
        ) {
          return submodelElement.submodelElements.find((sme: any) => {
            return checkIdShort(sme, idShort)
          })
        }
        break
      }
      case 'SubmodelElementCollection':
      case 'SubmodelElementList': {
        if (
          submodelElement?.value
          && Array.isArray(submodelElement.value)
          && submodelElement.value.length > 0
        ) {
          return submodelElement.value.find((sme: any) => {
            return checkIdShort(sme, idShort)
          })
        }
        break
      }
    }

    return failResponse
  }
  /**
   * Retrieves an array of SubmodelElements (SMEs) by their `idShort` from a given Submodel (SM) or SubmodelElement (SME).
   * If the `idShort` is not found or if the input is invalid, an empty array is returned.
   *
   * The function supports the following types of elements:
   * - **Submodel (SM)**: Filters through `submodelElements`.
   * - **SubmodelElementCollection (SMC)** and **SubmodelElementList (SML)**: Filters through their `value` arrays.
   *
   * @param {string} idShort - The `idShort` of the SMEs to search for.
   * @param {any} submodelElement - The parent SM/SME to search within.
   * @returns {any[]} An array of found SMEs matching the `idShort`, or an empty array if not found or input is invalid.
   */
  function getSubmodelElementsByIdShort (idShort: string, submodelElement: any): any[] {
    const failResponse = [] as any[]

    if (idShort.trim() == '') {
      return failResponse
    }

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') {
      return failResponse
    }

    switch (submodelElement.modelType) {
      case 'Submodel': {
        if (
          submodelElement?.submodelElements
          && Array.isArray(submodelElement.submodelElements)
          && submodelElement.submodelElements.length > 0
        ) {
          return submodelElement.submodelElements.filter((sme: any) => {
            return checkIdShort(sme, idShort)
          })
        }
        break
      }
      case 'SubmodelElementCollection':
      case 'SubmodelElementList': {
        if (
          submodelElement?.value
          && Array.isArray(submodelElement.value)
          && submodelElement.value.length > 0
        ) {
          return submodelElement.value.filter((sme: any) => {
            return checkIdShort(sme, idShort)
          })
        }
        break
      }
    }

    return failResponse
  }

  return {
    nameToDisplay,
    descriptionToDisplay,
    checkIdShort,
    getSubmodelElementByIdShort,
    getSubmodelElementsByIdShort,
  }
}
