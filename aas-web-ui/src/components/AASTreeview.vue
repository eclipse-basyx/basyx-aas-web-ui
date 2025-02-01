<template>
    <!-- Dialog for creating/editing Submodel -->
    <SubmodelForm v-model="editDialog" :new-sm="newSubmodel" :submodel="submodelToEdit"></SubmodelForm>
    <!-- Dialog for deleting Element -->
    <DeleteDialog v-model="deleteDialog" :element="elementToDelete"></DeleteDialog>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <template v-if="!singleAas">
                <!-- Title Bar in the AASTreeview -->
                <v-card-title style="padding: 15px 16px 16px">
                    <div v-if="!selectedAAS || Object.keys(selectedAAS).length === 0">AAS Treeview</div>
                    <div v-else class="d-flex align-center">
                        <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                        <span class="text-truncate ml-2">
                            {{ nameToDisplay(selectedAAS) }}
                        </span>
                    </div>
                    <!-- TODO: Add Searchfield - https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/148 -->
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text
                style="overflow-y: auto"
                :style="singleAas ? 'height: calc(100svh - 105px)' : 'height: calc(100svh - 170px)'">
                <div v-if="treeLoading">
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
                    <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                        <!-- Button to add a new Submodel -->
                        <template v-if="editMode && submodelTree.length > 0">
                            <v-row justify="center">
                                <v-col cols="auto" class="pt-1 pb-5">
                                    <v-btn
                                        prepend-icon="mdi-plus"
                                        text="Create Submodel"
                                        @click="openEditDialog(true)" />
                                </v-col>
                            </v-row>
                        </template>
                        <template v-if="submodelTree.length > 0">
                            <!-- TODO: Evaluate and Replace with Vuetify Treeview Component when it gets fully released in Q1 2025 -->
                            <VTreeview
                                v-for="item in submodelTree"
                                :key="item.id"
                                class="root"
                                :item="item"
                                :depth="0"
                                @open-edit-dialog="openEditDialog(false, $event)"
                                @show-delete-dialog="showDeleteDialog"></VTreeview>
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
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // get AAS Registry URL from Store
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL); // get Submodel Registry URL from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get the updated Treeview Node from Store
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store
    const editMode = computed(() => route.name === 'AASEditor'); // Check if the current Route is the AAS Editor

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            // Resets the Submodel Tree when the AAS Registry changes
            submodelTree.value = [];
        }
    );

    watch(
        () => submodelRegistryURL.value,
        () => {
            // Resets the Submodel Tree when the Submodel Registry changes
            submodelTree.value = [];
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            submodelTree.value = [];
            initialize();
        }
    );

    onMounted(() => {
        initialize();
    });

    async function initialize(): Promise<void> {
        if (!selectedAAS.value || !selectedAAS.value.endpoints || selectedAAS.value.endpoints.length === 0) {
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

    function openEditDialog(createNew: boolean, submodel?: any): void {
        editDialog.value = true;
        newSubmodel.value = createNew;
        if (createNew === false && submodel) {
            submodelToEdit.value = submodel;
        }
    }

    function showDeleteDialog(element: any): void {
        deleteDialog.value = true;
        elementToDelete.value = element;
    }
</script>

<style>
    .skeleton-loader-background {
        background-color: rgba(241, 0, 0, 0.12);
    }
</style>
