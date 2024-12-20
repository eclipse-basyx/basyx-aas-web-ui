<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <v-card-title style="padding: 15px 16px 16px">
                <!-- TODO: Add Searchfield to filter the Treeview -->
                <v-row align="center">
                    <v-col cols="auto">
                        <span>AAS Treeview</span>
                    </v-col>
                    <v-col v-if="nameToDisplay(selectedAAS)" cols="auto" class="pl-1 pt-2">
                        <v-chip size="x-small" color="primary" label border>{{
                            'AAS: ' + nameToDisplay(selectedAAS)
                        }}</v-chip>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100vh - 170px)">
                <div v-if="loading">
                    <v-list-item v-for="i in 6" :key="i" density="compact" nav class="pa-0">
                        <template #prepend>
                            <v-skeleton-loader type="list-item" :width="50"></v-skeleton-loader>
                        </template>
                        <template #title>
                            <v-skeleton-loader type="list-item" :width="240"></v-skeleton-loader>
                        </template>
                        <template #append>
                            <v-skeleton-loader type="list-item" :width="90"></v-skeleton-loader>
                        </template>
                    </v-list-item>
                </div>
                <template v-else>
                    <v-empty-state
                        v-if="selectedAAS && Object.keys(selectedAAS).length > 0 && submodelData.length === 0"
                        title="No existing Submodels"
                        text="The selected AAS does not contain any Submodels"
                        class="text-divider"></v-empty-state>
                    <!-- TODO: Replace with Vuetify Treeview Component when it get's released in Q1 2023 -->
                    <VTreeview
                        v-for="item in submodelData"
                        :key="item.id"
                        class="root"
                        :item="item"
                        :depth="0"></VTreeview>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import VTreeview from '@/components/UIComponents/VTreeview.vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';
    import { URLEncode } from '@/utils/EncodeDecodeUtils';
    import { UUID } from '@/utils/IDUtils';
    import { nameToDisplay } from '@/utils/ReferableUtils';

    // Composables
    const { smNotFound } = useSMRepositoryClient();
    const { getRequest } = useRequestHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Data
    const submodelData = ref([] as Array<any>); // Treeview Data
    const initialUpdate = ref(false); // Flag to check if the initial update of the Treeview is needed and/or done
    const initialNode = ref({} as any); // Initial Node to set the Treeview to

    // Computed Properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const loading = computed(() => aasStore.getLoadingState); // gets loading State from Store
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL); // get AAS Registry URL from Store
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL); // get Submodel Registry URL from Store
    const updatedNode = computed(() => aasStore.getUpdatedNode); // get the updated Treeview Node from Store
    const initTree = computed(() => aasStore.getInitTreeByReferenceElement); // get the init treeview flag from Store

    // Watchers
    watch(selectedAAS, () => {
        initializeTree();
    });

    // Resets the Treeview when the AAS Registry changes
    watch(aasRegistryServerURL, () => {
        if (!aasRegistryServerURL.value) {
            submodelData.value = [];
        }
    });

    // Resets the Treeview when the Submodel Registry changes
    watch(submodelRegistryURL, () => {
        if (!submodelRegistryURL.value) {
            submodelData.value = [];
        }
    });

    // change the submodelData Object when the updated Node changes
    watch(updatedNode, () => {
        updateNode(updatedNode.value);
    });

    // initialize Treeview when the initTree flag changes
    watch(initTree, () => {
        if (initTree.value) {
            initTreeWithRouteParams();
            aasStore.dispatchInitTreeByReferenceElement(false); // reset the initTree flag
        }
    });

    onMounted(() => {
        initTreeWithRouteParams();
    });

    async function initializeTree() {
        // console.log('Initialize Treeview', this.SelectedAAS, this.initialUpdate, this.initialNode);
        // return if no endpoints are available
        if (!selectedAAS.value || !selectedAAS.value.endpoints || selectedAAS.value.endpoints.length === 0) {
            // this.navigationStore.dispatchSnackbar({ status: true, timeout: 4000, color: 'error', btnColor: 'buttonText', text: 'AAS with no (valid) Endpoint selected!' });
            submodelData.value = [];
            return;
        }
        if (loading.value && !initialUpdate.value) return; // return if loading state is true -> prevents multiple requests
        aasStore.dispatchLoadingState(true); // set loading state to true
        if (selectedAAS.value.submodels) {
            const fetchedSubmodelData = await requestSubmodels(selectedAAS.value.submodels);
            // set the isActive prop of the initialNode if it exists and the initialUpdate flag is set
            if (initialUpdate.value && initialNode.value) {
                let expandedSubmodelData = expandTree(fetchedSubmodelData, initialNode.value); // Update the Treeview to expand until the initially set node is reached
                // this.updateNode(this.initialNode); // set the isActive prop of the initialNode to true
                initialUpdate.value = false;
                initialNode.value = {};
                submodelData.value = expandedSubmodelData;
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
            // console.log('SubmodelRef: ', submodelRef, ' Submodel Registry: ', this.submodelRegistryServerURL);
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
                    // execute if the Request was successful
                    if (response.data?.id) {
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
                                // check if submodel has SubmodelElements
                                if (submodel.submodelElements && submodel.submodelElements.length > 0) {
                                    // recursively create treestructure for contained submodelElements
                                    let submodelElements = prepareTreeviewData(submodel.submodelElements, submodel);
                                    // add the SubmodelElements to the Submodel
                                    submodel.children = submodelElements;
                                    // set showChildren to false (for the Treeview Component)
                                    submodel.showChildren = false;
                                }
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

    // Function to prepare the Datastructure for the Treeview
    function prepareTreeviewData(SubmodelElements: any, parent: any) {
        // console.log('SubmodeElements: ', SubmodelElements);
        // iterate over all elements in the current level of the tree (SubmodelElements [e.g. SubmodelElementCollections, SubmodelElementLists, Entities, Properties, ...])
        SubmodelElements.forEach((element: any, index: number) => {
            // give the Element a unique ID
            element.id = UUID();
            // set the active State of each Element
            element.isActive = false;
            // set the Parent of each Element
            element.parent = parent;
            // set the Path of each Element
            if (element.parent.modelType == 'Submodel') {
                element.path = element.parent.path + '/submodel-elements/' + element.idShort;
            } else if (element.parent.modelType == 'SubmodelElementList') {
                element.path = element.parent.path + encodeURIComponent('[') + index + encodeURIComponent(']');
            } else {
                element.path = element.parent.path + '.' + element.idShort;
            }
            // check if the Element has Children
            if (element.submodelElements && element.submodelElements.length > 0) {
                // check for SubmodelElements
                // if the Element has Children, call the Function again with the Children as Data
                element.children = prepareTreeviewData(element.submodelElements, element);
                element.showChildren = false; // set showChildren to false (for the Treeview Component)
            } else if (
                element.value &&
                Array.isArray(element.value) &&
                element.value.length > 0 &&
                (element.modelType == 'SubmodelElementCollection' || element.modelType == 'SubmodelElementList')
            ) {
                // check for Values (SubmodelElementCollections or SubmodelElementLists)
                // if the Element has Children, call the Function again with the Children as Data
                element.children = prepareTreeviewData(element.value, element);
                element.showChildren = false; // set showChildren to false (for the Treeview Component)
            } else if (
                element.statements &&
                Array.isArray(element.statements) &&
                element.statements.length > 0 &&
                element.modelType == 'Entity'
            ) {
                // check for Statements (Entities)
                // if the Element has Children, call the Function again with the Children as Data
                element.children = prepareTreeviewData(element.statements, element);
                element.showChildren = false; // set showChildren to false (for the Treeview Component
            }
        });
        return SubmodelElements;
    }

    // Function to select a Property
    function updateNode(updatedNode: any) {
        // console.log('Updated Node: ', updatedNode);
        // change the isActive State of the selected Node in the Treeview Data (submodelData)
        submodelData.value = changeActiveState(submodelData.value, updatedNode);
    }

    // Function to change the isActive State of a Node in the Treeview Data (submodelData)
    function changeActiveState(data: any, updatedNode: any) {
        // iterate over all elements in the current level of the tree (Submodels, SubmodelElements [e.g. SubmodelElementCollections, Properties])
        data.forEach((element: any) => {
            // check if the Element has Children
            if (element.children && element.children.length > 0) {
                // check for SubmodelElements
                // if the Element has Children, call the Function again with the Children as Data
                element.children = changeActiveState(element.children, updatedNode);
            }
            // check if the Element is the updated Node
            if (element.path === updatedNode.path) {
                // set isActive State of the updated node
                element.isActive = updatedNode.isActive;
            } else {
                // set isActive State of all other nodes to false
                element.isActive = false;
            }
        });
        return data;
    }

    // Function to expand the Treeview until the selected Node is visible
    function expandTree(submodelData: any, updatedNode: any) {
        // console.log('Updated Node: ', updatedNode);
        // iterate over submodelData to find the updated Node
        let expandedSubmodelData = findNodeByPath(submodelData, updatedNode.path);
        // console.log('Treeview Data: ', expandedSubmodelData);
        return expandedSubmodelData;
    }

    // Function to find a Node in the Treeview Data (submodelData) by its path
    function findNodeByPath(data: any, path: string) {
        // iterate over all elements in the current level of the tree (Submodels, SubmodelElements [e.g. SubmodelElementCollections, Properties])
        let foundNode = false;
        data.forEach((element: any) => {
            // check if the Element is the updated Node
            if (element.path == path) {
                // if node is found, recurse up the tree to set showChildren to true
                // console.log('Found Node: ', element);
                // set isActive State of the updated node
                if (!foundNode) {
                    foundNode = true;
                    element.isActive = true;
                    aasStore.dispatchNode(element);
                    aasStore.dispatchRealTimeObject(element);
                }
                // if prop showChildren exists, set it to true
                if ('showChildren' in element) {
                    element.showChildren = true;
                }
                // set showChildren of the parent of the updated node to true, if a parent exists
                if (element.parent) {
                    element.parent = updateParent(element.parent);
                }
            } else {
                // recurse down the tree until node is found
                // check if the Element has Children
                if (element.children && element.children.length > 0) {
                    // check for SubmodelElements
                    // if the Element has Children, call the Function again with the Children as Data
                    findNodeByPath(element.children, path);
                }
            }
        });
        return data;
    }

    // Function to set showChildren of the parent of the updated node to true, if a parent exists
    function updateParent(parent: any) {
        // if prop showChildren exists, set it to true
        if ('showChildren' in parent) {
            parent.showChildren = true;
        }
        // set showChildren of the parent of the updated node to true, if a parent exists
        if (parent.parent) {
            parent.parent = updateParent(parent.parent);
        }
        return parent;
    }

    // Function to initialize the treeview with route params
    function initTreeWithRouteParams() {
        // check if the selectedAAS is already set in the Store and initialize the Treeview if so
        if (selectedAAS.value && selectedAAS.value.endpoints && selectedAAS.value.endpoints.length > 0) {
            // console.log('init Tree from Route Params: ', this.selectedAAS);
            initializeTree();
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
</script>

<style>
    .skeleton-loader-background {
        background-color: rgba(241, 0, 0, 0.12);
    }
</style>
