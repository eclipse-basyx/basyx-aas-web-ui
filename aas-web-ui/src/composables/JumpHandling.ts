import { useRouter } from 'vue-router';
import { useNavigationStore } from '@/store/NavigationStore';
import { useAASHandling } from './AASHandling';

export function useJumpHandling() {
    // Stores
    const navigationStore = useNavigationStore();

    // Vue Router
    const router = useRouter();

    // Composables
    const { getAasEndpoint, getAasEndpointById, fetchAndDispatchAas } = useAASHandling();

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

        const aasEndpoint = getAasEndpoint(aasDescriptor);

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
    async function jumpToAas(aasEndpoint: string): Promise<void> {
        if (!aasEndpoint) return;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        if (navigationStore.getIsMobile) {
            router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
        } else {
            router.push({ query: { aas: aasEndpoint } });
        }
        await fetchAndDispatchAas(aasEndpoint);
    }

    return { jumpToAas, jumpToAasById, jumpToAasByAasDescriptor };
}
