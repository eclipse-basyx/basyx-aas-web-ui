const versionRevisionRegex = /\/(\d{1,})\/(\d{1,})(\/|$)/; // This regex matches the version/revision string of a semanticId ".../version/revision"

/**
 * Checks if the `semanticId` of a SubmodelElement (SME) matches the given `semanticId`.
 * The function verifies that the `semanticId` is non-empty and that the SubmodelElement
 * contains a valid array of semantic ID keys. It also determines the matching strategy
 * based on the prefix of the keys in the SubmodelElement's semantic ID.
 *
 * @param {any} submodelElement - The SubmodelElement object containing semantic ID keys.
 * @param {string} semanticId - The `semanticId` string to compare against the SME's `semanticId`.
 * @returns {boolean} Returns true if a matching `semanticId` is found, false otherwise.
 */
export function checkSemanticId(submodelElement: any, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;
    semanticId = semanticId.trim();

    if (!Array.isArray(submodelElement?.semanticId?.keys) || submodelElement.semanticId.keys.length == 0) return false;

    for (const key of submodelElement.semanticId.keys) {
        // console.log('checkSemanticId: ', 'key of submodelElement', key.value, 'semanticId', semanticId);
        if (key.value.startsWith('0112/')) {
            return checkSemanticIdIecCdd(key.value, semanticId);
        } else if (key.value.startsWith('0173-1#') || key.value.startsWith('0173/1///')) {
            return checkSemanticIdEclassIrdi(key.value, semanticId);
        } else if (key.value.startsWith('https://api.eclass-cdp.com/0173-1')) {
            return checkSemanticIdEclassIrdiUrl(key.value, semanticId);
        } else if (key.value.startsWith('http://') || key.value.startsWith('https://')) {
            return checkSemanticIdIri(key.value, semanticId);
        } else {
            if (key.value === semanticId) return true;
        }
    }

    return false;
}

/**
 * Checks whether a given EClass IRDI semantic ID matches an equivalent key value.
 * The function validates that both `keyValue` and `semanticId` are non-empty. It verifies that the `keyValue`
 * starts with either "0173-1#" or "0173/1///" and compares the two IDs based on specific criteria for
 * versioned and non-versioned IDs.
 *
 * @param {string} keyValue - The key value representing the original EClass IRDI ID to compare against.
 * @param {string} semanticId - The EClass semantic ID to be checked for equivalence.
 * @returns {boolean} Returns true if the `semanticId` matches the `keyValue`, false otherwise.
 */
export function checkSemanticIdEclassIrdi(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;
    semanticId = semanticId.trim();

    if (!keyValue.startsWith('0173-1#') && !keyValue.startsWith('0173/1///')) return false;

    if (keyValue.startsWith('0173-1#')) {
        // Eclass IRDI like 0173-1#01-AHF578#001
        if (new RegExp(/\*\d{2}$/).test(keyValue)) {
            keyValue = keyValue.slice(0, -3);
            semanticId = semanticId.slice(0, -3);
        }
        if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId) || new RegExp(/[#-]{1}\d{3}\*\d{1,}$/).test(semanticId)) {
            return getEquivalentEclassSemanticIds(keyValue).includes(semanticId);
        }

        // Eclass IRDI without version; like 0173-1#01-AHF578
        return (
            getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                return equivalentSemanticId.startsWith(semanticId);
            }, semanticId) != -1
        );
    } else if (keyValue.startsWith('0173/1///')) {
        if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId) || new RegExp(/[#-]{1}\d{3}\*\d{1,}$/).test(semanticId)) {
            // Eclass IRDI with version; like 0173/1///01#AHF578#001
            return getEquivalentEclassSemanticIds(keyValue).includes(semanticId);
        }

        // Eclass IRDI without version; like 0173/1///01#AHF578
        return (
            getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                return equivalentSemanticId.startsWith(semanticId);
            }, semanticId) != -1
        );
    }

    return false;
}

/**
 * Checks whether a given EClass IRDI URL semantic ID matches an equivalent key value.
 * The function validates that both `keyValue` and `semanticId` are non-empty and that the `keyValue`
 * starts with the specified base URL. It then checks if the `semanticId` has a version and
 * compares it accordingly.
 *
 * @param {string} keyValue - The key value representing the original EClass IRDI URL to compare against.
 * @param {string} semanticId - The EClass semantic ID to be checked for equivalence.
 * @returns {boolean} Returns true if the `semanticId` matches the `keyValue`, false otherwise.
 */
