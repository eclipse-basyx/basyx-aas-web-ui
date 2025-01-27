<template>
    <v-container class="pa-0" fluid>
        <v-sheet>
            <v-divider v-if="!singleAas || !isMobile"></v-divider>
            <v-card-title class="bg-detailsHeader pl-3">
                <v-row align="center" class="pl-4" style="height: 40px">
                    <!-- AAS Status -->
                    <div class="text-caption" :class="statusColor">
                        <v-tooltip :text="'AAS status ' + status">
                            <template #activator="{ props }">
                                <template v-if="status === 'check disabled'">
                                    <v-icon size="small" v-bind="props">mdi-cloud-off-outline</v-icon>
                                </template>
                                <template v-else-if="status === 'online'">
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
                <template v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1">
                    <AssetInformation :asset-information-object="assetInformation"></AssetInformation>
                    <v-divider thickness="2"></v-divider>
                </template>
                <!-- AAS -->
                <v-list v-if="assetAdministrationShellData" lines="one" nav class="bg-detailsCard">
                    <!-- AAS Identification -->
                    <IdentificationElement
                        :identification-object="assetAdministrationShellData"
                        :v-chip-content="getKeyTypeAbbreviation(assetAdministrationShellData.modelType)" />
                    <!-- AAS further information as expandable panels -->
                    <v-expansion-panels v-model="openPanels" multiple class="mb-n2">
                        <!-- AAS Administrative Information-->
                        <template v-if="hasAdministrativeInformation">
                            <v-divider />
                            <AdministrativeInformationElement
                                :administrative-information-object="assetAdministrationShellData?.administration"
                                :background-color="'detailsCard'" />
                        </template>
                        <!-- AAS DisplayName -->
                        <template v-if="hasDisplayName">
                            <v-divider />
                            <DisplayNameElement
                                :display-name-array="assetAdministrationShellData?.displayName"
                                :background-color="'detailsCard'" />
                        </template>
                        <!-- AAS Description -->
                        <template v-if="hasDescription">
                            <v-divider />
                            <DescriptionElement
                                :description-array="assetAdministrationShellData?.description"
                                :background-color="'detailsCard'" />
                        </template>
                    </v-expansion-panels>
                </v-list>
            </v-card-text>
        </v-sheet>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';
    import { getKeyTypeAbbreviation } from '@/utils/KeyTypesUtil';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { downloadAasx, fetchAssetInformation } = useAASRepositoryClient();
    const { fetchAas } = useAASHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    const props = defineProps({
        status: {
            type: String,
            default: 'check disabled',
        },
    });

    // Data
    const assetAdministrationShellData = ref({} as any | null);
    const assetInformation = ref({} as any | null);
    const autoSyncInterval = ref<number | undefined>(undefined);
    const openPanels = ref<number[]>([]);

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile);
    const singleAas = computed(() => envStore.getSingleAas);
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
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
    const statusColor = computed(() => {
        if (props.status === 'online') {
            return 'text-success';
        } else if (props.status === 'check disabled') {
            return 'text-warning';
        } else {
            return 'text-error';
        }
    });
    const autoSync = computed(() => navigationStore.getAutoSync);
    const hasAdministrativeInformation = computed(() =>
        assetAdministrationShellData.value?.administration &&
        Object.keys(assetAdministrationShellData.value?.administration).length > 0
            ? true
            : false
    );
    const hasDisplayName = computed(() =>
        assetAdministrationShellData.value.displayName &&
        Array.isArray(assetAdministrationShellData.value.displayName) &&
        assetAdministrationShellData.value.displayName.length > 0
            ? true
            : false
    );
    const hasDescription = computed(() =>
        assetAdministrationShellData.value.description &&
        Array.isArray(assetAdministrationShellData.value.description) &&
        assetAdministrationShellData.value.description.length > 0
            ? true
            : false
    );
    const openPanelNumber = computed(() =>
        hasDescription.value ? 0 + (hasAdministrativeInformation.value ? 1 : 0) + (hasDisplayName.value ? 1 : 0) : null
    );

    // Watchers
    // watch for changes in the autoSync state and create or clear the autoSyncInterval
    watch(
        () => autoSync.value,
        (autoSyncValue) => {
            if (autoSyncValue.state) {
                window.clearInterval(autoSyncInterval.value); // clear old interval
                // create new interval
                autoSyncInterval.value = window.setInterval(async () => {
                    if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                        assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path);
                    }
                }, autoSyncValue.interval);
            } else {
                window.clearInterval(autoSyncInterval.value);
            }
        },
        { deep: true }
    );

    watch(
        () => selectedAAS.value,
        async () => {
            await initializeView();
        }
    );

    watch(
        () => assetAdministrationShellData.value,
        () => {
            openPanels.value = openPanelNumber.value === null ? [] : [openPanelNumber.value];
        },
        { deep: true }
    );

    onMounted(async () => {
        if (autoSync.value.state) {
            // create new interval
            autoSyncInterval.value = window.setInterval(async () => {
                if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                    assetAdministrationShellData.value = await fetchAas(selectedAAS.value.path);
                }
            }, autoSync.value.interval);
        }
        await initializeView();
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value); // clear old interval
    });

    async function initializeView(): Promise<void> {
        if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            assetAdministrationShellData.value = {};
            assetInformation.value = {};
            return;
        }

        assetAdministrationShellData.value = { ...selectedAAS.value }; // create local copy

        await updateAssetInformation();
    }

    async function updateAssetInformation(): Promise<void> {
        assetInformation.value = await fetchAssetInformation(
            extractEndpointHref(assetAdministrationShellData.value, 'AAS-3.0')
        );
    }

    function gotoSubmodelList() {
        router.push({
            name: 'SubmodelList',
            query: { aas: route.query.aas },
        });
    }
</script>
