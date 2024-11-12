<template>
    <v-container class="pa-0" fluid>
        <v-card color="card" elevation="0">
            <!-- Title Bar in the AAS List -->
            <v-card-title id="titleAasList" class="pl-1 pr-3">
                <v-row align="center">
                    <!-- Reload Button -->
                    <v-col cols="auto" class="pr-0">
                        <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
                            <template #activator="{ props }">
                                <v-btn
                                    icon="mdi-reload"
                                    variant="plain"
                                    :loading="listLoading"
                                    v-bind="props"
                                    @click="reloadList()">
                                    <template #loader>
                                        <span class="custom-loader"><v-icon light>mdi-cached</v-icon></span>
                                    </template>
                                </v-btn>
                            </template>
                            <span>Refresh AAS List</span>
                        </v-tooltip>
                    </v-col>
                    <!-- AAS Search Field -->
                    <v-col class="pl-1 pr-0">
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
                        <!-- <RegisterAAS></RegisterAAS> -->
                        <UploadAAS></UploadAAS>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <!-- AAS List -->
            <v-list nav class="bg-card card pa-0">
                <v-virtual-scroll
                    :items="AASData"
                    item-height="48"
                    :height="isMobile ? 'calc(100svh - 170px)' : 'calc(100vh - 218px)'"
                    class="pb-2 bg-card">
                    <template #default="{ item }">
                        <!-- Single AAS -->
                        <v-list-item
                            class="bg-listItem mt-2 mx-2"
                            style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
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
                                <div class="text-primary" style="z-index: 9999">{{ aasNameToDisplay(item) }}</div>
                            </template>
                            <!-- id of the AAS -->
                            <template v-if="drawerState" #subtitle>
                                <div>{{ item['id'] }}</div>
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
                                <!-- Information Button -->
                                <v-btn
                                    icon="mdi-information-outline"
                                    size="x-small"
                                    variant="plain"
                                    style="z-index: 9000"
                                    @click.stop="showAASDetails(item)"></v-btn>
                                <!-- Download AAS -->
                                <v-btn
                                    v-if="aasRepoURL"
                                    icon="mdi-download"
                                    size="x-small"
                                    variant="plain"
                                    style="z-index: 9000; margin-left: -6px"
                                    @click.stop="downloadAAS(item)"></v-btn>
                                <!-- Remove from AAS Registry Button -->
                                <v-btn
                                    icon="mdi-close"
                                    size="x-small"
                                    variant="plain"
                                    style="z-index: 9000; margin-left: -6px"
                                    @click.stop="showDeleteDialog(item)"></v-btn>
                            </template>
                            <v-overlay
                                :model-value="isSelected(item)"
                                scrim="primary"
                                style="opacity: 0.2"
                                contained
                                persistent></v-overlay>
                        </v-list-item>
                    </template>
                </v-virtual-scroll>
            </v-list>
            <!-- AAS Details (only visible if the Information Button is pressed on an AAS) -->
            <AASListDetails
                :details-object="detailsObject"
                :show-details-card="showDetailsCard"
                @close-details="showDetailsCard = false" />
            <!-- Collapse/extend Sidebar Button -->
            <v-list
                v-if="!isMobile"
                id="closeAasList"
                nav
                style="width: 100%; z-index: 9000"
                class="bg-detailsCard pa-0">
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
    <v-dialog v-model="deleteDialogShowing" max-width="500px">
        <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <span>Are you sure you want to delete the AAS?</span>
                <v-checkbox v-model="deleteSubmodels" label="Also delete Submodels" hide-details></v-checkbox>
                <v-alert v-if="deleteSubmodels" class="mb-2" variant="tonal" border color="warning"
                    >Warning: If other shells refer to the same submodels, those references are not deleted!</v-alert
                >
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialogShowing = false">Cancel</v-btn>
                <v-btn variant="tonal" color="error" :loading="deleteLoading" @click="confirmDelete">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import AASListDetails from './AASListDetails.vue';
    // import RegisterAAS from './RegisterAAS.vue';
    import UploadAAS from './UploadAAS.vue';

    export default defineComponent({
        name: 'AASList',
        components: {
            AASListDetails, // AAS Details Component
            // RegisterAAS,    // Register AAS Component
            UploadAAS, // Upload AAS Component
        },
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const route = useRoute();
            const router = useRouter();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        data() {
            return {
                AASData: [], // Variable to store the AAS Data
                unfilteredAASData: [], // Variable to store the AAS Data before filtering
                detailsObject: {} as any, // Variable to store the AAS Data of the currently selected AAS
                showDetailsCard: false, // Variable to store if the Details Card should be shown
                listLoading: false, // Variable to store if the AAS List is loading
                deleteDialogShowing: false, // Variable to store if the Delete Dialog should be shown
                deleteSubmodels: false, // Variable to store if the Submodels should be deleted
                aasToDelete: {} as any, // Variable to store the AAS to be deleted
                deleteLoading: false, // Variable to store if the AAS is being deleted
            };
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            // get Drawer State from store
            drawerState() {
                // Computed Property to control the state of the Navigation Drawer (true -> collapsed, false -> extended)
                return this.navigationStore.getDrawerState;
            },

            // get AAS Registry URL from Store
            aasRegistryURL() {
                return this.navigationStore.getAASRegistryURL;
            },

            // get Submodel Registry URL from Store
            submodelRegistryURL() {
                return this.navigationStore.getSubmodelRegistryURL;
            },

            // get the selected AAS from Store
            selectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // gets loading State from Store
            loading() {
                return this.aasStore.getLoadingState;
            },

            // returns the primary color of the current theme
            primaryColor() {
                return this.$vuetify.theme.themes.light.colors.primary;
            },

            // get the status-check state from the store
            statusCheck() {
                return this.navigationStore.getStatusCheck;
            },

            // get trigger signal for AAS List reload from store
            triggerAASListReload() {
                return this.navigationStore.getTriggerAASListReload;
            },

            // Get the AAS Repository URL from the Store
            aasRepoURL() {
                return this.navigationStore.getAASRepoURL;
            },
        },

        watch: {
            // Watch the AAS Registry URL for changes and reload the AAS List if the URL changes
            aasRegistryURL() {
                if (this.aasRegistryURL !== '') {
                    this.reloadList();
                    if (this.statusCheck) {
                        this.addConnectionInterval();
                    }
                } else {
                    this.AASData = [];
                }
            },

            // watch for changes in the status-check state and add/remove the connection interval
            statusCheck() {
                if (this.statusCheck) {
                    this.addConnectionInterval();
                }
            },

            // watch for changes in the trigger for AAS List reload
            triggerAASListReload(triggerVal) {
                if (triggerVal === true) {
                    this.reloadList();
                    this.navigationStore.dispatchTriggerAASListReload(false);
                }
            },
        },

        mounted() {
            // Load the AAS List on Startup if the AAS Registry URL is set
            if (this.aasRegistryURL !== '') {
                this.getAASData();
            }

            // check if the aas Query is set in the URL and if so load the AAS
            const searchParams = new URL(window.location.href).searchParams;
            const aasEndpoint = searchParams.get('aas');
            if (aasEndpoint) {
                // console.log('AAS Query is set: ', aasEndpoint);
                let aas = {} as any;
                let endpoints = [];
                endpoints.push({ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' });
                aas.endpoints = endpoints;
                // dispatch the AAS set by the URL to the store
                this.aasStore.dispatchSelectedAAS(aas);
            }

            // check if the status-check is set in the local storage and if so set the status-check state in the store
            const statusCheck = localStorage.getItem('statusCheck');
            if (statusCheck) {
                // console.log('Status Check is set: ', statusCheck);
                this.navigationStore.dispatchUpdateStatusCheck(statusCheck === 'true');
            }
        },

        methods: {
            // Function to determine the name of the aas to be displayed
            aasNameToDisplay(AAS: any) {
                if (AAS.displayName) {
                    let displayNameEn = AAS.displayName.find((displayName: any) => {
                        return displayName.language === 'en' && displayName.text !== '';
                    });
                    if (displayNameEn && displayNameEn.text) return displayNameEn.text;
                }
                return AAS.idShort ? AAS.idShort : '';
            },
            // Function to collapse the Sidebar
            collapseSidebar() {
                this.navigationStore.dispatchDrawerState(false);
            },
            // Function to get the AAS Data from the Registry Server
            getAASData() {
                this.listLoading = true;
                // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
                if (!this.aasRegistryURL.includes('/shell-descriptors')) {
                    this.aasRegistryURL += '/shell-descriptors';
                }
                let path = this.aasRegistryURL;
                let context = 'retrieving AAS Data';
                let disableMessage = false;
                this.getRequest(path, context, disableMessage).then((response: any) => {
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
                        this.AASData = Object.freeze(sortedData); // store the sorted data in the AASData variable
                        this.unfilteredAASData = sortedData; // make a copy of the sorted data and store it in the unfilteredAASData variable
                        if (this.statusCheck) {
                            this.checkAASStatus(); // check the AAS Status
                        }
                    } else {
                        // execute if the AAS Registry Server is not found
                        this.navigationStore.dispatchAASRegistryURL(''); // clear the URL in the NavigationStore
                    }
                    this.listLoading = false;
                });
            },

            // Function which adds an Interval to check if the Shells in the AAS Registry are still available
            addConnectionInterval() {
                // check if the AAS Registry URL is set
                if (this.aasRegistryURL !== '') {
                    // add an Interval to check if the Shells in the AAS Registry are still available
                    setInterval(() => {
                        // Check if the AAS is online
                        this.checkAASStatus();
                    }, 30000); // check every 60 seconds
                }
            },

            // Function to check the AAS Status
            checkAASStatus() {
                // console.log('Check AAS Status: ', AAS);
                // iterate over all AAS in the AAS List
                this.AASData.forEach((AAS: any) => {
                    const shellHref = this.extractEndpointHref(AAS, 'AAS-3.0');
                    let path = shellHref;
                    let context = 'evaluating AAS Status';
                    let disableMessage = true;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            // execute if the AAS Registry is found
                            AAS.status = 'online';
                        } else {
                            // execute if the AAS Registry is not found
                            AAS.status = 'offline';
                        }
                    });
                });
            },

            // Function to reload the AAS List
            reloadList() {
                this.getAASData();
            },

            // Function to filter the AAS List
            filterAASList(value: string) {
                // console.log('Filter AAS List: ', value);
                // if the Search Field is empty, show all AAS
                if (value === '' || value === null) {
                    this.AASData = this.unfilteredAASData;
                } else {
                    // filter the AAS List by the Search Field Value
                    let filteredAASData = this.unfilteredAASData.filter((AAS: { [x: string]: string }) =>
                        AAS['idShort'].toLowerCase().includes(value.toLowerCase())
                    );
                    this.AASData = filteredAASData;
                }
            },

            // Function to select an AAS
            selectAAS(AAS: any) {
                // console.log('Select AAS: ', AAS);
                // return if loading state is true -> prevents multiple requests
                if (this.loading) {
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Please wait for the current Request to finish.',
                    });
                    return;
                }
                const shellHref = this.extractEndpointHref(AAS, 'AAS-3.0');
                if (this.isMobile) {
                    // Change to Treeview add AAS Endpoint as Query to the Router
                    this.router.push({
                        path: '/submodellist',
                        query: { aas: shellHref },
                    });
                } else {
                    // Add AAS Endpoint as Query to the Router
                    this.router.push({ query: { aas: shellHref } });
                }
                // dispatch the selected AAS to the Store
                this.aasStore.dispatchSelectedAAS(AAS);
                // trigger the AAS Selected Event
                this.navigationStore.dispatchTriggerAASSelected();
            },

            // Function to download the AAS
            downloadAAS(AAS: any) {
                // console.log('Download AAS: ', AAS);
                // request the Submodel references for the AAS
                const shellHref = this.extractEndpointHref(AAS, 'AAS-3.0');
                let path = shellHref + '/submodel-refs';
                let context = 'retrieving Submodel References';
                let disableMessage = false;
                this.getRequest(path, context, disableMessage).then(async (response: any) => {
                    if (response.success) {
                        // execute if the Request was successful
                        const submodelRefs = response.data.result;
                        const aasIds = this.URLEncode(AAS.id);
                        // extract all references in an Array calles submodelIds from each keys[0].value
                        let submodelIds = [] as any;
                        submodelRefs.forEach((submodelRef: any) => {
                            submodelIds.push(this.URLEncode(submodelRef.keys[0].value));
                        });
                        // console.log('aasIds: ', aasIds, ' submodelIds: ', submodelIds);
                        // strip the everything after the last slash from the getAASRepoURL (http://localhost:1500/shells -> http://localhost:1500)
                        let path = this.aasRepoURL.substring(0, this.aasRepoURL.lastIndexOf('/'));
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
                        this.getRequest(path, context, disableMessage, headers).then(async (response: any) => {
                            if (response.success) {
                                // execute if the Request was successful
                                let aasSerialization = response.data;
                                this.downloadFile(AAS.idShort + '.aasx', aasSerialization);
                            }
                        });
                    }
                });
            },

            // checks if the AAS is selected
            isSelected(AAS: any) {
                if (
                    this.selectedAAS === undefined ||
                    this.selectedAAS === null ||
                    Object.keys(this.selectedAAS).length === 0
                ) {
                    return false;
                }
                const shellHrefAASfromList = this.extractEndpointHref(AAS, 'AAS-3.0');
                const shellHrefSelectedAAS = this.extractEndpointHref(this.selectedAAS, 'AAS-3.0');
                let isSelected = shellHrefAASfromList === shellHrefSelectedAAS;
                if (isSelected && this.showDetailsCard) {
                    // update data of detailsCard
                    this.detailsObject = AAS;
                }
                return isSelected;
            },

            // Function to display the AAS Details
            showAASDetails(AAS: any) {
                // console.log('Show Details: ', AAS);
                this.detailsObject = AAS;
                if (AAS) this.showDetailsCard = true;
            },

            // Function to remove the AAS from the AAS Registry
            removeFromAASRegistry(AAS: any) {
                // console.log('Remove AAS: ', AAS);
                // return if loading state is true -> prevents multiple requests
                if (this.loading) {
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Please wait for the current Request to finish.',
                    });
                    return;
                }
                // show a confirmation Dialog to delete the AAS
                if (confirm('Are you sure you want to delete the AAS from the AAS Registry?')) {
                    // execute if the user confirms the removal
                    // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
                    if (!this.aasRegistryURL.includes('/shell-descriptors')) {
                        this.aasRegistryURL += '/shell-descriptors';
                    }
                    let path = this.aasRegistryURL + '/' + this.URLEncode(AAS.id);
                    let context = 'removing AAS from AAS Registry';
                    let disableMessage = false;
                    this.deleteRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            // execute if deletion was successful
                            this.reloadList(); // reload the AAS List
                        }
                    });
                }
            },

            removeAAS(AAS: any) {
                // console.log('Remove AAS: ', AAS);
                // return if loading state is true -> prevents multiple requests
                if (this.loading) {
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Please wait for the current Request to finish.',
                    });
                    return;
                }
                // console.log('Remove AAS: ', AAS);
                const shellHref = this.extractEndpointHref(AAS, 'AAS-3.0');
                let path = shellHref;
                let context = 'removing AAS';
                let disableMessage = false;
                this.deleteRequest(path, context, disableMessage);
            },

            async confirmDelete() {
                this.deleteLoading = true;
                let error = false;
                try {
                    if (this.deleteSubmodels) {
                        const shellHref = this.extractEndpointHref(this.aasToDelete, 'AAS-3.0');
                        const path = shellHref + '/submodel-refs';
                        const context = 'retrieving Submodel References';
                        const disableMessage = false;
                        const response = await this.getRequest(path, context, disableMessage);
                        if (response.success) {
                            const submodelRefs = response.data.result;
                            // Extract all references in an array called submodelIds from each keys[0].value
                            const submodelIds = submodelRefs.map((ref: any) => ref.keys[0].value);
                            this.removeAAS(this.aasToDelete);
                            // Remove each submodel
                            for (const submodelId of submodelIds) {
                                const submodelPath = `${this.submodelRegistryURL}/${this.URLEncode(submodelId)}`;
                                const submodelResponse = await this.getRequest(
                                    submodelPath,
                                    'Removing Submodels',
                                    disableMessage
                                );
                                if (submodelResponse.success) {
                                    const submodelHref = this.extractEndpointHref(
                                        submodelResponse.data,
                                        'SUBMODEL-3.0'
                                    );
                                    const deletePath = submodelHref;
                                    await this.deleteRequest(deletePath, 'removing Submodel', disableMessage);
                                } else {
                                    error = true;
                                }
                            }
                        } else {
                            error = true;
                        }
                    } else {
                        this.removeAAS(this.aasToDelete);
                    }
                } finally {
                    this.deleteDialogShowing = false;
                    this.aasToDelete = {};
                    this.deleteSubmodels = false;
                    if (!error) {
                        //remove query from URL
                        this.router.push({ path: this.route.path, query: {} });
                        this.aasStore.dispatchSelectedAAS({});
                        this.aasStore.dispatchSelectedNode({});
                        this.reloadList(); // reload the AAS List
                        this.navigationStore.dispatchTriggerAASSelected();
                    }
                    this.deleteLoading = false;
                }
            },

            showDeleteDialog(AAS: any) {
                this.deleteDialogShowing = true;
                this.aasToDelete = AAS;
            },
        },
    });
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
