import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
    selectedAAS: { submodels: [] as Array<any> },
}));

const mockDeps = vi.hoisted(() => ({
    aasIsAvailableById: vi.fn(),
    getAasEndpointById: vi.fn(),
    smIsAvailableById: vi.fn(),
    getSmEndpointById: vi.fn(),
    fetchSme: vi.fn(),
    dispatchSnackbar: vi.fn(),
}));

vi.mock('@/composables/AAS/AASHandling', () => ({
    useAASHandling: () => ({
        aasIsAvailableById: mockDeps.aasIsAvailableById,
        getAasEndpointById: mockDeps.getAasEndpointById,
    }),
}));

vi.mock('@/composables/AAS/SMHandling', () => ({
    useSMHandling: () => ({
        smIsAvailableById: mockDeps.smIsAvailableById,
        getSmEndpointById: mockDeps.getSmEndpointById,
    }),
}));

vi.mock('@/composables/AAS/SMEHandling', () => ({
    useSMEHandling: () => ({
        fetchSme: mockDeps.fetchSme,
    }),
}));

vi.mock('@/store/AASDataStore', () => ({
    useAASStore: () => ({
        getSelectedAAS: mockState.selectedAAS,
    }),
}));

vi.mock('@/store/NavigationStore', () => ({
    useNavigationStore: () => ({
        dispatchSnackbar: mockDeps.dispatchSnackbar,
    }),
}));

import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable';

describe('ReferenceComposable.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockState.selectedAAS = {
            submodels: [
                {
                    keys: [{ type: 'Submodel', value: 'sm-1' }],
                    type: 'ModelReference',
                },
            ],
        };

        mockDeps.getSmEndpointById.mockResolvedValue('https://example.test/submodels/sm-1');
        mockDeps.getAasEndpointById.mockResolvedValue('https://example.test/shells/aas-1');
        mockDeps.aasIsAvailableById.mockResolvedValue(true);
        mockDeps.smIsAvailableById.mockResolvedValue(true);
    });

    it('resolves list index path for model references in SubmodelElementList', async () => {
        const { getEndpoints } = useReferenceComposable();

        mockDeps.fetchSme.mockResolvedValue({ value: [{}, {}] });

        const reference = {
            type: 'ModelReference',
            keys: [
                { type: 'Submodel', value: 'sm-1' },
                { type: 'SubmodelElementList', value: 'Users' },
                { type: 'SubmodelElementCollection', value: '0' },
            ],
        };

        const endpoints = await getEndpoints(reference);

        expect(endpoints.aasEndpoint).toBe('');
        expect(endpoints.smEndpoint).toBe('https://example.test/submodels/sm-1');
        expect(endpoints.smePath).toBe('https://example.test/submodels/sm-1/submodel-elements/Users%5B0%5D');
        expect(mockDeps.fetchSme).toHaveBeenCalledTimes(1);
        expect(mockDeps.fetchSme).toHaveBeenCalledWith('https://example.test/submodels/sm-1/submodel-elements/Users');
    });

    it('does not append submodel-elements path for a pure submodel reference', async () => {
        const { getEndpoints } = useReferenceComposable();

        const reference = {
            type: 'ModelReference',
            keys: [{ type: 'Submodel', value: 'sm-1' }],
        };

        const endpoints = await getEndpoints(reference);

        expect(endpoints.aasEndpoint).toBe('');
        expect(endpoints.smEndpoint).toBe('https://example.test/submodels/sm-1');
        expect(endpoints.smePath).toBe('');
        expect(mockDeps.fetchSme).not.toHaveBeenCalled();
    });

    it('does not append submodel-elements path for AAS + Submodel references without SME keys', async () => {
        const { getEndpoints } = useReferenceComposable();

        const reference = {
            type: 'ModelReference',
            keys: [
                { type: 'AssetAdministrationShell', value: 'aas-1' },
                { type: 'Submodel', value: 'sm-1' },
            ],
        };

        const endpoints = await getEndpoints(reference);

        expect(endpoints.aasEndpoint).toBe('https://example.test/shells/aas-1');
        expect(endpoints.smEndpoint).toBe('https://example.test/submodels/sm-1');
        expect(endpoints.smePath).toBe('');
        expect(mockDeps.fetchSme).not.toHaveBeenCalled();
    });

    it('resolves nested path after list index (List[index].Property)', async () => {
        const { getEndpoints } = useReferenceComposable();

        mockDeps.fetchSme.mockResolvedValue({ value: [{ modelType: 'SubmodelElementCollection' }] });

        const reference = {
            type: 'ModelReference',
            keys: [
                { type: 'Submodel', value: 'sm-1' },
                { type: 'SubmodelElementList', value: 'Groups' },
                { type: 'SubmodelElementCollection', value: '0' },
                { type: 'Property', value: 'GroupName' },
            ],
        };

        const endpoints = await getEndpoints(reference);

        expect(endpoints.smePath).toBe('https://example.test/submodels/sm-1/submodel-elements/Groups%5B0%5D.GroupName');
        expect(mockDeps.fetchSme).toHaveBeenCalledTimes(1);
        expect(mockDeps.fetchSme).toHaveBeenCalledWith('https://example.test/submodels/sm-1/submodel-elements/Groups');
    });

    it('returns false for unresolved list index references in checkReference', async () => {
        const { checkReference } = useReferenceComposable();

        mockDeps.fetchSme.mockResolvedValue({ value: [{}] });

        const reference = {
            type: 'ModelReference',
            keys: [
                { type: 'Submodel', value: 'sm-1' },
                { type: 'SubmodelElementList', value: 'Users' },
                { type: 'SubmodelElementCollection', value: '3' },
            ],
        };

        const result = await checkReference(reference);

        expect(result).toBe(false);
    });

    it('returns true when list index reference resolves to an existing SME', async () => {
        const { checkReference } = useReferenceComposable();

        mockDeps.fetchSme.mockImplementation(async (path: string) => {
            if (path.endsWith('/submodel-elements/Users')) {
                return { value: [{}] };
            }

            if (path.endsWith('/submodel-elements/Users%5B0%5D')) {
                return { modelType: 'SubmodelElementCollection' };
            }

            return {};
        });

        const reference = {
            type: 'ModelReference',
            keys: [
                { type: 'Submodel', value: 'sm-1' },
                { type: 'SubmodelElementList', value: 'Users' },
                { type: 'SubmodelElementCollection', value: '0' },
            ],
        };

        const result = await checkReference(reference);

        expect(result).toBe(true);
    });
});
