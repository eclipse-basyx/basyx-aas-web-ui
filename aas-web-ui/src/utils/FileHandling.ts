export function mimeToExtension(mimeType: string): string {
    const mimeTypeToExtension: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/ogg': 'ogv',
        'video/quicktime': 'mov',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };

    return mimeTypeToExtension[mimeType] || 'bin'; // Default to 'bin' if MIME type is not found
}

export function checkContentType(contentType: string): string {
    return contentType.split('/')[0];
}

export function convertFileNameToIdentifier(fileName: string): string {
    const id = fileName.split('.').slice(0, -1).join('.');
    return id
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_');
}

export function createThumbnail(blob: Blob, maxDimension: number, callback: (thumbnailUrl: string) => void): void {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxDimension) {
                height *= maxDimension / width;
                width = maxDimension;
            }
        } else {
            if (height > maxDimension) {
                width *= maxDimension / height;
                height = maxDimension;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((thumbnailBlob) => {
                if (thumbnailBlob) {
                    const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
                    callback(thumbnailUrl);
                }
            }, blob.type);
        }
    };
    img.src = URL.createObjectURL(blob);
}
