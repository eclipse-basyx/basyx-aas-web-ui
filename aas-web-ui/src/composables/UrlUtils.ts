import { useRequestHandling } from '@/composables/RequestHandling';

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
            return URL.createObjectURL(response.data as Blob);
        }

        return failResponse;
    }

    return { getBlobUrl };
}
