import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { createWrapper, initMockEnvironment } from './AASList.helper';

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

describe('AASList - sorting', () => {
    let wrapper: any;
    let setList: (list: any[]) => void;

    beforeAll(() => {
        initMockEnvironment();
    });

    beforeEach(() => {
        ({ wrapper, setList } = createWrapper());
    });

    it.each([
        {
            name: 'sorts by id ascending',
            sortField: 'id',
            sortDirection: 1,
            map: (item: any) => item.id,
            expected: ['a', 'b', 'c'],
        },
        {
            name: 'sorts by id descending',
            sortField: 'id',
            sortDirection: -1,
            map: (item: any) => item.id,
            expected: ['c', 'b', 'a'],
        },
        {
            name: 'sorts by idShort ascending',
            sortField: 'idShort',
            sortDirection: 1,
            map: (item: any) => item.idShort,
            expected: ['aaa', 'bbb', 'ccc'],
        },
        {
            name: 'sorts by idShort descending',
            sortField: 'idShort',
            sortDirection: -1,
            map: (item: any) => item.idShort,
            expected: ['ccc', 'bbb', 'aaa'],
        },
        {
            name: 'sorts by createdAt ascending',
            sortField: 'createdAt',
            sortDirection: 1,
            map: (item: any) => item.administration.createdAt,
            expected: ['2022-01-01', '2023-01-01', '2024-01-01'],
        },
        {
            name: 'sorts by createdAt descending',
            sortField: 'createdAt',
            sortDirection: -1,
            map: (item: any) => item.administration.createdAt,
            expected: ['2024-01-01', '2023-01-01', '2022-01-01'],
        },
        {
            name: 'sorts by updatedAt ascending',
            sortField: 'updatedAt',
            sortDirection: 1,
            map: (item: any) => item.administration.updatedAt,
            expected: ['2022-05-01', '2023-05-01', '2024-05-01'],
        },
        {
            name: 'sorts by updatedAt descending',
            sortField: 'updatedAt',
            sortDirection: -1,
            map: (item: any) => item.administration.updatedAt,
            expected: ['2024-05-01', '2023-05-01', '2022-05-01'],
        },
    ])('$name', ({ sortField, sortDirection, map, expected }) => {
        setList(mockAas);

        wrapper.vm.setSortOptions({ sortField, sortDirection });

        const result = wrapper.vm.aasList.map(map);
        expect(result).toEqual(expected);
    });

    it('handles missing createdAt gracefully', () => {
        setList([
            { id: '1', idLower: '1', administration: {} },
            { id: '2', idLower: '2', administration: { createdAt: '2023-01-01' } },
        ]);

        wrapper.vm.setSortOptions({ sortField: 'createdAt', sortDirection: 1 });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['1', '2']); // 0 comes first
    });

    it('sorts by name', () => {
        setList(mockAas);
        wrapper.vm.nameToDisplay = (item: any) => {
            const map: any = { a: 'Alpha', b: 'Bravo', c: 'Charlie' };
            return map[item.id];
        };

        wrapper.vm.setSortOptions({ sortField: 'name', sortDirection: 1 });

        const ids = wrapper.vm.aasList.map((i: any) => i.id);
        expect(ids).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate original array reference', () => {
        const original = [...mockAas];
        wrapper.vm.aasList = original;
        wrapper.vm.aasListUnfiltered = [...mockAas];

        wrapper.vm.setSortOptions({ sortField: 'id', sortDirection: 1 });

        expect(wrapper.vm.aasList).not.toBe(original);
    });

    it('handles unknown sort field safely', () => {
        setList(mockAas);

        expect(() => {
            wrapper.vm.setSortOptions({ sortField: 'unknown', sortDirection: 1 });
        }).toThrow();
    });
});