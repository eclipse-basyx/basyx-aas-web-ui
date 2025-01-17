import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import * as descriptorTypes from '@/types/Descriptors';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { removeNullValues } from '@/utils/generalUtils';

export function useSMRegistryClient() {
  const { getRequest, postRequest, putRequest } = useRequestHandling();

  const navigationStore = useNavigationStore();

  const submodelRegistryUrl = computed(() => navigationStore.getSubmodelRegistryURL);

  // Fetch List of all available SM Descriptors
  async function fetchSmDescriptorList(): Promise<Array<any>> {
    const failResponse = [] as Array<any>;

    let smRegistryUrl = submodelRegistryUrl.value;
    if (smRegistryUrl.trim() === '') return failResponse;
    if (!smRegistryUrl.includes('/submodel-descriptors')) {
      smRegistryUrl += '/submodel-descriptors';
    }

    const smRegistryPath = smRegistryUrl;
    const smRegistryContext = 'retrieving all SM Descriptors';
    const disableMessage = false;
    try {
      const smRegistryResponse = await getRequest(smRegistryPath, smRegistryContext, disableMessage);
      if (
        smRegistryResponse.success &&
        smRegistryResponse.data.result &&
        smRegistryResponse.data.result.length > 0
      ) {
        return smRegistryResponse.data.result;
      }
    } catch {
      // handle error
      return failResponse;
    }
    return failResponse;
  }

  // Fetch SM Descriptor by SM ID with SM Registry
  async function fetchSmDescriptorById(smId: string): Promise<any> {
    const failResponse = {} as any;

    let smRegistryUrl = submodelRegistryUrl.value;
    if (smRegistryUrl.trim() === '') return failResponse;
    if (!smRegistryUrl.includes('/shell-descriptors')) {
      smRegistryUrl += '/shell-descriptors';
    }

    const smRegistryPath = smRegistryUrl + '/' + base64Encode(smId).replace(/%3D/g, '');
    const smRegistryContext = 'retrieving SM Descriptor';
    const disableMessage = false;
    try {
      const smRegistryResponse = await getRequest(smRegistryPath, smRegistryContext, disableMessage);
      if (
        smRegistryResponse?.success &&
        smRegistryResponse?.data &&
        Object.keys(smRegistryResponse?.data).length > 0
      ) {
        return smRegistryResponse.data;
      }
    } catch {
      // handle error
      return failResponse;
    }
    return failResponse;
  }

  async function postSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<void> {
    let submodelRegUrl = submodelRegistryUrl.value;
    if (!submodelRegUrl.includes('/submodel-descriptors')) {
      submodelRegUrl += '/submodel-descriptors';
    }

    const context = 'updating Submodel Descriptor';
    const disableMessage = false;
    const path = submodelRegUrl;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify(submodelDescriptor);

    await postRequest(path, body, headers, context, disableMessage);
  }

  async function putSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<void> {
    let submodelRegUrl = submodelRegistryUrl.value;
    if (!submodelRegUrl.includes('/submodel-descriptors')) {
      submodelRegUrl += '/submodel-descriptors';
    }

    const context = 'updating Submodel Descriptor';
    const disableMessage = false;
    const path = submodelRegUrl + '/' + base64Encode(submodelDescriptor.id);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify(submodelDescriptor);

    await putRequest(path, body, headers, context, disableMessage);
  }

  function createDescriptorFromSubmodel(
    submodel: jsonization.JsonObject,
    endpoints: Array<descriptorTypes.Endpoint>
  ): descriptorTypes.SubmodelDescriptor {
    const jsonSubmodel = JSON.stringify(submodel);
    const parsedSubmodel = JSON.parse(jsonSubmodel);
    let descriptor = new descriptorTypes.SubmodelDescriptor(
      endpoints,
      parsedSubmodel.id,
      parsedSubmodel.administration,
      parsedSubmodel.description,
      parsedSubmodel.displayName,
      parsedSubmodel.extensions,
      parsedSubmodel.idShort
    );
    descriptor = removeNullValues(descriptor);
    return descriptor;
  }

  return {
    fetchSmDescriptorList,
    fetchSmDescriptorById,
    postSubmodelDescriptor,
    putSubmodelDescriptor,
    createDescriptorFromSubmodel,
  };
}
