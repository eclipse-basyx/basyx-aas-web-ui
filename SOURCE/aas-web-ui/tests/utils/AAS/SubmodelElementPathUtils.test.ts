import { describe, expect, it } from 'vitest';
import {
    getCreatedSubmodelElementPath,
    getDataElementModelTypes,
    isDataElementModelType,
} from '@/utils/AAS/SubmodelElementPathUtils';

describe('SubmodelElementPathUtils.ts', () => {
    it('returns immutable copy for data element model types', () => {
        const first = getDataElementModelTypes();
        const second = getDataElementModelTypes();

        expect(first).toEqual(['Property', 'MultiLanguageProperty', 'Range', 'Blob', 'File', 'ReferenceElement']);
        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('accepts supported data element model types and rejects unsupported types', () => {
        expect(isDataElementModelType('Property')).toBe(true);
        expect(isDataElementModelType('ReferenceElement')).toBe(true);
        expect(isDataElementModelType('SubmodelElementCollection')).toBe(false);
        expect(isDataElementModelType('AnnotatedRelationshipElement')).toBe(false);
        expect(isDataElementModelType(undefined)).toBe(false);
    });

    it('normalizes function-shaped modelType values', () => {
        expect(isDataElementModelType(() => 'File')).toBe(true);
        expect(isDataElementModelType(() => 123)).toBe(false);
    });

    it('builds path for direct children of Submodel', () => {
        const path = getCreatedSubmodelElementPath(
            { modelType: 'Submodel', path: 'https://example.test/submodels/abc' },
            'temperature'
        );

        expect(path).toBe('https://example.test/submodels/abc/submodel-elements/temperature');
    });

    it('builds list index path for SubmodelElementList parent', () => {
        const path = getCreatedSubmodelElementPath(
            {
                modelType: 'SubmodelElementList',
                path: 'https://example.test/submodels/abc/submodel-elements/measurements',
                value: [{}, {}],
            },
            'ignoredIdShort'
        );

        expect(path).toBe('https://example.test/submodels/abc/submodel-elements/measurements%5B2%5D');
    });

    it('builds dot path for nested non-list parents', () => {
        const path = getCreatedSubmodelElementPath(
            {
                modelType: 'Entity',
                path: 'https://example.test/submodels/abc/submodel-elements/plant.sectionA',
            },
            'pressure'
        );

        expect(path).toBe('https://example.test/submodels/abc/submodel-elements/plant.sectionA.pressure');
    });

    it('returns undefined for missing required data', () => {
        expect(getCreatedSubmodelElementPath(undefined, 'x')).toBeUndefined();
        expect(getCreatedSubmodelElementPath({ modelType: 'Submodel', path: 'a' }, undefined)).toBeUndefined();
        expect(
            getCreatedSubmodelElementPath({ modelType: 'SubmodelElementList', path: 'a', value: undefined }, 'x')
        ).toBeUndefined();
        expect(getCreatedSubmodelElementPath({ modelType: 'Entity', path: 'a' }, undefined)).toBeUndefined();
    });
});
