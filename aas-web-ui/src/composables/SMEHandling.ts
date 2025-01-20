import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';

export function useSMEHandling() {
    // Composables
    const { fetchSm: fetchSmFromRepo, fetchSme: fetchSmeFromRepo } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches a Submodel Element (SME) by the provided SME path.
     * and dispatches it to the AAS store.
     *
     * @param {string} smePath - The path URL of the SME to fetch.
     */
    async function fetchAndDispatchSme(smePath: string, withConceptDescriptions: boolean = false): Promise<void> {
        if (!smePath) return;

        smePath = smePath.trim();

        if (smePath === '') return;

        const smOrSme = await fetchSme(smePath, withConceptDescriptions);

        if (!smOrSme || Object.keys(smOrSme).length === 0) return;

        smOrSme.isActive = true;

        aasStore.dispatchSelectedNode(smOrSme);
    }

    /**
     * Fetches a Submodel Element (SME) by the provided SME path.
     *
     * @param {string} smePath - The path URL of the SME to fetch.
     */
    async function fetchSme(smePath: string, withConceptDescriptions: boolean = false): Promise<any> {
        const failResponse = {};

        if (!smePath) return failResponse;

        smePath = smePath.trim();

        if (smePath === '') return failResponse;

        let smOrSme = {} as any;
        if (smePath.includes('/submodel-elements/')) {
            smOrSme = await fetchSmeFromRepo(smePath);
        } else {
            // No valid SME path, maybe just SM endpoint
            smOrSme = await fetchSmFromRepo(smePath);

            // Note usage of fetchSm() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SME/SM');
            return failResponse;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = smePath;

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await getConceptDescriptions(smOrSme);
        } else {
            smOrSme.conceptDescriptions = [];
        }

        return smOrSme;
    }

    return { fetchSme, fetchAndDispatchSme };
}
