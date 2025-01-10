<template>
    <v-container class="pa-0" fluid>
        <v-sheet>
            <v-divider v-if="!singleAas || !isMobile"></v-divider>
            <v-card-title class="bg-detailsHeader pl-3">
                <v-row align="center" class="pl-4" style="height: 40px">
                    <!-- AAS Status -->
                    <div class="text-caption" :class="statusColor">
                        <v-tooltip :text="'AAS status ' + aasData.status">
                            <template #activator="{ props }">
                                <template v-if="aasData.status === 'check disabled'">
                                    <v-icon size="small" v-bind="props">mdi-cloud-off-outline</v-icon>
                                </template>
                                <template v-else-if="aasData.status === 'online'">
                                    <v-icon size="small" v-bind="props">mdi-cloud-check-outline</v-icon>
                                </template>
                                <template v-else>
                                    <v-icon size="small" v-bind="props">mdi-cloud-remove-outline</v-icon>
                                </template>
                            </template>
                        </v-tooltip>
                    </div>
                    <!-- Last Sync -->
                    <div class="text-caption ml-2">
                        <v-icon class="text-caption" size="small">mdi-autorenew</v-icon>
                        <span
                            class="text-caption ml-1"
                            :class="aasData?.timestamp === 'no sync' ? 'text-error' : 'text-subtitleText'">
                            {{ aasData.timestamp }}
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
                                @click="downloadAasx(aasData)" />
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
                <v-list v-if="aasData" lines="one" nav class="bg-detailsCard">
                    <!-- AAS Identification -->
                    <IdentificationElement
                        class="mb-2"
                        :identification-object="aasData"
                        :model-type="'AAS'"
                        :id-type="'Identification (ID)'"
                        :name-type="'idShort'"></IdentificationElement>
                    <!-- AAS Administrative Information-->
                    <v-divider v-if="aasData?.administration" class="mt-2"></v-divider>
                    <AdministrativeInformationElement
                        v-if="aasData.administration"
                        :administrative-information-object="aasData.administration"
                        :administrative-information-title="'Administrative Information'"
                        :small="false"
                        :background-color="'detailsCard'"></AdministrativeInformationElement>
                    <v-divider v-if="aasData.displayName && aasData.displayName.length > 0"></v-divider>
                    <!-- AAS DisplayName -->
                    <DisplayNameElement
                        v-if="aasData.displayName && aasData.displayName.length > 0"
                        :display-name-object="aasData.displayName"
                        :display-name-title="'DisplayName'"
                        :small="false"></DisplayNameElement>
                    <v-divider v-if="aasData.description && aasData.description.length > 0" class="mt-2"></v-divider>
                    <!-- AAS Description -->
                    <DescriptionElement
                        v-if="aasData.description && aasData.description.length > 0"
                        :description-object="aasData.description"
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
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { downloadAasx, fetchAssetInformation } = useAASRepositoryClient();
    const { isAvailableById } = useAASRegistryClient();
    const { fetchAas } = useAASHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Data
    const aasData = ref({} as any | null);
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
                return 'calc(100vh - 64px - 64px - 48px - 40px - 35px)'; // Full height - header - title - collapse button - footer - details header (divider)
            } else {
                return 'calc(50vh - 40px - 48px - 33px)'; // Half height - footer - collapse button - details header (divider)
            }
        }
    });
    const statusColor = computed(() => {
        if (aasData.value?.status) {
            if (aasData.value.status === 'online') {
                return 'text-success';
            } else if (aasData.value.status === 'check disabled') {
                return 'text-warning';
            }
        }
        return 'text-error';
    });
    const autoSync = computed(() => navigationStore.getAutoSync);
    const aasStatusCheck = computed(() => navigationStore.getAASStatusCheck);

    // Watchers
    watch(
        () => aasRegistryURL.value,
        (newValue) => {
            if (newValue !== '') {
                initializeView();
            } else {
                aasData.value = {};
                assetInformation.value = {};
            }
        }
    );

    watch(
        () => aasRepoURL.value,
        (newValue) => {
            if (newValue !== '') {
                initializeView();
            } else {
                aasData.value = {};
                assetInformation.value = {};
            }
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            initializeView();
        }
    );

    watch(
        () => aasStatusCheck.value,
        (aasStatusCheckValue) => {
            if (aasStatusCheckValue.state) {
                window.clearInterval(statusCheckInterval.value); // clear old interval
                // create new interval
                statusCheckInterval.value = window.setInterval(async () => {
                    updateAasStatus();
                }, aasStatusCheckValue.interval);
            } else {
                window.clearInterval(statusCheckInterval.value); // clear interval
            }
        },
        { deep: true }
    );

    watch(
        () => autoSync.value,
        (autoSyncValue) => {
            if (autoSyncValue) {
                window.clearInterval(autoSyncInterval.value); // clear old interval
                // create new interval
                autoSyncInterval.value = window.setInterval(async () => {
                    if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                        aasData.value = await fetchAas(selectedAAS.value.path); // update AAS data
                    }
                }, autoSync.value.interval);
            } else {
                window.clearInterval(autoSyncInterval.value); // clear interval
            }
        },
        { deep: true }
    );

    onMounted(() => {
        initializeView();
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value);
        window.clearInterval(statusCheckInterval.value);
    });

    async function initializeView(): Promise<void> {
        if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            aasData.value = {};
            assetInformation.value = {};
            return;
        }

        aasData.value = { ...selectedAAS.value }; // create local copy

        updateAasStatus();
        await updateAssetInformation();
    }

    async function updateAssetInformation(): Promise<void> {
        assetInformation.value = await fetchAssetInformation(extractEndpointHref(aasData.value, 'AAS-3.0'));
    }

    async function updateAasStatus(): Promise<void> {
        if (aasData.value && Object.keys(aasData.value).length > 0) {
            aasData.value.status = (await isAvailableById(aasData.value.id)) ? 'online' : 'offline';
        }
    }

    function gotoSubmodelList(): void {
        router.push({
            name: 'SubmodelList',
            query: { aas: route.query.aas },
        });
    }
</script>
