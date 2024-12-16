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
