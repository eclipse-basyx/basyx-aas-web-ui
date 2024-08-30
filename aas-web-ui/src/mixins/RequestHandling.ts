import { defineComponent } from 'vue';
import { useNavigationStore } from '@/store/NavigationStore';
import { useAuthStore } from '@/store/AuthStore';

export default defineComponent({
    name: 'RequestHandling',
    data() {
        return {
            navigationStore: useNavigationStore(), // NavigationStore Object
            authStore: useAuthStore(), // AuthStore Object
        };
    },

    methods: {
        addAuthorizationHeader(headers: Headers): Headers {
            headers.set('Authorization', 'Bearer ' + this.authStore.getToken);
            return headers;
        },
        // Function to send get Request which returns a Promise
        getRequest(path: string, context: string, disableMessage: boolean, headers: Headers = new Headers()): any {
            headers = this.addAuthorizationHeader(headers); // Add the Authorization header
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
                    if (data && data.hasOwnProperty('status') && data.status >= 400) {
                        // Error response from the server
                        if (!disableMessage) this.errorHandler(data, context); // Call the error handler
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
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Error! Server responded with: ' + error,
                        });
                    return { success: false };
                });
        },

        // Function to send post Request which returns a Promise
        postRequest(path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
            headers = this.addAuthorizationHeader(headers); // Add the Authorization header
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
                    if (data && data.hasOwnProperty('status') && data.status >= 400) {
                        // Error response from the server
                        if (!disableMessage) this.errorHandler(data, context); // Call the error handler
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
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Error! Server responded with: ' + error,
                        });
                    return { success: false };
                });
        },

        // Function to send put Request which returns a Promise
        putRequest(path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
            headers = this.addAuthorizationHeader(headers); // Add the Authorization header
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
                    if (data && data.hasOwnProperty('status') && data.status >= 400) {
                        // Error response from the server
                        if (!disableMessage) this.errorHandler(data, context); // Call the error handler
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
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Error! Server responded with: ' + error,
                        });
                    return { success: false };
                });
        },

        // Function to send patch Request which returns a Promise
        patchRequest(path: string, body: any, headers: Headers, context: string, disableMessage: boolean): any {
            headers = this.addAuthorizationHeader(headers); // Add the Authorization header
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
                    if (data && data.hasOwnProperty('status') && data.status >= 400) {
                        // Error response from the server
                        if (!disableMessage) this.errorHandler(data, context); // Call the error handler
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
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Error! Server responded with: ' + error,
                        });
                    return { success: false };
                });
        },

        // Function to send delete Request which returns a Promise
        deleteRequest(path: string, context: string, disableMessage: boolean): any {
            return fetch(path, { method: 'DELETE', headers: this.addAuthorizationHeader(new Headers()) })
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
                    if (data && data.hasOwnProperty('status') && data.status >= 400) {
                        // Error response from the server
                        if (!disableMessage) this.errorHandler(data, context); // Call the error handler
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
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Error! Server responded with: ' + error,
                        });
                    return { success: false };
                });
        },

        // Function to handle errors
        errorHandler(errorData: any, context: string) {
            // console.log('Error: ', errorData, 'Context: ', context)
            let initialErrorMessage = 'Error ' + context + '!';
            let errorMessage = '';

            // Building error message based on the new error response structure
            if (errorData.status) {
                errorMessage += '\nStatus: ' + errorData.status;
            }
            if (errorData.error) {
                errorMessage += '\nError: ' + errorData.error;
            }
            if (errorData.timestamp) {
                let errorDate = new Date(errorData.timestamp).toLocaleString();
                errorMessage += '\nTimestamp: ' + errorDate;
            }
            if (errorData.path) {
                errorMessage += '\nPath: ' + errorData.path;
            }

            this.navigationStore.dispatchSnackbar({
                status: true,
                timeout: 60000,
                color: 'error',
                btnColor: 'buttonText',
                baseError: initialErrorMessage,
                extendedError: errorMessage,
            });
        },
    },
});
