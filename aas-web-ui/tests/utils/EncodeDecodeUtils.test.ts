import { describe, expect, it } from 'vitest';
import { base64Decode, base64Encode } from '@/utils/EncodeDecodeUtils';

// Define test data
const testData = [
    {
        testId: '86b04fb5-a1d4-4f8b-9b60-e2c8ee3ff0e3',
        id: 'https://basyx.org/aas/123456789',
        base64Id: 'aHR0cHM6Ly9iYXN5eC5vcmcvYWFzLzEyMzQ1Njc4OQ==',
        urlSafeBase64Id: 'aHR0cHM6Ly9iYXN5eC5vcmcvYWFzLzEyMzQ1Njc4OQ',
    },
];

describe("EncodeDecodeUtils.ts; Tests for 'base64Encode()'", () => {
    // Tests for base64Encode()
    testData.forEach(function (testDataset) {
        // Define test data
        const input = testDataset.id;
        const result = testDataset.base64Id;
        const resultUrlSafe = testDataset.urlSafeBase64Id;

        it(`${testDataset.testId}: base64Encode('${input}') === '${resultUrlSafe}'`, () => {
            // Perform the assertion
            expect(base64Encode(input)).toStrictEqual(resultUrlSafe);
        });

        it(`${testDataset.testId}: base64Encode('${input}') === '${result}'`, () => {
            // Perform the assertion
            expect(base64Encode(input, false)).toStrictEqual(result);
        });
    });
});

describe("EncodeDecodeUtils.ts; Tests for 'base64Decode()'", () => {
    // Tests for base64Decode()
    testData.forEach(function (testDataset) {
        // Define test data
        const input = testDataset.base64Id;
        const inputUrlSafe = testDataset.urlSafeBase64Id;
        const result = testDataset.id;

        it(`${testDataset.testId}: base64Decode('${input}') === '${result}'`, () => {
            // Perform the assertion
            expect(base64Decode(input)).toStrictEqual(result);
        });

        it(`${testDataset.testId}: base64Decode('${inputUrlSafe}') === '${result}'`, () => {
            // Perform the assertion
            expect(base64Decode(inputUrlSafe)).toStrictEqual(result);
        });
    });
});
