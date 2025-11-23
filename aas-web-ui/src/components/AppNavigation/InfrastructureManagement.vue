<template>
    <v-dialog v-model="dialogOpen" max-width="900px" persistent scrollable>
        <v-card>
            <v-card-title>
                <span class="text-h5">Manage Infrastructures</span>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text style="max-height: 600px">
                <!-- Infrastructure List -->
                <v-list>
                    <v-list-item
                        v-for="infra in infrastructures"
                        :key="infra.id"
                        :class="{ 'bg-primary-lighten-5': infra.id === selectedInfrastructureId }"
                        @click="selectForEditing()">
                        <template #prepend>
                            <v-icon icon="mdi-server-network"></v-icon>
                        </template>
                        <v-list-item-title>
                            {{ infra.name }}
                            <v-chip v-if="infra.isDefault" size="x-small" color="primary" class="ml-2">Default</v-chip>
                        </v-list-item-title>
                        <v-list-item-subtitle>{{ getInfrastructureSummary(infra) }}</v-list-item-subtitle>
                        <template #append>
                            <v-btn
                                icon="mdi-pencil"
                                size="small"
                                variant="text"
                                @click.stop="editInfrastructure(infra)">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn
                                icon="mdi-delete"
                                size="small"
                                variant="text"
                                :disabled="infrastructures.length === 1"
                                @click.stop="deleteInfrastructure(infra)">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </template>
                    </v-list-item>
                </v-list>

                <!-- Add Infrastructure Button -->
                <v-btn color="primary" block class="mt-4" @click="addNewInfrastructure">
                    <v-icon left>mdi-plus</v-icon>
                    Add Infrastructure
                </v-btn>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>

        <!-- Edit/Add Infrastructure Dialog -->
        <v-dialog v-model="editDialogOpen" max-width="1200px" persistent scrollable>
            <v-card>
                <v-card-title>
                    <span class="text-h6">{{ editMode === 'add' ? 'Add' : 'Edit' }} Infrastructure</span>
                </v-card-title>
                <v-divider></v-divider>

                <v-card-text style="max-height: 700px">
                    <v-form ref="formRef">
                        <!-- Infrastructure Name -->
                        <v-text-field
                            v-model="editingInfrastructure.name"
                            label="Infrastructure Name"
                            variant="outlined"
                            density="compact"
                            :rules="[requiredRule]"
                            class="mb-2"></v-text-field>

                        <!-- Set as Default -->
                        <v-switch
                            v-model="editingInfrastructure.isDefault"
                            label="Set as Default Infrastructure"
                            color="primary"
                            density="compact"
                            hide-details
                            class="mb-4"></v-switch>

                        <!-- Component Configurations -->
                        <v-expansion-panels v-model="expandedPanels" multiple>
                            <v-expansion-panel
                                v-for="(componentKey, index) in componentKeys"
                                :key="componentKey"
                                :value="index">
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center">
                                        <v-icon
                                            :color="
                                                editingInfrastructure.components[componentKey].url ? 'success' : 'grey'
                                            "
                                            size="small"
                                            class="mr-2">
                                            {{
                                                editingInfrastructure.components[componentKey].url
                                                    ? 'mdi-check-circle'
                                                    : 'mdi-circle-outline'
                                            }}
                                        </v-icon>
                                        <span>{{ getComponentLabel(componentKey) }}</span>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <!-- Component URL -->
                                    <v-text-field
                                        v-model="editingInfrastructure.components[componentKey].url"
                                        label="Endpoint URL"
                                        variant="outlined"
                                        density="compact"
                                        placeholder="https://example.com/api"
                                        class="mb-2"></v-text-field>

                                    <!-- Authentication -->
                                    <v-select
                                        v-model="editingInfrastructure.components[componentKey].auth!.securityType"
                                        :items="securityTypes"
                                        label="Authentication Type"
                                        variant="outlined"
                                        density="compact"
                                        class="mb-2"></v-select>

                                    <!-- Basic Auth -->
                                    <template
                                        v-if="
                                            editingInfrastructure.components[componentKey].auth!.securityType ===
                                            'Basic Authentication'
                                        ">
                                        <v-text-field
                                            v-model="basicAuthUsername[componentKey]"
                                            label="Username"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="basicAuthPassword[componentKey]"
                                            label="Password"
                                            type="password"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                    </template>

                                    <!-- Bearer Token -->
                                    <template
                                        v-if="
                                            editingInfrastructure.components[componentKey].auth!.securityType ===
                                            'Bearer Token'
                                        ">
                                        <v-textarea
                                            v-model="bearerToken[componentKey]"
                                            label="Bearer Token"
                                            variant="outlined"
                                            density="compact"
                                            rows="3"
                                            class="mb-2"></v-textarea>
                                    </template>

                                    <!-- Keycloak -->
                                    <template
                                        v-if="
                                            editingInfrastructure.components[componentKey].auth!.securityType ===
                                            'Keycloak'
                                        ">
                                        <v-text-field
                                            v-model="keycloakServerUrl[componentKey]"
                                            label="Keycloak Server URL"
                                            variant="outlined"
                                            density="compact"
                                            placeholder="https://keycloak.example.com"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="keycloakRealm[componentKey]"
                                            label="Realm"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="keycloakClientId[componentKey]"
                                            label="Client ID"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-select
                                            v-model="keycloakAuthFlow[componentKey]"
                                            :items="keycloakAuthFlowOptions"
                                            item-title="text"
                                            item-value="value"
                                            label="Auth Flow"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-select>
                                        <v-text-field
                                            v-if="
                                                keycloakAuthFlow[componentKey] === 'client-credentials' ||
                                                keycloakAuthFlow[componentKey] === 'password'
                                            "
                                            v-model="keycloakClientSecret[componentKey]"
                                            label="Client Secret"
                                            type="password"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <template v-if="keycloakAuthFlow[componentKey] === 'password'">
                                            <v-text-field
                                                v-model="keycloakUsername[componentKey]"
                                                label="Username"
                                                variant="outlined"
                                                density="compact"
                                                class="mb-2"></v-text-field>
                                            <v-text-field
                                                v-model="keycloakPassword[componentKey]"
                                                label="Password"
                                                type="password"
                                                variant="outlined"
                                                density="compact"
                                                class="mb-2"></v-text-field>
                                        </template>
                                        <v-row v-if="keycloakAuthFlow[componentKey]" class="mb-2">
                                            <v-col>
                                                <v-btn
                                                    v-if="!keycloakTokens[componentKey]"
                                                    block
                                                    variant="tonal"
                                                    color="primary"
                                                    :loading="keycloakLoading[componentKey]"
                                                    @click="authenticateKeycloak(componentKey)">
                                                    Authenticate
                                                </v-btn>
                                                <v-btn
                                                    v-else
                                                    block
                                                    variant="tonal"
                                                    color="success"
                                                    @click="authenticateKeycloak(componentKey)"
                                                    prepend-icon="mdi-check-circle">
                                                    Authenticated
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                        <v-alert
                                            v-if="keycloakErrors[componentKey]"
                                            type="error"
                                            density="compact"
                                            closable
                                            class="mb-2"
                                            @click:close="keycloakErrors[componentKey] = ''">
                                            {{ keycloakErrors[componentKey] }}
                                        </v-alert>
                                    </template>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-form>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn
                        color="info"
                        :loading="reauthenticating"
                        :disabled="!hasAuthenticatedComponents"
                        @click="reauthenticateAll">
                        <v-icon left>mdi-refresh</v-icon>
                        Re-authenticate All
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn @click="cancelEdit">Cancel</v-btn>
                    <v-btn color="primary" @click="saveInfrastructure">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialogOpen" max-width="400px">
            <v-card>
                <v-card-title>Confirm Delete</v-card-title>
                <v-card-text>
                    Are you sure you want to delete the infrastructure "{{ infrastructureToDelete?.name }}"?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="deleteDialogOpen = false">Cancel</v-btn>
                    <v-btn color="error" @click="confirmDelete">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script lang="ts" setup>
    import type { BaSyxComponentKey } from '@/types/BaSyx';
    import type { InfrastructureConfig, KeycloakConnectionData, SecurityType } from '@/types/Infrastructure';
    import { computed, ref, watch } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Props
    const props = defineProps<{
        open: boolean;
    }>();

    // Emit
    const emit = defineEmits<{
        'update:open': [value: boolean];
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Computed Properties
    const infrastructures = computed(() => navigationStore.getInfrastructures);
    const selectedInfrastructureId = computed(() => navigationStore.getSelectedInfrastructureId);
    const hasAuthenticatedComponents = computed(() => {
        return componentKeys.some((key) => {
            const auth = editingInfrastructure.value.components[key].auth;
            return auth && auth.securityType !== 'No Authentication';
        });
    });

    // Local State
    const dialogOpen = ref(false);
    const editDialogOpen = ref(false);
    const deleteDialogOpen = ref(false);
    const editMode = ref<'add' | 'edit'>('edit');
    const editingInfrastructure = ref<InfrastructureConfig>(navigationStore.createEmptyInfrastructure());
    const infrastructureToDelete = ref<InfrastructureConfig | null>(null);
    const expandedPanels = ref<number[]>([]);
    const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

    // Component configuration
    const componentKeys: BaSyxComponentKey[] = [
        'AASDiscovery',
        'AASRegistry',
        'SubmodelRegistry',
        'AASRepo',
        'SubmodelRepo',
        'ConceptDescriptionRepo',
    ];

    const securityTypes: SecurityType[] = ['No Authentication', 'Basic Authentication', 'Bearer Token', 'Keycloak'];
    const keycloakAuthFlowOptions = [
        { text: 'User Login (Authorization Code Flow)', value: 'auth-code' },
        { text: 'Service Account (Client Credentials)', value: 'client-credentials' },
        { text: 'Direct Grant (Username/Password)', value: 'password' },
    ];

    // Auth data helpers (to simplify form binding)
    const basicAuthUsername = ref<Record<string, string>>({});
    const basicAuthPassword = ref<Record<string, string>>({});
    const bearerToken = ref<Record<string, string>>({});
    const keycloakServerUrl = ref<Record<string, string>>({});
    const keycloakRealm = ref<Record<string, string>>({});
    const keycloakClientId = ref<Record<string, string>>({});
    const keycloakAuthFlow = ref<Record<string, KeycloakConnectionData['authFlow']>>({});
    const keycloakClientSecret = ref<Record<string, string>>({});
    const keycloakUsername = ref<Record<string, string>>({});
    const keycloakPassword = ref<Record<string, string>>({});
    const keycloakTokens = ref<Record<string, { accessToken: string; refreshToken?: string; expiresAt?: number }>>({});
    const keycloakLoading = ref<Record<string, boolean>>({});
    const keycloakErrors = ref<Record<string, string>>({});
    const reauthenticating = ref(false);
    let keycloakPopup: Window | null = null;

    // Watch props
    watch(
        () => props.open,
        (val) => {
            dialogOpen.value = val;
        }
    );

    watch(dialogOpen, (val) => {
        if (!val) {
            emit('update:open', false);
        }
    });

    // Methods
    function close(): void {
        dialogOpen.value = false;
    }

    function getComponentLabel(key: BaSyxComponentKey): string {
        const labels: Record<BaSyxComponentKey, string> = {
            AASDiscovery: 'AAS Discovery',
            AASRegistry: 'AAS Registry',
            SubmodelRegistry: 'Submodel Registry',
            AASRepo: 'AAS Repository',
            SubmodelRepo: 'Submodel Repository',
            ConceptDescriptionRepo: 'Concept Description Repository',
        };
        return labels[key];
    }

    function getInfrastructureSummary(infra: InfrastructureConfig): string {
        const configuredCount = Object.values(infra.components).filter((comp) => comp.url.trim() !== '').length;
        return `${configuredCount} of ${componentKeys.length} components configured`;
    }

    function selectForEditing(): void {
        // Optional: could auto-select in main list
    }

    function addNewInfrastructure(): void {
        editMode.value = 'add';
        editingInfrastructure.value = navigationStore.createEmptyInfrastructure();
        loadAuthDataFromInfrastructure(editingInfrastructure.value);
        expandedPanels.value = [];
        editDialogOpen.value = true;
    }

    function editInfrastructure(infra: InfrastructureConfig): void {
        editMode.value = 'edit';
        editingInfrastructure.value = JSON.parse(JSON.stringify(infra)); // Deep clone
        loadAuthDataFromInfrastructure(editingInfrastructure.value);
        expandedPanels.value = [];
        editDialogOpen.value = true;
    }

    function loadAuthDataFromInfrastructure(infra: InfrastructureConfig): void {
        // Load auth data into separate refs for easier form binding
        componentKeys.forEach((key) => {
            const auth = infra.components[key].auth;
            const token = infra.components[key].token;
            if (!auth) return;

            if (auth.basicAuth) {
                basicAuthUsername.value[key] = auth.basicAuth.username || '';
                basicAuthPassword.value[key] = auth.basicAuth.password || '';
            }
            if (auth.bearerToken) {
                bearerToken.value[key] = auth.bearerToken.token || '';
            }
            if (auth.keycloakConfig) {
                keycloakServerUrl.value[key] = auth.keycloakConfig.serverUrl || '';
                keycloakRealm.value[key] = auth.keycloakConfig.realm || '';
                keycloakClientId.value[key] = auth.keycloakConfig.clientId || '';
                keycloakAuthFlow.value[key] = auth.keycloakConfig.authFlow || 'auth-code';
                keycloakClientSecret.value[key] = auth.keycloakConfig.clientSecret || '';
                keycloakUsername.value[key] = auth.keycloakConfig.username || '';
                keycloakPassword.value[key] = auth.keycloakConfig.password || '';

                // Load existing token if available
                if (token) {
                    keycloakTokens.value[key] = {
                        accessToken: token.accessToken,
                        refreshToken: token.refreshToken,
                        expiresAt: token.expiresAt,
                    };
                }
            }
        });
    }

    function saveAuthDataToInfrastructure(infra: InfrastructureConfig): void {
        // Save auth data from refs back to infrastructure object
        componentKeys.forEach((key) => {
            const auth = infra.components[key].auth;
            if (!auth) return;

            if (auth.securityType === 'Basic Authentication') {
                auth.basicAuth = {
                    username: basicAuthUsername.value[key] || '',
                    password: basicAuthPassword.value[key] || '',
                };
            } else if (auth.securityType === 'Bearer Token') {
                auth.bearerToken = {
                    token: bearerToken.value[key] || '',
                };
            } else if (auth.securityType === 'Keycloak') {
                auth.keycloakConfig = {
                    serverUrl: keycloakServerUrl.value[key] || '',
                    realm: keycloakRealm.value[key] || '',
                    clientId: keycloakClientId.value[key] || '',
                    authFlow: keycloakAuthFlow.value[key] || 'auth-code',
                    clientSecret: keycloakClientSecret.value[key],
                    username: keycloakUsername.value[key],
                    password: keycloakPassword.value[key],
                };

                // Save token data if authenticated
                if (keycloakTokens.value[key]) {
                    infra.components[key].token = {
                        accessToken: keycloakTokens.value[key].accessToken,
                        refreshToken: keycloakTokens.value[key].refreshToken,
                        expiresAt: keycloakTokens.value[key].expiresAt,
                    };
                }
            }
        });
    }

    async function saveInfrastructure(): Promise<void> {
        if (!formRef.value) return;
        const { valid } = await formRef.value.validate();
        if (!valid) return;

        // Save auth data
        saveAuthDataToInfrastructure(editingInfrastructure.value);

        if (editMode.value === 'add') {
            navigationStore.dispatchAddInfrastructure(editingInfrastructure.value);
        } else {
            navigationStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
        }

        editDialogOpen.value = false;
    }

    function cancelEdit(): void {
        editDialogOpen.value = false;
    }

    function deleteInfrastructure(infra: InfrastructureConfig): void {
        infrastructureToDelete.value = infra;
        deleteDialogOpen.value = true;
    }

    function confirmDelete(): void {
        if (infrastructureToDelete.value) {
            navigationStore.dispatchDeleteInfrastructure(infrastructureToDelete.value.id);
            infrastructureToDelete.value = null;
        }
        deleteDialogOpen.value = false;
    }

    // Re-authenticate all components
    async function reauthenticateAll(): Promise<void> {
        reauthenticating.value = true;
        const errors: string[] = [];
        let successCount = 0;

        for (const componentKey of componentKeys) {
            const component = editingInfrastructure.value.components[componentKey];
            const auth = component.auth;

            if (!auth || auth.securityType === 'No Authentication') {
                continue;
            }

            try {
                if (auth.securityType === 'Keycloak') {
                    // Clear previous error for this component
                    keycloakErrors.value[componentKey] = '';
                    
                    await authenticateKeycloak(componentKey);
                    
                    // Check if authentication was successful by verifying token exists
                    if (keycloakTokens.value[componentKey]?.accessToken && !keycloakErrors.value[componentKey]) {
                        successCount++;
                    } else {
                        errors.push(
                            `${componentKey}: ${keycloakErrors.value[componentKey] || 'Authentication failed - no token received'}`
                        );
                    }
                } else {
                    // For Basic Auth and Bearer Token, the credentials are already in the form
                    // Just validate they exist
                    if (auth.securityType === 'Basic Authentication') {
                        if (basicAuthUsername.value[componentKey] && basicAuthPassword.value[componentKey]) {
                            successCount++;
                        } else {
                            errors.push(`${componentKey}: Basic Auth credentials missing`);
                        }
                    } else if (auth.securityType === 'Bearer Token') {
                        if (bearerToken.value[componentKey]) {
                            successCount++;
                        } else {
                            errors.push(`${componentKey}: Bearer Token missing`);
                        }
                    }
                }
            } catch (error) {
                errors.push(`${componentKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        // Save the updated tokens to the infrastructure and persist to localStorage
        if (successCount > 0) {
            saveAuthDataToInfrastructure(editingInfrastructure.value);
            navigationStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
        }

        reauthenticating.value = false;

        // Show feedback
        if (errors.length === 0) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'success',
                btnColor: 'buttonText',
                text: `Successfully re-authenticated ${successCount} component(s) and saved to storage`,
            });
        } else {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'warning',
                btnColor: 'buttonText',
                text: `Re-authenticated ${successCount} component(s), ${errors.length} failed`,
                extendedError: errors.join('\n'),
            });
        }
    }

    // Keycloak Authentication Methods
    async function authenticateKeycloak(componentKey: BaSyxComponentKey): Promise<void> {
        keycloakLoading.value[componentKey] = true;
        keycloakErrors.value[componentKey] = '';

        const serverUrl = keycloakServerUrl.value[componentKey];
        const realm = keycloakRealm.value[componentKey];
        const clientId = keycloakClientId.value[componentKey];
        const authFlow = keycloakAuthFlow.value[componentKey];

        if (!serverUrl || !realm || !clientId || !authFlow) {
            keycloakErrors.value[componentKey] = 'Please fill in all required Keycloak fields';
            keycloakLoading.value[componentKey] = false;
            return;
        }

        try {
            if (authFlow === 'client-credentials') {
                await authenticateWithClientCredentials(componentKey);
            } else if (authFlow === 'password') {
                await authenticateWithPassword(componentKey);
            } else {
                await authenticateWithAuthCode(componentKey);
            }
        } catch (error: unknown) {
            keycloakErrors.value[componentKey] = error instanceof Error ? error.message : 'Authentication failed';
        } finally {
            keycloakLoading.value[componentKey] = false;
        }
    }

    async function authenticateWithClientCredentials(componentKey: BaSyxComponentKey): Promise<void> {
        const serverUrl = keycloakServerUrl.value[componentKey];
        const realm = keycloakRealm.value[componentKey];
        const clientId = keycloakClientId.value[componentKey];
        const clientSecret = keycloakClientSecret.value[componentKey];

        if (!clientSecret) {
            throw new Error('Client Secret is required for client credentials flow');
        }

        const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
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

        const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
        keycloakTokens.value[componentKey] = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
        };
    }

    async function authenticateWithPassword(componentKey: BaSyxComponentKey): Promise<void> {
        const serverUrl = keycloakServerUrl.value[componentKey];
        const realm = keycloakRealm.value[componentKey];
        const clientId = keycloakClientId.value[componentKey];
        const clientSecret = keycloakClientSecret.value[componentKey];
        const username = keycloakUsername.value[componentKey];
        const password = keycloakPassword.value[componentKey];

        if (!username || !password) {
            throw new Error('Username and Password are required for password flow');
        }

        const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            client_id: clientId,
            username: username,
            password: password,
            grant_type: 'password',
        });

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

        const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
        keycloakTokens.value[componentKey] = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
        };
    }

    async function authenticateWithAuthCode(componentKey: BaSyxComponentKey): Promise<void> {
        const serverUrl = keycloakServerUrl.value[componentKey];
        const realm = keycloakRealm.value[componentKey];
        const clientId = keycloakClientId.value[componentKey];

        // Generate PKCE code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Store code verifier for later exchange
        sessionStorage.setItem(`pkce_code_verifier_${componentKey}`, codeVerifier);

        // Build authorization URL
        const redirectUri = `${window.location.origin}/keycloak-callback.html`;
        const state = generateRandomString(32);
        sessionStorage.setItem(`pkce_state_${componentKey}`, state);

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

        keycloakPopup = window.open(
            authUrl.toString(),
            'keycloak-login',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
        );

        if (!keycloakPopup) {
            throw new Error('Failed to open login popup. Please allow popups for this site.');
        }

        // Listen for messages from popup
        const messageHandler = (event: MessageEvent): void => {
            if (event.origin !== window.location.origin) return;

            if (event.data && event.data.type === 'keycloak-auth-code') {
                const { code, state: returnedState } = event.data;
                const storedState = sessionStorage.getItem(`pkce_state_${componentKey}`);

                if (returnedState !== storedState) {
                    keycloakErrors.value[componentKey] = 'Invalid state parameter';
                    if (keycloakPopup && !keycloakPopup.closed) {
                        keycloakPopup.close();
                    }
                    window.removeEventListener('message', messageHandler);
                    keycloakLoading.value[componentKey] = false;
                    return;
                }

                exchangeCodeForToken(componentKey, code);
                if (keycloakPopup && !keycloakPopup.closed) {
                    keycloakPopup.close();
                }
                window.removeEventListener('message', messageHandler);
            } else if (event.data && event.data.type === 'keycloak-auth-error') {
                keycloakErrors.value[componentKey] =
                    event.data.errorDescription || event.data.error || 'Authentication failed';
                if (keycloakPopup && !keycloakPopup.closed) {
                    keycloakPopup.close();
                }
                window.removeEventListener('message', messageHandler);
                keycloakLoading.value[componentKey] = false;
            }
        };

        window.addEventListener('message', messageHandler);

        // Monitor if popup is closed manually
        const popupCheckInterval = setInterval(() => {
            if (keycloakPopup && keycloakPopup.closed) {
                clearInterval(popupCheckInterval);
                window.removeEventListener('message', messageHandler);
                if (!keycloakTokens.value[componentKey] && !keycloakErrors.value[componentKey]) {
                    keycloakErrors.value[componentKey] = 'Login popup was closed';
                    keycloakLoading.value[componentKey] = false;
                }
            }
        }, 500);
    }

    async function exchangeCodeForToken(componentKey: BaSyxComponentKey, code: string): Promise<void> {
        const serverUrl = keycloakServerUrl.value[componentKey];
        const realm = keycloakRealm.value[componentKey];
        const clientId = keycloakClientId.value[componentKey];
        const codeVerifier = sessionStorage.getItem(`pkce_code_verifier_${componentKey}`);
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

            const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
            keycloakTokens.value[componentKey] = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt,
            };

            // Clean up session storage
            sessionStorage.removeItem(`pkce_code_verifier_${componentKey}`);
            sessionStorage.removeItem(`pkce_state_${componentKey}`);
        } catch (error: unknown) {
            keycloakErrors.value[componentKey] = error instanceof Error ? error.message : 'Token exchange failed';
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

    function requiredRule(value: string): string | boolean {
        return !!value || 'This field is required';
    }
</script>
