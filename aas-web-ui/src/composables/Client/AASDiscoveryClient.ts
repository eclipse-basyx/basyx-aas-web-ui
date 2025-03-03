import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useAASDiscoveryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest } = useRequestHandling();

    const endpointPath = '/lookup/shells';

    // Computed Properties
    const aasDiscoveryUrl = computed(() => navigationStore.getAASDiscoveryURL);

    /**
     * Retrieves the Asset Administration Shell (AAS) ID corresponding to a given global asset ID.
     *
     * This function sends an HTTP request to the AAS Discovery service to look up the AAS ID based on the provided global asset ID.
     * If the global asset ID or the AAS Discovery URL is invalid or if the AAS ID cannot be retrieved, the function returns an empty string.
     *
     * @async
     * @param {string} globalAssetId - The global asset ID for which to retrieve the AAS ID.
     * @returns {Promise<string>} A promise that resolves to the AAS ID as a string if found; otherwise, an empty string.
     */
    async function getAasId(globalAssetId: string): Promise<string> {
        const failResponse = '';

        globalAssetId = globalAssetId.trim();

        if (globalAssetId === '') return failResponse;

        let aasDiscUrl = aasDiscoveryUrl.value.trim();
        if (aasDiscUrl === '') return failResponse;
        if (aasDiscUrl.endsWith('/')) aasDiscUrl = stripLastCharacter(aasDiscUrl);
        if (!aasDiscUrl.endsWith(endpointPath)) aasDiscUrl += endpointPath;

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
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks the availability of a global asset by its ID.
     *
     * This function trims the provided global asset ID and checks if a corresponding AAS ID exists.
     * If the global asset ID is empty or invalid, it returns false.
     * Otherwise, it returns true if a valid AAS ID is found.
     *
     * @param {string} globalAssetId - The ID of the global asset to check availability for.
     * @returns {Promise<boolean>} A promise that resolves to true if the asset is available, otherwise false.
     */
    async function isAvailableById(globalAssetId: string): Promise<boolean> {
        const failResponse = false;

        if (!globalAssetId) return failResponse;

        globalAssetId = globalAssetId.trim();

        if (globalAssetId === '') return failResponse;

        const aasId = await getAasId(globalAssetId);

        if (aasId && aasId.trim() !== '') return true;

        return failResponse;
    }

    return {
        endpointPath,
        getAasId,
        isAvailableById,
    };
}
