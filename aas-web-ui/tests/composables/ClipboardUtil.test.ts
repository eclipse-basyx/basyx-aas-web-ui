import { jsonization } from '@aas-core-works/aas-core3.1-typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

const mockState = vi.hoisted(() => ({
    routeQuery: {} as Record<string, unknown>,
    selectedAAS: { submodels: [] as Array<any> },
    submodelRepoUrl: 'https://example.test/submodels',
    clipboardContent: undefined as any,
}));

const mockDeps = vi.hoisted(() => ({
    routerPush: vi.fn(),
    dispatchSnackbar: vi.fn(),
    dispatchTriggerTreeviewReload: vi.fn(),
    postSubmodel: vi.fn().mockResolvedValue(true),
    postSubmodelElement: vi.fn().mockResolvedValue(true),
    putAas: vi.fn().mockResolvedValue(true),
    generateIri: vi.fn(() => 'https://example.com/ids/sm/new-id'),
    dispatchSelectedAAS: vi.fn(),
}));

vi.mock('vue-router', () => ({
    useRoute: () => ({ query: mockState.routeQuery }),
    useRouter: () => ({ push: mockDeps.routerPush }),
}));

vi.mock('@/store/AASDataStore', () => ({
    useAASStore: () => ({
        getSelectedAAS: mockState.selectedAAS,
        dispatchSelectedAAS: mockDeps.dispatchSelectedAAS,
    }),
}));

vi.mock('@/store/ClipboardStore', () => ({
    useClipboardStore: () => ({
        getClipboardContent: () => mockState.clipboardContent,
    }),
}));

vi.mock('@/store/InfrastructureStore', () => ({
    useInfrastructureStore: () => ({
        getSubmodelRepoURL: mockState.submodelRepoUrl,
    }),
}));

vi.mock('@/store/NavigationStore', () => ({
    useNavigationStore: () => ({
        dispatchSnackbar: mockDeps.dispatchSnackbar,
        dispatchTriggerTreeviewReload: mockDeps.dispatchTriggerTreeviewReload,
    }),
}));

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
    useSMRepositoryClient: () => ({
        postSubmodel: mockDeps.postSubmodel,
        postSubmodelElement: mockDeps.postSubmodelElement,
    }),
}));

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
    useAASRepositoryClient: () => ({
        putAas: mockDeps.putAas,
    }),
}));

vi.mock('@/composables/IDUtils', () => ({
    useIDUtils: () => ({
        generateIri: mockDeps.generateIri,
    }),
}));

import { useClipboardUtil } from '@/composables/ClipboardUtil';

describe('ClipboardUtil.ts', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vi.useRealTimers();

        mockState.routeQuery = {};
        mockState.selectedAAS = { submodels: [] };
        mockState.submodelRepoUrl = 'https://example.test/submodels';
        mockState.clipboardContent = undefined;
    });

    it('cleans tree augmentation fields and restores children structure for submodels/collections/entities', () => {
        const { cleanObjectRecursively } = useClipboardUtil();

        const cleaned = cleanObjectRecursively({
            modelType: 'Submodel',
            id: 'submodel-id',
            showChildren: true,
            path: '/submodels/abc',
            children: [
                {
                    modelType: 'SubmodelElementCollection',
                    id: 'collection-id',
                    idShort: 'folder',
                    children: [
                        {
                            modelType: 'Entity',
                            id: 'entity-id',
                            idShort: 'entity',
                            children: [{ modelType: 'Property', id: 'property-id', idShort: 'temperature' }],
                        },
                    ],
                },
            ],
        }) as any;

        expect(cleaned.showChildren).toBeUndefined();
        expect(cleaned.path).toBeUndefined();
        expect(cleaned.children).toBeUndefined();
        expect(cleaned.submodelElements).toHaveLength(1);
        expect(cleaned.submodelElements[0].id).toBeUndefined();
        expect(cleaned.submodelElements[0].value).toHaveLength(1);
        expect(cleaned.submodelElements[0].value[0].statements).toHaveLength(1);
        expect(cleaned.submodelElements[0].value[0].statements[0].id).toBeUndefined();
    });

    it('rejects non-DataElement paste into AnnotatedRelationshipElement parent', async () => {
        const { pasteElement } = useClipboardUtil();

        mockState.clipboardContent = { modelType: 'SubmodelElementCollection', idShort: 'folder' };
        vi.spyOn(jsonization, 'submodelElementFromJsonable').mockReturnValue({
            error: null,
            mustValue: () => ({ idShort: 'folder', modelType: () => 'SubmodelElementCollection' }),
        } as any);

        await pasteElement({
            modelType: 'AnnotatedRelationshipElement',
            path: 'https://example.test/submodels/abc/submodel-elements/relation',
        });

        expect(mockDeps.postSubmodelElement).not.toHaveBeenCalled();
        expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(
            expect.objectContaining({
                color: 'error',
                text: 'Only DataElement types are allowed as AnnotatedRelationshipElement annotations.',
            })
        );
    });

    it('auto-selects new list child path after paste (list index path)', async () => {
        const { pasteElement } = useClipboardUtil();

        const submodelId = 'my-submodel';
        const encodedSubmodelId = base64Encode(submodelId);

        mockState.clipboardContent = { modelType: 'Property', idShort: 'temperature' };
        vi.spyOn(jsonization, 'submodelElementFromJsonable').mockReturnValue({
            error: null,
            mustValue: () => ({ idShort: 'temperature', modelType: () => 'Property' }),
        } as any);

        await pasteElement({
            modelType: 'SubmodelElementList',
            path: `https://example.test/submodels/${encodedSubmodelId}/submodel-elements/readings`,
            value: [{}, {}],
        });

        await vi.waitFor(() => {
            expect(mockDeps.postSubmodelElement).toHaveBeenCalledWith(
                expect.objectContaining({ idShort: 'temperature_copy' }),
                submodelId,
                'readings'
            );
            expect(mockDeps.routerPush).toHaveBeenCalledWith({
                query: expect.objectContaining({
                    path: `https://example.test/submodels/${encodedSubmodelId}/submodel-elements/readings%5B2%5D`,
                }),
            });
            expect(mockDeps.dispatchTriggerTreeviewReload).toHaveBeenCalled();
        });
    });

    it('pastes Submodel and updates routing to new submodel endpoint', async () => {
        const { pasteElement } = useClipboardUtil();

        mockState.selectedAAS = { submodels: [] };
        mockState.clipboardContent = { modelType: 'Submodel', id: 'old-id' };

        vi.spyOn(jsonization, 'submodelFromJsonable').mockReturnValue({
            error: null,
            mustValue: () => ({ id: 'old-id' }),
        } as any);

        vi.spyOn(jsonization, 'assetAdministrationShellFromJsonable').mockReturnValue({
            error: null,
            mustValue: () => ({ submodels: [] as Array<any> }),
        } as any);

        await pasteElement();

        await vi.waitFor(() => {
            expect(mockDeps.postSubmodel).toHaveBeenCalled();
            expect(mockDeps.putAas).toHaveBeenCalled();
            expect(mockDeps.routerPush).toHaveBeenCalledWith({
                query: expect.objectContaining({
                    path: `${mockState.submodelRepoUrl}/${base64Encode('https://example.com/ids/sm/new-id')}`,
                }),
            });
            expect(mockDeps.dispatchTriggerTreeviewReload).toHaveBeenCalled();
        });
    });
});
