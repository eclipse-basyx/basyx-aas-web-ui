import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils'
import { smts } from '@/utils/AAS/SubmodelTemplateUtils'

export function useSubmodelDisplay () {
  // Composables
  const { nameToDisplay } = useReferableUtils()

  function getSmtOfSm (sm: any): any {
    const semanticId = sm?.semanticId?.keys[0]?.value
    if (!semanticId) {
      return undefined
    }
    return smts.find((smt: any) => smt.semanticId === semanticId)
  }

  function smTitleToDisplay (sm: any): string {
    // If there is a specified displayName, use it
    if (sm?.displayName && Array.isArray(sm?.displayName) && sm?.displayName.length > 0) {
      return nameToDisplay(sm)
    }

    // Use name of SMT specification
    const smt = getSmtOfSm(sm)
    if (smt) {
      return smt.name
    }

    return nameToDisplay(sm)
  }

  function smVersionToDisplay (sm: any): string {
    // If there are administrative information use it
    if (sm?.administration?.version) {
      return sm.administration.version + (sm.administration.revision ? '.' + sm.administration.revision : '')
    }

    // Use version of SMT specification
    const smt = getSmtOfSm(sm)
    if (smt) {
      return smt.version
    }

    // Use version of from semanticId
    const semanticId = sm?.semanticId?.keys[0]?.value
    if (semanticId && semanticId.startsWith('http')) {
      const { version, revision } = extractVersionRevision(semanticId)
      if (version) {
        return version + (revision ? '.' + revision : '')
      }
    }

    return ''
  }

  function smIdToDisplay (smId: string, aasId?: string): string {
    // Shorten the part of the SM ID repeating the ID of the containing AAS
    if (!aasId || smId === aasId || !smId.includes(aasId)) {
      return smId
    }
    return smId.replace(aasId, '...')
  }

  function sortSmsForDisplay (sms: Array<any>): Array<any> {
    // Sort SMs with respect to displayed title and version
    return sms.toSorted((smA: any, smB: any) =>
      smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA)
      > smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
        ? 1
        : -1,
    )
  }

  return {
    getSmtOfSm,
    smTitleToDisplay,
    smVersionToDisplay,
    smIdToDisplay,
    sortSmsForDisplay,
  }
}
