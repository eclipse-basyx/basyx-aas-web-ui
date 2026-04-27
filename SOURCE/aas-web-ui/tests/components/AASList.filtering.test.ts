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

const manufacturerData = [
    {
        id: '1',
        idLower: '1',
        ...baseAttributes,
        manufacturerNameLower: 'siemens',
    },
    {
        id: '2',
        idLower: '2',
        ...baseAttributes,
        manufacturerNameLower: 'bosch',
    },
];

const multiAttributeData = [
    {
        id: '1',
        idLower: '1',
        ...baseAttributes,
        manufacturerNameLower: 'siemens',
        manufacturerProductDesignationLower: 'motor',
    },
    {
        id: '2',
        idLower: '2',
        ...baseAttributes,
        manufacturerNameLower: 'siemens',
        manufacturerProductDesignationLower: 'pump',
    },
];

describe('AASList - filtering', () => {
    let wrapper: any;
    let setList: (list: any[]) => void;

    beforeAll(() => {
        initMockEnvironment();
    });

    beforeEach(() => {
        ({ wrapper, setList } = createWrapper());
    });

    it('filters by manufacturerName', async () => {
        setList(manufacturerData);

        await wrapper.vm.onAttributeFiltersChange({
            manufacturerName: 'sie',
            manufacturerProductDesignation: '',
            manufacturerProductFamily: '',
            manufacturerProductType: '',
            orderCodeOfManufacturer: '',
            productArticleNumberOfManufacturer: '',
            productClassificationSystem: '',
            productClassId: '',
        });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['1']);
    });

    it('filters by multiple attributes', async () => {
        setList(multiAttributeData);

        await wrapper.vm.onAttributeFiltersChange({
            manufacturerName: 'siemens',
            manufacturerProductDesignation: 'motor',
            manufacturerProductFamily: '',
            manufacturerProductType: '',
            orderCodeOfManufacturer: '',
            productArticleNumberOfManufacturer: '',
            productClassificationSystem: '',
            productClassId: '',
        });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['1']);
    });

    it('returns all items when filters are empty', async () => {
        setList(manufacturerData);

        await wrapper.vm.onAttributeFiltersChange({
            manufacturerName: '',
            manufacturerProductDesignation: '',
            manufacturerProductFamily: '',
            manufacturerProductType: '',
            orderCodeOfManufacturer: '',
            productArticleNumberOfManufacturer: '',
            productClassificationSystem: '',
            productClassId: '',
        });

        expect(wrapper.vm.aasList.length).toBe(wrapper.vm.aasListUnfiltered.length);
    });
});