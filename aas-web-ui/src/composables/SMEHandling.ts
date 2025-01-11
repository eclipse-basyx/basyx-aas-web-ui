import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from './ConceptDescriptionHandling';

export function useSMEHandling() {
    // Composables
    const { fetchSm: fetchSmFromRepo, fetchSme: fetchSmeFromRepo } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string, withConceptDescriptions = false): Promise<void> {
        submodelElementPath = submodelElementPath.trim();

        if (submodelElementPath === '') return;

        const smOrSme = await fetchSme(submodelElementPath, withConceptDescriptions);

        aasStore.dispatchSelectedNode(smOrSme);
    }

    // Fetch SME
    async function fetchSme(submodelElementPath: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        submodelElementPath = submodelElementPath.trim();

        if (submodelElementPath === '') return failResponse;

        let smOrSme = {} as any;
        if (submodelElementPath.includes('/submodel-elements/')) {
            smOrSme = await fetchSmeFromRepo(submodelElementPath);
        } else {
            // No valid SME path, maybe just SM endpoint
            smOrSme = await fetchSmFromRepo(submodelElementPath);

            // Note usage of fetchAndDispatchSm() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SME/SM');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = submodelElementPath;
        smOrSme.isActive = true;

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await getConceptDescriptions(smOrSme);
        }

        return smOrSme;
    }

    return { fetchSme, fetchAndDispatchSme };
}
