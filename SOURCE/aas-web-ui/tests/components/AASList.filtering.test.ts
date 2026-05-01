import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { createWrapper, initMockEnvironment } from './AASList.helper';

const baseAttributes = {
    idShortLower: '',
    nameLower: '',
    descLower: '',
    manufacturerNameLower: '',
    manufacturerProductDesignationLower: '',
    manufacturerProductFamilyLower: '',
    manufacturerProductTypeLower: '',
    orderCodeOfManufacturerLower: '',
    productArticleNumberOfManufacturerLower: '',
    productClassificationSystemLower: '',
    productClassIdLower: '',
};

const dataset = [
    {
        id: '1',
        idLower: '1',
        ...baseAttributes,
        manufacturerNameLower: 'siemens',
        manufacturerProductDesignationLower: 'motor',
        manufacturerProductFamilyLower: 'drive',
        productClassIdLower: 'a1',
    },
    {
        id: '2',
        idLower: '2',
        ...baseAttributes,
        manufacturerNameLower: 'bosch',
        manufacturerProductDesignationLower: 'pump',
        manufacturerProductFamilyLower: 'hydraulics',
        productClassIdLower: 'b2',
    },
    {
        id: '3',
        idLower: '3',
        ...baseAttributes,
        manufacturerNameLower: 'abb',
        manufacturerProductDesignationLower: 'sensor',
        manufacturerProductFamilyLower: 'automation',
        productClassIdLower: 'c3',
    },
];

const multiDataset = [
    ...dataset,
    {
        id: '4',
        idLower: '4',
        ...baseAttributes,
        manufacturerNameLower: 'bosch',
        manufacturerProductDesignationLower: 'sensor',
        manufacturerProductFamilyLower: 'drive',
        productClassIdLower: 'b2',
    },
];

const undefinedData = [
    {
        id: '1',
        idLower: '1',
        ...baseAttributes,
        manufacturerNameLower: 'bosch',
    },
    {
        id: '2',
        idLower: '2',
        ...baseAttributes,
        manufacturerNameLower: undefined as any,
    },
];

describe('AASList - filtering (minimal suite)', () => {
    let wrapper: any;
    let setList: (list: any[]) => void;

    beforeAll(() => initMockEnvironment());

    beforeEach(() => {
        ({ wrapper, setList } = createWrapper());
    });

    const emptyFilters = {
        manufacturerName: '',
        manufacturerProductDesignation: '',
        manufacturerProductFamily: '',
        manufacturerProductType: '',
        orderCodeOfManufacturer: '',
        productArticleNumberOfManufacturer: '',
        productClassificationSystem: '',
        productClassId: '',
    };

    it.each([
        ['manufacturerName', 'siemens', ['1']],
        ['manufacturerProductDesignation', 'pump', ['2']],
        ['manufacturerProductFamily', 'automation', ['3']],
        ['productClassId', 'c3', ['3']],
    ])('filters %s correctly', async (field, value, expected) => {
        setList(dataset);

        await wrapper.vm.onAttributeFiltersChange({
            ...emptyFilters,
            [field]: value,
        });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(expected);
    });

    it.each([
        ['manufacturerName', 'sie', ['1']],
        ['manufacturerName', 'xyz', []],
        ['manufacturerProductDesignation', 'mot', ['1']],
        ['manufacturerProductDesignation', 'nope', []],
    ])('filters %s by substring/negative "%s"', async (field, value, expected) => {
        setList(dataset);

        await wrapper.vm.onAttributeFiltersChange({
            ...emptyFilters,
            [field]: value,
        });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(expected);
    });

    it.each([
        {
            name: 'valid full match',
            filters: {
                manufacturerName: 'siemens',
                manufacturerProductDesignation: 'motor',
                manufacturerProductFamily: 'drive',
                productClassId: 'a1',
            },
            expected: ['1'],
        },
        {
            name: 'valid full match 2',
            filters: {
                manufacturerName: 'bosch',
                manufacturerProductDesignation: 'pump',
                manufacturerProductFamily: 'hydraulics',
                productClassId: 'b2',
            },
            expected: ['2'],
        },
        {
            name: 'invalid combination',
            filters: {
                manufacturerName: 'siemens',
                manufacturerProductDesignation: 'pump',
                productClassId: 'a1',
            },
            expected: [],
        },
        {
            name: 'cross-field mismatch',
            filters: {
                manufacturerName: 'bosch',
                manufacturerProductDesignation: 'sensor',
                productClassId: 'a1',
            },
            expected: [],
        },
    ])('handles multi-field AND: $name', async ({ filters, expected }) => {
        setList(multiDataset);

        await wrapper.vm.onAttributeFiltersChange({
            ...emptyFilters,
            ...filters,
        });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(expected);
    });

    it('handles case insensitive', async () => {
        setList(dataset);

        await wrapper.vm.onAttributeFiltersChange({
            ...emptyFilters,
            manufacturerName: 'SIEMENS',
        });

        expect(wrapper.vm.aasList.map((i: any) => i.id)).toEqual(['1']);
    });

    it('handles undefined safely', async () => {
        setList(undefinedData);

        await wrapper.vm.onAttributeFiltersChange({
            ...emptyFilters,
            manufacturerName: 'bosch',
        });

        expect(wrapper.vm.aasList.map((i: any) => i.id)).toEqual(['1']);
    });

    it('handles empty filters by returning all items', async () => {
        setList(dataset);

        await wrapper.vm.onAttributeFiltersChange({ ...emptyFilters });

        expect(wrapper.vm.aasList.length).toBe(wrapper.vm.aasListUnfiltered.length);
    });
});