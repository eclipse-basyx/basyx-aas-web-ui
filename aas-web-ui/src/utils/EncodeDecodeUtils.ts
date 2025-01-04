//
export function base64Encode(id: string, urlSafe: boolean = true): string {
    // console.log('base64Encode()', 'id', id);

    const encodedUriComponent = encodeURIComponent(id);
    const unescapedEncodedUriComponent = unescape(encodedUriComponent); // reverse the percent-encoded characters back to their original

    const base64Id = btoa(unescapedEncodedUriComponent);

    if (!urlSafe) return base64Id;

    const urlSafeBase64Id = base64Id
        .replace(/\+/g, '-') // Replace + with -
        .replace(/\//g, '_') // Replace / with _
        .replace(/=+$/, ''); // Replace = padding

    return urlSafeBase64Id;
}

export function base64Decode(urlSafeBase64Id: string): string {
    // console.log('base64Decode()', 'urlSafeBase64Id', urlSafeBase64Id);

    let base64Id = urlSafeBase64Id
        .replace(/-/g, '+') // Replace - with +
        .replace(/_/g, '/') // Replace _ with /
        .replace(/%3D/g, '=');

    while (base64Id.length % 4) {
        base64Id += '=';
    }

    const encodedUriComponent = atob(base64Id);
    const escapedEncodedUriComponent = escape(encodedUriComponent);
    const decodedId = decodeURIComponent(escapedEncodedUriComponent);

    return decodedId;
}
