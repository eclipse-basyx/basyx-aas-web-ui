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
                                        @click="loadAASListData()">
                                        <template #loader>
                                            <span class="custom-loader"><v-icon light>mdi-cached</v-icon></span>
                                        </template>
                                    </v-btn>
                                </template>
                                <span>Refresh AAS List</span>
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
                                @update:model-value="filterAasDescriptorList"></v-text-field>
                        </v-col>
                        <!-- Add existing AAS -->
                        <v-col cols="auto" class="px-0">
                            <v-menu v-if="editMode">
                                <template #activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" variant="plain" v-bind="props"></v-btn>
                                </template>
                                <v-sheet border>
                                    <v-list density="compact" class="py-0">
                                        <!-- Open Upload Dialog -->
                                        <v-tooltip
                                            v-if="allowUploading"
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
                                        <v-divider v-if="allowUploading"></v-divider>
                                        <!-- Open AAS edit dialog -->
                                        <v-tooltip open-delay="600" location="end">
                                            <template #activator="{ props }">
                                                <v-list-item slim v-bind="props" @click="openEditDialog(true)">
                                                    <template #prepend>
                                                        <v-icon size="small">mdi-plus</v-icon>
                                                    </template>
                                                    Create AAS
                                                </v-list-item>
                                            </template>
                                            <span>Creat a new AAS</span>
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
                <v-virtual-scroll
                    ref="virtualScrollRef"
                    :items="aasDescriptorList"
                    :item-height="56"
                    class="pb-2 bg-card">
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
                                activator="parent"
                                open-delay="600"
                                transition="slide-x-transition"
                                :disabled="isMobile">
                                <div class="text-caption">
                                    <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                                    {{ item.idShort }}
                                </div>
                                <div class="text-caption">
                                    <span class="font-weight-bold">{{ 'ID: ' }}</span>
                                    {{ item.id }}
                                </div>
                            </v-tooltip>
                            <template v-if="!isMobile && item.status && item.status.trim() !== ''" #prepend>
                                <!-- Feature "Full status check" - visualize all of the status 'online', 'offline', 'status-loading', 'check disabled and ''-->
                                <!-- <v-tooltip :text="'AAS status ' + item.status" class="pr-n2 mr-n2">
                                    <template #activator="{ props }">
                                        <v-icon size="small" v-bind="props" :class="statusTextClass(item.status)">
                                            {{ statusCloudIcon(item.status) || 'mdi-cloud-off-outline' }}
                                        </v-icon>
                                    </template>
                                </v-tooltip> -->
                            </template>
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
                                <v-btn
                                    v-if="!isMobile && item.status && item.status === 'offline'"
                                    icon="mdi-cloud-off"
                                    size="x-small"
                                    variant="plain"
                                    color="error"
                                    text-color="buttonText"
                                    disabled
                                    class="ml-n1"
                                    style="z-index: 9000"></v-btn>
                                <!-- <v-badge
                                    :model-value="!isMobile && item.status && item.status === 'offline'"
                                    icon="mdi-network-strength-4-alert"
                                    color="error"
                                    text-color="buttonText"
                                    inline></v-badge> -->
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
                                            <v-list-item @click="openEditDialog(false, item)">
                                                <template #prepend>
                                                    <v-icon size="x-small">mdi-pencil</v-icon>
                                                </template>
                                                <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
                                            </v-list-item>
                                            <v-list-item @click="showDeleteDialog(item)">
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
                                        @click.stop="showDeleteDialog(item)"></v-btn>
                                </template>
                            </template>
                        </v-list-item>
                    </template>
                </v-virtual-scroll>
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
    <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="loading"></DeleteAAS>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import { computed, onActivated, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { descriptionToDisplay, nameToDisplay } from '@/utils/ReferableUtils';
    // import { statusCloudIcon, statusTextClass } from '@/utils/StatusCheckUtils'; // Feature "Full status check"

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { downloadAasx, isAvailableByIdInRepo } = useAASRepositoryClient();
    const { getAasEndpoint, fetchAndDispatchAasById, fetchAasDescriptorList } = useAASHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const aasDescriptorList = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data
    const aasDescriptorListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the AAS Data before filtering
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const aasToDelete = ref({}); // Variable to store the AAS to be deleted
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const uploadAASDialog = ref(false); // Variable to store if the Upload AAS Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newShell = ref(false); // Variable to store if a new Shell should be created
    const aasToEdit = ref<any | undefined>(undefined); // Variable to store the AAS to be edited
    const statusCheckInterval = ref<number | undefined>(undefined);

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const aasRepoURL = computed(() => navigationStore.getAASRepoURL); // Get the AAS Repository URL from the Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const loading = computed(() => aasStore.getLoadingState); // Get the loading State from Store
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

    // Watchers
    watch(
        () => aasRegistryURL.value,
        async (newValue) => {
            if (newValue !== '') {
                await loadAASListData();
            }
        }
    );

    watch(
        () => selectedAAS.value,
        async () => {
            scrollToSelectedAAS();
        }
    );

    watch(
        () => statusCheck.value,
        async (statusCheckValue) => {
            window.clearInterval(statusCheckInterval.value); // clear old interval
            if (statusCheckValue.state === true) {
                aasDescriptorList.value.forEach(async (aasDescriptor: any) => {
                    aasDescriptor.status = 'status loading';
                });

                await updateStatusOfAasDescriptorList();

                // create new interval
                statusCheckInterval.value = window.setInterval(async () => {
                    await updateStatusOfAasDescriptorList();
                }, statusCheck.value.interval);
            } else {
                aasDescriptorList.value.forEach(async (aasDescriptor: any) => {
                    aasDescriptor.status = 'check disabled';
                });

                // Reset status icon after 2 seconds
                setTimeout(() => {
                    aasDescriptorList.value.forEach(async (aasDescriptor: any) => {
                        aasDescriptor.status = '';
                    });
                }, 2000);
            }
        },
        { deep: true }
    );

    watch(
        () => triggerAASListReload.value,
        async (triggerVal) => {
            if (triggerVal === true) {
                await loadAASListData();
            }
        }
    );

    onMounted(async () => {
        if (statusCheck.value.state === true) {
            window.clearInterval(statusCheckInterval.value); // clear old interval

            // create new interval
            statusCheckInterval.value = window.setInterval(async () => {
                await updateStatusOfAasDescriptorList();
            }, statusCheck.value.interval);
        }

        await loadAASListData(true);
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
    async function loadAASListData(init: boolean = false): Promise<void> {
        listLoading.value = true;

        const aasDescriptors = await fetchAasDescriptorList();
        let aasDescriptorsSorted = aasDescriptors.sort((a: { [x: string]: number }, b: { [x: string]: number }) =>
            a['id'] > b['id'] ? 1 : -1
        );

        aasDescriptorList.value = aasDescriptorsSorted;

        await updateStatusOfAasDescriptorList(init);

        aasDescriptorListUnfiltered.value = aasDescriptorList.value;

        scrollToSelectedAAS();

        listLoading.value = false;
    }

    async function updateStatusOfAasDescriptorList(init: boolean = false): Promise<void> {
        if (Array.isArray(aasDescriptorList.value) && aasDescriptorList.value.length > 0)
            aasDescriptorList.value.forEach(async (aasDescriptor: any) => {
                if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
                    if (statusCheck.value.state === true) aasDescriptor.status = 'status loading';

                    await new Promise((resolve) => setTimeout(resolve, 600)); // Give the UI the chance to refresh status icons
                    const aasIsAvailable = await isAvailableByIdInRepo(aasDescriptor.id);
                    if (aasIsAvailable) {
                        aasDescriptor.status =
                            statusCheck.value.state === true ? 'online' : init ? '' : 'check disabled';
                    } else {
                        aasDescriptor.status =
                            statusCheck.value.state === true ? 'offline' : init ? '' : 'check disabled';
                    }
                }
            });
    }

    function filterAasDescriptorList(value: string): void {
        if (!value || value.trim() === '') {
            aasDescriptorList.value = aasDescriptorListUnfiltered.value;
        } else {
            // filter list of AAS Descriptors
            let aasDescriptorListFiltered = aasDescriptorListUnfiltered.value.filter(
                (aasDescriptor: any) =>
                    aasDescriptor.id.toLowerCase().includes(value.toLowerCase()) ||
                    aasDescriptor.idShort.toLowerCase().includes(value.toLowerCase()) ||
                    nameToDisplay(aasDescriptor).toLowerCase().includes(value.toLowerCase()) ||
                    descriptionToDisplay(aasDescriptor).toLowerCase().includes(value.toLowerCase())
            );
            aasDescriptorList.value = aasDescriptorListFiltered;
        }
        scrollToSelectedAAS();
    }

    // Function to select an AAS
    async function selectAAS(aas: any): Promise<void> {
        if (loading.value) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please wait for the current Request to finish.',
            });
            return;
        }
        if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0 && selectedAAS.value.id === aas.id) {
            // Deselect AAS
            router.push({ query: {} });
            aasStore.dispatchSelectedAAS({});
        } else {
            let scrollToAasAfterDispatch = false;
            if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
                scrollToAasAfterDispatch = true;
            }

            router.push({ query: { aas: getAasEndpoint(aas) } });
            await fetchAndDispatchAasById(aas.id);

            if (scrollToAasAfterDispatch) scrollToSelectedAAS();
        }
    }

    function isSelected(aas: any): boolean {
        if (
            !selectedAAS.value ||
            Object.keys(selectedAAS.value).length === 0 ||
            !selectedAAS.value.id ||
            !aas ||
            Object.keys(aas).length === 0 ||
            !aas.id
        ) {
            return false;
        }
        return selectedAAS.value.id === aas.id;
    }

    // Function to scroll to the selected AAS
    async function scrollToSelectedAAS(): Promise<void> {
        // Find the index of the selected item
        const index = aasDescriptorList.value.findIndex((aasDescriptor: any) => isSelected(aasDescriptor));

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

    function showDeleteDialog(AAS: any): void {
        deleteDialog.value = true;
        aasToDelete.value = AAS;
    }

    function openEditDialog(createNew: boolean, aas?: any) {
        editDialog.value = true;
        newShell.value = createNew;
        if (createNew === false && aas) {
            aasToEdit.value = aas;
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
