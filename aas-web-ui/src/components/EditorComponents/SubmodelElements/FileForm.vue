<template>
    <v-dialog v-model="editFileDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveFile)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newFile ? 'Create a new File Element' : 'Edit File Element'
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
                                        v-model="fileIdShort"
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
                                        v-model="fileCategory"
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
                    <!-- File Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <FileInput
                                        v-model:path="filePath"
                                        v-model:content-type="contentType"
                                        :new-file="newFile"
                                        :sme-path="path"
                                        @update:file="handleFile" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="file-path" />
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
                <v-btn color="primary" @click="saveFile">Save</v-btn>
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
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newFile: boolean;
        parentElement: any;
        path?: string;
        file?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement, putAttachmentFile } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();
    const { determineContentType } = useSMEFile();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editFileDialog = ref(false);
    const fileObject = ref<aasTypes.File | undefined>(undefined);
    const fileElement = ref<File | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const fileIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const fileCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const filePath = ref<string | null>(null);
    const contentType = ref<string>('application/unknown');

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
            editFileDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editFileDialog.value,
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
        if (!props.newFile && props.file) {
            const fileJSON = await fetchSme(props.file.path);
            const instanceOrError = jsonization.fileFromJsonable(fileJSON);

            if (instanceOrError.error !== null) {
                console.error('Error parsing File SME: ', instanceOrError.error);
                return;
            }

            fileObject.value = instanceOrError.mustValue();

            fileIdShort.value = fileObject.value.idShort;

            if (fileObject.value.displayName) {
                displayName.value = fileObject.value.displayName;
            }

            if (fileObject.value.description) {
                description.value = fileObject.value.description;
            }

            if (fileObject.value.category) {
                fileCategory.value = fileObject.value.category;
            }

            if (fileObject.value.value) {
                filePath.value = fileObject.value.value;
            }

            if (fileObject.value.contentType) {
                contentType.value = fileObject.value.contentType;
            }

            if (fileObject.value.semanticId) {
                semanticId.value = fileObject.value.semanticId;
            }

            openPanels.value = [0, 1];
        } else {
            fileIdShort.value = null;
            displayName.value = null;
            description.value = null;
            fileCategory.value = null;
            filePath.value = null;
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

    async function saveFile(): Promise<void> {
        if (props.newFile || fileObject.value === undefined) {
            fileObject.value = new aasTypes.File('application/unknown');
        }

        if (fileIdShort.value !== null) {
            fileObject.value.idShort = fileIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'File Element IdShort is required');
            return;
        }

        fileObject.value.value = filePath.value;

        fileObject.value.contentType = determineContentType(fileElement.value, contentType.value);

        if (semanticId.value !== null) {
            fileObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            fileObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            fileObject.value.description = description.value;
        }

        fileObject.value.category = fileCategory.value;

        if (props.newFile) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the File Element on the parent Submodel
                await postSubmodelElement(fileObject.value, props.parentElement.id);

                const newElementPath = props.parentElement.path + '/submodel-elements/' + fileObject.value.idShort;

                // Upload the file first if there is one
                if (fileElement.value !== undefined) {
                    await putAttachmentFile(fileElement.value, newElementPath);

                    // After file upload, fetch the updated SME and update only the contentType
                    const updatedSmeData = await fetchSme(newElementPath);
                    if (updatedSmeData) {
                        await parseAndUpdateSubmodelElement(
                            updatedSmeData,
                            fileElement.value,
                            contentType.value,
                            newElementPath
                        );
                    }
                }

                // Navigate to the new File Element
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

                // Create the File Element on the parent element
                await postSubmodelElement(fileObject.value, submodelId, idShortPath);

                const newElementPath = props.parentElement.path + '.' + fileObject.value.idShort;

                // Upload the file first if there is one
                if (fileElement.value !== undefined) {
                    await putAttachmentFile(fileElement.value, newElementPath);

                    // After file upload, fetch the updated SME and update only the contentType
                    const updatedSmeData = await fetchSme(newElementPath);
                    if (updatedSmeData) {
                        await parseAndUpdateSubmodelElement(
                            updatedSmeData,
                            fileElement.value,
                            contentType.value,
                            newElementPath
                        );
                    }
                }

                // Navigate to the new File Element
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
                console.error('File Element Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the File Element
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(fileObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + fileObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.file.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(fileObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(fileObject.value, props.file.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + fileObject.value.idShort);
                }
            }

            // Upload the file first if there is one
            if (fileElement.value !== undefined) {
                await putAttachmentFile(fileElement.value, props.path);

                // After file upload, fetch the updated SME and update only the contentType
                const updatedSmeData = await fetchSme(props.path);
                if (updatedSmeData) {
                    await parseAndUpdateSubmodelElement(
                        updatedSmeData,
                        fileElement.value,
                        contentType.value,
                        props.path,
                        props.parentElement,
                        props.file
                    );
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    async function parseAndUpdateSubmodelElement(
        updatedSmeData: any,
        fileElement: File,
        contentTypeValue: string,
        elementPath: string,
        parentElement?: any,
        file?: any
    ): Promise<void> {
        const updatedFileObject = { ...updatedSmeData };

        // remove unwanted properties
        delete updatedFileObject.id;
        delete updatedFileObject.timestamp;
        delete updatedFileObject.conceptDescriptions;
        delete updatedFileObject.path;

        updatedFileObject.contentType = determineContentType(fileElement, contentTypeValue);

        // Convert to core works File type
        const instanceOrError = jsonization.fileFromJsonable(updatedFileObject);

        if (instanceOrError.error === null) {
            const fileSME = instanceOrError.mustValue();

            // Handle different parent element types for edit case
            if (parentElement && file) {
                if (parentElement.modelType === 'Submodel') {
                    await putSubmodelElement(fileSME, elementPath);
                } else if (parentElement.modelType === 'SubmodelElementList') {
                    const index = parentElement.value.findIndex((el: any) => el.id === file.id);
                    const path = parentElement.path + `%5B${index}%5D`;
                    await putSubmodelElement(fileSME, path);
                } else {
                    // Submodel Element Collection or Entity
                    await putSubmodelElement(fileSME, file.path);
                }
            } else {
                // Simple case for new files
                await putSubmodelElement(fileSME, elementPath);
            }
        }
    }

    function closeDialog(): void {
        editFileDialog.value = false;
    }

    function handleFile(file: File | undefined): void {
        fileElement.value = file;
    }
</script>
