/**
 * Checks if the given object contains only string attributes.
 *
 * @param {Object} obj - The object to check.
 * @returns {boolean} - Returns true if all attributes are strings, otherwise false.
 */
export function hasOnlyStringAttributes(obj: any): boolean {
    if (typeof obj !== 'object' || Array.isArray(obj)) return false;

    return Object.values(obj).every((value) => typeof value === 'string');
}
