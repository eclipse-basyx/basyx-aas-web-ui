import mime from 'mime';
import { useRequestHandling } from '@/composables/RequestHandling';
import { UUID } from '@/utils/IDUtils';

// composables
const { getRequest } = useRequestHandling();

export function isFile(file: any): boolean {
    // console.log(
    //     'isFile()',
    //     'file:',
    //     file,
    // );

    if (file && Object.keys(file).length > 0 && file?.modelType && file.modelType.trim() === 'File') return true;
    return false;
}

export function hasValue(file: any): boolean {
    // console.log(
    //     'hasValue()',
    //     'file:',
    //     file,
    // );

    if (isFile(file) && file.value && file?.value.trim() !== '') {
        return true;
    }
    return false;
}

export function valueToDisplay(file: any, defaultValueToDisplay: string = ''): string {
    // console.log(
    //     'valueToDisplay()',
    //     'file:',
    //     file,
    //     'defaultValueToDisplay:',
    //     defaultValueToDisplay,
    // );

    if (isFile(file) && hasValue(file)) {
        return file.value;
    }
    return defaultValueToDisplay;
}

export function valueUrl(file: any): string {
    // console.log(
    //     'valueUrl()',
    //     'file:',
    //     file,
    // );

    if (isFile(file) && hasValue(file)) {
        try {
            new URL(file.value);
            // If no error is thrown, value is a valid URL
            return file.value;
        } catch {
            if (file.path && file.path.trim() !== '') return file.path + '/attachment';
        }
    }
    return '';
}

export function getFilename(file: any): string {
    // console.log('valueUrl()', 'file:', file);

    if (isFile(file) && hasValue(file)) {
        const fileValueUrl = valueUrl(file);

        if (fileValueUrl && fileValueUrl.trim() !== '') {
            const fileValueUrlParts = fileValueUrl.split('/');
            const fileValueUrlLastPart = fileValueUrlParts.pop();

            if (fileValueUrlLastPart && fileValueUrlLastPart.trim() !== '' && fileValueUrlLastPart.includes('.')) {
                // Last element of File valueUrl ends with file extension --> Last element of File valueUrl equals filename incl. file extension
                return fileValueUrlLastPart;
            }
        }

        if (file?.contentType && file.contentType.trim() !== '') {
            // Value of file ends with file extension based on known mime type
            const fileExtension = mime.getExtension(file.contentType);
            if (
                file.value &&
                file.value.trim() !== '' &&
                fileExtension &&
                fileExtension.trim() !== '' &&
                file.value.toLowerCase().endsWith('.' + fileExtension)
            ) {
                const fileValueParts = file.value.split('.');
                const fileValueFilenamePart = fileValueParts[fileValueParts.length - 2]; // Last element is file extension
                const filename = fileValueFilenamePart.split('-').slice(1).join('');

                if (filename.trim() !== '') return filename + '.' + fileExtension;
            }

            // Value of file ends with a general file extension
            if (file.value && new RegExp(/\.\w{2,4}$/).test(file.value)) {
                const fileValueParts = file.value.split('.');
                const fileExtension = fileValueParts[fileValueParts.length - 1];
                const fileValueFilenamePart = fileValueParts[fileValueParts.length - 2];
                const filename = fileValueFilenamePart.split('-').slice(1).join('');

                if (filename.trim() !== '') return filename + '.' + fileExtension;
            }

            // Fallback: idShort as filename
            if (file.idShort && file.idShort.trim() !== '' && fileExtension && fileExtension.trim() !== '') {
                return file.idShort + '.' + fileExtension;
            }
        }
    }
    return '';
}

export function downloadFile(file: any) {
    // console.log(
    //     'downloadFile()',
    //     'file:',
    //     file,
    // );

    if (isFile(file) && hasValue(file) && valueUrl(file)) {
        const path = valueUrl(file);
        const context = 'retrieving Attachment File';
        const disableMessage = false;
        getRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                let filename = getFilename(file);

                // Fallback for filename
                if ((!filename || filename.trim() === '' || filename.startsWith('.')) && response.type) {
                    filename = UUID() + mime.getExtension(response.type);
                }

                const Base64File = URL.createObjectURL(response.data as Blob);
                const link = document.createElement('a');
                link.href = Base64File;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
}
