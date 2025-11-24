<template>
    <v-dialog v-model="dialog" persistent max-width="800">
        <v-card>
            <v-card-title
                ><span class="text-primary">{{ mode === 'source' ? 'Remote Source' : 'Remote Destination' }}&nbsp;</span
                >Configuration</v-card-title
            >
            <v-divider />
            <v-card-text>
                <v-checkbox v-model="isAasEnvironment" label="Is AAS Environment" hide-details></v-checkbox>
                <v-alert
                    density="compact"
                    class="mb-4"
                    text="An AAS Environment combines AAS Repository, Submodel Repository, and Concept Description Repository
                    in one Component. You may also use this, when your Components use the same Base Path, Port and
                    Security Configuration." />
                <v-sheet elevation="4">
                    <v-tabs v-model="tab" color="primary" density="compact" align-tabs="center">
                        <v-tab value="one">AAS {{ isAasEnvironment ? 'Environment' : 'Repository' }}</v-tab>
                        <v-tab value="two" :disabled="isAasEnvironment">Submodel Repository</v-tab>
                        <v-tab value="three" :disabled="isAasEnvironment">Concept Description Repository</v-tab>
                    </v-tabs>

                    <v-divider></v-divider>

                    <v-tabs-window v-model="tab">
                        <v-tabs-window-item value="one">
                            <v-form class="pa-4">
                                <span>Server Address</span>
                                <v-row>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="endpoint"
                                            density="compact"
                                            variant="outlined"
                                            label="Endpoint"
                                            placeholder="http://localhost"
                                            required></v-text-field>
                                    </v-col>
                                </v-row>
                                <v-checkbox v-model="securityEnabled" label="Security Enabled"></v-checkbox>
                                <v-row v-if="securityEnabled">
                                    <v-col cols="10">
                                        <v-select
                                            v-model="securityType"
                                            label="Security Type"
                                            :items="securityTypes"
                                            density="compact"
                                            variant="outlined"></v-select>
                                    </v-col>
                                    <v-col cols="2">
                                        <v-btn
                                            v-if="!hasToken"
                                            variant="tonal"
                                            color="primary"
                                            class="mb-n4"
                                            @click="openAuthDialog">
                                            Connect
                                        </v-btn>
                                        <v-btn v-else variant="tonal" color="error" class="mb-n4" @click="logout">
                                            Logout
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-form>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="two"></v-tabs-window-item>
                        <v-tabs-window-item value="three"></v-tabs-window-item>
                    </v-tabs-window>
                </v-sheet>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn color="error" variant="tonal" @click="dialog = false">Abort</v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    variant="tonal"
                    :loading="connectionTestLoading"
                    :disabled="!endpoint"
                    @click="testConnection">
                    <template #prepend>
                        <v-icon v-if="connectionTestStatus === 'success'">mdi-checkbox-marked-circle</v-icon>
                        <v-icon v-else-if="connectionTestStatus === 'error'">mdi-close-circle</v-icon>
                        <v-icon v-else>mdi-lan-connect</v-icon>
                    </template>
                    Test Connection
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" variant="tonal" :disabled="!endpoint" @click="saveConnection">Save</v-btn>
            </v-card-actions>
            <v-card-text v-if="connectionTestMessage" class="pt-2">
                <v-alert
                    :type="connectionTestStatus"
                    density="compact"
                    closable
                    @click:close="connectionTestMessage = ''">
                    {{ connectionTestMessage }}
                </v-alert>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Keycloak Configuration Dialog -->
    <v-dialog v-model="keycloakDialog" persistent max-width="600">
        <v-card>
            <v-card-title> <span class="text-primary">Keycloak</span> Authentication Setup </v-card-title>
            <v-divider />
            <v-card-text>
                <v-form ref="keycloakForm" class="mt-4">
                    <v-text-field
                        v-model="keycloakConfig.serverUrl"
                        label="Keycloak Server URL"
                        placeholder="https://keycloak.example.com"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required, rules.url]"
                        required></v-text-field>

                    <v-text-field
                        v-model="keycloakConfig.realm"
                        label="Realm"
                        placeholder="master"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required]"
                        required></v-text-field>

                    <v-text-field
                        v-model="keycloakConfig.clientId"
                        label="Client ID"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required]"
                        required></v-text-field>

                    <v-radio-group v-model="keycloakConfig.authFlow">
                        <template #label>
                            <span class="text-subtitle-2">Authentication Flow</span>
                        </template>
                        <v-radio label="User Login (Authorization Code Flow)" value="auth-code"></v-radio>
                        <v-radio label="Service Account (Client Credentials)" value="client-credentials"></v-radio>
                        <v-radio label="Direct Grant (Username/Password)" value="password"></v-radio>
                    </v-radio-group>

                    <!-- Client Credentials Fields -->
                    <template v-if="keycloakConfig.authFlow === 'client-credentials'">
                        <v-text-field
                            v-model="keycloakConfig.clientSecret"
                            label="Client Secret"
                            variant="outlined"
                            density="compact"
                            type="password"
                            :rules="[rules.required]"
                            required></v-text-field>
                    </template>

                    <!-- Password Grant Fields -->
                    <template v-if="keycloakConfig.authFlow === 'password'">
                        <v-text-field
                            v-model="keycloakConfig.clientSecret"
                            label="Client Secret (Optional)"
                            variant="outlined"
                            density="compact"
                            type="password"></v-text-field>

                        <v-text-field
                            v-model="keycloakConfig.username"
                            label="Username"
                            variant="outlined"
                            density="compact"
                            :rules="[rules.required]"
                            required></v-text-field>

                        <v-text-field
                            v-model="keycloakConfig.password"
                            label="Password"
                            variant="outlined"
                            density="compact"
                            type="password"
                            :rules="[rules.required]"
                            required></v-text-field>
                    </template>

                    <v-alert v-if="keycloakError" type="error" class="mt-2" closable @click:close="keycloakError = ''">
                        {{ keycloakError }}
                    </v-alert>

                    <v-alert v-if="keycloakSuccess" type="success" class="mt-2">
                        <div class="d-flex align-center">
                            <span>Authentication successful! Token acquired.</span>
                        </div>
                    </v-alert>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn color="error" variant="tonal" :disabled="keycloakLoading" @click="closeKeycloakDialog">
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    variant="tonal"
                    :loading="keycloakLoading"
                    :disabled="keycloakSuccess"
                    @click="authenticateKeycloak">
                    Authenticate
                </v-btn>
                <v-btn
                    color="success"
                    variant="tonal"
                    :disabled="!keycloakSuccess || keycloakLoading"
                    @click="saveKeycloakConfig">
                    Save & Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Basic Authentication Dialog -->
    <v-dialog v-model="basicAuthDialog" persistent max-width="600">
        <v-card>
            <v-card-title> <span class="text-primary">Basic</span> Authentication Setup </v-card-title>
            <v-divider />
            <v-card-text>
                <v-form class="mt-4">
                    <v-text-field
                        v-model="basicAuthConfig.username"
                        label="Username"
                        variant="outlined"
                        density="compact"
                        required></v-text-field>

                    <v-text-field
                        v-model="basicAuthConfig.password"
                        label="Password"
                        variant="outlined"
                        density="compact"
                        type="password"
                        required></v-text-field>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn color="error" variant="tonal" @click="basicAuthDialog = false"> Cancel </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                    color="success"
                    variant="tonal"
                    :disabled="!basicAuthConfig.username || !basicAuthConfig.password"
                    @click="saveBasicAuthConfig">
                    Save & Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Bearer Token Dialog -->
    <v-dialog v-model="bearerTokenDialog" persistent max-width="600">
        <v-card>
            <v-card-title> <span class="text-primary">Bearer Token</span> Authentication Setup </v-card-title>
            <v-divider />
            <v-card-text>
                <v-form class="mt-4">
                    <v-textarea
                        v-model="bearerToken"
                        label="Bearer Token"
                        variant="outlined"
                        density="compact"
                        rows="3"
                        placeholder="Enter your Bearer token"
                        required></v-textarea>
                    <v-alert density="compact" class="mt-2" type="info">
                        Enter the Bearer token that will be used in the Authorization header.
                    </v-alert>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-btn color="error" variant="tonal" @click="bearerTokenDialog = false"> Cancel </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" variant="tonal" :disabled="!bearerToken" @click="saveBearerTokenConfig">
                    Save & Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import type { ComponentType, SecurityType } from '@/store/MigrationStore';
    import type { BasicAuthData, KeycloakConnectionData } from '@/types/Infrastructure';
    import { computed, ref, watch } from 'vue';
    import { useMigrationStore } from '@/store/MigrationStore';

    const migrationStore = useMigrationStore();
    const dialog = ref<boolean>(true);
    const tab = ref<string>('one');
    const securityEnabled = ref<boolean>(false);
    const securityTypes = ref<SecurityType[]>(['Basic Authentication', 'Keycloak', 'Bearer Token']);
    const securityType = ref<SecurityType>('Basic Authentication');
    const isAasEnvironment = ref<boolean>(false);
    const endpoint = ref<string>('');
    const connectionTestLoading = ref<boolean>(false);
    const connectionTestStatus = ref<'success' | 'error'>('error');
    const connectionTestMessage = ref<string>('');

    // Keycloak authentication
    const keycloakDialog = ref<boolean>(false);
    const keycloakForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
    const keycloakLoading = ref<boolean>(false);
    const keycloakSuccess = ref<boolean>(false);
    const keycloakError = ref<string>('');
    const accessToken = ref<string>('');
    const refreshToken = ref<string>('');
    let loginPopup: Window | null = null;

    const keycloakConfig = ref<KeycloakConnectionData>({
        serverUrl: '',
        realm: '',
        clientId: '',
        authFlow: 'auth-code',
        clientSecret: '',
        username: '',
        password: '',
    });

    // Basic Authentication
    const basicAuthDialog = ref<boolean>(false);
    const basicAuthConfig = ref<BasicAuthData>({
        username: '',
        password: '',
    });

    // Bearer Token
    const bearerTokenDialog = ref<boolean>(false);
    const bearerToken = ref<string>('');

    // Validation rules
    const rules = {
        required: (value: string) => !!value || 'This field is required',
        url: (value: string) => {
            try {
                new URL(value);
                return true;
            } catch {
                return 'Please enter a valid URL';
            }
        },
    };

    // Watch model value to set dialog
    const props = defineProps({
        modelValue: { type: Boolean, required: true },
        mode: { type: String as () => 'source' | 'destination', default: 'source' },
    });

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void;
        (e: 'saved'): void;
    }>();

    // Get current component type based on active tab
    const currentComponent = computed<ComponentType>(() => {
        if (isAasEnvironment.value) return 'aas';
        if (tab.value === 'one') return 'aas';
        if (tab.value === 'two') return 'submodel';
        return 'conceptDescription';
    });

    // Computed properties based on mode and component
    const hasToken = computed(() => {
        const component = currentComponent.value;
        if (props.mode === 'source') {
            if (component === 'aas') return migrationStore.hasSourceAasToken;
            if (component === 'submodel') return migrationStore.hasSourceSubmodelToken;
            return migrationStore.hasSourceConceptDescriptionToken;
        } else {
            if (component === 'aas') return migrationStore.hasDestinationAasToken;
            if (component === 'submodel') return migrationStore.hasDestinationSubmodelToken;
            return migrationStore.hasDestinationConceptDescriptionToken;
        }
    });

    const currentConnection = computed(() => {
        return props.mode === 'source'
            ? migrationStore.getSourceConnection(currentComponent.value)
            : migrationStore.getDestinationConnection(currentComponent.value);
    });

    const currentToken = computed(() => {
        const component = currentComponent.value;
        if (props.mode === 'source') {
            if (component === 'aas') return migrationStore.getSourceAasAccessToken;
            if (component === 'submodel') return migrationStore.getSourceSubmodelAccessToken;
            return migrationStore.getSourceConceptDescriptionAccessToken;
        } else {
            if (component === 'aas') return migrationStore.getDestinationAasAccessToken;
            if (component === 'submodel') return migrationStore.getDestinationSubmodelAccessToken;
            return migrationStore.getDestinationConceptDescriptionAccessToken;
        }
    });

    watch(
        () => props.modelValue,
        (newVal) => {
            dialog.value = newVal;
            if (newVal) {
                loadComponentSettings();
            }
        },
        { immediate: true }
    );

    watch(
        () => dialog.value,
        (newVal) => {
            emit('update:modelValue', newVal);
        }
    );

    // Watch tab changes to load component-specific settings
    watch(
        () => tab.value,
        () => {
            loadComponentSettings();
        }
    );

    // Watch isAasEnvironment to sync settings across all components
    watch(
        () => isAasEnvironment.value,
        (newVal) => {
            if (newVal) {
                loadComponentSettings();
            }
        }
    );

    function loadComponentSettings(): void {
        const component = currentComponent.value;
        const connection =
            props.mode === 'source'
                ? migrationStore.getSourceConnection(component)
                : migrationStore.getDestinationConnection(component);

        if (connection) {
            endpoint.value = connection.endpoint;

            securityEnabled.value = connection.securityEnabled;
            securityType.value = connection.securityType;

            if (connection.keycloakConfig) {
                keycloakConfig.value = { ...connection.keycloakConfig };
            }
            if (connection.basicAuth) {
                basicAuthConfig.value = { ...connection.basicAuth };
            }
            if (connection.bearerToken) {
                bearerToken.value = connection.bearerToken.token;
            }
        } else {
            // Reset to defaults
            endpoint.value = '';
            securityEnabled.value = false;
            securityType.value = 'Basic Authentication';
        }
    }

    function openAuthDialog(): void {
        if (securityType.value === 'Keycloak') {
            keycloakDialog.value = true;
            keycloakSuccess.value = false;
            keycloakError.value = '';
        } else if (securityType.value === 'Basic Authentication') {
            basicAuthDialog.value = true;
        } else if (securityType.value === 'Bearer Token') {
            bearerTokenDialog.value = true;
        }
    }

    function closeKeycloakDialog(): void {
        keycloakDialog.value = false;
        keycloakSuccess.value = false;
        keycloakError.value = '';
        accessToken.value = '';
        refreshToken.value = '';
        if (loginPopup && !loginPopup.closed) {
            loginPopup.close();
        }
    }

    async function authenticateKeycloak(): Promise<void> {
        if (!keycloakForm.value) return;

        const { valid } = await keycloakForm.value.validate();
        if (!valid) return;

        keycloakLoading.value = true;
        keycloakError.value = '';
        keycloakSuccess.value = false;

        try {
            if (keycloakConfig.value.authFlow === 'client-credentials') {
                await authenticateWithClientCredentials();
            } else if (keycloakConfig.value.authFlow === 'password') {
                await authenticateWithPassword();
            } else {
                await authenticateWithAuthCode();
            }
        } catch (error: unknown) {
            keycloakError.value = error instanceof Error ? error.message : 'Authentication failed';
            keycloakSuccess.value = false;
        } finally {
            keycloakLoading.value = false;
        }
    }

    async function authenticateWithClientCredentials(): Promise<void> {
        const { serverUrl, realm, clientId, clientSecret } = keycloakConfig.value;

        const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret || '',
            grant_type: 'client_credentials',
        });

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'Authentication failed');
        }

        accessToken.value = data.access_token;
        refreshToken.value = data.refresh_token;
        keycloakSuccess.value = true;
    }

    async function authenticateWithPassword(): Promise<void> {
        const { serverUrl, realm, clientId, clientSecret, username, password } = keycloakConfig.value;

        const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            client_id: clientId,
            username: username || '',
            password: password || '',
            grant_type: 'password',
        });

        // Add client secret if provided
        if (clientSecret) {
            params.set('client_secret', clientSecret);
        }

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'Authentication failed');
        }

        accessToken.value = data.access_token;
        refreshToken.value = data.refresh_token;
        keycloakSuccess.value = true;
    }

    async function authenticateWithAuthCode(): Promise<void> {
        const { serverUrl, realm, clientId } = keycloakConfig.value;

        // Generate PKCE code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Store code verifier for later exchange
        sessionStorage.setItem('pkce_code_verifier', codeVerifier);

        // Build authorization URL
        const redirectUri = `${window.location.origin}/keycloak-callback.html`;
        const state = generateRandomString(32);
        sessionStorage.setItem('pkce_state', state);

        const authUrl = new URL(`${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/auth`);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid profile email');
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('state', state);

        // Open popup window
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        loginPopup = window.open(
            authUrl.toString(),
            'keycloak-login',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
        );

        if (!loginPopup) {
            keycloakError.value = 'Failed to open login popup. Please allow popups for this site.';
            keycloakLoading.value = false;
            return;
        }

        // Listen for messages from popup
        window.addEventListener('message', handleLoginMessage);

        // Monitor if popup is closed manually
        const popupCheckInterval = setInterval(() => {
            if (loginPopup && loginPopup.closed) {
                clearInterval(popupCheckInterval);
                window.removeEventListener('message', handleLoginMessage);
                if (!keycloakSuccess.value && !keycloakError.value) {
                    keycloakError.value = 'Login popup was closed';
                    keycloakLoading.value = false;
                }
            }
        }, 500);
    }

    function handleLoginMessage(event: MessageEvent): void {
        // Validate origin
        if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === 'keycloak-auth-code') {
            const { code, state } = event.data;
            const storedState = sessionStorage.getItem('pkce_state');

            if (state !== storedState) {
                keycloakError.value = 'Invalid state parameter';
                if (loginPopup && !loginPopup.closed) {
                    loginPopup.close();
                }
                return;
            }

            exchangeCodeForToken(code);
            window.removeEventListener('message', handleLoginMessage);
            if (loginPopup && !loginPopup.closed) {
                loginPopup.close();
            }
        } else if (event.data && event.data.type === 'keycloak-auth-error') {
            keycloakError.value = event.data.errorDescription || event.data.error || 'Authentication failed';
            if (loginPopup && !loginPopup.closed) {
                loginPopup.close();
            }
            window.removeEventListener('message', handleLoginMessage);
        }
    }

    async function exchangeCodeForToken(code: string): Promise<void> {
        const { serverUrl, realm, clientId } = keycloakConfig.value;
        const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
        const redirectUri = `${window.location.origin}/keycloak-callback.html`;

        if (!codeVerifier) {
            throw new Error('Code verifier not found');
        }

        const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            client_id: clientId,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
        });

        try {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || 'Token exchange failed');
            }

            accessToken.value = data.access_token;
            refreshToken.value = data.refresh_token;
            keycloakSuccess.value = true;

            // Clean up session storage
            sessionStorage.removeItem('pkce_code_verifier');
            sessionStorage.removeItem('pkce_state');
        } catch (error: unknown) {
            keycloakError.value = error instanceof Error ? error.message : 'Token exchange failed';
        }
    }

    function saveBasicAuthConfig(): void {
        const component = currentComponent.value;

        const connectionData = {
            endpoint: endpoint.value,
            securityEnabled: true,
            securityType: 'Basic Authentication' as SecurityType,
            basicAuth: {
                username: basicAuthConfig.value.username,
                password: basicAuthConfig.value.password,
            },
        };

        // Create a token for Basic Auth (base64 encoded credentials)
        const credentials = btoa(`${basicAuthConfig.value.username}:${basicAuthConfig.value.password}`);
        const tokenData = {
            accessToken: credentials,
        };

        if (props.mode === 'source') {
            migrationStore.setSourceConnection(component, connectionData);
            migrationStore.setSourceToken(component, tokenData);

            if (isAasEnvironment.value) {
                migrationStore.setSourceConnection('submodel', connectionData);
                migrationStore.setSourceToken('submodel', tokenData);
                migrationStore.setSourceConnection('conceptDescription', connectionData);
                migrationStore.setSourceToken('conceptDescription', tokenData);
            }
        } else {
            migrationStore.setDestinationConnection(component, connectionData);
            migrationStore.setDestinationToken(component, tokenData);

            if (isAasEnvironment.value) {
                migrationStore.setDestinationConnection('submodel', connectionData);
                migrationStore.setDestinationToken('submodel', tokenData);
                migrationStore.setDestinationConnection('conceptDescription', connectionData);
                migrationStore.setDestinationToken('conceptDescription', tokenData);
            }
        }

        basicAuthDialog.value = false;
    }

    function saveBearerTokenConfig(): void {
        const component = currentComponent.value;

        const connectionData = {
            endpoint: normalizeEndpoint(endpoint.value),
            securityEnabled: true,
            securityType: 'Bearer Token' as SecurityType,
            bearerToken: {
                token: bearerToken.value,
            },
        };

        const tokenData = {
            accessToken: bearerToken.value,
        };

        if (props.mode === 'source') {
            migrationStore.setSourceConnection(component, connectionData);
            migrationStore.setSourceToken(component, tokenData);

            if (isAasEnvironment.value) {
                migrationStore.setSourceConnection('submodel', connectionData);
                migrationStore.setSourceToken('submodel', tokenData);
                migrationStore.setSourceConnection('conceptDescription', connectionData);
                migrationStore.setSourceToken('conceptDescription', tokenData);
            }
        } else {
            migrationStore.setDestinationConnection(component, connectionData);
            migrationStore.setDestinationToken(component, tokenData);

            if (isAasEnvironment.value) {
                migrationStore.setDestinationConnection('submodel', connectionData);
                migrationStore.setDestinationToken('submodel', tokenData);
                migrationStore.setDestinationConnection('conceptDescription', connectionData);
                migrationStore.setDestinationToken('conceptDescription', tokenData);
            }
        }

        bearerTokenDialog.value = false;
    }

    function saveKeycloakConfig(): void {
        const component = currentComponent.value;

        // Save connection data and tokens to the migration store
        const connectionData = {
            endpoint: endpoint.value,
            securityEnabled: true,
            securityType: 'Keycloak' as SecurityType,
            keycloakConfig: {
                serverUrl: keycloakConfig.value.serverUrl,
                realm: keycloakConfig.value.realm,
                clientId: keycloakConfig.value.clientId,
                authFlow: keycloakConfig.value.authFlow,
                clientSecret: keycloakConfig.value.clientSecret,
                username: keycloakConfig.value.username,
                password: keycloakConfig.value.password,
            },
        };

        // Calculate token expiration (default 5 minutes if not provided)
        const expiresAt = Date.now() + 300 * 1000;

        const tokenData = {
            accessToken: accessToken.value,
            refreshToken: refreshToken.value,
            expiresAt,
        };

        if (props.mode === 'source') {
            migrationStore.setSourceConnection(component, connectionData);
            migrationStore.setSourceToken(component, tokenData);

            // If AAS Environment, apply to all components
            if (isAasEnvironment.value) {
                migrationStore.setSourceConnection('submodel', connectionData);
                migrationStore.setSourceToken('submodel', tokenData);
                migrationStore.setSourceConnection('conceptDescription', connectionData);
                migrationStore.setSourceToken('conceptDescription', tokenData);
            }
        } else {
            migrationStore.setDestinationConnection(component, connectionData);
            migrationStore.setDestinationToken(component, tokenData);

            // If AAS Environment, apply to all components
            if (isAasEnvironment.value) {
                migrationStore.setDestinationConnection('submodel', connectionData);
                migrationStore.setDestinationToken('submodel', tokenData);
                migrationStore.setDestinationConnection('conceptDescription', connectionData);
                migrationStore.setDestinationToken('conceptDescription', tokenData);
            }
        }

        closeKeycloakDialog();
    }

    function saveConnection(): void {
        const component = currentComponent.value;

        // If security is not enabled, save connection without authentication
        if (!securityEnabled.value) {
            const connectionData = {
                endpoint: endpoint.value,
                securityEnabled: false,
                securityType: 'Basic Authentication' as SecurityType,
            };

            if (props.mode === 'source') {
                migrationStore.setSourceConnection(component, connectionData);

                if (isAasEnvironment.value) {
                    migrationStore.setSourceConnection('submodel', connectionData);
                    migrationStore.setSourceConnection('conceptDescription', connectionData);
                }
            } else {
                migrationStore.setDestinationConnection(component, connectionData);

                if (isAasEnvironment.value) {
                    migrationStore.setDestinationConnection('submodel', connectionData);
                    migrationStore.setDestinationConnection('conceptDescription', connectionData);
                }
            }

            dialog.value = false;
            emit('saved');
        } else {
            // Security is enabled, check if token exists
            if (!hasToken.value) {
                connectionTestStatus.value = 'error';
                connectionTestMessage.value = 'Please authenticate before saving the connection.';
                return;
            }

            dialog.value = false;
        }
        dialog.value = false;
        emit('saved');
    }

    async function testConnection(): Promise<void> {
        if (!endpoint.value) return;

        connectionTestLoading.value = true;
        connectionTestStatus.value = 'error';
        connectionTestMessage.value = '';

        try {
            // Build the full URL
            const baseUrl = endpoint.value;
            let testUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            testUrl = normalizeEndpoint(testUrl);

            if (tab.value === 'one') {
                testUrl += '/shells';
            } else if (tab.value === 'two') {
                testUrl += '/submodels';
            } else {
                testUrl += '/concept-descriptions';
            }

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add authentication header based on security type
            if (securityEnabled.value && hasToken.value) {
                if (securityType.value === 'Keycloak' || securityType.value === 'Bearer Token') {
                    const token = currentToken.value;
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } else if (securityType.value === 'Basic Authentication') {
                    const token = currentToken.value;
                    if (token) {
                        headers['Authorization'] = `Basic ${token}`;
                    }
                }
            }

            // Test the connection
            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
            });
            if (response.ok) {
                connectionTestStatus.value = 'success';
                connectionTestMessage.value = `Connection successful! Status: ${response.status} ${response.statusText}`;
            } else if (response.status === 401) {
                connectionTestStatus.value = 'error';
                connectionTestMessage.value = 'You are not authorized for the requested resource (401)';
            } else {
                connectionTestStatus.value = 'error';
                connectionTestMessage.value = `Connection failed! Status: ${response.status} ${response.statusText}`;
            }
        } catch {
            connectionTestStatus.value = 'error';
            connectionTestMessage.value =
                'Failed to connect to endpoint. Check the server address and your network connection or authentication.';
        } finally {
            connectionTestLoading.value = false;
        }
    }

    function logout(): void {
        const component = currentComponent.value;
        const connection = currentConnection.value;
        if (!connection) return;

        // If Keycloak, open logout popup
        if (connection.securityType === 'Keycloak' && connection.keycloakConfig) {
            const { serverUrl, realm } = connection.keycloakConfig;
            const logoutUrl = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/logout`;

            const width = 500;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const logoutPopup = window.open(
                logoutUrl,
                'keycloak-logout',
                `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
            );

            // Monitor popup closure
            if (logoutPopup) {
                const checkPopupClosed = setInterval(() => {
                    if (logoutPopup.closed) {
                        clearInterval(checkPopupClosed);
                    }
                }, 500);
            }
        }

        // Clear tokens and connection from store based on mode
        if (props.mode === 'source') {
            migrationStore.clearSourceConnection(component);
            if (isAasEnvironment.value) {
                migrationStore.clearSourceConnection('submodel');
                migrationStore.clearSourceConnection('conceptDescription');
            }
        } else {
            migrationStore.clearDestinationConnection(component);
            if (isAasEnvironment.value) {
                migrationStore.clearDestinationConnection('submodel');
                migrationStore.clearDestinationConnection('conceptDescription');
            }
        }
    }

    // PKCE helper functions
    function generateRandomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += charset[randomValues[i] % charset.length];
        }
        return result;
    }

    function generateCodeVerifier(): string {
        return generateRandomString(128);
    }

    async function generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return base64UrlEncode(hash);
    }

    function base64UrlEncode(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Remove /shells, /submodels, /concept-descriptions from end of URL
    function normalizeEndpoint(url: string): string {
        let normalizedUrl = url;
        if (normalizedUrl.endsWith('/shells')) {
            normalizedUrl = normalizedUrl.slice(0, -7);
        } else if (normalizedUrl.endsWith('/submodels')) {
            normalizedUrl = normalizedUrl.slice(0, -10);
        } else if (normalizedUrl.endsWith('/concept-descriptions')) {
            normalizedUrl = normalizedUrl.slice(0, -21);
        }
        return normalizedUrl;
    }
</script>
