import { useAuthStore } from '@/store/AuthStore';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useNavigationStore } from '@/store/NavigationStore';

export function useRequestHandling() {
    const authStore = useAuthStore();
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();

    function getRequest(path: string, context: string, disableMessage: boolean, headers: Headers = new Headers()): any {
        headers = addAuthorizationHeader(headers); // Add the Authorization header
        return fetch(path, { method: 'GET', headers: headers })
            .then((response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.json(); // Return the response as JSON
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] ===
                        'application/asset-administration-shell-package+xml' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.blob(); // Return the response as Blob}
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0].includes('image') &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.blob(); // Return the response as Blob
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'text/csv' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.text(); // Return the response as text
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'text/plain' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.text(); // Return the response as text
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/pdf' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.blob(); // Return the response as Blob
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else if (response.ok && response.status >= 200 && response.status < 300) {
                    return response.blob(); // Return the response as Blob
                } else {
                    // Unexpected HTTP status
                    throw new Error('Unexpected HTTP status: ' + response.status);
                }
            })
            .then((data) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data };
                } else {
                    // Unexpected response format
                    throw new Error('Unexpected response format');
                }
            })
            .catch((error) => {
                // Catch any errors
                // console.error('Error: ', error);  // Log the error
                if (!disableMessage)
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error! Server responded with: ' + error,
                    });
                return { success: false };
            });
    }

    function postRequest(
        path: string,
        body: any,
        headers: Headers,
        context: string,
        disableMessage: boolean,
        isTSRequest: boolean = false
    ): any {
        if (!isTSRequest) {
            headers = addAuthorizationHeader(headers); // Add the Authorization header
        }
        return fetch(path, { method: 'POST', body: body, headers: headers })
            .then((response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.json(); // Return the response as JSON
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'text/csv' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.text(); // Return the response as text
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else {
                    return; // Return without content
                }
            })
            .then((data) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data };
                } else if (data === null || data === undefined) {
                    // in this case no content is expected
                    return { success: true };
                } else {
                    // Unexpected response format
                    throw new Error('Unexpected response format');
                }
            })
            .catch((error) => {
                // Catch any errors
                // console.error('Error: ', error); // Log the error
                if (!disableMessage)
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error! Server responded with: ' + error,
                    });
                return { success: false };
            });
    }

    function putRequest(path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
        headers = addAuthorizationHeader(headers); // Add the Authorization header
        return fetch(path, { method: 'PUT', body: body, headers: headers })
            .then((response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.json(); // Return the response as JSON
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else {
                    return; // Return without content
                }
            })
            .then((data) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data };
                } else if (data === null || data === undefined) {
                    // in this case no content is expected
                    return { success: true };
                } else {
                    // Unexpected response format
                    throw new Error('Unexpected response format');
                }
            })
            .catch((error) => {
                // Catch any errors
                // console.error('Error: ', error); // Log the error
                if (!disableMessage)
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error! Server responded with: ' + error,
                    });
                return { success: false };
            });
    }

    function patchRequest(path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
        headers = addAuthorizationHeader(headers); // Add the Authorization header
        return fetch(path, { method: 'PATCH', body: body, headers: headers })
            .then((response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.json(); // Return the response as JSON
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else {
                    return; // Return without content
                }
            })
            .then((data) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data };
                } else if (data === null || data === undefined) {
                    // in this case no content is expected
                    return { success: true };
                } else {
                    // Unexpected response format
                    throw new Error('Unexpected response format');
                }
            })
            .catch((error) => {
                // Catch any errors
                // console.error('Error: ', error); // Log the error
                if (!disableMessage)
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error! Server responded with: ' + error,
                    });
                return { success: false };
            });
    }

    function deleteRequest(path: string, context: string, disableMessage: boolean): any {
        return fetch(path, { method: 'DELETE', headers: addAuthorizationHeader(new Headers()) })
            .then((response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return response.json(); // Return the response as JSON
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else {
                    return; // Return without content
                }
            })
            .then((data) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data };
                } else {
                    // in this case no content is expected
                    return { success: true };
                }
            })
            .catch((error) => {
                // Catch any errors
                // console.error('Error: ', error); // Log the error
                if (!disableMessage)
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Error! Server responded with: ' + error,
                    });
                return { success: false };
            });
    }

    function addAuthorizationHeader(headers: Headers): Headers {
        if (authStore.getAuthStatus) {
            headers.set('Authorization', 'Bearer ' + authStore.getToken);
            return headers;
        } else if (envStore.getBasicAuthActive) {
            headers.set(
                'Authorization',
                'Basic ' + btoa(envStore.getBasicAuthUsername + ':' + envStore.getBasicAuthPassword)
            );
            return headers;
        } else {
            return headers;
        }
    }

    function errorHandler(errorData: any, context: string): void {
        // console.log('Error: ', errorData, 'Context: ', context)
        const initialErrorMessage = 'Error ' + context + '!';
        let errorMessage = '';

        // Building error message based on the new error response structure
        if (errorData.status) {
            errorMessage += '\nStatus: ' + errorData.status;
        }
        if (errorData.error) {
            errorMessage += '\nError: ' + errorData.error;
        }
        if (errorData.timestamp) {
            const errorDate = new Date(errorData.timestamp).toLocaleString();
            errorMessage += '\nTimestamp: ' + errorDate;
        }
        if (errorData.path) {
            errorMessage += '\nPath: ' + errorData.path;
        }

        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 60000,
            color: 'error',
            btnColor: 'buttonText',
            baseError: initialErrorMessage,
            extendedError: errorMessage,
        });
    }

    return {
        getRequest,
        postRequest,
        putRequest,
        patchRequest,
        deleteRequest,
        errorHandler,
    };
}
