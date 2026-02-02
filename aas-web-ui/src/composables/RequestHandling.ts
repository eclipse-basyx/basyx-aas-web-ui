import { useAuth } from '@/composables/Auth/useAuth';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';

// Track if we've already shown auth error to avoid spam
let authErrorShown = false;
let authErrorTimeout: NodeJS.Timeout | null = null;

export function useRequestHandling() {
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();
    const environmentStore = useEnvStore();
    const { login } = useAuth();

    /**
     * Centralized error handler for catch blocks
     * Handles authentication errors and general errors
     */
    function handleRequestError(error: unknown, disableMessage: boolean): { success: false; status?: number } {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const is401Error = errorMessage.includes('Error status: 401') || errorMessage.includes('401');
        const isAuthFailure = is401Error;

        const currentInfra = infrastructureStore.getSelectedInfrastructure;
        const hasAuth = currentInfra?.auth && currentInfra.auth.securityType !== 'No Authentication';

        // Handle authentication errors
        if (isAuthFailure && hasAuth) {
            if (!authErrorShown) {
                authErrorShown = true;
                if (authErrorTimeout) clearTimeout(authErrorTimeout);
                authErrorTimeout = setTimeout(() => {
                    authErrorShown = false;
                    authErrorTimeout = null;
                }, 30000);

                if (currentInfra?.id) {
                    infrastructureStore.setAuthenticationStatusForInfrastructure(currentInfra.id, false);
                }

                const isLoginAvailable = infrastructureStore.getIsLoginAvailable;

                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    baseError: 'Authentication required!',
                    extendedError: 'Please log in again.',
                    actionText: isLoginAvailable ? 'Login' : undefined,
                    actionCallback: isLoginAvailable ? login : undefined,
                });
            }
            return { success: false, status: 401 };
        }

        // Handle other errors
        if (!disableMessage) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 60000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Error! Server responded with: ' + error,
            });
        }
        return { success: false };
    }

    function getRequest(path: string, context: string, disableMessage: boolean, headers: Headers = new Headers()): any {
        if (shouldAddAuthorizationHeader(path)) {
            // No Authorization needed for the /description endpoint.
            headers = addAuthorizationHeader(headers); // Add the Authorization header
        }
        return fetch(path, { method: 'GET', headers: headers })
            .then(async (response) => {
                // Check if the Server responded with content.
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
            .catch((error) => handleRequestError(error, disableMessage));
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
            .catch((error) => handleRequestError(error, disableMessage));
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
            .catch((error) => handleRequestError(error, disableMessage));
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
            .catch((error) => handleRequestError(error, disableMessage));
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
            .catch((error) => handleRequestError(error, disableMessage));
    }

    function addAuthorizationHeader(headers: Headers): Headers {
        // Try to find which infrastructure component this request is for
        const selectedInfra = infrastructureStore.getSelectedInfrastructure;

        if (selectedInfra) {
            // Use infrastructure-level authentication if configured
            const auth = selectedInfra.auth;
            const authorizationPrefix = environmentStore.getAuthorizationPrefix;
            if (auth && auth.securityType !== 'No Authentication') {
                if (auth.securityType === 'Bearer Token' && auth.bearerToken?.token) {
                    headers.set('Authorization', authorizationPrefix + ' ' + auth.bearerToken.token);
                    return headers;
                } else if (auth.securityType === 'Basic Authentication' && auth.basicAuth) {
                    headers.set(
                        'Authorization',
                        'Basic ' + btoa(auth.basicAuth.username + ':' + auth.basicAuth.password)
                    );
                    return headers;
                } else if (auth.securityType === 'OAuth2' && selectedInfra.token?.accessToken) {
                    headers.set('Authorization', authorizationPrefix + ' ' + selectedInfra.token.accessToken);
                    return headers;
                }
            }
        }

        return headers;
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

    function shouldAddAuthorizationHeader(path: string): boolean {
        const exemptionEnabled = environmentStore.getAuthorizationDescriptionEndpointExemption;
        if (
            exemptionEnabled &&
            path.endsWith('/description') &&
            !path.includes('/submodels/') &&
            !path.includes('/submodel-elements/')
        ) {
            return false;
        }
        return true;
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
