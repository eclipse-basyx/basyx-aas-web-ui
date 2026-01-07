import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { useIDUtils } from '@/composables/IDUtils';

const pinia = createPinia();
setActivePinia(pinia); // Activate Pinia for the test environment

const { customIdRegex, generateCustomId, generateIri } = useIDUtils();

describe("IDUtils.ts; Tests for 'generateIri()'", () => {
    // Test data for generateIri()
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
    // Tests for generateIri()
    generateIriTestData.forEach(function (generateIriTestDataset) {
        // Define test data
        const testId = generateIriTestDataset.testId;
        const type = generateIriTestDataset.type;
        // Expected data/output
        const expectedOutputPrefix = generateIriTestDataset.outputPrefix;
        const expectedRegex = new RegExp(
            '^' + expectedOutputPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\d{4}_\\d{4}_\\d{4}_\\d{4}$'
        );
        // Actual output
        const output = generateIri(type);
        it(`${testId}: generateIri(${("'" + type + "'").padEnd(26, ' ')})`, () => {
            // Perform the assertion
            expect(expectedRegex.test(output)).toBeTruthy();
        });
    });
});

describe("IDUtils.ts; Tests for 'generateCustomId()'", () => {
    // Tests for generateIri()
    for (let i = 0; i < 100; i++) {
        // Expected data/output
        const expectedRegex = new RegExp(customIdRegex);
        // Actual output
        const output = generateCustomId();
        it(`${i}: generateCustomId() = ${output}`, () => {
            // Perform the assertion
            expect(expectedRegex.test(output)).toBeTruthy();
        });
    }
});
