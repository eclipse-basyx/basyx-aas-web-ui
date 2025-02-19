import { useRouter } from 'vue-router';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil';
import { useSMHandling } from './AAS/SMHandling';

export function useJumpHandling() {
    // Stores
    const navigationStore = useNavigationStore();

    // Vue Router
    const router = useRouter();

    // Composables
    const { fetchAasList } = useAASRepositoryClient();
    const { fetchSm } = useSMHandling();
    const { getAasEndpointById } = useAASHandling();
    const { referenceTypes, checkReference, getEndpoints } = useReferenceComposable();

    async function jumpToReference(reference: any): Promise<void> {
        if (await checkReference(reference)) {
            if (!referenceTypes.includes(reference.type)) return;

            if (reference.type === 'ModelReference') {
                const { aasEndpoint, smEndpoint, smePath } = await getEndpoints(reference);
                if (aasEndpoint.trim() !== '') {
                    jumpToAas(aasEndpoint, smePath);
                    return;
                } else if (aasEndpoint.trim() === '' && smEndpoint.trim() !== '') {
                    // Find first AAS which includes the SM of the SM endpoint
                    const sm = await fetchSm(smEndpoint);
                    if (sm && Object.keys(sm).length > 0) {
                        const smId = sm.id;
                        const aasList = await fetchAasList();
                        if (aasList && Array.isArray(aasList) && aasList.length > 0) {
                            for (const aas of aasList) {
                                const aasEndpoint = await getAasEndpointById(aas.id);
                                const submodelRefs = aas.submodels;
                                if (
                                    aasEndpoint.trim() !== '' &&
                                    submodelRefs &&
                                    Array.isArray(submodelRefs) &&
                                    submodelRefs.length > 0
                                ) {
                                    for (const submodelRef of submodelRefs) {
                                        if (smId === extractIdFromReference(submodelRef, 'Submodel')) {
                                            jumpToAas(aasEndpoint, smePath);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (reference.type === 'ExternalReference') {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    text: 'Reference check for ExternalReference is not implemented',
                });
            }
        }
    }

    /**
     * Jumps to the Asset Administration Shell (AAS) based on the provided AAS ID.
     *
     * If the AAS ID is valid, it initiates a jump to the AAS.
     * If the AAS ID is empty or invalid, the function exits without performing any action.
     *
     * @param {string} aasId - The ID of the AAS to jump to.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     *                         The function does not return any value.
     */
    async function jumpToAasById(aasId: string): Promise<void> {
        if (!aasId) return;

        aasId = aasId.trim();

        if (aasId === '') return;

        const aasEndpoint = await getAasEndpointById(aasId);

        jumpToAas(aasEndpoint);
    }

    /**
     * Jumps to the Asset Administration Shell (AAS) based on the provided AAS descriptor.
     *
     * If the AAS descriptor is valid, it initiates a jump to the AAS.
     * If the AAS descriptor is empty or invalid, the function exits without performing any action.
     *
     * @param {any} descriptor - The descriptor of the AAS to jump to.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     *                         The function does not return any value.
     */
    async function jumpToAasByAasDescriptor(aasDescriptor: any): Promise<void> {
        if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) return;

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');

        jumpToAas(aasEndpoint);
    }

    /**
     * Jumps to the Asset Administration Shell (AAS) based on the provided AAS endpoint.
     *
     * If the AAS endpoint is valid, it initiates a jump to the AAS.
     * If the AAS endpoint is empty or invalid, the function exits without performing any action.
     *
     * @param {string} aasEndpoint - The descriptor of the AAS to jump to.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     *                         The function does not return any value.
     */
    async function jumpToAas(aasEndpoint: string, smePath: string = ''): Promise<void> {
        if (!aasEndpoint) return;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        if (navigationStore.getIsMobile) {
            if (smePath.trim() === '') {
                router.push({ name: 'AASList', query: { aas: aasEndpoint } });
            } else {
                router.push({ name: 'AASList', query: { aas: aasEndpoint, path: smePath } });
            }
        } else {
            if (smePath.trim() === '') {
                router.push({ query: { aas: aasEndpoint } });
            } else {
                router.push({ query: { aas: aasEndpoint, path: smePath } });
            }
        }
    }

    return { jumpToReference, jumpToAas, jumpToAasById, jumpToAasByAasDescriptor };
}
