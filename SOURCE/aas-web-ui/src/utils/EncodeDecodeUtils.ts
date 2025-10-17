/**
 * Compare Base64UrlEncoder.java from basyx-java-server-sdk
 * https://github.com/eclipse-basyx/basyx-java-server-sdk/blob/main/basyx.common/basyx.http/src/main/java/org/eclipse/digitaltwin/basyx/http/Base64UrlEncoder.java
 */

/**
 * Encodes a given string in Base64 format. Optionally makes it URL safe.
 *
 * @param {string} string - The string to encode.
 * @param {boolean} [urlSafe=true] - Whether the encoded string should be URL safe. Defaults to `true`.
 * @returns {string} The Base64 encoded string. If `urlSafe` is true, the encoded string will be modified to be URL safe.
 */
export function base64Encode(string: string, urlSafe: boolean = true): string {
    const failResponse = '';

    string = string.trim();

    if (string === '') return failResponse;

    const encodedUriComponent = encodeURIComponent(string);
    const unescapedEncodedUriComponent = unescape(encodedUriComponent); // reverse the percent-encoded characters back to their original

    try {
        const base64String = btoa(unescapedEncodedUriComponent);

        if (!urlSafe) return base64String;

        const urlSafeBase64String = base64String
            .replace(/\+/g, '-') // Replace + with -
            .replace(/\//g, '_') // Replace / with _
            .replace(/=+$/, ''); // Replace = padding

        return urlSafeBase64String;
    } catch {
        return failResponse;
    }
}

/**
 * Decodes a given URL safe Base64 encoded string.
 *
 * @param {string} urlSafeBase64String - The URL safe Base64 encoded string to decode.
 * @returns {string} The decoded string.
 */
export function base64Decode(urlSafeBase64String: string): string {
    const failResponse = '';

    urlSafeBase64String = urlSafeBase64String.trim();

    if (urlSafeBase64String === '') return failResponse;

    let base64String = urlSafeBase64String
        .replace(/-/g, '+') // Replace - with +
        .replace(/_/g, '/') // Replace _ with /
        .replace(/%3D/g, '=');

    // Some will cut the padding...
    const incompleteFourChars = base64String.length % 4;
    if (incompleteFourChars > 0) base64String += '=='.substring(0, 4 - incompleteFourChars);

    try {
        const encodedUriComponent = atob(base64String);
        const escapedEncodedUriComponent = escape(encodedUriComponent);
        const decodedString = decodeURIComponent(escapedEncodedUriComponent);

        return decodedString;
    } catch {
        return failResponse;
    }
}
