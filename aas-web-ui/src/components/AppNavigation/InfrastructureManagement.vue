<template>
    <v-dialog v-model="dialogOpen" max-width="900px" persistent scrollable>
        <v-card>
            <v-card-title>
                <span class="text-h5">Manage Infrastructures</span>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text style="max-height: 600px">
                <!-- Infrastructure List -->
                <v-radio-group v-model="defaultInfrastructure" @update:model-value="changeDefault">
                    <v-table density="compact" class="border rounded">
                        <thead>
                            <tr>
                                <th class="text-left">Default</th>
                                <th class="text-left">Infrastructure Name</th>
                                <th class="text-left">Configuration</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="infra in infrastructures"
                                :key="infra.id"
                                :class="{ 'bg-primary-lighten-5': infra.id === selectedInfrastructureId }">
                                <td style="width: 80px">
                                    <v-radio :value="infra.id"></v-radio>
                                </td>
                                <td>
                                    <div class="d-flex align-center">
                                        {{ infra.name }}
                                        <v-chip v-if="infra.isDefault" size="x-small" color="primary" class="ml-2"
                                            >Default</v-chip
                                        >
                                    </div>
                                </td>
                                <td>
                                    <span class="text-caption text-medium-emphasis">{{
                                        getInfrastructureSummary(infra)
                                    }}</span>
                                </td>
                                <td style="width: 120px">
                                    <div class="d-flex justify-end">
                                        <v-btn
                                            icon="mdi-pencil"
                                            size="x-small"
                                            variant="plain"
                                            @click.stop="editInfrastructure(infra)">
                                        </v-btn>
                                        <v-btn
                                            icon="mdi-delete"
                                            size="x-small"
                                            variant="plain"
                                            class="ml-n2 mr-n2"
                                            :disabled="infrastructures.length === 1"
                                            @click.stop="deleteInfrastructure(infra)">
                                        </v-btn>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-radio-group>
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
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                        <v-expansion-panels class="mt-4">
                            <v-expansion-panel>
                                <v-expansion-panel-title>
                                    <v-icon left size="small">mdi-lock</v-icon>
                                    Security Configuration (applies to all components)
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <!-- Authentication -->
                                    <v-select
                                        v-model="editingInfrastructure.auth!.securityType"
                                        :items="securityTypes"
                                        label="Authentication Type"
                                        variant="outlined"
                                        density="compact"
                                        class="mb-2"></v-select>

                                    <!-- Basic Auth -->
                                    <template
                                        v-if="editingInfrastructure.auth!.securityType === 'Basic Authentication'">
                                        <v-text-field
                                            v-model="basicAuthUsername"
                                            label="Username"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="basicAuthPassword"
                                            label="Password"
                                            type="password"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                    </template>

                                    <!-- Bearer Token -->
                                    <template v-if="editingInfrastructure.auth!.securityType === 'Bearer Token'">
                                        <v-textarea
                                            v-model="bearerToken"
                                            label="Bearer Token"
                                            variant="outlined"
                                            density="compact"
                                            rows="3"
                                            class="mb-2"></v-textarea>
                                    </template>

                                    <!-- Keycloak -->
                                    <template v-if="editingInfrastructure.auth!.securityType === 'Keycloak'">
                                        <v-text-field
                                            v-model="keycloakServerUrl"
                                            label="Keycloak Server URL"
                                            variant="outlined"
                                            density="compact"
                                            placeholder="https://keycloak.example.com"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="keycloakRealm"
                                            label="Realm"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-text-field
                                            v-model="keycloakClientId"
                                            label="Client ID"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <v-select
                                            v-model="keycloakAuthFlow"
                                            :items="keycloakAuthFlowOptions"
                                            item-title="text"
                                            item-value="value"
                                            label="Auth Flow"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-select>
                                        <v-text-field
                                            v-if="
                                                keycloakAuthFlow === 'client-credentials' ||
                                                keycloakAuthFlow === 'password'
                                            "
                                            v-model="keycloakClientSecret"
                                            label="Client Secret"
                                            type="password"
                                            variant="outlined"
                                            density="compact"
                                            class="mb-2"></v-text-field>
                                        <template v-if="keycloakAuthFlow === 'password'">
                                            <v-text-field
                                                v-model="keycloakUsername"
                                                label="Username"
                                                variant="outlined"
                                                density="compact"
                                                class="mb-2"></v-text-field>
                                            <v-text-field
                                                v-model="keycloakPassword"
                                                label="Password"
                                                type="password"
                                                variant="outlined"
                                                density="compact"
                                                class="mb-2"></v-text-field>
                                        </template>
                                        <v-row v-if="keycloakAuthFlow" class="mb-2">
                                            <v-col>
                                                <v-btn
                                                    v-if="!keycloakToken"
                                                    block
                                                    variant="tonal"
                                                    color="primary"
                                                    :loading="keycloakLoading"
                                                    @click="authenticateKeycloakHandler()">
                                                    Authenticate
                                                </v-btn>
                                                <v-btn
                                                    v-else
                                                    block
                                                    variant="tonal"
                                                    color="success"
                                                    prepend-icon="mdi-check-circle"
                                                    @click="authenticateKeycloakHandler()">
                                                    Authenticated
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                        <v-alert
                                            v-if="keycloakError"
                                            type="error"
                                            density="compact"
                                            closable
                                            class="mb-2"
                                            @click:close="keycloakError = ''">
                                            {{ keycloakError }}
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
    import { computed, onMounted, ref, watch } from 'vue';
    import { authenticateKeycloak } from '@/composables/KeycloakAuth';
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
        const auth = editingInfrastructure.value.auth;
        return auth && auth.securityType !== 'No Authentication';
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
    const defaultInfrastructure = ref<string>('');

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
    const basicAuthUsername = ref<string>('');
    const basicAuthPassword = ref<string>('');
    const bearerToken = ref<string>('');
    const keycloakServerUrl = ref<string>('');
    const keycloakRealm = ref<string>('');
    const keycloakClientId = ref<string>('');
    const keycloakAuthFlow = ref<KeycloakConnectionData['authFlow']>('auth-code');
    const keycloakClientSecret = ref<string>('');
    const keycloakUsername = ref<string>('');
    const keycloakPassword = ref<string>('');
    const keycloakToken = ref<{
        accessToken: string;
        refreshToken?: string;
        expiresAt?: number;
        idToken?: string;
    } | null>(null);
    const keycloakLoading = ref<boolean>(false);
    const keycloakError = ref<string>('');
    const reauthenticating = ref(false);

    // Watch props
    watch(
        () => props.open,
        (val) => {
            dialogOpen.value = val;
            // If opening and edit mode is requested, automatically open edit for current infrastructure
            if (val && navigationStore.getOpenInfrastructureEditMode) {
                const currentInfra = navigationStore.getSelectedInfrastructure;
                if (currentInfra) {
                    editInfrastructure(currentInfra);
                }
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
        defaultInfrastructure.value = infrastructures.value.find((infra) => infra.isDefault)?.id || '';
    });

    function changeDefault(newDefaultId: string | null): void {
        if (newDefaultId === null) return;
        navigationStore.dispatchSetDefaultInfrastructure(newDefaultId);
    }

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
        const auth = infra.auth;
        const token = infra.token;

        if (!auth) return;

        // Reset all auth fields first
        basicAuthUsername.value = '';
        basicAuthPassword.value = '';
        bearerToken.value = '';
        keycloakServerUrl.value = '';
        keycloakRealm.value = '';
        keycloakClientId.value = '';
        keycloakAuthFlow.value = 'auth-code';
        keycloakClientSecret.value = '';
        keycloakUsername.value = '';
        keycloakPassword.value = '';
        keycloakToken.value = null;

        // Load based on security type
        if (auth.basicAuth) {
            basicAuthUsername.value = auth.basicAuth.username || '';
            basicAuthPassword.value = auth.basicAuth.password || '';
        }
        if (auth.bearerToken) {
            bearerToken.value = auth.bearerToken.token || '';
        }
        if (auth.keycloakConfig) {
            keycloakServerUrl.value = auth.keycloakConfig.serverUrl || '';
            keycloakRealm.value = auth.keycloakConfig.realm || '';
            keycloakClientId.value = auth.keycloakConfig.clientId || '';
            keycloakAuthFlow.value = auth.keycloakConfig.authFlow || 'auth-code';
            keycloakClientSecret.value = auth.keycloakConfig.clientSecret || '';
            keycloakUsername.value = auth.keycloakConfig.username || '';
            keycloakPassword.value = auth.keycloakConfig.password || '';

            // Load existing token if available
            if (token) {
                keycloakToken.value = {
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken,
                    expiresAt: token.expiresAt,
                    idToken: token.idToken,
                };
            }
        }
    }

    async function saveAuthDataToInfrastructure(infra: InfrastructureConfig): Promise<void> {
        // Save auth data from refs back to infrastructure object
        const auth = infra.auth;
        if (!auth) return;

        if (auth.securityType === 'Basic Authentication') {
            auth.basicAuth = {
                username: basicAuthUsername.value || '',
                password: basicAuthPassword.value || '',
            };
        } else if (auth.securityType === 'Bearer Token') {
            auth.bearerToken = {
                token: bearerToken.value || '',
            };
        } else if (auth.securityType === 'Keycloak') {
            auth.keycloakConfig = {
                serverUrl: keycloakServerUrl.value || '',
                realm: keycloakRealm.value || '',
                clientId: keycloakClientId.value || '',
                authFlow: keycloakAuthFlow.value || 'auth-code',
                clientSecret: keycloakClientSecret.value,
                username: keycloakUsername.value,
                password: keycloakPassword.value,
            };

            // Save token data if authenticated
            if (keycloakToken.value) {
                infra.token = {
                    accessToken: keycloakToken.value.accessToken,
                    refreshToken: keycloakToken.value.refreshToken,
                    expiresAt: keycloakToken.value.expiresAt,
                };
            }
        }
    }

    async function saveInfrastructure(): Promise<void> {
        if (!formRef.value) return;
        const { valid } = await formRef.value.validate();
        if (!valid) return;

        // Save auth data
        await saveAuthDataToInfrastructure(editingInfrastructure.value);

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
                    navigationStore.dispatchUpdateInfrastructure(editingInfrastructure.value);
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
        keycloakLoading.value = true;
        keycloakError.value = '';

        const config: KeycloakConnectionData = {
            serverUrl: keycloakServerUrl.value,
            realm: keycloakRealm.value,
            clientId: keycloakClientId.value,
            authFlow: keycloakAuthFlow.value,
            clientSecret: keycloakClientSecret.value,
            username: keycloakUsername.value,
            password: keycloakPassword.value,
        };

        if (!config.serverUrl || !config.realm || !config.clientId || !config.authFlow) {
            keycloakError.value = 'Please fill in all required Keycloak fields';
            keycloakLoading.value = false;
            return;
        }

        try {
            const result = await authenticateKeycloak(config);
            keycloakToken.value = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresAt,
                idToken: result.idToken,
            };
            navigationStore.dispatchTriggerAASListReload();
            navigationStore.dispatchTriggerTreeviewReload();
        } catch (error: unknown) {
            keycloakError.value = error instanceof Error ? error.message : 'Authentication failed';
        } finally {
            keycloakLoading.value = false;
        }
    }

    function requiredRule(value: string): string | boolean {
        return !!value || 'This field is required';
    }
</script>
