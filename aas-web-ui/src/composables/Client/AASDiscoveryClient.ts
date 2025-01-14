import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export function useAASDicoveryClient() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const aasDiscoveryUrl = computed(() => navigationStore.getAASDiscoveryURL);

    /**
     * Retrieves the Asset Administration Shell (AAS) ID for a given global asset ID.
     *
     * @param {string} globalAssetId - The global asset ID.
     * @returns {Promise<string>} A Promise that resolves to the AAS ID if found, or an empty string if not.
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
            return failResponse;
        }

        return failResponse;
    }

    return {
        getAasId,
    };
}
