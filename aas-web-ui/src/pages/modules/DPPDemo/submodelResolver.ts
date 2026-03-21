import { useAASHandling } from '@/composables/AAS/AASHandling'
import { useSMHandling } from '@/composables/AAS/SMHandling'

type AasReference = { id?: string } & Record<string, unknown>

type DppSubmodelResolver = {
  resolveSubmodelBySemanticId: (aas: AasReference, semanticId: string) => Promise<Record<string, unknown>>
}

export function useDppSubmodelResolver (): DppSubmodelResolver {
  const { getSmIdOfAasIdBySemanticId } = useAASHandling()
  const { fetchSmById } = useSMHandling()

  async function resolveSubmodelBySemanticId (
    aas: AasReference,
    semanticId: string,
  ): Promise<Record<string, unknown>> {
    if (!aas || Object.keys(aas).length === 0 || !aas?.id || !semanticId) {
      return {}
    }

    const aasId = typeof aas.id === 'string' ? aas.id : ''

    if (aasId.trim() === '') {
      return {}
    }

    const submodelId = await getSmIdOfAasIdBySemanticId(aasId, semanticId)

    if (!submodelId || submodelId.trim() === '') {
      return {}
    }

    return (await fetchSmById(submodelId, false, true)) as Record<string, unknown>
  }

  return { resolveSubmodelBySemanticId }
}
