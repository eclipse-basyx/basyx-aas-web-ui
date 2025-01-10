import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from './ConceptDescriptionHandling';

export function useSMEHandling() {
    // Composables
    const { fetchSme } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string, withConceptDescriptions = false): Promise<void> {
        // console.log('fetchAndDispatchSme()', submodelElementPath);

        if (submodelElementPath.trim() === '') return;

        const sme = await fetchSme(submodelElementPath);
        sme.timestamp = formatDate(new Date());
        sme.path = submodelElementPath;
        sme.isActive = true;

        if (withConceptDescriptions) {
            sme.conceptDescriptions = await getConceptDescriptions(sme);
        }

        aasStore.dispatchSelectedNode(sme);
    }

    return { fetchAndDispatchSme };
}
