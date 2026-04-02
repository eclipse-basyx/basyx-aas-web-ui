import { isEmptyString } from '@/utils/StringUtils'

type XsValidationResult = [valid: boolean, errorMessage: string]

function isEmptyValue (value: string): boolean {
  return !value || value.length === 0
}

function invalidValueMessage (valueType: string): string {
  return `Invalid '${valueType}' value!`
}

function validateDecimal (value: string): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(value.trim())) {
    return [false, invalidValueMessage('Decimal')]
  }

  return [true, '']
}

function validateSignedIntegerType (value: string, valueType: 'Integer' | 'Int' | 'Long' | 'Short' | 'Byte'): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  const trimmedValue = value.trim()
  if (!/^[+-]?\d+$/.test(trimmedValue)) {
    return [false, invalidValueMessage(valueType)]
  }

  if (valueType === 'Int') {
    const num = Number(trimmedValue)
    if (num < -2_147_483_648 || num > 2_147_483_647) {
      return [false, `'${valueType}' range: [-2147483648, 2147483647]!`]
    }
  }

  if (valueType === 'Long') {
    const num = BigInt(trimmedValue)
    if (num < -9_223_372_036_854_775_808n || num > 9_223_372_036_854_775_807n) {
      return [
        false,
        `'${valueType}' range: [${(-9_223_372_036_854_775_808n).toString()}, ${9_223_372_036_854_775_807n.toString()}]!`,
      ]
    }
  }

  if (valueType === 'Short') {
    const num = Number(trimmedValue)
    if (num < -32_768 || num > 32_767) {
      return [false, `'${valueType}' range: [-32768, 32767]!`]
    }
  }

  if (valueType === 'Byte') {
    const num = Number(trimmedValue)
    if (num < -128 || num > 127) {
      return [false, `'${valueType}' range: [-128, 127]!`]
    }
  }

  return [true, '']
}

function validateUnsignedIntegerType (
  value: string,
  valueType: 'UnsignedInt' | 'UnsignedLong' | 'UnsignedShort' | 'UnsignedByte',
): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  const trimmedValue = value.trim()
  if (!/^\d+$/.test(trimmedValue)) {
    return [false, invalidValueMessage(valueType)]
  }

  if (valueType === 'UnsignedInt') {
    const num = Number(trimmedValue)
    if (num < 0 || num > 4_294_967_295) {
      return [false, `'${valueType}' range: [0, 4294967295]!`]
    }
  }

  if (valueType === 'UnsignedLong') {
    const num = BigInt(trimmedValue)
    if (num < 0n || num > 18_446_744_073_709_551_615n) {
      return [false, `'${valueType}' range: [0, ${18_446_744_073_709_551_615n.toString()}]!`]
    }
  }

  if (valueType === 'UnsignedShort') {
    const num = Number(trimmedValue)
    if (num < 0 || num > 65_535) {
      return [false, `'${valueType}' range: [0, 65535]!`]
    }
  }

  if (valueType === 'UnsignedByte') {
    const num = Number(trimmedValue)
    if (num < 0 || num > 255) {
      return [false, `'${valueType}' range: [0, 255]!`]
    }
  }

  return [true, '']
}

function validatePatternType (value: string, valueType: string, pattern: RegExp): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  if (!pattern.test(value.trim())) {
    return [false, invalidValueMessage(valueType)]
  }

  return [true, '']
}

function validateDoubleOrFloat (value: string, valueType: 'Double' | 'Float'): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  if (!/^[+-]?((\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?|INF|NaN)$/.test(value.trim())) {
    return [false, invalidValueMessage(valueType)]
  }

  return [true, '']
}

function validateBoolean (value: string): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  if (!/^(true|false|1|0)$/.test(value.trim())) {
    return [false, `Invalid 'Boolean' value! [true, false, 0, 1]`]
  }

  return [true, '']
}

function validateDate (value: string): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  const match = value.trim().match(/^(-?\d{4,})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/)
  if (!match) {
    return [false, `Invalid 'Date' value! [YYYY-MM-DD] optional timezone (Z|[+-]PP:PP)`]
  }

  if (Number(match[2]) < 1 || Number(match[2]) > 12) {
    return [false, `'Date' month range: [1, 12]!`]
  }

  if (Number(match[3]) < 1 || Number(match[3]) > 31) {
    return [false, `'Date' day range: [1, 31]!`]
  }

  let errorMessage = ''
  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !== Number(match[1])) {
    errorMessage = `Date' invalid year ${Number(match[1])}`
  }

  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !== Number(match[2]) - 1) {
    errorMessage = `Date' invalid month ${Number(match[2])}`
  }

  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !== Number(match[3])) {
    errorMessage
      = `Date' day ${Number(match[3])} does not exist in month ${Number(match[2])} of ${Number(match[1])}`
  }

  return [true, errorMessage]
}