export function checkSemanticIdEclassIrdiUrl(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;
    semanticId = semanticId.trim();

    if (!keyValue.startsWith('https://api.eclass-cdp.com/0173-1')) return false;

    // Eclass URL like https://api.eclass-cdp.com/0173-1-01-AHF578-001
    if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId) || new RegExp(/[#-]{1}\d{3}~\d{1,}$/).test(semanticId)) {
        // Eclass URL with version (like https://api.eclass-cdp.com/0173-1-01-AHF578-001)
        return getEquivalentEclassSemanticIds(semanticId).includes(keyValue);
    }

    // Eclass URL without version (like https://api.eclass-cdp.com/0173-1-01-AHF578)
    return (
        getEquivalentEclassSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
            return equivalentSemanticId.startsWith(semanticId);
        }, semanticId) != -1
    );
}

/**
 * Checks whether a given IEC CDD semantic ID matches the equivalent key value.
 * The function validates that both `keyValue` and `semanticId` are non-empty and start with "0112/".
 * It then determines if the two values are equivalent based on specific criteria for versioned and non-versioned IDs.
 *
 * @param {string} keyValue - The key value representing the original IEC CDD semantic ID to compare against.
 * @param {string} semanticId - The IEC CDD semantic ID to be checked for equivalence.
 * @returns {boolean} Returns true if the `semanticId` matches the `keyValue`, false otherwise.
 */
export function checkSemanticIdIecCdd(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;
    semanticId = semanticId.trim();

    if (!semanticId.startsWith('0112/')) return false;
    if (!keyValue.startsWith('0112/')) return false;

    // IEC CDD like 0112/2///61987#ABN590#002
    if (new RegExp(/[#-]{1}\d{3}$/).test(semanticId)) {
        // IEC CDD with version; like 0112/2///61987#ABN590#002
        if (keyValue === semanticId) {
            return true;
        }
    }

    // IEC CDD without version; like 0112/2///61987#ABN590
    return keyValue.startsWith(semanticId);
}

/**
 * Checks whether a given semantic ID matches the equivalent IRI derived from a key value.
 * The function verifies both the validity of the semantic ID and key value, and compares them.
 *
 * It considers:
 * - Validity checks for the `semanticId` and `keyValue` (they must be non-empty and start with http/https).
 * - Normalization of the `keyValue` and `semanticId` by removing any trailing slashes.
 * - Different comparison strategies depending on whether the `semanticId` indicates a versioned or non-versioned IRI.
 *
 * @param {string} keyValue - The key value representing the original IRI to compare against.
 * @param {string} semanticId - The semantic ID IRI to be checked for equivalence.
 * @returns {boolean} Returns true if the `semanticId` matches the equivalent IRI derived from `keyValue`, false otherwise.
 */
export function checkSemanticIdIri(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;
    semanticId = semanticId.trim();

    if (!semanticId.startsWith('http://') && !semanticId.startsWith('https://')) return false;
    if (!keyValue.startsWith('http://') && !keyValue.startsWith('https://')) return false;

    if (keyValue.endsWith('/')) keyValue = keyValue.substring(0, keyValue.length - 1);
    if (semanticId.endsWith('/')) semanticId = semanticId.substring(0, semanticId.length - 1);

    if (new RegExp(/\/\d{1,}\/\d{1,}\/{0,1}$/).test(semanticId) || new RegExp(/\/\d{1,}\/\d{1,}\//).test(semanticId)) {
        // IRI with version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9
        // IRI with version like https://admin-shell.io/zvei/nameplate/1/0/ContactInformations
        return (
            getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
                return equivalentSemanticId.toLowerCase() === semanticId.toLowerCase();
            }, semanticId) != -1
        );
    }

    // IRI without version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/
    return (
        getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
            return equivalentSemanticId.toLowerCase().startsWith(semanticId.toLowerCase());
        }, semanticId) != -1
    );
}

