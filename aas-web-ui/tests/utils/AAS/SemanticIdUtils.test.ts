import { describe, expect, it } from 'vitest';
import {
    checkSemanticId,
    getEquivalentEclassSemanticIds,
    getEquivalentIriSemanticIds,
} from '@/utils/AAS/SemanticIdUtils';

describe('SemanticIdUtils.ts; Tests for checkSemanticId()', () => {
    // Define semanticId
    const iriWithSlashEnding = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate/';
    const iriWithoutSlashEnding = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
    const iriWithVersionWithSlashEnding = 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9/';
    const iriWithVersionWithoutSlashEnding = 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9';
    const iriWithoutVersionWithSlashEnding = 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/';
    const iriWithoutVersionWithoutSlashEnding = 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint';
    const iriSMContactInformations = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations';
    const iriSMCContactInformation = 'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/ContactInformation';
    const eclassIrdiWithVersion = '0173-1#01-AHF578#001';
    const eclassIrdiWithoutVersion = '0173-1#01-AHF578';
    const eclassIrdiWithVersionAndCardinality = '0173-1#02-ABI502#001/0173-1#01-AHF581#001*02';
    const eclassIrdiWithVersionAndNoCardinality = '0173-1#02-ABI502#001/0173-1#01-AHF581#001';
    const eclassIrdiSlashesWithVersion = '0173/1///01#AHF578#001';
    const eclassIrdiSlashesWithoutVersion = '0173/1///01#AHF578';
    const eclassIriWithVersion = 'https://api.eclass-cdp.com/0173-1-01-AHF578-001';
    const eclassIriWithoutVersion = 'https://api.eclass-cdp.com/0173-1-01-AHF578';
    const eclassIriWithVersionAndCardinality = 'https://api.eclass-cdp.com/0173-1-01-AHF578-001~1';
    const eclassIriWithVersionAndNoCardinality = 'https://api.eclass-cdp.com/0173-1-01-AHF578';
    const ieccddIrdiWithVersion = '0112/2///61987#ABN590#002';
    const ieccddIrdiWithOutVersion = '0112/2///61987#ABN590';

    // Define test data for semanticIdCheck()
    const semanticIdTestCombinations = [
        // IRI test cases
        {
            testId: '892c1774-1a70-42b9-bf88-4b65f0d3fe91',
            semanticId: iriSMContactInformations,
            submodelElementSemanticId: iriSMCContactInformation,
            strategy: 'matching',
            match: false,
        },
        {
            testId: 'b38afe86-a3e8-4309-9e73-94897737ad15',
            semanticId: iriSMCContactInformation,
            submodelElementSemanticId: iriSMContactInformations,
            strategy: 'matching',
            match: false,
        },

        {
            testId: '82f1c855-0a14-4b0c-97af-d4fbfba09887',
            semanticId: iriWithSlashEnding,
            submodelElementSemanticId: iriWithSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '6d5797cf-a054-40b9-9ea4-158b7a7221c0',
            semanticId: iriWithSlashEnding,
            submodelElementSemanticId: iriWithoutSlashEnding,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'f48684c9-e681-48a1-a213-6068849c9f7e',
            semanticId: iriWithoutSlashEnding,
            submodelElementSemanticId: iriWithoutSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '49c01e4d-1891-415b-9288-7333a53767d4',
            semanticId: iriWithoutSlashEnding,
            submodelElementSemanticId: iriWithSlashEnding,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'bc8ee131-c2c7-4075-bc89-9d3e77ae2c53',
            semanticId: iriWithVersionWithSlashEnding,
            submodelElementSemanticId: iriWithVersionWithSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '2a8bc0bc-50fc-42ae-bb88-c065a1b7d975',
            semanticId: iriWithVersionWithSlashEnding,
            submodelElementSemanticId: iriWithVersionWithoutSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'b185ff3a-4b05-4d8b-b8f9-60aa3d7da172',
            semanticId: iriWithVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithVersionWithoutSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '876c4b9c-67c4-45fb-9975-f61c68df5cc6',
            semanticId: iriWithVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithVersionWithSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '9364aac9-ffcc-4a13-9467-ef6ef0182855',
            semanticId: iriWithoutVersionWithSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '7d2c5afb-f28c-48c4-981f-22bccc55971d',
            semanticId: iriWithoutVersionWithSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithoutSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'd0de3e76-10b0-4a89-9ce1-a1931e023cbc',
            semanticId: iriWithoutVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithoutSlashEnding,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '068e2995-94c5-4edd-aa4e-4e3b17508bfe',
            semanticId: iriWithoutVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithSlashEnding,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '49e94635-aefc-4f87-b784-e0f71d38c809',
            semanticId: iriWithVersionWithSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithSlashEnding,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '4af49942-f8e2-47cb-8259-19c429ef5e00',
            semanticId: iriWithVersionWithSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithoutSlashEnding,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '0270ef6e-af5b-4c2c-97c2-0be7a5317d04',
            semanticId: iriWithVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithSlashEnding,
            strategy: 'matching',
            match: false,
        },
        {
            testId: 'a81bc8a5-78ec-4c47-80da-abbce84885c9',
            semanticId: iriWithVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithoutVersionWithoutSlashEnding,
            strategy: 'matching',
            match: false,
        },

        {
            testId: 'bf18a7e3-6265-4f30-b223-0f059e13fb0c',
            semanticId: iriWithoutVersionWithSlashEnding,
            submodelElementSemanticId: iriWithVersionWithSlashEnding,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'dbb08069-8522-4eed-8a43-b38da96959a5',
            semanticId: iriWithoutVersionWithSlashEnding,
            submodelElementSemanticId: iriWithVersionWithoutSlashEnding,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'cde326ae-de0f-4cda-8891-b1badf4404ac',
            semanticId: iriWithoutVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithVersionWithSlashEnding,
            strategy: 'matching',
            match: true,
        },
        {
            testId: '37aaa79f-1815-4068-8403-2261f99c6525',
            semanticId: iriWithoutVersionWithoutSlashEnding,
            submodelElementSemanticId: iriWithVersionWithoutSlashEnding,
            strategy: 'matching',
            match: true,
        },

        // IEC CDD (test cases)
        {
            testId: 'd6f94546-1819-472f-bcff-ade7944da5d6',
            semanticId: ieccddIrdiWithVersion,
            submodelElementSemanticId: ieccddIrdiWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '1daf6f2c-5a10-48de-9b31-b5539061b4c2',
            semanticId: ieccddIrdiWithOutVersion,
            submodelElementSemanticId: ieccddIrdiWithOutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '2c8d1ce5-4cbf-4a78-a02d-70e35970cd07',
            semanticId: ieccddIrdiWithVersion,
            submodelElementSemanticId: ieccddIrdiWithOutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '9662075d-a90d-4857-96e0-f695a2dc40ed',
            semanticId: ieccddIrdiWithOutVersion,
            submodelElementSemanticId: ieccddIrdiWithVersion,
            strategy: 'matching',
            match: true,
        },

        // Eclass IRDI (hash) test cases
        {
            testId: '24d16939-05f4-423b-b71b-f6f4f49ef30f',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'ec1566eb-3270-4f8a-96af-6397ffb7ec97',
            semanticId: eclassIrdiWithVersionAndCardinality,
            submodelElementSemanticId: eclassIrdiWithVersionAndCardinality,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'e3ee74ed-aa21-49f3-b806-78e9fbd05939',
            semanticId: eclassIrdiWithVersionAndNoCardinality,
            submodelElementSemanticId: eclassIrdiWithVersionAndNoCardinality,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '8418f0c3-018b-435c-bba0-1c3068d62df0',
            semanticId: eclassIrdiWithVersionAndCardinality,
            submodelElementSemanticId: eclassIrdiWithVersionAndNoCardinality,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '7db389a3-a467-4ad5-84b2-add2bdaeccd9',
            semanticId: eclassIrdiWithVersionAndNoCardinality,
            submodelElementSemanticId: eclassIrdiWithVersionAndCardinality,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'de06d9a2-2ec6-4e96-b980-805f91cd227e',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'fe537c60-8861-44ba-9f96-1e833e20a817',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '202b728f-cd53-4e9d-b012-fabf6834b83e',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'matching',
            match: true,
        },

        // Eclass IRDI (slashes) test cases
        {
            testId: 'a487d056-5073-4b42-9604-3a4554bbd8ac',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '574d916e-7a62-44b7-ab9b-2c4709043ea2',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '8dff5406-1306-4779-af2e-6206e17d1144',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: 'b1780374-2c0a-4b0a-a79f-61f2f506522b',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'matching',
            match: true,
        },

        // Eclass IRI test cases
        {
            testId: 'e0c9a3a2-0f3e-4e81-a92f-3bb17a3e0683',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'ec20a616-e81a-444c-8d6e-66bf30f44bee',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '955ea7bb-7ee8-4eac-a3d5-3523d2da2724',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '8c65b235-a3a7-4646-bd95-1cf6ad21bb3b',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'matching',
            match: true,
        },

        // Eclass IRDI (hash) and IRDI (slashes) test cases
        {
            testId: '4b0dfe5e-92ef-4433-8798-8617720df742',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '7d421d96-37ba-47c8-b79a-80bcc92d14d6',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '6dd5d815-7900-4517-889a-bc26f1098787',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '4fafecca-8e3a-447d-b7a2-229613a081af',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '508e6c73-364f-4c0a-9273-aadbfaa6d7ba',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: 'a1052a73-7168-4525-a2fe-c42a9bffb43d',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'matching',
            match: true,
        },

        {
            testId: 'fbdf6322-e8a2-4fda-9675-9b193f77db6b',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'matching',
            match: true,
        },
        {
            testId: '525ec3a2-a04c-4a96-a6af-6d6f73da2c47',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'matching',
            match: false,
        },

        // Eclass IRDI (hash) and IRI test cases
        {
            testId: '66deb956-4e3e-4a81-a0a3-bf3d3b079335',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '71802bad-37a5-4600-8071-35de601a84ea',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '23299e0d-9704-4cbe-ae39-59cb4b27afe0',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '05f230df-ca2b-4985-8c91-d0ac2157abea',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '4e4cf96e-4933-4076-b074-2f1fdb95aed5',
            semanticId: eclassIrdiWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: 'f8ccc6c0-21b0-4e48-b59f-993eb010fe98',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiWithVersion,
            strategy: 'matching',
            match: true,
        },

        {
            testId: '167fcf54-07d1-4f7b-b8e2-01f5e353f3af',
            semanticId: eclassIrdiWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'matching',
            match: true,
        },
        {
            testId: '6b12c5d7-8131-4cc6-a7ba-04833afb22bc',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiWithoutVersion,
            strategy: 'matching',
            match: false,
        },

        // Eclass IRDI (slashes) and IRI test cases
        {
            testId: '5bb7ed0f-b060-471d-961e-688eb7645a13',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '19c3b5d2-ccae-4f59-8d3b-720c4c85c5ae',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '5a745b0a-3fea-46d1-a1de-7d90f9065d91',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'ba320f14-4da3-4683-aeb0-572c13733565',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'exact matching',
            match: true,
        },

        {
            testId: '9207df96-6488-4f29-9d0d-da174d0dc58e',
            semanticId: eclassIrdiSlashesWithVersion,
            submodelElementSemanticId: eclassIriWithoutVersion,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '76fc30f2-6f9b-49d8-ad30-72af38d1ad62',
            semanticId: eclassIriWithoutVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithVersion,
            strategy: 'matching',
            match: true,
        },
        {
            testId: 'ec1566eb-3270-4f8a-96af-6397ffb7ec97',
            semanticId: eclassIriWithVersionAndCardinality,
            submodelElementSemanticId: eclassIriWithVersionAndCardinality,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: 'e3ee74ed-aa21-49f3-b806-78e9fbd05939',
            semanticId: eclassIriWithVersionAndNoCardinality,
            submodelElementSemanticId: eclassIriWithVersionAndNoCardinality,
            strategy: 'exact matching',
            match: true,
        },
        {
            testId: '8418f0c3-018b-435c-bba0-1c3068d62df0',
            semanticId: eclassIriWithVersionAndCardinality,
            submodelElementSemanticId: eclassIriWithVersionAndNoCardinality,
            strategy: 'matching',
            match: false,
        },
        {
            testId: '7db389a3-a467-4ad5-84b2-add2bdaeccd9',
            semanticId: eclassIriWithVersionAndNoCardinality,
            submodelElementSemanticId: eclassIriWithVersionAndCardinality,
            strategy: 'matching',
            match: true,
        },

        {
            testId: 'a24cda5d-f281-4a82-85bb-8e44c3643272',
            semanticId: eclassIrdiSlashesWithoutVersion,
            submodelElementSemanticId: eclassIriWithVersion,
            strategy: 'matching',
            match: true,
        },
        {
            testId: '6c1845d8-bfd0-4e4a-b00a-e4a3ef41cc20',
            semanticId: eclassIriWithVersion,
            submodelElementSemanticId: eclassIrdiSlashesWithoutVersion,
            strategy: 'matching',
            match: false,
        },
    ];

    // Tests for semanticIdCheck()
    semanticIdTestCombinations.forEach(function (semanticIdTestCombination) {
        // Define test data
        const semanticId = semanticIdTestCombination.semanticId; //e.g. the ID of a ConceptDescription
        const submodelElement = {
            semanticId: { keys: [{ value: semanticIdTestCombination.submodelElementSemanticId }] },
        };

        it(`${semanticIdTestCombination.testId}: Should return ${semanticIdTestCombination.match.toString().padEnd(5, ' ')} for ${semanticIdTestCombination.strategy.padEnd(14, ' ')} ${semanticIdTestCombination.submodelElementSemanticId.padEnd(85, ' ')} and ${semanticIdTestCombination.semanticId}`, () => {
            // Perform the assertion
            expect(checkSemanticId(submodelElement, semanticId)).toBe(semanticIdTestCombination.match);
        });
    });
});