function validateTime (value: string): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/)
  if (!match) {
    return [false, `Invalid 'Time' value! [HH:mm:ss]`]
  }

  if (Number(match[1]) < 0 || Number(match[1]) > 23) {
    return [false, `'Time' hour range: [0, 23]!`]
  }

  if (Number(match[2]) < 0 || Number(match[2]) > 59) {
    return [false, `'Time' minutes range: [0, 59]!`]
  }

  if (Number(match[3]) < 0 || Number(match[3]) > 59) {
    return [false, `'Time' second range: [0, 59]!`]
  }

  return [true, '']
}

function validateDateTime (value: string): XsValidationResult {
  if (isEmptyValue(value)) {
    return [true, '']
  }

  const match = value.trim().match(/^(-?\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/)
  if (!match) {
    return [false, invalidValueMessage('DateTime')]
  }

  if (Number(match[2]) < 1 || Number(match[2]) > 12) {
    return [false, `'DateTime' month range: [1, 12]!`]
  }

  if (Number(match[3]) < 1 || Number(match[3]) > 31) {
    return [false, `'DateTime' day range: [1, 31]!`]
  }

  let errorMessage = ''
  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !== Number(match[1])) {
    errorMessage = `DateTime' invalid year ${Number(match[1])}`
  }

  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !== Number(match[2]) - 1) {
    errorMessage = `DateTime' invalid month ${Number(match[2])}`
  }

  if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !== Number(match[3])) {
    errorMessage
      = `DateTime' day ${Number(match[3])} does not exist in month ${Number(match[2])} of ${Number(match[1])}`
  }

  if (Number(match[4]) < 0 || Number(match[4]) > 23) {
    return [false, `'DateTime' hour range: [0, 23]!`]
  }

  if (Number(match[5]) < 0 || Number(match[5]) > 59) {
    return [false, `'DateTime' minutes range: [0, 59]!`]
  }

  if (Number(match[6]) < 0 || Number(match[6]) > 59) {
    return [false, `'DateTime' second range: [0, 59]!`]
  }

  return [true, errorMessage]
}

/**
 * Validates a string value against a specified XML Schema (xs) data type.
 *
 * Supported types include: Decimal, Integer, Int, Long, Short, Byte, UnsignedInt, UnsignedLong,
 * UnsignedShort, UnsignedByte, PositiveInteger, NegativeInteger, NonPositiveInteger, NonNegativeInteger,
 * Double, Float, Boolean, Date, Time, DateTime, and String.
 *
 * For numeric types, the function checks both format and value range.
 * For date/time types, the function checks format and logical validity (e.g., correct day/month).
 * For Boolean, only 'true', 'false', '1', or '0' are accepted.
 * For unsupported or unrecognized types, the function defaults to always valid.
 *
 * @param {string} value - The value to validate.
 * @param {string} valueType - The xs data type to validate against.
 * @returns {[boolean, string]} A tuple where the first element is true if valid, false otherwise,
 * and the second element is an error message if invalid, or an empty string if valid.
 */
export function checkXsDataTypeValue (value: string, valueType: string): [valid: boolean, errorMessage: string] {
  if (isEmptyString(valueType)) {
    return [false, 'Empty xs data value type']
  }

  const validators: Record<string, (input: string) => XsValidationResult> = {
    Decimal: validateDecimal,
    Integer: input => validateSignedIntegerType(input, 'Integer'),
    Int: input => validateSignedIntegerType(input, 'Int'),
    Long: input => validateSignedIntegerType(input, 'Long'),
    Short: input => validateSignedIntegerType(input, 'Short'),
    Byte: input => validateSignedIntegerType(input, 'Byte'),
    UnsignedInt: input => validateUnsignedIntegerType(input, 'UnsignedInt'),
    UnsignedLong: input => validateUnsignedIntegerType(input, 'UnsignedLong'),
    UnsignedShort: input => validateUnsignedIntegerType(input, 'UnsignedShort'),
    UnsignedByte: input => validateUnsignedIntegerType(input, 'UnsignedByte'),
    PositiveInteger: input => validatePatternType(input, 'PositiveInteger', /^\+?[1-9]\d*$/),
    NegativeInteger: input => validatePatternType(input, 'NegativeInteger', /^-[1-9]\d*$/),
    NonPositiveInteger: input => validatePatternType(input, 'NonPositiveInteger', /^(0|-\d+)$/),
    NonNegativeInteger: input => validatePatternType(input, 'NonNegativeInteger', /^\+?(0|[1-9]\d*)$/),
    Double: input => validateDoubleOrFloat(input, 'Double'),
    Float: input => validateDoubleOrFloat(input, 'Float'),
    Boolean: validateBoolean,
    Date: validateDate,
    Time: validateTime,
    DateTime: validateDateTime,
    String: () => [true, ''],
  }

  const validator = validators[valueType]
  if (!validator) {
    return [true, '']
  }

  return validator(value)
}
