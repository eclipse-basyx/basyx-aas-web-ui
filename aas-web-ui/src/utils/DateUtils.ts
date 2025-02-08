import { padTo2Digits } from '@/utils/NumberUtils';

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
