import md5 from 'md5';
import { v4 as uuidv4 } from 'uuid';
import { useEnvStore } from '@/store/EnvironmentStore';

// Stores
const envStore = useEnvStore();

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

/**
 * Generates an Internationalized Resource Identifier (IRI) based on the given type.
 * This function constructs an IRI using a prefix which defaults to 'https://example.com/'.
 * If the provided `type` is not 'Asset', 'AssetAdministrationShell' or 'Submodel', it defaults to an empty string.
 * The generated IRI includes the given type and a custom ID.
 *
 * @param {string} type - The type to be included in the generated IRI.
 * @returns {string} - The generated IRI as a string. If the type is invalid, it uses an empty string for the type.
 *
 * @example
 * // Generates an IRI with type 'AssetAdministrationShell'
 * const iri = generateIri('AssetAdministrationShell');
 * console.log(iri); // Output: 'https://example.com/ids/aas/{customId}'
 *
 * @example
 * // Generates an IRI with an empty type since 'InvalidType' is not allowed
 * const iri = generateIri('InvalidType');
 * console.log(iri); // Output: 'https://example.com/ids/{customId}'
 */
export function generateIri(type: string): string {
    const defaultIdPrefix = 'https://example.com/';

    // Check type
    if (!type || !['Asset', 'AssetAdministrationShell', 'Submodel'].includes(type)) type = '';

    let idPrefix = envStore.getEditorIdPrefix || defaultIdPrefix;

    if (!idPrefix.endsWith('/')) idPrefix += '/';

    type = type.replace('AssetAdministrationShell', 'AAS').replace('Submodel', 'SM').toLocaleLowerCase();
    if (type.trim() !== '' && !type.endsWith('/')) type += '/';

    return `${idPrefix}ids/${type.trim() !== '' ? type : ''}${generateCustomId()}`;
}

/**
 * Generates a custom ID consisting of four segments, each being a random number between 1000 and 9999,
 * joined by underscores.
 *
 * The return value matches the regular expression: /^((1000|[1-9][0-9]{3})_){3}(1000|[1-9][0-9]{3})$/
 *
 * @returns {string} A custom ID in the format of "xxxx_xxxx_xxxx_xxxx" where each "xxxx" is a random number
 * between 1000 and 9999 (regex: ).
 */
export function generateCustomId(): string {
    // Random number between 1000 and 9999
    const segment = (): string => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    return `${segment()}_${segment()}_${segment()}_${segment()}`;
}

export const customIdRegex = /^((1000|[1-9][0-9]{3})_){3}(1000|[1-9][0-9]{3})$/;