/**
 * Generates an array of equivalent EClass semantic IDs based on the provided `semanticId`.
 * The function checks if the input `semanticId` is valid before generating its equivalents.
 * Valid formats are:
 * - "0173-1#..."
 * - "0173/1///..."
 * - "https://api.eclass-cdp.com/0173-1..."
 *
 * Returns the original `semanticId` and its variations based on specific rules depending on its format:
 * - Converts "0173-1#" to "0173/1///" and an API URL format.
 * - Converts "0173/1///" to "0173-1#" and the corresponding API URL format.
 * - Converts the API URL format back to "0173-1#" and "0173/1///".
 *
 * @param {string} semanticId - The EClass semantic ID to evaluate and convert.
 * @returns {any[]} An array of the original `semanticId` and its equivalent variations,
 *                  or an empty array if the input is invalid.
 */
export function getEquivalentEclassSemanticIds(semanticId: string): any[] {
    if (
        semanticId.trim() === '' ||
        (!semanticId.startsWith('0173-1#') &&
            !semanticId.startsWith('0173/1///') &&
            !semanticId.startsWith('https://api.eclass-cdp.com/0173-1'))
    ) {
        return [];
    }
    semanticId = semanticId.trim();

    const semanticIds: any[] = [semanticId];

    if (semanticId.startsWith('0173-1#')) {
        // e.g. 0173-1#01-AHF578#001
        semanticIds.push(semanticId.replace(/-1#(\d{2})-/, '/1///$1#')); // 0173-1#01-AHF578#001 --> 0173/1///01#AHF578#001
        semanticIds.push('https://api.eclass-cdp.com/' + semanticId.replaceAll('#', '-')); // 0173-1#01-AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
    } else if (semanticId.startsWith('0173/1///')) {
        // e.g. 0173/1///01#AHF578#001
        semanticIds.push(semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1#$1-')); // 0173/1///01#AHF578#001 --> 0173-1#01-AHF578#001
        semanticIds.push(
            'https://api.eclass-cdp.com/' + semanticId.replace(/\/1\/\/\/(\d{2})#/, '-1-$1-').replaceAll('#', '-') // 0173/1///01#AHF578#001 --> https://api.eclass-cdp.com/0173-1-01-AHF578-001
        );
    } else if (semanticId.startsWith('https://api.eclass-cdp.com/0173-1')) {
        // e.g. https://api.eclass-cdp.com/0173-1-01-AHF578-001
        semanticIds.push(
            semanticId
                .replaceAll('https://api.eclass-cdp.com/', '')
                .replace(/-1-(\d{2})-/, '-1#$1-')
                .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173-1#01-AHF578#001
        );
        semanticIds.push(
            semanticId
                .replaceAll('https://api.eclass-cdp.com/', '')
                .replace(/-1-(\d{2})-/, '/1///$1#')
                .replace(/-(\d{3})$/, '#$1') // https://api.eclass-cdp.com/0173-1-01-AHF578-001 --> 0173/1///01#AHF578#001
        );
    }

    return semanticIds;
}

/**
 * Generates an array of equivalent IRI (Internationalized Resource Identifier) semantic IDs
 * based on the given `semanticId`.
 *
 * The function checks if the `semanticId` is a valid IRI (i.e., it starts with "http://" or "https://").
 * It will return an empty array if the `semanticId` is invalid. If the `semanticId` is valid,
 * it will also include variations with a trailing slash or without one in the resultant array.
 *
 * @param {string} semanticId - The semantic ID to evaluate.
 * @returns {any[]} An array containing the original `semanticId` and its equivalent variations,
 *                  or an empty array if the input is invalid.
 */
export function getEquivalentIriSemanticIds(semanticId: string): any[] {
    if (semanticId.trim() === '' || !(semanticId.startsWith('http://') || semanticId.startsWith('https://'))) {
        return [];
    }
    semanticId = semanticId.trim();

    const semanticIds: any[] = [semanticId];

    // e.g. IRI
    if (semanticId.endsWith('/')) {
        semanticIds.push(semanticId.substring(0, semanticId.length - 1));
    } else {
        semanticIds.push(semanticId + '/');
    }

    return semanticIds;
}

/**
 * Retrieves a SubmodelElement (SME) by its `semanticId` from a given Submodel (SM) or SubmodelElement (SME).
 * If the `semanticId` is not found or if the input is invalid, an empty object is returned.
 *
 * The function supports the following types of elements:
 * - **Submodel (SM)**: Searches through `submodelElements`.
 * - **SubmodelElementCollection (SMC)** and **SubmodelElementList (SML)**: Searches through their `value` arrays.
 *
 * @param {string} semanticId - The `semanticId` of the SME to search for.
 * @param {any} submodelElement - The parent SM/SME to search within.
 * @returns {any} The found SME or an empty object if not found or input is invalid.
 */
export function getSubmodelElementBySemanticId(semanticId: string, submodelElement: any): any {
    const failResponse = {} as any;

    if (semanticId.trim() == '') return failResponse;
    semanticId = semanticId.trim();

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') return failResponse;

    switch (submodelElement.modelType) {
        case 'Submodel':
            if (
                submodelElement?.submodelElements &&
                Array.isArray(submodelElement.submodelElements) &&
                submodelElement.submodelElements.length > 0
            ) {
                return submodelElement.submodelElements.find((sme: any) => {
                    return checkSemanticId(sme, semanticId);
                });
            }
            break;
        case 'SubmodelElementCollection':
        case 'SubmodelElementList':
            if (submodelElement?.value && Array.isArray(submodelElement.value) && submodelElement.value.length > 0) {
                return submodelElement.value.find((sme: any) => {
                    return checkSemanticId(sme, semanticId);
                });
            }
            break;
    }

    return failResponse;
}

/**
 * Retrieves an array of SubmodelElements (SMEs) by their `semanticId` from a given Submodel (SM) or SubmodelElement (SME).
 * If the `semanticId` is not found or if the input is invalid, an empty array is returned.
 *
 * The function supports the following types of elements:
 * - **Submodel (SM)**: Filters through `submodelElements`.
 * - **SubmodelElementCollection (SMC)** and **SubmodelElementList (SML)**: Filters through their `value` arrays.
 *
 * @param {string} semanticId - The `semanticId` of the SMEs to search for.
 * @param {any} submodelElement - The parent SM/SME to search within.
 * @returns {any[]} An array of found SMEs matching the `idShort`, or an empty array if not found or input is invalid.
 */
export function getSubmodelElementsBySemanticId(semanticId: string, submodelElement: any): any[] {
    const failResponse = [] as any[];

    if (semanticId.trim() == '') return failResponse;
    semanticId = semanticId.trim();

    if (!submodelElement?.modelType || submodelElement?.modelType.trim() === '') return failResponse;

    switch (submodelElement.modelType) {
        case 'Submodel':
            if (
                submodelElement?.submodelElements &&
                Array.isArray(submodelElement.submodelElements) &&
                submodelElement.submodelElements.length > 0
            ) {
                return submodelElement.submodelElements.filter((sme: any) => {
                    return checkSemanticId(sme, semanticId);
                });
            }
            break;
        case 'SubmodelElementCollection':
        case 'SubmodelElementList':
            if (submodelElement?.value && Array.isArray(submodelElement.value) && submodelElement.value.length > 0) {
                return submodelElement.value.filter((sme: any) => {
                    return checkSemanticId(sme, semanticId);
                });
            }
            break;
    }

    return failResponse;
}

export function extractVersionRevision(semanticId: string): { version: string; revision: string } {
    const failResponse = { version: '', revision: '' };

    if (semanticId.trim() == '') return failResponse;
    semanticId = semanticId.trim();

    const match = semanticId.match(versionRevisionRegex);

    if (match) {
        const response = {
            version: match && match[1] ? match[1] : '',
            revision: match && match[2] ? match[2] : '',
        };

        return response;
    }

    return failResponse;
}

/**
 * Retrieves the value of the first key in the `semanticId` of a given element.
 *
 * @param {Record<string, unknown>} element - The element containing the `semanticId`.
 * @returns {string | undefined} The value of the first key in the `semanticId`, or `undefined` if not found.
 */
export function getSemanticIdValue(element: Record<string, unknown>): string | undefined {
    return (element.semanticId as unknown as { keys: Array<{ value: string }> })?.keys?.[0]?.value;
}