describe('SemanticIdUtils.ts; Tests for getEquivalentEclassSemanticIds()', () => {
    // Define test data for getEquivalentEclassSemanticId()
    const equivalentElcassSemanticIds = [
        {
            testId: 'f53aef0c-dfc8-4408-b803-f501cba3122a',
            semanticId: '0173-1#01-AHF578#001',
            semanticIds: [
                '0173-1#01-AHF578#001',
                '0173/1///01#AHF578#001',
                'https://api.eclass-cdp.com/0173-1-01-AHF578-001',
            ],
        },
        {
            testId: '7106149a-b8fa-4059-9776-d2e37ad35fd2',
            semanticId: '0173-1#01-AHF578',
            semanticIds: ['0173-1#01-AHF578', '0173/1///01#AHF578', 'https://api.eclass-cdp.com/0173-1-01-AHF578'],
        },
    ];

    // Tests for getEquivalentEclassSemanticId()
    equivalentElcassSemanticIds.forEach(function (equivalentElcassSemanticId) {
        // Define test data
        const semanticId = equivalentElcassSemanticId.semanticId; //e.g. the ID of a ConceptDescription
        const semanticIds = equivalentElcassSemanticId.semanticIds;

        it(
            `${equivalentElcassSemanticId.testId}: getEquivalentEclassSemanticIds(${("'" + semanticId + "'").padEnd(25, ' ')}) === ` +
                "['" +
                semanticIds.toString().replaceAll(',', "', '") +
                "']",
            () => {
                // Perform the assertion
                expect(getEquivalentEclassSemanticIds(semanticId).sort()).toStrictEqual(semanticIds.sort());
            }
        );
    });
});

