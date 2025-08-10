<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <!-- Title bar -->
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
                    <span v-if="!selectedAAS || Object.keys(selectedAAS).length === 0 || singleAas" class="pl-4">
                        Submodel tree
                    </span>
                    <template v-else-if="!singleAas">
                        <v-icon icon="custom:aasIcon" color="primary" size="small" class="" />
                        <span class="text-truncate ml-2">
                            {{ nameToDisplay(selectedAAS) }}
                        </span>
                    </template>
                    <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
                        <v-col class="pl-2 pr-0">
                            <v-text-field
                                variant="outlined"
                                density="compact"
                                hide-details
                                label="Search for SM/SME..."
                                clearable
                                :placeholder="submodelTree.length.toString() + ' Submodels'"
                                persistent-placeholder
                                @update:model-value="debouncedFilterSubmodelTree"></v-text-field>
                        </v-col>
                        <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
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
                        <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
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
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100svh - 170px)">
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
                        <template
                            v-if="
                                submodelTreeUnfiltered &&
                                Array.isArray(submodelTreeUnfiltered) &&
                                submodelTreeUnfiltered.length > 0
                            ">
                            <!-- TODO: Evaluate and Replace with Vuetify Treeview Component when it gets fully released in Q1 2025 -->
                            <Treeview
                                v-for="item in submodelTree"
                                :key="item.id"
                                class="root"
                                :item="item"
                                :depth="0"
                                @open-edit-submodel-element-dialog="openEditSubmodelElementDialogForElement"
                                @open-add-submodel-element-dialog="openAddSubmodelElementDialog"
                                @open-edit-dialog="openEditDialog(false, $event)"
                                @show-delete-dialog="openDeleteDialog"></Treeview>
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
    <!-- Dialog for creating SubmodelElements -->
    <SubmodelElementForm v-model="selectSMETypeToAddDialog" @open-create-s-m-e-dialog="openSMEFormDialog">
    </SubmodelElementForm>
    <!-- Dialog for creating/editing Properties -->
    <PropertyForm
        v-model="propertyDialog"
        :new-property="newProperty"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :property="submodelElementToEdit"></PropertyForm>
    <!-- Dialog for creating/editing MultiLanguageProperties -->
    <MLPForm
        v-model="mlpDialog"
        :new-mlp="newMLP"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :mlp="submodelElementToEdit"></MLPForm>
    <!-- Dialog for creating/editing Range SubmodelElements -->
    <RangeForm
        v-model="rangeDialog"
        :new-range="newRange"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :range="submodelElementToEdit"></RangeForm>
    <!-- Dialog for creating/editing File SubmodelElements -->
    <FileForm
        v-model="fileDialog"
        :new-file="newFile"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :file="submodelElementToEdit"></FileForm>
    <!-- Dialog for creating/editing Blob SubmodelElements -->
    <BlobForm
        v-model="blobDialog"
        :new-blob="newBlob"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :blob="submodelElementToEdit"></BlobForm>
    <!-- Dialog for creating/editing SubmodelElementCollections -->
    <CollectionForm
        v-model="smcDialog"
        :new-smc="newSMC"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :smc="submodelElementToEdit"></CollectionForm>
    <!-- Dialog for creating/editing SubmodelElementLists -->
    <ListForm
        v-model="smlDialog"
        :new-sml="newSML"
        :parent-element="elementToAddSME"
        :path="submodelElementPath"
        :sml="submodelElementToEdit"></ListForm>
    <!-- Dialog for creating/editing Submodel -->
    <SubmodelForm v-model="editDialog" :new-sm="newSubmodel" :submodel="submodelToEdit"></SubmodelForm>
    <!-- Dialog for deleting SM/SME -->
    <DeleteDialog v-model="deleteDialog" :element="elementToDelete"></DeleteDialog>
</template>

