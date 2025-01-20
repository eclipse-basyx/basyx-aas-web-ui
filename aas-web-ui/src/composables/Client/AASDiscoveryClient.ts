import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export function useAASDicoveryClient() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const aasDiscoveryUrl = computed(() => navigationStore.getAASDiscoveryURL);

    /**
     * Retrieves the Asset Administration Shell (AAS) ID corresponding to a given global asset ID.
     *
     * This function sends an HTTP request to the AAS Discovery service to look up the AAS ID based on the provided global asset ID.
     * If the global asset ID or the AAS Discovery URL is invalid or if the AAS ID cannot be retrieved, the function returns an empty string.
     *
     * @param {string} globalAssetId - The global asset ID for which to retrieve the AAS ID.
     * @returns {Promise<string>} A promise that resolves to the AAS ID as a string if found; otherwise, an empty string.
     */
    async function getAasId(globalAssetId: string): Promise<string> {
        const failResponse = '';

        globalAssetId = globalAssetId.trim();

        if (globalAssetId === '') return failResponse;

        let aasDiscUrl = aasDiscoveryUrl.value;
        if (aasDiscUrl.trim() === '') return failResponse;
        if (!aasDiscUrl.includes('/lookup/shells')) {
            aasDiscUrl += '/lookup/shells';
        }

        const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: globalAssetId });
        const aasDiscoveryPath = `${aasDiscUrl}?assetIds=${base64Encode(assetIdObject)}`;
        const aasDiscoveryContext = 'retrieving AAS ID by AssetID';
        const disableMessage = true;
        try {
            const aasDiscoveryResponse = await getRequest(aasDiscoveryPath, aasDiscoveryContext, disableMessage);
            if (
                aasDiscoveryResponse.success &&
                aasDiscoveryResponse.data.result &&
                aasDiscoveryResponse.data.result.length > 0
            ) {
                const aasIds = aasDiscoveryResponse.data.result;
                if (Array.isArray(aasIds) && aasIds.length > 0) return aasIds[0];
            }
        } catch {
            // handle error
            return failResponse;
        }

        return failResponse;
    }

    return {
        getAasId,
    };
}
