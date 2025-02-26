<template>
    <v-container class="pa-0" fluid>
        <v-sheet>
            <v-divider v-if="!singleAas || !isMobile"></v-divider>
            <v-card-title class="bg-detailsHeader px-1">
                <v-row align="center" style="height: 40px" class="mx-0">
                    <!-- AAS Status -->
                    <div
                        v-if="
                            !isMobile &&
                            singleAas &&
                            assetAdministrationShellData.status &&
                            assetAdministrationShellData.status.trim() !== ''
                        "
                        class="text-caption px-1">
                        <v-tooltip
                            v-if="
                                assetAdministrationShellData.status && assetAdministrationShellData.status === 'offline'
                            "
                            :text="'AAS status ' + assetAdministrationShellData.status">
                            <template #activator="{ props }">
                                <v-icon size="small" v-bind="props" class="text-error"> mdi-cloud-off-outline </v-icon>
                            </template>
                        </v-tooltip>
                    </div>
                    <!-- Last Sync -->
                    <div class="text-caption ml-1">
                        <v-icon class="text-caption" size="small">mdi-autorenew</v-icon>
                        <span
                            class="text-caption ml-1"
                            :class="
                                assetAdministrationShellData?.timestamp === 'no sync'
                                    ? 'text-error'
                                    : 'text-subtitleText'
                            ">
                            {{ assetAdministrationShellData.timestamp }}
                        </span>
                    </div>
                    <v-spacer v-if="isMobile || singleAas"></v-spacer>
                    <!-- Jump to Submodel List on mobile -->
                    <v-btn
                        v-if="isMobile"
                        color="primary"
                        density="compact"
                        variant="tonal"
                        border
                        append-icon="mdi-chevron-right"
                        class="text-none"
                        text="Submodels"
                        @click="gotoSubmodelList()" />
                    <!-- Download AAS on Desktop -->
                    <v-tooltip :open-delay="600" location="end">
                        <template #activator="{ props }">
                            <v-btn
                                v-if="singleAas && !isMobile"
                                v-bind="props"
                                color="primary"
                                density="compact"
                                variant="tonal"
                                border
                                append-icon="mdi-download"
                                class="text-none"
                                text="Download"
                                @click="downloadAasx(assetAdministrationShellData)" />
                        </template>
                        <span>Download Asset Administration Shell as .aasx file</span>
                    </v-tooltip>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="bg-detailsCard pa-0" style="overflow-y: auto" :style="{ height: detailsListHeight }">
                <!-- Asset Information -->
                <!-- 1) AssetInformation is mandatory for an AssetAdministrationShell -->
                <!-- 2) Minimal (empty) AssetInformation (generated with aas4j) will be { assetKind: null } -->
                <AssetInformation
                    v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
                    :asset-object="assetInformation"></AssetInformation>
                <v-divider
                    v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
                    thickness="2"></v-divider>
                <!-- AAS Details -->
                <v-list v-if="assetAdministrationShellData" lines="one" nav class="bg-detailsCard">
                    <!-- AAS Identification -->
                    <IdentificationElement
                        :identification-object="assetAdministrationShellData"
                        :v-chip-content="
                            getKeyTypeAbbreviation(assetAdministrationShellData.modelType)
                        "></IdentificationElement>
                    <!-- AAS Administrative Information-->
                    <v-divider v-if="assetAdministrationShellData?.administration"></v-divider>
                    <AdministrativeInformationElement
                        v-if="assetAdministrationShellData.administration"
                        :administrative-information-object="assetAdministrationShellData.administration"
                        :administrative-information-title="'Administrative Information'"
                        :small="false"
                        :background-color="'detailsCard'"></AdministrativeInformationElement>
                    <v-divider
                        v-if="
                            assetAdministrationShellData.displayName &&
                            assetAdministrationShellData.displayName.length > 0
                        "
                        class="mt-2"></v-divider>
                    <!-- AAS DisplayName -->
                    <DisplayNameElement
                        v-if="
                            assetAdministrationShellData.displayName &&
                            assetAdministrationShellData.displayName.length > 0
                        "
                        :display-name-array="assetAdministrationShellData.displayName"
                        :display-name-title="'DisplayName'"
                        :small="false"></DisplayNameElement>
                    <v-divider
                        v-if="
                            assetAdministrationShellData.description &&
                            assetAdministrationShellData.description.length > 0
                        "
                        class="mt-2"></v-divider>
                    <!-- AAS Description -->
                    <DescriptionElement
                        v-if="
                            assetAdministrationShellData.description &&
                            assetAdministrationShellData.description.length > 0
                        "
                        :description-array="assetAdministrationShellData.description"
                        :description-title="'Description'"
                        :small="false"></DescriptionElement>
                </v-list>
            </v-card-text>
        </v-sheet>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
    import { getKeyTypeAbbreviation } from '@/utils/AAS/KeyTypesUtil';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { downloadAasx, fetchAssetInformation } = useAASRepositoryClient();
    const { aasIsAvailableById, fetchAas } = useAASHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Data
    const assetAdministrationShellData = ref({} as any | null);
    const assetInformation = ref({} as any | null);
    const autoSyncInterval = ref<number | undefined>(undefined);
    const statusCheckInterval = ref<number | undefined>(undefined);

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile);
    const singleAas = computed(() => envStore.getSingleAas);
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const aasRepoURL = computed(() => navigationStore.getAASRepoURL); // Get the AAS Repository URL from the Store
    const detailsListHeight = computed(() => {
        if (isMobile.value) {
            if (singleAas.value) {
                return 'calc(100vh - 40px - 64px - 34px)'; // Full height - footer - header - details header (divider)
            } else {
                return 'calc(100vh - 231px - 40px - 64px - 36px - 64px)'; // Full height - 4x AAS items - footer - header - details header (divider) - Searchbar
            }
        } else {
            if (singleAas.value) {
                return 'calc(100vh - 64px - 48px - 40px - 35px)'; // Full height - header - collapse button - footer - details header (divider)
            } else {
                return 'calc(50vh - 40px - 48px - 33px)'; // Half height - footer - collapse button - details header (divider)
            }
        }
    });
    const autoSync = computed(() => navigationStore.getAutoSync);
    const statusCheck = computed(() => navigationStore.getStatusCheck);

    // Watchers
    watch(
        () => aasRegistryURL.value,
        async () => {
            initializeView();
        }
    );

    watch(
        () => aasRepoURL.value,
        async () => {
            initializeView();
        }
    );

    watch(
        () => selectedAAS.value,
        async () => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSync.value.state) {
                if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path); // update AAS data
                    }, autoSync.value.interval);
                }
            }

            window.clearInterval(statusCheckInterval.value); // clear old interval
            if (statusCheck.value.state === true) {
                if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                    await updateStatusOfAas();

                    // create new interval
                    statusCheckInterval.value = window.setInterval(async () => {
                        await updateStatusOfAas();
                    }, statusCheck.value.interval);
                }
            }

            initializeView();
        },
        { deep: true }
    );

    watch(
        () => autoSync.value,
        async (autoSyncValue) => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSyncValue.state === true) {
                if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                    assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path); // update AAS data

                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path); // update AAS data
                    }, autoSyncValue.interval);
                }
            }
        },
        { deep: true }
    );

    watch(
        () => statusCheck.value,
        async (statusCheckValue) => {
            window.clearInterval(statusCheckInterval.value); // clear old interval
            if (statusCheckValue.state === true) {
                assetAdministrationShellData.value.status = 'status loading';

                await updateStatusOfAas();

                // create new interval
                statusCheckInterval.value = window.setInterval(async () => {
                    await updateStatusOfAas();
                }, statusCheck.value.interval);
            } else {
                assetAdministrationShellData.value.status = 'check disabled';

                // Reset status icon after 2 seconds
                setTimeout(() => {
                    assetAdministrationShellData.value.status = '';
                }, 2000);
            }
        },
        { deep: true }
    );

    onMounted(async () => {
        if (autoSync.value.state) {
            // create new interval
            autoSyncInterval.value = window.setInterval(async () => {
                if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                    assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path); // update AAS data
                }
            }, autoSync.value.interval);
        }

        if (statusCheck.value.state === true) {
            await updateStatusOfAas();

            // create new interval
            statusCheckInterval.value = window.setInterval(async () => {
                await updateStatusOfAas();
            }, statusCheck.value.interval);
        }

        initializeView(true);
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value);
        window.clearInterval(statusCheckInterval.value);
    });

    async function initializeView(init: boolean = false): Promise<void> {
        if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            assetAdministrationShellData.value = {};
            assetInformation.value = {};
            return;
        }

        assetAdministrationShellData.value = { ...selectedAAS.value }; // create local copy
        updateAssetInformation();

        updateStatusOfAas(init);
    }

    async function updateStatusOfAas(init: boolean = false): Promise<void> {
        if (assetAdministrationShellData.value && Object.keys(assetAdministrationShellData.value).length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 600)); // Give the UI the chance to refresh status icons

            const aasIsAvailable = await aasIsAvailableById(assetAdministrationShellData.value.id);

            if (aasIsAvailable) {
                assetAdministrationShellData.value.status =
                    statusCheck.value.state === true ? 'online' : init ? '' : 'check disabled';
            } else {
                assetAdministrationShellData.value.status =
                    statusCheck.value.state === true ? 'offline' : init ? '' : 'check disabled';
            }
        }
    }

    async function updateAssetInformation(): Promise<void> {
        assetInformation.value = await fetchAssetInformation(
            extractEndpointHref(assetAdministrationShellData.value, 'AAS-3.0')
        );
    }

    function gotoSubmodelList(): void {
        router.push({
            name: 'SubmodelList',
            query: { aas: route.query.aas },
        });
    }
</script>
