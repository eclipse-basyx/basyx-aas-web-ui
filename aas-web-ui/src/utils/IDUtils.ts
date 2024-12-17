import md5 from 'md5';
import { v4 as uuidv4 } from 'uuid';

export function UUID(): string {
    return uuidv4();
}

export function generateUUIDFromString(str: any): string {
    // create md5 hash from string
    const hash = md5(str);
    // create UUID from hash
    const guid =
        hash.substring(0, 8) +
        '-' +
        hash.substring(8, 12) +
        '-' +
        hash.substring(12, 16) +
        '-' +
        hash.substring(16, 20) +
        '-' +
        hash.substring(20, 32);
    return guid;
}

// Function to check if the idShort of a SubmodelElement matches the given idShort
export function checkIdShort(
    referable: any,
    idShort: string,
    startsWith: boolean = false,
    strict: boolean = false
): boolean {
    if (idShort.trim() === '') return false;

    if (!referable || !referable.idShort || referable.idShort.length === 0) return false;

    if (startsWith) {
        // For matching e.g. ProductImage{00} with idShort ProductImage
        if (strict) {
            return referable.idShort.startsWith(idShort);
        } else {
            return referable.idShort.toLowerCase().startsWith(idShort.toLowerCase());
        }
    } else {
        if (strict) {
            return referable.idShort === idShort;
        } else {
            return referable.idShort.toLowerCase() === idShort.toLowerCase();
        }
    }
}