describe('SemanticIdUtils.ts; Tests for getEquivalentIriSemanticIds()', () => {
    // Define test data for getEquivalentEclassSemanticId()
    const equivalentIriSemanticIds = [
        {
            testId: '71eeb554-da62-4f91-85b2-bd2be844ada0',
            semanticId: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate/',
            semanticIds: [
                'https://admin-shell.io/zvei/nameplate/2/0/Nameplate/',
                'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
            ],
        },
        {
            testId: 'e518544c-f874-4b45-a9b0-442d0c740af9',
            semanticId: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
            semanticIds: [
                'https://admin-shell.io/zvei/nameplate/2/0/Nameplate/',
                'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
            ],
        },
    ];

    // Tests for getEquivalentEclassSemanticId()
    equivalentIriSemanticIds.forEach(function (equivalentIriSemanticId) {
        // Define test data
        const semanticId = equivalentIriSemanticId.semanticId; //e.g. the ID of a ConceptDescription
        const semanticIds = equivalentIriSemanticId.semanticIds;

        it(
            `${equivalentIriSemanticId.testId}: getEquivalentIriSemanticIds(${("'" + semanticId + "'").padEnd(55, ' ')}) === ` +
                "['" +
                semanticIds.toString().replaceAll(',', "', '") +
                "']",
            () => {
                // Perform the assertion
                expect(getEquivalentIriSemanticIds(semanticId).sort()).toStrictEqual(semanticIds.sort());
            }
        );
    });
});
