import { useRouter } from 'vue-router';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useJumpHandling() {
    // Vue Router
    const router = useRouter();

    // composables
    const { aasIsAvailableById, fetchAasById, fetchAndDispatchAas } = useAASRepositoryClient();

    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile);

    async function jumpToAasByAasDescriptor(aasDescriptor: any) {
        // console.log('jumpToAasByAasDescriptor()', 'aasDescriptor:', aasDescriptor);

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');
        // console.log('jumpToAasByAasDescriptor() --> jumpToAasBy()', aasEndpoint);
        jumpToAas(aasEndpoint);
    }

    async function jumpToAasById(aasId: string) {
        // console.log('jumpToAasById()', 'aasId:', aasId);

        if (!aasIsAvailableById(aasId)) return;

        const aas = await fetchAasById(aasId);
        const aasEndpoint = extractEndpointHref(aas, 'AAS-3.0');

        jumpToAas(aasEndpoint);
    }

    async function jumpToAas(aasEndpoint: string) {
        // console.log('jumpToAas()', 'aasEndpoint:', aasEndpoint);

        if (aasEndpoint.trim() === '') return;

        if (isMobile) {
            router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
        } else {
            router.push({ query: { aas: aasEndpoint } });
        }
        await fetchAndDispatchAas(aasEndpoint);
        navigationStore.dispatchTriggerAASListScroll();
    }

    return { jumpToAasByAasDescriptor, jumpToAasById, jumpToAas };
}
