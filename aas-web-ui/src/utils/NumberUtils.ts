/**
 * Converts a number to a string, padding it with leading zeros if necessary to ensure
 * it is at least two digits long.
 *
 * @param {number} num - The number to pad.
 * @returns {string} The padded string representation of the number.
 *
 * @example
 * console.log(padTo2Digits(5));  // "05"
 * console.log(padTo2Digits(12)); // "12"
 */
export function padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
}
