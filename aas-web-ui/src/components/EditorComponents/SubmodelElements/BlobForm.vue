<template>
    <v-dialog v-model="editBlobDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveBlob)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newBlob ? 'Create a new Blob Element' : 'Edit Blob Element'
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
                                        v-model="blobIdShort"
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
                                        v-model="blobCategory"
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
                    <!-- Blob Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <BlobInput
                                        v-model:content="blobContent"
                                        v-model:content-type="contentType"
                                        :new-blob="newBlob"
                                        @update:blob="handleBlob" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="blob-content" />
                                </v-col>
                            </v-row>
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
                <v-btn color="primary" @click="saveBlob">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    /*
NOTE: This component uses Keyboard events (keyUp,keyDown) in the root element v-dialog.
It saves the changes after pressing the 'Enter' Key. When creating additional Form Inputs that require or support the
usage of the 'Enter' key, make sure to edit the keyDown/keyUp method to not execute when in such form fields.
*/

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
        newBlob: boolean;
        parentElement: any;
        path?: string;
        blob?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editBlobDialog = ref(false);
    const blobObject = ref<aasTypes.Blob | undefined>(undefined);
    const blobElement = ref<File | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const blobIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const blobCategory = ref<string | null>(null);

    const blobContent = ref<Uint8Array | null>(null);
    const contentType = ref<string>('application/unknown');

    const semanticId = ref<aasTypes.Reference | null>(null);

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
            editBlobDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editBlobDialog.value,
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
                    border += 'border-t-thin';
                }
                break;
        }
        return border;
    });

    async function initializeInputs(): Promise<void> {
        if (!props.newBlob && props.blob) {
            const blobJSON = await fetchSme(props.blob.path);
            const instanceOrError = jsonization.blobFromJsonable(blobJSON);

            if (instanceOrError.error !== null) {
                console.error('Error parsing Blob SME: ', instanceOrError.error);
                return;
            }

            blobObject.value = instanceOrError.mustValue();

            blobIdShort.value = blobObject.value.idShort;

            if (blobObject.value.displayName) {
                displayName.value = blobObject.value.displayName;
            }

            if (blobObject.value.description) {
                description.value = blobObject.value.description;
            }

            if (blobObject.value.category) {
                blobCategory.value = blobObject.value.category;
            }

            if (blobObject.value.value) {
                blobContent.value = blobObject.value.value;
            }

            if (blobObject.value.contentType) {
                contentType.value = blobObject.value.contentType;
            }

            if (blobObject.value.semanticId) {
                semanticId.value = blobObject.value.semanticId;
            }

            openPanels.value = [0, 1];
        } else {
            blobIdShort.value = null;
            displayName.value = null;
            description.value = null;
            blobCategory.value = null;
            blobContent.value = null;
            contentType.value = 'application/unknown';
            semanticId.value = null;
            openPanels.value = [0, 1];
        }
    }

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    async function saveBlob(): Promise<void> {
        if (props.newBlob || blobObject.value === undefined) {
            blobObject.value = new aasTypes.Blob('application/unknown');
        }

        if (blobIdShort.value !== null) {
            blobObject.value.idShort = blobIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'Blob Element IdShort is required');
            return;
        }

        blobObject.value.value = blobContent.value;

        if (contentType.value !== null) {
            blobObject.value.contentType = contentType.value;
        } else if (blobElement.value !== undefined) {
            blobObject.value.contentType = blobElement.value.type;
        } else {
            errors.value.set('contentType', 'Blob Element Content Type is required');
            return;
        }

        if (semanticId.value !== null) {
            blobObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            blobObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            blobObject.value.description = description.value;
        }

        blobObject.value.category = blobCategory.value;

        if (props.newBlob) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the Blob Element on the parent Submodel
                await postSubmodelElement(blobObject.value, props.parentElement.id);

                const newElementPath = props.parentElement.path + '/submodel-elements/' + blobObject.value.idShort;

                // Navigate to the new Blob Element
                const query = structuredClone(route.query);
                query.path = newElementPath;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the Blob Element on the parent element
                await postSubmodelElement(blobObject.value, submodelId, idShortPath);

                const newElementPath = props.parentElement.path + '.' + blobObject.value.idShort;

                // Navigate to the new Blob Element
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = newElementPath;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Blob Element Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the Blob Element
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(blobObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + blobObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.blob.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(blobObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(blobObject.value, props.blob.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + blobObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editBlobDialog.value = false;
    }

    function handleBlob(file: File | undefined): void {
        blobElement.value = file;
    }
</script>
