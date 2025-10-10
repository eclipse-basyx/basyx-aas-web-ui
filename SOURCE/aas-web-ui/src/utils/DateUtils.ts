import { padTo2Digits } from '@/utils/NumberUtils';

/**
 * RegExp to test date string
 *  YYYYMMDD
 *  YYYY-MMDD
 *  YYYYMM-DD
 *  YYYY-MM-DD
 * @type {RegExp}
 */
export const dateRegex = /^(\d{4})-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])$/;

/**
 * RegExp to test date time string
 * @type {RegExp}
 */
export const dateTimeRegex =
    /^((\d{4})-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01]))T(([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?)(Z|(\+|-)((0\d|1[0-3]):[0-5]\d))?$/;

/**
 * Converts a JavaScript Date object into a formatted string.
 * The format of the returned string is "yyyy-MM-dd HH:mm:ss".
 *
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string.
 *
 * @example
 * const date = new Date('2023-10-05T15:30:00Z');
 * console.log(formatDate(date)); // "2023-10-05 15:30:00"
 */
export function formatDate(date: Date): string {
    return (
        [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join('-') +
        ' ' +
        [padTo2Digits(date.getHours()), padTo2Digits(date.getMinutes()), padTo2Digits(date.getSeconds())].join(':')
    );
}

/**
 * Generates the current date and time in ISO 8601 format (UTC).
 * The format of the returned string is "YYYY-MM-DDTHH:mm:ssZ".
 *
 * @returns {string} The current date and time in ISO 8601 format (UTC).
 *
 * @example
 * const isoDateTime = getISO8601UTCDateTime();
 * console.log(isoDateTime); // Example output: "2025-02-07T12:34:56Z"
 */
export function getISO8601UTCDateTime(): string {
    const date = new Date();

    // Get UTC components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    // Format as YYYY-MM-DD HH:mm:ss
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

/**
 * Creates a string representation of the current date and time in XSD format.
 * The format is 'yyyy-mm-ddThh:mm:ss.sss±hh:mm', where the time includes
 * milliseconds and the timezone offset is expressed in hours and minutes.
 *
 * @returns {string} - A string representing the current date and time in XSD format,
 *                     including a pseudo microseconds and timezone offset.
 *
 * @example
 * const xsdDateString = createXSDDateString();
 * console.log(xsdDateString); // Outputs: '2023-10-04T15:30:45.000+01:00'
 */
export function createXSDDateString(): string {
    const date = new Date();
    // Generate the date and time part in the format 'yyyy-mm-ddThh:mm:ss.sss'
    let dateTime = date.toISOString();

    // Get the timezone offset in minutes and convert it to the format '+hh:mm'
    let timezoneOffset = -date.getTimezoneOffset();
    const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
    timezoneOffset = Math.abs(timezoneOffset);
    const timezoneHours = String(Math.floor(timezoneOffset / 60)).padStart(2, '0');
    const timezoneMinutes = String(timezoneOffset % 60).padStart(2, '0');
    const timezone = timezoneSign + timezoneHours + ':' + timezoneMinutes;

    // Add pseudo microseconds and replace the timezone part
    const pseudoMicroseconds = '000';

    dateTime = dateTime.replace('Z', pseudoMicroseconds + timezone);

    return dateTime;
}

/**
 * Retrieves the time in HH:mm:ss format from the provided Date object.
 *
 * @param {Date} date - The Date object from which to extract the time.
 * @returns {string} - A string representing the time in the format HH:mm:ss,
 *                     or an empty string if the time could not be determined.
 *
 * @example
 * const date = new Date('2023-10-04T15:30:45');
 * const time = getTimeFromDate(date);
 * console.log(time); // Outputs: "15:30:45"
 */
export function getTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // check if any of the values is NaN
    if (isNaN(Number(hours)) || isNaN(Number(minutes)) || isNaN(Number(seconds)) || !hours || !minutes || !seconds)
        return '';

    return hours + ':' + minutes + ':' + seconds;
}
