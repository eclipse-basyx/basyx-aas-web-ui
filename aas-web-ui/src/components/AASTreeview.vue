<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <template v-if="!singleAas">
                <!-- Title Bar in the AASTreeview -->
                <v-card-title
                    :style="
                        selectedAAS && Object.keys(selectedAAS).length > 0
                            ? 'padding: 7px 0px 8px'
                            : 'padding: 15px 0px 16px'
                    ">
                    <div class="d-flex align-center">
                        <v-tooltip
                            v-if="selectedAAS && Object.keys(selectedAAS).length > 0"
                            open-delay="600"
                            location="bottom"
                            :disabled="isMobile">
                            <template #activator="{ props }">
                                <v-btn
                                    icon="mdi-reload"
                                    variant="plain"
                                    :loading="treeLoading"
                                    v-bind="props"
                                    @click="initialize()">
                                    <template #loader>
                                        <span class="custom-loader"><v-icon light>mdi-cached</v-icon></span>
                                    </template>
                                </v-btn>
                            </template>
                            <span>Reload Submodel tree</span>
                        </v-tooltip>
                        <span v-if="!selectedAAS || Object.keys(selectedAAS).length === 0" class="pl-4">
                            Submodel tree
                        </span>
                        <template v-else>
                            <v-icon icon="custom:aasIcon" color="primary" size="small" class="" />
                            <span class="text-truncate ml-2">
                                {{ nameToDisplay(selectedAAS) }}
                            </span>
                        </template>
                        <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                            <v-spacer></v-spacer>
                            <v-tooltip
                                v-if="selectedAAS && Object.keys(selectedAAS).length > 0"
                                open-delay="600"
                                location="bottom"
                                :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-expand-all"
                                        variant="plain"
                                        v-bind="props"
                                        class="ml-1"
                                        :disabled="!selectedNode || Object.keys(selectedNode).length === 0"
                                        @click="expandTree()">
                                    </v-btn>
                                </template>
                                <span>Expand Submodel tree with selected element</span>
                            </v-tooltip>
                            <v-tooltip
                                v-if="selectedAAS && Object.keys(selectedAAS).length > 0"
                                open-delay="600"
                                location="bottom"
                                :disabled="isMobile">
                                <template #activator="{ props }">
                                    <v-btn
                                        icon="mdi-collapse-all"
                                        variant="plain"
                                        v-bind="props"
                                        class="ml-n3"
                                        :class="editMode ? 'mr-n3' : ''"
                                        @click="collapseTree()">
                                    </v-btn>
                                </template>
                                <span>Collapse Submodel trees</span>
                            </v-tooltip>
                            <v-menu v-if="editMode">
                                <template #activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" variant="plain" v-bind="props" class="mr-2"></v-btn>
                                </template>
                                <v-sheet border>
                                    <v-list density="compact" class="py-0">
                                        <!-- Open SM dialog -->
                                        <v-tooltip open-delay="600" location="end">
                                            <template #activator="{ props }">
                                                <v-list-item slim v-bind="props" @click="openEditDialog(true)">
                                                    <template #prepend>
                                                        <v-icon size="small">mdi-plus</v-icon>
                                                    </template>
                                                    Create Submodel
                                                </v-list-item>
                                            </template>
                                            <span>Create a new Submodel</span>
                                        </v-tooltip></v-list
                                    >
                                </v-sheet>
                            </v-menu>
                        </template>
                    </div>
                    <!-- TODO: Add Searchfield - https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/148 -->
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text
                style="overflow-y: auto"
                :style="singleAas ? 'height: calc(100svh - 105px)' : 'height: calc(100svh - 170px)'">
                <!-- Show Skeleton Loader when the tree is loading -->
                <template v-if="treeLoading">
                    <v-list-item v-for="i in 6" :key="i" density="compact" nav class="pa-0">
                        <template #prepend>
                            <v-skeleton-loader type="list-item" :width="50"></v-skeleton-loader>
                        </template>
                        <v-list-item-title>
                            <v-skeleton-loader type="list-item" :width="240"></v-skeleton-loader>
                        </v-list-item-title>
                        <template #append>
                            <v-skeleton-loader type="list-item" :width="90"></v-skeleton-loader>
                        </template>
                    </v-list-item>
                </template>
                <!-- Show the Submodel Tree -->
                <template v-else>
                    <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                        <template v-if="submodelTree && Array.isArray(submodelTree) && submodelTree.length > 0">
                            <!-- TODO: Evaluate and Replace with Vuetify Treeview Component when it gets fully released in Q1 2025 -->
                            <VTreeview
                                v-for="item in submodelTree"
                                :key="item.id"
                                class="root"
                                :item="item"
                                :depth="0"
                                @open-edit-dialog="openEditDialog(false, $event)"
                                @show-delete-dialog="openDeleteDialog"></VTreeview>
                        </template>
                        <v-empty-state
                            v-else
                            title="No existing Submodels"
                            text="The selected AAS does not contain any Submodels"
                            :action-text="editMode ? 'Create Submodel' : undefined"
                            class="text-divider"
                            @click:action="openEditDialog(true)"></v-empty-state>
                    </template>
                    <template v-else>
                        <v-empty-state
                            title="No selected AAS"
                            text="Select an AAS to view its Submodels and Submodel Elements"
                            class="text-divider"></v-empty-state>
                    </template>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
    <!-- Dialog for creating/editing Submodel -->
    <SubmodelForm v-model="editDialog" :new-sm="newSubmodel" :submodel="submodelToEdit"></SubmodelForm>
    <!-- Dialog for deleting SM/SME -->
    <DeleteDialog v-model="deleteDialog" :element="elementToDelete"></DeleteDialog>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASHandling } from '@/composables/AASHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Composables
    const { fetchAasSmListById } = useAASHandling();
    const { nameToDisplay } = useReferableUtils();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Data
    const submodelTree = ref([] as Array<any>); // Treeview Data
    const treeLoading = ref(false); // Variable to store if the AAS List is loading
    const editDialog = ref(false); // // Variable to store if the Edit Dialog should be shown
    const newSubmodel = ref(false); // Variable to store if a new Submodel should be created
    const submodelToEdit = ref<any | undefined>(undefined); // Variable to store the Submodel to be edited
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const elementToDelete = ref<any | undefined>(undefined); // Variable to store the Element to be deleted

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // get AAS Registry URL from Store
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL); // get Submodel Registry URL from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get the updated Treeview Node from Store
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store
    const editMode = computed(() => route.name === 'AASEditor'); // Check if the current Route is the AAS Editor

    // Watchers
    watch(
        () => aasRegistryURL.value,
        (aasRegistryURLValue) => {
            if (!aasRegistryURLValue || aasRegistryURLValue.trim() === '')
                // Resets the Submodel Tree when the AAS Registry changes
                submodelTree.value = [];
        }
    );

    watch(
        () => submodelRegistryURL.value,
        (submodelRegistryURLValue) => {
            if (!submodelRegistryURLValue || submodelRegistryURLValue.trim() === '')
                // Resets the Submodel Tree when the Submodel Registry changes
                submodelTree.value = [];
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            submodelTree.value = [];
            initialize();
        },
        { deep: true }
    );

    onMounted(() => {
        initialize();
    });

    async function initialize(): Promise<void> {
        if (!selectedAAS.value || Object.keys(selectedAAS).length === 0) {
            submodelTree.value = [];
            return;
        }

        treeLoading.value = true;

        fetchAasSmListById(selectedAAS.value.id).then((submodels: Array<any>) => {
            let submodelsSorted = submodels.sort((a: { [x: string]: number }, b: { [x: string]: number }) =>
                a['id'] > b['id'] ? 1 : -1
            );

            submodelTree.value = [...submodelsSorted].map((submodel: any) => {
                submodel.showChildren =
                    selectedNode.value &&
                    Object.keys(selectedNode).length > 0 &&
                    selectedNode.value.path &&
                    selectedNode.value.path.trim() !== '' &&
                    selectedNode.value.path.includes(submodel.path)
                        ? true
                        : false;
                submodel.children = prepareForTree(submodel.submodelElements, submodel);
                return submodel;
            });

            treeLoading.value = false;
        });
    }

    // // Function to prepare the data structure for the Tree
    function prepareForTree(submodelElements: Array<any>, parent: any): Array<any> {
        if (!submodelElements || !Array.isArray(submodelElements) || submodelElements.length === 0) return [];

        const children = submodelElements.map((sme: any, index: number) => {
            sme.parent = parent;

            // Set path
            if (sme.parent.modelType == 'Submodel') {
                sme.path = sme.parent.path + '/submodel-elements/' + sme.idShort;
            } else if (sme.parent.modelType == 'SubmodelElementList') {
                sme.path = sme.parent.path + encodeURIComponent('[') + index + encodeURIComponent(']');
            } else {
                sme.path = sme.parent.path + '.' + sme.idShort;
            }

            if (
                sme.modelType == 'Submodel' &&
                sme.submodelElements &&
                Array.isArray(sme.submodelElements) &&
                sme.submodelElements.length > 0
            ) {
                // Submodel
                sme.children = prepareForTree(sme.submodelElements, sme);
                sme.showChildren =
                    selectedNode.value &&
                    Object.keys(selectedNode).length > 0 &&
                    selectedNode.value.path &&
                    selectedNode.value.path.trim() !== '' &&
                    selectedNode.value.path.includes(sme.path)
                        ? true
                        : false;
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                sme.value &&
                Array.isArray(sme.value) &&
                sme.value.length > 0
            ) {
                // SubmodelElementCollection or SubmodelElementList
                sme.children = prepareForTree(sme.value, sme);
                sme.showChildren =
                    selectedNode.value &&
                    Object.keys(selectedNode).length > 0 &&
                    selectedNode.value.path &&
                    selectedNode.value.path.trim() !== '' &&
                    selectedNode.value.path.includes(sme.path)
                        ? true
                        : false;
            } else if (
                sme.modelType == 'Entity' &&
                sme.statements &&
                Array.isArray(sme.statements) &&
                sme.statements.length > 0
            ) {
                // Entity
                sme.children = prepareForTree(sme.statements, sme);
                sme.showChildren =
                    selectedNode.value &&
                    Object.keys(selectedNode).length > 0 &&
                    selectedNode.value.path &&
                    selectedNode.value.path.trim() !== '' &&
                    selectedNode.value.path.includes(sme.path)
                        ? true
                        : false;
            }
            return sme;
        });

        return children;
    }

    function collapseTree(submodelElements: Array<any> = submodelTree.value): void {
        submodelElements.map((sme: any) => {
            sme.showChildren = false;

            if (
                sme.modelType == 'Submodel' &&
                sme.submodelElements &&
                Array.isArray(sme.submodelElements) &&
                sme.submodelElements.length > 0
            ) {
                sme.submodelElements = collapseTree(sme.submodelElements);
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                sme.value &&
                Array.isArray(sme.value) &&
                sme.value.length > 0
            ) {
                sme.value = collapseTree(sme.value);
            } else if (
                sme.modelType == 'Entity' &&
                sme.statements &&
                Array.isArray(sme.statements) &&
                sme.statements.length > 0
            ) {
                sme.statements = collapseTree(sme.statements);
            }

            return sme;
        });
    }

    function expandTree(submodelElements: Array<any> = submodelTree.value): void {
        submodelElements.map((sme: any) => {
            sme.showChildren =
                selectedNode.value &&
                Object.keys(selectedNode).length > 0 &&
                selectedNode.value.path &&
                selectedNode.value.path.trim() !== '' &&
                selectedNode.value.path.includes(sme.path)
                    ? true
                    : false;

            if (
                sme.modelType == 'Submodel' &&
                sme.submodelElements &&
                Array.isArray(sme.submodelElements) &&
                sme.submodelElements.length > 0
            ) {
                sme.submodelElements = collapseTree(sme.submodelElements);
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                sme.value &&
                Array.isArray(sme.value) &&
                sme.value.length > 0
            ) {
                sme.value = collapseTree(sme.value);
            } else if (
                sme.modelType == 'Entity' &&
                sme.statements &&
                Array.isArray(sme.statements) &&
                sme.statements.length > 0
            ) {
                sme.statements = collapseTree(sme.statements);
            }

            return sme;
        });
    }

    function openEditDialog(createNew: boolean, submodel?: any): void {
        editDialog.value = true;
        newSubmodel.value = createNew;
        if (createNew === false && submodel) {
            submodelToEdit.value = submodel;
        }
    }

    function openDeleteDialog(element: any): void {
        deleteDialog.value = true;
        elementToDelete.value = element;
    }
</script>

<style>
    .skeleton-loader-background {
        background-color: rgba(241, 0, 0, 0.12);
    }
</style>
