import { describe, expect, it } from 'vitest';
import { capitalizeFirstLetter, firstLetterToLowerCase, stripLastCharacter } from '@/utils/StringUtils';

describe("StringUtils.ts; Tests for 'capitalizeFirstLetter()'", () => {
    // Define test data for capitalizeFirstLetter()
    const capitalizeFirstLetterTestCombinations = [
        {
            testId: 'e8466399-907d-4002-92ce-a312dfc064e1',
            input: '',
            output: '',
        },
        {
            testId: '3121cd05-2e8d-4e95-95f1-fd0beb1969f0',
            input: 'f',
            output: 'F',
        },
        {
            testId: '55a324f2-e585-4f55-9ee5-456bac3fb066',
            input: 'F',
            output: 'F',
        },
        {
            testId: '11928550-b324-4bf8-9965-7b37d19d8bdf',
            input: 'fooBar',
            output: 'FooBar',
        },
        {
            testId: 'd6bc3a3c-a319-413a-82b1-ed7cc5740dbb',
            input: 'FooBar',
            output: 'FooBar',
        },
    ];

    // Tests for capitalizeFirstLetter()
    capitalizeFirstLetterTestCombinations.forEach(function (capitalizeFirstLetterTestCombination) {
        // Define test data
        const input = capitalizeFirstLetterTestCombination.input;
        const output = capitalizeFirstLetterTestCombination.output;

        it(`${capitalizeFirstLetterTestCombination.testId}: capitalizeFirstLetter('${input}') should be '${output}'`, () => {
            // Perform the assertion
            expect(capitalizeFirstLetter(input)).toBe(output);
        });
    });
});

describe("StringUtils.ts; Tests for 'firstLetterToLowerCase()'", () => {
    // Define test data for firstLetterToLowerCase()
    const firstLetterToLowerCaseTestCombinations = [
        {
            testId: '7ac270fc-cbc6-41f5-88dd-973f9c242362',
            input: '',
            output: '',
        },
        {
            testId: '58b0bf28-a678-4ddd-b0e2-5ac6ee0e6ba5',
            input: 'f',
            output: 'f',
        },
        {
            testId: 'e158067c-78a2-4150-9dcc-53203a580885',
            input: 'F',
            output: 'f',
        },
        {
            testId: '470ae0d5-3a70-4e28-8059-4d0909bc819d',
            input: 'fooBar',
            output: 'fooBar',
        },
        {
            testId: 'd883d9ed-04a4-48a9-9ca8-83c065c5a30f',
            input: 'FooBar',
            output: 'fooBar',
        },
    ];

    // Tests for firstLetterToLowerCase()
    firstLetterToLowerCaseTestCombinations.forEach(function (firstLetterToLowerCaseTestCombination) {
        // Define test data
        const input = firstLetterToLowerCaseTestCombination.input;
        const output = firstLetterToLowerCaseTestCombination.output;

        it(`${firstLetterToLowerCaseTestCombination.testId}: firstLetterToLowerCase('${input}') should be '${output}'`, () => {
            // Perform the assertion
            expect(firstLetterToLowerCase(input)).toBe(output);
        });
    });
});

describe("StringUtils.ts; Tests for 'stripLastCharacter()'", () => {
    // Define test data for stripLastCharacter()
    const stripLastCharacterTestCombinations = [
        {
            testId: 'f51201a3-419a-42f3-8148-daf293680867',
            input: '',
            output: '',
        },
        {
            testId: '9acb235d-8f7e-4483-ac00-1df5b9a194b2',
            input: 'f',
            output: '',
        },
        {
            testId: 'd9df02e0-e0fd-4b8c-a0bc-6737983a4c2a',
            input: 'fo',
            output: 'f',
        },
        {
            testId: 'd639f219-2606-4180-b164-364338b95382',
            input: 'fooBar',
            output: 'fooBa',
        },
    ];

    // Tests for capitalizeFirstLetter()
    stripLastCharacterTestCombinations.forEach(function (stripLastCharacterTestCombination) {
        // Define test data
        const input = stripLastCharacterTestCombination.input;
        const output = stripLastCharacterTestCombination.output;

        it(`${stripLastCharacterTestCombination.testId}: stripLastCharacter('${input}') should be '${output}'`, () => {
            // Perform the assertion
            expect(stripLastCharacter(input)).toBe(output);
        });
    });
});
