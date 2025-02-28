import mime from 'mime';
import { v4 as uuidv4 } from 'uuid';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useUrlUtils } from '@/composables/UrlUtils';

export function useSMEFile() {
    // Composables
    const { getRequest } = useRequestHandling();
    const { getBlobUrl } = useUrlUtils();

    /**
     * Checks if the given file object is a valid File model with respect to AAS metamodel specs.
     *
     * @param {any} file - The file object to check.
     * @returns {boolean} True if the object is a File model, otherwise false.
     */
    function isFile(file: any): boolean {
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
    function hasValue(file: any): boolean {
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
    function valueToDisplay(file: any, defaultValueToDisplay: string = ''): string {
        if (isFile(file) && hasValue(file)) {
            return file.value;
        }
        return defaultValueToDisplay;
    }

    /**
     * Retrieves the URL value of a file if it exists, otherwise returns a default value.
     *
     * @param {any} file - The file object to check.
     * @returns {{ url: string, isExternal: boolean }} The URL value of the file or the default value.
     */
    function valueUrl(file: any): { url: string; isExternal: boolean } {
        if (isFile(file) && hasValue(file)) {
            try {
                new URL(file.value);
                // If no error is thrown, value is a valid URL
                return { url: file.value, isExternal: true };
            } catch {
                if (file.path && file.path.trim() !== '') return { url: `${file.path}/attachment`, isExternal: false };
            }
        }
        return { url: '', isExternal: false };
    }

    /**
     * Retrieves a Blob URL for a given file if it has a valid URL.
     *
     * This function checks if the provided file object has a valid URL,
     * and if so, makes a request to retrieve the associated Blob data.
     * Upon a successful response, it creates and returns a URL that can
     * be used to access the Blob. If the file does not have a valid URL
     * or the request fails, it returns an empty string.
     *
     * @param {any} file - The file object to be processed. It is expected
     *                     to have a method or property that allows
     *                     getting its URL.
     * @returns {string} - A URL string for the Blob if successful,
     *                    or an empty string if not.
     */
    async function valueBlob(file: any): Promise<string> {
        const fileUrl = valueUrl(file);
        if (fileUrl.url && fileUrl.url.trim() !== '') {
            return await getBlobUrl(fileUrl.url, fileUrl.isExternal);
        }
        return '';
    }

    /**
     * Retrieves the filename of a file if it exists, otherwise returns a default value.
     *
     * @param {any} file - The file object to check.
     * @returns {string} The filename of the file or an empty string if filename determination is not possible.
     */
    function getFilename(file: any): string {
        if (isFile(file) && hasValue(file)) {
            const fileValueUrl = valueUrl(file).url;

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
    async function downloadFile(file: any): Promise<void> {
        if (isFile(file) && hasValue(file) && valueUrl(file)) {
            const path = valueUrl(file).url;
            const context = 'retrieving Attachment File';
            const disableMessage = false;
            await getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    let filename = getFilename(file);

                    // Fallback for filename
                    if ((!filename || filename.trim() === '' || filename.startsWith('.')) && response.type) {
                        const fileExtension = mime.getExtension(response.type) || '';
                        if (fileExtension === '') return;
                        filename = uuidv4 + fileExtension;
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

    return { isFile, hasValue, valueToDisplay, valueUrl, valueBlob, getFilename, downloadFile };
}