<script lang="ts" setup>
    import { chain, debounce, has, isEmpty, omit } from 'lodash';
    import { computed, onMounted, Ref, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { isEmptyString } from '@/utils/StringUtils';

    // Vue Router
    const route = useRoute();

    // Composables
    const { fetchAasSmListById } = useAASHandling();
    const { nameToDisplay, descriptionToDisplay } = useReferableUtils();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Data
    const submodelTree = ref([] as Array<any>) as Ref<Array<any>>; // Submodel Treeview Data
    const submodelTreeUnfiltered = ref([] as Array<any>) as Ref<Array<any>>; // Variable to store the unfiltere Submodel Treeview Data before filtering
    const debouncedFilterSubmodelTree = debounce(filterSubmodelTree, 300); // Debounced function to filter the AAS List
    const treeLoading = ref(false); // Variable to store if the AAS List is loading
    const selectSMETypeToAddDialog = ref(false); // Variable to store if the Add SubmodelElement Dialog should be shown
    const propertyDialog = ref(false); // Variable to store if the PropertyForm Dialog should be shown
    const mlpDialog = ref(false); // Variable to store if the MultiLanguagePropertyForm Dialog should be shown
    const rangeDialog = ref(false); // Variable to store if the RangeForm Dialog should be shown
    const fileDialog = ref(false); // Variable to store if the FileForm Dialog should be shown
    const blobDialog = ref(false); // Variable to store if the BlobForm Dialog should be shown
    const smcDialog = ref(false); // Variable to store if the PropertyForm Dialog should be shown
    const smlDialog = ref(false); // Variable to store if the SubmodelElementListForm Dialog should be shown
    const editDialog = ref(false); // Variable to store if the Edit Dialog should be shown
    const newProperty = ref(false); // Variable to store if a new Property should be created
    const newMLP = ref(false); // Variable to store if a new MultiLanguageProperty should be created
    const newRange = ref(false); // Variable to store if a new Range should be created
    const newFile = ref(false); // Variable to store if a new File should be created
    const newBlob = ref(false); // Variable to store if a new Blob should be created
    const newSMC = ref(false); // Variable to store if a new SubmodelElementCollection should be created
    const newSML = ref(false); // Variable to store if a new SubmodelElementList should be created
    const newSubmodel = ref(false); // Variable to store if a new Submodel should be created
    const submodelToEdit = ref<any | undefined>(undefined); // Variable to store the Submodel to be edited
    const deleteDialog = ref(false); // Variable to store if the Delete Dialog should be shown
    const elementToDelete = ref<any | undefined>(undefined); // Variable to store the Element to be deleted
    const elementToAddSME = ref<any | undefined>(undefined); // Variable to store the Element where the new SME is added inside
    const submodelElementPath = ref<string | undefined>(undefined); // Variable to store the Element where the new SME is added inside
    const submodelElementToEdit = ref<any | undefined>(undefined); // Variable to store the Element where the new SME is added inside

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL); // get AAS Registry URL from Store
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL); // get Submodel Registry URL from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get the updated Treeview Node from Store
    const singleAas = computed(() => envStore.getSingleAas); // Get the single AAS state from the Store
    const editMode = computed(() => route.name === 'AASEditor'); // Check if the current Route is the AAS Editor
    const triggerTreeviewReload = computed(() => navigationStore.getTriggerTreeviewReload); // Reload the Treeview

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            submodelTree.value = [];
        }
    );

    watch(
        () => submodelRegistryURL.value,
        () => {
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

    watch(
        () => triggerTreeviewReload.value,
        (triggerVal) => {
            if (triggerVal === true) {
                initialize();
            }
        }
    );

    onMounted(() => {
        initialize();
    });

    async function initialize(): Promise<void> {
        if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
            submodelTree.value = [];
            return;
        }

        treeLoading.value = true;

        try {
            const submodels: Array<any> = await fetchAasSmListById(selectedAAS.value.id);
            const sortedSubmodels = submodels.sort((a, b) => a.id.localeCompare(b.id));

            let processedList = [] as Array<any>;

            processedList = sortedSubmodels.map((submodel: any) => {
                // Assumes submodel.path is already set for top-level nodes
                if (Array.isArray(submodel.submodelElements) && submodel.submodelElements.length) {
                    submodel.children = prepareForTree(submodel.submodelElements, submodel);
                    submodel.showChildren = shouldExpandNode(submodel.path);
                    return submodel;
                }
                return submodel;
            });

            // Precompute lowercase search fields
            processedList = deepMap(processedList, (item: any) => ({
                ...item,
                idLower: item?.id?.toLowerCase() || '',
                idShortLower: item?.idShort?.toLowerCase() || '',
                nameLower: nameToDisplay(item).toLowerCase(),
                descLower: descriptionToDisplay(item).toLowerCase(),
            }));

            submodelTree.value = processedList;
            submodelTreeUnfiltered.value = processedList;
        } finally {
            treeLoading.value = false;
        }
    }

    function deepMap(array: Array<any>, fn: (arg0: any) => any): Array<any> {
        return array.map((item: any) => {
            let newItem = { ...item }; // Create a copy of the item
            if (
                newItem.modelType === 'Submodel' &&
                newItem.submodelElements &&
                Array.isArray(newItem.submodelElements) &&
                newItem.submodelElements.length > 0
            ) {
                newItem.submodelElements = deepMap(newItem.submodelElements, fn); // Recursively map SM Elements
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(newItem.modelType) &&
                newItem.value &&
                Array.isArray(newItem.value) &&
                newItem.value.length > 0
            ) {
                newItem.value = deepMap(newItem.value, fn); // Recursively map SMC/SML elements
            } else if (
                newItem.modelType == 'Entity' &&
                newItem.statements &&
                Array.isArray(newItem.statements) &&
                newItem.statements.length > 0
            ) {
                newItem.statements = deepMap(newItem.statements, fn); // Recursively map entity statements
            }
            return Array.isArray(newItem)
                ? deepMap(newItem, fn) // Recursively map nested arrays
                : fn(newItem);
        });
    }

    // Prepare tree structure recursively
    function prepareForTree(submodelElements: Array<any>, parent: any): Array<any> {
        if (!submodelElements || !Array.isArray(submodelElements) || submodelElements.length === 0) {
            return [];
        }

        return submodelElements.map((sme: any, index: number) => {
            sme.parent = parent;
            sme.path = computePath(sme, parent, index);
            const expand = shouldExpandNode(sme.path);

            if (sme.modelType === 'Submodel' && Array.isArray(sme.submodelElements) && sme.submodelElements.length) {
                sme.children = prepareForTree(sme.submodelElements, sme);
                sme.showChildren = expand;
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                Array.isArray(sme.value) &&
                sme.value.length
            ) {
                sme.children = prepareForTree(sme.value, sme);
                sme.showChildren = expand;
            } else if (sme.modelType === 'Entity' && Array.isArray(sme.statements) && sme.statements.length) {
                sme.children = prepareForTree(sme.statements, sme);
                sme.showChildren = expand;
            }
            return sme;
        });
    }

    // Collapse the entire tree recursively
    function collapseTree(submodelElements: Array<any> = submodelTree.value): void {
        submodelElements.forEach((sme: any) => {
            sme.showChildren = false;

            if (sme.modelType === 'Submodel' && Array.isArray(sme.submodelElements) && sme.submodelElements.length) {
                collapseTree(sme.submodelElements);
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                Array.isArray(sme.value) &&
                sme.value.length
            ) {
                collapseTree(sme.value);
            } else if (sme.modelType === 'Entity' && Array.isArray(sme.statements) && sme.statements.length) {
                collapseTree(sme.statements);
            }
        });
    }

    // Expand the tree recursively
    function expandTree(submodelElements: Array<any> = submodelTree.value): void {
        submodelElements.forEach((sme: any) => {
            sme.showChildren = shouldExpandNode(sme.path);

            if (
                sme.modelType === 'Submodel' &&
                Array.isArray(sme.submodelElements) &&
                sme.submodelElements.length > 0
            ) {
                expandTree(sme.submodelElements);
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(sme.modelType) &&
                Array.isArray(sme.value) &&
                sme.value.length > 0
            ) {
                expandTree(sme.value);
            } else if (sme.modelType === 'Entity' && Array.isArray(sme.statements) && sme.statements.length > 0) {
                expandTree(sme.statements);
            }
        });
    }

    function openEditDialog(createNew: boolean, submodel?: any): void {
        editDialog.value = true;
        newSubmodel.value = createNew;
        if (!createNew && submodel) {
            submodelToEdit.value = submodel;
        }
    }

    function openDeleteDialog(element: any): void {
        deleteDialog.value = true;
        elementToDelete.value = element;
    }

    function computePath(sme: any, parent: any, index: number): string {
        if (parent.modelType === 'Submodel') {
            return `${parent.path}/submodel-elements/${sme.idShort}`;
        } else if (parent.modelType === 'SubmodelElementList') {
            return `${parent.path}${encodeURIComponent('[')}${index}${encodeURIComponent(']')}`;
        }
        return `${parent.path}.${sme.idShort}`;
    }

    function shouldExpandNode(nodePath: string): boolean {
        return (
            selectedNode.value &&
            Object.keys(selectedNode.value).length > 0 &&
            !isEmptyString(selectedNode.value.path) &&
            selectedNode.value.path.startsWith(nodePath)
        );
    }

    function openAddSubmodelElementDialog(element: any): void {
        elementToAddSME.value = element;
        selectSMETypeToAddDialog.value = true;
    }

    function openEditSubmodelElementDialogForElement(element: any): void {
        if (element.modelType === 'Property') {
            propertyDialog.value = true;
            newProperty.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'MultiLanguageProperty') {
            mlpDialog.value = true;
            newMLP.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'Range') {
            rangeDialog.value = true;
            newRange.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'File') {
            fileDialog.value = true;
            newFile.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'Blob') {
            blobDialog.value = true;
            newBlob.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'SubmodelElementCollection') {
            smcDialog.value = true;
            newSMC.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else if (element.modelType === 'SubmodelElementList') {
            smlDialog.value = true;
            newSML.value = false;
            submodelElementPath.value = element.path;
            elementToAddSME.value = element.parent;
            submodelElementToEdit.value = element;
        } else {
            console.error(`Specified invalid SubmodelElement Type "${element.modelType}"`);
        }
    }

    function openSMEFormDialog(smeType: string): void {
        switch (smeType) {
            case 'Property':
                newProperty.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                propertyDialog.value = true;
                break;
            case 'MultiLanguageProperty':
                newMLP.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                mlpDialog.value = true;
                break;
            case 'Range':
                newRange.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                rangeDialog.value = true;
                break;
            case 'File':
                newFile.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                fileDialog.value = true;
                break;
            case 'Blob':
                newBlob.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                blobDialog.value = true;
                break;
            case 'SubmodelElementCollection':
                newSMC.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                smcDialog.value = true;
                break;
            case 'SubmodelElementList':
                newSML.value = true;
                submodelElementPath.value = undefined;
                submodelElementToEdit.value = undefined;
                smlDialog.value = true;
                break;
            default:
                console.error(`Specified invalid SubmodelElement Type "${smeType}"`);
                break;
        }
    }

    function filterSubmodelTree(value: string): void {
        if (!value || value.trim() === '') {
            submodelTree.value = submodelTreeUnfiltered.value;
        } else {
            const search = value.toLowerCase();
            submodelTree.value = deepFilter(
                submodelTreeUnfiltered.value,
                (item: any) =>
                    item.idLower.includes(search) ||
                    item.idShortLower.includes(search) ||
                    item.nameLower.includes(search) ||
                    item.descLower.includes(search)
            );
        }
    }

    function deepFilter(array: Array<any>, predicate: { (item: any): any; (arg0: any): any }): Array<any> {
        return chain(array)
            .map((item: any) => {
                let childrenKey = '';
                if (
                    item.modelType === 'Submodel' &&
                    item.submodelElements &&
                    Array.isArray(item.submodelElements) &&
                    item.submodelElements.length > 0
                ) {
                    childrenKey = 'submodelElements';
                } else if (
                    ['SubmodelElementCollection', 'SubmodelElementList'].includes(item.modelType) &&
                    item.value &&
                    Array.isArray(item.value) &&
                    item.value.length > 0
                ) {
                    childrenKey = 'value';
                } else if (
                    item.modelType == 'Entity' &&
                    item.statements &&
                    Array.isArray(item.statements) &&
                    item.statements.length > 0
                ) {
                    childrenKey = 'statements';
                }

                if (childrenKey !== '') {
                    if (has(item, childrenKey)) {
                        const filteredChildren = deepFilter(item[childrenKey], predicate);
                        // Return item with filtered children if any children match
                        if (!isEmpty(filteredChildren)) {
                            return {
                                ...item,
                                [childrenKey]: filteredChildren,
                                ['children']: filteredChildren,
                            };
                        }
                    }
                }

                // If item matches predicate, return it (without children if none matched)
                if (predicate(item)) {
                    return omit(item, [childrenKey]);
                }

                // Otherwise, discard
                return null;
            })
            .filter(Boolean)
            .value();
    }
</script>

<style>
    .skeleton-loader-background {
        background-color: rgba(241, 0, 0, 0.12);
    }
</style>
