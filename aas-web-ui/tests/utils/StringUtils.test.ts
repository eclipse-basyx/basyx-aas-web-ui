import { describe, expect, it } from 'vitest'
import { capitalizeFirstLetter, firstLetterToLowerCase, safeSegment, stripLastCharacter } from '@/utils/StringUtils'

describe('StringUtils.ts; Tests for \'capitalizeFirstLetter()\'', () => {
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
  ]

  // Tests for capitalizeFirstLetter()
  for (const capitalizeFirstLetterTestCombination of capitalizeFirstLetterTestCombinations) {
    // Define test data
    const input = capitalizeFirstLetterTestCombination.input
    const output = capitalizeFirstLetterTestCombination.output

    it(`${capitalizeFirstLetterTestCombination.testId}: capitalizeFirstLetter('${input}') should be '${output}'`, () => {
      // Perform the assertion
      expect(capitalizeFirstLetter(input)).toBe(output)
    })
  }
})

describe('StringUtils.ts; Tests for \'firstLetterToLowerCase()\'', () => {
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
  ]

  // Tests for firstLetterToLowerCase()
  for (const firstLetterToLowerCaseTestCombination of firstLetterToLowerCaseTestCombinations) {
    // Define test data
    const input = firstLetterToLowerCaseTestCombination.input
    const output = firstLetterToLowerCaseTestCombination.output

    it(`${firstLetterToLowerCaseTestCombination.testId}: firstLetterToLowerCase('${input}') should be '${output}'`, () => {
      // Perform the assertion
      expect(firstLetterToLowerCase(input)).toBe(output)
    })
  }
})

describe('StringUtils.ts; Tests for \'stripLastCharacter()\'', () => {
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
  ]

  // Tests for capitalizeFirstLetter()
  for (const stripLastCharacterTestCombination of stripLastCharacterTestCombinations) {
    // Define test data
    const input = stripLastCharacterTestCombination.input
    const output = stripLastCharacterTestCombination.output

    it(`${stripLastCharacterTestCombination.testId}: stripLastCharacter('${input}') should be '${output}'`, () => {
      // Perform the assertion
      expect(stripLastCharacter(input)).toBe(output)
    })
  }
})

describe('StringUtils.ts; Tests for \'safeSegment()\'', () => {
  const safeSegmentTestCombinations = [
    {
      testId: '6d3661d9-37ea-4f56-a480-2ea74dc2f120',
      input: 'Markings[0].MarkingFile',
      fallback: 'fallback',
      output: 'Markings-0-.MarkingFile',
    },
    {
      testId: 'f58cc267-4e6e-495c-bf49-2c0d5e59041a',
      input: '  a///b  ',
      fallback: 'fallback',
      output: 'a-b',
    },
    {
      testId: '01b5ed09-3ba3-4cb3-adf4-7f322f91fca2',
      input: '   ',
      fallback: 'fallback',
      output: 'fallback',
    },
    {
      testId: 'b2d1fa9d-6cc8-4f1e-9823-9ec8ec4aa770',
      input: '.',
      fallback: 'fallback',
      output: 'fallback',
    },
    {
      testId: '3bbcbfef-78e9-4d11-b721-c90911bb3a4d',
      input: '..',
      fallback: 'fallback',
      output: 'fallback',
    },
    {
      testId: '445fb8a0-b5f2-4329-908d-e5d8d521d9b0',
      input: '.Markings[0].MarkingFile.png.',
      fallback: 'fallback',
      output: 'Markings-0-.MarkingFile.png',
    },
    {
      testId: '09a80f9c-622f-4526-8c03-c84f5f4e46c9',
      input: 'COM1.txt',
      fallback: 'fallback',
      output: 'fallback',
    },
  ]

  for (const safeSegmentTestCombination of safeSegmentTestCombinations) {
    const input = safeSegmentTestCombination.input
    const fallback = safeSegmentTestCombination.fallback
    const output = safeSegmentTestCombination.output

    it(`${safeSegmentTestCombination.testId}: safeSegment('${input}', '${fallback}') should be '${output}'`, () => {
      expect(safeSegment(input, fallback)).toBe(output)
    })
  }
})
