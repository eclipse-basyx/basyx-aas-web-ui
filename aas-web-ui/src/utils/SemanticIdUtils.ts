// Function to check if the SemanticID of a SubmodelElement matches the given SemanticID
export function checkSemanticId(submodelElement: any, semanticId: string): boolean {
    // console.log('checkSemanticId', 'submodelElement', submodelElement, 'semanticId', semanticId);
    if (semanticId.trim() == '') return false;

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

export function checkSemanticIdEclassIrdi(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;

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

export function checkSemanticIdEclassIrdiUrl(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;

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

export function checkSemanticIdIecCdd(keyValue: string, semanticId: string): boolean {
    if (semanticId.trim() == '') return false;

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

export function checkSemanticIdIri(keyValue: string, semanticId: string): boolean {
    // console.log('checkSemanticIdIri: ', 'keyValue', keyValue, 'semanticId', semanticId);
    if (semanticId.trim() == '') return false;

    if (!semanticId.startsWith('http://') && !semanticId.startsWith('https://')) return false;
    if (!keyValue.startsWith('http://') && !keyValue.startsWith('https://')) return false;

    if (keyValue.endsWith('/')) keyValue = keyValue.substring(0, keyValue.length - 1);
    if (semanticId.endsWith('/')) semanticId = semanticId.substring(0, semanticId.length - 1);

    if (new RegExp(/\/\d{1,}\/\d{1,}$/).test(semanticId)) {
        // IRI with version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9/
        return getEquivalentIriSemanticIds(semanticId).includes(keyValue);
    }

    // IRI without version like https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/
    return (
        getEquivalentIriSemanticIds(keyValue).findIndex((equivalentSemanticId) => {
            return equivalentSemanticId.startsWith(semanticId);
        }, semanticId) != -1
    );
}

export function getEquivalentEclassSemanticIds(semanticId: string): any[] {
    if (
        semanticId.trim() === '' ||
        (!semanticId.startsWith('0173-1#') &&
            !semanticId.startsWith('0173/1///') &&
            !semanticId.startsWith('https://api.eclass-cdp.com/0173-1'))
    )
        return [];

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

    // console.log('getEquivalentEclassSemanticIds', 'semanticId', semanticId, 'semanticIds', semanticIds);
    return semanticIds;
}

export function getEquivalentIriSemanticIds(semanticId: string): any[] {
    if (semanticId.trim() === '' || !(semanticId.startsWith('http://') || semanticId.startsWith('https://'))) return [];

    const semanticIds: any[] = [semanticId];

    // e.g. IRI
    if (semanticId.endsWith('/')) {
        semanticIds.push(semanticId.substring(0, semanticId.length - 1));
    } else {
        semanticIds.push(semanticId + '/');
    }

    // console.log('getEquivalentIriSemanticIds', 'semanticId', semanticId, 'semanticIds', semanticIds);
    return semanticIds;
}
