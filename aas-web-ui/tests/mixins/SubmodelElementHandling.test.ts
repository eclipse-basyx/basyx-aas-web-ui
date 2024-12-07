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
            testId: '82f1c855-0a14-4b0c-97af-d4fbfba09887',
            semanticId: iri,
            submodelElementSemanticId: iri,
            strategy: 'exact',
            match: true,
        },

        // Eclass IRDI (hash) test cases
        {
            testId: '24d16939-05f4-423b-b71b-f6f4f49ef30f',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: 'de06d9a2-2ec6-4e96-b980-805f91cd227e',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: 'fe537c60-8861-44ba-9f96-1e833e20a817',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: '202b728f-cd53-4e9d-b012-fabf6834b83e',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (slashes) test cases
        {
            testId: 'a487d056-5073-4b42-9604-3a4554bbd8ac',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '574d916e-7a62-44b7-ab9b-2c4709043ea2',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '8dff5406-1306-4779-af2e-6206e17d1144',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: 'b1780374-2c0a-4b0a-a79f-61f2f506522b',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRI test cases
        {
            testId: 'e0c9a3a2-0f3e-4e81-a92f-3bb17a3e0683',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: 'ec20a616-e81a-444c-8d6e-66bf30f44bee',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '955ea7bb-7ee8-4eac-a3d5-3523d2da2724',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: '8c65b235-a3a7-4646-bd95-1cf6ad21bb3b',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },

        // Eclass IRDI (hash) and IRDI (slashes) test cases
        {
            testId: '4b0dfe5e-92ef-4433-8798-8617720df742',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '7d421d96-37ba-47c8-b79a-80bcc92d14d6',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '6dd5d815-7900-4517-889a-bc26f1098787',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '4fafecca-8e3a-447d-b7a2-229613a081af',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '508e6c73-364f-4c0a-9273-aadbfaa6d7ba',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: 'a1052a73-7168-4525-a2fe-c42a9bffb43d',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: true,
        },

        {
            testId: 'fbdf6322-e8a2-4fda-9675-9b193f77db6b',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: true,
        },
        {
            testId: '525ec3a2-a04c-4a96-a6af-6d6f73da2c47',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: false,
        },

        // Eclass IRDI (hash) and IRI test cases
        {
            testId: '66deb956-4e3e-4a81-a0a3-bf3d3b079335',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '71802bad-37a5-4600-8071-35de601a84ea',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '23299e0d-9704-4cbe-ae39-59cb4b27afe0',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '05f230df-ca2b-4985-8c91-d0ac2157abea',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '4e4cf96e-4933-4076-b074-2f1fdb95aed5',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: 'f8ccc6c0-21b0-4e48-b59f-993eb010fe98',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: '',
            match: true,
        },

        {
            testId: '167fcf54-07d1-4f7b-b8e2-01f5e353f3af',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },
        {
            testId: '6b12c5d7-8131-4cc6-a7ba-04833afb22bc',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: '',
            match: false,
        },

        // Eclass IRDI (slashes) and IRI test cases
        {
            testId: '5bb7ed0f-b060-471d-961e-688eb7645a13',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: '19c3b5d2-ccae-4f59-8d3b-720c4c85c5ae',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '5a745b0a-3fea-46d1-a1de-7d90f9065d91',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact',
            match: true,
        },
        {
            testId: 'ba320f14-4da3-4683-aeb0-572c13733565',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact',
            match: true,
        },

        {
            testId: '9207df96-6488-4f29-9d0d-da174d0dc58e',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: '',
            match: false,
        },
        {
            testId: '76fc30f2-6f9b-49d8-ad30-72af38d1ad62',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: '',
            match: true,
        },

        {
            testId: 'a24cda5d-f281-4a82-85bb-8e44c3643272',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: '',
            match: true,
        },
        {
            testId: '6c1845d8-bfd0-4e4a-b00a-e4a3ef41cc20',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: '',
            match: false,
        },
    ];

    // Tests for semanticIdCheck()
    semanticIdTestCombinations.forEach(function (semanticIdTestCombination) {
        it(`${semanticIdTestCombination.testId}: Should return ${semanticIdTestCombination.match} for ${semanticIdTestCombination.strategy} matching ${semanticIdTestCombination.submodelElementSemanticId} and ${semanticIdTestCombination.semanticId}`, () => {
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
