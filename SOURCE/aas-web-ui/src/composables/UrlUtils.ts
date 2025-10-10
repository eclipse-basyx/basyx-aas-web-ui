import { useRequestHandling } from '@/composables/RequestHandling';

export const urlRegex =
    /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export function useUrlUtils() {
    const { getRequest } = useRequestHandling();

    /**
     * Retrieves a Blob object from the specified URL and returns its object URL.
     *
     * This function makes a GET request to the provided URL, and if successful,
     * it generates an object URL for the Blob received in the response.
     *
     * @param {string} url - The URL from which to retrieve the Blob.
     * @returns {string} An object URL representing the Blob, or an empty string if the request fails.
     */
    async function getBlobUrl(url: string, isExternal: boolean): Promise<string> {
        const failResponse = '';

        if (!url || url.trim() === '') return failResponse;

        if (isExternal) {
            return url;
        }

        const context = 'retrieving File';
        const disableMessage = false;
        const response = await getRequest(url, context, disableMessage);
        if (response.success) {
            if (response.data instanceof Blob) {
                return URL.createObjectURL(response.data);
            } else {
                const jsonString = JSON.stringify(response.data);
                const blob = new Blob([jsonString], { type: 'application/json' });
                return URL.createObjectURL(blob);
            }
        }

        return failResponse;
    }

    return { getBlobUrl };
}
