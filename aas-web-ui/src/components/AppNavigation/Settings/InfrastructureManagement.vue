<template>
    <v-dialog v-model="dialogOpen" max-width="900px" persistent scrollable>
        <v-sheet rounded="lg" border>
            <v-card-title class="bg-cardHeader">Manage Infrastructures</v-card-title>
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
                <v-btn
                    text="Reset to defaults"
                    prepend-icon="mdi-arrow-u-left-top"
                    border
                    variant="flat"
                    rounded="lg"
                    color="surface-light"
                    @click="resetDialogOpen = true" />
                <v-spacer></v-spacer>
                <v-btn text="close" rounded="lg" @click="close" />
            </v-card-actions>
        </v-sheet>

        <!-- Edit/Add Infrastructure Dialog -->
        <v-dialog v-model="editDialogOpen" max-width="1200px" persistent>
            <v-sheet rounded="lg" border>
                <v-card-title class="bg-cardHeader"
                    >{{ editMode === 'add' ? 'Add' : 'Edit' }} Infrastructure</v-card-title
                >
                <v-divider></v-divider>

                <v-card-text style="max-height: calc(100vh - 200px); overflow-y: auto" class="pt-1">
                    <v-form ref="formRef">
                        <!-- Infrastructure Name -->
                        <v-list-subheader class="mb-1">Infrastructure Name</v-list-subheader>
                        <v-text-field
                            v-model="editingInfrastructure.name"
                            bg-color="surface-light"
                            variant="outlined"
                            density="compact"
                            label="Infrastructure Name"
                            flat
                            single-line
                            :rules="[requiredRule]"
                            class="mb-2"></v-text-field>
                        <v-divider></v-divider>
                        <v-list-subheader class="mb-3">Component Endpoints</v-list-subheader>
                        <!-- Component Configurations -->
                        <ComponentConfigPanel
                            :components="editingInfrastructure.components"
                            :component-connection-status="componentConnectionStatus"
                            :component-testing-loading="componentTestingLoading"
                            @test-connection="testComponentConnection"
                            @update:component-url="handleComponentUrlUpdate"
                            @update:connection-status="handleConnectionStatusUpdate" />
                        <!-- Security Configuration -->
                        <v-divider></v-divider>
                        <v-list-subheader class="mb-3">Security Configuration</v-list-subheader>
                        <SecurityConfigPanel
                            :auth="editingInfrastructure.auth!"
                            :security-types="securityTypes"
                            :auth-flow-options="authFlowOptions"
                            :basic-auth-username="basicAuthUsername"
                            :basic-auth-password="basicAuthPassword"
                            :bearer-token="bearerToken"
                            :o-auth2-auth-flow="oAuth2AuthFlow"
                            :oauth2-data="oauth2Data"
                            :oauth2-token="oauth2Token"
                            :oauth2-loading="oauth2Loading"
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
                            @authenticate-oauth2="authenticateOAuth2" />
                    </v-form>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn
                        variant="flat"
                        color="surface-light"
                        border
                        rounded="lg"
                        prepend-icon="mdi-connection"
                        text="Test all connections"
                        :loading="testingAllConnections"
                        @click="testAllConnections" />
                    <v-spacer></v-spacer>
                    <v-btn text="Cancel" rounded="lg" @click="cancelEdit" />
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        class="text-buttonText"
                        text="Save"
                        @click="saveInfrastructure" />
                </v-card-actions>
            </v-sheet>
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

        <!-- Reset Confirmation Dialog -->
        <v-dialog v-model="resetDialogOpen" max-width="400px">
            <v-card>
                <v-card-title>Confirm Reset to Defaults</v-card-title>
                <v-card-text>
                    Are you sure you want to reset all infrastructures to their default settings? This action cannot be
                    undone.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="resetDialogOpen = false">Cancel</v-btn>
                    <v-btn color="error" @click="confirmReset">Reset</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>

