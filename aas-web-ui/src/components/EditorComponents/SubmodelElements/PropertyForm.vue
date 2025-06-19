<template>
    <v-dialog
        v-model="editPropertyDialog"
        width="860"
        persistent
        @keydown="keyDown"
        @keyup="keyUp($event, saveProperty)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ props.newProperty ? 'Create a new Property' : 'Edit Property' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput
                                v-model="propertyIdShort"
                                label="IdShort"
                                :error="hasError('idShort')"
                                :rules="[rules.required]"
                                :error-messages="getError('idShort')" />
                            <MultiLanguageTextInput
                                v-model="displayName"
                                :show-label="true"
                                label="Display Name"
                                type="displayName" />
                            <MultiLanguageTextInput
                                v-model="description"
                                :show-label="true"
                                label="Description"
                                type="description" />
                            <SelectInput
                                v-model="propertyCategory"
                                label="Category"
                                type="category"
                                :clearable="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- TODO: Value ID -->
                    <!-- Property Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <SelectInput v-model="valueType" label="Data Type" type="dataType" :clearable="true" />
                            <BooleanInput
                                v-if="valueTypeString === 'Boolean'"
                                v-model="propertyValue"
                                :label="propertyValue ? propertyValue : 'false'" />
                            <TextInput
                                v-else
                                v-model="propertyValue"
                                label="Value"
                                placeholder="Enter value"
                                :error-messages="propertyValueErrorMessage" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
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
                <v-btn color="primary" @click="saveProperty">Save</v-btn>
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
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newProperty: boolean;
        parentElement: any;
        path?: string;
        property?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editPropertyDialog = ref(false);
    const propertyObject = ref<aasTypes.Property | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const propertyIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const propertyCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const propertyValue = ref<string>('');
    const propertyValueErrorMessage = ref<string | null>(null);
    const valueType = ref<aasTypes.DataTypeDefXsd>(aasTypes.DataTypeDefXsd.String);

    const errors = ref<Map<string, string>>(new Map());

    const rules = {
        required: (value: any) => !!value || 'Required.',
    };

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editPropertyDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editPropertyDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    watch(
        () => valueType.value,
        () => {
            validateAndCorrectInput();
        }
    );

    watch(
        () => propertyValue.value,
        () => {
            validateAndCorrectInput();
        }
    );

    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const valueTypeString = computed(() => aasTypes.DataTypeDefXsd[valueType.value]);

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

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    function validateAndCorrectInput(): boolean {
        let regex = null;
        let match = null;

        if (propertyValue.value && propertyValue.value.length !== 0) {
            switch (valueTypeString.value) {
                case 'Decimal':
                    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    break;

                case 'Integer':
                case 'Int':
                case 'Long':
                case 'Short':
                case 'Byte':
                    if (!/^[+-]?\d+$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    if (valueTypeString.value === 'Int') {
                        const num = Number(propertyValue.value.trim());
                        if (num < -2147483648 || num > 2147483647) {
                            propertyValueErrorMessage.value =
                                valueTypeString.value + "' range: [-2147483648, 2147483647]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'Long') {
                        const num = BigInt(propertyValue.value.trim());
                        if (num < -9223372036854775808n || num > 9223372036854775807n) {
                            propertyValueErrorMessage.value =
                                valueTypeString.value + "' range: [-9223372036854775808n, 9223372036854775807n]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'Short') {
                        const num = Number(propertyValue.value.trim());
                        if (num < -32768 || num > 32767) {
                            propertyValueErrorMessage.value = valueTypeString.value + "' range: [-32768, 32767]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'Byte') {
                        const num = Number(propertyValue.value.trim());
                        if (num < -128 || num > 127) {
                            propertyValueErrorMessage.value = valueTypeString.value + "' range: [-128, 127]!";
                            return false;
                        }
                    }

                    break;

                case 'UnsignedInt':
                case 'UnsignedLong':
                case 'UnsignedShort':
                case 'UnsignedByte':
                    if (!/^\d+$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    if (valueTypeString.value === 'UnsignedInt') {
                        const num = Number(propertyValue.value.trim());
                        if (num < 0 || num > 4294967295) {
                            propertyValueErrorMessage.value = valueTypeString.value + "' range: [0, 4 294 967 295]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'UnsignedLong') {
                        const num = BigInt(propertyValue.value.trim());
                        if (num < 0n || num > 18446744073709551615n) {
                            propertyValueErrorMessage.value =
                                valueTypeString.value + "' range: [0, 18 446 744 073 709 551 615n]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'UnsignedShort') {
                        const num = Number(propertyValue.value.trim());
                        if (num < 0 || num > 65535) {
                            propertyValueErrorMessage.value = valueTypeString.value + "' range: [0, 65 535]!";
                            return false;
                        }
                    }

                    if (valueTypeString.value === 'UnsignedByte') {
                        const num = Number(propertyValue.value.trim());
                        if (num < 0 || num > 255) {
                            propertyValueErrorMessage.value = valueTypeString.value + "' range: [0, 255]!";
                            return false;
                        }
                    }

                    break;

                case 'PositiveInteger':
                    if (!/^\+?[1-9]\d*$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }
                    break;

                case 'NegativeInteger':
                    if (!/^-[1-9]\d*$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    break;

                case 'NonPositiveInteger':
                    if (!/^(0|-\d+)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }
                    break;

                case 'NonNegativeInteger':
                    if (!/^\+?(0|[1-9]\d*)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    break;

                case 'Double':
                    if (!/^[+-]?((\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?|INF|NaN)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    break;

                case 'Float':
                    if (!/^[+-]?((\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?|INF|NaN)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    break;

                case 'Boolean':
                    // Always use string representative of boolean value
                    if (typeof propertyValue.value === 'boolean')
                        propertyValue.value = propertyValue.value ? 'true' : 'false';

                    if (!/^(true|false|1|0)$/.test(propertyValue.value.trim())) {
                        propertyValueErrorMessage.value =
                            "Invalid '" + valueTypeString.value + "' value! [true, false, 0, 1]";
                        return false;
                    }

                    break;

                case 'Date':
                    regex = /^(-?\d{4,})-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/;
                    match = propertyValue.value.trim().match(regex);
                    if (!match) {
                        propertyValueErrorMessage.value =
                            "Invalid '" +
                            valueTypeString.value +
                            "' value! [YYYY-MM-DD] optional timezone (Z|[+-]PP:PP)";
                        return false;
                    }

                    if (Number(match[2]) < 1 || Number(match[2]) > 12) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' month range: [1, 12]!";
                        return false;
                    }

                    if (Number(match[3]) < 1 || Number(match[3]) > 31) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' day range: [1, 31]!";
                        return false;
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !==
                        Number(match[1])
                    ) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' invalid year " + Number(match[1]);
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !==
                        Number(match[2]) - 1
                    ) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' invalid month " + Number(match[2]);
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !==
                        Number(match[3])
                    ) {
                        propertyValueErrorMessage.value =
                            valueTypeString.value +
                            "' day " +
                            Number(match[3]) +
                            ' does not exist in month ' +
                            Number(match[2]) +
                            ' of ' +
                            Number(match[1]);
                    }

                    break;

                case 'Time':
                    regex = /^(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
                    match = propertyValue.value.trim().match(regex);

                    if (!match) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value! [HH:mm:ss]";
                        return false;
                    }

                    if (Number(match[1]) < 0 || Number(match[1]) > 23) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' hour range: [0, 23]!";
                        return false;
                    }

                    if (Number(match[2]) < 0 || Number(match[2]) > 59) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' minutes range: [0, 59]!";
                        return false;
                    }

                    if (Number(match[3]) < 0 || Number(match[3]) > 59) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' second range: [0, 59]!";
                        return false;
                    }

                    break;

                case 'DateTime':
                    regex = /^(-?\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
                    match = propertyValue.value.trim().match(regex);

                    if (!match) {
                        propertyValueErrorMessage.value = "Invalid '" + valueTypeString.value + "' value!";
                        return false;
                    }

                    if (Number(match[2]) < 1 || Number(match[2]) > 12) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' month range: [1, 12]!";
                        return false;
                    }

                    if (Number(match[3]) < 1 || Number(match[3]) > 31) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' day range: [1, 31]!";
                        return false;
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getFullYear() !==
                        Number(match[1])
                    ) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' invalid year " + Number(match[1]);
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getMonth() !==
                        Number(match[2]) - 1
                    ) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' invalid month " + Number(match[2]);
                    }

                    if (
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDate() !==
                        Number(match[3])
                    ) {
                        propertyValueErrorMessage.value =
                            valueTypeString.value +
                            "' day " +
                            Number(match[3]) +
                            ' does not exist in month ' +
                            Number(match[2]) +
                            ' of ' +
                            Number(match[1]);
                    }

                    if (Number(match[4]) < 0 || Number(match[4]) > 23) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' hour range: [0, 23]!";
                        return false;
                    }

                    if (Number(match[5]) < 0 || Number(match[5]) > 59) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' minutes range: [0, 59]!";
                        return false;
                    }

                    if (Number(match[6]) < 0 || Number(match[6]) > 59) {
                        propertyValueErrorMessage.value = valueTypeString.value + "' second range: [0, 59]!";
                        return false;
                    }

                    //TODO Check property value input regarding timezone of DateTime

                    break;

                //TODO Check property value input regarding AnyUri
                // case 'AnyUri':
                //TODO Check property value input regarding Base64Binary
                // case 'Base64Binary':
                //TODO Check property value input regarding Duration
                // case 'Duration':
                //TODO Check property value input regarding GDay
                // case 'GDay':
                //TODO Check property value input regarding GMonth
                // case 'GMonth':
                //TODO Check property value input regarding GMonthDay
                // case 'GMonthDay':
                //TODO Check property value input regarding GYear
                // case 'GYear':
                //TODO Check property value input regarding GYearMonth
                // case 'GYearMonth':
                //TODO Check property value input regarding HexBinary
                // case 'HexBinary':

                case 'String':
                default:
                    break;
            }
        }

        propertyValueErrorMessage.value = null;
        return true;
    }

    async function saveProperty(): Promise<void> {
        if (!validateAndCorrectInput()) {
            return;
        }

        if (props.newProperty || propertyObject.value === undefined) {
            propertyObject.value = new aasTypes.Property(valueType.value);
        }

        if (propertyIdShort.value !== null) {
            propertyObject.value.idShort = propertyIdShort.value;
        } else {
            errors.value.set('idShort', 'Property IdShort is required');
            return;
        }

        propertyObject.value.value = propertyValue.value;

        propertyObject.value.valueType = valueType.value;

        if (semanticId.value !== null) {
            propertyObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            propertyObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            propertyObject.value.description = description.value;
        }

        propertyObject.value.category = propertyCategory.value;

        if (props.newProperty) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the property on the parent Submodel
                await postSubmodelElement(propertyObject.value, props.parentElement.id);

                const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

                // Navigate to the new property
                router.push({
                    query: {
                        aas: aasEndpoint,
                        path: props.parentElement.path + '/submodel-elements/' + propertyObject.value.idShort,
                    },
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the property on the parent element
                await postSubmodelElement(propertyObject.value, submodelId, idShortPath);

                const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

                // Navigate to the new property
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    router.push({
                        query: {
                            aas: aasEndpoint,
                            path: props.parentElement.path + '.' + propertyObject.value.idShort,
                        },
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Property Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;
            const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

            // Update the property
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(propertyObject.value, props.path);

                if (editedElementSelected) {
                    router.push({
                        query: {
                            aas: aasEndpoint,
                            path: props.parentElement.path + '/submodel-elements/' + propertyObject.value.idShort,
                        },
                    });
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.property.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(propertyObject.value, path);

                if (editedElementSelected) {
                    router.push({
                        query: { aas: aasEndpoint, path: path },
                    });
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(propertyObject.value, props.property.path);

                if (editedElementSelected) {
                    router.push({
                        query: {
                            aas: aasEndpoint,
                            path: props.parentElement.path + '.' + propertyObject.value.idShort,
                        },
                    });
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editPropertyDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newProperty && props.property) {
            const propertyJSON = await fetchSme(props.property.path);
            const instanceOrError = jsonization.propertyFromJsonable(propertyJSON);

            if (instanceOrError.error !== null) {
                console.error('Error parsing Property: ', instanceOrError.error);
                return;
            }

            propertyObject.value = instanceOrError.mustValue();

            propertyIdShort.value = propertyObject.value.idShort;

            if (propertyObject.value.displayName) {
                displayName.value = propertyObject.value.displayName;
            }
            if (propertyObject.value.description) {
                description.value = propertyObject.value.description;
            }
            if (propertyObject.value.category) {
                propertyCategory.value = propertyObject.value.category;
            }
            if (propertyObject.value.value) {
                propertyValue.value = propertyObject.value.value;
            }
            if (propertyObject.value.valueType) {
                valueType.value = propertyObject.value.valueType;
            }
            if (propertyObject.value.semanticId) {
                semanticId.value = propertyObject.value.semanticId;
            }
            openPanels.value = [0, 1];
        } else {
            propertyIdShort.value = null;
            displayName.value = null;
            description.value = null;
            propertyCategory.value = null;
            propertyValue.value = '';
            valueType.value = aasTypes.DataTypeDefXsd.String;
            semanticId.value = null;
            openPanels.value = [0, 1];
        }
    }
</script>
