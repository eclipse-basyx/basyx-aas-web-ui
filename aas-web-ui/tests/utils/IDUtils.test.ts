import { describe, expect, it } from 'vitest';
import { generateIri } from '@/utils/IDUtils';

describe("IDUtils.ts; Tests for 'generateIri()'", () => {
    // Define test data for nameToDisplay()
    const generateIriTestData = [
        {
            testId: '59206aa5-bc25-4505-9395-afc9aa8051f3',
            type: 'Asset',
            outputPrefix: 'https://example.com/ids/asset/',
        },
        {
            testId: '7b370802-9271-41b1-b35b-f1ba30f949fb',
            type: 'AssetAdministrationShell',
            outputPrefix: 'https://example.com/ids/aas/',
        },
        {
            testId: 'bbafe34c-7ccd-4d14-93e1-39e947c6c7e9',
            type: 'Submodel',
            outputPrefix: 'https://example.com/ids/sm/',
        },
        {
            testId: 'bbafe34c-7ccd-4d14-93e1-39e947c6c7e9',
            type: 'INVALID',
            outputPrefix: 'https://example.com/ids/',
        },
    ];

    // Tests for nameToDisplay()
    generateIriTestData.forEach(function (generateIriTestDataset) {
        // Define test data
        const type = generateIriTestDataset.type;
        const outputPrefix = generateIriTestDataset.outputPrefix;

        it(`${generateIriTestDataset.testId}: generateIri(${("'" + type + "'").padEnd(25, ' ')})`, () => {
            // Perform the assertion
            expect(generateIri(type).startsWith(outputPrefix)).toBeTruthy();
            expect(/\/\d{4}_\d{4}_\d{4}_\d{4}$/.test(generateIri(type))).toBeTruthy();
        });
    });
});
