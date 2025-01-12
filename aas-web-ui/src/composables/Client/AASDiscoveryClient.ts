import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export function useAASDicoveryClient() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const aasDiscoveryUrl = computed(() => navigationStore.getAASDiscoveryURL);

    // Function to check if the assetId can be found in the AAS Discovery Service (and if it exists in the AAS Registry)
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
        const aasDiscoveryPath = `${aasDiscoveryUrl.value}?assetIds=${base64Encode(assetIdObject)}`;
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
