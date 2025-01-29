import mime from 'mime';
import { useIDUtils } from '@/composables/IDUtils';
import { useRequestHandling } from '@/composables/RequestHandling';

// Composables
const { getRequest } = useRequestHandling();
const { generateUUID } = useIDUtils();

/**
 * Checks if the given file object is a valid File model with respect to AAS metamodel specs.
 *
 * @param {any} file - The object to check.
 * @returns {boolean} True if the object is a File model, otherwise false.
 */
export function isFile(file: any): boolean {
    if (
        file &&
        typeof file === 'object' &&
        Object.keys(file).length > 0 &&
        file?.modelType &&
        typeof file.modelType === 'string' &&
        file.modelType.trim() === 'File'
    ) {
        return true;
    }
    return false;
}

/**
 * Checks whether the given file object has a non-empty value.
 *
 * @param {any} file - The file object to check.
 * @returns {boolean} True if the file has a non-empty value, otherwise false.
 */
export function hasValue(file: any): boolean {
    if (isFile(file) && file?.value && file.value.trim() !== '') {
        return true;
    }
    return false;
}

/**
 * Retrieves the display value of a file if it exists, otherwise returns a default value.
 *
 * @param {any} file - The file object to check.
 * @param {string} [defaultValueToDisplay=''] - The default value to return if the file is invalid or has no value.
 * @returns {string} The display value of the file or the default value.
 */
export function valueToDisplay(file: any, defaultValueToDisplay: string = ''): string {
    if (isFile(file) && hasValue(file)) {
        return file.value;
    }
    return defaultValueToDisplay;
}

/**
 * Retrieves the URL value of a file if it exists, otherwise returns a default value.
 *
 * @param {any} file - The file object to check.
 * @param {string} [defaultValueToDisplay=''] - The default value to return if the file is invalid or has no value.
 * @returns {string} The URL value of the file or the default value.
 */
export function valueUrl(file: any): string {
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

/**
 * Retrieves the filename of a file if it exists, otherwise returns a default value.
 *
 * @param {any} file - The file object to check.
 * @returns {string} The filename of the file or an empty string if filename determination is not possible.
 */
export function getFilename(file: any): string {
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

/**
 * Downloads file if it exists.
 *
 * @param {any} file - The file object to check.
 */
export function downloadFile(file: any) {
    if (isFile(file) && hasValue(file) && valueUrl(file)) {
        const path = valueUrl(file);
        const context = 'retrieving Attachment File';
        const disableMessage = false;
        getRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                let filename = getFilename(file);

                // Fallback for filename
                if ((!filename || filename.trim() === '' || filename.startsWith('.')) && response.type) {
                    filename = generateUUID() + mime.getExtension(response.type);
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
