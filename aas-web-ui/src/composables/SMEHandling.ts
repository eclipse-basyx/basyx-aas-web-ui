import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';

export function useSMEHandling() {
    // Composables
    const { fetchSm, fetchSme } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string, withConceptDescriptions = false): Promise<void> {
        // console.log('fetchAndDispatchSme()', submodelElementPath);

        submodelElementPath = submodelElementPath.trim();

        if (submodelElementPath === '') return;

        let smOrSme = {} as any;
        if (submodelElementPath.includes('/submodel-elements/')) {
            smOrSme = await fetchSme(submodelElementPath);
        } else {
            // No valid SME path, maybe just SM endpoint
            smOrSme = await fetchSm(submodelElementPath);

            // Note usage of fetchAndDispatchSm() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SME/SM');
            aasStore.dispatchSelectedNode({});
            return;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = submodelElementPath;
        smOrSme.isActive = true;

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await getConceptDescriptions(smOrSme);
        }

        aasStore.dispatchSelectedNode(smOrSme);
    }

    return { fetchAndDispatchSme };
}
