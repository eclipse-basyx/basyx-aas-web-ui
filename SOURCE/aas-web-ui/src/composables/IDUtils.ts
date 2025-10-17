import md5 from 'md5';
import { v4 as uuidv4 } from 'uuid';
import { useEnvStore } from '@/store/EnvironmentStore';

export function useIDUtils() {
    // Stores
    const envStore = useEnvStore();

    const uuidV4Regex = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/;
    /**
     * Generates an UUID v4.
     *
     * The return value matches the regular expression: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/
     *
     * @returns {string} An UUID v4.
     */
    function generateUUID(): string {
        return uuidv4();
    }

    /**
     * Generates UUID v4 based to a specified string.
     *
     * The return value matches the regular expression: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/
     *
     * @returns {string} An UUID v4.
     */
    function generateUUIDFromString(str: any): string {
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
     * @returns {string} The generated IRI as a string. If the type is invalid, it uses an empty string for the type.
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
    function generateIri(type: string): string {
        const defaultIdPrefix = 'https://example.com/';

        // Check type
        if (!type || !['Asset', 'AssetAdministrationShell', 'Submodel'].includes(type)) type = '';

        // Fix type
        type = type.trim();
        type = type.replace('AssetAdministrationShell', 'AAS').replace('Submodel', 'SM').toLocaleLowerCase();
        if (type !== '' && !type.endsWith('/')) type = type + '/';

        const idPrefixFromStore = envStore.getEditorIdPrefix.trim();

        // URL Regex
        const expression =
            /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        const regex = new RegExp(expression);

        // Check idPrefix
        let idPrefix = idPrefixFromStore !== '' && idPrefixFromStore.match(regex) ? idPrefixFromStore : defaultIdPrefix;

        // Fix idPrefix
        idPrefix = idPrefix.trim();
        if (idPrefix !== '' && !idPrefix.endsWith('/')) idPrefix = idPrefix + '/';

        return `${idPrefix}ids/${type.trim() !== '' ? type : ''}${generateCustomId()}`;
    }

    const customIdRegex = /^((1000|[1-9][0-9]{3})_){3}(1000|[1-9][0-9]{3})$/;
    /**
     * Generates a custom ID consisting of four segments, each being a random number between 1000 and 9999,
     * joined by underscores.
     *
     * The return value matches the regular expression: /^((1000|[1-9][0-9]{3})_){3}(1000|[1-9][0-9]{3})$/
     *
     * @returns {string} A custom ID in the format of "xxxx_xxxx_xxxx_xxxx" where each "xxxx" is a random number
     * between 1000 and 9999.
     */
    function generateCustomId(): string {
        // Random number between 1000 and 9999
        const segment = (): string => {
            return Math.floor(1000 + Math.random() * 9000).toString();
        };

        return `${segment()}_${segment()}_${segment()}_${segment()}`;
    }

    return { uuidV4Regex, generateUUID, generateUUIDFromString, generateIri, customIdRegex, generateCustomId };
}