<script lang="ts" setup>
    import type { BaSyxComponentKey } from '@/types/BaSyx';
    import type { AuthFlowOption, InfrastructureConfig, SecurityType } from '@/types/Infrastructure';
    import { computed, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAuth } from '@/composables/Auth/useAuth';
    import { useBasicAuthForm } from '@/composables/Auth/useBasicAuthForm';
    import { useOAuth2Form } from '@/composables/Auth/useOAuth2Form';
    import { useComponentConnectionTesting } from '@/composables/Infrastructure/useComponentConnectionTesting';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { requiredRule } from '@/utils/InfrastructureUtils';

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

    // Computed Properties
    const infrastructures = computed(() => infrastructureStore.getInfrastructures);
    const selectedInfrastructureId = computed(() => infrastructureStore.getSelectedInfrastructureId);

    // Local State
    const dialogOpen = ref(false);
    const editDialogOpen = ref(false);
    const deleteDialogOpen = ref(false);
    const resetDialogOpen = ref(false);
    const editMode = ref<'add' | 'edit'>('edit');
    const editingInfrastructure = ref<InfrastructureConfig>(infrastructureStore.createEmptyInfrastructure());
    const infrastructureToDelete = ref<InfrastructureConfig | null>(null);
    const expandedPanels = ref<number[]>([]);
    const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

    // Computed property that automatically syncs with the actual default infrastructure
    const defaultInfrastructure = computed({
        get: () => {
            const defaultInfra = infrastructures.value.find((infra) => infra.isDefault);
            return defaultInfra?.id || infrastructures.value[0]?.id || '';
        },
        set: (value: string) => {
            if (value) {
                infrastructureStore.dispatchSetDefaultInfrastructure(value);
            }
        },
    });

    const securityTypes: SecurityType[] = ['No Authentication', 'Basic Authentication', 'Bearer Token', 'OAuth2'];
    const authFlowOptions: AuthFlowOption[] = [
        { text: 'User Login (Authorization Code Flow)', value: 'auth-code' },
        { text: 'Service Account (Client Credentials)', value: 'client-credentials' },
    ];

    // Initialize composables for auth forms
    const basicAuthForm = useBasicAuthForm();
    const oauth2Form = useOAuth2Form();
    const connectionTesting = useComponentConnectionTesting();

    // Expose for template usage (using direct references to maintain reactivity)
    const basicAuthUsername = basicAuthForm.basicAuthUsername;
    const basicAuthPassword = basicAuthForm.basicAuthPassword;
    const bearerToken = basicAuthForm.bearerToken;

    const oauth2Data = oauth2Form.formData;
    const oAuth2AuthFlow = oauth2Form.authFlow;
    const oauth2Token = oauth2Form.token;
    const oauth2Loading = oauth2Form.loading;

    const componentConnectionStatus = connectionTesting.componentConnectionStatus;
    const componentTestingLoading = connectionTesting.componentTestingLoading;
    const testingAllConnections = connectionTesting.testingAllConnections;

    const router = useRouter();

    const { logout: performLogout } = useAuth(router);

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

    function addNewInfrastructure(): void {
        editMode.value = 'add';
        editingInfrastructure.value = infrastructureStore.createEmptyInfrastructure();
        loadAuthDataFromInfrastructure(editingInfrastructure.value);
        expandedPanels.value = [];
        editDialogOpen.value = true;
    }

    async function editInfrastructure(infra: InfrastructureConfig): Promise<void> {
        editMode.value = 'edit';
        editingInfrastructure.value = JSON.parse(JSON.stringify(infra)); // Deep clone
        loadAuthDataFromInfrastructure(editingInfrastructure.value);
        expandedPanels.value = [];
        editDialogOpen.value = true;

        // Automatically test all connections when editing an existing infrastructure
        await testAllConnections();
    }

    function loadAuthDataFromInfrastructure(infra: InfrastructureConfig): void {
        // Load auth data using composables
        basicAuthForm.loadFromInfrastructure(infra);
        oauth2Form.loadFromInfrastructure(infra);

        // Reset component connection status
        connectionTesting.resetConnectionStatus();
    }

    async function saveAuthDataToInfrastructure(infra: InfrastructureConfig): Promise<void> {
        // Save auth data using composables
        basicAuthForm.saveToInfrastructure(infra);
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

    async function confirmReset(): Promise<void> {
        await infrastructureStore.dispatchResetToDefaultInfrastructures();
        resetDialogOpen.value = false;
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

    async function authenticateOAuth2(): Promise<void> {
        await saveInfrastructure(); // Save infrastructure in case this is a new one
        await performLogout(); // Logout first to clear any existing tokens
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
