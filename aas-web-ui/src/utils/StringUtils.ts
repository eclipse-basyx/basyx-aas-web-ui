/**
 * Converts the first character of a string to uppercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character capitalized.
 */
export function capitalizeFirstLetter(string: string): string {
    if (!string || string.length === 0) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts the first character of a string to lowercase.
 *
 * @param {string} string - The input string to modify.
 * @returns {string} A new string with the first character lowercased.
 */
export function firstLetterToLowerCase(string: string): string {
    if (!string || string.length === 0) return '';
    return string[0].toLowerCase() + string.slice(1);
}

/**
 * Strips the last character from a given string.
 *
 * This function takes a string as input and returns a new string
 * with the last character removed. If the string is empty has only
 * one character, it returns an empty string.
 *
 * @param {string} string - The input string from which the last character
 *                          will be removed.
 * @returns {string} - The string without the last character, or an empty
 *                     string if the input is empty has only one character.
 */
export function stripLastCharacter(string: string): string {
    if (!string || string.length < 2) return '';
    return string.substring(0, string.length - 1);
}

/**
 * Checks if the provided string is empty or only contains whitespace.
 *
 * @param {string} val - The string to be checked.
 * @returns {boolean} - Returns true if the string is empty or only contains whitespace; otherwise, returns false.
 */
export function isEmptyString(val: string): boolean {
    return !val || val.trim() === '';
}
