import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AASList from '@/components/AppNavigation/AASList.vue';

vi.mock('@/composables/AAS/AASHandling', () => ({
    useAASHandling: () => ({
        fetchAasDescriptorList: vi.fn().mockResolvedValue([]),
        fetchAasList: vi.fn().mockResolvedValue([]),
        fetchAas: vi.fn().mockResolvedValue({}),
        fetchAasSmListById: vi.fn().mockResolvedValue([]),
        aasIsAvailableById: vi.fn().mockResolvedValue(true),
    }),
}));

vi.mock('@/composables/AAS/ReferableUtils', () => ({
    useReferableUtils: () => ({
        nameToDisplay: (item: any) => item.id,
        descriptionToDisplay: () => '',
    }),
}));

vi.mock('@/composables/ClipboardUtil', () => ({
    useClipboardUtil: () => ({
        copyToClipboard: vi.fn(),
    }),
}));

describe('AASList', () => {
    let wrapper: any;

    const mockAas = [
        {
            id: 'b',
            idLower: 'b',
            idShort: 'bbb',
            idShortLower: 'bbb',
            administration: {
                createdAt: '2023-01-01',
                updatedAt: '2023-05-01',
            },
        },
        {
            id: 'a',
            idLower: 'a',
            idShort: 'aaa',
            idShortLower: 'aaa',
            administration: {
                createdAt: '2022-01-01',
                updatedAt: '2022-05-01',
            },
        },
        {
            id: 'c',
            idLower: 'c',
            idShort: 'ccc',
            idShortLower: 'ccc',
            administration: {
                createdAt: '2024-01-01',
                updatedAt: '2024-05-01',
            },
        },
    ];

    beforeEach(() => {
        wrapper = mount(AASList, {
            global: {
                mocks: {
                    nameToDisplay: (item: any) => item.id,
                },
            },
        });

        wrapper.vm.aasList = [...mockAas];
        wrapper.vm.aasListUnfiltered = [...mockAas];
    });

    it('sorts by id ascending', async () => {
        wrapper.vm.setSortOptions({ sortField: 'id', sortDirection: 1 });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['a', 'b', 'c']);
    });

    it('sorts by id descending', async () => {
        wrapper.vm.setSortOptions({ sortField: 'id', sortDirection: -1 });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['c', 'b', 'a']);
    });

    it('sorts by idShort ascending', () => {
        wrapper.vm.setSortOptions({ sortField: 'idShort', sortDirection: 1 });

        const values = wrapper.vm.aasList.map((i: any) => i.idShort);
        expect(values).toEqual(['aaa', 'bbb', 'ccc']);
    });

    it('sorts by createdAt ascending', () => {
        wrapper.vm.setSortOptions({ sortField: 'createdAt', sortDirection: 1 });

        const values = wrapper.vm.aasList.map((i: any) => i.administration.createdAt);
        expect(values).toEqual([
            '2022-01-01',
            '2023-01-01',
            '2024-01-01',
        ]);
    });

    it('sorts by updatedAt descending', () => {
        wrapper.vm.setSortOptions({ sortField: 'updatedAt', sortDirection: -1 });

        const values = wrapper.vm.aasList.map((i: any) => i.administration.updatedAt);
        expect(values).toEqual([
            '2024-05-01',
            '2023-05-01',
            '2022-05-01',
        ]);
    });

    it('sorts by name', () => {
        wrapper.vm.nameToDisplay = (item: any) => {
            const map: any = { a: 'Alpha', b: 'Bravo', c: 'Charlie' };
            return map[item.id];
        };

        wrapper.vm.setSortOptions({ sortField: 'name', sortDirection: 1 });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['a', 'b', 'c']);
    });
});