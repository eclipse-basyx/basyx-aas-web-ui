import { keyTypes } from '@/utils/KeyTypesUtils';

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
    // find the right endpoint based on the interfaceShortName (has to match endpoint.interface)
    const key = keys.find((key: any) => {
        return key?.type === keyType;
    });

    return key?.value && key.value.trim() !== '' ? key.value.trim() : failResponse;
}
