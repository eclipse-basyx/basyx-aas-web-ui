import type { BaSyxComponentKey } from '@/types/BaSyx';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';

export function useRequestHandling() {
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    function getRequest(path: string, context: string, disableMessage: boolean, headers: Headers = new Headers()): any {
        headers = addAuthorizationHeader(headers, path); // Add the Authorization header
        return fetch(path, { method: 'GET', headers: headers })
            .then(async (response) => {
                // Check if the Server responded with content
                if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/json' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.json() }; // Return the response as JSON
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] ===
                        'application/asset-administration-shell-package+xml' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.blob() }; // Return the response as Blob}
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0].includes('image') &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.blob() }; // Return the response as Blob
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'text/csv' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.text() }; // Return the response as text
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'text/plain' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.text() }; // Return the response as text
                } else if (
                    response.headers.get('Content-Type')?.split(';')[0] === 'application/pdf' &&
                    response.headers.get('Content-Length') !== '0'
                ) {
                    return { response: response, data: await response.blob() }; // Return the response as Blob
                } else if (!response.ok) {
                    // No content but received an HTTP error status
                    throw new Error('Error status: ' + response.status);
                } else if (response.ok && response.status >= 200 && response.status < 300) {
                    return { response: response, data: await response.blob() }; // Return the response as Blob
                } else {
                    // Unexpected HTTP status
                    throw new Error('Unexpected HTTP status: ' + response.status);
                }
            })
            .then(({ response, data }) => {
                // Check if the Server responded with an error
                if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status >= 400) {
                    // Error response from the server
                    if (!disableMessage) errorHandler(data, context); // Call the error handler
                    return { success: false, status: response.status, raw: response };
                } else if (data) {
                    // Successful response from the server
                    return { success: true, data: data, status: response.status, raw: response };
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

    function postRequest(
        path: string,
        body: any,
        headers: Headers,
        context: string,
        disableMessage: boolean,
        isTSRequest: boolean = false
    ): any {
        if (!isTSRequest) {
            headers = addAuthorizationHeader(headers, path); // Add the Authorization header
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
                if (
                    data &&
                    Array.isArray(data) &&
                    data.length > 0 &&
                    Object.prototype.hasOwnProperty.call(data[0], 'code') &&
                    data[0].code >= 400
                ) {
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
        headers = addAuthorizationHeader(headers, path); // Add the Authorization header
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
        headers = addAuthorizationHeader(headers, path); // Add the Authorization header
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
        return fetch(path, { method: 'DELETE', headers: addAuthorizationHeader(new Headers(), path) })
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

    function addAuthorizationHeader(headers: Headers, path: string): Headers {
        // Try to find which infrastructure component this request is for
        const selectedInfra = infrastructureStore.getSelectedInfrastructure;

        // Debug logging (using warn to avoid lint errors)
        if (process.env.NODE_ENV === 'development') {
            console.warn('[RequestHandling] Adding auth header for path:', path);
            console.warn('[RequestHandling] Selected infrastructure:', selectedInfra?.name);
        }

        if (selectedInfra) {
            // Check which component URL matches this request path
            const componentKey = findMatchingComponent(path, selectedInfra);

            if (process.env.NODE_ENV === 'development') {
                console.warn('[RequestHandling] Matched component:', componentKey);
            }

            // Use infrastructure-level authentication if configured
            const auth = selectedInfra.auth;

            if (process.env.NODE_ENV === 'development') {
                console.warn('[RequestHandling] Auth config:', {
                    securityType: auth?.securityType,
                    hasToken: !!selectedInfra.token?.accessToken,
                    token: selectedInfra.token,
                });
            }

            if (auth && auth.securityType !== 'No Authentication') {
                if (auth.securityType === 'Bearer Token' && auth.bearerToken?.token) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('[RequestHandling] Using Bearer Token');
                    }
                    headers.set('Authorization', 'Bearer ' + auth.bearerToken.token);
                    return headers;
                } else if (auth.securityType === 'Basic Authentication' && auth.basicAuth) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('[RequestHandling] Using Basic Auth');
                    }
                    headers.set(
                        'Authorization',
                        'Basic ' + btoa(auth.basicAuth.username + ':' + auth.basicAuth.password)
                    );
                    return headers;
                } else if (auth.securityType === 'Keycloak' && selectedInfra.token?.accessToken) {
                    // Use stored token from infrastructure
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(
                            '[RequestHandling] Using Keycloak token:',
                            selectedInfra.token.accessToken.substring(0, 20) + '...'
                        );
                    }
                    headers.set('Authorization', 'Bearer ' + selectedInfra.token.accessToken);
                    return headers;
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('[RequestHandling] Auth configured but no valid credentials/token found');
                    }
                }
            }
        }

        return headers;
    }

    function findMatchingComponent(path: string, infrastructure: any): BaSyxComponentKey | null {
        // Try to match the request path to one of the infrastructure components
        const componentKeys: BaSyxComponentKey[] = [
            'AASDiscovery',
            'AASRegistry',
            'SubmodelRegistry',
            'AASRepo',
            'SubmodelRepo',
            'ConceptDescriptionRepo',
        ];

        for (const key of componentKeys) {
            const componentUrl = infrastructure.components[key].url;
            if (componentUrl && componentUrl.trim() !== '' && path.startsWith(componentUrl.trim())) {
                return key;
            }
        }

        return null;
    }

    function errorHandler(errorData: any, context: string): void {
        // console.log('Error: ', errorData, 'Context: ', context)
        const initialErrorMessage = 'Error ' + context + '!';
        let errorMessage = '';
        const error = errorData[0];
        // Building error message based on the new error response structure
        if (error.code) {
            errorMessage += 'Status: ' + error.code;
        }
        if (error.messageType) {
            errorMessage += '\nMessage Type: ' + error.messageType;
        }
        if (error.correlationId) {
            errorMessage += '\nCorrelation ID: ' + error.correlationId;
        }
        if (error.timestamp) {
            const errorDate = new Date(error.timestamp).toLocaleString();
            errorMessage += '\nTimestamp: ' + errorDate;
        }
        if (error.text) {
            errorMessage += '\nText: ' + error.text;
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
