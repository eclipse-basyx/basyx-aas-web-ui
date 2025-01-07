import { computed } from 'vue';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { URLEncode } from '@/utils/EncodeDecodeUtils';

export function useAASDiscoveryClient() {
    const { getRequest } = useRequestHandling();
    const { fetchAasDescriptorById } = useAASRegistryClient();

    const navigationStore = useNavigationStore();

    const aasDiscoveryUrl = computed(() => navigationStore.getAASDiscoveryURL);

    // Function to check if the assetId can be found in the AAS Discovery Service (and if it exists in the AAS Registry)
    async function checkGlobalAssetId(globalAssetId: string): Promise<{ success: boolean; aasDescriptor?: object }> {
        // console.log('checkGlobalAssetId()', 'globalAssetId:', globalAssetId);

        const failResponse = { success: false, aasDescriptor: {} }; // Define once for reuse

        // check if aasDiscoveryUrl includes "/lookup/shells" and add id if not (backward compatibility)
        let aasDiscUrl = aasDiscoveryUrl.value;
        if (aasDiscUrl.trim() === '') return failResponse;
        if (!aasDiscUrl.includes('/lookup/shells')) {
            aasDiscUrl += '/lookup/shells';
        }
        // construct the assetId Object
        const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: globalAssetId });
        const aasDiscoveryPath = `${aasDiscUrl}?assetIds=${URLEncode(assetIdObject)}`; // Use template literal and encodeURIComponent
        const aasDiscoveryContext = 'retrieving AAS ID by AssetID';
        const disableMessage = true;
        try {
            const aasDiscoveryResponse = await getRequest(aasDiscoveryPath, aasDiscoveryContext, disableMessage);
            // console.log('discoveryContext', discoveryPath, 'discoveryResponse', discoveryResponse);
            if (aasDiscoveryResponse?.success && aasDiscoveryResponse?.data?.result?.length > 0) {
                const aasIds = aasDiscoveryResponse.data.result;

                // Take the first aasId from the list and check if it exists in the AAS Registry
                const aasId = aasIds[0];
                const aasDescriptor = await fetchAasDescriptorById(aasId);

                if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
                    return { success: true, aasDescriptor: aasDescriptor };
                }
            }

            return failResponse;
        } catch {
            return failResponse;
        }
    }

    return {
        checkGlobalAssetId,
    };
}
