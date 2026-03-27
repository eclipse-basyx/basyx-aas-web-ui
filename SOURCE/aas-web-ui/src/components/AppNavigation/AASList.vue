<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <!-- Title bar -->
            <template v-if="!singleAas">
                <v-card-title>
                    <v-row align="center">
                        <v-col cols="auto" class="px-0">
                            <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-reload"
                                        variant="plain"
                                        :loading="listLoading"
                                        v-bind="props"
                                        @click="initialize()">
                                        <template #loader>
                                            <span class="custom-loader"><v-icon light>mdi-cached</v-icon></span>
                                        </template>
                                    </v-btn>
                                </template>
                                <span>Reload AAS List</span>
                            </v-tooltip>
                        </v-col>
                        <!-- AAS Search Field -->
                        <v-col class="pl-0" :class="editMode || allowUploading ? 'pr-0' : 'pr-2'">
                            <v-text-field
                                variant="outlined"
                                density="compact"
                                hide-details
                                label="Search for AAS..."
                                clearable
                                :placeholder="aasList.length.toString() + ' Shells'"
                                persistent-placeholder
                                @update:model-value="onSearchInput"></v-text-field>
                        </v-col>
                        <!-- Add AAS -->
                        <v-col cols="auto" class="px-0">
                            <v-menu v-if="editMode">
                                <template #activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" variant="plain" v-bind="props"></v-btn>
                                </template>
                                <v-sheet border>
                                    <v-list density="compact" class="py-0">
                                        <!-- Open Upload Dialog -->
                                        <template v-if="allowUploading">
                                            <v-tooltip
                                                open-delay="600"
                                                :location="editMode ? 'end' : 'bottom'"
                                                :disabled="isMobile">
                                                <template #activator="{ props }">
                                                    <v-list-item
                                                        prepend-icon="mdi-upload"
                                                        slim
                                                        v-bind="props"
                                                        @click="uploadAASDialog = true">
                                                        <template #prepend>
                                                            <v-icon size="small">mdi-upload</v-icon>
                                                        </template>
                                                        Upload AAS
                                                    </v-list-item>
                                                </template>
                                                <span>Upload AAS File to Environment</span>
                                            </v-tooltip>
                                            <v-divider></v-divider>
                                        </template>
                                        <!-- Open AAS create dialog -->
                                        <v-tooltip open-delay="600" location="end">
                                            <template #activator="{ props }">
                                                <v-list-item slim v-bind="props" @click="openEditDialog(true)">
                                                    <template #prepend>
                                                        <v-icon size="small">mdi-plus</v-icon>
                                                    </template>
                                                    Create AAS
                                                </v-list-item>
                                            </template>
                                            <span>Create a new AAS</span>
                                        </v-tooltip>
                                    </v-list>
                                </v-sheet>
                            </v-menu>
                            <v-tooltip
                                v-else-if="allowUploading"
                                open-delay="600"
                                :location="editMode ? 'end' : 'bottom'"
                                :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-upload"
                                        variant="plain"
                                        v-bind="props"
                                        @click="uploadAASDialog = true"></v-btn>
                                </template>
                                <span>Upload AAS File to Environment</span>
                            </v-tooltip>
                        </v-col>
                        <!-- AAS Filter -->
                        <v-col cols="auto" class="px-0">
                            <FilterAAS @update:filters="onAttributeFiltersChange" />
                        </v-col>
                    </v-row>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <!-- AAS List -->
            <v-list
                v-if="!singleAas"
                nav
                bg-color="card"
                class="pa-0"
                :style="{
                    display: 'flex',
                    'flex-direction': 'column',
                    height: listHeight,
                }">
                <template v-if="listLoading">
                    <v-list-item v-for="i in 6" :key="i" density="compact" :height="48" nav class="px-0 py-3">
                        <v-list-item-title>
                            <v-skeleton-loader type="list-item" :width="300"></v-skeleton-loader>
                        </v-list-item-title>
                        <template #append>
                            <v-skeleton-loader type="list-item" :width="50"></v-skeleton-loader>
                        </template>
                    </v-list-item>
                </template>
                <template v-else>
                    <v-virtual-scroll ref="virtualScrollRef" :items="aasList" :item-height="56" class="pb-2 bg-card">
                        <template #default="{ item }">
                            <!-- Single AAS -->
                            <v-list-item
                                v-if="item && Object.keys(item).length > 0"
                                class="mt-2 mx-2"
                                :active="isSelected(item)"
                                color="primarySurface"
                                base-color="listItem"
                                variant="tonal"
                                style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                                :border="isSelected(item) ? 'primary' : 'listItem thin'"
                                :style="{
                                    'border-color': isSelected(item)
                                        ? primaryColor + ' !important'
                                        : isDark
                                          ? '#686868 !important'
                                          : '#ABABAB !important',
                                }"
                                @click="selectAAS(item)">
                                <!-- Tooltip with idShort and id -->
                                <v-tooltip
                                    v-if="!isMobile"
                                    activator="parent"
                                    open-delay="600"
                                    transition="slide-x-transition"
                                    :disabled="isMobile">
                                    <!-- AAS ID -->
                                    <div v-if="item.id" class="text-caption">
                                        <span class="font-weight-bold">{{ 'ID: ' }}</span>
                                        {{ item.id }}
                                    </div>
                                    <!-- AAS idShort -->
                                    <div v-if="item.idShort" class="text-caption">
                                        <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                                        {{ item.idShort }}
                                    </div>
                                    <v-divider v-if="item.administration?.version" class="my-1" />
                                    <!-- AAS administrative information -->
                                    <div v-if="item.administration?.version" class="text-caption">
                                        <span class="font-weight-bold">{{ 'Version: ' }}</span>
                                        {{
                                            item.administration.version +
                                            (item.administration.revision ? '.' + item.administration.revision : '')
                                        }}
                                    </div>
                                </v-tooltip>
                                <template #title>
                                    <div class="text-primary" style="z-index: 9999">
                                        {{ nameToDisplay(item) }}
                                    </div>
                                </template>
                                <template #subtitle>
                                    <div class="text-listItemText">{{ item.id }}</div>
                                </template>
                                <!-- open Details Button (with Status Badge) -->
                                <template #append>
                                    <v-badge
                                        :model-value="
                                            item.status && item.status.trim() !== '' && item.status === 'offline'
                                                ? true
                                                : false
                                        "
                                        icon="mdi-network-strength-4-alert"
                                        color="error"
                                        text-color="buttonText"
                                        inline></v-badge>
                                    <v-menu v-if="editMode">
                                        <template #activator="{ props }">
                                            <v-btn
                                                icon="mdi-dots-vertical"
                                                variant="plain"
                                                color="listItemText"
                                                size="x-small"
                                                v-bind="props"
                                                @click.prevent></v-btn>
                                        </template>
                                        <v-sheet border>
                                            <v-list dense slim density="compact" class="py-0">
                                                <v-list-item @click="openDownloadDialog(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-download</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Download AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <v-divider></v-divider>
                                                <!-- Open AAS edit dialog -->
                                                <v-list-item @click="openEditDialog(false, item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-pencil</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <!-- Delete AAS -->
                                                <v-list-item @click="openDeleteDialog(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-delete</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Delete AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <v-divider
                                                    v-if="
                                                        item.assetKind === 'Type' ||
                                                        item.assetInformation?.assetKind === 'Type'
                                                    "></v-divider>
                                                <!-- Create Instance from Type -->
                                                <v-list-item
                                                    v-if="
                                                        item.assetKind === 'Type' ||
                                                        item.assetInformation?.assetKind === 'Type'
                                                    "
                                                    @click="createInstanceFromType(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-file-plus</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle
                                                        >Create Instance from Type</v-list-item-subtitle
                                                    >
                                                </v-list-item>
                                                <v-divider></v-divider>
                                                <!-- Copy AAS Endpoint to clipboard -->
                                                <v-list-item
                                                    @click.stop="
                                                        copyToClipboard(item.path, 'AAS Endpoint', copyIconAsRef)
                                                    ">
                                                    <template #prepend>
                                                        <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Copy AAS Endpoint</v-list-item-subtitle>
                                                </v-list-item>
                                            </v-list>
                                        </v-sheet>
                                    </v-menu>
                                    <template v-else>
                                        <!-- Download AAS -->
                                        <v-btn
                                            v-if="aasRepoURL"
                                            icon="mdi-download"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="openDownloadDialog(item)"></v-btn>
                                        <!-- Remove from AAS Registry Button -->
                                        <v-btn
                                            icon="mdi-close"
                                            size="x-small"
                                            variant="plain"
                                            color="listItemText"
                                            class="ml-n2"
                                            style="z-index: 9000"
                                            @click.stop="openDeleteDialog(item)"></v-btn>
                                    </template>
                                </template>
                            </v-list-item>
                        </template>
                    </v-virtual-scroll>
                </template>
            </v-list>
            <!-- AAS Details (only visible if the Information Button is pressed on an AAS) -->
            <AASListDetails v-if="selectedAAS && Object.keys(selectedAAS).length > 0" />
            <!-- Collapse/extend Sidebar Button -->
            <v-list v-if="!isMobile" nav style="width: 100%; z-index: 9000" class="bg-detailsCard pa-0">
                <v-divider style="margin-left: -8px; margin-right: -8px"></v-divider>
                <!-- Button to collapse the Sidebar -->
                <v-list-item class="ma-0" @click="collapseSidebar()">
                    <template #prepend>
                        <v-icon class="ml-2">mdi-chevron-double-left</v-icon>
                    </template>
                    <v-list-item-title class="text-caption">Close Sidebar</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
    <!-- Dialog for creating/editing AAS -->
    <AASForm v-model="editDialog" :new-shell="newShell" :aas="aasToEdit"></AASForm>
    <!-- Dialog for uploading AAS -->
    <UploadAAS v-model="uploadAASDialog"></UploadAAS>
    <!-- Dialog for deleting AAS -->
    <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="listLoading"></DeleteAAS>
    <!-- Dialog for downloading AAS -->
    <DownloadAAS v-model="downloadAASDialog" :aas="aasToDownload"></DownloadAAS>
    <!-- Dialog for Instance Creation from Type -->
    <AASToInstance v-model="instanceDialog" :aas="aasToInstantiate"></AASToInstance>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import { computed, onActivated, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { debounce } from '@/utils/generalUtils';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    interface AASAttributeFilters {
        manufacturerName: string;
        manufacturerProductDesignation: string;
        manufacturerProductFamily: string;
        manufacturerProductType: string;
        orderCodeOfManufacturer: string;
        productArticleNumberOfManufacturer: string;
        productClassificationSystem: string;
        productClassId: string;
    }

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { fetchAasDescriptorList, fetchAasList, fetchAas, fetchAasSmListById, aasIsAvailableById } =
        useAASHandling();
    const { nameToDisplay, descriptionToDisplay } = useReferableUtils();
    const { copyToClipboard } = useClipboardUtil();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();
    const infrastructureStore = useInfrastructureStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const aasList = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data (AAS or AAS Descriptors)
    const aasListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data before filtering
    const searchInput = ref('');
    const attributeFilters = ref<AASAttributeFilters>({
        manufacturerName: '',
        manufacturerProductDesignation: '',
        manufacturerProductFamily: '',
        manufacturerProductType: '',
        orderCodeOfManufacturer: '',
        productArticleNumberOfManufacturer: '',
        productClassificationSystem: '',
        productClassId: '',
    });
    const debouncedApplyListFilters = debounce(applyListFilters, 300);
    const enrichedAasIds = ref(new Set<string>());
    const hydratedAasIds = ref(new Set<string>());
    const attributeHydrationInProgress = ref(false);
    const attributeHydrationCompleted = ref(false);
    const attributeHydrationPromise = ref<Promise<void> | null>(null);
    const attributeHydrationRunId = ref(0);
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const downloadAASDialog = ref(false); // Variable to store if the DownloadAAS Dialog should be shown
    const aasToDelete = ref({}); // Variable to store the AAS to be deleted
    const aasToDownload = ref({}); // Variable to store the AAS to be downloaded
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const uploadAASDialog = ref(false); // Variable to store if the Upload AAS Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newShell = ref(false); // Variable to store if a new Shell should be created
    const aasToEdit = ref<any | undefined>(undefined); // Variable to store the AAS to be edited
    const statusCheckInterval = ref<number | undefined>(undefined);
    const copyIcon = ref<string>('mdi-clipboard-file-outline');
    const instanceDialog = ref(false); // Variable to store if the Instance Creation Dialog should be shown
    const aasToInstantiate = ref({}); // Variable to store the AAS to be instantiated

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const aasRepoURL = computed(() => infrastructureStore.getAASRepoURL); // Get the AAS Repository URL from the Store
    const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const primaryColor = computed(() => theme.current.value.colors.primary); // returns the primary color of the current theme
    const triggerAASListReload = computed(() => navigationStore.getTriggerAASListReload); // Get the trigger signal for AAS List reload from store
    const clearAASList = computed(() => navigationStore.getClearAASList); // Get the clear AAS List signal from store
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store
    const listHeight = computed(() => {
        if (isMobile.value) {
            if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                return '231px'; // 4x AAS items
            } else {
                return 'calc(100vh - 64px - 40px - 64px - 2px)'; // Full height - header - footer - Searchbar - 2x divider
            }
        } else {
            if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
                return 'calc(50vh - 64px - 64px - 2px - 1px)'; // Half height - header - title - 2x divider - border
            } else {
                return 'calc(100vh - 64px - 64px - 48px - 40px - 2px)'; // Full height - header - title - collapse button - footer - 2x divider
            }
        }
    });
    const editMode = computed(() => route.name === 'AASEditor'); // Check if the current Route is the AAS Editor
    const allowUploading = computed(() => envStore.getAllowUploading); // Check if the current environment config allows uploading shells
    const statusCheck = computed(() => navigationStore.getStatusCheck);
    const copyIconAsRef = computed(() => copyIcon);
    const isAuthenticating = computed(() => infrastructureStore.getIsAuthenticating); // Check if authentication is in progress
    const isTestingConnections = computed(() => infrastructureStore.getIsTestingConnections); // Check if testing connections
    const selectedInfrastructureId = computed(() => infrastructureStore.getSelectedInfrastructureId); // Get selected infrastructure ID

    // Watchers
    // Reload when AAS Registry URL or selected infrastructure changes
    watch(
        [() => aasRegistryURL.value, () => selectedInfrastructureId.value],
        ([newUrl, newId], [oldUrl, oldId]) => {
            // Only reload when URL is valid and not authenticating and not testing connections
            if (
                newUrl &&
                newUrl.trim() !== '' &&
                !isAuthenticating.value &&
                !isTestingConnections.value &&
                (newUrl !== oldUrl || newId !== oldId)
            ) {
                initialize();
            }
        },
        { immediate: true }
    );

    watch(
        () => selectedAAS.value,
        () => {
            scrollToSelectedAAS();
        },
        { deep: true }
    );

    watch(
        () => statusCheck.value,
        (statusCheckValue) => {
            window.clearInterval(statusCheckInterval.value); // clear old interval
            if (statusCheckValue.state === true) {
                updateStatus();

                // create new interval
                statusCheckInterval.value = window.setInterval(() => {
                    updateStatus();
                }, statusCheck.value.interval);
            } else {
                aasList.value.forEach((aasDescriptor: any) => {
                    aasDescriptor.status = 'check disabled';
                });

                // Reset status icon after 2 seconds
                setTimeout(() => {
                    aasList.value.forEach((aasDescriptor: any) => {
                        aasDescriptor.status = '';
                    });
                }, 2000);
            }
        },
        { deep: true }
    );

    watch(
        () => triggerAASListReload.value,
        (triggerVal) => {
            if (triggerVal === true) {
                initialize();
            }
        }
    );

    watch(
        () => clearAASList.value,
        () => {
            aasList.value = [];
            aasListUnfiltered.value = [];
            resetAttributeHydrationState();
        }
    );

    onMounted(() => {
        if (statusCheck.value.state === true) {
            window.clearInterval(statusCheckInterval.value); // clear old interval

            // create new interval
            statusCheckInterval.value = window.setInterval(() => {
                updateStatus();
            }, statusCheck.value.interval);
        }
    });

    onBeforeUnmount(() => {
        window.clearInterval(statusCheckInterval.value);
    });

    onActivated(() => {
        scrollToSelectedAAS();
    });

    function collapseSidebar(): void {
        navigationStore.dispatchDrawerState(false);
    }

    function normalizeStringValue(value: unknown): string {
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
        return '';
    }

    function flattenPrimitiveValues(node: unknown, maxValues: number = 20): Array<string> {
        const values: Array<string> = [];

        function traverse(currentNode: unknown): void {
            if (values.length >= maxValues) return;

            if (Array.isArray(currentNode)) {
                currentNode.forEach((entry) => traverse(entry));
                return;
            }

            if (currentNode && typeof currentNode === 'object') {
                Object.values(currentNode as Record<string, unknown>).forEach((entry) => traverse(entry));
                return;
            }

            const normalizedValue = normalizeStringValue(currentNode).trim();
            if (normalizedValue !== '') values.push(normalizedValue);
        }

        traverse(node);
        return values;
    }

    function normalizeAlias(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function isAliasMatch(candidate: unknown, targetAliases: Set<string>): boolean {
        if (typeof candidate !== 'string') return false;

        const normalizedCandidate = normalizeAlias(candidate);
        if (normalizedCandidate === '') return false;

        for (const targetAlias of targetAliases) {
            if (
                normalizedCandidate === targetAlias ||
                normalizedCandidate.includes(targetAlias)
            ) {
                return true;
            }
        }

        return false;
    }

    function extractAttributeValue(item: any, aliases: Array<string>): string {
        if (!item || Object.keys(item).length === 0 || aliases.length === 0) return '';

        const targetAliases = new Set(aliases.map((alias) => normalizeAlias(alias)));
        const visited = new WeakSet<object>();
        const collectedValues = [] as Array<string>;

        function addValues(node: unknown): void {
            const valuesFromNode = flattenPrimitiveValues(node);
            valuesFromNode.forEach((value) => {
                const loweredValue = value.toLowerCase();
                if (loweredValue !== '') collectedValues.push(loweredValue);
            });
        }

        function traverse(node: unknown): void {
            if (!node) return;

            if (Array.isArray(node)) {
                node.forEach((entry) => traverse(entry));
                return;
            }

            if (node && typeof node === 'object') {
                if (visited.has(node as object)) return;
                visited.add(node as object);

                const nodeAsRecord = node as Record<string, unknown>;
                const nodeIdShort =
                    typeof nodeAsRecord.idShort === 'string' ? nodeAsRecord.idShort : '';
                const nodeName = typeof nodeAsRecord.name === 'string' ? nodeAsRecord.name : '';
                const nodeKey = typeof nodeAsRecord.key === 'string' ? nodeAsRecord.key : '';

                if (
                    isAliasMatch(nodeIdShort, targetAliases) ||
                    isAliasMatch(nodeName, targetAliases) ||
                    isAliasMatch(nodeKey, targetAliases)
                ) {
                    addValues(Object.hasOwn(nodeAsRecord, 'value') ? nodeAsRecord.value : nodeAsRecord);
                }

                Object.entries(nodeAsRecord).forEach(([entryKey, entryValue]) => {
                    if (isAliasMatch(entryKey, targetAliases)) {
                        addValues(entryValue);
                    }
                });

                if (
                    Array.isArray(nodeAsRecord.specificAssetIds) &&
                    nodeAsRecord.specificAssetIds.length > 0
                ) {
                    (nodeAsRecord.specificAssetIds as Array<Record<string, unknown>>).forEach((specificAssetId) => {
                        const specificNameCandidates = flattenPrimitiveValues(specificAssetId.name, 3);
                        const hasMatchingSpecificName = specificNameCandidates.some((nameCandidate) =>
                            isAliasMatch(nameCandidate, targetAliases)
                        );

                        if (hasMatchingSpecificName) {
                            addValues(specificAssetId.value);
                        }
                    });
                }

                Object.values(nodeAsRecord).forEach((entry) => traverse(entry));
            }
        }

        traverse(item);

        return Array.from(new Set(collectedValues)).join(' ');
    }

    function enrichAttributeFields(list: Array<any>): void {
        list.forEach((item) => {
            if (!item?.id || typeof item.id !== 'string' || item.id.trim() === '') return;
            if (enrichedAasIds.value.has(item.id)) return;

            item.manufacturerNameLower = extractAttributeValue(item, [
                'ManufacturerName',
                'ManufactorName',
                'Manufacturer',
                'Manufactor',
            ]);
            item.manufacturerProductDesignationLower = extractAttributeValue(item, [
                'ManufacturerProductDesignation',
                'ProductDesignation',
            ]);
            item.manufacturerProductFamilyLower = extractAttributeValue(item, [
                'ManufacturerProductFamily',
                'ProductFamily',
            ]);
            item.manufacturerProductTypeLower = extractAttributeValue(item, [
                'ManufacturerProductType',
                'ProductType',
            ]);
            item.orderCodeOfManufacturerLower = extractAttributeValue(item, [
                'OrderCodeOfManufacturer',
                'OrderCode',
            ]);
            item.productArticleNumberOfManufacturerLower = extractAttributeValue(item, [
                'ProductArticleNumberOfManufacturer',
                'ProductArticleNumberOfManufacture',
                'ArticleNumberOfManufacturer',
                'ManufacturerCode',
                'ArticleNumber',
            ]);
            item.productClassificationSystemLower = extractAttributeValue(item, [
                'ProductClassificationSystem',
            ]);
            item.productClassIdLower = extractAttributeValue(item, ['ProductClassId']);

            enrichedAasIds.value.add(item.id);
        });
    }

    function normalizeFilters(filters: AASAttributeFilters): AASAttributeFilters {
        return {
            manufacturerName: filters.manufacturerName.trim().toLowerCase(),
            manufacturerProductDesignation: filters.manufacturerProductDesignation.trim().toLowerCase(),
            manufacturerProductFamily: filters.manufacturerProductFamily.trim().toLowerCase(),
            manufacturerProductType: filters.manufacturerProductType.trim().toLowerCase(),
            orderCodeOfManufacturer: filters.orderCodeOfManufacturer.trim().toLowerCase(),
            productArticleNumberOfManufacturer: filters.productArticleNumberOfManufacturer.trim().toLowerCase(),
            productClassificationSystem: filters.productClassificationSystem.trim().toLowerCase(),
            productClassId: filters.productClassId.trim().toLowerCase(),
        };
    }

    function hasActiveAttributeFilters(filters: AASAttributeFilters): boolean {
        return Object.values(normalizeFilters(filters)).some((value) => value !== '');
    }

    function combineExtractedAttributeValue(sources: Array<any>, aliases: Array<string>): string {
        if (!Array.isArray(sources) || sources.length === 0) return '';

        return Array.from(
            new Set(
                sources
                    .map((source) => extractAttributeValue(source, aliases).trim())
                    .filter((value) => value !== '')
            )
        ).join(' ');
    }

    function applyExtractedAttributeFields(targetItem: any, sources: Array<any>): void {
        targetItem.manufacturerNameLower = combineExtractedAttributeValue(sources, [
            'ManufacturerName',
            'ManufactorName',
            'Manufacturer',
            'Manufactor',
        ]);
        targetItem.manufacturerProductDesignationLower = combineExtractedAttributeValue(sources, [
            'ManufacturerProductDesignation',
            'ProductDesignation',
        ]);
        targetItem.manufacturerProductFamilyLower = combineExtractedAttributeValue(sources, [
            'ManufacturerProductFamily',
            'ProductFamily',
        ]);
        targetItem.manufacturerProductTypeLower = combineExtractedAttributeValue(sources, [
            'ManufacturerProductType',
            'ProductType',
        ]);
        targetItem.orderCodeOfManufacturerLower = combineExtractedAttributeValue(sources, [
            'OrderCodeOfManufacturer',
            'OrderCode',
        ]);
        targetItem.productArticleNumberOfManufacturerLower = combineExtractedAttributeValue(sources, [
            'ProductArticleNumberOfManufacturer',
            'ProductArticleNumberOfManufacture',
            'ArticleNumberOfManufacturer',
            'ManufacturerCode',
            'ArticleNumber',
        ]);
        targetItem.productClassificationSystemLower = combineExtractedAttributeValue(sources, [
            'ProductClassificationSystem',
        ]);
        targetItem.productClassIdLower = combineExtractedAttributeValue(sources, ['ProductClassId']);
    }

    function hasMissingAttributeValues(item: any): boolean {
        const keys = [
            'manufacturerNameLower',
            'manufacturerProductDesignationLower',
            'manufacturerProductFamilyLower',
            'manufacturerProductTypeLower',
            'orderCodeOfManufacturerLower',
            'productArticleNumberOfManufacturerLower',
            'productClassificationSystemLower',
            'productClassIdLower',
        ];

        return keys.some((key) => typeof item?.[key] !== 'string' || item[key].trim() === '');
    }

    function resetAttributeHydrationState(): void {
        enrichedAasIds.value.clear();
        hydratedAasIds.value.clear();
        attributeHydrationInProgress.value = false;
        attributeHydrationCompleted.value = false;
        attributeHydrationPromise.value = null;
        attributeHydrationRunId.value += 1;
    }

    async function hydrateAttributeFieldsForList(list: Array<any>): Promise<void> {
        const hydrateCandidates = list.filter(
            (item) =>
                item &&
                typeof item.id === 'string' &&
                item.id.trim() !== '' &&
                !hydratedAasIds.value.has(item.id) &&
                hasMissingAttributeValues(item)
        );

        for (const item of hydrateCandidates) {
            let fullAas = {} as any;
            let submodels = [] as Array<any>;

            if (typeof item.path === 'string' && item.path.trim() !== '') {
                fullAas = await fetchAas(item.path);
            }

            if (typeof item.id === 'string' && item.id.trim() !== '') {
                const fetchedSubmodels = await fetchAasSmListById(item.id);
                if (Array.isArray(fetchedSubmodels) && fetchedSubmodels.length > 0) {
                    submodels = fetchedSubmodels.filter((submodel) => submodel && Object.keys(submodel).length > 0);
                }
            }

            const extractionSources = [] as Array<any>;
            if (fullAas && Object.keys(fullAas).length > 0) extractionSources.push(fullAas);
            extractionSources.push(...submodels);

            if (extractionSources.length > 0) {
                applyExtractedAttributeFields(item, extractionSources);
            }

            hydratedAasIds.value.add(item.id);
        }
    }

    async function ensureAttributeHydrationForCurrentList(): Promise<void> {
        if (attributeHydrationCompleted.value) return;

        if (attributeHydrationPromise.value) {
            await attributeHydrationPromise.value;
            return;
        }

        const runId = attributeHydrationRunId.value;
        const currentList = aasListUnfiltered.value;

        attributeHydrationPromise.value = (async () => {
            attributeHydrationInProgress.value = true;

            enrichAttributeFields(currentList);
            await hydrateAttributeFieldsForList(currentList);

            if (runId === attributeHydrationRunId.value) {
                attributeHydrationCompleted.value = true;
            }
        })().finally(() => {
            if (runId === attributeHydrationRunId.value) {
                attributeHydrationInProgress.value = false;
                attributeHydrationPromise.value = null;
            }
        });

        await attributeHydrationPromise.value;
    }

    function preloadAttributeDataInBackground(): void {
        if (attributeHydrationCompleted.value || attributeHydrationInProgress.value) return;

        void ensureAttributeHydrationForCurrentList().then(() => {
            if (hasActiveAttributeFilters(attributeFilters.value)) {
                applyListFilters();
            }
        });
    }

    function onSearchInput(value: string): void {
        searchInput.value = value || '';
        debouncedApplyListFilters();
    }

    async function onAttributeFiltersChange(filters: AASAttributeFilters): Promise<void> {
        attributeFilters.value = filters;

        if (hasActiveAttributeFilters(filters)) {
            await ensureAttributeHydrationForCurrentList();
        }

        applyListFilters();
    }

    function applyListFilters(): void {
        const globalSearch = searchInput.value.trim().toLowerCase();
        const normalizedFilters = normalizeFilters(attributeFilters.value);

        aasList.value = aasListUnfiltered.value.filter((aasOrAasDescriptor: any) => {
const hasGlobalMatch = (searchTerm: string) => {
            if (!searchTerm) return false;
            return (
                aasOrAasDescriptor.idLower.includes(searchTerm) ||
                aasOrAasDescriptor.idShortLower.includes(searchTerm) ||
                aasOrAasDescriptor.nameLower.includes(searchTerm) ||
                aasOrAasDescriptor.descLower.includes(searchTerm) ||
                typeof aasOrAasDescriptor.globalAssetId === 'string' && aasOrAasDescriptor.globalAssetId.toLowerCase().includes(searchTerm)
            );
        };

        const globalSearchMatch =
            globalSearch === '' || hasGlobalMatch(globalSearch);

        const manufacturerNameMatch =
            normalizedFilters.manufacturerName === '' ||
            aasOrAasDescriptor.manufacturerNameLower.includes(normalizedFilters.manufacturerName);

        const manufacturerProductDesignationMatch =
            normalizedFilters.manufacturerProductDesignation === '' ||
            aasOrAasDescriptor.manufacturerProductDesignationLower.includes(
                normalizedFilters.manufacturerProductDesignation
            );

        const manufacturerProductFamilyMatch =
            normalizedFilters.manufacturerProductFamily === '' ||
            aasOrAasDescriptor.manufacturerProductFamilyLower.includes(normalizedFilters.manufacturerProductFamily);

        const manufacturerProductTypeMatch =
            normalizedFilters.manufacturerProductType === '' ||
            aasOrAasDescriptor.manufacturerProductTypeLower.includes(normalizedFilters.manufacturerProductType);

        const orderCodeOfManufacturerMatch =
            normalizedFilters.orderCodeOfManufacturer === '' ||
            aasOrAasDescriptor.orderCodeOfManufacturerLower.includes(normalizedFilters.orderCodeOfManufacturer);

        const productArticleNumberOfManufacturerMatch =
            normalizedFilters.productArticleNumberOfManufacturer === '' ||
            aasOrAasDescriptor.productArticleNumberOfManufacturerLower.includes(
                normalizedFilters.productArticleNumberOfManufacturer
            );

        const productClassificationSystemMatch =
            normalizedFilters.productClassificationSystem === '' ||
            aasOrAasDescriptor.productClassificationSystemLower.includes(
                normalizedFilters.productClassificationSystem
            );

        const productClassIdMatch =
            normalizedFilters.productClassId === '' ||
            aasOrAasDescriptor.productClassIdLower.includes(normalizedFilters.productClassId);

            return (
                globalSearchMatch &&
                manufacturerNameMatch &&
                manufacturerProductDesignationMatch &&
                manufacturerProductFamilyMatch &&
                manufacturerProductTypeMatch &&
                orderCodeOfManufacturerMatch &&
                productArticleNumberOfManufacturerMatch &&
                productClassificationSystemMatch &&
                productClassIdMatch
            );
        });

        scrollToSelectedAAS();
    }

    // Function to get the AAS Data from the Registry Server
    async function initialize(): Promise<void> {
        listLoading.value = true;
        resetAttributeHydrationState();
        fetchAasDescriptorList().then(async (aasDescriptorList: Array<any>) => {
            let sortedList =
                aasDescriptorList.length > 0
                    ? aasDescriptorList.sort((a, b) => (a.id > b.id ? 1 : -1))
                    : (await fetchAasList()).sort((a, b) => (a.id > b.id ? 1 : -1));

            // Precompute lowercase search fields
            const processedList = sortedList.map((item) => ({
                ...item,
                idLower: item?.id?.toLowerCase() || '',
                idShortLower: item?.idShort?.toLowerCase() || '',
                nameLower: flattenPrimitiveValues(item?.displayName || nameToDisplay(item)).join(' ').toLowerCase(),
                descLower: flattenPrimitiveValues(item?.description || descriptionToDisplay(item)).join(' ').toLowerCase(),
                manufacturerNameLower: extractAttributeValue(item, [
                    'ManufacturerName',
                    'ManufactorName',
                    'Manufacturer',
                ]),
                manufacturerProductDesignationLower: extractAttributeValue(item, [
                    'ManufacturerProductDesignation',
                    'ProductDesignation',
                ]),
                manufacturerProductFamilyLower: extractAttributeValue(item, [
                    'ManufacturerProductFamily',
                    'ProductFamily',
                ]),
                manufacturerProductTypeLower: extractAttributeValue(item, ['ManufacturerProductType', 'ProductType']),
                orderCodeOfManufacturerLower: extractAttributeValue(item, ['OrderCodeOfManufacturer', 'OrderCode']),
                productArticleNumberOfManufacturerLower: extractAttributeValue(item, [
                    'ProductArticleNumberOfManufacturer',
                    'ProductArticleNumberOfManufacture',
                    'ManufacturerCode',
                ]),
                productClassificationSystemLower: extractAttributeValue(item, [
                    'ProductClassificationSystem',
                ]),
                productClassIdLower: extractAttributeValue(item, ['ProductClassId']),
            }));

            aasListUnfiltered.value = processedList;

            if (aasDescriptorList.length > 0) {
                enrichAttributeFields(processedList);
            }

            applyListFilters();
            listLoading.value = false;

            preloadAttributeDataInBackground();
        });
    }

    /**
     * Updates the status of each AAS descriptor in the descriptor list.
     *
     * This function checks the availability of the AAS in the repository
     * updates its status based on the result.
     *
     * @param {boolean} [init=false] - Indicates whether to initialize the status
     *                                  of descriptors. If true, sets status to
     *                                  an empty string; if false, sets it
     *                                  based on availability checks.
     */
    function updateStatus(init: boolean = false): void {
        if (Array.isArray(aasList.value) && aasList.value.length > 0)
            aasList.value.forEach(async (aasOrAasDescriptor: any) => {
                if (aasOrAasDescriptor && Object.keys(aasOrAasDescriptor).length > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 600)); // Give the UI the chance to refresh status icons

                    const aasIsAvailable = await aasIsAvailableById(aasOrAasDescriptor.id);

                    if (aasIsAvailable) {
                        aasOrAasDescriptor.status =
                            statusCheck.value.state === true ? 'online' : init ? '' : 'check disabled';
                    } else {
                        aasOrAasDescriptor.status =
                            statusCheck.value.state === true ? 'offline' : init ? '' : 'check disabled';
                    }
                }
            });
    }

    // Function to select an AAS
    function selectAAS(aas: any): void {
        if (listLoading.value) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please wait for the current Request to finish.',
            });
            return;
        }
        if (isSelected(aas)) {
            // Deselect AAS: remove aas and path url query parameter
            const query = structuredClone(route.query);
            if (Object.hasOwn(query, 'aas')) delete query.aas;
            if (Object.hasOwn(query, 'path')) delete query.path;

            router.push({ query: query });
        } else {
            // // Select AAS: Set AAS path as aas url query parameter
            // let scrollToAas = false;
            // if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            //     scrollToAas = true;
            // }

            const query = structuredClone(route.query);
            query.aas = aas.path;
            if (Object.hasOwn(query, 'path')) delete query.path;

            router.push({ query: query });

            // if (scrollToAas) scrollToSelectedAAS();
        }
    }

    function isSelected(aasOrAasDescriptor: any): boolean {
        if (
            !selectedAAS.value ||
            Object.keys(selectedAAS.value).length === 0 ||
            !selectedAAS.value.id ||
            !aasOrAasDescriptor ||
            Object.keys(aasOrAasDescriptor).length === 0 ||
            !aasOrAasDescriptor.id
        ) {
            return false;
        }
        return selectedAAS.value.id === aasOrAasDescriptor.id;
    }

    // Function to scroll to the selected AAS
    function scrollToSelectedAAS(): void {
        // Find the index of the selected item
        const index = aasList.value.findIndex((aasOrAasDescriptor: any) => isSelected(aasOrAasDescriptor));

        if (index !== -1) {
            const intervalId = setInterval(() => {
                if (
                    virtualScrollRef.value &&
                    virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
                ) {
                    // Access the scrollable container
                    virtualScrollRef.value.scrollToIndex(index);
                    clearInterval(intervalId);
                }
            }, 50);
        }
    }

    function openDeleteDialog(aasOrAasDescriptor: any): void {
        deleteDialog.value = true;
        aasToDelete.value = aasOrAasDescriptor;
    }

    function openDownloadDialog(aasDescriptor: any): void {
        downloadAASDialog.value = true;
        aasToDownload.value = aasDescriptor;
    }

    function openEditDialog(createNew: boolean, aasOrAasDescriptor?: any): void {
        editDialog.value = true;
        newShell.value = createNew;
        if (createNew === false && aasOrAasDescriptor) {
            aasToEdit.value = aasOrAasDescriptor;
        }
    }

    function createInstanceFromType(aasDescriptor: any): void {
        instanceDialog.value = true;
        aasToInstantiate.value = aasDescriptor;
    }
</script>

<style>
    .custom-loader {
        animation: loader 1s infinite;
        display: flex;
    }

    @-moz-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-webkit-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-o-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
