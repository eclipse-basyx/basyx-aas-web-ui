<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <!-- Title Bar in the AAS List -->
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
                                @update:model-value="debouncedFilterAasList"></v-text-field>
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
                                    v-if="item.id || item.idShort"
                                    activator="parent"
                                    open-delay="600"
                                    transition="slide-x-transition"
                                    :disabled="isMobile">
                                    <div v-if="item.idShort" class="text-caption">
                                        <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                                        {{ item.idShort }}
                                    </div>
                                    <div v-if="item.id" class="text-caption">
                                        <span class="font-weight-bold">{{ 'ID: ' }}</span>
                                        {{ item.id }}
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
                                                <v-list-item @click="downloadAasx(item)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">mdi-download</v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Download AAS</v-list-item-subtitle>
                                                </v-list-item>
                                                <v-divider></v-divider>
                                                <!-- Copy SM endpoint to clipboard -->
                                                <v-list-item
                                                    @click="copyToClipboard(item.path, 'SM endpoint', copyIconAsRef)">
                                                    <template #prepend>
                                                        <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                                    </template>
                                                    <v-list-item-subtitle>Copy AAS endpoint</v-list-item-subtitle>
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
                                            @click.stop="downloadAasx(item)"></v-btn>
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
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import debounce from 'lodash/debounce';
    import { computed, onActivated, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useClipboardUtil } from '@/composables/ClipboardUtil';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { downloadAasx } = useAASRepositoryClient();
    const { fetchAasDescriptorList, fetchAasList, aasIsAvailableById } = useAASHandling();
    const { nameToDisplay, descriptionToDisplay } = useReferableUtils();
    const { copyToClipboard } = useClipboardUtil();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const aasList = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data (AAS or AAS Descriptors)
    const aasListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data before filtering
    const debouncedFilterAasList = debounce(filterAasList, 300); // Debounced function to filter the AAS List
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const aasToDelete = ref({}); // Variable to store the AAS to be deleted
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const uploadAASDialog = ref(false); // Variable to store if the Upload AAS Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newShell = ref(false); // Variable to store if a new Shell should be created
    const aasToEdit = ref<any | undefined>(undefined); // Variable to store the AAS to be edited
    const statusCheckInterval = ref<number | undefined>(undefined);
    const copyIcon = ref<string>('mdi-clipboard-file-outline');

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const aasRepoURL = computed(() => navigationStore.getAASRepoURL); // Get the AAS Repository URL from the Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const primaryColor = computed(() => theme.current.value.colors.primary); // returns the primary color of the current theme
    const triggerAASListReload = computed(() => navigationStore.getTriggerAASListReload); // Get the trigger signal for AAS List reload from store
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

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            initialize();
        }
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

    onMounted(() => {
        if (statusCheck.value.state === true) {
            window.clearInterval(statusCheckInterval.value); // clear old interval

            // create new interval
            statusCheckInterval.value = window.setInterval(() => {
                updateStatus();
            }, statusCheck.value.interval);
        }

        initialize();
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

    // Function to get the AAS Data from the Registry Server
    async function initialize(): Promise<void> {
        listLoading.value = true;
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
                nameLower: nameToDisplay(item).toLowerCase(),
                descLower: descriptionToDisplay(item).toLowerCase(),
            }));

            aasList.value = processedList;
            aasListUnfiltered.value = processedList;
            scrollToSelectedAAS();
            listLoading.value = false;
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

    function filterAasList(value: string): void {
        if (!value || value.trim() === '') {
            aasList.value = aasListUnfiltered.value;
        } else {
            const search = value.toLowerCase();
            aasList.value = aasListUnfiltered.value.filter(
                (aasOrAasDescriptor) =>
                    aasOrAasDescriptor.idLower.includes(search) ||
                    aasOrAasDescriptor.idShortLower.includes(search) ||
                    aasOrAasDescriptor.nameLower.includes(search) ||
                    aasOrAasDescriptor.descLower.includes(search)
            );
        }
        scrollToSelectedAAS();
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
            // Deselect AAS: remove entire query
            router.push({ query: {} });
        } else {
            // // Select AAS: Add aasEndpoint to aas query
            // let scrollToAas = false;
            // if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            //     scrollToAas = true;
            // }

            router.push({ query: { aas: aas.path } });

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

    function openEditDialog(createNew: boolean, aasOrAasDescriptor?: any): void {
        editDialog.value = true;
        newShell.value = createNew;
        if (createNew === false && aasOrAasDescriptor) {
            aasToEdit.value = aasOrAasDescriptor;
        }
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
