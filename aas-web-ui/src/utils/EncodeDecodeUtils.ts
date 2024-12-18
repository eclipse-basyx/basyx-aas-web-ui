export function URLEncode(aasId: string) {
    const base64Id = btoa(unescape(encodeURIComponent(aasId)));
    const urlSafeBase64Id = base64Id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '%3D');
    return urlSafeBase64Id;
}
