<template>
    <v-dialog v-model="editEntityDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveEntity)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newEntity ? 'Create a new Entity Element' : 'Edit Entity Element'
                }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput
                                        v-model="entityIdShort"
                                        label="IdShort"
                                        :error="hasError('idShort')"
                                        :rules="isParentSubmodelElementList ? [] : [rules.required]"
                                        :error-messages="getError('idShort')" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="idShort" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="displayName"
                                        :show-label="true"
                                        label="Display Name"
                                        type="displayName" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="displayName" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="description"
                                        :show-label="true"
                                        label="Description"
                                        type="description" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="description" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="entityCategory"
                                        label="Category"
                                        type="category"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="category" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center" class="mb-3">
                                <v-col class="py-0">
                                    <SelectInput v-model="entityType" label="Entity Type" type="entityType" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="entityType" />
                                </v-col>
                            </v-row>
                            <AssetIdInput
                                v-model:global-asset-id="globalAssetId"
                                v-model:specific-asset-ids="specificAssetIds"
                                :show-generate-iri-for-global="false"
                                :show-generate-iri-for-specific="false" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="semanticId" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Data Specification -->
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" @click="saveEntity">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newEntity: boolean;
        parentElement: any;
        path?: string;
        entity?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editEntityDialog = ref(false);
    const entityObject = ref<aasTypes.Entity | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const entityIdShort = ref<string | null>(null);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const entityCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);

    const entityType = ref<aasTypes.EntityType>(aasTypes.EntityType.SelfManagedEntity);
    const globalAssetId = ref<string | null>(null);
    const specificAssetIds = ref<Array<aasTypes.SpecificAssetId> | null>(null);

    const errors = ref<Map<string, string>>(new Map());

    const isParentSubmodelElementList = computed(() => props.parentElement?.modelType === 'SubmodelElementList');

    const rules = {
        required: (value: any) => !!value || 'Required.',
    };

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editEntityDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editEntityDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    const bordersToShow = computed(() => (panel: number) => {
        let border = '';
        switch (panel) {
            case 0:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border = 'border-b-thin';
                }
                break;
            case 1:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-b-thin';
                }
                break;
            case 2:
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += ' border-b-thin';
                }
                break;
            case 3:
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += ' border-t-thin';
                }
                break;
        }
        return border;
    });

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    async function saveEntity(): Promise<void> {
        if (props.newEntity || entityObject.value === undefined) {
            entityObject.value = new aasTypes.Entity(entityType.value);
        }

        if (entityIdShort.value !== null) {
            entityObject.value.idShort = entityIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'Entity IdShort is required');
            return;
        }

        entityObject.value.entityType = entityType.value;

        if (semanticId.value !== null) {
            entityObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            entityObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            entityObject.value.description = description.value;
        }

        entityObject.value.category = entityCategory.value;

        if (globalAssetId.value !== null && globalAssetId.value !== '') {
            entityObject.value.globalAssetId = globalAssetId.value;
        } else {
            entityObject.value.globalAssetId = null;
        }

        if (specificAssetIds.value !== null && specificAssetIds.value.length > 0) {
            entityObject.value.specificAssetIds = specificAssetIds.value;
        } else {
            entityObject.value.specificAssetIds = null;
        }

        if (props.newEntity) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the entity on the parent Submodel
                await postSubmodelElement(entityObject.value, props.parentElement.id);

                // Navigate to the new entity
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + entityObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the entity on the parent element
                await postSubmodelElement(entityObject.value, submodelId, idShortPath);

                // Navigate to the new entity
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = props.parentElement.path + '.' + entityObject.value.idShort;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Entity Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the entity
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(entityObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + entityObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.entity.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(entityObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(entityObject.value, props.entity.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + entityObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editEntityDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newEntity && props.entity) {
            const entityJSON = await fetchSme(props.entity.path);

            const instanceOrError = jsonization.entityFromJsonable(entityJSON);
            if (instanceOrError.error !== null) {
                console.error('Error parsing Entity: ', instanceOrError.error);
                return;
            }
            entityObject.value = instanceOrError.mustValue();

            entityIdShort.value = entityObject.value.idShort;
            if (entityObject.value.displayName) {
                displayName.value = entityObject.value.displayName;
            }
            if (entityObject.value.description) {
                description.value = entityObject.value.description;
            }
            if (entityObject.value.category) {
                entityCategory.value = entityObject.value.category;
            }
            if (entityObject.value.semanticId) {
                semanticId.value = entityObject.value.semanticId;
            }
            if (entityObject.value.entityType) {
                entityType.value = entityObject.value.entityType;
            }
            if (entityObject.value.globalAssetId) {
                globalAssetId.value = entityObject.value.globalAssetId;
            }
            if (entityObject.value.specificAssetIds) {
                specificAssetIds.value = entityObject.value.specificAssetIds;
            }
            openPanels.value = [0, 1];
        } else {
            entityIdShort.value = null;
            displayName.value = null;
            description.value = null;
            entityCategory.value = null;
            semanticId.value = null;
            entityType.value = aasTypes.EntityType.SelfManagedEntity;
            globalAssetId.value = null;
            specificAssetIds.value = null;
            openPanels.value = [0, 1];
        }
    }
</script>
