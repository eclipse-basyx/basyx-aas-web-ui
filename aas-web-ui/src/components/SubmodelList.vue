<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <v-card-title :style="{ padding: isMobile ? '' : '15px 16px 16px' }">
                <div v-if="!selectedAAS || Object.keys(selectedAAS).length === 0">Submodel List</div>
                <div v-else class="d-flex align-center">
                    <v-btn
                        v-if="isMobile"
                        class="ml-0"
                        variant="plain"
                        icon="mdi-chevron-left"
                        @click="backToAASList()" />
                    <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                    <span class="text-truncate ml-2">
                        {{ nameToDisplay(selectedAAS) }}
                    </span>
                </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100svh - 170px)" class="py-2 px-2">
                <div v-if="loading">
                    <v-skeleton-loader type="list-item@6"></v-skeleton-loader>
                </div>
                <template v-else>
                    <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                        <template v-if="submodelData.length > 0">
                            <!-- List of Submodels -->
                            <v-list-item
                                v-for="submodel in submodelData"
                                :key="submodel.id"
                                :active="submodel.isActive"
                                color="primarySurface"
                                base-color="listItem"
                                variant="tonal"
                                nav
                                class="mb-2"
                                style="border-width: 1px"
                                :style="{
                                    'border-color': submodel.isActive
                                        ? primaryColor + ' !important'
                                        : isDark
                                          ? '#686868 !important'
                                          : '#ABABAB !important',
                                }"
                                @click="toggleNode(submodel)">
                                <template #prepend>
                                    <v-chip label border color="primary" size="x-small" class="mr-3">SM</v-chip>
                                </template>
                                <v-list-item-title :class="submodel.isActive ? 'text-primary' : 'text-listItemText'">{{
                                    submodel.idShort
                                }}</v-list-item-title>
                            </v-list-item>
                        </template>
                        <v-empty-state
                            v-else
                            title="No existing Submodels"
                            text="The selected AAS does not contain any Submodels"
                            class="text-divider"></v-empty-state>
                    </template>
                    <template v-else>
                        <v-empty-state
                            title="No selected AAS"
                            text="Select an AAS to view its Submodels"
                            class="text-divider"></v-empty-state>
                    </template>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { formatDate } from '@/utils/DateUtils';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';
    import { URLEncode } from '@/utils/EncodeDecodeUtils';
    import { nameToDisplay } from '@/utils/ReferableUtils';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { getRequest } = useRequestHandling();
    const { smNotFound } = useSMRepositoryClient();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const submodelData = ref([] as Array<any>);
    const initialUpdate = ref(false);
    const initialNode = ref({} as any);

    // Computed Properties
    const isDark = computed(() => theme.global.current.value.dark);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const loading = computed(() => aasStore.getLoadingState);
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const primaryColor = computed(() => theme.current.value.colors.primary);

    // Watchers
    // initialize Submodel List when AAS gets selected or changes
    watch(selectedAAS, () => {
        initSubmodelList();
    });

    // Resets the Submodel List when the AAS Registry changes
    watch(aasRegistryServerURL, () => {
        if (!aasRegistryServerURL.value) {
            submodelData.value = [];
        }
    });

    // Resets the Submodel List when the Submodel Registry changes
    watch(submodelRegistryURL, () => {
        if (!submodelRegistryURL.value) {
            submodelData.value = [];
        }
    });

    onMounted(() => {
        initSubmodelListWithRouteParameters();
    });

    async function initSubmodelList() {
        // console.log('Initialize SubmodelList', this.SelectedAAS, this.initialUpdate, this.initialNode);
        // return if no endpoints are available
        if (!selectedAAS.value || !selectedAAS.value.endpoints || selectedAAS.value.endpoints.length === 0) {
            // this.navigationStore.dispatchSnackbar({ status: true, timeout: 4000, color: 'error', btnColor: 'buttonText', text: 'AAS with no (valid) Endpoint selected!' });
            submodelData.value = [];
            return;
        }
        if (loading.value && !initialUpdate.value) return; // return if loading state is true -> prevents multiple requests
        aasStore.dispatchLoadingState(true); // set loading state to true
        if (selectedAAS.value.submodels) {
            let fetchedSubmodelData = await requestSubmodels(selectedAAS.value.submodels);
            // set the isActive prop of the initialNode if it exists and the initialUpdate flag is set
            if (initialUpdate.value && initialNode.value) {
                fetchedSubmodelData.forEach((submodel: any) => {
                    if (submodel.path === initialNode.value.path) {
                        submodel.isActive = true;
                        submodel.timestamp = formatDate(new Date());
                        aasStore.dispatchSelectedNode(submodel);
                    }
                });
                initialUpdate.value = false;
                initialNode.value = {};
                submodelData.value = fetchedSubmodelData;
            } else {
                submodelData.value = fetchedSubmodelData;
            }
        } else {
            submodelData.value = [];
        }
        aasStore.dispatchLoadingState(false);
    }

    // Function to request all Submodels for the selected AAS
    async function requestSubmodels(submodelRefs: any) {
        // console.log('SubmodelRefs: ', submodelRefs);
        let submodelPromises = submodelRefs.map((submodelRef: any) => {
            // retrieve endpoint for submodel from submodel registry
            // console.log('SubmodelRef: ', submodelRef, ' Submodel Registry: ', this.submodelRegistryURL);
            // check if submodelRegistryURL includes "/submodel-descriptors" and add id if not (backward compatibility)
            let smRegistryURL = submodelRegistryURL.value;
            if (!smRegistryURL.includes('/submodel-descriptors')) {
                smRegistryURL += '/submodel-descriptors';
            }
            const submodelId = submodelRef.keys[0].value;
            let path = smRegistryURL + '/' + URLEncode(submodelId);
            let context = 'retrieving Submodel Endpoint';
            let disableMessage = false;
            return getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    if (response.data?.id) {
                        // execute if the Request was successful
                        const fetchedSubmodel = response.data;
                        // console.log('SubmodelEndpoint: ', submodelEndpoint);
                        const submodelHref = extractEndpointHref(fetchedSubmodel, 'SUBMODEL-3.0');
                        let path = submodelHref;
                        let context = 'retrieving Submodel Data';
                        let disableMessage = true;
                        return getRequest(path, context, disableMessage).then((response: any) => {
                            if (response.success && response?.data?.id) {
                                // execute if the Request was successful
                                let submodel = response.data;
                                // set the active State of the Submodel
                                submodel.isActive = false;
                                // set the Path of the Submodel
                                submodel.path = path;
                                return submodel;
                            } else {
                                return smNotFound(
                                    response,
                                    submodelId,
                                    path,
                                    "Submodel '" + submodelId + "' not found in SubmodelRepository"
                                );
                            }
                        });
                    } else {
                        return smNotFound(
                            response,
                            submodelId,
                            path,
                            "Submodel '" + submodelId + "' not found in SubmodelRegistry"
                        );
                    }
                }
            });
        });
        try {
            const submodels = await Promise.all(submodelPromises);
            return submodels;
        } finally {
            aasStore.dispatchLoadingState(false);
        }
    }

    // Function to toggle a Node
    function toggleNode(submodel: any) {
        // console.log('Selected Submodel: ', submodel);
        // dublicate the selected Node Object
        let localSubmodel = { ...submodel };
        localSubmodel.isActive = true;
        // set the isActive Property of all other Submodels to false
        submodelData.value.forEach((submodel: any) => {
            if (submodel.id !== localSubmodel.id) {
                submodel.isActive = false;
            }
        });
        // Add path of the selected Node to the URL as Router Query
        if (localSubmodel.isActive) {
            const aasEndpopint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
            if (isMobile.value) {
                // Change to SubmodelElementView on Mobile and add the path to the URL
                router.push({
                    name: 'ComponentVisualization',
                    query: {
                        aas: aasEndpopint,
                        path: localSubmodel.path,
                    },
                });
            } else {
                // just add the path to the URL
                router.push({
                    query: {
                        aas: aasEndpopint,
                        path: localSubmodel.path,
                    },
                });
            }
            aasStore.dispatchSelectedNode(localSubmodel);
        } else {
            // remove the path query from the Route entirely
            let query = { ...route.query };
            delete query.path;
            router.push({ query: query });
            aasStore.dispatchSelectedNode({});
        }
    }

    // Function to initialize the Submodel List with the Route Parameters
    function initSubmodelListWithRouteParameters() {
        // check if the selectedAAS is already set in the Store and initialize the Submodel List if so
        if (selectedAAS.value && selectedAAS.value.endpoints && selectedAAS.value.endpoints.length > 0) {
            // console.log('init Tree from Route Params: ', this.selectedAAS);
            initSubmodelList();
        }

        // check if the aas Query and the path Query are set in the URL and if so load the Submodel/Submodelelement
        const searchParams = new URL(window.location.href).searchParams;
        const aasEndpoint = searchParams.get('aas');
        const path = searchParams.get('path');

        if (aasEndpoint && path) {
            // console.log('AAS and Path Queris are set: ', aasEndpoint, path);
            let node = {} as any;
            node.path = path;
            node.isActive = true;
            // set the isActive prop of the node in submodelData to true
            initialUpdate.value = true;
            initialNode.value = node;
        }
    }

    function backToAASList() {
        router.push({ name: 'AASList', query: route.query });
    }
</script>
