import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import * as descriptorTypes from '@/types/Descriptors';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { removeNullValues } from '@/utils/generalUtils';

export function useAASRegistryClient() {
    const { getRequest, postRequest, putRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const aasRegistryUrl = computed(() => navigationStore.getAASRegistryURL);

    // Fetch List of all available AAS Descriptors
    async function fetchAasDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasRegUrl = aasRegistryUrl.value;
        if (aasRegUrl.trim() === '') return failResponse;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const aasRegistryPath = aasRegUrl;
        const aasRegistryContext = 'retrieving all AAS Descriptors';
        const disableMessage = false;
        try {
            const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
            if (
                aasRegistryResponse.success &&
                aasRegistryResponse.data.result &&
                aasRegistryResponse.data.result.length > 0
            ) {
                return aasRegistryResponse.data.result;
            }
        } catch {
            // handle error
            return failResponse;
        }

        return failResponse;
    }

    // Fetch AAS Descriptor by AAS ID with AAS Registry
    async function fetchAasDescriptorById(aasId: string): Promise<any> {
        const failResponse = {} as any;

        let aasRegUrl = aasRegistryUrl.value;
        if (aasRegUrl.trim() === '') return failResponse;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const aasRegistryPath = aasRegUrl + '/' + base64Encode(aasId);
        const aasRegistryContext = 'retrieving AAS Descriptor';
        const disableMessage = false;
        try {
            const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
            if (
                aasRegistryResponse?.success &&
                aasRegistryResponse?.data &&
                Object.keys(aasRegistryResponse?.data).length > 0
            ) {
                return aasRegistryResponse.data;
            }
        } catch {
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    async function postAasDescriptor(aasDescriptor: descriptorTypes.AASDescriptor): Promise<void> {
        let aasRegUrl = aasRegistryUrl.value;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const context = 'updating AAS Descriptor';
        const disableMessage = false;
        const path = aasRegUrl;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(aasDescriptor);

        // Send Request to upload the file
        const response = await postRequest(path, body, headers, context, disableMessage);
        if (response.success) {
            navigationStore.dispatchTriggerAASListReload(true); // Reload AAS List
        }
    }

    async function putAasDescriptor(aasDescriptor: descriptorTypes.AASDescriptor): Promise<void> {
        let aasRegUrl = aasRegistryUrl.value;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const context = 'updating AAS Descriptor';
        const disableMessage = false;
        const path = aasRegUrl + '/' + base64Encode(aasDescriptor.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(aasDescriptor);

        // Send Request to upload the file
        const response = await putRequest(path, body, headers, context, disableMessage);
        if (response.success) {
            navigationStore.dispatchTriggerAASListReload(true); // Reload AAS List
        }
    }

    function createDescriptorFromAAS(
        aas: jsonization.JsonObject,
        endpoints: Array<descriptorTypes.Endpoint>
    ): descriptorTypes.AASDescriptor {
        const jsonAAS = JSON.stringify(aas);
        const parsedAAS = JSON.parse(jsonAAS);
        let descriptor = new descriptorTypes.AASDescriptor(
            endpoints,
            parsedAAS.id,
            parsedAAS.administration,
            parsedAAS.assetInformation?.assetKind,
            parsedAAS.assetInformation?.assetType,
            parsedAAS.description,
            parsedAAS.displayName,
            parsedAAS.extensions,
            parsedAAS.assetInformation?.globalAssetId,
            parsedAAS.idShort,
            parsedAAS.assetInformation?.specificAssetIds
        );
        descriptor = removeNullValues(descriptor);
        return descriptor;
    }

    return {
        fetchAasDescriptorList,
        fetchAasDescriptorById,
        putAasDescriptor,
        postAasDescriptor,
        createDescriptorFromAAS,
    };
}
