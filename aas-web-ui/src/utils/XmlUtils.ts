import { isEmptyString } from '@/utils/StringUtils';

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
export function checkXsDataTypeValue(value: string, valueType: string): [valid: boolean, errorMessage: string] {
    if (isEmptyString(valueType)) return [false, 'Empty xs data value type'];

    let regex = null;
    let match = null;

    let errorMessage = '';

    switch (valueType) {
        case 'Decimal':
            if (!value || value.length === 0) return [true, ''];

            if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            break;

        case 'Integer':
        case 'Int':
        case 'Long':
        case 'Short':
        case 'Byte':
            if (!value || value.length === 0) return [true, ''];

            if (!/^[+-]?\d+$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            if (valueType === 'Int') {
                const num = Number(value.trim());
                if (num < -2147483648 || num > 2147483647) {
                    errorMessage = "'" + valueType + "' range: [-2147483648, 2147483647]!";
                    return [false, errorMessage];
                }
            }

            if (valueType === 'Long') {
                const num = BigInt(value.trim());
                if (num < -9223372036854775808n || num > 9223372036854775807n) {
                    errorMessage =
                        "'" +
                        valueType +
                        "' range: [" +
                        (-9223372036854775808n).toString() +
                        ', ' +
                        9223372036854775807n.toString() +
                        ']!';
                    return [false, errorMessage];
                }
            }

            if (valueType === 'Short') {
                const num = Number(value.trim());
                if (num < -32768 || num > 32767) {
                    errorMessage = "'" + valueType + "' range: [-32768, 32767]!";
                    return [false, errorMessage];
                }
            }

            if (valueType === 'Byte') {
                const num = Number(value.trim());
                if (num < -128 || num > 127) {
                    errorMessage = "'" + valueType + "' range: [-128, 127]!";
                    return [false, errorMessage];
                }
            }

            break;

        case 'UnsignedInt':
        case 'UnsignedLong':
        case 'UnsignedShort':
        case 'UnsignedByte':
            if (!value || value.length === 0) return [true, ''];

            if (!/^\d+$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            if (valueType === 'UnsignedInt') {
                const num = Number(value.trim());
                if (num < 0 || num > 4294967295) {
                    errorMessage = "'" + valueType + "' range: [0, 4294967295]!";
                    return [false, errorMessage];
                }
            }

            if (valueType === 'UnsignedLong') {
                const num = BigInt(value.trim());
                if (num < 0n || num > 18446744073709551615n) {
                    errorMessage = "'" + valueType + "' range: [0, " + 18446744073709551615n.toString() + ']!';
                    return [false, errorMessage];
                }
            }

            if (valueType === 'UnsignedShort') {
                const num = Number(value.trim());
                if (num < 0 || num > 65535) {
                    errorMessage = "'" + valueType + "' range: [0, 65535]!";
                    return [false, errorMessage];
                }
            }

            if (valueType === 'UnsignedByte') {
                const num = Number(value.trim());
                if (num < 0 || num > 255) {
                    errorMessage = "'" + valueType + "' range: [0, 255]!";
                    return [false, errorMessage];
                }
            }

            break;

        case 'PositiveInteger':
            if (!value || value.length === 0) return [true, ''];

            if (!/^\+?[1-9]\d*$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }
            break;

        case 'NegativeInteger':
            if (!value || value.length === 0) return [true, ''];

            if (!/^-[1-9]\d*$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            break;

        case 'NonPositiveInteger':
            if (!value || value.length === 0) return [true, ''];

            if (!/^(0|-\d+)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }
            break;

        case 'NonNegativeInteger':
            if (!value || value.length === 0) return [true, ''];

            if (!/^\+?(0|[1-9]\d*)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            break;

        case 'Double':
            if (!value || value.length === 0) return [true, ''];

            if (!/^[+-]?((\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?|INF|NaN)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            break;

        case 'Float':
            if (!value || value.length === 0) return [true, ''];

            if (!/^[+-]?((\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?|INF|NaN)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            break;

        case 'Boolean':
            if (!value || value.length === 0) return [true, ''];

            if (!/^(true|false|1|0)$/.test(value.trim())) {
                errorMessage = "Invalid '" + valueType + "' value! [true, false, 0, 1]";
                return [false, errorMessage];
            }

            break;

        case 'Date':
            if (!value || value.length === 0) return [true, ''];

            regex = /^(-?\d{4,})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/;
            match = value.trim().match(regex);
            if (!match) {
                errorMessage = "Invalid '" + valueType + "' value! [YYYY-MM-DD] optional timezone (Z|[+-]PP:PP)";
                return [false, errorMessage];
            }

            if (Number(match[2]) < 1 || Number(match[2]) > 12) {
                errorMessage = "'" + valueType + "' month range: [1, 12]!";
                return [false, errorMessage];
            }

            if (Number(match[3]) < 1 || Number(match[3]) > 31) {
                errorMessage = "'" + valueType + "' day range: [1, 31]!";
                return [false, errorMessage];
            }

            if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !== Number(match[1])) {
                errorMessage = valueType + "' invalid year " + Number(match[1]);
            }

            if (
                new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !==
                Number(match[2]) - 1
            ) {
                errorMessage = valueType + "' invalid month " + Number(match[2]);
            }

            if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !== Number(match[3])) {
                errorMessage =
                    valueType +
                    "' day " +
                    Number(match[3]) +
                    ' does not exist in month ' +
                    Number(match[2]) +
                    ' of ' +
                    Number(match[1]);
            }

            break;

        case 'Time':
            if (!value || value.length === 0) return [true, ''];

            regex = /^(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
            match = value.trim().match(regex);

            if (!match) {
                errorMessage = "Invalid '" + valueType + "' value! [HH:mm:ss]";
                return [false, errorMessage];
            }

            if (Number(match[1]) < 0 || Number(match[1]) > 23) {
                errorMessage = "'" + valueType + "' hour range: [0, 23]!";
                return [false, errorMessage];
            }

            if (Number(match[2]) < 0 || Number(match[2]) > 59) {
                errorMessage = "'" + valueType + "' minutes range: [0, 59]!";
                return [false, errorMessage];
            }

            if (Number(match[3]) < 0 || Number(match[3]) > 59) {
                errorMessage = "'" + valueType + "' second range: [0, 59]!";
                return [false, errorMessage];
            }

            break;

        case 'DateTime':
            if (!value || value.length === 0) return [true, ''];

            regex = /^(-?\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
            match = value.trim().match(regex);

            if (!match) {
                errorMessage = "Invalid '" + valueType + "' value!";
                return [false, errorMessage];
            }

            if (Number(match[2]) < 1 || Number(match[2]) > 12) {
                errorMessage = "'" + valueType + "' month range: [1, 12]!";
                return [false, errorMessage];
            }

            if (Number(match[3]) < 1 || Number(match[3]) > 31) {
                errorMessage = "'" + valueType + "' day range: [1, 31]!";
                return [false, errorMessage];
            }

            if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !== Number(match[1])) {
                errorMessage = valueType + "' invalid year " + Number(match[1]);
            }

            if (
                new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !==
                Number(match[2]) - 1
            ) {
                errorMessage = valueType + "' invalid month " + Number(match[2]);
            }

            if (new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !== Number(match[3])) {
                errorMessage =
                    valueType +
                    "' day " +
                    Number(match[3]) +
                    ' does not exist in month ' +
                    Number(match[2]) +
                    ' of ' +
                    Number(match[1]);
            }

            if (Number(match[4]) < 0 || Number(match[4]) > 23) {
                errorMessage = "'" + valueType + "' hour range: [0, 23]!";
                return [false, errorMessage];
            }

            if (Number(match[5]) < 0 || Number(match[5]) > 59) {
                errorMessage = "'" + valueType + "' minutes range: [0, 59]!";
                return [false, errorMessage];
            }

            if (Number(match[6]) < 0 || Number(match[6]) > 59) {
                errorMessage = "'" + valueType + "' second range: [0, 59]!";
                return [false, errorMessage];
            }

            //TODO Check property value input regarding timezone of DateTime

            break;

        // TODO: Check property value input regarding AnyUri
        // case 'AnyUri':
        // TODO: Check property value input regarding Base64Binary
        // case 'Base64Binary':
        // TODO: Check property value input regarding Duration
        // case 'Duration':
        // TODO: Check property value input regarding GDay
        // case 'GDay':
        // TODO: Check property value input regarding GMonth
        // case 'GMonth':
        // TODO: Check property value input regarding GMonthDay
        // case 'GMonthDay':
        // TODO: Check property value input regarding GYear
        // case 'GYear':
        // TODO: Check property value input regarding GYearMonth
        // case 'GYearMonth':
        // TODO: Check property value input regarding HexBinary
        // case 'HexBinary':

        case 'String':
        default:
            break;
    }

    return [true, errorMessage];
}
