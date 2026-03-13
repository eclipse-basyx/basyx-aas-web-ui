import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDeps = vi.hoisted(() => ({
    routerPush: vi.fn(),
    fetchAasDescriptorList: vi.fn(),
    fetchAasList: vi.fn(),
    fetchAas: vi.fn(),
    getAasEndpointById: vi.fn(),
    fetchSm: vi.fn(),
    checkReference: vi.fn(),
    getEndpoints: vi.fn(),
    dispatchSnackbar: vi.fn(),
}));

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockDeps.routerPush,
    }),
}));

vi.mock('@/composables/AAS/AASHandling', () => ({
    useAASHandling: () => ({
        fetchAasDescriptorList: mockDeps.fetchAasDescriptorList,
        fetchAasList: mockDeps.fetchAasList,
        fetchAas: mockDeps.fetchAas,
        getAasEndpointById: mockDeps.getAasEndpointById,
    }),
}));

vi.mock('@/composables/AAS/SMHandling', () => ({
    useSMHandling: () => ({
        fetchSm: mockDeps.fetchSm,
    }),
}));

vi.mock('@/composables/AAS/ReferenceComposable', () => ({
    useReferenceComposable: () => ({
        referenceTypes: ['ExternalReference', 'ModelReference'],
        checkReference: mockDeps.checkReference,
        getEndpoints: mockDeps.getEndpoints,
    }),
}));

vi.mock('@/store/NavigationStore', () => ({
    useNavigationStore: () => ({
        getIsMobile: false,
        dispatchSnackbar: mockDeps.dispatchSnackbar,
    }),
}));

import { useJumpHandling } from '@/composables/JumpHandling';

describe('JumpHandling.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockDeps.checkReference.mockResolvedValue(true);
        mockDeps.getEndpoints.mockResolvedValue({
            aasEndpoint: 'https://example.test/shells/aas-1',
            smEndpoint: 'https://example.test/submodels/sm-1',
            smePath: 'https://example.test/submodels/sm-1/submodel-elements/Users%5B0%5D',
        });
    });

    it('pushes route query with resolved SME path for model references', async () => {
        const { jumpToReference } = useJumpHandling();

        await jumpToReference({ type: 'ModelReference', keys: [] });

        expect(mockDeps.routerPush).toHaveBeenCalledTimes(1);
        expect(mockDeps.routerPush).toHaveBeenCalledWith({
            query: {
                aas: 'https://example.test/shells/aas-1',
                path: 'https://example.test/submodels/sm-1/submodel-elements/Users%5B0%5D',
            },
        });
    });

    it('does not navigate when checkReference fails', async () => {
        const { jumpToReference } = useJumpHandling();

        mockDeps.checkReference.mockResolvedValue(false);

        await jumpToReference({ type: 'ModelReference', keys: [] });

        expect(mockDeps.getEndpoints).not.toHaveBeenCalled();
        expect(mockDeps.routerPush).not.toHaveBeenCalled();
    });

    it('uses smEndpoint as path when no SME path is available', async () => {
        const { jumpToReference } = useJumpHandling();

        mockDeps.getEndpoints.mockResolvedValue({
            aasEndpoint: 'https://example.test/shells/aas-1',
            smEndpoint: 'https://example.test/submodels/sm-1',
            smePath: '',
        });

        await jumpToReference({ type: 'ModelReference', keys: [{ type: 'Submodel', value: 'sm-1' }] });

        expect(mockDeps.routerPush).toHaveBeenCalledTimes(1);
        expect(mockDeps.routerPush).toHaveBeenCalledWith({
            query: {
                aas: 'https://example.test/shells/aas-1',
                path: 'https://example.test/submodels/sm-1',
            },
        });
    });

    it('resolves AAS and still navigates to submodel path when aasEndpoint is initially unknown', async () => {
        const { jumpToReference } = useJumpHandling();

        mockDeps.getEndpoints.mockResolvedValue({
            aasEndpoint: '',
            smEndpoint: 'https://example.test/submodels/sm-1',
            smePath: '',
        });
        mockDeps.fetchSm.mockResolvedValue({ id: 'sm-1' });
        mockDeps.fetchAasDescriptorList.mockResolvedValue([]);
        mockDeps.fetchAasList.mockResolvedValue([
            {
                id: 'aas-1',
                submodels: [{ type: 'ModelReference', keys: [{ type: 'Submodel', value: 'sm-1' }] }],
            },
        ]);
        mockDeps.getAasEndpointById.mockResolvedValue('https://example.test/shells/aas-1');

        await jumpToReference({ type: 'ModelReference', keys: [{ type: 'Submodel', value: 'sm-1' }] });

        expect(mockDeps.routerPush).toHaveBeenCalledTimes(1);
        expect(mockDeps.routerPush).toHaveBeenCalledWith({
            query: {
                aas: 'https://example.test/shells/aas-1',
                path: 'https://example.test/submodels/sm-1',
            },
        });
    });
});
