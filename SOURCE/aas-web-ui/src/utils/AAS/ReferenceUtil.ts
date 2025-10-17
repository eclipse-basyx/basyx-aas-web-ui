import { keyTypes } from '@/utils/AAS/KeyTypesUtil';
/**
 * Extracts the ID (Key) from a Reference object based on the given Key Type name.
 *
 * @param {Object} reference - The Reference object containing ID/Key information.
 * @param {string} keyType - The Key Type name.
 * @returns {string} The ID (Key) of the matching Key Type name if found, otherwise an empty string.
 */
export function extractId(reference: any, keyType: string): string {
    const failResponse = '';

    if (!reference.keys || !Array.isArray(reference.keys) || reference.keys.length === 0 || keyType.trim() === '') {
        return '';
    }

    keyType = keyType.trim();

    if (!keyTypes.some((keyTypeOfKeyTypes: any) => keyTypeOfKeyTypes.name === keyType)) {
        return failResponse;
    }

    const keys = reference.keys;
    // find the key based on the key type name
    const key = keys.find((key: any) => {
        return key?.type === keyType;
    });

    return key?.value && key.value.trim() !== '' ? key.value.trim() : failResponse;
}
