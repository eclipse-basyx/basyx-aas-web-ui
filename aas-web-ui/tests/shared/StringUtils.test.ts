import { describe, expect, it } from 'vitest'
import { capitalizeFirstLetter, firstLetterToLowerCase, hasContent, safeSegment, stripLastCharacter, trimString } from '../../shared/utils/StringUtils'

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
      input: ' '.repeat(3),
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

describe('StringUtils.ts; Tests for \'hasContent()\'', () => {
  describe('hasContent', () => {
    it('should return true for valid non-empty strings', () => {
      expect(hasContent('hello')).toBe(true)
      expect(hasContent('a')).toBe(true)
      expect(hasContent('  word  ')).toBe(true)
    })

    it('should return false for empty or whitespace-only strings', () => {
      expect(hasContent('')).toBe(false)
      expect(hasContent(' ')).toBe(false)
      expect(hasContent('   \n\t   ')).toBe(false)
    })

    it('should return false for null and undefined', () => {
      expect(hasContent(null)).toBe(false)
      expect(hasContent(undefined)).toBe(false)
    })

    it('should act as a type guard', () => {
      const value: string | null | undefined = 'valid string'
      if (hasContent(value)) {
        // This test checks runtime logic, but helps guarantee typescript expectations
        expect(value.toUpperCase()).toBe('VALID STRING')
      }
    })
  })
})

describe('StringUtils.ts; Tests for \'trimString()\'', () => {
  // Define test data for trimString()
  const trimStringTestCombinations: { testId: string, input: unknown, output: string }[] = [
    {
      testId: '54991c68-ee12-498a-95bd-71c99a1b38bc',
      input: '  hello  ',
      output: 'hello',
    },
    {
      testId: '519b438a-6188-42c2-a0be-95db21fba544',
      input: 'hello',
      output: 'hello',
    },
    {
      testId: '4d826174-e33d-4c33-83b2-967965d3b310',
      input: '',
      output: '',
    },
    {
      testId: '1ef8da74-0026-4387-b554-b7c345a436cd',
      input: ' '.repeat(3),
      output: '',
    },
    {
      testId: 'd8b53335-04df-4900-9324-150a04dd6cb1',
      input: null,
      output: '',
    },
    {
      testId: 'a0d8445c-b5d2-4cc0-975a-d7d2c428ca83',
      input: undefined,
      output: '',
    },
    {
      testId: 'af7ef77f-de87-4251-b456-c9264bc6ce1e',
      input: 123,
      output: '',
    },
    {
      testId: '2bb7b3eb-5b13-4720-8d22-13c74447fcf6',
      input: { toString: () => 'obj' },
      output: '',
    },
  ]

  // Tests for trimString()
  for (const trimStringTestCombination of trimStringTestCombinations) {
    // Define test data
    const input = trimStringTestCombination.input
    const output = trimStringTestCombination.output

    it(`${trimStringTestCombination.testId}: trimString(${JSON.stringify(input)}) should be '${output}'`, () => {
      // Perform the assertion
      expect(trimString(input)).toBe(output)
    })
  }
})
