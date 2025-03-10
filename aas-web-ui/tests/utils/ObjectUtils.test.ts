import { describe, expect, it } from 'vitest';
import { hasOnlyStringAttributes } from '@/utils/ObjectUtils';

describe("ObjectUtils.ts; Tests for 'hasOnlyStringAttributes()'", () => {
    // Define test data for hasOnlyStringAttributes()
    const hasOnlyStringAttributesTestCombinations = [
        {
            testId: '3626726c-28cc-46bf-a383-88d637b39df7',
            input: '',
            output: false,
        },
        {
            testId: 'ed8a90ee-e555-4dd1-94e8-0abc1afc5dc2',
            input: [],
            output: false,
        },
        {
            testId: '4f126067-6b25-4c9d-8c23-7ec763e76d96',
            input: '{}',
            output: false,
        },
        {
            testId: '1dacc264-73b8-449d-921d-31d5398de008',
            input: { test: 'test' },
            output: true,
        },
        {
            testId: '9465f7c2-6b20-44a3-b2df-dacd2a845ebd',
            input: { test1: 'test', test2: [] },
            output: false,
        },
        {
            testId: '83b65763-96a4-4f38-95d0-165cd9b680b3',
            input: { test1: 'test', test2: {} },
            output: false,
        },
    ];

    // Tests for capitalizeFirstLetter()
    hasOnlyStringAttributesTestCombinations.forEach(function (hasOnlyStringAttributesTestCombination) {
        // Define test data
        const input = hasOnlyStringAttributesTestCombination.input;
        const output = hasOnlyStringAttributesTestCombination.output;

        it(`${hasOnlyStringAttributesTestCombination.testId}: hasOnlyStringAttributes('${JSON.stringify(input)}') should be '${output}'`, () => {
            // Perform the assertion
            expect(hasOnlyStringAttributes(input)).toBe(output);
        });
    });
});
