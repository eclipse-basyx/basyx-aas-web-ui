import { shallowMount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

describe('SubmodelElementHandling', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    // Define a test component that uses the mixin
    const DummyComponent = defineComponent({
        mixins: [SubmodelElementHandling],
        template: '<div></div>',
    });

    // Define semanticId
    const iri = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
    const eclassIrdiWithVersion = '0173-1#01-AHF578#001';
    const eclassIrdiWithoutVersion = '0173-1#01-AHF578';
    const eclassIrdiSlashesWithVersion = '0173/1///01#AHF578#001';
    const eclassIrdiSlashesWithoutVersion = '0173/1///01#AHF578';
    const eclassIriWithVersion = 'https://api.eclass-cdp.com/0173-1-01-AHF578-001';
    const eclassIriWithoutVersion = 'https://api.eclass-cdp.com/0173-1-01-AHF578';

    // Define test data for semanticIdCheck()
    const semanticIdTestCombinations = [
        // IRI test cases
        {
            semanticId: iri,
            submodelElementSemanticId: iri,
            strategy: 'exact',
            match: true,
        },

        // Eclass IRDI (hash) test cases
        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (slashes) test cases
        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRI test cases
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (hash) and IRDI (slashes) test cases
        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: false,
        },

        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: true,
        },
        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (hash) and IRI test cases
        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: false,
        },

        {
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (slashes) and IRI test cases
        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: false,
        },

        {
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },
        {
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: true,
        },
    ];

    // Tests for semanticIdCheck()
    semanticIdTestCombinations.forEach(function (semanticIdTestCombination) {
        it(`Should return ${semanticIdTestCombination.match} for ${semanticIdTestCombination.strategy} matching ${semanticIdTestCombination.submodelElementSemanticId} and ${semanticIdTestCombination.semanticId}`, () => {
            // Mount the component
            const wrapper: VueWrapper<any> = shallowMount(DummyComponent);

            // Define test data
            const semanticId = semanticIdTestCombination.semanticId; //e.g. the ID of a ConceptDescription
            const submodelElement = {
                semanticId: { keys: [{ value: semanticIdTestCombination.submodelElementSemanticId }] },
            };

            // Perform the assertion
            expect(wrapper.vm.checkSemanticId(submodelElement, semanticId)).toBe(semanticIdTestCombination.match);
        });
    });
});
