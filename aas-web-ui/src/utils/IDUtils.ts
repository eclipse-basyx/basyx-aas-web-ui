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
