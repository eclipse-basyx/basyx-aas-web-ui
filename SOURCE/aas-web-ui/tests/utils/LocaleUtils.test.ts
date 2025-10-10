import { describe, expect, it } from 'vitest';
import { getCountryName, getLanguageName } from '@/utils/LocaleUtils';

describe("LocaleUtils.ts; Tests for 'getCountryName()'", () => {
    // Define test data for getCountryName()
    const getCountryNameTestCombinations = [
        {
            testId: '06d914bc-8fe1-450b-a566-410688a25579',
            input: '',
            output: '',
        },
        {
            testId: 'dde0517e-fa84-4f32-8b96-8df3fe086f9d',
            input: 'de',
            output: 'Germany',
        },
        {
            testId: '120c5f1d-30ba-4c14-b0a4-378a539e9251',
            input: 'De',
            output: 'Germany',
        },
        {
            testId: '562ebfc8-3d74-4439-91ba-9e27886246b4',
            input: 'DE',
            output: 'Germany',
        },
        {
            testId: '8c708cdf-c47b-49c7-ad5c-1a8863772c27',
            input: 'fooBar',
            output: '',
        },
    ];

    // Tests for capitalizeFirstLetter()
    getCountryNameTestCombinations.forEach(function (getCountryNameTestCombination) {
        // Define test data
        const input = getCountryNameTestCombination.input;
        const output = getCountryNameTestCombination.output;

        it(`${getCountryNameTestCombination.testId}: getCountryName('${input}') should be '${output}'`, () => {
            // Perform the assertion
            expect(getCountryName(input)).toBe(output);
        });
    });
});

describe("LocaleUtils.ts; Tests for 'getLanguageName()'", () => {
    // Define test data for firstLetterToLowerCase()
    const getLanguageNameTestCombinations = [
        {
            testId: 'c59f7952-9587-47c9-8d2e-ec1ba43a9d55',
            input: '',
            output: '',
        },
        {
            testId: '1ab567eb-87d4-42a0-9fe7-cf50666da621',
            input: 'de',
            output: 'German',
        },
        {
            testId: 'd87a2d50-bfa9-47bb-8963-a68b58925471',
            input: 'De',
            output: 'German',
        },
        {
            testId: 'f573f921-0e37-43fd-b0f2-36fce9bacbc3',
            input: 'DE',
            output: 'German',
        },
        {
            testId: '0417d0b7-f8be-4370-91b3-c663d53f8a81',
            input: 'fooBar',
            output: '',
        },
    ];

    // Tests for firstLetterToLowerCase()
    getLanguageNameTestCombinations.forEach(function (getLanguageNameTestCombination) {
        // Define test data
        const input = getLanguageNameTestCombination.input;
        const output = getLanguageNameTestCombination.output;

        it(`${getLanguageNameTestCombination.testId}: getLanguageName('${input}') should be '${output}'`, () => {
            // Perform the assertion
            expect(getLanguageName(input)).toBe(output);
        });
    });
});
