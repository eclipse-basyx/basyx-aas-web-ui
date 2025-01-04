<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <!-- Title Bar in the AAS List -->
            <v-card-title v-if="singleAas && !isMobile" style="padding: 16px 16px 16px"> Asset & AAS </v-card-title>
            <v-card-title v-if="!singleAas">
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
                    <v-col class="px-0">
                        <v-text-field
                            variant="outlined"
                            density="compact"
                            hide-details
                            label="Search for AAS..."
                            clearable
                            @update:model-value="filterAASList"></v-text-field>
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
                        <v-tooltip v-else open-delay="600" :location="editMode ? 'end' : 'bottom'" :disabled="isMobile">
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
            <v-divider v-if="!singleAas"></v-divider>
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
                <v-virtual-scroll ref="virtualScrollRef" :items="AASData" :item-height="56" class="pb-2 bg-card">
                    <template #default="{ item }">
                        <!-- Single AAS -->
                        <v-list-item
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
                                    <span class="font-weight-bold">{{ 'idShort: ' }}</span
                                    >{{ item['idShort'] }}
                                </div>
                                <div class="text-caption">
                                    <span class="font-weight-bold">{{ 'ID: ' }}</span
                                    >{{ item['id'] }}
                                </div>
                            </v-tooltip>
                            <!-- idShort of the AAS -->
                            <template v-if="drawerState" #title>
                                <div class="text-primary" style="z-index: 9999">{{ nameToDisplay(item) }}</div>
                            </template>
                            <!-- id of the AAS -->
                            <template v-if="drawerState" #subtitle>
                                <div class="text-listItemText">{{ item['id'] }}</div>
                            </template>
                            <!-- open Details Button (with Status Badge) -->
                            <template v-if="drawerState" #append>
                                <!-- Badge that show's the Status of the AAS -->
                                <v-badge
                                    :model-value="item['status'] && item['status'] == 'offline'"
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
                                            <v-list-item @click="downloadAAS(item)">
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
                                        style="z-index: 9000; margin-left: -6px"
                                        @click.stop="downloadAAS(item)"></v-btn>
                                    <!-- Remove from AAS Registry Button -->
                                    <v-btn
                                        icon="mdi-close"
                                        size="x-small"
                                        variant="plain"
                                        color="listItemText"
                                        style="z-index: 9000; margin-left: -6px"
                                        @click.stop="showDeleteDialog(item)"></v-btn>
                                </template>
                            </template>
                        </v-list-item>
                    </template>
                </v-virtual-scroll>
            </v-list>
            <!-- AAS Details (only visible if the Information Button is pressed on an AAS) -->
            <AASListDetails v-if="selectedAAS && Object.keys(selectedAAS).length > 0" :status="AASStatus" />
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
    <AAS v-model="editDialog" :new-shell="newShell" :aas="aasToEdit"></AAS>
    <!-- Dialog for uploading AAS -->
    <UploadAAS v-model="uploadAASDialog"></UploadAAS>
    <!-- Dialog for deleting AAS -->
    <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="loading"></DeleteAAS>
</template>

