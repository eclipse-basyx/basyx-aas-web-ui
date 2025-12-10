<template>
    <v-dialog v-model="dialogOpen" max-width="900px" persistent scrollable>
        <v-card>
            <v-card-title>Manage Infrastructures</v-card-title>
            <v-divider></v-divider>
            <v-card-text style="max-height: 600px">
                <InfrastructureListTable
                    v-model:default-infrastructure-id="defaultInfrastructure"
                    :infrastructures="infrastructures"
                    :selected-infrastructure-id="selectedInfrastructureId"
                    @edit="editInfrastructure"
                    @delete="deleteInfrastructure"
                    @add="addNewInfrastructure" />
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

                        <!-- Component Configurations -->
                        <ComponentConfigPanel
                            v-model:expanded-panels="expandedPanels"
                            :components="editingInfrastructure.components"
                            :component-connection-status="componentConnectionStatus"
                            :component-testing-loading="componentTestingLoading"
                            @test-connection="testComponentConnection"
                            @update:component-url="handleComponentUrlUpdate"
                            @update:connection-status="handleConnectionStatusUpdate" />
                        <!-- Security Configuration -->
                        <SecurityConfigPanel
                            :auth="editingInfrastructure.auth!"
                            :security-types="securityTypes"
                            :auth-flow-options="keycloakAuthFlowOptions"
                            :basic-auth-username="basicAuthUsername"
                            :basic-auth-password="basicAuthPassword"
                            :bearer-token="bearerToken"
                            :o-auth2-auth-flow="oAuth2AuthFlow"
                            :oauth2-data="oauth2Data"
                            :oauth2-token="oauth2Token"
                            :oauth2-loading="oauth2Loading"
                            :keycloak-server-url="keycloakServerUrl"
                            :keycloak-realm="keycloakRealm"
                            :keycloak-client-id="keycloakClientId"
                            :keycloak-auth-flow="keycloakAuthFlow"
                            :keycloak-client-secret="keycloakClientSecret"
                            :keycloak-username="keycloakUsername"
                            :keycloak-password="keycloakPassword"
                            :keycloak-token="keycloakToken"
                            :keycloak-loading="keycloakLoading"
                            :keycloak-error="keycloakError"
                            @update:security-type="editingInfrastructure.auth!.securityType = $event as SecurityType"
                            @update:basic-auth-username="basicAuthUsername = $event"
                            @update:basic-auth-password="basicAuthPassword = $event"
                            @update:bearer-token="bearerToken = $event"
                            @update:o-auth2-auth-flow="
                                oAuth2AuthFlow = $event as 'auth-code' | 'client-credentials' | 'password'
                            "
                            @update:oauth2-host="oauth2Data.host = $event"
                            @update:oauth2-client-id="oauth2Data.clientId = $event"
                            @update:oauth2-client-secret="oauth2Data.clientSecret = $event"
                            @update:oauth2-username="oauth2Data.username = $event"
                            @update:oauth2-password="oauth2Data.password = $event"
                            @update:oauth2-scope="oauth2Data.scope = $event"
                            @update:keycloak-server-url="keycloakServerUrl = $event"
                            @update:keycloak-realm="keycloakRealm = $event"
                            @update:keycloak-client-id="keycloakClientId = $event"
                            @update:keycloak-auth-flow="
                                keycloakAuthFlow = $event as 'auth-code' | 'client-credentials' | 'password'
                            "
                            @update:keycloak-client-secret="keycloakClientSecret = $event"
                            @update:keycloak-username="keycloakUsername = $event"
                            @update:keycloak-password="keycloakPassword = $event"
                            @authenticate-oauth2="authenticateOAuth2"
                            @authenticate-keycloak="authenticateKeycloakHandler"
                            @clear-keycloak-error="keycloakError = ''" />
                    </v-form>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn
                        color="info"
                        class="mr-2"
                        prepend-icon="mdi-refresh"
                        text="Re-authenticate"
                        :loading="reauthenticating"
                        :disabled="!hasAuthenticatedComponents"
                        @click="reauthenticateAll" />
                    <v-btn
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-connection"
                        text="Test all connections"
                        :loading="testingAllConnections"
                        @click="testAllConnections" />
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
    import type { AuthFlowOption, InfrastructureConfig, SecurityType } from '@/types/Infrastructure';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useBasicAuthForm } from '@/composables/useBasicAuthForm';
    import { useComponentConnectionTesting } from '@/composables/useComponentConnectionTesting';
    import { useKeycloakForm } from '@/composables/useKeycloakForm';
    import { useOAuth2Form } from '@/composables/useOAuth2Form';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { requiredRule } from '@/utils/InfrastructureUtils';
    import ComponentConfigPanel from './ComponentConfigPanel.vue';
    import InfrastructureListTable from './InfrastructureListTable.vue';
    import SecurityConfigPanel from './SecurityConfigPanel.vue';

    // Props
    const props = defineProps<{
        open: boolean;
    }>();

    // Emit
    const emit = defineEmits<{
        'update:open': [value: boolean];
    }>();

    // Stores
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    // Computed Properties
    const infrastructures = computed(() => infrastructureStore.getInfrastructures);
    const selectedInfrastructureId = computed(() => infrastructureStore.getSelectedInfrastructureId);
    const hasAuthenticatedComponents = computed(() => {
        const auth = editingInfrastructure.value.auth;
        return auth && auth.securityType !== 'No Authentication';
    });

    // Local State
    const dialogOpen = ref(false);
    const editDialogOpen = ref(false);
    const deleteDialogOpen = ref(false);
    const editMode = ref<'add' | 'edit'>('edit');
    const editingInfrastructure = ref<InfrastructureConfig>(infrastructureStore.createEmptyInfrastructure());
    const infrastructureToDelete = ref<InfrastructureConfig | null>(null);
    const expandedPanels = ref<number[]>([]);
    const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
    const defaultInfrastructure = ref<string>('');

    const securityTypes: SecurityType[] = [
        'No Authentication',
        'Basic Authentication',
        'Bearer Token',
        'Keycloak',
        'OAuth2',
    ];
    const keycloakAuthFlowOptions: AuthFlowOption[] = [
        { text: 'User Login (Authorization Code Flow)', value: 'auth-code' },
        { text: 'Service Account (Client Credentials)', value: 'client-credentials' },
        { text: 'Direct Grant (Username/Password)', value: 'password' },
    ];

    // Initialize composables for auth forms
    const basicAuthForm = useBasicAuthForm();
    const keycloakForm = useKeycloakForm();
    const oauth2Form = useOAuth2Form();
    const connectionTesting = useComponentConnectionTesting();

    // Expose for template usage (using direct references to maintain reactivity)
    const basicAuthUsername = basicAuthForm.basicAuthUsername;
    const basicAuthPassword = basicAuthForm.basicAuthPassword;
    const bearerToken = basicAuthForm.bearerToken;

    const keycloakServerUrl = keycloakForm.serverUrl;
    const keycloakRealm = keycloakForm.realm;
    const keycloakClientId = keycloakForm.clientId;
    const keycloakAuthFlow = keycloakForm.authFlow;
    const keycloakClientSecret = keycloakForm.clientSecret;
    const keycloakUsername = keycloakForm.username;
    const keycloakPassword = keycloakForm.password;
    const keycloakToken = keycloakForm.token;
    const keycloakLoading = keycloakForm.loading;
    const keycloakError = keycloakForm.error;

    const oauth2Data = oauth2Form.formData;
    const oAuth2AuthFlow = oauth2Form.authFlow;
    const oauth2Token = oauth2Form.token;
    const oauth2Loading = oauth2Form.loading;

    const componentConnectionStatus = connectionTesting.componentConnectionStatus;
    const componentTestingLoading = connectionTesting.componentTestingLoading;
    const testingAllConnections = connectionTesting.testingAllConnections;

    const reauthenticating = ref(false);

    // Watch for default infrastructure changes
    watch(defaultInfrastructure, (newDefaultId) => {
        if (newDefaultId) {
            infrastructureStore.dispatchSetDefaultInfrastructure(newDefaultId);
        }
    });

    // Watch props
    watch(
        () => props.open,
        async (val) => {
            dialogOpen.value = val;
            // If opening and edit mode is requested, automatically open edit for current infrastructure
            if (val && infrastructureStore.getOpenInfrastructureEditMode) {
                const currentInfra = infrastructureStore.getSelectedInfrastructure;
                if (currentInfra) {
                    editInfrastructure(currentInfra);
                }
            }
            // Test connections for all infrastructures when dialog opens
            if (val) {
                await testAllInfrastructures();
            }
        }
    );

    watch(dialogOpen, (val) => {
        if (!val) {
            emit('update:open', false);
        }
    });

    // Lifecycle
    onMounted(() => {
        const defaultInfra = infrastructures.value.find((infra) => infra.isDefault);
        if (defaultInfra) {
            defaultInfrastructure.value = defaultInfra.id;
        } else if (infrastructures.value.length > 0) {
            // If no default exists, set the first one as default
            const firstInfra = infrastructures.value[0];
            defaultInfrastructure.value = firstInfra.id;
            infrastructureStore.dispatchSetDefaultInfrastructure(firstInfra.id);
        }
    });

    // Methods
    function close(): void {
        dialogOpen.value = false;
    }

    function addNewInfrastructure(): void {
        editMode.value = 'add';
        editingInfrastructure.value = infrastructureStore.createEmptyInfrastructure();
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
        // Load auth data using composables
        basicAuthForm.loadFromInfrastructure(infra);
        keycloakForm.loadFromInfrastructure(infra);
        oauth2Form.loadFromInfrastructure(infra);

        // Reset component connection status
        connectionTesting.resetConnectionStatus();
    }

    async function saveAuthDataToInfrastructure(infra: InfrastructureConfig): Promise<void> {
        // Save auth data using composables
        basicAuthForm.saveToInfrastructure(infra);
        keycloakForm.saveToInfrastructure(infra);
        oauth2Form.saveToInfrastructure(infra);
    }

    async function saveInfrastructure(): Promise<void> {
        if (!formRef.value) return;
        const { valid } = await formRef.value.validate();
        if (!valid) return;

        // Save auth data
        await saveAuthDataToInfrastructure(editingInfrastructure.value);

        if (editMode.value === 'add') {
            infrastructureStore.dispatchAddInfrastructure(editingInfrastructure.value);
        } else {
            infrastructureStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
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
            infrastructureStore.dispatchDeleteInfrastructure(infrastructureToDelete.value.id);
            infrastructureToDelete.value = null;
        }
        deleteDialogOpen.value = false;
    }

    // Re-authenticate all components
    async function reauthenticateAll(): Promise<void> {
        reauthenticating.value = true;
        const auth = editingInfrastructure.value.auth;

        if (!auth || auth.securityType === 'No Authentication') {
            reauthenticating.value = false;
            return;
        }

        try {
            if (auth.securityType === 'Keycloak') {
                // Clear previous error
                keycloakError.value = '';

                await authenticateKeycloakHandler();

                // Check if authentication was successful by verifying token exists
                if (keycloakToken.value?.accessToken && !keycloakError.value) {
                    // Save the updated token to the infrastructure and persist to localStorage
                    await saveAuthDataToInfrastructure(editingInfrastructure.value);
                    infrastructureStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
                    saveInfrastructure();

                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'success',
                        btnColor: 'buttonText',
                        text: 'Successfully re-authenticated and saved to storage',
                    });
                } else {
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 8000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Re-authentication failed',
                        extendedError: keycloakError.value || 'Authentication failed - no token received',
                    });
                }
            } else {
                // For Basic Auth and Bearer Token, the credentials are already in the form
                // Just validate they exist
                if (auth.securityType === 'Basic Authentication') {
                    if (basicAuthUsername.value && basicAuthPassword.value) {
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'success',
                            btnColor: 'buttonText',
                            text: 'Basic Auth credentials are configured',
                        });
                    } else {
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Basic Auth credentials missing',
                        });
                    }
                } else if (auth.securityType === 'Bearer Token') {
                    if (bearerToken.value) {
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'success',
                            btnColor: 'buttonText',
                            text: 'Bearer Token is configured',
                        });
                    } else {
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Bearer Token missing',
                        });
                    }
                } else if (auth.securityType === 'OAuth2') {
                    // Re-authenticate OAuth2
                    await authenticateOAuth2();

                    // Check if authentication was successful
                    if (oauth2Token.value?.accessToken) {
                        // Save the updated token to the infrastructure and persist to localStorage
                        await saveAuthDataToInfrastructure(editingInfrastructure.value);
                        infrastructureStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
                        await saveInfrastructure();

                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'success',
                            btnColor: 'buttonText',
                            text: 'Successfully re-authenticated OAuth2 and saved to storage',
                        });
                    }
                }
            }
        } catch (error) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 8000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Re-authentication failed',
                extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            reauthenticating.value = false;
        }
    }

    // Keycloak Authentication Methods
    async function authenticateKeycloakHandler(): Promise<void> {
        await keycloakForm.authenticate();

        // Save infrastructure after successful authentication to make token available for requests
        if (keycloakToken.value) {
            await saveAuthDataToInfrastructure(editingInfrastructure.value);
            // Update the store to make token available immediately for API requests
            infrastructureStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
            // Also update the selected infrastructure if we're editing the currently selected one
            if (editingInfrastructure.value.id === selectedInfrastructureId.value) {
                await infrastructureStore.dispatchSelectInfrastructure(editingInfrastructure.value.id, false);
            }
        }
    }

    // Test individual component connection
    async function testComponentConnection(componentKey: BaSyxComponentKey): Promise<void> {
        const url = editingInfrastructure.value.components[componentKey].url;
        await connectionTesting.testComponentConnection(componentKey, url);
    }

    // Test all component connections for the currently edited infrastructure
    async function testAllConnections(): Promise<void> {
        await connectionTesting.testAllConnections(editingInfrastructure.value.components);
    }

    // Test connections for all infrastructures
    async function testAllInfrastructures(): Promise<void> {
        const originalInfrastructureId = selectedInfrastructureId.value;
        for (const infra of infrastructures.value) {
            // Temporarily switch to this infrastructure to test its connections
            await infrastructureStore.dispatchSelectInfrastructure(infra.id);
            // Test connections for this infrastructure
            await infrastructureStore.connectComponents();
        }
        // Switch back to the originally selected infrastructure
        if (originalInfrastructureId) {
            await infrastructureStore.dispatchSelectInfrastructure(originalInfrastructureId);
        }
    }

    async function authenticateOAuth2(): Promise<void> {
        await oauth2Form.authenticate(editingInfrastructure.value.id);

        // Save infrastructure after successful authentication to make token available for requests
        if (oauth2Token.value) {
            await saveAuthDataToInfrastructure(editingInfrastructure.value);
            // Update the store to make token available immediately for API requests
            infrastructureStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
            // Also update the selected infrastructure if we're editing the currently selected one
            if (editingInfrastructure.value.id === selectedInfrastructureId.value) {
                await infrastructureStore.dispatchSelectInfrastructure(editingInfrastructure.value.id, false);
            }
        }
    }

    // Component URL update handler
    function handleComponentUrlUpdate(componentKey: BaSyxComponentKey, url: string): void {
        editingInfrastructure.value.components[componentKey].url = url;
    }

    // Connection status update handler
    function handleConnectionStatusUpdate(componentKey: BaSyxComponentKey, status: boolean | null): void {
        componentConnectionStatus.value[componentKey] = status;
    }
</script>
