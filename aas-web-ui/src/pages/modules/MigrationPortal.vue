<template>
    <Warning v-model="dialog"></Warning>
    <Success v-model="successDialog"></Success>
    <Error v-model="errorDialog"></Error>
    <RemoteSource v-model="remoteSourceDialog" mode="source" @saved="onRemoteSourceSaved"></RemoteSource>
    <RemoteSource v-model="remoteDestinationDialog" mode="destination" @saved="onRemoteDestinationSaved"></RemoteSource>
    <v-navigation-drawer>
        <v-card elevation="0" class="mx-2 my-3">
            <v-card-title align="center">Migrator</v-card-title>
            <v-divider />
            <v-card-text>
                <v-list-item border rounded variant="tonal" :active="currentStep == 0" color="primary">
                    <template #prepend>
                        <v-icon size="24">mdi-database-export</v-icon>
                    </template>
                    <v-list-item-title>Source</v-list-item-title>
                </v-list-item>
                <v-list-item border rounded variant="tonal" class="mt-2" :active="currentStep == 1" color="primary">
                    <template #prepend>
                        <v-icon size="24">mdi-database-import</v-icon>
                    </template>
                    <v-list-item-title>Destination</v-list-item-title>
                </v-list-item>
            </v-card-text>
        </v-card>
    </v-navigation-drawer>
    <v-container v-if="currentStep == 0" class="pa-md-12" max-width="1500">
        <v-card>
            <v-toolbar>
                <template #title>
                    <v-card-title align="center">Welcome to the BaSyx Migration Portal!</v-card-title>
                    <v-card-subtitle align="center" class="mb-2 mt-n2"
                        >To get started, please select the <b>Data Source</b></v-card-subtitle
                    >
                </template>
            </v-toolbar>
            <v-divider />
            <v-card-text>
                <v-row>
                    <v-col cols="6" align="center">
                        <v-label
                            >Migrate from <span class="font-weight-bold">&nbsp;local&nbsp;</span> AAS Instance</v-label
                        ><br />
                        <span style="color: gray"
                            >This Instance is configured in this specific AAS UI Instance as AAS Repository, Submodel
                            Repository and Concept Description Repository</span
                        >
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col cols="6" align="center">
                        <v-label
                            >Migrate from <span class="font-weight-bold">&nbsp;Remote&nbsp;</span> AAS Instance</v-label
                        ><br />
                        <span style="color: gray"
                            >This Instance is not configured in this specific AAS UI Instance as AAS Repository,
                            Submodel Repository and Concept Description Repository. You can provide all connection
                            details in the next step manually.</span
                        >
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="6" align="center"
                        ><v-btn color="primary" variant="tonal" @click="selectLocalSource">Local Source</v-btn></v-col
                    >
                    <v-divider vertical />
                    <v-col cols="6" align="center"
                        ><v-btn color="primary" variant="tonal" @click="selectRemoteSource">Remote Source</v-btn></v-col
                    >
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
    <v-container v-if="currentStep == 1" class="pa-md-12" max-width="1500">
        <v-card>
            <v-toolbar>
                <template #prepend>
                    <v-btn icon="mdi-chevron-left" @click="currentStep = 0"></v-btn>
                </template>
                <template #title>
                    <v-card-title align="center">Welcome to the BaSyx Migration Portal!</v-card-title>
                    <v-card-subtitle align="center" class="mb-2 mt-n2"
                        >Now, Please select the <b>Data Destination</b></v-card-subtitle
                    >
                </template>
            </v-toolbar>
            <v-divider />
            <v-card-text>
                <v-row>
                    <v-col cols="6" align="center">
                        <v-label
                            >Migrate to <span class="font-weight-bold">&nbsp;local&nbsp;</span> AAS Instance
                            {{ isLocalSource() ? '(Unavailable)' : '' }}</v-label
                        ><br />
                        <span style="color: gray"
                            >This Instance is configured in this specific AAS UI Instance as AAS Repository, Submodel
                            Repository and Concept Description Repository</span
                        >
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col cols="6" align="center">
                        <v-label
                            >Migrate to <span class="font-weight-bold">&nbsp;Remote&nbsp;</span> AAS Instance</v-label
                        ><br />
                        <span style="color: gray"
                            >This Instance is not configured in this specific AAS UI Instance as AAS Repository,
                            Submodel Repository and Concept Description Repository. You can provide all connection
                            details in the next step manually.</span
                        >
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="6" align="center"
                        ><v-btn
                            color="primary"
                            variant="tonal"
                            :disabled="isLocalSource()"
                            @click="selectLocalDestination"
                            >Local Destination</v-btn
                        ></v-col
                    >
                    <v-divider vertical />
                    <v-col cols="6" align="center"
                        ><v-btn color="primary" variant="tonal" @click="remoteDestinationDialog = true"
                            >Remote Destination</v-btn
                        ></v-col
                    >
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
    <v-container v-if="currentStep == 2" class="pa-md-12" max-width="1500">
        <v-card>
            <v-toolbar>
                <template #prepend>
                    <v-btn icon="mdi-chevron-left" @click="currentStep = 0"></v-btn>
                </template>
                <template #title>
                    <v-card-title align="center">Welcome to the BaSyx Migration Portal!</v-card-title>
                    <v-card-subtitle align="center" class="mb-2 mt-n2"
                        >Transferation from {{ isLocalSource() ? 'Local' : 'Remote' }} to
                        {{ isLocalDestination() ? 'Local' : 'Remote' }}</v-card-subtitle
                    >
                </template>
            </v-toolbar>
            <v-divider />
            <v-card-text>TODO: Implement AAS to port Selection</v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="success" variant="tonal" :loading="transfering" @click="startTransfer">Transfer</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { onBeforeUnmount, onMounted, ref } from 'vue';
    import { useMigrationStore } from '@/store/MigrationStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import Error from './MigrationPortal/Error.vue';
    import RemoteSource from './MigrationPortal/RemoteSource.vue';
    import Success from './MigrationPortal/Success.vue';
    import Warning from './MigrationPortal/Warning.vue';

    defineOptions({
        inheritAttrs: false,
        moduleTitle: 'MigrationPortal', // optional module title
        isDesktopModule: true,
        isMobileModule: false,
    });

    type DataSource = {
        type: 'local' | 'remote';
        aasRepositoryUrl?: string;
        submodelRepositoryUrl?: string;
        conceptDescriptionRepositoryUrl?: string;
    };

    const migrationStore = useMigrationStore();
    const navStore = useNavigationStore();

    const currentStep = ref(0);
    const dataSource = ref<DataSource | null>(null);
    const dataDestination = ref<DataSource | null>(null);
    const dialog = ref<boolean>(true);
    const successDialog = ref<boolean>(false);
    const errorDialog = ref<boolean>(false);
    const remoteSourceDialog = ref<boolean>(false);
    const remoteDestinationDialog = ref<boolean>(false);
    let tokenRefreshInterval: number | null = null;
    const transfering = ref<boolean>(false);

    function selectLocalSource(): void {
        currentStep.value = 1;
        dataSource.value = { type: 'local' };
    }

    function selectRemoteSource(): void {
        remoteSourceDialog.value = true;
    }

    function selectLocalDestination(): void {
        // Local destination selected
        currentStep.value = 2;
        dataDestination.value = { type: 'local' };
    }

    async function refreshTokens(): Promise<void> {
        try {
            // Refresh source tokens if needed
            if (migrationStore.hasSourceAasToken && migrationStore.isSourceAasTokenExpired) {
                await migrationStore.refreshToken('source', 'aas');
            }
            if (migrationStore.hasSourceSubmodelToken && migrationStore.isSourceSubmodelTokenExpired) {
                await migrationStore.refreshToken('source', 'submodel');
            }
            if (
                migrationStore.hasSourceConceptDescriptionToken &&
                migrationStore.isSourceConceptDescriptionTokenExpired
            ) {
                await migrationStore.refreshToken('source', 'conceptDescription');
            }

            // Refresh destination tokens if needed
            if (migrationStore.hasDestinationAasToken && migrationStore.isDestinationAasTokenExpired) {
                await migrationStore.refreshToken('destination', 'aas');
            }
            if (migrationStore.hasDestinationSubmodelToken && migrationStore.isDestinationSubmodelTokenExpired) {
                await migrationStore.refreshToken('destination', 'submodel');
            }
            if (
                migrationStore.hasDestinationConceptDescriptionToken &&
                migrationStore.isDestinationConceptDescriptionTokenExpired
            ) {
                await migrationStore.refreshToken('destination', 'conceptDescription');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Optionally show error to user or clear failed connection
        }
    }

    function isLocalSource(): boolean {
        return dataSource.value?.type === 'local';
    }

    function isLocalDestination(): boolean {
        return dataDestination.value?.type === 'local';
    }

    async function startTransfer(): Promise<void> {
        transfering.value = true;
        // Get the AAS Repository URLs from the store if local
        let sourceEndpoint = '';
        let destinationEndpoint = '';
        const sourceHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        const destinationHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Setup source endpoint and headers
        if (isLocalSource()) {
            sourceEndpoint = navStore.getAASRepoURL;
        } else {
            const sourceConn = migrationStore.getSourceConnection('aas');
            if (!sourceConn?.endpoint.endsWith('/shells')) {
                sourceConn!.endpoint += '/shells';
            }
            if (sourceConn == null) {
                console.error('No source AAS connection available');
                transfering.value = false;
                return;
            }

            sourceEndpoint = sourceConn.endpoint;

            // Add authorization header if security is enabled
            if (sourceConn.securityEnabled) {
                const token = migrationStore.getSourceAasAccessToken;
                if (token) {
                    if (sourceConn.securityType === 'Basic Authentication') {
                        sourceHeaders['Authorization'] = `Basic ${token}`;
                    } else if (sourceConn.securityType === 'Keycloak' || sourceConn.securityType === 'Bearer Token') {
                        sourceHeaders['Authorization'] = `Bearer ${token}`;
                    }
                }
            }
        }

        // Setup destination endpoint and headers
        if (isLocalDestination()) {
            destinationEndpoint = navStore.getAASRepoURL;
        } else {
            const destConn = migrationStore.getDestinationConnection('aas');
            if (!destConn?.endpoint.endsWith('/shells')) {
                destConn!.endpoint += '/shells';
            }
            if (destConn == null) {
                console.error('No destination AAS connection available');
                transfering.value = false;
                return;
            }

            destinationEndpoint = destConn.endpoint;

            // Add authorization header if security is enabled
            if (destConn.securityEnabled) {
                const token = migrationStore.getDestinationAasAccessToken;
                if (token) {
                    if (destConn.securityType === 'Basic Authentication') {
                        destinationHeaders['Authorization'] = `Basic ${token}`;
                    } else if (destConn.securityType === 'Keycloak' || destConn.securityType === 'Bearer Token') {
                        destinationHeaders['Authorization'] = `Bearer ${token}`;
                    }
                }
            }
        }

        try {
            await fetchAndTransferAllPages(sourceEndpoint, sourceHeaders, destinationEndpoint, destinationHeaders);
            transfering.value = false;
            successDialog.value = true;
        } catch (error) {
            errorDialog.value = true;
            console.error('There was a problem with the fetch operation:', error);
            transfering.value = false;
        }
    }

    async function fetchAndTransferAllPages(
        sourceEndpoint: string,
        sourceHeaders: Record<string, string>,
        destinationEndpoint: string,
        destinationHeaders: Record<string, string>
    ): Promise<void> {
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
            let url: string = cursor ? `${sourceEndpoint}?cursor=${encodeURIComponent(cursor)}` : sourceEndpoint;
            url = cursor ? url + '&limit=1' : url + '?limit=1';

            const response: Response = await fetch(url, {
                method: 'GET',
                headers: sourceHeaders,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized access - please check your credentials.');
                } else {
                    throw new Error(`Failed to fetch data from source: ${response.status} ${response.statusText}`);
                }
            }

            const data: { result?: unknown[]; paging_metadata?: { cursor?: string } } = await response.json();

            // Process the current page of data
            if (data.result && data.result.length > 0) {
                // POST each item to destination
                for (const item of data.result) {
                    await postToDestination(destinationEndpoint, destinationHeaders, item);
                }
            }

            // Check for pagination metadata
            if (data.paging_metadata && data.paging_metadata.cursor) {
                cursor = data.paging_metadata.cursor;
            } else {
                hasMore = false;
            }
        }
    }

    async function postToDestination(endpoint: string, headers: Record<string, string>, item: unknown): Promise<void> {
        const response: Response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(item),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized access - please check your credentials.');
            } else if (response.status === 409) {
                console.warn('Item already exists at destination, skipping.');
            } else {
                throw new Error(`Failed to fetch data from source: ${response.status} ${response.statusText}`);
            }
        }
    }

    function onRemoteSourceSaved(): void {
        currentStep.value = 1;
        dataSource.value = { type: 'remote' };
    }

    function onRemoteDestinationSaved(): void {
        currentStep.value = 2;
        dataDestination.value = { type: 'remote' };
    }

    onMounted(() => {
        // Set up token refresh interval (every 30 seconds)
        tokenRefreshInterval = window.setInterval(() => {
            refreshTokens();
        }, 10000);
        // Prevent Reload
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
    });

    onBeforeUnmount(() => {
        // Clean up interval when component is destroyed
        if (tokenRefreshInterval !== null) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
        }
    });
</script>