<script lang="ts" setup>
    import type { ComponentPublicInstance } from 'vue';
    import { computed, onActivated, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';
    import { URLEncode } from '@/utils/EncodeDecodeUtils';
    import { downloadFile } from '@/utils/generalUtils';
    import { nameToDisplay } from '@/utils/ReferableUtils';

    // Extend the ComponentPublicInstance type to include scrollToIndex
    interface VirtualScrollInstance extends ComponentPublicInstance {
        scrollToIndex: (index: number) => void;
    }

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // composables
    const { getRequest } = useRequestHandling();
    const { fetchAndDispatchAas } = useAASRepositoryClient();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const AASData = ref([]); // Variable to store the AAS Data
    const unfilteredAASData = ref([]); // Variable to store the AAS Data before filtering
    const listLoading = ref(false); // Variable to store if the AAS List is loading
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const aasToDelete = ref({}); // Variable to store the AAS to be deleted
    const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null); // Reference to the Virtual Scroll Component
    const AASStatus = ref(''); // Variable to store the AAS Status
    const uploadAASDialog = ref(false); // Variable to store if the Upload AAS Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newShell = ref(false); // Variable to store if a new Shell should be created
    const aasToEdit = ref<any | undefined>(undefined); // Variable to store the AAS to be edited

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const isDark = computed(() => theme.global.current.value.dark); // Check if the current Theme is dark
    const drawerState = computed(() => navigationStore.getDrawerState); // Get Drawer State from store (true -> collapsed, false -> extended)
    const aasRepoURL = computed(() => navigationStore.getAASRepoURL); // Get the AAS Repository URL from the Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // Get AAS Registry URL from Store
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const loading = computed(() => aasStore.getLoadingState); // Get the loading State from Store
    const primaryColor = computed(() => theme.current.value.colors.primary); // returns the primary color of the current theme
    const statusCheck = computed(() => navigationStore.getStatusCheck); // Get the status-check state from the store
    const triggerAASListReload = computed(() => navigationStore.getTriggerAASListReload); // Get the trigger signal for AAS List reload from store
    const triggerAASListScroll = computed(() => navigationStore.getTriggerAASListScroll); // Get the trigger signal for AAS List scroll from store
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

    // Watchers
    // Watch the AAS Registry URL for changes and reload the AAS List if the URL changes
    watch(
        () => aasRegistryURL.value,
        (newValue) => {
            if (newValue !== '') {
                loadAASListData();
                if (statusCheck.value) {
                    addConnectionInterval();
                }
            } else {
                AASData.value = [];
            }
        }
    );

    // watch for changes in the status-check state and add/remove the connection interval
    watch(
        () => statusCheck.value,
        (newValue) => {
            if (newValue) {
                addConnectionInterval();
            }
        }
    );

    // watch for changes in the trigger for AAS List reload
    watch(
        () => triggerAASListReload.value,
        (triggerVal) => {
            if (triggerVal === true) {
                loadAASListData();
                navigationStore.dispatchTriggerAASListReload(false);
            }
        }
    );

    // watch for changes in the trigger for AAS List scroll
    watch(
        () => triggerAASListScroll.value,
        () => {
            scrollToSelectedAAS();
        }
    );

    onMounted(() => {
        // Load the AAS List on Startup if the AAS Registry URL is set
        if (aasRegistryURL.value !== '' && !singleAas.value) {
            loadAASListData();
        }

        // check if the status-check is set in the local storage and if so set the status-check state in the store
        const statusCheck = localStorage.getItem('statusCheck');
        if (statusCheck) {
            navigationStore.dispatchUpdateStatusCheck(statusCheck === 'true');
        }
    });

    onActivated(() => {
        scrollToSelectedAAS();
    });

    function collapseSidebar() {
        navigationStore.dispatchDrawerState(false);
    }

    // Function to get the AAS Data from the Registry Server
    function loadAASListData() {
        listLoading.value = true;

        // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
        let aasRegURL = aasRegistryURL.value;
        if (!aasRegistryURL.value.includes('/shell-descriptors')) {
            aasRegURL += '/shell-descriptors';
        }

        const path = aasRegURL;
        const context = 'retrieving AAS Data';
        const disableMessage = false;

        getRequest(path, context, disableMessage).then((response: any) => {
            if (response.success) {
                // execute if the AAS Registry is found
                // sort data by identification id (ascending) and store it in the AASData variable
                let registeredAAS = response.data.result;
                let sortedData = registeredAAS.sort((a: { [x: string]: number }, b: { [x: string]: number }) =>
                    a['id'] > b['id'] ? 1 : -1
                );

                // add status online to the AAS Data
                sortedData.forEach((AAS: any) => {
                    AAS['status'] = 'check disabled';
                });
                AASData.value = Object.freeze(sortedData); // store the sorted data in the AASData variable
                unfilteredAASData.value = sortedData; // make a copy of the sorted data and store it in the unfilteredAASData variable
                scrollToSelectedAAS(); // scroll to the selected AAS
                if (statusCheck.value) checkAASStatus(); // check the AAS Status
            }
            listLoading.value = false;
        });
    }

    // Function which adds an Interval to check if the Shells in the AAS Registry are still available
    function addConnectionInterval() {
        // check if the AAS Registry URL is set
        if (aasRegistryURL.value !== '') {
            // add an Interval to check if the Shells in the AAS Registry are still available
            setInterval(() => {
                // Check if the AAS is online
                checkAASStatus();
            }, 30000); // check every 60 seconds
        }
    }

    // Function to check the AAS Status
    function checkAASStatus() {
        // console.log('Check AAS Status');
        // iterate over all AAS in the AAS List
        AASData.value.forEach((AAS: any) => {
            const aasEndpopint = extractEndpointHref(AAS, 'AAS-3.0');
            let path = aasEndpopint;
            let context = 'evaluating AAS Status';
            let disableMessage = true;
            getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    // execute if the AAS Registry is found
                    AAS.status = 'online';
                } else {
                    // execute if the AAS Registry is not found
                    AAS.status = 'offline';
                }
            });
        });
    }

    // Function to filter the AAS List
    function filterAASList(value: string) {
        // console.log('Filter AAS List: ', value);
        // if the Search Field is empty, show all AAS
        if (value === '' || value === null) {
            AASData.value = unfilteredAASData.value;
        } else {
            // filter the AAS List by the Search Field Value
            let filteredAASData = unfilteredAASData.value.filter((AAS: { [x: string]: string }) =>
                AAS['idShort'].toLowerCase().includes(value.toLowerCase())
            );
            AASData.value = filteredAASData;
        }
    }

    // Function to select an AAS
    async function selectAAS(AAS: any) {
        // console.log('Select AAS: ', AAS);
        // return if loading state is true -> prevents multiple requests
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
        if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0 && selectedAAS.value.id === AAS.id) {
            // Deselect AAS
            AASStatus.value = '';
            router.push({ query: {} });
            aasStore.dispatchSelectedAAS({});
        } else {
            let scrollToAasAfterDispatch = false;
            if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
                scrollToAasAfterDispatch = true;
            }
            // Select AAS
            AASStatus.value = AAS.status;
            const aasEndpoint = extractEndpointHref(AAS, 'AAS-3.0');
            // Add AAS Endpoint as Query to the Router
            router.push({ query: { aas: aasEndpoint } });
            // dispatch the selected AAS to the Store
            await fetchAndDispatchAas(aasEndpoint);
            if (scrollToAasAfterDispatch) scrollToSelectedAAS();
        }
    }

    // checks if the AAS is selected
    function isSelected(AAS: any) {
        if (
            selectedAAS.value === undefined ||
            selectedAAS.value === null ||
            Object.keys(selectedAAS.value).length === 0
        ) {
            return false;
        }
        const aasEndpointFromList = extractEndpointHref(AAS, 'AAS-3.0');
        const aasEndpointSelected = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
        let isSelected = aasEndpointFromList === aasEndpointSelected;
        if (isSelected) {
            AASStatus.value = AAS.status;
        }
        return isSelected;
    }

    // Function to scroll to the selected AAS
    async function scrollToSelectedAAS() {
        // Find the index of the selected item
        const index = AASData.value.findIndex((item: any) => isSelected(item));

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

    // Function to download the AAS
    function downloadAAS(AAS: any) {
        // console.log('Download AAS: ', AAS);
        // request the Submodel references for the AAS
        const aasEndpopint = extractEndpointHref(AAS, 'AAS-3.0');
        let path = aasEndpopint + '/submodel-refs';
        let context = 'retrieving Submodel References';
        let disableMessage = false;
        getRequest(path, context, disableMessage).then(async (response: any) => {
            if (response.success) {
                // execute if the Request was successful
                const submodelRefs = response.data.result;
                const aasIds = URLEncode(AAS.id);
                // extract all references in an Array calles submodelIds from each keys[0].value
                let submodelIds = [] as any;
                submodelRefs.forEach((submodelRef: any) => {
                    submodelIds.push(URLEncode(submodelRef.keys[0].value));
                });
                // console.log('aasIds: ', aasIds, ' submodelIds: ', submodelIds);
                // strip the everything after the last slash from the getAASRepoURL (http://localhost:1500/shells -> http://localhost:1500)
                let path = aasRepoURL.value.substring(0, aasRepoURL.value.lastIndexOf('/'));
                // add the aasIds and submodelIds to the path (example: http://localhost:1500/serialization?aasIds=abc&submodelIds=def&submodelIds=ghi&includeConceptDescriptions=true)
                path +=
                    '/serialization?aasIds=' +
                    aasIds +
                    '&submodelIds=' +
                    submodelIds.join('&submodelIds=') +
                    '&includeConceptDescriptions=true';
                let context = 'retrieving AAS serialization';
                let disableMessage = false;
                let headers = new Headers();
                headers.append('Accept', 'application/asset-administration-shell-package+xml');
                getRequest(path, context, disableMessage, headers).then(async (response: any) => {
                    if (response.success) {
                        // execute if the Request was successful
                        let aasSerialization = response.data;
                        downloadFile(AAS.idShort + '.aasx', aasSerialization);
                    }
                });
            }
        });
    }

    function showDeleteDialog(AAS: any) {
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
