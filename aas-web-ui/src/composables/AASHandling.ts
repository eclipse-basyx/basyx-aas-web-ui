import { Ref } from 'vue';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { wait } from '@/utils/generalUtils';
import { useAASRegistryClient } from './Client/AASRegistryClient';
import { useAASRepositoryClient } from './Client/AASRepositoryClient';

export function useAASHandling() {
    // Composables
    const {
        fetchAas: fetchAasFromRepo,
        fetchAasById: fetchAasByIdFromRepo,
        isAvailableById: isAvailableByIdInRepo,
    } = useAASRepositoryClient();
    const {
        fetchAasDescriptorById: fetchAasDescriptorByIdFromRegistry,
        fetchAasDescriptorList: fetchAasDescriptorListFromRegistry,
        isAvailableById: isAvailableByIdInRegistry,
    } = useAASRegistryClient();

    // Stores
    const aasStore = useAASStore();

    async function fetchAndDispatchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint || aasEndpoint.trim() === '') return failResponse;
        aasEndpoint = aasEndpoint.trim();

        const aas = await fetchAas(aasEndpoint);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    async function fetchAndDispatchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId || aasId.trim() === '') return failResponse;
        aasId = aasId.trim();

        const aas = await fetchAasById(aasId);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    async function fetchAasDescriptorById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId || aasId.trim() === '') return failResponse;
        aasId = aasId.trim();

        const aasDescriptor = await fetchAasDescriptorByIdFromRegistry(aasId);

        if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) {
            console.warn('Fetched empty AAS Descriptor');
            return failResponse;
        }

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');

        aasDescriptor.timestamp = formatDate(new Date());
        aasDescriptor.path = aasEndpoint;
        aasDescriptor.isActive = true;

        return aasDescriptor;
    }

    async function fetchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint || aasEndpoint.trim() === '') return failResponse;
        aasEndpoint = aasEndpoint.trim();

        const aas = await fetchAasFromRepo(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
        }

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId || aasId.trim() === '') return failResponse;
        aasId = aasId.trim();

        const aas = await fetchAasByIdFromRepo(aasId);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
            return failResponse;
        }

        const aasEndpoint = extractEndpointHref(aas, 'AAS-3.0');

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    async function fetchAasDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        const aasDescriptors = await fetchAasDescriptorListFromRegistry();

        if (Array.isArray(aasDescriptors) && aasDescriptors.length > 0) {
            return aasDescriptors;
        }

        return failResponse;
    }

    return {
        fetchAasDescriptorList,
        fetchAasDescriptorById,
        fetchAas,
        fetchAasById,
        fetchAndDispatchAas,
        fetchAndDispatchAasById,
    };
}
