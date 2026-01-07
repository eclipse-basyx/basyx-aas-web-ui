/**
 * Checks if the given value type represents a numeric type.
 * Supports both standard type names and XML Schema (xs:) prefixed types.
 *
 * @param valueType - The type string to check (e.g., 'integer', 'xs:double', 'string')
 * @returns True if the type is numeric, false otherwise
 *
 * @example
 * isNumber('integer') // true
 * isNumber('xs:double') // true
 * isNumber('string') // false
 */
export function isNumber(valueType: string): boolean {
    if (!valueType) return false;
    // List of all number types
    const numberTypes = [
        'double',
        'float',
        'integer',
        'int',
        'nonNegativeInteger',
        'positiveInteger',
        'unsignedLong',
        'unsignedInt',
        'unsignedShort',
        'unsignedByte',
        'nonPositiveInteger',
        'negativeInteger',
        'long',
        'short',
        'decimal',
        'byte',
    ];
    // strip xs: from the property if it exists
    if (valueType.includes('xs:')) {
        valueType = valueType.replace('xs:', '');
    }
    // check if the property is a number
    if (numberTypes.includes(valueType)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Downloads an object as a formatted JSON file to the user's device.
 * The JSON is formatted with 4-space indentation for readability.
 *
 * @param obj - The object to serialize and download
 * @param fileName - The name for the downloaded file (should include .json extension)
 *
 * @example
 * const data = { name: 'Test', value: 42 };
 * downloadJson(data, 'data.json');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadJson(obj: any, fileName: string): void {
    const jsonStr = JSON.stringify(obj, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Downloads a binary file (Blob) to the user's device.
 *
 * @param filename - The name for the downloaded file
 * @param fileContent - The Blob containing the file data
 *
 * @example
 * const blob = new Blob(['Hello World'], { type: 'text/plain' });
 * downloadFile('hello.txt', blob);
 */
export function downloadFile(filename: string, fileContent: Blob): void {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(fileContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Recursively removes all null values from an object or array.
 * Preserves the structure of nested objects and arrays.
 *
 * @param obj - The object or array to process
 * @returns A new object/array with null values removed
 *
 * @example
 * const input = { a: 1, b: null, c: { d: null, e: 2 } };
 * removeNullValues(input); // { a: 1, c: { e: 2 } }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeNullValues(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(removeNullValues).filter((v) => v !== null);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => [k, removeNullValues(v)])
        );
    } else {
        return obj;
    }
}

/**
 * Creates a debounced version of a function that delays its execution until after
 * the specified wait time has elapsed since the last time it was invoked.
 * Useful for optimizing performance of frequently called functions like search input handlers.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 *
 * @example
 * const search = (query: string) => console.log('Searching:', query);
 * const debouncedSearch = debounce(search, 300);
 * debouncedSearch('test'); // Only executes after 300ms of no further calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
